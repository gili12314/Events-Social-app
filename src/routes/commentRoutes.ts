import { Router } from "express";
import { createComment, getCommentsByEvent, updateComment, deleteComment } from "../controllers/commentController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/:eventId", protect, createComment);

router.get("/:eventId", protect, getCommentsByEvent);

router.put("/update/:commentId", protect, updateComment);

router.delete("/delete/:commentId", protect, deleteComment);

export default router;
