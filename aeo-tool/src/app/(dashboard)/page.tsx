"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface QueryItem {
  id: string;
  title: string;
  country: string;
  status: string;
  questionCount: number;
  createdAt: string;
}

export default function DashboardPage() {
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/queries")
      .then((r) => r.json())
      .then((data) => {
        setQueries(data.queries || []);
        setLoading(false);
      });
  }, []);

  const deleteQuery = async (id: string) => {
    if (!confirm("Delete this query?")) return;
    await fetch("/api/queries", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setQueries((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1b4332]">Dashboard</h1>
          <p className="text-[#6b7280] mt-1">Your AI response audits</p>
        </div>
        <Link href="/query/new" className="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4v16m8-8H4" />
          </svg>
          New Report
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-[#d8f3dc] rounded w-3/4 mb-3" />
              <div className="h-4 bg-[#d8f3dc] rounded w-1/2 mb-2" />
              <div className="h-4 bg-[#d8f3dc] rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : queries.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#d8f3dc] mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[#1b4332] mb-2">No queries yet</h3>
          <p className="text-[#6b7280] mb-6">Create your first AEO audit query to get started</p>
          <Link href="/query/new" className="btn-primary">Create First Query</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queries.map((q) => (
            <div key={q.id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <Link href={`/query/${q.id}`} className="text-lg font-semibold text-[#1b4332] hover:text-[#2d6a4f]">
                  {q.title}
                </Link>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  q.status === "completed" ? "bg-[#d8f3dc] text-[#2d6a4f]" :
                  q.status === "running" ? "bg-[#fff3e0] text-[#e65100]" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {q.status}
                </span>
              </div>
              <div className="space-y-2 text-sm text-[#6b7280]">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                  </svg>
                  {q.country}
                </div>
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {q.questionCount} question{q.questionCount !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {new Date(q.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-[#d8f3dc]">
                <Link href={`/query/${q.id}`} className="btn-secondary text-sm !py-2 !px-3 flex-1 justify-center">
                  View
                </Link>
                <button onClick={() => deleteQuery(q.id)} className="btn-danger text-sm !py-2 !px-3">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
