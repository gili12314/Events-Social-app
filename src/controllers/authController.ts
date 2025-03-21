import { Request, Response } from "express";
import User from "../models/User";
import { generateToken } from "../middleware/auth";
import { AuthRequest } from "../middleware/auth";  // נייבא את ה-AuthRequest


// **הרשמה**
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password } = req.body;
  
      const userExists = await User.findOne({ email });
      if (userExists) {
        res.status(400).json({ message: "User already exists" });
        return;
      }
  
      const user = new User({ username, email, password });
      await user.save();
      const userId = user._id as string ;

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(userId.toString()),
      });
  
    } catch (error) {
      res.status(500).json({ message: "Error registering user", error });
    }
  };

// **התחברות**
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
  
      if (!user || !(await user.comparePassword(password))) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }
      const userId = user._id as string ;

  
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(userId.toString()),
      });
  
    } catch (error) {
      res.status(500).json({ message: "Error logging in", error });
    }
  };
  

  export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthRequest).user; // המרת req ל-AuthRequest
  
      if (!userId) {
        res.status(401).json({ message: "Not authorized, no user found" });
        return;
      }
  
      const user = await User.findById(userId).select("-password");
  
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
  
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving user profile", error });
    }
  };