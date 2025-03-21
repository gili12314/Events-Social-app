import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string; // סימון השדה כאופציונלי
  profileImage?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // שדה לא חובה
  profileImage: { type: String },
});

// הצפנת סיסמה לפני שמירת המשתמש (אם יש סיסמה)
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next(); // הוספת בדיקה אם הסיסמה קיימת

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// פונקציה להשוואת סיסמאות (אם יש סיסמה)
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false; // הוספת בדיקה למקרה שאין סיסמה
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
