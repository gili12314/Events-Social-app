import express from "express";
import { getNotifications, markNotificationsAsRead } from "../controllers/notificationController";
import { protect } from "../middleware/auth";

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read", protect, markNotificationsAsRead);

export default router;
