'use client';

import { useState } from 'react';

export default function TestPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Since auth is removed, we'll use a placeholder user ID.
  const userId = 'test-user';

  const runTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userId }),
      });
      
      const result = await response.json();
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setTestResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Processing Pipeline</h1>
      <button
        onClick={runTest}
        disabled={loading}
        className="bg-cyan-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Running Test...' : 'Run Complete Test'}
      </button>
      
      {testResult && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Test Results:</h2>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded">{testResult}</pre>
        </div>
      )}
    </div>
  );
}
