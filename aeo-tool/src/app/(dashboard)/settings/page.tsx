"use client";

import { useEffect, useState } from "react";

const PROVIDERS = [
  { key: "openai", label: "ChatGPT (OpenAI)", description: "GPT-4o responses", color: "#2e7d32", bg: "#e8f5e9" },
  { key: "gemini", label: "Gemini (Google)", description: "Gemini 2.0 Flash responses", color: "#1565c0", bg: "#e3f2fd" },
  { key: "perplexity", label: "Perplexity", description: "Sonar Pro with citations", color: "#7b1fa2", bg: "#f3e5f5" },
  { key: "serpapi", label: "Google AI Overview (SerpAPI)", description: "AI Overviews from Google Search", color: "#e65100", bg: "#fff3e0" },
];

export default function SettingsPage() {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setKeys(data.apiKeys || {});
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(keys),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1b4332]">Settings</h1>
        <p className="text-[#6b7280] mt-1">Configure your API keys for each AI platform</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-[#d8f3dc] rounded w-1/3 mb-3" />
              <div className="h-10 bg-[#d8f3dc] rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {PROVIDERS.map((p) => (
              <div key={p.key} className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <h3 className="font-semibold text-[#1b4332]">{p.label}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: p.bg, color: p.color }}>
                    {keys[p.key] ? "Configured" : "Not Set"}
                  </span>
                </div>
                <p className="text-sm text-[#6b7280] mb-3">{p.description}</p>
                <input
                  type="password"
                  value={keys[p.key] || ""}
                  onChange={(e) => setKeys((prev) => ({ ...prev, [p.key]: e.target.value }))}
                  className="input-field"
                  placeholder={`Enter your ${p.label} API key`}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? (
                <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                "Save Settings"
              )}
            </button>
            {saved && (
              <span className="text-[#40916c] font-medium flex items-center gap-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Settings saved successfully
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
