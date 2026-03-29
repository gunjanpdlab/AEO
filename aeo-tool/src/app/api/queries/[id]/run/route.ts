import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Query from "@/models/Query";
import User from "@/models/User";
import {
  queryOpenAI,
  queryGemini,
  queryPerplexity,
  queryGoogleAIO,
} from "@/providers";

const PROVIDER_FNS: Record<
  string,
  (key: string, q: string, country: string) => Promise<string>
> = {
  openai: queryOpenAI,
  gemini: queryGemini,
  perplexity: queryPerplexity,
  serpapi: queryGoogleAIO,
};

// Delay between sequential requests per provider (ms)
const PROVIDER_DELAY: Record<string, number> = {
  openai: 200,
  gemini: 4000,   // Gemini free tier: ~15 req/min
  perplexity: 500,
  serpapi: 1000,
};

async function runProviderSequentially(
  provider: string,
  key: string,
  questions: Array<{ _id: string; text: string }>,
  queryId: string,
  countryArg: string
) {
  const fn = PROVIDER_FNS[provider];
  if (!fn) return;
  const delayMs = PROVIDER_DELAY[provider] || 500;

  for (let qi = 0; qi < questions.length; qi++) {
    const question = questions[qi];
    if (qi > 0) await new Promise((res) => setTimeout(res, delayMs));

    try {
      const text = await fn(key, question.text, countryArg);
      await Query.updateOne(
        { _id: queryId, "questions._id": question._id },
        {
          $set: {
            "questions.$[q].responses.$[r].text": text,
            "questions.$[q].responses.$[r].status": "completed",
          },
        },
        {
          arrayFilters: [
            { "q._id": question._id },
            { "r.provider": provider },
          ],
        }
      );
    } catch (err) {
      console.error(`[AEO] ${provider} error for Q${qi}:`, err);
      await Query.updateOne(
        { _id: queryId, "questions._id": question._id },
        {
          $set: {
            "questions.$[q].responses.$[r].status": "error",
            "questions.$[q].responses.$[r].error": String(err),
          },
        },
        {
          arrayFilters: [
            { "q._id": question._id },
            { "r.provider": provider },
          ],
        }
      );
    }
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { providers: selectedProviders } = await req.json();
  const { id } = await params;

  await dbConnect();

  const query = await Query.findOne({ _id: id, userId: session.user.id });
  if (!query) {
    return NextResponse.json({ error: "Query not found" }, { status: 404 });
  }

  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Resolve API keys: user's own key first, fallback to any admin's key
  const userKeys = user.apiKeys || {};
  const resolvedKeys: Record<string, string> = {};
  for (const provider of ["openai", "gemini", "perplexity", "serpapi"]) {
    const userKey = userKeys[provider as keyof typeof userKeys];
    if (userKey) {
      resolvedKeys[provider] = userKey;
    }
  }
  // Fill missing keys from admin accounts
  const missingProviders = selectedProviders.filter((p: string) => !resolvedKeys[p]);
  if (missingProviders.length > 0) {
    const admins = await User.find({ role: "admin" }).select("apiKeys");
    for (const provider of missingProviders) {
      for (const admin of admins) {
        const adminKey = admin.apiKeys?.[provider as keyof typeof admin.apiKeys];
        if (adminKey) {
          resolvedKeys[provider] = adminKey;
          break;
        }
      }
    }
  }

  query.status = "running";

  // Build per-provider list of questions that need to be run
  // (skip questions that already have a completed response for that provider)
  const providerQuestions: Record<string, Array<{ _id: string; text: string }>> = {};

  for (let qi = 0; qi < query.questions.length; qi++) {
    const question = query.questions[qi];

    for (const provider of selectedProviders) {
      if (!resolvedKeys[provider]) continue;

      const existing = question.responses.find(
        (r: { provider: string; status: string }) => r.provider === provider
      );

      if (existing && existing.status === "completed") {
        // Already done — skip
        continue;
      }

      // Remove failed/pending response if exists
      if (existing) {
        question.responses = question.responses.filter(
          (r: { provider: string }) => r.provider !== provider
        );
      }

      // Add as running
      question.responses.push({
        provider,
        text: "",
        status: "running" as const,
      });

      if (!providerQuestions[provider]) providerQuestions[provider] = [];
      providerQuestions[provider].push({ _id: question._id, text: question.text });
    }
  }
  await query.save();

  // Run each provider sequentially (questions in order with delays),
  // but different providers run in parallel with each other
  const providerPromises = Object.entries(providerQuestions)
    .filter(([p]) => PROVIDER_FNS[p])
    .map(([provider, questions]) => {
      const countryArg =
        provider === "serpapi" ? query.countryCode : query.country;
      return runProviderSequentially(
        provider,
        resolvedKeys[provider],
        questions,
        id,
        countryArg
      );
    });

  await Promise.all(providerPromises);

  // Mark query as completed
  await Query.findByIdAndUpdate(id, { status: "completed" });

  return NextResponse.json({ message: "Query completed" });
}
