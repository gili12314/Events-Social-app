import { Request, Response } from "express";
import Notification from "../models/Notification";
import { AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: "Get all notifications for the user"
 *     description: "Retrieves all notifications for the authenticated user, including sender's username and event title, sorted by creation date descending."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Notifications retrieved successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       500:
 *         description: "Error fetching notifications"
 */
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId((req as AuthRequest).user._id);
    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "username")
      .populate("event", "title")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error });
  }
};

/**
 * @swagger
 * /notifications/read:
 *   put:
 *     summary: "Mark all notifications as read"
 *     description: "Updates all notifications for the authenticated user by marking them as read."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Notifications marked as read successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Notifications marked as read"
 *       500:
 *         description: "Error updating notifications"
 */
export const markNotificationsAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId((req as AuthRequest).user._id);
    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });

    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error updating notifications", error });
  }
};
