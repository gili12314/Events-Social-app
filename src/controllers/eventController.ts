// src/controllers/eventController.ts
import { Request, Response } from "express";
import Event from "../models/Event";
import { AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";
import Notification from "../models/Notification";
import fs from "fs";
import path from "path";
import { getEventImprovementSuggestions } from "../services/openaiService";

/**
 * @swagger
 * /events:
 *   post:
 *     summary: "Create a new event"
 *     description: "Creates a new event using the provided details. The authenticated user will be set as the creator."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: "Event details"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - date
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Birthday Party"
 *               description:
 *                 type: string
 *                 example: "Celebration at my house"
 *               image:
 *                 type: string
 *                 example: "/uploads/event-image.jpg"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-12-31T20:00:00.000Z"
 *               location:
 *                 type: string
 *                 example: "Tel Aviv"
 *     responses:
 *       201:
 *         description: "Event created successfully"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       401:
 *         description: "Unauthorized"
 *       500:
 *         description: "Error creating event"
 */
export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, image, date, location } = req.body;
    const userId = (req as AuthRequest).user;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const event = new Event({
      title,
      description,
      image,
      date,
      location,
      createdBy: userId,
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: "Error creating event", error });
  }
};

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: "Update an event"
 *     description: "Updates an event. Only the creator of the event is authorized to update it."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: "The event ID"
 *     requestBody:
 *       description: "Fields to update"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: "Event updated successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       403:
 *         description: "Unauthorized to edit this event"
 *       404:
 *         description: "Event not found"
 *       500:
 *         description: "Error updating event"
 */
export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user;
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    if (event.createdBy.toString() !== userId) {
      res.status(403).json({ message: "Unauthorized to edit this event" });
      return;
    }

    const { title, description, image, date, location } = req.body;
    if (title) event.title = title;
    if (description) event.description = description;
    if (image) event.image = image;
    if (date) event.date = date;
    if (location) event.location = location;

    await event.save();
    res.json({ message: "Event updated successfully", event });
  } catch (error) {
    res.status(500).json({ message: "Error updating event", error });
  }
};

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: "Delete an event"
 *     description: "Deletes an event. Only the creator of the event is authorized to delete it."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: "The event ID"
 *     responses:
 *       200:
 *         description: "Event deleted successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: "Unauthorized to delete this event"
 *       404:
 *         description: "Event not found"
 *       500:
 *         description: "Error deleting event"
 */
export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user;
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    if (event.createdBy.toString() !== userId) {
      res.status(403).json({ message: "Unauthorized to delete this event" });
      return;
    }

    await event.deleteOne();
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting event", error });
  }
};

/**
 * @swagger
 * /events:
 *   get:
 *     summary: "Get all events"
 *     description: "Retrieves all events along with the creator's username."
 *     responses:
 *       200:
 *         description: "A list of events"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: "Error fetching events"
 */
export const getAllEvents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const events = await Event.find().populate("createdBy", "username");
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Error fetching events", error });
  }
};

/**
 * @swagger
 * /events/{id}/join:
 *   post:
 *     summary: "Join an event"
 *     description: "Allows the authenticated user to join an event."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: "The event ID"
 *     responses:
 *       200:
 *         description: "Successfully joined the event"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: "Event not found"
 *       500:
 *         description: "Error joining event"
 */
export const joinEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId((req as AuthRequest).user);
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    if (!event.participants.some((id) => id.equals(userId))) {
      event.participants.push(userId);
      await event.save();

      // יצירת התראה לבעל האירוע
      if (event.createdBy.toString() !== userId.toString()) {
        await Notification.create({
          recipient: event.createdBy,
          sender: userId,
          event: event._id,
          type: "join",
        });
      }
    }

    res.json({ message: "Successfully joined the event", event });
  } catch (error) {
    res.status(500).json({ message: "Error joining event", error });
  }
};

/**
 * @swagger
 * /events/{id}/leave:
 *   post:
 *     summary: "Leave an event"
 *     description: "Allows the authenticated user to leave an event they previously joined."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: "The event ID"
 *     responses:
 *       200:
 *         description: "Successfully left the event"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: "Event not found"
 *       500:
 *         description: "Error leaving event"
 */
export const leaveEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId((req as AuthRequest).user);
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    event.participants = event.participants.filter((id) => !id.equals(userId));
    await event.save();
    res.json({ message: "Successfully left the event", event });
  } catch (error) {
    res.status(500).json({ message: "Error leaving event", error });
  }
};

/**
 * @swagger
 * /events/{id}/like:
 *   post:
 *     summary: "Toggle like on an event"
 *     description: "Allows the authenticated user to like or unlike an event."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: "The event ID"
 *     responses:
 *       200:
 *         description: "Like toggled successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: "Event not found"
 *       500:
 *         description: "Error liking event"
 */
export const likeEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId((req as AuthRequest).user);
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    let message = "Like added";
    if (!event.likes.some((id) => id.equals(userId))) {
      event.likes.push(userId);
    } else {
      event.likes = event.likes.filter((id) => !id.equals(userId));
      message = "Like removed";
    }

    await event.save();
    res.json({ message, event });
  } catch (error) {
    res.status(500).json({ message: "Error liking event", error });
  }
};

/**
 * @swagger
 * /events/{id}/image:
 *   put:
 *     summary: "Update event image"
 *     description: "Allows the creator of the event to update its image by uploading a new file."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: "The event ID"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: "Event image updated"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 eventImage:
 *                   type: string
 *       400:
 *         description: "No file uploaded"
 *       403:
 *         description: "Unauthorized to update this event"
 *       404:
 *         description: "Event not found"
 *       500:
 *         description: "Error uploading event image"
 */
export const uploadEventImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user;
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    if (event.createdBy.toString() !== userId) {
      res.status(403).json({ message: "Unauthorized to update this event" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    if (event.image) {
      const oldImagePath = path.join(__dirname, "..", event.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    event.image = `/uploads/${req.file.filename}`;
    await event.save();

    res.json({ message: "Event image updated", eventImage: event.image });
  } catch (error) {
    res.status(500).json({ message: "Error uploading event image", error });
  }
};

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: "Get event by ID"
 *     description: "Retrieves the event with the specified ID."
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: "The event ID"
 *     responses:
 *       200:
 *         description: "Event retrieved successfully"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: "Event not found"
 *       500:
 *         description: "Error fetching event"
 */
export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Error fetching event", error });
  }
};

/**
 * @swagger
 * /events/{id}/improve:
 *   post:
 *     summary: "Improve an event"
 *     description: "Generates improvement suggestions for the event using ChatGPT."
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: "The event ID"
 *     responses:
 *       200:
 *         description: "Event improvement suggestions generated"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 suggestions:
 *                   type: string
 *       404:
 *         description: "Event not found"
 *       500:
 *         description: "Error improving event"
 */
export const improveEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const suggestions = await getEventImprovementSuggestions(event.title, event.description, event.participants.length);

    res.json({ message: "Event improvement suggestions", suggestions });
  } catch (error) {
    res.status(500).json({ message: "Error improving event", error });
  }
};