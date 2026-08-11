import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CalendarCheck2,
  ChevronLeft,
  Download,
  GraduationCap,
  History,
  LogOut,
  MapPin,
  Search,
  ShieldCheck,
  User,
  Users,
  BrainCircuit,
  Smile,
  Meh,
  Frown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
  BarChart,
  Bar,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAttendanceByClassApi, getAttendanceByDateApi, getCurrentUserApi, getStudentAttendanceApi, getStudentsApi } from "@/lib/api";
import { Progress } from "@/components/ui/progress";

type Student = {
  id: string;
  name: string;
  rollNumber: string;
  classId: string;
  status: "graduated" | "active";
};

type AttendanceRecord = {
  id: string;
  studentId: string;
  date: string;
  time: string;
  status: "Present" | "Late" | "Absent";
  location: string;
  stressScore: number;
  mood: "Happy" | "Neutral" | "Sad";
};

const classes = [
  // CSE
  { id: "CSE-1", label: "CSE 1st Year" }, { id: "CSE-2", label: "CSE 2nd Year" }, { id: "CSE-3", label: "CSE 3rd Year" }, { id: "CSE-4", label: "CSE 4th Year" },
  // CSD
  { id: "CSD-1", label: "CSD 1st Year" }, { id: "CSD-2", label: "CSD 2nd Year" }, { id: "CSD-3", label: "CSD 3rd Year" }, { id: "CSD-4", label: "CSD 4th Year" },
  // CSM
  { id: "CSM-1", label: "CSM 1st Year" }, { id: "CSM-2", label: "CSM 2nd Year" }, { id: "CSM-3", label: "CSM 3rd Year" }, { id: "CSM-4", label: "CSM 4th Year" },
  // CAI
  { id: "CAI-1", label: "CAI 1st Year" }, { id: "CAI-2", label: "CAI 2nd Year" }, { id: "CAI-3", label: "CAI 3rd Year" }, { id: "CAI-4", label: "CAI 4th Year" },
  // CSC
  { id: "CSC-1", label: "CSC 1st Year" }, { id: "CSC-2", label: "CSC 2nd Year" }, { id: "CSC-3", label: "CSC 3rd Year" }, { id: "CSC-4", label: "CSC 4th Year" },
  // IT
  { id: "IT-1", label: "IT 1st Year" }, { id: "IT-2", label: "IT 2nd Year" }, { id: "IT-3", label: "IT 3rd Year" }, { id: "IT-4", label: "IT 4th Year" },
  // ECE
  { id: "ECE-1", label: "ECE 1st Year" }, { id: "ECE-2", label: "ECE 2nd Year" }, { id: "ECE-3", label: "ECE 3rd Year" }, { id: "ECE-4", label: "ECE 4th Year" },
  // EEE
  { id: "EEE-1", label: "EEE 1st Year" }, { id: "EEE-2", label: "EEE 2nd Year" }, { id: "EEE-3", label: "EEE 3rd Year" }, { id: "EEE-4", label: "EEE 4th Year" },
  // MECH
  { id: "MECH-1", label: "MECH 1st Year" }, { id: "MECH-2", label: "MECH 2nd Year" }, { id: "MECH-3", label: "MECH 3rd Year" }, { id: "MECH-4", label: "MECH 4th Year" },
  // CIVIL
  { id: "CIVIL-1", label: "CIVIL 1st Year" }, { id: "CIVIL-2", label: "CIVIL 2nd Year" }, { id: "CIVIL-3", label: "CIVIL 3rd Year" }, { id: "CIVIL-4", label: "CIVIL 4th Year" },
];



export default function TeacherPage() {
  const [, setLocation] = useLocation();
  const [classId, setClassId] = useState(classes[0]?.id ?? "CSM-1");
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected student for detailed report
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUserApi();
        setCurrentUser(user);
      } catch (err) {
        console.error("User not logged in");
        setLocation("/login");
      }
    }

    loadUser();
  }, []);

  // Tab state
  const [activeTab, setActiveTab] = useState<"overview" | "reports">("overview");

  const deptData = useMemo(() => {
    const map: Record<string, { total: number; present: number }> = {};

    students.forEach(student => {
      const dept = student.classId.split("-")[0];

      if (!map[dept]) {
        map[dept] = { total: 0, present: 0 };
      }

      map[dept].total++;

      const record = attendance.find(
        a =>
          a.studentId === student.id &&
          new Date(a.date).toDateString() ===
          new Date(dateFilter).toDateString()
      );

      if (record?.status === "Present") {
        map[dept].present++;
      }
    });

    return Object.entries(map).map(([dept, val]) => ({
      dept,
      val: Math.round((val.present / val.total) * 100) || 0,
    }));
  }, [students, attendance, dateFilter]);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const formattedDate = formatDate(dateFilter);

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoading(true);
        const data = await getStudentsApi(classId);
        setStudents(data);
      } catch {
        console.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, [classId]);

  useEffect(() => {
    async function loadAttendance() {
      try {
        const data = await getAttendanceByClassApi(classId);
        setAttendance(data);
      } catch {
        console.error("Failed to load attendance");
      }
    }

    if (classId === "ALL") return;

    loadAttendance(); // ✅ IMPORTANT
  }, [classId]);

  // Derived state for the main list
  const filteredStudents = useMemo(() => {
    let result = students;

    // Filter by class
    if (classId !== "ALL") {
      result = result.filter(s => s.classId === classId);
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.rollNumber || "").toLowerCase().includes(q)
      );
    }

    // Sort by roll number ascending
    return [...result].sort((a, b) =>
      (a.rollNumber || "").localeCompare(b.rollNumber || "")
    );
  }, [students, classId, searchQuery]);

  const studentWithLatestAttendance = useMemo(() => {
    return filteredStudents.map(student => {
      // Find attendance for selected date
      const record = attendance.find(
        a => a.studentId === student.id && new Date(a.date).toDateString() === new Date(dateFilter).toDateString()
      );
      return { student, record };
    });
  }, [filteredStudents, attendance, dateFilter]);

  // Derived state for the selected student report
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find(s => s.id === selectedStudentId) || null;
  }, [selectedStudentId]);

  const [studentHistory, setStudentHistory] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (!selectedStudentId) return;

    async function loadStudentHistory() {
      try {
        const data = await getStudentAttendanceApi(selectedStudentId);
        setStudentHistory(data);
      } catch {
        console.error("Failed to load student history");
      }
    }

    loadStudentHistory();
  }, [selectedStudentId]);

  // Student trend data for charts
  const studentChartData = useMemo(() => {
    if (!selectedStudentId) return [];
    return [...studentHistory].reverse().map(record => ({
      date: new Date(record.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }), // 24, // mm-dd format
      stress: record.stressScore,
      mood: record.mood,
    }));
  }, [studentHistory]);

  const moodData = useMemo(() => {
    if (!selectedStudentId) return [];
    let happy = 0, neutral = 0, sad = 0;
    studentHistory.forEach(record => {
      if (record.mood === 'Happy') happy++;
      else if (record.mood === 'Neutral') neutral++;
      else if (record.mood === 'Sad') sad++;
    });
    return [
      { name: 'Happy', count: happy, fill: '#10b981' }, // Emerald
      { name: 'Neutral', count: neutral, fill: '#3b82f6' }, // Blue
      { name: 'Sad', count: sad, fill: '#f43f5e' }, // Rose
    ];
  }, [studentHistory]);

  const totalStudents = students.length;

  const avgAttendance = useMemo(() => {
    if (!students.length) return 0;

    const present = attendance.filter(a => a.status === "Present").length;

    return ((present / students.length) * 100).toFixed(1);
  }, [attendance, students]);

  const avgStress = useMemo(() => {
    if (!attendance.length) return 0;

    const total = attendance.reduce((sum, a) => sum + a.stressScore, 0);
    return Math.round(total / attendance.length);
  }, [attendance]);

  // If a student is selected, show the Student Report View
  if (selectedStudent) {
    return (
      <div className="min-h-screen bg-background">
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedStudentId(null)}>
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <BrainCircuit className="size-5 text-primary" />
              <span className="font-semibold hidden sm:inline">Teacher Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Download className="mr-2 size-4" /> Export Report PDF
            </Button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <button onClick={() => setSelectedStudentId(null)} className="hover:text-foreground">Students</button>
                <ChevronLeft className="size-3" />
                <span>Report</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Student Report</h1>
            </div>
            <Button className="sm:hidden w-full">
              <Download className="mr-2 size-4" /> Export PDF
            </Button>
          </div>

          {/* Student Info Card */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="size-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <User className="size-10" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold">{selectedStudent.name}</h2>
                  <Badge variant={selectedStudent.status === 'active' ? 'default' : 'secondary'}>
                    {selectedStudent.status === 'active' ? 'Active' : 'Graduated'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <History className="size-4" />
                    <span>Roll No: <strong>{selectedStudent.rollNumber}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="size-4" />
                    <span>Class: <strong>{classes.find(c => c.id === selectedStudent.classId)?.label || selectedStudent.classId}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-auto">
              <TabsTrigger value="history">Attendance History</TabsTrigger>
              <TabsTrigger value="wellbeing">Wellbeing Analysis</TabsTrigger>
            </TabsList>

            {/* History Tab */}
            <TabsContent value="history" className="mt-6 space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 size-4" /> Export CSV
                </Button>
              </div>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Photo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Stress Score</TableHead>
                        <TableHead>Mood</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="font-medium">{record.date}</div>
                            <div className="text-xs text-muted-foreground">{record.time}</div>
                          </TableCell>
                          <TableCell>
                            <div className="size-8 rounded bg-muted flex items-center justify-center border">
                              <User className="size-3.5 text-muted-foreground" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={record.status === 'Present' ? 'default' : record.status === 'Late' ? 'secondary' : 'destructive'}
                              className={record.status === 'Present' ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20' :
                                record.status === 'Late' ? 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20' : ''}>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <MapPin className="size-3" />
                              {record.location}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{record.stressScore}</span>
                              <Progress value={record.stressScore} className="h-1.5 w-16" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {record.mood === 'Happy' && <Smile className="size-4 text-emerald-500" />}
                              {record.mood === 'Neutral' && <Meh className="size-4 text-blue-500" />}
                              {record.mood === 'Sad' && <Frown className="size-4 text-rose-500" />}
                              <span className="text-sm">{record.mood}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {studentHistory.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            No attendance records found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            {/* Wellbeing Tab */}
            <TabsContent value="wellbeing" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-5">
                  <h3 className="font-semibold mb-6 flex items-center gap-2">
                    <Activity className="size-4 text-primary" />
                    Stress Trend (Last 7 Days)
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={studentChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="stress" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: "#0ea5e9" }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="font-semibold mb-6 flex items-center gap-2">
                    <Smile className="size-4 text-primary" />
                    Mood Distribution
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={moodData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  // Main Teacher Dashboard View
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <BrainCircuit className="size-5" />
          </div>
          <span className="font-semibold tracking-tight text-foreground">VIEW(A) Admin</span>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${activeTab === "overview" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Users className="size-4" />
              Class Overview
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${activeTab === "reports" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              <BarChart3 className="size-4" />
              College Reports
            </button>
          </nav>
        </div>

        <div className="border-t p-4">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="grid size-9 place-items-center rounded-full bg-muted">
              <GraduationCap className="size-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-medium">
                {currentUser?.name || "Loading..."}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {currentUser?.role || ""}
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start" onClick={() => setLocation("/login")}>
            <LogOut className="mr-2 size-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 lg:pl-64">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <BrainCircuit className="size-5 text-primary" />
            <span className="font-semibold">VIEW(A) Admin</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setLocation("/login")}>
            <LogOut className="size-5" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
          {activeTab === "overview" ? (
            <>
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Class Overview</h1>
                <p className="text-muted-foreground">Monitor attendance and student wellbeing across all departments.</p>
              </div>

              {/* Filters */}
              <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="space-y-2 w-full md:w-auto flex-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department & Year</label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="ALL">All Classes</option>
                      <optgroup label="Computer Science (CSE)">
                        {classes.filter(c => c.id.startsWith("CSE")).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </optgroup>
                      <optgroup label="Data Science (CSD)">
                        {classes.filter(c => c.id.startsWith("CSD")).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </optgroup>
                      <optgroup label="AI & ML (CSM)">
                        {classes.filter(c => c.id.startsWith("CSM")).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </optgroup>
                      <optgroup label="AI (CAI)">
                        {classes.filter(c => c.id.startsWith("CAI")).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </optgroup>
                      <optgroup label="Cyber Security (CSC)">
                        {classes.filter(c => c.id.startsWith("CSC")).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </optgroup>
                      <optgroup label="Information Tech (IT)">
                        {classes.filter(c => c.id.startsWith("IT")).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </optgroup>
                      <optgroup label="Electronics (ECE)">
                        {classes.filter(c => c.id.startsWith("ECE")).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </optgroup>
                      <optgroup label="Electrical (EEE)">
                        {classes.filter(c => c.id.startsWith("EEE")).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </optgroup>
                      <optgroup label="Mechanical (MECH)">
                        {classes.filter(c => c.id.startsWith("MECH")).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </optgroup>
                      <optgroup label="Civil (CIVIL)">
                        {classes.filter(c => c.id.startsWith("CIVIL")).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </optgroup>
                    </select>
                  </div>

                  <div className="space-y-2 w-full md:w-auto">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="pl-9 w-full md:w-[180px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 w-full md:w-auto flex-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or roll number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-full"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Student Table */}
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[120px]">Roll Number</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status on {dateFilter}</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentWithLatestAttendance.map(({ student, record }) => (
                        <TableRow
                          key={student.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedStudentId(student.id)}
                        >
                          <TableCell className="font-mono text-sm font-medium">{student.rollNumber}</TableCell>
                          <TableCell className="font-medium">
                            {student.name}
                            {student.status === 'graduated' && <Badge variant="secondary" className="ml-2 text-[10px]">Graduated</Badge>}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {classes.find(c => c.id === student.classId)?.label || student.classId}
                          </TableCell>
                          <TableCell>
                            {record ? (
                              <Badge variant={record.status === 'Present' ? 'default' : record.status === 'Late' ? 'secondary' : 'destructive'}
                                className={record.status === 'Present' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200' :
                                  record.status === 'Late' ? 'bg-amber-500/10 text-amber-700 border-amber-200' : ''}>
                                {record.status}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">No record</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                              View Report <ArrowUpRight className="ml-1 size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {studentWithLatestAttendance.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                            No students found matching your filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="bg-muted/30 border-t p-4 flex items-center justify-between text-sm text-muted-foreground">
                  <div>Showing {studentWithLatestAttendance.length} students</div>
                  <div>Students automatically advance years in the academic cycle.</div>
                </div>
              </Card>
            </>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">College Reports</h1>
                <p className="text-muted-foreground">Comprehensive insights into college-wide attendance and student wellbeing.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="size-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                      <h3 className="text-3xl font-bold">{totalStudents}</h3>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <ShieldCheck className="size-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Average Attendance</p>
                      <h3 className="text-3xl font-bold">{avgAttendance}%</h3>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Smile className="size-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Wellbeing Score</p>
                      <h3 className="text-3xl font-bold">{avgStress}/100</h3>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-lg">Department Attendance Comparison</h3>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 size-4" /> Export Data
                  </Button>
                </div>
                <div className="h-[300px] w-full flex items-end justify-between px-4">
                  {/* Mock bar chart for visual representation */}
                  {deptData.map((data, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer w-full max-w-[40px]">
                      <div className="w-full bg-primary/20 rounded-t-md relative flex items-end justify-center h-[200px]">
                        <div
                          className="w-full bg-primary rounded-t-md transition-all duration-300 group-hover:bg-primary/80"
                          style={{ height: `${data.val}%` }}
                        ></div>
                        <span className="absolute -top-6 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          {data.val}%
                        </span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{data.dept}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
