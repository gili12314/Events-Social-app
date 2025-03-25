import jwt from "jsonwebtoken";
const jwtSecret = process.env.JWT_SECRET || "your_jwt_secret";
export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: "15m" });
};
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: "7d" });
};
export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, jwtSecret);
};
