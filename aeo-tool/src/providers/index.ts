import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function queryOpenAI(
  apiKey: string,
  question: string,
  country: string
): Promise<string> {
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant. Answer the following question from the perspective of someone located in ${country}. Provide a detailed, comprehensive answer with specific companies, brands, services, or solutions relevant to ${country}. Include numbered references where applicable.`,
      },
      { role: "user", content: question },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });
  return response.choices[0]?.message?.content || "";
}

export async function queryGemini(
  apiKey: string,
  question: string,
  country: string
): Promise<string> {
  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Answer the following question from the perspective of someone located in ${country}. Provide a detailed, comprehensive answer with specific companies, brands, services, or solutions relevant to ${country}. Include numbered references where applicable.\n\nQuestion: ${question}`;
  const response = await model.generateContent(prompt);
  return response.response.text();
}

export async function queryPerplexity(
  apiKey: string,
  question: string,
  country: string
): Promise<string> {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.perplexity.ai",
  });
  const response = await client.chat.completions.create({
    model: "sonar-pro",
    messages: [
      {
        role: "system",
        content: `Answer the following question from the perspective of someone located in ${country}. Focus on information, companies, brands, services, and solutions relevant to ${country}. Provide detailed answers with citations.`,
      },
      { role: "user", content: question },
    ],
    max_tokens: 4096,
  });
  return response.choices[0]?.message?.content || "";
}

export async function queryGoogleAIO(
  apiKey: string,
  question: string,
  countryCode: string
): Promise<string> {
  const params = new URLSearchParams({
    engine: "google",
    q: question,
    api_key: apiKey,
    gl: countryCode,
    num: "10",
  });
  const resp = await fetch(`https://serpapi.com/search?${params.toString()}`);
  if (!resp.ok) throw new Error(`SerpAPI error: ${resp.status}`);
  const data = await resp.json();

  const aio = data.ai_overview;
  if (!aio) return "[No AI Overview available for this query in this region]";

  const parts: string[] = [];
  const textBlocks = aio.text_blocks || [];
  for (const block of textBlocks) {
    if (block.type === "paragraph" && block.snippet) {
      parts.push(block.snippet);
    } else if (block.type === "list") {
      const items = block.list || [];
      items.forEach((item: { title?: string; snippet?: string }, i: number) => {
        if (item.title) parts.push(`${i + 1}. ${item.title}: ${item.snippet || ""}`);
        else if (item.snippet) parts.push(`${i + 1}. ${item.snippet}`);
      });
    }
  }
  const refs = aio.references || [];
  if (refs.length > 0) {
    parts.push("\nSources:");
    refs.forEach((ref: { title?: string; source?: string; link?: string }, i: number) => {
      parts.push(`[${i + 1}] ${ref.title || ""} (${ref.source || ""}) - ${ref.link || ""}`);
    });
  }
  return parts.join("\n\n") || "[AI Overview returned empty content]";
}
