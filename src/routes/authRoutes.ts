import express from "express";
import { registerUser, loginUser, getUserProfile } from "../controllers/authController";
import { protect } from "../middleware/auth";
import passport from "passport";


const router = express.Router();

// הרשמה והתחברות
router.post("/register", registerUser);
router.post("/login", loginUser);

// פרופיל – מוגן עם `protect`
router.get("/profile", protect, getUserProfile);


router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.json({ message: "Login successful", user: req.user });
  }
);



export default router;