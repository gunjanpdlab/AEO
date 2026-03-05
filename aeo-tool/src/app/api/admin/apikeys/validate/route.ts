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

async function testOpenAI(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function testGemini(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function testPerplexity(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 5,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error?.message || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function testSerpAPI(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const params = new URLSearchParams({
      engine: "google",
      q: "test",
      api_key: apiKey,
      num: "1",
    });
    const res = await fetch(`https://serpapi.com/search?${params.toString()}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

const TESTERS: Record<string, (key: string) => Promise<{ ok: boolean; error?: string }>> = {
  openai: testOpenAI,
  gemini: testGemini,
  perplexity: testPerplexity,
  serpapi: testSerpAPI,
};

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const user = await User.findById(userId).select("apiKeys");
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const results: Record<string, { ok: boolean; error?: string }> = {};
  const keys = user.apiKeys || {};

  const promises = Object.entries(TESTERS).map(async ([provider, tester]) => {
    const key = keys[provider as keyof typeof keys];
    if (!key) {
      results[provider] = { ok: false, error: "No key configured" };
      return;
    }
    results[provider] = await tester(key);
  });

  await Promise.all(promises);

  return NextResponse.json({ results });
}
