import { Request, Response } from "express";
import User from "../models/User";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../services/tokenService";
import { AuthRequest } from "../middleware/auth";

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    if (!password) {
      res.status(400).json({ message: "Password is required" });
      return;
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }
    const user = new User({ username, email, password });
    await user.save();
    const userId = user._id as string;
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    user.refreshToken = refreshToken;
    await user.save();
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: accessToken,
      refreshToken: refreshToken
    });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    const userId = user._id as string;
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    user.refreshToken = refreshToken;
    await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: accessToken,
      refreshToken: refreshToken 
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
};
 
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user;
    if (!userId) {
      res.status(401).json({ message: "Not authorized, no user found" });
      return;
    }
    const user = await User.findById(userId).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user profile", error });
  }
};

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: "Refresh access token"
 *     description: "Generates a new access token using a valid refresh token."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: "New access token generated successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: "Refresh token is required"
 *       401:
 *         description: "Invalid refresh token"
 *       500:
 *         description: "Error refreshing token"
 */
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ message: "Refresh token is required" });
      return;
    }
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }
    const userId = decoded.id;
    const user = await User.findById(userId);
    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }
    const newAccessToken = generateAccessToken(userId);
    res.json({ token: newAccessToken });
  } catch (error) {
    res.status(500).json({ message: "Error refreshing token", error });
  }
};
