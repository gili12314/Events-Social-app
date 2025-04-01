import express from "express";
import multer from "multer";
import { createEvent, updateEvent, deleteEvent, getAllEvents, getMyEvents, joinEvent, leaveEvent, likeEvent, uploadEventImage, getEventById, improveEvent, uploadNewEventImage } from "../controllers/eventController";
import { protect } from "../middleware/auth";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage: storage });

router.post("/", protect, createEvent);
router.post("/upload", protect, upload.single("image"), uploadNewEventImage);
router.put("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);
router.get("/", getAllEvents);
router.get("/my-events", protect, getMyEvents);
router.post("/:id/join", protect, joinEvent);
router.post("/:id/leave", protect, leaveEvent);
router.post("/:id/like", protect, likeEvent);
router.post("/:id/uploadImage", protect, upload.single("file"), uploadEventImage);
router.get("/:id", getEventById);
router.post("/:id/improve", protect, improveEvent); 

export default router;
