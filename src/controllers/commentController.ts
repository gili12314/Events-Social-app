import { Request, Response } from "express";
import mongoose from "mongoose";
import Comment, { IComment } from "../models/Comment";
import Event from "../models/Event";
import { AuthRequest } from "../middleware/auth";

// יצירת תגובה לאירוע
export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    const eventId = req.params.eventId;
    const userId = (req as AuthRequest).user;

    // בדוק אם האירוע קיים
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const comment: IComment = new Comment({
      event: event._id,
      user: new mongoose.Types.ObjectId(userId),
      text,
    });

    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: "Error creating comment", error });
  }
};

// שליפת תגובות לאירוע
export const getCommentsByEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventId = req.params.eventId;
    const comments = await Comment.find({ event: eventId })
      .populate("user", "username")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching comments", error });
  }
};

// עדכון תגובה
export const updateComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const commentId = req.params.commentId;
    const userId = (req as AuthRequest).user;
    const { text } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }
    if (comment.user.toString() !== userId) {
      res.status(403).json({ message: "Unauthorized to update this comment" });
      return;
    }
    comment.text = text;
    await comment.save();
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: "Error updating comment", error });
  }
};

// מחיקת תגובה
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const commentId = req.params.commentId;
    const userId = (req as AuthRequest).user;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }
    if (comment.user.toString() !== userId) {
      res.status(403).json({ message: "Unauthorized to delete this comment" });
      return;
    }
    await comment.deleteOne();
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting comment", error });
  }
};
