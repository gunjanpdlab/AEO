import mongoose, { Schema, Document } from "mongoose";

export interface IResponse {
  provider: string;
  text: string;
  status: "pending" | "running" | "completed" | "error";
  error?: string;
}

export interface IQuestion {
  text: string;
  responses: IResponse[];
}

export interface IQuery extends Document {
  userId: string;
  title: string;
  country: string;
  countryCode: string;
  clientName: string;
  clientBrands: string[];
  competitorBrands: string[];
  questions: IQuestion[];
  status: "draft" | "running" | "completed";
  createdAt: Date;
}

const ResponseSchema = new Schema<IResponse>({
  provider: { type: String, required: true },
  text: { type: String, default: "" },
  status: { type: String, enum: ["pending", "running", "completed", "error"], default: "pending" },
  error: { type: String, default: "" },
});

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  responses: [ResponseSchema],
});

const QuerySchema = new Schema<IQuery>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  country: { type: String, default: "United States" },
  countryCode: { type: String, default: "us" },
  clientName: { type: String, default: "" },
  clientBrands: { type: [String], default: [] },
  competitorBrands: { type: [String], default: [] },
  questions: [QuestionSchema],
  status: { type: String, enum: ["draft", "running", "completed"], default: "draft" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Query || mongoose.model<IQuery>("Query", QuerySchema);
