'use client';

import { useState } from 'react';
import ResultCard from '@/components/ResultCard';
import SearchBar from '@/components/SearchBar';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';

export interface FactCheckMatch {
  text: string;
  claimant: string;
  claimDate: string;
  textualRating: string;
  publisherName: string;
  publisherSite: string;
  reviewUrl: string;
}

export interface ClaimItem {
  text: string;
  confidence: number;
  factCheckMatches: Array<{
    claim: string;
    rating: string;
    source: string;
    url: string;
    publisherName: string;
  }>;
  status: 'verified_true' | 'verified_false' | 'unverified' | 'mixed';
  explanation: string;
}

export interface AnalysisResult {
  score: number;
  label: string;
  verdict: string;
  satire: boolean;
  bias: string;
  sourceScore: number;
  mlScore: number;
  mlConfidence: number;
  sentimentScore: number;
  factCheckMatches: FactCheckMatch[];
  recommendations: {
    action: string;
    explanation: string;
  };
  mlJustifications: string[];
  source: {
    name: string;
    type: string;
    description: string;
    isExtremist?: boolean;
  } | null;
  scoreBreakdown: {
    source: number;
    ml: number;
    sentiment: number;
    factCheck: number;
    final: number;
  };
  claimsAnalysis?: {
    claims: ClaimItem[];
    summary: string;
  };
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');

  const handleAnalyze = async (articleUrl: string) => {
    setLoading(true);
    setError(null);
    setUrl(articleUrl);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: articleUrl, detailed: true })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Analysis failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-80 h-80 bg-blue-300 dark:bg-blue-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 left-10 w-80 h-80 bg-purple-300 dark:bg-purple-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-pink-300 dark:bg-pink-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 py-12">
        {/* Header Section */}
        <div className="w-full max-w-4xl mx-auto mb-8">
          {/* Logo & Title */}
          <div className="text-center mb-8 animate-fadeInUp">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 mb-6 shadow-lg">
              <span className="text-3xl">⚡</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-black text-gray-900 dark:text-white mb-3 animate-slideInUp">
              verifact<span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"> PRO</span>
            </h1>

            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2 animate-slideInUp" style={{ animationDelay: '0.1s' }}>
              Analyseur autonome de fiabilité
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-4 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
              pour actualité française
            </p>

            {/* Features row */}
            <div className="flex flex-wrap justify-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 animate-slideInUp" style={{ animationDelay: '0.3s' }}>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                🔍 Source
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                🤖 ML
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                📊 Sentiment
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                ✅ Fact-checks
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-12 animate-slideInUp" style={{ animationDelay: '0.4s' }}>
            <SearchBar onAnalyze={handleAnalyze} loading={loading} />
          </div>

          {/* Loading State */}
          {loading && <LoadingState />}

          {/* Error State */}
          {error && !loading && (
            <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl animate-slideInUp">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">❌</span>
                <div>
                  <p className="font-bold text-red-900 dark:text-red-400 mb-1">Erreur d&apos;analyse</p>
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <ResultCard result={result} url={url} />
          )}

          {/* Empty State */}
          {!result && !loading && !error && (
            <EmptyState onExampleClick={handleAnalyze} />
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-600 dark:text-gray-400 text-xs font-medium animate-fadeIn" style={{ animationDelay: '0.5s' }}>
          <p className="mb-2">
            🔐 Sécurisé • 🆓 Gratuit • 📖 Transparent
          </p>
          <p>
            ML-first : source × contenu × sentiment × vérifications
          </p>
        </div>
      </div>

      {/* Custom blob animation keyframes */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </main>
  );
}
