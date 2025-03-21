import { Router } from "express";
import { createComment, getCommentsByEvent, updateComment, deleteComment } from "../controllers/commentController";
import { protect } from "../middleware/auth";

const router = Router();

// יצירת תגובה לאירוע (על פי eventId)
router.post("/:eventId", protect, createComment);

// שליפת תגובות עבור אירוע מסוים
router.get("/:eventId", protect, getCommentsByEvent);

// עדכון תגובה (על פי commentId)
router.put("/update/:commentId", protect, updateComment);

// מחיקת תגובה (על פי commentId)
router.delete("/delete/:commentId", protect, deleteComment);

export default router;
