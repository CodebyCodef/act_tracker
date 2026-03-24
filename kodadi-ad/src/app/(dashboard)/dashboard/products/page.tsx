"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ProductData {
  products: Array<{ name: string; views: number; interactions: number }>;
  dailyTrend: Array<{ date: string; count: number }>;
  totalEvents: number;
}

export default function ProductsPage() {
  const [data, setData] = useState<ProductData | null>(null);
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
    fetch(`/api/analytics/product-usage?projectId=${projectId}&days=${days}`)
      .then((r) => {
        if (!r.ok) throw new Error(`API returned ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((err) => {
        console.error("Product usage fetch error:", err);
        setError(err.message);
      });
  }, [projectId, days]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Product Usage</h1>
          <p className="text-gray-400 mt-1">Track which products get the most attention</p>
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
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Total Product Events</h3>
            <p className="text-4xl font-bold text-blue-400">{data.totalEvents}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Top Products</h3>
            {data.products && data.products.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.products}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }}
                    labelStyle={{ color: "#F9FAFB" }}
                  />
                  <Bar dataKey="views" fill="#3B82F6" name="Views" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="interactions" fill="#10B981" name="Interactions" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400">No product data yet. Track PRODUCT_VIEW events via the SDK.</p>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">Product</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">Views</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm">Interactions</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((p, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="px-6 py-4 text-white">{p.name}</td>
                    <td className="px-6 py-4 text-gray-300">{p.views}</td>
                    <td className="px-6 py-4 text-gray-300">{p.interactions}</td>
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
