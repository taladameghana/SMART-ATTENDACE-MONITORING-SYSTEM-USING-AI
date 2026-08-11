import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  GraduationCap,
  ShieldCheck,
  UserRound,
  Users,
  Camera,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { loginApi, logoutApi, registerApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Role = "student" | "teacher";

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border bg-background/50 p-3"
      data-testid={`card-feature-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="mt-0.5 grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold" data-testid={`text-feature-title-${title}`}
        >
          {title}
        </div>
        <div
          className="text-sm text-muted-foreground"
          data-testid={`text-feature-desc-${title}`}
        >
          {desc}
        </div>
      </div>
    </div>
  );
}

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
];

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [classId, setClassId] = useState(classes[0]?.id ?? "CSE-1");
  const [secretCode, setSecretCode] = useState("");
  const { setUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutApi();

      // redirect to login
      setLocation("/");

    } catch (err) {
      console.error("Logout failed");
    }
  };

  const handleModeSwitch = (newMode: "signin" | "signup") => {
    setMode(newMode);
    // Reset form fields
    setEmail("");
    setPassword("");
    setName("");
    setSecretCode("");
  };

  const canContinue = useMemo(() => {
    if (!email.includes("@")) return false;
    if (password.length < 3) return false;
    if (mode === "signup" && name.trim().length < 2) return false;
    if (mode === "signup" && role === "teacher" && secretCode !== "VIEW2026") return false;
    return true;
  }, [email, password, mode, name, role, secretCode]);

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-background">
      {/* Left Panel - Branding */}
      <div className="relative flex w-full flex-col justify-between bg-primary/5 p-8 lg:w-1/2 lg:p-12 xl:p-16">
        <div className="pointer-events-none absolute inset-0 subtle-grid opacity-20" />

        <div className="relative z-10 flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground" data-testid="text-logo">VIEW(A)</span>
        </div>

        <div className="relative z-10 my-12 flex-1 flex flex-col justify-center space-y-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-sm">
            <ShieldCheck className="size-4" />
            <span data-testid="text-badge-privacy">Privacy-first monitoring</span>
          </div>

          <h1
            className="h1-display text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl text-foreground"
            data-testid="text-hero-title"
          >
            Smart Attendance & <br className="hidden lg:block" />
            <span className="text-primary">Student Wellbeing</span>
          </h1>

          <p
            className="max-w-md text-pretty text-base text-muted-foreground sm:text-lg"
            data-testid="text-hero-subtitle"
          >
            A seamless check-in experience designed to track daily attendance while monitoring stress and sleep trends.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Feature
              icon={<Camera className="size-4" />}
              title="Camera check-in"
              desc="Guided capture prototype."
            />
            <Feature
              icon={<LineChart className="size-4" />}
              title="Stress pulse"
              desc="60-second questionnaire."
            />
            <Feature
              icon={<Users className="size-4" />}
              title="Class view"
              desc="Clean teacher dashboard."
            />
            <Feature
              icon={<UserRound className="size-4" />}
              title="Role-based"
              desc="Tailored experiences."
            />
          </div>
        </div>

        <div className="relative z-10 text-sm text-muted-foreground" data-testid="text-footer-copyright">
          © {new Date().getFullYear()} VIEW(A) System. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login/Register Form */}
      <div className="flex w-full items-center justify-center bg-white p-6 sm:p-8 lg:w-1/2 lg:p-12 shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.05)] z-20">
        <div className="w-full max-w-[420px]">
          <div className="flex justify-center mb-8">
            <Tabs
              value={mode}
              onValueChange={(v) => handleModeSwitch(v as "signin" | "signup")}
              className="w-full max-w-[240px]"
              data-testid="tabs-auth-mode"
            >
              <TabsList className="grid w-full grid-cols-2 rounded-full p-1 bg-muted/50">
                <TabsTrigger value="signin" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm" data-testid="tab-signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm" data-testid="tab-signup">Create Account</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Card className="border-0 shadow-xl shadow-black/5 ring-1 ring-black/5 sm:rounded-2xl overflow-hidden bg-white">
            <div className="p-6 sm:p-8">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground" data-testid="text-form-title">
                  {mode === "signin" ? "Welcome back" : "Create an account"}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground" data-testid="text-form-subtitle">
                  {mode === "signin" ? "Enter your details to sign in to your account." : "Join VIEW(A) to get started."}
                </p>
              </div>

              <div className="space-y-6">
                {/* Role Selector */}
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold" data-testid="label-role-select">I am a...</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all duration-200 ${role === "student"
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20 shadow-sm"
                        : "border-border bg-transparent text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground/30"
                        }`}
                      data-testid="button-role-student"
                    >
                      <UserRound className="size-6 mb-1" />
                      <span className="text-sm font-medium">Student</span>
                      {role === "student" && (
                        <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("teacher")}
                      className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all duration-200 ${role === "teacher"
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20 shadow-sm"
                        : "border-border bg-transparent text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground/30"
                        }`}
                      data-testid="button-role-teacher"
                    >
                      <GraduationCap className="size-6 mb-1" />
                      <span className="text-sm font-medium">Teacher</span>
                      {role === "teacher" && (
                        <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </button>
                  </div>
                </div>

                <Separator className="bg-border/60" />

                <div className="grid gap-4">
                  {mode === "signup" && (
                    <AnimatePresence mode="popLayout">
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name" data-testid="label-name">
                              Full Name
                            </Label>
                            <Input
                              id="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder={role === "teacher" ? "Ms. Rivera" : "Aisha K."}
                              className="bg-muted/30 focus-visible:bg-transparent"
                              data-testid="input-name"
                            />
                          </div>

                          {role === "student" ? (
                            <div className="grid gap-2">
                              <Label htmlFor="rollNumber" data-testid="label-roll-number">
                                Roll Number
                              </Label>
                              <Input
                                id="rollNumber"
                                placeholder="e.g. 21NM1A0501"
                                className="bg-muted/30 focus-visible:bg-transparent"
                                data-testid="input-roll-number"
                              />
                            </div>
                          ) : (
                            <div className="grid gap-2">
                              <Label htmlFor="secretCode" data-testid="label-secret-code">
                                Secret Code
                              </Label>
                              <Input
                                id="secretCode"
                                type="password"
                                value={secretCode}
                                onChange={(e) => setSecretCode(e.target.value)}
                                placeholder="Code"
                                className="bg-muted/30 focus-visible:bg-transparent border-primary/20 focus-visible:ring-primary/50"
                                data-testid="input-secret-code"
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="email" data-testid="label-email">
                      {mode === "signin" ? "Username / Email" : "Email Address"}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={role === "teacher" ? "teacher@view.edu" : "student@view.edu"}
                      className="bg-muted/30 focus-visible:bg-transparent"
                      data-testid="input-email"
                    />
                  </div>

                  {role === "student" && mode === "signup" && (
                    <div className="grid gap-2">
                      <Label htmlFor="class" data-testid="label-class">
                        Class / Section
                      </Label>
                      <div className="relative">
                        <select
                          id="class"
                          value={classId}
                          onChange={(e) => setClassId(e.target.value)}
                          className="flex h-10 w-full appearance-none items-center justify-between rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:bg-transparent"
                          data-testid="select-class-login"
                        >
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
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" data-testid="label-password">
                        Password
                      </Label>
                      {mode === "signin" && (
                        <a href="#" className="text-xs text-primary hover:underline font-medium" data-testid="link-forgot-password">
                          Forgot password?
                        </a>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-muted/30 focus-visible:bg-transparent"
                      data-testid="input-password"
                    />
                  </div>

                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={`${role}-${mode}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="pt-2"
                    >
                      <Button
                        className="w-full h-11 text-base font-medium shadow-sm"
                        disabled={!canContinue}
                        onClick={async () => {
                          try {
                            if (mode === "signin") {
                              const res = await loginApi({
                                username: email,
                                password,
                                role,
                              });
                              setUser(res.user);

                              console.log("Login success:", res);

                            } else {
                              const res = await registerApi({
                                username: email,
                                password,
                                role,
                                name,
                                classId: role === "student" ? classId : undefined,
                              });
                              setUser(res.user);

                              console.log("Register success:", res);
                            }

                            // redirect after success
                            setLocation(role === "teacher" ? "/teacher" : "/student");

                          } catch (error: any) {
                            console.error(error.message);
                            alert(error.message);
                          }
                        }}
                        data-testid="button-continue"
                      >
                        {mode === "signin" ? "Sign In" : "Create Account"}
                      </Button>
                    </motion.div>
                  </AnimatePresence>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground" data-testid="text-login-footer">
                    <Badge variant="outline" className="font-normal text-[10px] h-5 px-1.5 border-muted-foreground/30">Demo Mode</Badge>
                    <span>No real authentication required yet.</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
