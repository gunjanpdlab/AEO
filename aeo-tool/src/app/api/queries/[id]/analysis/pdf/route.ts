import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Query from "@/models/Query";
import { parseAllResponses } from "@/lib/aeo/parser";
import { computeAnalysis } from "@/lib/aeo/metrics";
import { generateAllCharts } from "@/lib/aeo/charts";
import { generateAnalysisPdf } from "@/lib/aeo/pdf-report";
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

  const questionsWithResponses: Array<{ text: string; responseText: string; provider: string }> = [];
  for (const q of query.questions) {
    const completed = q.responses.find((r: any) => r.status === 'completed' && r.text);
    if (completed) {
      questionsWithResponses.push({ text: q.text, responseText: completed.text, provider: completed.provider });
    }
  }
  config.totalQuestions = questionsWithResponses.length;
  const providers = new Set(questionsWithResponses.map(q => q.provider));
  config.platform = [...providers].join(', ');

  const parsedData = parseAllResponses(questionsWithResponses, config);
  const analysis = computeAnalysis(parsedData, config);

  let charts = null;
  try {
    charts = await generateAllCharts(analysis);
  } catch (e) {
    console.error('Chart generation failed for PDF:', e);
  }

  const buffer = await generateAnalysisPdf(analysis, charts);
  const safeName = (config.clientName || 'AEO').replace(/[^a-zA-Z0-9_-]/g, '_');

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeName}_AEO_Audit_Report.pdf"`,
    },
  });
}
