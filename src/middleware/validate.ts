import { Request, Response, NextFunction } from "express";
import Joi from "joi";

// דוגמה לסכמה עבור יצירת אירוע
const eventSchema = Joi.object({
  title: Joi.string().min(3).max(50).required(),
  description: Joi.string().min(10).max(500).required(),
  image: Joi.string().uri().optional(),
  date: Joi.date().required(),
  location: Joi.string().min(3).max(100).required(),
});

export const validateEvent = (req: Request, res: Response, next: NextFunction) => {
  const { error } = eventSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }
  next();
};
