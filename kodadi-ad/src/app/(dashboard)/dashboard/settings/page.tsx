"use client";

import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
  domain: string;
  apiKey: string;
}

export default function SettingsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      });
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your projects and API keys</p>
      </div>

      {projects.map((project) => (
        <div key={project.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-1">{project.name}</h3>
          <p className="text-gray-400 text-sm mb-4">{project.domain}</p>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">API Key</label>
            <div className="flex gap-2">
              <code className="flex-1 bg-gray-800 px-4 py-2 rounded-lg text-blue-400 text-sm overflow-x-auto">
                {project.apiKey}
              </code>
              <button
                onClick={() => copyToClipboard(project.apiKey, project.id)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                {copied === project.id ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Integration Code</label>
            <div className="bg-gray-800 rounded-lg p-4">
              <pre className="text-sm text-gray-300 overflow-x-auto">
{`<script src="${typeof window !== "undefined" ? window.location.origin : ""}/sdk.js" data-api-key="${project.apiKey}"></script>`}
              </pre>
              <button
                onClick={() =>
                  copyToClipboard(
                    `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/sdk.js" data-api-key="${project.apiKey}"></script>`,
                    `code-${project.id}`
                  )
                }
                className="mt-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
              >
                {copied === `code-${project.id}` ? "Copied!" : "Copy Code"}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">Custom Event Tracking</label>
            <div className="bg-gray-800 rounded-lg p-4">
              <pre className="text-sm text-gray-300 overflow-x-auto">
{`// Track product views
kodadi.track('PRODUCT_VIEW', { product: 'Widget Pro', id: '123' });

// Track ad interactions
kodadi.track('AD_VIEW', { adId: 'banner-001', position: 'hero' });
kodadi.track('AD_CLICK', { adId: 'banner-001' });

// Track custom events
kodadi.track('CUSTOM', { action: 'signup', plan: 'pro' });`}
              </pre>
            </div>
          </div>
        </div>
      ))}

      {projects.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400">No projects yet. Create a project from the dashboard.</p>
        </div>
      )}
    </div>
  );
}
