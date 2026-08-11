-- Wellbeing Tracker - Initial Database Migration
-- Run this in your PostgreSQL database OR use: npm run db:push

-- Create custom types (enums)
CREATE TYPE role AS ENUM ('student', 'teacher');
CREATE TYPE attendance_status AS ENUM ('Present', 'Late', 'Absent');
CREATE TYPE mood AS ENUM ('Happy', 'Neutral', 'Sad');
CREATE TYPE student_status AS ENUM ('active', 'graduated');

-- Users table (students + teachers)
CREATE TABLE IF NOT EXISTS users (
  id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username    TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  role        role NOT NULL DEFAULT 'student',
  name        TEXT NOT NULL,
  roll_number TEXT,
  class_id    TEXT,
  status      student_status DEFAULT 'active',
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance_records (
  id            VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,
  time          TEXT NOT NULL,
  status        attendance_status NOT NULL DEFAULT 'Present',
  location      TEXT NOT NULL DEFAULT 'VIEW Campus',
  stress_score  INTEGER NOT NULL DEFAULT 0,
  mood          mood NOT NULL DEFAULT 'Neutral',
  understanding INTEGER DEFAULT 70,
  sleepiness    INTEGER DEFAULT 30,
  photo_url     TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_users_class_id ON users(class_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Optional: Seed a test teacher account (password: teacher123)
-- INSERT INTO users (username, password, role, name)
-- VALUES ('teacher', 'teacher123', 'teacher', 'Demo Teacher')
-- ON CONFLICT (username) DO NOTHING;
