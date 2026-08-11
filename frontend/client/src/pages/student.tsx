import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Flame,
  Loader2,
  LogOut,
  ShieldCheck,
  History,
  MapPin,
  CalendarCheck,
  User,
  BrainCircuit,
  Smile,
  Meh,
  Frown,
  Activity
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { getMyAttendanceApi, logoutApi, markAttendanceApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type AttendanceStatus = "idle" | "requesting" | "ready" | "capturing" | "success" | "denied";
type LocationStatus = "checking" | "inside" | "outside" | "error";

// Haversine formula to calculate distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth's radius in meters
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

const VIEW_LAT = 17.7296;
const VIEW_LON = 83.3070;
const MAX_DISTANCE_METERS = 20000;

// Dummy History Data

export default function StudentPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"attendance" | "history">("attendance");

  // Attendance State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const { setUser } = useAuth();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading]);

  // Location
  const [locStatus, setLocStatus] = useState<LocationStatus>("checking");
  const [userLoc, setUserLoc] = useState<{ lat: number, lon: number } | null>(null);
  const [distMeters, setDistMeters] = useState<number | null>(null);

  // Camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camStatus, setCamStatus] = useState<AttendanceStatus>("idle");
  const [confidence, setConfidence] = useState(12);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [markedAt, setMarkedAt] = useState<Date | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  // Wellbeing
  const [understanding, setUnderstanding] = useState(70);
  const [sleepiness, setSleepiness] = useState(30);
  const [stress, setStress] = useState(35);
  const [mood, setMood] = useState<"Happy" | "Neutral" | "Sad">("Neutral");
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
  getMyAttendanceApi()
    .then((data) => setHistory(data || []))
    .catch(() => toast.error("Failed to load history"));
}, []);

  const handleLogout = async () => {
    await logoutApi();
    setUser(null);
    setLocation("/");
  };
  // History Data
  // const [history, setHistory] = useState();

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        for (const t of streamRef.current.getTracks()) t.stop();
      }
    };
  }, []);

  // Location Verification
  useEffect(() => {
    if (activeTab === "attendance" && step === 1) {
      checkLocation();
    }
  }, [activeTab, step]);

  const checkLocation = () => {
    setLocStatus("checking");
    if (!navigator.geolocation) {
      setLocStatus("error");
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLoc({ lat: latitude, lon: longitude });
        const distance = getDistance(latitude, longitude, VIEW_LAT, VIEW_LON);
        setDistMeters(distance);

        if (distance <= MAX_DISTANCE_METERS) {
          setLocStatus("inside");
        } else {
          setLocStatus("outside");
        }
      },
      (error) => {
        console.error(error);
        setLocStatus("error");
        toast.error("Failed to get location. Please allow location access.");
      },
      { enableHighAccuracy: true }
    );
  };

  // Camera Functions
  async function startCamera() {
    try {
      setCamStatus("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamStatus("ready");
    } catch {
      setCamStatus("denied");
      toast.error("Camera permission blocked. Please allow camera access.");
    }
  }

  function simulateFaceConfidenceTick() {
    setConfidence((c) => {
      const bump = Math.random() * 14 + 2;
      const drift = (Math.random() - 0.5) * 10;
      const next = Math.max(5, Math.min(98, c + drift + bump));
      return Math.round(next);
    });
  }

  async function markAttendance() {
    if (camStatus !== "ready") return;
    setCamStatus("capturing");
    setCaptureProgress(0);

    const t0 = performance.now();
    const duration = 1800;

    const loop = () => {
      const p = Math.min(1, (performance.now() - t0) / duration);
      setCaptureProgress(Math.round(p * 100));
      simulateFaceConfidenceTick();

      if (p < 1) {
        requestAnimationFrame(loop);
      } else {
        // Capture photo
        if (videoRef.current) {
          const canvas = document.createElement("canvas");
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            setPhotoDataUrl(canvas.toDataURL("image/jpeg"));
          }
        }

        setMarkedAt(new Date());
        setCamStatus("success");

        // Stop stream
        if (streamRef.current) {
          for (const t of streamRef.current.getTracks()) t.stop();
          streamRef.current = null;
        }

        setTimeout(() => setStep(3), 1000);
      }
    };
    requestAnimationFrame(loop);
  }

  const handleSubmitWellbeing = async () => {
  try {
    const payload = {
      time: new Date().toLocaleTimeString(),
      status: "Present",
      location: "VIEW Campus",
      stressScore: stress,
      mood,
      understanding,
      sleepiness,
      photoUrl: photoDataUrl, // optional
    };

    const res = await markAttendanceApi(payload);

    setSubmitted(true);
    toast.success("Attendance submitted successfully");

    // update UI history
    setHistory((prev) => [res.attendance, ...(prev || [])]);

  } catch (err: any) {
    toast.error(err.message);
  }
};

  const handleSignOut = () => {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
    }
    setLocation("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <BrainCircuit className="size-5" />
          </div>
          <span className="font-semibold tracking-tight text-foreground">VIEW(A) Wellbeing</span>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${activeTab === "attendance"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted"
                }`}
            >
              <CalendarCheck className="size-4" />
              Mark Attendance
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${activeTab === "history"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted"
                }`}
            >
              <History className="size-4" />
              My History
            </button>
          </nav>
        </div>

        <div className="border-t p-4">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="grid size-9 place-items-center rounded-full bg-muted">
              <User className="size-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-medium">{user?.name}</div>
              <div className="text-xs text-muted-foreground">
                {user?.role} • {user?.username}
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 size-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <BrainCircuit className="size-5 text-primary" />
            <span className="font-semibold">VIEW(A)</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="size-5" />
          </Button>
        </div>

        {/* Mobile Nav */}
        <div className="flex border-b px-2 pt-2 lg:hidden overflow-x-auto no-scrollbar bg-background">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${activeTab === "attendance" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
          >
            Mark Attendance
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${activeTab === "history" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
          >
            My History
          </button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          {activeTab === "attendance" ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
                <p className="text-muted-foreground">Complete your daily check-in and wellbeing pulse.</p>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-between relative max-w-2xl mx-auto mb-8">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-muted z-0"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary z-0 transition-all duration-500" style={{ width: `${(step - 1) * 50}%` }}></div>

                <div className={`relative z-10 flex flex-col items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`grid size-8 rounded-full border-2 bg-background ${step >= 1 ? 'border-primary text-primary' : 'border-muted text-muted-foreground'} place-items-center font-semibold text-sm`}>
                    {step > 1 ? <CheckCircle2 className="size-5" /> : "1"}
                  </div>
                  <span className="text-xs font-medium bg-background px-1">Location</span>
                </div>

                <div className={`relative z-10 flex flex-col items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`grid size-8 rounded-full border-2 bg-background ${step >= 2 ? 'border-primary text-primary' : 'border-muted text-muted-foreground'} place-items-center font-semibold text-sm`}>
                    {step > 2 ? <CheckCircle2 className="size-5" /> : "2"}
                  </div>
                  <span className="text-xs font-medium bg-background px-1">Camera</span>
                </div>

                <div className={`relative z-10 flex flex-col items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`grid size-8 rounded-full border-2 bg-background ${step >= 3 ? 'border-primary text-primary' : 'border-muted text-muted-foreground'} place-items-center font-semibold text-sm`}>
                    {submitted ? <CheckCircle2 className="size-5" /> : "3"}
                  </div>
                  <span className="text-xs font-medium bg-background px-1">Wellbeing</span>
                </div>
              </div>

              <div className="max-w-2xl mx-auto">
                {/* Step 1: Location */}
                {step === 1 && (
                  <Card className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className={`p-4 rounded-full ${locStatus === 'inside' ? 'bg-emerald-100 text-emerald-600' : locStatus === 'outside' || locStatus === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        <MapPin className="size-8" />
                      </div>
                      <h2 className="text-xl font-semibold">Location Verification</h2>

                      <div className="max-w-md text-sm text-muted-foreground">
                        <p>We need to verify you are on campus to mark attendance.</p>
                        <p className="mt-2 font-medium">Allowed Area: Vignan's Institute of Engineering for Women (VIEW), Visakhapatnam.</p>
                      </div>

                      <div className="w-full p-4 rounded-xl bg-muted/50 border flex flex-col items-center justify-center gap-2 min-h-[120px]">
                        {locStatus === "checking" && (
                          <>
                            <Loader2 className="size-6 animate-spin text-primary" />
                            <p className="text-sm font-medium">Checking your location...</p>
                          </>
                        )}
                        {locStatus === "inside" && (
                          <>
                            <CheckCircle2 className="size-8 text-emerald-500" />
                            <p className="text-sm font-medium text-emerald-600">Location Verified: Inside Campus</p>
                            {distMeters !== null && <p className="text-xs text-muted-foreground">{Math.round(distMeters)} meters from center</p>}
                          </>
                        )}
                        {(locStatus === "outside" || locStatus === "error") && (
                          <>
                            <CircleAlert className="size-8 text-destructive" />
                            <p className="text-sm font-medium text-destructive">
                              {locStatus === "error" ? "Location access denied or unavailable." : "You are not inside VIEW campus."}
                            </p>
                            <p className="text-xs text-muted-foreground text-center mt-1">
                              {locStatus === "outside" && distMeters !== null
                                ? `You are ${Math.round(distMeters)} meters away. Must be within 200m.`
                                : "Attendance cannot be marked."}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="flex gap-3 w-full pt-4">
                        <Button variant="outline" className="flex-1" onClick={checkLocation}>Retry Location</Button>
                        <Button className="flex-1" disabled={locStatus !== "inside"} onClick={() => setStep(2)}>
                          Continue
                          <ChevronRight className="ml-2 size-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Step 2: Camera */}
                {step === 2 && (
                  <Card className="p-6">
                    <div className="flex flex-col space-y-4">
                      <div>
                        <h2 className="text-xl font-semibold">Camera Check-in</h2>
                        <p className="text-sm text-muted-foreground">Position your face inside the circle.</p>
                      </div>

                      <div className="relative overflow-hidden rounded-2xl border bg-black min-h-[300px] flex items-center justify-center">
                        {camStatus === "idle" && (
                          <div className="text-center text-white/70 p-6">
                            <Camera className="size-12 mx-auto mb-3 opacity-50" />
                            <p>Camera is off</p>
                          </div>
                        )}

                        <video
                          ref={videoRef}
                          className={`absolute inset-0 h-full w-full object-cover ${camStatus === 'idle' ? 'hidden' : 'block'}`}
                          playsInline
                          muted
                        />

                        {camStatus !== "idle" && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                              <div className={`size-[220px] rounded-full border-4 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] ${camStatus === 'capturing' ? 'border-primary animate-pulse' : camStatus === 'success' ? 'border-emerald-500' : 'border-white/50'}`} />
                            </div>

                            {camStatus === "capturing" && (
                              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 bg-background/90 backdrop-blur rounded-full p-2 flex items-center gap-3 border shadow-lg">
                                <Progress value={captureProgress} className="h-2 flex-1" />
                                <span className="text-xs font-semibold">{captureProgress}%</span>
                              </div>
                            )}

                            {camStatus === "success" && (
                              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
                                <CheckCircle2 className="size-4" />
                                Captured Successfully
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                        {camStatus === "idle" || camStatus === "denied" ? (
                          <Button className="flex-1" onClick={startCamera}>
                            <Camera className="mr-2 size-4" /> Start Camera
                          </Button>
                        ) : (
                          <Button className="flex-1" disabled={camStatus !== "ready"} onClick={markAttendance}>
                            Capture & Mark Attendance
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Step 3: Wellbeing */}
                {step === 3 && (
                  <Card className="p-6">
                    {!submitted ? (
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold">Daily Wellbeing Check</h2>
                          <p className="text-sm text-muted-foreground">How are you feeling today?</p>
                        </div>

                        <div className="space-y-5">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="text-sm font-medium">Academic Understanding</label>
                              <span className="text-xs text-muted-foreground">{understanding}%</span>
                            </div>
                            <Slider value={[understanding]} onValueChange={(v) => setUnderstanding(v[0])} max={100} step={5} />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Lost</span>
                              <span>Following well</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="text-sm font-medium">Sleepiness Level</label>
                              <span className="text-xs text-muted-foreground">{sleepiness}%</span>
                            </div>
                            <Slider value={[sleepiness]} onValueChange={(v) => setSleepiness(v[0])} max={100} step={5} />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Wide awake</span>
                              <span>Very sleepy</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="text-sm font-medium">Stress Level</label>
                              <span className="text-xs text-muted-foreground">{stress}%</span>
                            </div>
                            <Slider value={[stress]} onValueChange={(v) => setStress(v[0])} max={100} step={5} className="[&_[role=slider]]:border-rose-500 [&_[data-orientation=horizontal]]:bg-rose-500" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Relaxed</span>
                              <span>Stressed</span>
                            </div>
                          </div>

                          <div className="space-y-3 pt-2">
                            <label className="text-sm font-medium">Overall Mood</label>
                            <div className="grid grid-cols-3 gap-3">
                              <button
                                onClick={() => setMood("Happy")}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${mood === 'Happy' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20' : 'hover:bg-muted'}`}
                              >
                                <Smile className="size-6" />
                                <span className="text-xs font-medium">Happy</span>
                              </button>
                              <button
                                onClick={() => setMood("Neutral")}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${mood === 'Neutral' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500/20' : 'hover:bg-muted'}`}
                              >
                                <Meh className="size-6" />
                                <span className="text-xs font-medium">Neutral</span>
                              </button>
                              <button
                                onClick={() => setMood("Sad")}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${mood === 'Sad' ? 'border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500/20' : 'hover:bg-muted'}`}
                              >
                                <Frown className="size-6" />
                                <span className="text-xs font-medium">Stressed/Sad</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button className="w-full" onClick={handleSubmitWellbeing}>Submit Check-in</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 flex flex-col items-center text-center space-y-4">
                        <div className="size-16 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckCircle2 className="size-8 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold">All Set for Today!</h2>
                        <p className="text-muted-foreground max-w-sm">Your attendance and wellbeing data have been recorded. Have a great day at VIEW!</p>

                        <div className="grid grid-cols-2 gap-4 w-full mt-6 max-w-sm">
                          <div className="border rounded-xl p-3 bg-muted/30">
                            <div className="text-xs text-muted-foreground mb-1">Time Marked</div>
                            <div className="font-semibold">{markedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '08:45 AM'}</div>
                          </div>
                          <div className="border rounded-xl p-3 bg-muted/30">
                            <div className="text-xs text-muted-foreground mb-1">Status</div>
                            <div className="font-semibold text-emerald-600">Present</div>
                          </div>
                        </div>

                        <Button variant="outline" className="mt-6" onClick={() => setActiveTab("history")}>
                          View My History
                        </Button>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">My History</h1>
                <p className="text-muted-foreground">View your past attendance and wellbeing trends.</p>
              </div>

              <div className="grid gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Activity className="size-5 text-primary" />
                    <h3 className="font-semibold">Wellbeing Trends (Stress)</h3>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[...(history || [])].reverse()} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} domain={[0, 100]} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="stress" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: "#0ea5e9" }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                        <tr>
                          <th className="px-6 py-4 font-medium">Date & Time</th>
                          <th className="px-6 py-4 font-medium">Photo</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium">Location</th>
                          <th className="px-6 py-4 font-medium">Stress</th>
                          <th className="px-6 py-4 font-medium">Mood</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {history.map((record, i) => (
                          <tr key={i} className="bg-card hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium">{record.date}</div>
                              <div className="text-muted-foreground text-xs">{record.time}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="size-10 rounded-lg bg-muted overflow-hidden border">
                                {i === 0 && photoDataUrl ? (
                                  <img src={photoDataUrl} alt="Capture" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                                    <User className="size-4" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={record.status === 'Present' ? 'default' : 'destructive'} className={record.status === 'Present' ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200' : ''}>
                                {record.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MapPin className="size-3.5" />
                                <span>{record.location}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{record.stressScore}</span>
                                <Progress value={record.stressScore} className="w-16 h-1.5" />
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                {record.mood === 'Happy' && <Smile className="size-4 text-emerald-500" />}
                                {record.mood === 'Neutral' && <Meh className="size-4 text-blue-500" />}
                                {record.mood === 'Sad' && <Frown className="size-4 text-rose-500" />}
                                <span>{record.mood}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
