import { Request, Response } from "express";
import Event from "../models/Event";
import { AuthRequest } from "../middleware/auth";  
import mongoose from "mongoose";
import Notification from "../models/Notification";
import fs from "fs"; // ✅ הוספת fs לניהול קבצים
import path from "path"; // ✅ הוספת path לניהול נתיבי קבצים
import { getEventImprovementSuggestions } from "../services/openaiService";



// יצירת אירוע חדש
export const createEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, description, image, date, location } = req.body;
      const userId = (req as AuthRequest).user; // המרת `req` ל- `AuthRequest`
  
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
        createdBy: userId, // `req.user` כעת מובטח להיות `string`
      });
  
      await event.save();
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: "Error creating event", error });
    }
  };

  export const updateEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthRequest).user; // המרת `req` ל- `AuthRequest`
      const event = await Event.findById(req.params.id);
  
      if (!event) {
        res.status(404).json({ message: "Event not found" });
        return;
      }
  
      // בדיקה שהמשתמש המחובר הוא היוצר של האירוע
      if (event.createdBy.toString() !== userId) {
        res.status(403).json({ message: "Unauthorized to edit this event" });
        return;
      }
  
      // עדכון רק של השדות שנשלחו בבקשה
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
  
  // מחיקת אירוע
  export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthRequest).user; // המרת `req` ל- `AuthRequest`
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

// קבלת כל האירועים
export const getAllEvents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const events = await Event.find().populate("createdBy", "username");
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Error fetching events", error });
  }
};

// הצטרפות לאירוע
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
  
        // ✅ יצירת התראה לבעל האירוע
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
  
  // ביטול הרשמה מאירוע
  export const leaveEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = new mongoose.Types.ObjectId((req as AuthRequest).user); // ✅ המרה ל- ObjectId
      const event = await Event.findById(req.params.id);
  
      if (!event) {
        res.status(404).json({ message: "Event not found" });
        return;
      }
  
      // ✅ שימוש ב- `equals()` במקום `!==` כדי להסיר משתמש מרשימת המשתתפים
      event.participants = event.participants.filter((id) => !id.equals(userId));
  
      await event.save();
      res.json({ message: "Successfully left the event", event });
    } catch (error) {
      res.status(500).json({ message: "Error leaving event", error });
    }
  };
  
  // סימון לייק על אירוע
  export const likeEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = new mongoose.Types.ObjectId((req as AuthRequest).user); // ✅ המרה ל- ObjectId
      const event = await Event.findById(req.params.id);
  
      if (!event) {
        res.status(404).json({ message: "Event not found" });
        return;
      }
  
      let message = "Like added";
      if (!event.likes.some((id) => id.equals(userId))) { // ✅ השוואה עם ObjectId
        event.likes.push(userId);
      } else {
        event.likes = event.likes.filter((id) => !id.equals(userId)); // ✅ הסרה עם `equals()`
        message = "Like removed";
      }
  
      await event.save();
      res.json({ message, event });
    } catch (error) {
      res.status(500).json({ message: "Error liking event", error });
    }
  };

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
  
      // מחיקת תמונה ישנה אם קיימת
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