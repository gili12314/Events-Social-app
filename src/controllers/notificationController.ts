import { Request, Response } from "express";
import Notification from "../models/Notification";
import { AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";


// קבלת כל ההתראות של משתמש
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId((req as AuthRequest).user);
    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "username")
      .populate("event", "title")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error });
  }
};

// סימון התראות כנקראו
export const markNotificationsAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId((req as AuthRequest).user);
    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });

    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error updating notifications", error });
  }
};
