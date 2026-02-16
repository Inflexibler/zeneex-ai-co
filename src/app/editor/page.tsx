"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Loader from "@/components/Loader";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<any>(null);
  const [code, setCode] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.data);
        if (data.data.status === "processing") {
          startPolling();
        }
      } else if (response.status === 401) {
        router.push("/login");
      } else if (response.status === 404) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to fetch project:", error);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/ai/status?projectId=${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setGenerationStatus(data.data.generation);
          setProject(data.data.project);

          if (data.data.project.status === "completed") {
            clearInterval(pollInterval);
            setGenerating(false);
            fetchProjectData();
          } else if (data.data.project.status === "failed") {
            clearInterval(pollInterval);
            setGenerating(false);
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerationStatus({ stage: "initializing", progress: 0, currentStep: "Starting..." });

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          description: project.description,
        }),
      });

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const data = await response.json();
      setGenerationStatus(data.data);

      if (data.data.status === "completed") {
        setGenerating(false);
        fetchProjectData();
      } else {
        startPolling();
      }
    } catch (error) {
      setGenerating(false);
      console.error("Generation error:", error);
      alert("Failed to generate website. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader size="lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col">
      <Header />

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="bg-neutral-800 border-b border-neutral-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-white font-semibold">{project?.name}</h1>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  project?.status === "completed"
                    ? "bg-success/20 text-success"
                    : project?.status === "processing"
                    ? "bg-warning/20 text-warning"
                    : project?.status === "failed"
                    ? "bg-error/20 text-error"
                    : "bg-neutral-700 text-neutral-300"
                }`}
              >
                {project?.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAiPanel(!showAiPanel)}
                className="border-neutral-600 text-white hover:bg-neutral-700"
              >
                AI Assistant
              </Button>
              {project?.status === "queued" && (
                <Button variant="primary" size="sm" onClick={handleGenerate} disabled={generating}>
                  {generating ? <Loader size="sm" /> : "Generate Website"}
                </Button>
              )}
              {project?.status === "completed" && project?.github_repo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://github.com/${project.github_repo}`, "_blank")}
                  className="border-neutral-600 text-white hover:bg-neutral-700"
                >
                  View on GitHub
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="border-neutral-600 text-white hover:bg-neutral-700"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 p-4 overflow-auto">
              <div className="bg-neutral-800 rounded-lg h-full p-4 font-mono text-sm text-neutral-300 overflow-auto">
                {project?.status === "completed" ? (
                  <pre>{code || "// Generated code will appear here"}</pre>
                ) : project?.status === "processing" || generating ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader size="lg" />
                    <p className="mt-4 text-neutral-400">
                      {generationStatus?.currentStep || "Generating your website..."}
                    </p>
                    {generationStatus?.progress !== undefined && (
                      <div className="mt-4 w-64">
                        <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${generationStatus.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">
                          {generationStatus.progress}% complete
                        </p>
                      </div>
                    )}
                  </div>
                ) : project?.status === "failed" ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h3 className="text-xl font-semibold text-error mb-2">Generation Failed</h3>
                    <p className="text-neutral-400 max-w-md">
                      {project?.error_message || "An error occurred while generating your website."}
                    </p>
                    <Button variant="primary" className="mt-6" onClick={handleGenerate}>
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-6xl mb-4">🚀</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Ready to Generate</h3>
                    <p className="text-neutral-400 max-w-md mb-6">
                      Click the "Generate Website" button to start creating your AI-powered website.
                    </p>
                    <Button variant="primary" onClick={handleGenerate}>
                      Generate Website
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="w-80 bg-neutral-800 border-l border-neutral-700 flex flex-col">
              <div className="p-4 border-b border-neutral-700">
                <h3 className="text-white font-semibold">AI Assistant</h3>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                <div className="space-y-4">
                  <div className="bg-neutral-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🤖</span>
                      <span className="text-white font-medium text-sm">Architecture</span>
                    </div>
                    <p className="text-neutral-400 text-xs">
                      AI will design the optimal architecture for your website based on your
                      requirements.
                    </p>
                  </div>
                  <div className="bg-neutral-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💻</span>
                      <span className="text-white font-medium text-sm">Code Generation</span>
                    </div>
                    <p className="text-neutral-400 text-xs">
                      Production-ready React components with modern best practices.
                    </p>
                  </div>
                  <div className="bg-neutral-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🚀</span>
                      <span className="text-white font-medium text-sm">Deployment</span>
                    </div>
                    <p className="text-neutral-400 text-xs">
                      Automatic GitHub repository creation with your generated code.
                    </p>
                  </div>
                </div>
              </div>
              {project?.github_repo && (
                <div className="p-4 border-t border-neutral-700">
                  <div className="bg-neutral-700 rounded-lg p-3">
                    <p className="text-neutral-400 text-xs mb-2">Repository</p>
                    <p className="text-white text-sm font-mono">{project.github_repo}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
