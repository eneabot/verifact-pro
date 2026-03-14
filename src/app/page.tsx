'use client';

import { useState } from 'react';
import ResultCard from '@/components/ResultCard';
import SearchBar from '@/components/SearchBar';

interface AnalysisResult {
  score: number;
  label: string;
  verdict: string;
  satire: boolean;
  bias: string;
  sourceScore: number;
  contentScore: number | null;
  recommendations: {
    action: string;
    explanation: string;
  };
  source: {
    name: string;
    type: string;
    description: string;
    isExtremist?: boolean;
  } | null;
  llmJustifications: string[];
  scoreBreakdown: {
    source: number;
    content: number;
    final: number;
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
        body: JSON.stringify({ url: articleUrl })
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
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <h1 className="text-5xl font-black text-white drop-shadow-lg">
              ⚡ verifact PRO
            </h1>
          </div>
          <p className="text-white/90 text-lg font-medium">
            Fact-checker autonome d'actualité française
          </p>
          <p className="text-white/70 text-sm mt-2">
            Analyse en temps réel: source × contenu × biais
          </p>
        </div>

        {/* Search */}
        <SearchBar onAnalyze={handleAnalyze} loading={loading} />

        {/* Loading State */}
        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-white font-medium">Analyse en cours...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mt-8 p-6 bg-red-500/20 border border-red-300 rounded-xl">
            <p className="text-red-100 font-medium">❌ Erreur</p>
            <p className="text-red-50 text-sm mt-2">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <ResultCard result={result} url={url} />
        )}

        {/* Example Links */}
        {!result && !loading && !error && (
          <div className="mt-12 text-center">
            <p className="text-white/80 text-sm font-medium mb-4">
              Exemples rapides :
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => handleAnalyze('https://lemonde.fr/article-test')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition"
              >
                Le Monde ✅
              </button>
              <button
                onClick={() => handleAnalyze('https://bfmtv.com/article-test')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition"
              >
                BFM TV ⚠️
              </button>
              <button
                onClick={() => handleAnalyze('https://legorafi.fr/article-satire')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition"
              >
                Le Gorafi 🤣
              </button>
              <button
                onClick={() => handleAnalyze('https://francesoir.fr/article-test')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition"
              >
                FranceSoir 🚨
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-white/60 text-xs">
          <p>Analyseur autonome basé sur: source fiabilité × contenu × LLM</p>
          <p className="mt-2">Sécurisé • Gratuit • Transparent</p>
        </div>
      </div>
    </main>
  );
}
