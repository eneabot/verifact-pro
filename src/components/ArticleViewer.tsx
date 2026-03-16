'use client';

import { useState } from 'react';

interface ArticleViewerProps {
  highlightedHtml: string;
  highlights: Array<{
    claimId: string;
    originalText: string;
    startChar: number;
    endChar: number;
    status: 'verified_true' | 'verified_false' | 'unverified' | 'mixed';
    color: string;
    explanation: string;
  }>;
  statistics: {
    verified_true: number;
    verified_false: number;
    unverified: number;
    mixed: number;
    total: number;
  };
}

interface Tooltip {
  claimId: string;
  x: number;
  y: number;
}

export default function ArticleViewer({
  highlightedHtml,
  highlights,
  statistics,
}: ArticleViewerProps) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [copied, setCopied] = useState(false);

  const handleMarkClick = (
    e: React.MouseEvent<HTMLElement>,
    claimId: string
  ) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      claimId,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleCopy = () => {
    // Extract plain text from HTML (remove marks)
    const div = document.createElement('div');
    div.innerHTML = highlightedHtml;
    const marks = div.querySelectorAll('mark');
    marks.forEach(mark => {
      const span = document.createElement('span');
      span.textContent = mark.textContent;
      mark.replaceWith(span);
    });
    const plainText = div.textContent || '';
    navigator.clipboard.writeText(plainText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'verified_true':
        return '✅ Vérifié comme vrai';
      case 'verified_false':
        return '❌ Vérifié comme faux';
      case 'mixed':
        return '⚠️ Opinions mitigées';
      case 'unverified':
        return '❓ Non vérifié';
      default:
        return '❓ Statut inconnu';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'verified_true':
        return 'text-green-700 dark:text-green-400';
      case 'verified_false':
        return 'text-red-700 dark:text-red-400';
      case 'mixed':
      case 'unverified':
        return 'text-amber-700 dark:text-amber-400';
      default:
        return 'text-gray-700 dark:text-gray-400';
    }
  };

  const currentTooltipHighlight = tooltip
    ? highlights.find(h => h.claimId === tooltip.claimId)
    : null;

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          📄 Article analysé avec highlighting
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Les affirmations sont surlignées selon leur statut de vérification.
          Cliquez pour voir les détails.
        </p>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
            <p className="text-xs font-bold text-green-700 dark:text-green-400">
              Vérifié vrai
            </p>
            <p className="text-2xl font-black text-green-600 dark:text-green-400">
              {statistics.verified_true}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
            <p className="text-xs font-bold text-red-700 dark:text-red-400">
              Vérifié faux
            </p>
            <p className="text-2xl font-black text-red-600 dark:text-red-400">
              {statistics.verified_false}
            </p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
              Mitigé
            </p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {statistics.mixed}
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-400">
              Non vérifié
            </p>
            <p className="text-2xl font-black text-gray-600 dark:text-gray-400">
              {statistics.unverified}
            </p>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="p-6">
        <div
          className="prose prose-invert max-w-none text-gray-900 dark:text-gray-100 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'MARK') {
              const claimId = target.getAttribute('data-claim-id');
              if (claimId) {
                handleMarkClick(e as React.MouseEvent<HTMLElement>, claimId);
              }
            }
          }}
        />
      </div>

      {/* Copy button */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          {copied ? '✅ Copié' : '📋 Copier le texte'}
        </button>
      </div>

      {/* Tooltip */}
      {tooltip && currentTooltipHighlight && (
        <div
          className="fixed bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg p-4 max-w-xs z-50"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="flex items-start gap-2 mb-2">
            <span className={`text-xl flex-shrink-0 ${getStatusColor(currentTooltipHighlight.status)}`}>
              {currentTooltipHighlight.status === 'verified_true' && '✅'}
              {currentTooltipHighlight.status === 'verified_false' && '❌'}
              {currentTooltipHighlight.status === 'mixed' && '⚠️'}
              {currentTooltipHighlight.status === 'unverified' && '❓'}
            </span>
            <div className="flex-1">
              <p className="font-bold text-sm">
                {getStatusLabel(currentTooltipHighlight.status)}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {currentTooltipHighlight.explanation}
              </p>
            </div>
          </div>

          {/* Close tooltip on click outside or pressing Escape */}
          <button
            onClick={() => setTooltip(null)}
            className="text-xs text-gray-400 hover:text-gray-200 mt-2 w-full text-center"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
          Légende des couleurs :
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: '#d4edda' }} />
            <span className="text-gray-700 dark:text-gray-300">Vérifié vrai</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: '#f8d7da' }} />
            <span className="text-gray-700 dark:text-gray-300">Vérifié faux</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: '#fff3cd' }} />
            <span className="text-gray-700 dark:text-gray-300">Mitigé/Non vérifié</span>
          </div>
        </div>
      </div>
    </div>
  );
}
