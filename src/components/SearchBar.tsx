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
    <form onSubmit={handleSubmit} className="mt-8">
      <div className="relative">
        <input
          type="url"
          placeholder="Collez l'URL de l'article..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          className="w-full px-6 py-4 rounded-xl bg-white shadow-lg placeholder-gray-400 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-0 transition disabled:opacity-50"
          required
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳' : '🔍'}
        </button>
      </div>
    </form>
  );
}
