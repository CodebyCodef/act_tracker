"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatCard from "@/components/StatCard";

interface Project {
  id: string;
  name: string;
  domain: string;
  apiKey: string;
  _count: { sessions: number; events: number };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/projects")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setProjects(data);
            if (data.length > 0 && !selectedProject) {
              setSelectedProject(data[0].id);
            }
          }
        });
    }
  }, [status, selectedProject]);

  const createProject = async () => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, domain: newDomain }),
    });
    if (res.ok) {
      setShowCreate(false);
      setNewName("");
      setNewDomain("");
      fetch("/api/projects")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setProjects(data);
            if (data.length > 0) setSelectedProject(data[0].id);
          }
        });
    }
  };

  if (status === "loading") {
    return <div className="text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          + New Project
        </button>
      </div>

      {showCreate && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Project</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Project Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="My Website"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Domain</label>
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="example.com"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={createProject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-4">
            No projects yet. Create your first project to start tracking.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Sessions"
              value={projects.reduce((sum, p) => sum + p._count.sessions, 0)}
            />
            <StatCard
              title="Total Events"
              value={projects.reduce((sum, p) => sum + p._count.events, 0)}
            />
            <StatCard title="Projects" value={projects.length} />
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">
                    Project
                  </th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">
                    Domain
                  </th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">
                    Sessions
                  </th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">
                    Events
                  </th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">
                    API Key
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b border-gray-800/50">
                    <td className="px-6 py-4 text-white font-medium">{project.name}</td>
                    <td className="px-6 py-4 text-gray-400">{project.domain}</td>
                    <td className="px-6 py-4 text-gray-300">{project._count.sessions}</td>
                    <td className="px-6 py-4 text-gray-300">{project._count.events}</td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-800 px-2 py-1 rounded text-blue-400">
                        {project.apiKey.substring(0, 12)}...
                      </code>
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
