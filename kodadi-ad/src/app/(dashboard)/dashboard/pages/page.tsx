"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PageData {
  pages: Array<{
    page: string;
    views: number;
    topElements: Array<{ element: string; clicks: number }>;
  }>;
  timeOnPage: Array<{ page: string; avg_duration: number; sessions: number }>;
  clickDensity: Array<{ page: string; element: string; count: number }>;
}

export default function PagesPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [error, setError] = useState("");
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

  useEffect(() => {
    if (!projectId) return;
    setError("");
    fetch(`/api/analytics/page-attention?projectId=${projectId}&days=${days}`)
      .then((r) => {
        if (!r.ok) throw new Error(`API returned ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((err) => {
        console.error("Page attention fetch error:", err);
        setError(err.message);
      });
  }, [projectId, days]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Page Attention</h1>
          <p className="text-gray-400 mt-1">See which pages get the most engagement</p>
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
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-xl p-4 mb-6">
          <p className="text-red-300">Error: {error}</p>
        </div>
      )}

      {data && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Page Views</h3>
              {data.pages && data.pages.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.pages}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="page" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }}
                      labelStyle={{ color: "#F9FAFB" }}
                    />
                    <Bar dataKey="views" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400">No page data yet.</p>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Time on Page (seconds)</h3>
              {data.timeOnPage && data.timeOnPage.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.timeOnPage.map((t) => ({ ...t, avg_duration: Number(t.avg_duration) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="page" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }}
                      labelStyle={{ color: "#F9FAFB" }}
                    />
                    <Bar dataKey="avg_duration" fill="#10B981" name="Avg Duration" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400">No time-on-page data yet. Track TIME_ON_PAGE events via the SDK.</p>
              )}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <h3 className="text-lg font-semibold text-white p-6 pb-4">Page Details</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">Page</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">Views</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">Top Clicked Elements</th>
                </tr>
              </thead>
              <tbody>
                {data.pages.map((p, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="px-6 py-4 text-white">{p.page}</td>
                    <td className="px-6 py-4 text-gray-300">{p.views}</td>
                    <td className="px-6 py-4">
                      {p.topElements.length > 0 ? (
                        <div className="flex gap-2 flex-wrap">
                          {p.topElements.map((el, j) => (
                            <span key={j} className="text-xs bg-gray-800 px-2 py-1 rounded text-blue-400">
                              {el.element} ({el.clicks})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">No clicks recorded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
