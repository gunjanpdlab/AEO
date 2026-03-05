import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await dbConnect();
  const user = await User.findById(session.user.id).select("apiKeys");
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  // Mask the keys for display
  const masked: Record<string, string> = {};
  const keys = user.apiKeys || {};
  for (const [k, v] of Object.entries(keys.toObject ? keys.toObject() : keys)) {
    const val = v as string;
    masked[k] = val ? val.slice(0, 8) + "..." + val.slice(-4) : "";
  }
  return NextResponse.json({ apiKeys: masked });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  await dbConnect();
  const update: Record<string, string> = {};
  for (const provider of ["openai", "gemini", "perplexity", "serpapi"]) {
    if (body[provider] !== undefined && body[provider] !== null) {
      // Only update if value is not the masked version
      if (!body[provider].includes("...")) {
        update[`apiKeys.${provider}`] = body[provider];
      }
    }
  }
  if (Object.keys(update).length > 0) {
    await User.findByIdAndUpdate(session.user.id, { $set: update });
  }
  return NextResponse.json({ message: "Settings saved" });
}
