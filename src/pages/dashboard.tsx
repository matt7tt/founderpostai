import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import GeneratorForm from '@/components/GeneratorForm';
import PostCard from '@/components/PostCard';
import SeoHead from '@/components/SeoHead';

interface UserStats {
  tier: string;
  monthlyCount: number;
  limit: number;
  stripeCustomerId?: string;
}

interface Post {
  id: string;
  content: string;
  topic: string;
  tone: string;
  postType: string;
  length: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [generatedVariations, setGeneratedVariations] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchStats();
      fetchPosts();
    }
  }, [session]);

  useEffect(() => {
    if (router.query.upgraded === 'true') {
      showToast('🎉 Welcome to Pro! Enjoy 50 posts per month.');
      fetchStats();
    }
  }, [router.query.upgraded]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/user/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch {}
  };

  const handleGenerate = async (topic: string, tone: string, postType: string, length: string) => {
    setIsGenerating(true);
    setGenerateError('');
    setGeneratedVariations([]);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, tone, postType, length }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGenerateError(data.error || 'Generation failed');
        return;
      }

      setGeneratedVariations(data.variations);
      await fetchStats();
      await fetchPosts();
    } catch {
      setGenerateError('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      showToast('Failed to start checkout. Please try again.');
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      showToast('Failed to open billing portal.');
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const usagePercent = stats ? Math.min((stats.monthlyCount / stats.limit) * 100, 100) : 0;
  const isAtLimit = stats ? stats.monthlyCount >= stats.limit : false;

  return (
    <>
      <SeoHead title="Dashboard | FounderPostAI" path="/dashboard" noIndex />
      <div className="min-h-screen bg-gray-50">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
            {toast}
          </div>
        )}

        {/* Nav */}
        <nav className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0A66C2] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">f</span>
              </div>
              <span className="font-bold text-gray-900">FounderPostAI</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 hidden sm:block">{session.user?.email}</span>
              {stats?.tier === 'pro' ? (
                <span className="bg-[#0A66C2] text-white text-xs font-bold px-2 py-1 rounded-full">PRO</span>
              ) : (
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">FREE</span>
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Log out
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Stats bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {stats?.monthlyCount ?? 0} / {stats?.limit ?? 2} posts used this month
                  </span>
                  <span className="text-sm text-gray-500 capitalize">{stats?.tier ?? 'free'} plan</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isAtLimit ? 'bg-red-500' : 'bg-[#0A66C2]'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                {stats?.tier !== 'pro' && (
                  <button
                    onClick={handleUpgrade}
                    className="bg-[#0A66C2] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Upgrade to Pro — $9/mo
                  </button>
                )}
                {stats?.tier === 'pro' && stats?.stripeCustomerId && (
                  <button
                    onClick={handleManageBilling}
                    className="border border-gray-200 text-gray-700 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Manage billing
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Limit warning */}
          {isAtLimit && stats?.tier !== 'pro' && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-orange-900">You&apos;ve hit your monthly limit</p>
                  <p className="text-orange-700 text-sm mt-1">
                    Upgrade to Pro for $9/month and get 50 posts per month.
                  </p>
                  <button
                    onClick={handleUpgrade}
                    className="mt-3 bg-orange-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
                  >
                    Upgrade now →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'generate'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Generate
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              History ({posts.length})
            </button>
          </div>

          {activeTab === 'generate' && (
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Form */}
              <div className="lg:col-span-2">
                <GeneratorForm
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  isAtLimit={isAtLimit}
                  onUpgrade={handleUpgrade}
                />
              </div>

              {/* Results */}
              <div className="lg:col-span-3">
                {generateError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm mb-6">
                    {generateError}
                  </div>
                )}

                {isGenerating && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                    <div className="w-12 h-12 border-4 border-[#0A66C2] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Generating 5 variations...</p>
                    <p className="text-gray-400 text-sm mt-1">Usually takes 5-10 seconds</p>
                  </div>
                )}

                {!isGenerating && generatedVariations.length === 0 && !generateError && (
                  <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-12 text-center">
                    <div className="text-4xl mb-4">✨</div>
                    <p className="text-gray-600 font-medium">Your posts will appear here</p>
                    <p className="text-gray-400 text-sm mt-1">Fill in the form and click Generate</p>
                  </div>
                )}

                {!isGenerating && generatedVariations.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-900">
                      {generatedVariations.length} Variations Generated
                    </h2>
                    {generatedVariations.map((variation, i) => (
                      <PostCard
                        key={i}
                        content={variation}
                        label={`Variation ${i + 1}`}
                        onCopy={() => showToast('Copied to clipboard!')}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {posts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-16 text-center">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-gray-600 font-medium">No posts generated yet</p>
                  <p className="text-gray-400 text-sm mt-1">Your generated posts will appear here</p>
                  <button
                    onClick={() => setActiveTab('generate')}
                    className="mt-4 bg-[#0A66C2] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Generate your first post
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      content={post.content}
                      label={`${post.topic.slice(0, 40)}${post.topic.length > 40 ? '...' : ''}`}
                      meta={`${post.tone} • ${post.postType} • ${post.length} • ${new Date(post.createdAt).toLocaleDateString()}`}
                      onCopy={() => showToast('Copied to clipboard!')}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
