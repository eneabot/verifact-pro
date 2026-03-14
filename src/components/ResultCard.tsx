'use client';

import { getBiasIcon } from '@/lib/mediaDB';

interface ResultCardProps {
  result: any;
  url: string;
}

export default function ResultCard({ result, url }: ResultCardProps) {
  const { score, label, verdict, bias, recommendations, source, llmJustifications, scoreBreakdown } = result;

  // Determine colors based on score
  const getScoreColor = () => {
    if (score >= 75) return 'from-green-400 to-green-600';
    if (score >= 55) return 'from-yellow-400 to-yellow-600';
    if (score >= 35) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const getBackgroundColor = () => {
    if (score >= 75) return 'bg-green-50';
    if (score >= 55) return 'bg-yellow-50';
    if (score >= 35) return 'bg-orange-50';
    return 'bg-red-50';
  };

  const getBorderColor = () => {
    if (score >= 75) return 'border-green-200';
    if (score >= 55) return 'border-yellow-200';
    if (score >= 35) return 'border-orange-200';
    return 'border-red-200';
  };

  return (
    <div className={`mt-8 ${getBackgroundColor()} border-2 ${getBorderColor()} rounded-2xl p-8 shadow-2xl`}>
      {/* Score Display */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{label}</h2>
          <p className="text-gray-600 font-medium">{verdict}</p>
        </div>

        <div className="flex flex-col items-center">
          {/* Circular Progress */}
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200" />
              
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className={`text-transparent bg-gradient-to-r ${getScoreColor()} transition-all duration-500`}
                strokeDasharray={`${(score / 100) * 282.6} 282.6`}
                strokeLinecap="round"
              />
            </svg>

            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-900">{score}</span>
              <span className="text-xs text-gray-500">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Source Info */}
      {source && (
        <div className="mb-6 p-4 bg-white/70 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900">{source.name}</p>
              <p className="text-sm text-gray-600 mt-1">{source.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-medium text-gray-600">Type:</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">{source.type}</span>
              </div>
            </div>
            {source.isExtremist && (
              <div className="px-3 py-1 bg-red-200 text-red-700 rounded-full text-xs font-bold">
                🚨 EXTRÉMISTE
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bias Badge */}
      <div className="mb-6 p-4 bg-white/70 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Biais politique identifié :</span>
          <div className="text-2xl">{getBiasIcon(bias)}</div>
          <span className="text-sm font-bold text-gray-900 capitalize">{bias}</span>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-6 p-4 bg-white/70 rounded-lg border border-gray-200">
        <p className="text-xs font-medium text-gray-600 mb-2">RECOMMANDATION</p>
        <p className="text-sm font-bold text-gray-900">{recommendations.action}</p>
        <p className="text-sm text-gray-600 mt-2">{recommendations.explanation}</p>
      </div>

      {/* Score Breakdown */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="p-3 bg-white/70 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-1">Source</p>
          <p className="text-2xl font-black text-gray-900">{scoreBreakdown.source}</p>
        </div>
        {scoreBreakdown.content !== null && (
          <div className="p-3 bg-white/70 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-1">Contenu</p>
            <p className="text-2xl font-black text-gray-900">{scoreBreakdown.content}</p>
          </div>
        )}
        <div className="p-3 bg-white/70 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-1">Final</p>
          <p className="text-2xl font-black text-gray-900">{scoreBreakdown.final}</p>
        </div>
      </div>

      {/* LLM Justifications */}
      {llmJustifications && llmJustifications.length > 0 && (
        <div className="mb-6 p-4 bg-white/70 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-3">JUSTIFICATIONS IA</p>
          <ul className="space-y-2">
            {llmJustifications.map((justification: string, i: number) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-lg mt-0.5">→</span>
                <span>{justification}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* URL Display */}
      <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
        <p className="text-xs font-medium text-gray-600 mb-1">URL ANALYSÉE</p>
        <p className="text-xs text-gray-700 break-all font-mono">{url}</p>
      </div>
    </div>
  );
}
