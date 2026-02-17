'use client';

import { useCallback, useEffect, useState } from 'react';

interface VerifyResponse {
  success: boolean;
  message: string;
  code?: string;
}

export default function VerifyPage() {
  const [code, setCode] = useState('');
  const [response, setResponse] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch verification data
      const res = await fetch('/api/verify');
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleVerify = async () => {
    if (!code) {
      setError('Please enter verification code');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setResponse(data);
      if (data.success) {
        setCode('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-6">Verify Email</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500 text-white rounded">
            {error}
          </div>
        )}

        {response?.success && (
          <div className="mb-4 p-3 bg-green-500 text-white rounded">
            {response.message}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
          />

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
}
