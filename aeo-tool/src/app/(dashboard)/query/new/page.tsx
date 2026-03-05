"use client";

import { useState } from "react";
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
            <span className="text-xs text-[#6b7280] px-2 py-1 bg-[#d8f3dc] rounded-full">
              {questionCount} question{questionCount !== 1 ? "s" : ""}
            </span>
          </div>
          <textarea
            value={questionsText}
            onChange={(e) => setQuestionsText(e.target.value)}
            className="input-field min-h-[300px] font-mono text-sm"
            placeholder={`Enter one question per line, e.g.:\n\nIs it normal for Toyota parts to cost different amounts at different Toyota dealers?\nWhy doesn't Toyota show a single national price for parts on autoparts.toyota.com?\nHow do I find the cheapest Toyota dealer for the same OEM part online?`}
            required
          />
          <p className="text-xs text-[#6b7280] mt-2">One question per line. Each question will be sent to all selected AI platforms.</p>
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
