'use client';

import Link from 'next/link';
import FeatureComparison from './FeatureComparison';
import PricingSection from './PricingSection';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-linkedin">FounderPostAI</div>
          <div className="flex gap-4">
            <Link
              href="/auth/login"
              className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-6 py-2 bg-linkedin text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Stop staring at a blank page.
        </h1>
        <p className="text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Generate LinkedIn posts that actually get engagement.
        </p>
        <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto font-medium">
          Not generic ChatGPT. Optimized for LinkedIn. One click. Five variations. Seconds.
        </p>

        <div className="flex justify-center gap-4 mb-16 flex-wrap">
          <Link
            href="/auth/signup"
            className="px-8 py-4 bg-linkedin text-white rounded-lg hover:bg-blue-700 font-bold text-lg transition transform hover:scale-105"
          >
            Start Generating Free
          </Link>
          <a
            href="#features"
            className="px-8 py-4 border-2 border-linkedin text-linkedin rounded-lg hover:bg-linkedin hover:text-white font-bold text-lg transition"
          >
            Learn More
          </a>
        </div>

        {/* Social Proof */}
        <div className="inline-block bg-white rounded-lg shadow-lg p-6 mb-16">
          <p className="text-sm text-gray-600 mb-4 font-semibold">Trusted by founders and content creators</p>
          <div className="flex items-center justify-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-linkedin to-blue-600 border-2 border-white flex items-center justify-center text-white font-bold text-sm"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span className="text-gray-700 font-semibold ml-2">500+ users generating posts</span>
          </div>
        </div>
      </section>

      {/* Why FounderPostAI Section */}
      <section className="bg-white py-20 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Why FounderPostAI?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-12 h-12 bg-linkedin text-white rounded-lg flex items-center justify-center mb-4 text-xl font-bold">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">One-Click Generation</h3>
              <p className="text-gray-600 leading-relaxed">
                No prompt engineering. No staring at a blank page. Just fill in your idea and get 5 polished variations in seconds.
              </p>
            </div>

            <div className="p-8 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-12 h-12 bg-linkedin text-white rounded-lg flex items-center justify-center mb-4 text-xl font-bold">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">LinkedIn-Optimized</h3>
              <p className="text-gray-600 leading-relaxed">
                Specifically built for LinkedIn&apos;s algorithm. Professional tone. Strategic emojis. Perfect formatting. Not generic ChatGPT.
              </p>
            </div>

            <div className="p-8 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-12 h-12 bg-linkedin text-white rounded-lg flex items-center justify-center mb-4 text-xl font-bold">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Tone & Style Control</h3>
              <p className="text-gray-600 leading-relaxed">
                Professional, casual, funny, or thought-leadership. Pick your vibe. Pick your format. We handle the rest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <FeatureComparison />
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-20 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PricingSection />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-linkedin to-blue-700 py-16 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to stop wasting time on LinkedIn posts?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Generate your first 5 posts free. No credit card required. No limits on quality.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-4 bg-white text-linkedin rounded-lg hover:bg-gray-100 font-bold text-lg transition transform hover:scale-105"
          >
            Start for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-2 font-semibold text-white">FounderPostAI</p>
          <p className="text-sm mb-6">LinkedIn post generation powered by Claude AI</p>
          <p className="text-xs">&copy; 2024 FounderPostAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
