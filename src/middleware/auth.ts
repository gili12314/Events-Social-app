import jwt from "jsonwebtoken";
import { Request, Response, NextFunction, RequestHandler } from "express";
import dotenv from "dotenv";

dotenv.config();

export interface AuthRequest extends Request {
  user: { _id: string; };
}

export const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      res.status(401).json({ message: "Not authorized, no token" });
      return;
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "fallbacksecret");
    
    // Set user as object with _id property
    (req as AuthRequest).user = { _id: decoded.id };
    
    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};