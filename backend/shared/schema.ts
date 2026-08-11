import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["student", "teacher"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["Present", "Late", "Absent"]);
export const moodEnum = pgEnum("mood", ["Happy", "Neutral", "Sad"]);
export const studentStatusEnum = pgEnum("student_status", ["active", "graduated"]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("student"),
  name: text("name").notNull(),
  rollNumber: text("roll_number"),        // students only
  classId: text("class_id"),             // students only
  status: studentStatusEnum("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Attendance Records ───────────────────────────────────────────────────────

export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),           // e.g. "Oct 24, 2023"
  time: text("time").notNull(),           // e.g. "08:45 AM"
  status: attendanceStatusEnum("status").notNull().default("Present"),
  location: text("location").notNull().default("VIEW Campus"),
  stressScore: integer("stress_score").notNull().default(0),   // 0-100
  mood: moodEnum("mood").notNull().default("Neutral"),
  understanding: integer("understanding").default(70),          // 0-100
  sleepiness: integer("sleepiness").default(30),                // 0-100
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
  rollNumber: true,
  classId: true,
});

export const insertAttendanceSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(["student", "teacher"]),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
