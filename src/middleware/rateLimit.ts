import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 דקות
  max: 100, // מקסימום 100 בקשות לכל IP
  message: "Too many requests from this IP, please try again later.",
  headers: true,
});
