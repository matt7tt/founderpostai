'use client';

import { useState } from 'react';

interface UpgradePromptProps {
  used: number;
  limit: number;
  onClose: () => void;
}

export default function UpgradePrompt({
  used,
  limit,
  onClose,
}: UpgradePromptProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md">
        <h2 className="text-2xl font-bold mb-4">Upgrade to Pro</h2>
        <p className="text-gray-600 mb-6">
          You&apos;ve used {used} of {limit} posts this month. Get unlimited posts
          with Pro.
        </p>

        <div className="bg-blue-50 p-4 rounded mb-6">
          <h3 className="font-bold text-lg mb-3">FounderPostAI Pro</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>✓ 50 posts per month</li>
            <li>✓ All tone options</li>
            <li>✓ All post types</li>
            <li>✓ Priority support</li>
          </ul>
          <p className="text-2xl font-bold mt-4">$9<span className="text-lg">/month</span></p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded border border-gray-300 hover:bg-gray-50"
          >
            Maybe later
          </button>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="flex-1 py-2 px-4 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Upgrade Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
