import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Query from "@/models/Query";
import { parseAllResponses } from "@/lib/aeo/parser";
import { computeAnalysis } from "@/lib/aeo/metrics";
import { generateAllCharts } from "@/lib/aeo/charts";
import { generateAnalysisExcel } from "@/lib/aeo/excel-report";
import { AEOConfig } from "@/lib/aeo/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await dbConnect();
  const query = await Query.findOne({ _id: id, userId: session.user.id });
  if (!query) {
    return NextResponse.json({ error: "Query not found" }, { status: 404 });
  }

  if (!query.clientBrands?.length || !query.competitorBrands?.length) {
    return NextResponse.json({ error: "Brand configuration required" }, { status: 400 });
  }

  const config: AEOConfig = {
    clientName: query.clientName || query.title,
    clientBrands: query.clientBrands,
    competitorBrands: query.competitorBrands,
    platform: '',
    country: query.country,
    date: query.createdAt.toISOString().split('T')[0],
    queryTitle: query.title,
    totalQuestions: 0,
  };

  const PROVIDER_LABELS: Record<string, string> = {
    openai: "ChatGPT", gemini: "Gemini", perplexity: "Perplexity", serpapi: "Google AI Overview",
  };
  const questionsWithResponses: Array<{ text: string; responseText: string; provider: string }> = [];
  const allProviders = new Set<string>();
  for (const q of query.questions) {
    for (const r of q.responses) {
      if (r.status === 'completed' && r.text) {
        questionsWithResponses.push({ text: q.text, responseText: r.text, provider: r.provider });
        allProviders.add(r.provider);
      }
    }
  }
  const questionsWithAny = new Set(questionsWithResponses.map(q => q.text));
  config.totalQuestions = questionsWithAny.size;
  config.platform = [...allProviders].map(p => PROVIDER_LABELS[p] || p).join(', ');

  const parsedData = parseAllResponses(questionsWithResponses, config);
  const analysis = computeAnalysis(parsedData, config);

  let charts = null;
  try {
    charts = await generateAllCharts(analysis);
  } catch (e) {
    console.error('Chart generation failed for Excel:', e);
  }

  const buffer = await generateAnalysisExcel(analysis, charts);
  const safeName = (config.clientName || 'AEO').replace(/[^a-zA-Z0-9_-]/g, '_');

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${safeName}_AEO_Analysis.xlsx"`,
    },
  });
}
