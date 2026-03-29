"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES, getFlag } from "@/lib/countries";

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

export default function NewQueryPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState("United States");
  const [countryCode, setCountryCode] = useState("us");
  const [clientName, setClientName] = useState("");
  const [clientBrandsText, setClientBrandsText] = useState("");
  const [competitorBrandsText, setCompetitorBrandsText] = useState("");
  const [questionsText, setQuestionsText] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<string[]>(["openai", "gemini"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCountryChange = (code: string) => {
    const c = COUNTRIES.find((c) => c.code === code);
    setCountryCode(code);
    setCountry(c?.name || code);
  };

  const toggleProvider = (p: string) => {
    setSelectedProviders((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const questions = questionsText
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);
    if (questions.length === 0) {
      setError("Please enter at least one question");
      return;
    }
    if (selectedProviders.length === 0) {
      setError("Please select at least one platform");
      return;
    }
    setLoading(true);

    // Step 1: Create the report
    const res = await fetch("/api/queries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, country, countryCode, questions,
        clientName,
        clientBrands: clientBrandsText.split(',').map(b => b.trim()).filter(Boolean),
        competitorBrands: competitorBrandsText.split(',').map(b => b.trim()).filter(Boolean),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create report");
      setLoading(false);
      return;
    }

    // Step 2: Auto-run the query
    fetch(`/api/queries/${data.id}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providers: selectedProviders }),
    });

    // Redirect immediately — responses will populate in the background
    router.push(`/query/${data.id}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/queries/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to parse file");
      } else {
        const existing = questionsText.trim();
        const newQuestions = data.questions.join("\n");
        setQuestionsText(existing ? existing + "\n" + newQuestions : newQuestions);
      }
    } catch {
      setError("Failed to upload file");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const questionCount = questionsText
    .split("\n")
    .filter((q) => q.trim()).length;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1b4332]">New Report</h1>
        <p className="text-[#6b7280] mt-1">Enter your questions to audit across AI platforms</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="card p-6">
          <label className="block text-sm font-semibold text-[#1b4332] mb-2">Report Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="e.g., Finance & Investment India Audit"
            required
          />
        </div>

        <div className="card p-6">
          <label className="block text-sm font-semibold text-[#1b4332] mb-2">Target Country / Geography</label>
          <select
            value={countryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="input-field"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{getFlag(c.code)} {c.name}</option>
            ))}
          </select>
          <p className="text-xs text-[#6b7280] mt-2">
            Responses will be tailored to this country. No VPN needed.
          </p>
        </div>

        <div className="card p-6">
          <label className="block text-sm font-semibold text-[#1b4332] mb-4">Brand Configuration</label>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#6b7280] mb-1">Client Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="input-field"
                placeholder="e.g., PeopleConnect"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7280] mb-1">Client Brands (comma-separated)</label>
              <input
                type="text"
                value={clientBrandsText}
                onChange={(e) => setClientBrandsText(e.target.value)}
                className="input-field"
                placeholder="e.g., TruthFinder, Instant Checkmate, Intelius"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7280] mb-1">Competitor Brands (comma-separated)</label>
              <input
                type="text"
                value={competitorBrandsText}
                onChange={(e) => setCompetitorBrandsText(e.target.value)}
                className="input-field"
                placeholder="e.g., Whitepages, BeenVerified, Spokeo"
              />
            </div>
          </div>
          <p className="text-xs text-[#6b7280] mt-2">
            These brands will be tracked in the AEO analysis. You can leave this blank and set it later.
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-[#1b4332]">Questions</label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs px-3 py-1.5 rounded-lg border border-[#b7e4c7] text-[#2d6a4f] hover:bg-[#d8f3dc] transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
              >
                {uploading ? (
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-[#2d6a4f] border-t-transparent rounded-full" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                )}
                Upload CSV / Excel
              </button>
              <span className="text-xs text-[#6b7280] px-2 py-1 bg-[#d8f3dc] rounded-full">
                {questionCount} question{questionCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <textarea
            value={questionsText}
            onChange={(e) => setQuestionsText(e.target.value)}
            className="input-field min-h-[300px] font-mono text-sm"
            placeholder={`Enter one question per line, e.g.:\n\nWhat are the best SEO tools for small businesses?\nWhich email marketing platforms are most recommended?\nWhat is the best CRM software for startups?\n\nOr upload a CSV/Excel file with questions in the first column.`}
            required
          />
          <p className="text-xs text-[#6b7280] mt-2">One question per line, or upload a CSV/Excel file with questions in the first column.</p>
        </div>

        <div className="card p-6">
          <label className="block text-sm font-semibold text-[#1b4332] mb-3">Select Platforms to Query</label>
          <div className="flex flex-wrap gap-3">
            {Object.entries(PROVIDER_LABELS).map(([key, label]) => {
              const selected = selectedProviders.includes(key);
              const colors = PROVIDER_COLORS[key];
              return (
                <button
                  key={key}
                  type="button"
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
          <p className="text-xs text-[#6b7280] mt-2">
            Selected platforms will be queried immediately after creating the report.
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <>
              <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              Creating & running...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Create & Run Report ({selectedProviders.length} platform{selectedProviders.length !== 1 ? "s" : ""})
            </>
          )}
        </button>
      </form>
    </div>
  );
}
