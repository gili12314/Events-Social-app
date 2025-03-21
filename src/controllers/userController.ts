import { Request, Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";
import fs from "fs";
import path from "path";

// העלאת תמונת פרופיל
export const uploadProfilePicture = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    // מחיקת תמונה קודמת אם קיימת
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, "..", user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    user.profileImage = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({ message: "Profile picture updated", profileImage: user.profileImage });
  } catch (error) {
    res.status(500).json({ message: "Error uploading profile picture", error });
  }
};

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user;
    const { username, email } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error });
  }
};
