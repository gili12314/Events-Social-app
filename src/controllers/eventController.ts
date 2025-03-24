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
 * tags:
 *   name: Events
 *   description: Endpoints for event management
 */

/**
 * @swagger
 * /event:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
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
 *       201:
 *         description: Event created successfully.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error creating event.
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
 * /event/{id}:
 *   put:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The event ID.
 *         schema:
 *           type: string
 *     requestBody:
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
 *         description: Event updated successfully.
 *       403:
 *         description: Unauthorized to edit this event.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Error updating event.
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
 * /event/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The event ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted successfully.
 *       403:
 *         description: Unauthorized to delete this event.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Error deleting event.
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
 *     summary: Retrieve all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of events.
 *       500:
 *         description: Error fetching events.
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
 * /myevents:
 *   get:
 *     summary: Retrieve events created by the authenticated user
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events created by the user.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error fetching user's events.
 */
export const getMyEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const events = await Event.find({ createdBy: new mongoose.Types.ObjectId(userId) }).populate("createdBy", "username");
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user's events", error });
  }
};


/**
 * @swagger
 * /event/{id}/join:
 *   post:
 *     summary: Join an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The event ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully joined the event.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Error joining event.
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
 * /event/{id}/leave:
 *   post:
 *     summary: Leave an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The event ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully left the event.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Error leaving event.
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
 * /event/{id}/like:
 *   post:
 *     summary: Like or unlike an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The event ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like added or removed.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Error liking event.
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
 * /event/{id}/uploadImage:
 *   post:
 *     summary: Upload an image for an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The event ID.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Event image updated successfully.
 *       400:
 *         description: No file uploaded.
 *       403:
 *         description: Unauthorized to update this event.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Error uploading event image.
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
 * /event/{id}:
 *   get:
 *     summary: Retrieve an event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The event ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Error fetching event.
 */
export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id).populate("createdBy", "username");
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
 * /event/{id}/improve:
 *   get:
 *     summary: Get improvement suggestions for an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The event ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event improvement suggestions.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Error improving event.
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
