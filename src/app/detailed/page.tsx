'use client';

import { useState } from 'react';
import Link from 'next/link';
import ResultCard from '@/components/ResultCard';
import LoadingState from '@/components/LoadingState';
import type { AnalysisResult } from '@/app/page';

interface DetailedAnalysisInput {
  text: string;
  url?: string;
}

export default function DetailedAnalysisPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState<DetailedAnalysisInput>({ text: '', url: '' });
  const [mode, setMode] = useState<'text' | 'url'>('text');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Determine what to analyze based on mode
      let analysisUrl = '';
      
      if (mode === 'url') {
        if (!input.url || !input.url.startsWith('http')) {
          throw new Error('Veuillez entrer une URL valide');
        }
        analysisUrl = input.url;
      } else {
        if (!input.text.trim()) {
          throw new Error('Veuillez entrer du texte à analyser');
        }
        // For text mode, we'll need to create a temporary storage or send as direct content
        // For now, we'll use a special endpoint
        analysisUrl = input.text;
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: mode === 'url' ? analysisUrl : undefined,
          text: mode === 'text' ? analysisUrl : undefined,
          detailed: true,
          highlight: true
        })
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

  const handleClear = () => {
    setInput({ text: '', url: '' });
    setResult(null);
    setError(null);
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
        <div className="w-full max-w-4xl mx-auto">
          {/* Header with nav */}
          <div className="mb-8 animate-fadeInUp">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium mb-4">
              ← Retour à l'accueil
            </Link>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
                <span className="text-2xl">🔍</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Analyse Détaillée
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              Analysez un article complet avec identification des affirmations et vérifications
            </p>
          </div>

          {/* Input section */}
          {!result && (
            <div className="glass rounded-2xl p-8 mb-8 animate-slideInUp">
              {/* Mode selector */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setMode('text')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    mode === 'text'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  📝 Texte
                </button>
                <button
                  onClick={() => setMode('url')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    mode === 'url'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  🔗 URL
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAnalyze} className="space-y-6">
                {mode === 'text' ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Article ou texte à analyser
                    </label>
                    <textarea
                      value={input.text}
                      onChange={(e) => setInput({ ...input, text: e.target.value })}
                      placeholder="Collez ici le contenu de l'article à fact-checker..."
                      className="w-full h-40 p-4 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Conseil : Collez le texte brut de l'article pour une meilleure analyse
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      URL de l'article
                    </label>
                    <input
                      type="url"
                      value={input.url}
                      onChange={(e) => setInput({ ...input, url: e.target.value })}
                      placeholder="https://example.com/article"
                      className="w-full p-4 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      L'article sera extrait automatiquement via Jina
                    </p>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block animate-spin">⚙️</span>
                      Analyse en cours...
                    </span>
                  ) : (
                    '🔍 Analyser'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Loading state */}
          {loading && <LoadingState />}

          {/* Result section */}
          {result && !loading && (
            <div className="space-y-4 animate-fadeInUp">
              <div className="glass rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">✅</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Analyse complète
                  </h2>
                </div>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  ↻ Nouvelle analyse
                </button>
              </div>

              <ResultCard result={result} url={input.url || input.text.substring(0, 50)} />
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
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
