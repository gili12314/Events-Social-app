import express from "express";
import { registerUser, loginUser, getUserProfile, refreshAccessToken } from "../controllers/authController";
import { protect } from "../middleware/auth";
import passport from "passport";
import { generateAccessToken, generateRefreshToken } from "../services/tokenService";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.post("/refresh", refreshAccessToken);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    if (!req.user) {
      return res.redirect("/login");
    }
    const user = req.user as { _id: string; refreshToken?: string; save: () => Promise<any> };
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    user.refreshToken = refreshToken;
    await user.save();
    res.redirect(`http://localhost:5173/google-callback?token=${accessToken}&refreshToken=${refreshToken}&userId=${user._id}`);
  }
);

export default router;
