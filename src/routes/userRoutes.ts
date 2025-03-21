import express from "express";
import { uploadProfilePicture, updateUserProfile} from "../controllers/userController";
import { protect } from "../middleware/auth";
import upload from "../middleware/upload";

const router = express.Router();

router.put("/update", protect, updateUserProfile);

router.put("/profile-picture", protect, upload.single("image"), uploadProfilePicture);

export default router; 
