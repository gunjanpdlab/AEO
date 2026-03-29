"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getFlag } from "@/lib/countries";

const PROVIDER_LABELS: Record<string, string> = {
  openai: "ChatGPT (OpenAI)",
  gemini: "Gemini (Google)",
  perplexity: "Perplexity",
  serpapi: "Google AI Overview",
};

const PROVIDER_COLORS: Record<string, { bg: string; text: string }> = {
  openai: { bg: "#e8f5e9", text: "#2e7d32" },
  gemini: { bg: "#e3f2fd", text: "#1565c0" },
  perplexity: { bg: "#f3e5f5", text: "#7b1fa2" },
  serpapi: { bg: "#fff3e0", text: "#e65100" },
};

interface Response {
  provider: string;
  text: string;
  status: string;
  error?: string;
}

interface Question {
  _id: string;
  text: string;
  responses: Response[];
}

interface QueryData {
  _id: string;
  title: string;
  country: string;
  countryCode: string;
  clientName: string;
  clientBrands: string[];
  competitorBrands: string[];
  status: string;
  questions: Question[];
  createdAt: string;
}

export default function QueryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [query, setQuery] = useState<QueryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const fetchQuery = () => {
    fetch(`/api/queries/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setQuery(data.query);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQuery();
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const keys = data.apiKeys || {};
        const admin = data.adminAvailable || {};
        const available = ["openai", "gemini", "perplexity", "serpapi"].filter(
          (p) => (keys[p] && keys[p] !== "") || admin[p]
        );
        setAvailableProviders(available);
        setSelectedProviders(available);
      });
  }, [id]);

  // Poll for updates while query is running
  useEffect(() => {
    if (!query || query.status !== "running") return;
    const interval = setInterval(fetchQuery, 3000);
    return () => clearInterval(interval);
  }, [query?.status]);

  const toggleProvider = (p: string) => {
    setSelectedProviders((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const runQuery = async () => {
    if (selectedProviders.length === 0) return;
    setRunning(true);
    await fetch(`/api/queries/${id}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providers: selectedProviders }),
    });
    fetchQuery();
    setRunning(false);
  };

  const downloadFile = (format: string) => {
    window.open(`/api/queries/${id}/download?format=${format}`, "_blank");
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-[#d8f3dc] rounded w-1/3" />
        <div className="h-6 bg-[#d8f3dc] rounded w-1/4" />
        <div className="card p-6 space-y-4">
          <div className="h-6 bg-[#d8f3dc] rounded w-full" />
          <div className="h-6 bg-[#d8f3dc] rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="card p-12 text-center">
        <h3 className="text-xl font-semibold text-[#1b4332]">Query not found</h3>
        <Link href="/" className="btn-primary mt-4 inline-flex">Back to Dashboard</Link>
      </div>
    );
  }

  const hasResults = query.questions.some((q) =>
    q.responses.some((r) => r.status === "completed")
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/" className="text-sm text-[#6b7280] hover:text-[#2d6a4f] mb-2 inline-flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[#1b4332] mt-1">{query.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-[#6b7280]">
            <span className="flex items-center gap-1">
              {getFlag(query.countryCode)} {query.country}
            </span>
            <span>{query.questions.length} questions</span>
            <span>{new Date(query.createdAt).toLocaleDateString()}</span>
            <span className={`font-medium ${
              query.status === "completed" ? "text-[#40916c]" :
              query.status === "running" ? "text-[#e65100]" : "text-[#6b7280]"
            }`}>
              {query.status}
            </span>
          </div>
          {query.clientBrands?.length > 0 && (
            <div className="flex gap-3 mt-2 text-xs">
              <span className="px-2 py-1 bg-[#d6e4f0] text-[#2F5496] rounded font-medium">
                {query.clientName || 'Client'}: {query.clientBrands.join(', ')}
              </span>
              <span className="px-2 py-1 bg-[#fce4d6] text-[#C55A11] rounded font-medium">
                Competitors: {query.competitorBrands?.join(', ')}
              </span>
            </div>
          )}
        </div>

        {hasResults && (
          <div className="flex gap-2">
            <button onClick={() => downloadFile("excel")} className="btn-secondary text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Excel
            </button>
            {query && query.clientBrands?.length > 0 && query.competitorBrands?.length > 0 && (
              <Link
                href={`/query/${id}/analysis`}
                className="text-sm px-4 py-2 rounded-lg bg-[#2F5496] text-white hover:bg-[#1F3864] transition-colors font-medium inline-flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 21H4.6c-.56 0-.84 0-1.05-.11a1 1 0 01-.44-.44C3 20.24 3 19.96 3 19.4V3M7 14l4-4 4 4 6-6" />
                </svg>
                Analyze
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Run Controls */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-[#1b4332] mb-3">Select Platforms to Query</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          {availableProviders.map((key) => {
            const label = PROVIDER_LABELS[key];
            const selected = selectedProviders.includes(key);
            const colors = PROVIDER_COLORS[key];
            return (
              <button
                key={key}
                onClick={() => toggleProvider(key)}
                className="px-4 py-2 rounded-xl font-medium text-sm transition-all border-2"
                style={{
                  backgroundColor: selected ? colors.bg : "white",
                  color: selected ? colors.text : "#6b7280",
                  borderColor: selected ? colors.text : "#e5e7eb",
                }}
              >
                {selected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="inline mr-1">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
                {label}
              </button>
            );
          })}
        </div>
        <button
          onClick={runQuery}
          disabled={running || selectedProviders.length === 0}
          className="btn-primary"
        >
          {running ? (
            <>
              <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              Running queries... This may take a minute.
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Run Query ({selectedProviders.length} platform{selectedProviders.length !== 1 ? "s" : ""})
            </>
          )}
        </button>
      </div>

      {/* Questions & Responses */}
      <div className="space-y-4">
        {query.questions.map((q, qi) => (
          <div key={q._id} className="card overflow-hidden">
            <button
              onClick={() => setExpandedQuestion(expandedQuestion === q._id ? null : q._id)}
              className="w-full p-6 text-left flex items-start gap-4 hover:bg-[#f0faf4] transition-colors"
            >
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d8f3dc] text-[#2d6a4f] font-bold flex items-center justify-center text-sm">
                {qi + 1}
              </span>
              <div className="flex-1">
                <h3 className="font-semibold text-[#1b4332]">{q.text}</h3>
                <div className="flex gap-2 mt-2">
                  {q.responses.map((r) => {
                    const colors = PROVIDER_COLORS[r.provider] || { bg: "#f3f4f6", text: "#6b7280" };
                    return (
                      <span
                        key={r.provider}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {r.status === "running" ? "..." : r.status === "error" ? "error" : PROVIDER_LABELS[r.provider]}
                      </span>
                    );
                  })}
                </div>
              </div>
              <svg
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"
                className={`transition-transform ${expandedQuestion === q._id ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {expandedQuestion === q._id && (
              <div className="border-t border-[#d8f3dc]">
                {q.responses.length === 0 ? (
                  <div className="p-6 text-center text-[#6b7280]">
                    No responses yet. Click &ldquo;Run Query&rdquo; to get answers.
                  </div>
                ) : (
                  q.responses.map((r) => {
                    const colors = PROVIDER_COLORS[r.provider] || { bg: "#f3f4f6", text: "#6b7280" };
                    return (
                      <div key={r.provider} className="p-6 border-b border-[#d8f3dc] last:border-b-0">
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className="provider-badge"
                            style={{ backgroundColor: colors.bg, color: colors.text }}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.text }} />
                            {PROVIDER_LABELS[r.provider]}
                          </span>
                          <span className={`text-xs font-medium status-${r.status}`}>
                            {r.status}
                          </span>
                        </div>
                        {r.status === "completed" ? (
                          <div className="prose prose-sm max-w-none text-[#374151] whitespace-pre-wrap leading-relaxed">
                            {r.text}
                          </div>
                        ) : r.status === "error" ? (
                          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                            Error: {r.error}
                          </div>
                        ) : r.status === "running" ? (
                          <div className="flex items-center gap-2 text-[#e65100]">
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-[#e65100] border-t-transparent rounded-full" />
                            Fetching response...
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
