import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Query from "@/models/Query";
import { parseAllResponses } from "@/lib/aeo/parser";
import { computeAnalysis } from "@/lib/aeo/metrics";
import { generateAllCharts } from "@/lib/aeo/charts";
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
    return NextResponse.json({ error: "Brand configuration is required. Please set client and competitor brands." }, { status: 400 });
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
    openai: "ChatGPT",
    gemini: "Gemini",
    perplexity: "Perplexity",
    serpapi: "Google AI Overview",
  };

  // Collect all completed responses across all providers
  const questionsWithResponses: Array<{ text: string; responseText: string; provider: string }> = [];
  const allProviders = new Set<string>();
  for (const q of query.questions) {
    for (const r of q.responses) {
      if (r.status === 'completed' && r.text) {
        questionsWithResponses.push({
          text: q.text,
          responseText: r.text,
          provider: r.provider,
        });
        allProviders.add(r.provider);
      }
    }
  }

  // Count unique questions that have at least one completed response
  const questionsWithAny = new Set(questionsWithResponses.map(q => q.text));
  config.totalQuestions = questionsWithAny.size;

  if (questionsWithResponses.length === 0) {
    return NextResponse.json({ error: "No completed responses found. Run the query first." }, { status: 400 });
  }

  // Build platform label from all providers that returned responses
  config.platform = [...allProviders].map(p => PROVIDER_LABELS[p] || p).join(', ');

  const parsedData = parseAllResponses(questionsWithResponses, config);
  const analysis = computeAnalysis(parsedData, config);

  let charts;
  try {
    charts = await generateAllCharts(analysis);
  } catch (e) {
    console.error('Chart generation failed:', e);
    charts = null;
  }

  return NextResponse.json({
    analysis: {
      config: analysis.config,
      brandMetrics: analysis.brandMetrics,
      gaps: analysis.gaps.filter(g => g.type === 'CRITICAL'),
      gapSummary: analysis.gapSummary,
      categoryMetrics: analysis.categoryMetrics,
      funnelMetrics: analysis.funnelMetrics,
      clientVsCompetitor: analysis.clientVsCompetitor,
      findings: analysis.findings,
    },
    charts,
  });
}
