import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const user = await User.findById(userId).select("apiKeys name email");
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const masked: Record<string, string> = {};
  const keys = user.apiKeys || {};
  for (const [k, v] of Object.entries(keys.toObject ? keys.toObject() : keys)) {
    const val = v as string;
    masked[k] = val ? val.slice(0, 8) + "..." + val.slice(-4) : "";
  }

  return NextResponse.json({ apiKeys: masked, name: user.name, email: user.email });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { userId, apiKeys } = await req.json();
  if (!userId || !apiKeys) {
    return NextResponse.json({ error: "userId and apiKeys required" }, { status: 400 });
  }

  const update: Record<string, string> = {};
  for (const provider of ["openai", "gemini", "perplexity", "serpapi"]) {
    if (apiKeys[provider] !== undefined && apiKeys[provider] !== null) {
      if (!apiKeys[provider].includes("...")) {
        update[`apiKeys.${provider}`] = apiKeys[provider];
      }
    }
  }

  if (Object.keys(update).length > 0) {
    await User.findByIdAndUpdate(userId, { $set: update });
  }

  return NextResponse.json({ message: "API keys updated" });
}
