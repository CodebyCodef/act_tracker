"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AdData {
  ads: Array<{ name: string; position: string; views: number; clicks: number; ctr: string }>;
  dailyTrend: Array<{ date: string; type: string; count: number }>;
  totalViews: number;
  totalClicks: number;
}

export default function AdsPage() {
  const [data, setData] = useState<AdData | null>(null);
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
    fetch(`/api/analytics/ad-attention?projectId=${projectId}&days=${days}`)
      .then((r) => {
        if (!r.ok) throw new Error(`API returned ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((err) => {
        console.error("Ad attention fetch error:", err);
        setError(err.message);
      });
  }, [projectId, days]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Ad Attention</h1>
          <p className="text-gray-400 mt-1">Track which ads are getting the most engagement</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm">Total Views</p>
              <p className="text-3xl font-bold text-white">{data.totalViews}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm">Total Clicks</p>
              <p className="text-3xl font-bold text-white">{data.totalClicks}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm">Average CTR</p>
              <p className="text-3xl font-bold text-blue-400">
                {data.totalViews > 0
                  ? ((data.totalClicks / data.totalViews) * 100).toFixed(2) + "%"
                  : "0.00%"}
              </p>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Ad Performance</h3>
            {data.ads && data.ads.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.ads}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }}
                    labelStyle={{ color: "#F9FAFB" }}
                  />
                  <Bar dataKey="views" fill="#3B82F6" name="Views" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" fill="#10B981" name="Clicks" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400">No ad data yet. Track AD_VIEW and AD_CLICK events via the SDK.</p>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">Ad</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">Position</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">Views</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">Clicks</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">CTR</th>
                </tr>
              </thead>
              <tbody>
                {data.ads.map((ad, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="px-6 py-4 text-white">{ad.name}</td>
                    <td className="px-6 py-4 text-gray-400">{ad.position}</td>
                    <td className="px-6 py-4 text-gray-300">{ad.views}</td>
                    <td className="px-6 py-4 text-gray-300">{ad.clicks}</td>
                    <td className="px-6 py-4 text-blue-400">{ad.ctr}%</td>
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
