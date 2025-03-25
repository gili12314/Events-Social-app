import { Request, Response } from "express";
import User from "../models/User";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../services/tokenService";
import { AuthRequest } from "../middleware/auth";

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: "Register a new user"
 *     description: "Creates a new user account with username, email, and password. Returns the created user data along with access and refresh tokens."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "gili"
 *               email:
 *                 type: string
 *                 example: "gil@salton.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: "User registered successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: "Password is required or User already exists"
 *       500:
 *         description: "Error registering user"
 */
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

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: "Login user"
 *     description: "Authenticates a user using email and password and returns user data along with access and refresh tokens."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "gil@salton.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: "User logged in successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: "Invalid email or password"
 *       500:
 *         description: "Error logging in"
 */
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

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: "Get user profile"
 *     description: "Retrieves the profile of the authenticated user. Requires a valid access token."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "User profile retrieved successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: "Not authorized, no user found"
 *       404:
 *         description: "User not found"
 *       500:
 *         description: "Error retrieving user profile"
 */
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
 *     description: "Generates a new access token using a valid refresh token. Requires the refresh token in the request body."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "your_refresh_token"
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
