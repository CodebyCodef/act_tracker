"use client";

import { useEffect, useState } from "react";

export default function AISummaryPage() {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((p) => {
        if (Array.isArray(p) && p.length > 0) {
          setProjects(p);
          setProjectId(p[0].id);
        }
      });
  }, []);

  const generateSummary = async () => {
    if (!projectId) return;
    setLoading(true);
    setSummary("");
    try {
      const res = await fetch(`/api/analytics/summarize?projectId=${projectId}&days=${days}`);
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setSummary("Failed to generate summary. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Summary</h1>
          <p className="text-gray-400 mt-1">
            Get AI-powered insights about your analytics data
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={generateSummary}
            disabled={loading || !projectId}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
          >
            {loading ? "Generating..." : "Generate Summary"}
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Analyzing your data with AI...</span>
          </div>
        ) : summary ? (
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">{summary}</div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-2">No summary generated yet</p>
            <p className="text-gray-500">
              Select a project and time range, then click &quot;Generate Summary&quot; to get AI-powered insights
              about product usage, ad performance, and page attention.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
