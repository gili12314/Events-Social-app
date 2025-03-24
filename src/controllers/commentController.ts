import { Request, Response } from "express";
import mongoose from "mongoose";
import Comment, { IComment } from "../models/Comment";
import Event from "../models/Event";
import { AuthRequest } from "../middleware/auth";

/**
 * @swagger
 * /comments/{eventId}:
 *   post:
 *     summary: "Create a comment on an event"
 *     description: "Creates a new comment on the specified event by the authenticated user."
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the event to comment on.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "This is a comment on the event."
 *     responses:
 *       201:
 *         description: "Comment created successfully"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: "Event not found"
 *       500:
 *         description: "Error creating comment"
 */
export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    const eventId = req.params.eventId;
    const userId = (req as AuthRequest).user;

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const comment: IComment = new Comment({
      event: event._id,
      user: new mongoose.Types.ObjectId(userId._id),
      text,
    });

    await comment.save();
    await comment.populate("user", "username");
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: "Error creating comment", error });
  }
};

/**
 * @swagger
 * /comments/{eventId}:
 *   get:
 *     summary: "Get comments for an event"
 *     description: "Retrieves all comments for the specified event, sorted by creation date in descending order."
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the event.
 *     responses:
 *       200:
 *         description: "A list of comments for the event"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       500:
 *         description: "Error fetching comments"
 */
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

/**
 * @swagger
 * /comments/update/{commentId}:
 *   put:
 *     summary: "Update a comment"
 *     description: "Updates the text of an existing comment. Only the owner of the comment can update it."
 *     parameters:
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the comment to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "This is the updated comment text."
 *     responses:
 *       200:
 *         description: "Comment updated successfully"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: "Comment not found"
 *       403:
 *         description: "Unauthorized to update this comment"
 *       500:
 *         description: "Error updating comment"
 */
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
    if (comment.user.toString() !== userId._id) {
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

/**
 * @swagger
 * /comments/delete/{commentId}:
 *   delete:
 *     summary: "Delete a comment"
 *     description: "Deletes an existing comment. Only the owner of the comment can delete it."
 *     parameters:
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the comment to delete.
 *     responses:
 *       200:
 *         description: "Comment deleted successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment deleted successfully"
 *       404:
 *         description: "Comment not found"
 *       403:
 *         description: "Unauthorized to delete this comment"
 *       500:
 *         description: "Error deleting comment"
 */
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const commentId = req.params.commentId;
    const userId = (req as AuthRequest).user;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }
    if (comment.user.toString() !== userId._id) {
      res.status(403).json({ message: "Unauthorized to delete this comment" });
      return;
    }
    await comment.deleteOne();
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting comment", error });
  }
};
