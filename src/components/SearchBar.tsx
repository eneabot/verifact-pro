'use client';

import { useState } from 'react';

interface SearchBarProps {
  onAnalyze: (url: string) => void;
  loading: boolean;
}

export default function SearchBar({ onAnalyze, loading }: SearchBarProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative group">
        {/* Glow effect on focus */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-0 group-focus-within:opacity-50 transition-opacity duration-300" />

        <div className="relative flex items-center">
          <input
            type="url"
            placeholder="Collez l'URL de l'article..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="w-full px-6 py-4 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-lg placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:ring-offset-0 transition disabled:opacity-50 disabled:cursor-not-allowed border border-transparent dark:border-slate-700"
            required
          />

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white rounded-lg font-bold text-sm hover:shadow-lg hover:shadow-blue-500/30 dark:hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="hidden sm:inline">Analyse...</span>
              </>
            ) : (
              <>
                <span>🔍</span>
                <span className="hidden sm:inline">Analyser</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
        Exemple : <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">https://lemonde.fr/article</code>
      </p>
    </form>
  );
}
