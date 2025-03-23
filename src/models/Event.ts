import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  image?: string;
  date: Date;
  location: string;
  createdBy: mongoose.Types.ObjectId | { _id: string; username: string };
  participants: mongoose.Types.ObjectId[];
  likes: mongoose.Types.ObjectId[];
}

const EventSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] 
});

export default mongoose.model<IEvent>("Event", EventSchema);
