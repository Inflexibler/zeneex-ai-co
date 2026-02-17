"use client";

import { useState, useEffect } from "react";
import { User, Project } from "@/lib/types";
import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Loader from "@/components/Loader";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    name: "",
    description: "",
    prompt: "",
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, projectsRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/projects"),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUser(profileData.data);
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProjectData),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      setShowNewProject(false);
      setNewProjectData({ name: "", description: "", prompt: "" });
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader size="lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">
                  Welcome back, {user?.name || "User"}!
                </h1>
                <p className="mt-2 text-neutral-600">Manage your website projects</p>
              </div>
              <Button
                onClick={() => setShowNewProject(true)}
                variant="primary"
              >
                + New Project
              </Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[
              { label: "Total Projects", value: projects.length, icon: "📦" },
              { label: "Completed", value: projects.filter((p) => p.status === "completed").length, icon: "✅" },
              { label: "In Progress", value: projects.filter((p) => p.status === "processing").length, icon: "⏳" },
              { label: "Failed", value: projects.filter((p) => p.status === "failed").length, icon: "❌" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl bg-white p-6 shadow-sm border border-neutral-200"
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-neutral-900">{stat.value}</div>
                <div className="text-sm text-neutral-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-neutral-200"
          >
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">Recent Projects</h2>
            </div>

            {projects.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  No projects yet
                </h3>
                <p className="text-neutral-600 mb-6">
                  Create your first AI-powered website today
                </p>
                <Button onClick={() => setShowNewProject(true)} variant="primary">
                  Create Your First Project
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {projects.map((project) => (
                  <div key={project.id} className="px-6 py-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link
                          href={`/editor/${project.id}`}
                          className="text-lg font-semibold text-neutral-900 hover:text-primary"
                        >
                          {project.name}
                        </Link>
                        <p className="text-sm text-neutral-600 mt-1">{project.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            project.status === "completed"
                              ? "bg-success/10 text-success"
                              : project.status === "processing"
                              ? "bg-warning/10 text-warning"
                              : project.status === "failed"
                              ? "bg-error/10 text-error"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {project.status}
                        </span>
                        <Link href={`/editor/${project.id}`}>
                          <Button variant="outline" size="sm">
                            Open
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"
          >
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={newProjectData.name}
                  onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-primary focus:ring-primary focus:outline-none"
                  placeholder="My Awesome Website"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  required
                  rows={3}
                  value={newProjectData.description}
                  onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-primary focus:ring-primary focus:outline-none resize-none"
                  placeholder="A brief description of your website"
                />
              </div>
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-neutral-700 mb-1">
                  AI Prompt
                </label>
                <textarea
                  id="prompt"
                  required
                  rows={4}
                  value={newProjectData.prompt}
                  onChange={(e) => setNewProjectData({ ...newProjectData, prompt: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-primary focus:ring-primary focus:outline-none resize-none"
                  placeholder="Describe what you want your website to look like and do..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewProject(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  Create Project
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}
