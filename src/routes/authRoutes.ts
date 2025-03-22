import express from "express";
import { registerUser, loginUser, getUserProfile } from "../controllers/authController";
import { protect } from "../middleware/auth";
import passport from "passport";
import { generateToken } from "../middleware/auth";

const router = express.Router();

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
 *     description: "Handles the callback after Google authentication. On success, redirects to the frontend callback page with token and userId as query parameters. On failure, redirects to /login."
 *     responses:
 *       302:
 *         description: "Redirects on success or failure"
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    if (!req.user) {
      return res.redirect("/login");
    }
    const user = req.user as { _id: string };
    const token = generateToken(user._id.toString());
    res.redirect(`http://localhost:5173/google-callback?token=${token}&userId=${user._id}`);
  }
);

export default router;
  