'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/Button';

interface EditorData {
  projectId: string;
  projectName: string;
  code: string;
  preview: string;
}

export default function EditorPage() {
  const [data, setData] = useState<EditorData | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      const projectId = window.location.pathname.split('/').pop();
      const res = await fetch(`/api/projects/${projectId}`);
      const projectData = await res.json();
      setData(projectData);
    } catch (err) {
      console.error('Failed to fetch project:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleGenerate = async () => {
    if (!prompt) {
      alert('Please enter a prompt');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: data?.projectId,
          prompt,
        }),
      });

      const result = await res.json();
      setGeneratedCode(result.code);
      setPrompt('');
    } catch (err) {
      console.error('Generation failed:', err);
      alert('Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedCode) {
      alert('No code to save');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${data?.projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: generatedCode }),
      });

      if (res.ok) {
        alert('Code saved successfully');
      } else {
        alert('Failed to save code');
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${data?.projectId}/deploy`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('Deployment started');
      } else {
        alert('Failed to deploy');
      }
    } catch (err) {
      console.error('Deploy failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">{data?.projectName}</h1>
        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={loading || !generatedCode}
            variant="secondary"
          >
            Save
          </Button>
          <Button
            onClick={handleDeploy}
            disabled={loading}
            variant="primary"
          >
            Deploy
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4">
        {/* Left Panel - Prompt */}
        <div className="w-1/3 bg-slate-800 rounded-lg p-6 flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-4">Generate Code</h2>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to build..."
            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none resize-none mb-4"
          />

          <Button
            onClick={handleGenerate}
            disabled={loading}
            variant="primary"
            className="w-full"
          >
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        </div>

        {/* Right Panel - Code Preview */}
        <div className="w-2/3 bg-slate-800 rounded-lg p-6 flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-4">Generated Code</h2>

          <div className="flex-1 bg-slate-700 rounded p-4 overflow-auto mb-4">
            {generatedCode ? (
              <pre className="text-slate-300 text-sm font-mono whitespace-pre-wrap break-words">
                {generatedCode}
              </pre>
            ) : (
              <p className="text-slate-400">Generated code will appear here...</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setGeneratedCode(null)}
              disabled={!generatedCode}
              variant="secondary"
              className="flex-1"
            >
              Clear
            </Button>
            <Button
              onClick={() => {
                if (generatedCode) {
                  navigator.clipboard.writeText(generatedCode);
                  alert('Copied to clipboard');
                }
              }}
              disabled={!generatedCode}
              variant="secondary"
              className="flex-1"
            >
              Copy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
