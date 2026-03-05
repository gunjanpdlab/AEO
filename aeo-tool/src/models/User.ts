import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  apiKeys: {
    openai?: string;
    gemini?: string;
    perplexity?: string;
    serpapi?: string;
  };
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  apiKeys: {
    openai: { type: String, default: "" },
    gemini: { type: String, default: "" },
    perplexity: { type: String, default: "" },
    serpapi: { type: String, default: "" },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
