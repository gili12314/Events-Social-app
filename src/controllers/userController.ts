import { Request, Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";
import fs from "fs";
import path from "path";

/**
 * @swagger
 * /users/profile-picture:
 *   put:
 *     summary: "Upload profile picture"
 *     description: "Uploads a new profile picture for the authenticated user, replacing the old one if it exists."
 *     security:
 *       - bearerAuth: []
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
 *         description: "Profile picture updated successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 profileImage:
 *                   type: string
 *       400:
 *         description: "No file uploaded"
 *       404:
 *         description: "User not found"
 *       500:
 *         description: "Error uploading profile picture"
 */
export const uploadProfilePicture = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    // delete old photo if exists
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, "..", user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    user.profileImage = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({ message: "Profile picture updated", profileImage: user.profileImage });
  } catch (error) {
    res.status(500).json({ message: "Error uploading profile picture", error });
  }
};

/**
 * @swagger
 * /users/update:
 *   put:
 *     summary: "Update user profile"
 *     description: "Updates the user's profile information such as username and email."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: "User profile data to update"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "newUsername"
 *               email:
 *                 type: string
 *                 example: "newemail@example.com"
 *     responses:
 *       200:
 *         description: "Profile updated successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: "User not found"
 *       500:
 *         description: "Error updating profile"
 */
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user;
    const { username, email } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();
    res.json({ message: "Profile updated successfully", user:await user.populate("events") });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error });
  }
};
