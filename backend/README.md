# 🗄️ Wellbeing Tracker — Backend Integration Guide

This folder contains everything needed to connect your Wellbeing Tracker frontend to a real PostgreSQL database.

---

## 📁 What's Inside

```
wellbeing-backend/
├── server/
│   ├── index.ts        ← Updated server (adds sessions)
│   ├── db.ts           ← PostgreSQL connection via Drizzle ORM
│   ├── storage.ts      ← Full CRUD layer (Postgres + Memory fallback)
│   ├── routes.ts       ← All API endpoints
│   └── auth.ts         ← Session-based auth middleware
├── shared/
│   └── schema.ts       ← Updated DB schema (users + attendance)
├── migrations/
│   └── 0001_initial.sql ← Run this SQL to create all tables
├── client_api/
│   └── api.ts          ← Drop this in client/src/lib/ to call the backend
├── drizzle.config.ts   ← Drizzle ORM config
└── .env.example        ← Copy to .env and fill in your DB URL
```

---

## 🚀 Step-by-Step Setup

### Step 1 — Set Up PostgreSQL

**Option A: Local PostgreSQL**
1. Install PostgreSQL: https://www.postgresql.org/download/
2. Open pgAdmin or psql and run:
   ```sql
   CREATE DATABASE wellbeing_tracker;
   ```

**Option B: Free Cloud PostgreSQL**
- [Neon](https://neon.tech) — free serverless Postgres (recommended)
- [Supabase](https://supabase.com) — free tier with dashboard
- [Railway](https://railway.app) — easy deployment

---

### Step 2 — Create Your .env File

In your project root, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then edit `.env`:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/wellbeing_tracker
SESSION_SECRET=some-long-random-string-here
PORT=5000
```

> **For Neon/Supabase:** They give you a connection string directly on sign-up. Paste it as DATABASE_URL.

---

### Step 3 — Create Database Tables

**Option A: Auto (Drizzle push)**
```bash
npm run db:push
```
This reads `shared/schema.ts` and creates all tables automatically.

**Option B: Manual SQL**
Open your database and run the contents of `migrations/0001_initial.sql`.

---

### Step 4 — Copy Backend Files Into Your Project

Copy these files **over** the existing ones in your project:

| Source (this folder)          | Destination (your project)     |
|-------------------------------|--------------------------------|
| `server/index.ts`             | `server/index.ts`              |
| `server/db.ts`                | `server/db.ts` *(new)*         |
| `server/storage.ts`           | `server/storage.ts`            |
| `server/routes.ts`            | `server/routes.ts`             |
| `server/auth.ts`              | `server/auth.ts` *(new)*       |
| `shared/schema.ts`            | `shared/schema.ts`             |
| `drizzle.config.ts`           | `drizzle.config.ts`            |
| `client_api/api.ts`           | `client/src/lib/api.ts`        |

---

### Step 5 — Install New Dependencies

Run in your project root:

```bash
npm install express-session @types/express-session
```

> All other dependencies (drizzle-orm, pg, etc.) are already in your package.json.

---

### Step 6 — Update the Login Page

In `client/src/pages/login.tsx`, replace the button's onClick with a real API call.

Find this code (around line 150):
```tsx
onClick={() => {
  setLocation(role === "teacher" ? "/teacher" : "/student");
}}
```

Replace with:
```tsx
onClick={async () => {
  try {
    setLoading(true);
    const { user } = await auth.login(username, password, role);
    // Store user in state/context if needed
    setLocation(role === "teacher" ? "/teacher" : "/student");
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}}
```

Add imports at top of login.tsx:
```tsx
import { auth } from "@/lib/api";
```

---

### Step 7 — Update the Student Page

In `client/src/pages/student.tsx`, replace the dummy `historyData` array.

Add this near the top of `StudentPage()`:
```tsx
import { student } from "@/lib/api";

// Inside the component:
const [historyData, setHistoryData] = useState([]);

useEffect(() => {
  student.getHistory().then(({ records }) => setHistoryData(records));
}, []);
```

When submitting attendance (the "Mark Attendance" button), call:
```tsx
await student.markAttendance({
  time: new Date().toLocaleTimeString(),
  status: "Present",
  location: "VIEW Campus",
  stressScore: stress,
  mood,
  understanding,
  sleepiness,
});
```

---

### Step 8 — Update the Teacher Page

In `client/src/pages/teacher.tsx`, replace dummy student/attendance data:

```tsx
import { teacher } from "@/lib/api";

// Inside the component:
const [students, setStudents] = useState([]);
const [records, setRecords] = useState([]);

useEffect(() => {
  if (selectedClass) {
    teacher.getStudents(selectedClass).then(({ students }) => setStudents(students));
    teacher.getClassAttendance(selectedClass).then(({ records }) => setRecords(records));
  }
}, [selectedClass]);
```

---

### Step 9 — Run the App

```bash
npm run dev
```

Your app should now be connected to the real database!

---

## 📡 API Endpoints Reference

| Method | Endpoint                              | Auth      | Description                        |
|--------|---------------------------------------|-----------|------------------------------------|
| POST   | `/api/auth/register`                  | None      | Create account                     |
| POST   | `/api/auth/login`                     | None      | Log in                             |
| POST   | `/api/auth/logout`                    | Required  | Log out                            |
| GET    | `/api/auth/me`                        | Required  | Get current user                   |
| POST   | `/api/attendance`                     | Student   | Mark attendance + wellbeing        |
| GET    | `/api/attendance/my`                  | Student   | My attendance history              |
| GET    | `/api/students?classId=CSE-1`         | Teacher   | Get students (filter by class)     |
| GET    | `/api/attendance/class/:classId`      | Teacher   | Attendance for a class             |
| GET    | `/api/attendance/student/:studentId`  | Teacher   | Attendance for one student         |
| GET    | `/api/attendance/date/:date`          | Teacher   | Attendance for a specific date     |

---

## 🔒 Security Notes for Production

1. **Hash passwords** — install `bcrypt` and hash before storing:
   ```bash
   npm install bcrypt @types/bcrypt
   ```
   Replace `user.password !== password` with `await bcrypt.compare(password, user.password)`

2. **Change SESSION_SECRET** to a long random string

3. **Set `cookie.secure: true`** (already done when NODE_ENV=production)

4. **Use environment variables** — never commit `.env` to git

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| `DATABASE_URL is required` | Create `.env` file with your DB URL |
| `Connection refused` | Make sure PostgreSQL is running |
| `relation "users" does not exist` | Run `npm run db:push` or the SQL migration |
| `401 Not authenticated` | You need to login first — session expired |
| `409 Attendance already marked` | Can only mark once per day |
