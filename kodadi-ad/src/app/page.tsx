import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-gray-800">
        <div className="text-2xl font-bold">Kodadi</div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-20">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Understand Your
            <br />
            <span className="text-blue-500">Users Better</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Track product usage, ad attention, page engagement, and get AI-powered
            insights to grow your business.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition-colors"
          >
            Start Free Trial
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-3xl mb-4">📦</div>
            <h3 className="text-lg font-semibold mb-2">Product Usage</h3>
            <p className="text-gray-400 text-sm">
              See which products are used most and track user interactions.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-3xl mb-4">📢</div>
            <h3 className="text-lg font-semibold mb-2">Ad Attention</h3>
            <p className="text-gray-400 text-sm">
              Track which ads get views, clicks, and the best CTR.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-3xl mb-4">📄</div>
            <h3 className="text-lg font-semibold mb-2">Page Attention</h3>
            <p className="text-gray-400 text-sm">
              Understand which pages engage users most and why.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
            <p className="text-gray-400 text-sm">
              Get AI-powered summaries and actionable recommendations.
            </p>
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-gray-500 mb-4">Simple integration. Just one line of code.</p>
          <code className="bg-gray-800 px-6 py-3 rounded-lg text-blue-400 text-sm">
            {`<script src="https://kodadi.vercel.app/sdk.js" data-api-key="your-key"></script>`}
          </code>
        </div>
      </main>
    </div>
  );
}
