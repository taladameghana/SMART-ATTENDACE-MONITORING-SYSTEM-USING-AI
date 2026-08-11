import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

export function requireRole(role: "student" | "teacher") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (req.session.userRole !== role) {
      return res.status(403).json({ message: "Forbidden: wrong role" });
    }
    next();
  };
}

// Extend express-session types
declare module "express-session" {
  interface SessionData {
    userId: string;
    userRole: "student" | "teacher";
    userName: string;
  }
}
