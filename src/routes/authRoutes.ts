// src/routes/authRoutes.ts
import express from "express";
import { registerUser, loginUser, getUserProfile } from "../controllers/authController";
import { protect } from "../middleware/auth";
import passport from "passport";

const router = express.Router();

// הרשמה והתחברות – הלוגיקה מתועדת בקונטרולרים
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: "Authenticate with Google"
 *     description: "Initiates the Google OAuth2 flow for user authentication. The user is redirected to Google for authentication."
 *     responses:
 *       302:
 *         description: "Redirects to Google for authentication"
 */
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: "Google OAuth2 callback"
 *     description: "Handles the callback after Google authentication. On success, returns a JSON message with the authenticated user information. On failure, redirects to /login."
 *     responses:
 *       200:
 *         description: "Login successful"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 user:
 *                   type: object
 *                   description: "Authenticated user object"
 *       302:
 *         description: "Redirects on failure"
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.json({ message: "Login successful", user: req.user });
  }
);

export default router;
