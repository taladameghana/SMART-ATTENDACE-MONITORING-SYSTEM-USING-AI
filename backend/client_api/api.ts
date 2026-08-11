// client/src/lib/api.ts
// Replace the dummy data in student.tsx and teacher.tsx with these API calls

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  login: (username: string, password: string, role: "student" | "teacher") =>
    request<{ user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, role }),
    }),

  register: (data: {
    username: string;
    password: string;
    role: "student" | "teacher";
    name: string;
    rollNumber?: string;
    classId?: string;
  }) =>
    request<{ user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<{ message: string }>("/auth/logout", { method: "POST" }),

  me: () => request<{ user: any }>("/auth/me"),
};

// ─── Student ──────────────────────────────────────────────────────────────────

export const student = {
  markAttendance: (data: {
    time: string;
    status: "Present" | "Late";
    location: string;
    stressScore: number;
    mood: "Happy" | "Neutral" | "Sad";
    understanding: number;
    sleepiness: number;
    photoUrl?: string;
  }) =>
    request<{ attendance: any }>("/attendance", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getHistory: () => request<{ records: any[] }>("/attendance/my"),
};

// ─── Teacher ──────────────────────────────────────────────────────────────────

export const teacher = {
  getStudents: (classId?: string) => {
    const query = classId ? `?classId=${encodeURIComponent(classId)}` : "";
    return request<{ students: any[] }>(`/students${query}`);
  },

  getClassAttendance: (classId: string) =>
    request<{ records: any[] }>(`/attendance/class/${encodeURIComponent(classId)}`),

  getStudentAttendance: (studentId: string) =>
    request<{ records: any[] }>(`/attendance/student/${studentId}`),

  getAttendanceByDate: (date: string) =>
    request<{ records: any[] }>(`/attendance/date/${encodeURIComponent(date)}`),
};
