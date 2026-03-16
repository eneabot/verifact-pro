'use client';

interface EmptyStateProps {
  onExampleClick?: (url: string) => void;
}

export default function EmptyState({ onExampleClick }: EmptyStateProps) {
  const examples = [
    { label: 'Le Monde ✅', url: 'https://lemonde.fr/article-test', icon: '✅' },
    { label: 'BFM TV ⚠️', url: 'https://bfmtv.com/article-test', icon: '⚠️' },
    { label: 'Le Gorafi 🤣', url: 'https://legorafi.fr/article-satire', icon: '🤣' },
    { label: 'FranceSoir 🚨', url: 'https://francesoir.fr/article-test', icon: '🚨' },
  ];

  return (
    <div className="mt-12 text-center animate-fadeInUp">
      {/* Icon */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-6">
        <span className="text-4xl">📰</span>
      </div>

      {/* Message */}
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Prêt à vérifier une actualité ?
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Collez l&apos;URL d&apos;un article pour obtenir une analyse ML complète : source, contenu, sentiment, fact-checks.
      </p>

      {/* Examples */}
      <div>
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
          Essayez avec un exemple :
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {examples.map((ex) => (
            <button
              key={ex.url}
              onClick={() => onExampleClick?.(ex.url)}
              className="group glass px-3 py-3 rounded-lg transition-smooth hover:scale-105 active:scale-95"
            >
              <span className="text-2xl mb-2 block group-hover:animate-bounce-slow">
                {ex.icon}
              </span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {ex.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="p-4 glass rounded-lg animate-slideInLeft">
          <span className="text-2xl mb-2 block">🔍</span>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Source</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Base de données des sources
          </p>
        </div>
        <div className="p-4 glass rounded-lg animate-fadeInUp">
          <span className="text-2xl mb-2 block">🤖</span>
          <p className="text-sm font-medium text-gray-900 dark:text-white">ML Analysis</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Modèles d&apos;IA avancés
          </p>
        </div>
        <div className="p-4 glass rounded-lg animate-slideInRight">
          <span className="text-2xl mb-2 block">✅</span>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Fact-Checks</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Vérifications Google
          </p>
        </div>
      </div>
    </div>
  );
}
