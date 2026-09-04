'use client';

import { useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import PostCard from './PostCard';

interface PostGeneratorProps {
  onPostGenerated: () => void;
}

export default function PostGenerator({ onPostGenerated }: PostGeneratorProps) {
  const { data: session } = useSession();
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'funny' | 'thought-leadership'>('professional');
  const [postType, setPostType] = useState<'story' | 'tips' | 'questions' | 'announcement' | 'insight'>('story');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [posts, setPosts] = useState<Array<{ content: string; tone: string; type: string; length: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPosts([]);
    setLoading(true);

    try {
      const response = await axios.post('/api/posts/generate', {
        topic,
        tone,
        postType,
        length,
      });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        const generatedPosts = response.data.posts.map((content: string) => ({
          content,
          tone,
          type: postType,
          length,
        }));
        setPosts(generatedPosts);
        onPostGenerated();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate posts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Generator Form */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate New Posts</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
            {error.includes('Upgrade') && (
              <a href="#pricing" className="text-red-600 hover:underline mt-2 inline-block font-semibold">
                View Pro plan →
              </a>
            )}
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              What&apos;s your post idea?
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="E.g., Just launched my new product... or lessons from my first startup failure... or best practices for remote teams..."
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-linkedin focus:border-transparent resize-none h-28 font-medium"
            />
            <p className="text-xs text-gray-500 mt-2">Be specific. The more details, the better the output.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-linkedin focus:border-transparent"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="funny">Funny</option>
                <option value="thought-leadership">Thought Leadership</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Post Type</label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-linkedin focus:border-transparent"
              >
                <option value="story">Story</option>
                <option value="tips">Tips</option>
                <option value="questions">Questions</option>
                <option value="announcement">Announcement</option>
                <option value="insight">Insight</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Length</label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-linkedin focus:border-transparent"
              >
                <option value="short">Short (280 chars)</option>
                <option value="medium">Medium (500 chars)</option>
                <option value="long">Long (1000+ chars)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linkedin hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚡</span>
                Generating posts...
              </span>
            ) : (
              '✨ Generate 5 Posts'
            )}
          </button>
        </form>
      </div>

      {/* Generated Posts */}
      {posts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">Your Generated Posts</h3>
          <div className="grid gap-4">
            {posts.map((post, idx) => (
              <PostCard
                key={idx}
                content={post.content}
                label={`Variation ${idx + 1}`}
                meta={`${post.tone} · ${post.type} · ${post.length}`}
                onCopy={() => undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
