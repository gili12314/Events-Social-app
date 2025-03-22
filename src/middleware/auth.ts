import jwt from "jsonwebtoken";
import { Request, Response, NextFunction, RequestHandler } from "express";
import dotenv from "dotenv";

dotenv.config();

export interface AuthRequest extends Request {
  user: string;
}

export const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ message: "Unauthorized, no token" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    (req as AuthRequest).user = decoded.id; 
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized, invalid token" });
  }
};