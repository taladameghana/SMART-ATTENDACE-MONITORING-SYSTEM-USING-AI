const API_BASE = "/api";

export async function loginApi(data: {
    username: string;
    password: string;
    role: string;
}) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
        throw new Error(result.message || "Login failed");
    }

    return result;
}

export async function registerApi(data: {
    username: string;
    password: string;
    role: string;
    name: string;
    classId?: string;
}) {
    const res = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
        throw new Error(result.message || "Registration failed");
    }

    return result;
}

export async function logoutApi() {
    const res = await fetch(`/api/auth/logout`, {
        method: "POST",
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error("Logout failed");
    }

    return data;
}

export async function getMe() {
    const res = await fetch(`/api/auth/me`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        return null;
    }

    return res.json();
}

const BASE = "/api";

// 🔹 Mark attendance
export async function markAttendanceApi(data: any) {
    const res = await fetch(`${BASE}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    return result;
}

// 🔹 Get my history
export async function getMyAttendanceApi() {
    const res = await fetch(`${BASE}/attendance/my`, {
        credentials: "include",
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    return result.records;
}

const BASE_URL = "/api";

// ✅ Get students
export async function getStudentsApi(classId?: string) {
    const res = await fetch(
        `${BASE_URL}/students${classId && classId !== "ALL" ? `?classId=${classId}` : ""}`,
        { credentials: "include" }
    );

    if (!res.ok) throw new Error("Failed to fetch students");
    const data = await res.json();
    return data.students;
}

// ✅ Get attendance by class
export async function getAttendanceByClassApi(classId: string) {
    const res = await fetch(`/api/attendance/class/${classId}`, {
        credentials: "include",
    });

    const data = await res.json();
    return data.records || [];
}

// ✅ Get attendance by student
export async function getStudentAttendanceApi(studentId: string) {
    const res = await fetch(`${BASE_URL}/attendance/student/${studentId}`, {
        credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch student history");
    const data = await res.json();
    return data.records;
}

// ✅ Get attendance by date
export async function getAttendanceByDateApi(date: string) {
    const res = await fetch(
        `${BASE_URL}/attendance/date/${encodeURIComponent(date)}`,
        { credentials: "include" }
    );

    if (!res.ok) throw new Error("Failed to fetch attendance by date");
    const data = await res.json();
    return data.records;
}

export async function getCurrentUserApi() {
    const res = await fetch(`/api/auth/me`, {
        credentials: "include",
    });

    if (!res.ok) throw new Error("Not authenticated");

    const data = await res.json();
    return data.user;
}