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

  const apiKeys = user.apiKeys || {};
  query.status = "running";

  // Process each question
  for (let qi = 0; qi < query.questions.length; qi++) {
    const question = query.questions[qi];

    // Remove existing responses for selected providers
    question.responses = question.responses.filter(
      (r: { provider: string }) => !selectedProviders.includes(r.provider)
    );

    // Add pending responses
    for (const provider of selectedProviders) {
      if (apiKeys[provider as keyof typeof apiKeys]) {
        question.responses.push({
          provider,
          text: "",
          status: "running" as const,
        });
      }
    }
  }
  await query.save();

  // Run all queries concurrently
  const allPromises: Promise<void>[] = [];

  for (let qi = 0; qi < query.questions.length; qi++) {
    const question = query.questions[qi];

    for (const provider of selectedProviders) {
      const key = apiKeys[provider as keyof typeof apiKeys];
      const fn = PROVIDER_FNS[provider];
      if (!key || !fn) continue;

      const countryArg =
        provider === "serpapi" ? query.countryCode : query.country;

      const promise = fn(key, question.text, countryArg)
        .then(async (text) => {
          await Query.updateOne(
            { _id: id, "questions._id": question._id },
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
        })
        .catch(async (err) => {
          await Query.updateOne(
            { _id: id, "questions._id": question._id },
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
        });

      allPromises.push(promise);
    }
  }

  await Promise.all(allPromises);

  // Mark query as completed
  await Query.findByIdAndUpdate(id, { status: "completed" });

  return NextResponse.json({ message: "Query completed" });
}
