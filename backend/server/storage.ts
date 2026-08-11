import { eq, and, desc } from "drizzle-orm";
import { db as _db } from "./db.js";

// db may be null if no DATABASE_URL is set — storage selection below handles this
const db = _db!;
import {
  users,
  attendanceRecords,
  type User,
  type InsertUser,
  type AttendanceRecord,
  type InsertAttendance,
} from "../shared/schema.js";
import { randomUUID } from "crypto";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getStudentsByClass(classId: string): Promise<User[]>;
  getAllStudents(): Promise<User[]>;

  // Attendance
  createAttendanceRecord(record: InsertAttendance): Promise<AttendanceRecord>;
  getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]>;
  getAttendanceByClass(classId: string): Promise<AttendanceRecord[]>;
  getAttendanceByDate(date: string): Promise<AttendanceRecord[]>;
  getTodayAttendanceForStudent(studentId: string, date: string): Promise<AttendanceRecord | undefined>;
}

// ─── PostgreSQL Implementation ────────────────────────────────────────────────

export class PostgresStorage implements IStorage {
  // ── Users ──────────────────────────────────────────────────────────────────

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getStudentsByClass(classId: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(and(eq(users.classId, classId), eq(users.role, "student")));
  }

  async getAllStudents(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "student"));
  }

  // ── Attendance ─────────────────────────────────────────────────────────────

  async createAttendanceRecord(record: InsertAttendance): Promise<AttendanceRecord> {
    const [attendance] = await db.insert(attendanceRecords).values(record).returning();
    return attendance;
  }

  async getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]> {
    return db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.studentId, studentId))
      .orderBy(desc(attendanceRecords.createdAt));
  }

  async getAttendanceByClass(classId: string): Promise<AttendanceRecord[]> {
    // Join with users to filter by class
    return db
      .select({
        id: attendanceRecords.id,
        studentId: attendanceRecords.studentId,
        date: attendanceRecords.date,
        time: attendanceRecords.time,
        status: attendanceRecords.status,
        location: attendanceRecords.location,
        stressScore: attendanceRecords.stressScore,
        mood: attendanceRecords.mood,
        understanding: attendanceRecords.understanding,
        sleepiness: attendanceRecords.sleepiness,
        photoUrl: attendanceRecords.photoUrl,
        createdAt: attendanceRecords.createdAt,
      })
      .from(attendanceRecords)
      .innerJoin(users, eq(attendanceRecords.studentId, users.id))
      .where(eq(users.classId, classId))
      .orderBy(desc(attendanceRecords.createdAt));
  }

  async getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
    return db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.date, date))
      .orderBy(desc(attendanceRecords.createdAt));
  }

  async getTodayAttendanceForStudent(
    studentId: string,
    date: string
  ): Promise<AttendanceRecord | undefined> {
    const [record] = await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.studentId, studentId),
          eq(attendanceRecords.date, date)
        )
      );
    return record;
  }
}

// ─── Fallback In-Memory Storage (for local dev without DB) ────────────────────

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private attendance: Map<string, AttendanceRecord> = new Map();

  async getUser(id: string) { return this.users.get(id); }
  async getUserByUsername(username: string) {
    return Array.from(this.users.values()).find(u => u.username === username);
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user = {
  id,
  ...insertUser,
  rollNumber: insertUser.rollNumber ?? null,
  classId: insertUser.classId ?? null,
  status: "active",
  createdAt: new Date(),
} as User;
    this.users.set(id, user);
    return user;
  }
  async getStudentsByClass(classId: string) {
    return Array.from(this.users.values()).filter(u => u.classId === classId && u.role === "student");
  }
  async getAllStudents() {
    return Array.from(this.users.values()).filter(u => u.role === "student");
  }
  async createAttendanceRecord(record: InsertAttendance): Promise<AttendanceRecord> {
    const id = randomUUID();
    const att: AttendanceRecord = {
      id,
      studentId: record.studentId,
      date: record.date,
      time: record.time,
      status: record.status ?? "Present",
      location: record.location ?? "VIEW Campus",
      stressScore: record.stressScore ?? 0,
      mood: record.mood ?? "Neutral",
      understanding: record.understanding ?? 70,
      sleepiness: record.sleepiness ?? 30,
      photoUrl: record.photoUrl ?? null,
      createdAt: new Date(),
    };
    this.attendance.set(id, att);
    return att;
  }
  async getAttendanceByStudent(studentId: string) {
    return Array.from(this.attendance.values()).filter(a => a.studentId === studentId);
  }
  async getAttendanceByClass(classId: string) {
    const classStudentIds = new Set(
      Array.from(this.users.values())
        .filter(u => u.classId === classId)
        .map(u => u.id)
    );
    return Array.from(this.attendance.values()).filter(a => classStudentIds.has(a.studentId));
  }
  async getAttendanceByDate(date: string) {
    return Array.from(this.attendance.values()).filter(a => a.date === date);
  }
  async getTodayAttendanceForStudent(studentId: string, date: string) {
    return Array.from(this.attendance.values()).find(
      a => a.studentId === studentId && a.date === date
    );
  }
}

// Export the right storage based on environment
import { db as _dbCheck } from "./db.js";
export const storage: IStorage = _dbCheck
  ? new PostgresStorage()
  : new MemStorage();
