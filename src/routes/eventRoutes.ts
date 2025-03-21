import express from "express";
import { createEvent, getAllEvents, deleteEvent, joinEvent, leaveEvent, likeEvent, updateEvent, uploadEventImage, improveEvent, getEventById } from "../controllers/eventController";
import { protect } from "../middleware/auth";
import upload from "../middleware/upload"; // ✅ הוספת הייבוא של `upload`
import { validateEvent } from "../middleware/validate";



const router = express.Router();

router.post("/", protect,validateEvent, createEvent);
router.put("/:id", protect, updateEvent); // ✅ נתיב לעדכון אירוע
router.get("/", getAllEvents);
router.get("/:id", protect, getEventById); // הנתיב החדש לקבלת אירוע לפי ID

router.delete("/:id", protect, deleteEvent);
router.post("/:id/join", protect, joinEvent);
router.post("/:id/leave", protect, leaveEvent);
router.post("/:id/like", protect, likeEvent);
router.put("/:id/image", protect, upload.single("image"), uploadEventImage);
router.post("/:id/improve", protect, improveEvent);



export default router;
