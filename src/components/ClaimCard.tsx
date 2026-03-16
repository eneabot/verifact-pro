'use client';

import { useState } from 'react';
import type { ClaimItem } from '@/app/page';

interface ClaimCardProps {
  claim: ClaimItem;
  index: number;
}

export default function ClaimCard({ claim, index }: ClaimCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified_true':
        return { icon: '✅', label: 'Vérifié', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
      case 'verified_false':
        return { icon: '❌', label: 'Faux', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
      case 'mixed':
        return { icon: '⚠️', label: 'Mixte', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
      default:
        return { icon: '❓', label: 'Non vérifié', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' };
    }
  };

  const status = getStatusIcon(claim.status);

  return (
    <div className="glass rounded-lg p-4 animate-slideInUp" style={{ animationDelay: `${index * 0.1}s` }}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{status.icon}</span>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-left w-full group"
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-white break-words group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {claim.text.substring(0, 120)}
              {claim.text.length > 120 ? '…' : ''}
            </p>
          </button>
          
          {/* Status badge */}
          <span className={`inline-block mt-2 px-2 py-1 text-xs font-bold rounded-full ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Confidence */}
        <div className="flex-shrink-0 text-right">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Confiance
          </p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {Math.round(claim.confidence * 100)}%
          </p>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 animate-slideInUp">
          {/* Full explanation */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Explication
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {claim.explanation}
            </p>
          </div>

          {/* Fact-check matches */}
          {claim.factCheckMatches.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Vérifications ({claim.factCheckMatches.length})
              </p>
              <div className="space-y-2">
                {claim.factCheckMatches.map((match, idx) => (
                  <a
                    key={idx}
                    href={match.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 bg-white/50 dark:bg-slate-800/50 rounded border border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                  >
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      {match.publisherName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Verdict: <span className="font-bold">{match.rating}</span>
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Voir la vérification →
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toggle button hint */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
      >
        {expanded ? '▼ Masquer détails' : '▶ Voir détails'}
      </button>
    </div>
  );
}
