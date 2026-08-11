import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { storage } from "./storage.js";
import { requireAuth, requireRole } from "./auth.js";
import { insertUserSchema, insertAttendanceSchema, loginSchema } from "../shared/schema.js";
import { z } from "zod";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ──────────────────────────────────────────────────────────────────────────
  //  AUTH ROUTES
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * POST /api/auth/register
   * Register a new student or teacher account.
   * Body: { username, password, role, name, rollNumber?, classId? }
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);

      // Check duplicate username
      const existing = await storage.getUserByUsername(data.username);
      if (existing) {
        return res.status(409).json({ message: "Username already taken" });
      }

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({ ...data, password: hashedPassword });

      // Auto-login after register
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userName = user.name;

      const { password: _, ...safeUser } = user;
      return res.status(201).json({ user: safeUser });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: err.errors });
      }
      console.error("Register error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  /**
   * POST /api/auth/login
   * Body: { username, password, role }
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password, role } = loginSchema.parse(req.body);

      const user = await storage.getUserByUsername(username);
      const passwordValid = user ? await bcrypt.compare(password, user.password) : false;
      if (!user || !passwordValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      if (user.role !== role) {
        return res.status(401).json({ message: `Account is not a ${role} account` });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userName = user.name;

      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: err.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  /**
   * POST /api/auth/logout
   */
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  /**
   * GET /api/auth/me
   * Returns the currently logged-in user.
   */
  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password: _, ...safeUser } = user;
    return res.json({ user: safeUser });
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  STUDENT ROUTES
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * POST /api/attendance
   * Mark attendance + submit wellbeing data.
   * Body: { date, time, status, location, stressScore, mood, understanding, sleepiness, photoUrl? }
   */
  app.post("/api/attendance", requireRole("student"), async (req: Request, res: Response) => {
    try {
      const studentId = req.session.userId!;

      // Format today's date
      const today = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      // Prevent double-marking on same day
      const existing = await storage.getTodayAttendanceForStudent(studentId, today);
      if (existing) {
        return res.status(409).json({ message: "Attendance already marked for today" });
      }

      const record = insertAttendanceSchema.parse({
        ...req.body,
        studentId,
        date: today,
      });

      const attendance = await storage.createAttendanceRecord(record);
      return res.status(201).json({ attendance });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: err.errors });
      }
      console.error("Attendance error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  /**
   * GET /api/attendance/my
   * Get the current student's full attendance history.
   */
  app.get("/api/attendance/my", requireRole("student"), async (req: Request, res: Response) => {
    const records = await storage.getAttendanceByStudent(req.session.userId!);
    return res.json({ records });
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  TEACHER ROUTES
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/students
   * Get all students (optionally filter by classId).
   * Query: ?classId=CSE-1
   */
  app.get("/api/students", requireRole("teacher"), async (req: Request, res: Response) => {
    const { classId } = req.query;

    let students;
    if (classId && typeof classId === "string") {
      students = await storage.getStudentsByClass(classId);
    } else {
      students = await storage.getAllStudents();
    }

    // Remove passwords
    const safeStudents = students.map(({ password: _, ...s }) => s);
    return res.json({ students: safeStudents });
  });

  /**
   * GET /api/attendance/class/:classId
   * Get all attendance records for a class.
   */
  app.get("/api/attendance/class/:classId", requireRole("teacher"), async (req: Request, res: Response) => {
    const { classId } = req.params;
    const records = await storage.getAttendanceByClass(classId);
    return res.json({ records });
  });

  /**
   * GET /api/attendance/student/:studentId
   * Get attendance history for a specific student (teacher view).
   */
  app.get("/api/attendance/student/:studentId", requireRole("teacher"), async (req: Request, res: Response) => {
    const { studentId } = req.params;
    const records = await storage.getAttendanceByStudent(studentId);
    return res.json({ records });
  });

  /**
   * GET /api/attendance/date/:date
   * Get all attendance for a specific date.
   * e.g. GET /api/attendance/date/Oct%2024%2C%202023
   */
  app.get("/api/attendance/date/:date", requireRole("teacher"), async (req: Request, res: Response) => {
    const { date } = req.params;
    const records = await storage.getAttendanceByDate(decodeURIComponent(date));
    return res.json({ records });
  });

  return httpServer;
}
