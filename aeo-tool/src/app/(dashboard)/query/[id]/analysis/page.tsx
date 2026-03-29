"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { COUNTRIES, getFlagUrl } from "@/lib/countries";

interface BrandMetric {
  name: string;
  group: string;
  presence: number;
  presencePct: number;
  mentions: number;
  avgDepth: number;
  sovPct: number;
  topRecs: number;
  topRecPct: number;
  cited: number;
  citeRate: number;
  mentionToCiteConversion: number;
  avgRank: number;
  rank1Count: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  sentimentScore: number;
  positiveSignals: number;
  negativeSignals: number;
  netSignals: number;
  compositeScore: number;
}

interface GapItem {
  type: string;
  question: string;
  questionNum: number;
  category: string;
  missingClientBrands: string[];
  competitorsPresent: string[];
}

interface AnalysisData {
  config: {
    clientName: string;
    clientBrands: string[];
    competitorBrands: string[];
    platform: string;
    country: string;
    date: string;
    queryTitle: string;
    totalQuestions: number;
  };
  brandMetrics: BrandMetric[];
  gaps: GapItem[];
  gapSummary: Record<string, number>;
  categoryMetrics: any[];
  funnelMetrics: any[];
  clientVsCompetitor: {
    clientPresence: number;
    competitorPresence: number;
    bothPresent: number;
    clientOnly: number;
    competitorOnly: number;
    neither: number;
    clientMentions: number;
    competitorMentions: number;
    totalMentions: number;
  };
  findings: string[];
}

interface ChartSet {
  [key: string]: string;
}

export default function AnalysisPage() {
  const params = useParams();
  const id = params.id as string;
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [charts, setCharts] = useState<ChartSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showGaps, setShowGaps] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [showFunnel, setShowFunnel] = useState(false);

  useEffect(() => {
    fetchAnalysis();
  }, [id]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/queries/${id}/analysis`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load analysis");
      } else {
        setAnalysis(data.analysis);
        setCharts(data.charts);
      }
    } catch {
      setError("Failed to fetch analysis data");
    }
    setLoading(false);
  };

  const downloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      const res = await fetch(`/api/queries/${id}/analysis/excel`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${analysis?.config.clientName || "AEO"}_Analysis.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download Excel report");
    }
    setDownloadingExcel(false);
  };

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/queries/${id}/analysis/pdf`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${analysis?.config.clientName || "AEO"}_Audit_Report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download PDF report");
    }
    setDownloadingPdf(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="animate-spin w-16 h-16 border-4 border-[#d8f3dc] border-t-[#2d6a4f] rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2">
                <path d="M21 21H4.6c-.56 0-.84 0-1.05-.11a1 1 0 01-.44-.44C3 20.24 3 19.96 3 19.4V3M7 14l4-4 4 4 6-6" />
              </svg>
            </div>
          </div>
          <p className="text-lg font-semibold text-[#1b4332]">Analyzing responses...</p>
          <p className="text-sm text-[#6b7280] mt-2">Parsing brand mentions, generating charts, and computing metrics</p>
          <div className="flex justify-center gap-1 mt-4">
            <div className="w-2 h-2 bg-[#2d6a4f] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-[#40916c] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-[#52b788] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg">
          <p className="font-semibold mb-2">Analysis Error</p>
          <p className="text-sm">{error}</p>
          <Link href={`/query/${id}`} className="text-sm text-[#2d6a4f] underline mt-4 block">
            Back to query
          </Link>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const { config, brandMetrics, gaps, gapSummary, clientVsCompetitor: cvc, findings } = analysis;
  const clientMetrics = brandMetrics.filter(b => b.group === "client");
  const compMetrics = brandMetrics.filter(b => b.group === "competitor");
  const avgComposite = clientMetrics.length > 0
    ? Math.round(clientMetrics.reduce((s, b) => s + b.compositeScore, 0) / clientMetrics.length)
    : 0;
  const totalClientTopRecs = clientMetrics.reduce((s, b) => s + b.topRecs, 0);
  const totalClientCited = clientMetrics.reduce((s, b) => s + b.cited, 0);
  const clientSovPct = cvc.totalMentions > 0 ? Math.round((cvc.clientMentions / cvc.totalMentions) * 100) : 0;

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href={`/query/${id}`} className="text-sm text-[#2d6a4f] hover:underline mb-2 block">
            &larr; Back to Query
          </Link>
          <h1 className="text-2xl font-bold text-[#1b4332]">{config.clientName} AEO Analysis</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            {config.queryTitle} | {config.platform} | <img src={getFlagUrl(COUNTRIES.find(c => c.name === config.country)?.code || "us")} alt="" width={20} height={15} className="inline-block" /> {config.country} | {config.date} | {config.totalQuestions} Queries
          </p>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="px-2 py-1 bg-[#d6e4f0] text-[#2F5496] rounded font-medium">
              Client: {config.clientBrands.join(", ")}
            </span>
            <span className="px-2 py-1 bg-[#fce4d6] text-[#C55A11] rounded font-medium">
              Competitors: {config.competitorBrands.join(", ")}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadExcel} disabled={downloadingExcel}
            className="text-sm px-4 py-2 rounded-lg border border-[#2d6a4f] text-[#2d6a4f] hover:bg-[#d8f3dc] transition-colors font-medium cursor-pointer disabled:opacity-50">
            {downloadingExcel ? "Generating..." : "Download Excel"}
          </button>
          <button onClick={downloadPdf} disabled={downloadingPdf}
            className="text-sm px-4 py-2 rounded-lg bg-[#2d6a4f] text-white hover:bg-[#1b4332] transition-colors font-medium cursor-pointer disabled:opacity-50">
            {downloadingPdf ? "Generating..." : "Download PDF Report"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-3 mb-8">
        {[
          { label: "Client Presence", value: `${cvc.clientPresence}/${config.totalQuestions}`, sub: `${Math.round(cvc.clientPresence / config.totalQuestions * 100)}%` },
          { label: "Client SOV", value: `${clientSovPct}%`, sub: "of total mentions" },
          { label: "Top Rec Wins", value: `${totalClientTopRecs}`, sub: "times ranked #1" },
          { label: "URL Citations", value: `${totalClientCited}`, sub: "URLs linked" },
          { label: "Critical Gaps", value: `${gapSummary.CRITICAL || 0}`, sub: "no client brand", highlight: (gapSummary.CRITICAL || 0) > 0 },
          { label: "Avg Composite", value: `${avgComposite}/100`, sub: "across client brands" },
        ].map((kpi, i) => (
          <div key={i} className={`p-4 rounded-lg text-center ${kpi.highlight ? "bg-red-50 border border-red-200" : "bg-[#f0f7f4] border border-[#b7e4c7]"}`}>
            <div className={`text-2xl font-bold ${kpi.highlight ? "text-red-600" : "text-[#2d6a4f]"}`}>{kpi.value}</div>
            <div className="text-xs font-semibold text-[#1b4332] mt-1">{kpi.label}</div>
            <div className="text-[10px] text-[#6b7280] mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Key Findings */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-bold text-[#1b4332] mb-3">Key Findings</h2>
        <ul className="space-y-2">
          {findings.map((f, i) => (
            <li key={i} className="text-sm text-[#374151] flex gap-2">
              <span className="text-[#2d6a4f] font-bold mt-0.5">{i + 1}.</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Brand Comparison Table */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-bold text-[#1b4332] mb-3">Brand Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#2F5496] text-white">
                <th className="px-3 py-2 text-left">Brand</th>
                <th className="px-3 py-2">Group</th>
                <th className="px-3 py-2">Presence %</th>
                <th className="px-3 py-2">Mentions</th>
                <th className="px-3 py-2">Top Recs</th>
                <th className="px-3 py-2">URL Cites</th>
                <th className="px-3 py-2">Avg Rank</th>
                <th className="px-3 py-2">Sentiment</th>
                <th className="px-3 py-2">Composite</th>
              </tr>
            </thead>
            <tbody>
              {[...brandMetrics].sort((a, b) => b.compositeScore - a.compositeScore).map((b, i) => (
                <tr key={b.name} className={`border-b ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                  <td className={`px-3 py-2 font-medium ${b.group === "client" ? "text-[#2F5496]" : "text-[#C55A11]"}`}>{b.name}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${b.group === "client" ? "bg-[#d6e4f0] text-[#2F5496]" : "bg-[#fce4d6] text-[#C55A11]"}`}>
                      {b.group === "client" ? "Client" : "Competitor"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">{(b.presencePct * 100).toFixed(1)}%</td>
                  <td className="px-3 py-2 text-center">{b.mentions}</td>
                  <td className="px-3 py-2 text-center">{b.topRecs}</td>
                  <td className="px-3 py-2 text-center">{b.cited}</td>
                  <td className="px-3 py-2 text-center">{b.avgRank || "-"}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${b.sentimentScore > 0 ? "bg-green-100 text-green-700" : b.sentimentScore < 0 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {b.sentimentScore > 0 ? "Positive" : b.sentimentScore < 0 ? "Negative" : "Neutral"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center font-bold">{b.compositeScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Grid */}
      {!charts && (
        <div className="card p-6 mb-6 bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-800 font-medium">Charts could not be generated on the server. Download the PDF or Excel report for full visual analysis.</p>
        </div>
      )}
      {charts && (
        <div className="space-y-6 mb-6">
          <h2 className="text-lg font-bold text-[#1b4332]">Visual Analysis</h2>

          {/* Row 1: Presence + Mentions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <h3 className="text-sm font-bold text-[#1b4332] mb-1">Brand Presence</h3>
              <p className="text-xs text-[#6b7280] mb-3">Percentage of queries where each brand was mentioned by AI platforms. Higher presence means better visibility.</p>
              <img src={charts.brandPresence} alt="Brand Presence" className="w-full" />
            </div>
            <div className="card p-4">
              <h3 className="text-sm font-bold text-[#1b4332] mb-1">Total Mention Volume</h3>
              <p className="text-xs text-[#6b7280] mb-3">Total number of times each brand was mentioned across all responses. More mentions indicate stronger brand recognition by AI.</p>
              <img src={charts.totalMentions} alt="Total Mentions" className="w-full" />
            </div>
          </div>

          {/* Row 2: Citations + Top Recs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <h3 className="text-sm font-bold text-[#1b4332] mb-1">URL Citations</h3>
              <p className="text-xs text-[#6b7280] mb-3">Number of times AI platforms linked directly to each brand's website. Direct citations drive referral traffic.</p>
              <img src={charts.urlCitations} alt="URL Citations" className="w-full" />
            </div>
            <div className="card p-4">
              <h3 className="text-sm font-bold text-[#1b4332] mb-1">Top Recommendation Distribution</h3>
              <p className="text-xs text-[#6b7280] mb-3">Shows which brands are positioned as the #1 recommendation by AI platforms. Being listed first drives the most clicks.</p>
              <img src={charts.topRecommendationsPie} alt="Top Recommendations" className="w-full" />
            </div>
          </div>

          {/* Row 3: SOV + Gaps */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <h3 className="text-sm font-bold text-[#1b4332] mb-1">Client vs Competitor Share of Voice</h3>
              <p className="text-xs text-[#6b7280] mb-3">How much of the total brand mention volume belongs to your brands vs competitors. Larger share = more dominance in AI responses.</p>
              <img src={charts.clientVsCompetitorSov} alt="Client vs Competitor SOV" className="w-full" />
            </div>
            <div className="card p-4">
              <h3 className="text-sm font-bold text-[#1b4332] mb-1">Competitive Gap Analysis</h3>
              <p className="text-xs text-[#6b7280] mb-3">Categorizes queries by gap type. Critical gaps are where competitors appear but your brand is completely absent — these are priority opportunities.</p>
              <img src={charts.competitiveGaps} alt="Competitive Gaps" className="w-full" />
            </div>
          </div>

          {/* Row 4: Conversion + Rank */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <h3 className="text-sm font-bold text-[#1b4332] mb-1">Mention-to-Citation Conversion</h3>
              <p className="text-xs text-[#6b7280] mb-3">When a brand is mentioned, how often does the AI also link to its website? Higher conversion means AI trusts and promotes the brand's content.</p>
              <img src={charts.mentionToCitation} alt="Mention to Citation" className="w-full" />
            </div>
            <div className="card p-4">
              <h3 className="text-sm font-bold text-[#1b4332] mb-1">Average First-Mention Rank</h3>
              <p className="text-xs text-[#6b7280] mb-3">Where each brand typically appears first in AI responses. Lower rank (closer to 1) means the brand is mentioned earlier and more prominently.</p>
              <img src={charts.avgRankPosition} alt="Average Rank" className="w-full" />
            </div>
          </div>

          {/* Row 5: Sentiment + Scorecard */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <h3 className="text-sm font-bold text-[#1b4332] mb-1">Sentiment Distribution</h3>
              <p className="text-xs text-[#6b7280] mb-3">How AI platforms talk about each brand — positive, neutral, or negative sentiment. Based on language analysis of the surrounding context.</p>
              <img src={charts.sentimentDistribution} alt="Sentiment" className="w-full" />
            </div>
            <div className="card p-4">
              <h3 className="text-sm font-bold text-[#1b4332] mb-1">Brand AEO Scorecard</h3>
              <p className="text-xs text-[#6b7280] mb-3">Radar chart comparing brands across 6 dimensions: Presence, Citation, Sentiment, Top Recommendation, Mention Depth, and First-Mention Rate.</p>
              <img src={charts.brandScorecard} alt="Scorecard" className="w-full" />
            </div>
          </div>

          {/* Row 6: Category + Funnel (full width) */}
          <div className="card p-4">
            <h3 className="text-sm font-bold text-[#1b4332] mb-1">Brand Presence by Question Category</h3>
            <p className="text-xs text-[#6b7280] mb-3">Shows brand visibility across different query types (Best/Discovery, How-to, Trust, Comparison, etc.). Reveals which topics each brand dominates or is missing from.</p>
            <img src={charts.presenceByCategory} alt="Presence by Category" className="w-full" />
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-bold text-[#1b4332] mb-1">Brand Visibility Across Buyer Journey</h3>
            <p className="text-xs text-[#6b7280] mb-3">Maps brand presence to the buyer funnel stages: Awareness, Consideration, Decision, and Post-Purchase. Shows where brands appear at each stage of the customer journey.</p>
            <img src={charts.funnelAnalysis} alt="Funnel Analysis" className="w-full" />
          </div>
        </div>
      )}

      {/* Collapsible: Critical Gaps */}
      {gaps.length > 0 && (
        <div className="card p-6 mb-6">
          <button onClick={() => setShowGaps(!showGaps)} className="flex items-center gap-2 text-lg font-bold text-[#1b4332] cursor-pointer w-full text-left">
            <span className={`transition-transform ${showGaps ? "rotate-90" : ""}`}>&#9654;</span>
            Critical Gap Queries ({gaps.length})
          </button>
          {showGaps && (
            <div className="mt-4 space-y-2">
              {gaps.map((g, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg text-sm">
                  <span className="text-red-600 font-bold">{g.questionNum}.</span>
                  <div>
                    <p className="text-[#374151]">{g.question}</p>
                    <p className="text-xs text-[#6b7280] mt-1">
                      Category: {g.category} | Competitors present: {g.competitorsPresent.join(", ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collapsible: Category Breakdown */}
      <div className="card p-6 mb-6">
        <button onClick={() => setShowCategory(!showCategory)} className="flex items-center gap-2 text-lg font-bold text-[#1b4332] cursor-pointer w-full text-left">
          <span className={`transition-transform ${showCategory ? "rotate-90" : ""}`}>&#9654;</span>
          Category Breakdown
        </button>
        {showCategory && analysis.categoryMetrics && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#2F5496] text-white">
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2">Queries</th>
                  {[...config.clientBrands, ...config.competitorBrands].map(b => (
                    <th key={b} className="px-3 py-2">{b}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysis.categoryMetrics.map((c: any, i: number) => (
                  <tr key={c.category} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2 font-medium">{c.category}</td>
                    <td className="px-3 py-2 text-center">{c.questionCount}</td>
                    {[...config.clientBrands, ...config.competitorBrands].map(b => (
                      <td key={b} className="px-3 py-2 text-center">
                        {((c.brandPresence[b] || 0) * 100).toFixed(0)}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collapsible: Funnel Breakdown */}
      <div className="card p-6 mb-6">
        <button onClick={() => setShowFunnel(!showFunnel)} className="flex items-center gap-2 text-lg font-bold text-[#1b4332] cursor-pointer w-full text-left">
          <span className={`transition-transform ${showFunnel ? "rotate-90" : ""}`}>&#9654;</span>
          Funnel Stage Breakdown
        </button>
        {showFunnel && analysis.funnelMetrics && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#2F5496] text-white">
                  <th className="px-3 py-2 text-left">Stage</th>
                  <th className="px-3 py-2">Queries</th>
                  {[...config.clientBrands, ...config.competitorBrands].map(b => (
                    <th key={b} className="px-3 py-2">{b}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysis.funnelMetrics.map((f: any, i: number) => (
                  <tr key={f.stage} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2 font-medium">{f.stage}</td>
                    <td className="px-3 py-2 text-center">{f.questionCount}</td>
                    {[...config.clientBrands, ...config.competitorBrands].map(b => (
                      <td key={b} className="px-3 py-2 text-center">
                        {((f.brandPresence[b] || 0) * 100).toFixed(0)}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[#9ca3af] pb-8">
        Source: {config.platform} | <img src={getFlagUrl(COUNTRIES.find(c => c.name === config.country)?.code || "us")} alt="" width={16} height={12} className="inline-block" /> {config.country} | {config.date} | {config.totalQuestions} Queries Analyzed
      </div>
    </div>
  );
}
