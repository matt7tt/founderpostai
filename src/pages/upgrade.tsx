'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SeoHead from '../components/SeoHead';

export default function Upgrade() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-linkedin"></div>
      </div>
    );
  }

  if (!session) return null;

  const handleUpgrade = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed');
      setLoading(false);
    }
  };

  return (
    <>
      <SeoHead title="Upgrade to Pro | FounderPostAI" path="/upgrade" noIndex />
      <div className="min-h-screen bg-gray-50">
        {/* Nav */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-linkedin">
              FounderPostAI
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </nav>

        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upgrade to Pro</h1>
          <p className="text-xl text-gray-600 mb-12">
            Unlock 50 LinkedIn post generations per month.
          </p>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg p-10 mb-8 border border-gray-100">
            <div className="inline-block bg-linkedin/10 text-linkedin text-sm font-bold px-4 py-2 rounded-full mb-6">
              PRO PLAN
            </div>
            <div className="text-6xl font-bold text-gray-900 mb-2">
              $9
              <span className="text-2xl text-gray-500 font-normal">/month</span>
            </div>
            <p className="text-gray-500 mb-8">50 post generations per month</p>

            <ul className="text-left space-y-4 mb-10">
              {[
                '50 LinkedIn post generations per month',
                '5 unique variations per generation',
                'All tones: professional, casual, funny, thought-leadership',
                'All post types: story, tips, questions, announcement, insight',
                'Short, medium & long length options',
                'Full post history',
                'One-click copy to clipboard',
                'Cancel anytime',
              ].map((benefit, i) => (
                <li key={i} className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-4 px-8 bg-linkedin text-white font-bold text-lg rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Redirecting to Stripe...' : 'Upgrade Now — $9/month'}
            </button>
            <p className="text-sm text-gray-400 mt-4">Secure payment via Stripe. Cancel anytime.</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-left">
            <h3 className="font-bold text-gray-900 mb-2">Why upgrade?</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Free users get 2 post generations/month to try FounderPostAI. Pro users get 50/month —
              enough to post daily and maintain a strong LinkedIn presence without ever staring at a
              blank page again.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
