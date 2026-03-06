"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";

export default function NewQueryPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState("United States");
  const [countryCode, setCountryCode] = useState("us");
  const [questionsText, setQuestionsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCountryChange = (code: string) => {
    const c = COUNTRIES.find((c) => c.code === code);
    setCountryCode(code);
    setCountry(c?.name || code);
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
    setLoading(true);
    const res = await fetch("/api/queries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, country, countryCode, questions }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push(`/query/${data.id}`);
    } else {
      setError(data.error || "Failed to create query");
    }
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
        <h1 className="text-3xl font-bold text-[#1b4332]">New Query</h1>
        <p className="text-[#6b7280] mt-1">Enter your questions to audit across AI platforms</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="card p-6">
          <label className="block text-sm font-semibold text-[#1b4332] mb-2">Query Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="e.g., Toyota Parts Full Audit"
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
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          <p className="text-xs text-[#6b7280] mt-2">
            Responses will be tailored to this country. SerpAPI will use the corresponding region code.
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
            placeholder={`Enter one question per line, e.g.:\n\nIs it normal for Toyota parts to cost different amounts at different Toyota dealers?\nWhy doesn't Toyota show a single national price for parts on autoparts.toyota.com?\nHow do I find the cheapest Toyota dealer for the same OEM part online?\n\nOr upload a CSV/Excel file with questions in the first column.`}
            required
          />
          <p className="text-xs text-[#6b7280] mt-2">One question per line, or upload a CSV/Excel file with questions in the first column.</p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4v16m8-8H4" />
              </svg>
              Create Query
            </>
          )}
        </button>
      </form>
    </div>
  );
}
