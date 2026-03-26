import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Query from "@/models/Query";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await dbConnect();
  const queries = await Query.find({ userId: session.user.id })
    .select("title country status createdAt questions")
    .sort({ createdAt: -1 });
  const result = queries.map((q) => ({
    id: q._id.toString(),
    title: q.title,
    country: q.country,
    status: q.status,
    questionCount: q.questions.length,
    createdAt: q.createdAt,
  }));
  return NextResponse.json({ queries: result });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { title, country, countryCode, questions, clientName, clientBrands, competitorBrands } = await req.json();
  if (!title || !questions || questions.length === 0) {
    return NextResponse.json({ error: "Title and questions are required" }, { status: 400 });
  }
  await dbConnect();
  const query = await Query.create({
    userId: session.user.id,
    title,
    country: country || "United States",
    countryCode: countryCode || "us",
    clientName: clientName || "",
    clientBrands: clientBrands || [],
    competitorBrands: competitorBrands || [],
    questions: questions.map((q: string) => ({ text: q, responses: [] })),
    status: "draft",
  });
  return NextResponse.json({ id: query._id.toString() });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await req.json();
  await dbConnect();
  await Query.deleteOne({ _id: id, userId: session.user.id });
  return NextResponse.json({ message: "Deleted" });
}
