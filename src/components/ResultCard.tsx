'use client';

import { getBiasIcon } from '@/lib/mediaDB';
import type { AnalysisResult, FactCheckMatch } from '@/app/page';

interface ResultCardProps {
  result: AnalysisResult;
  url: string;
}

export default function ResultCard({ result, url }: ResultCardProps) {
  const {
    score, label, verdict, bias, recommendations, source,
    mlJustifications, scoreBreakdown, factCheckMatches,
    sentimentScore, mlScore, sourceScore,
  } = result;

  // ── Color helpers ──────────────────────────────────────────────────────────
  const getScoreColor = (s: number) => {
    if (s >= 75) return 'from-green-400 to-green-600';
    if (s >= 55) return 'from-yellow-400 to-yellow-600';
    if (s >= 35) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const getBg = () => {
    if (score >= 75) return 'bg-green-50';
    if (score >= 55) return 'bg-yellow-50';
    if (score >= 35) return 'bg-orange-50';
    return 'bg-red-50';
  };

  const getBorder = () => {
    if (score >= 75) return 'border-green-200';
    if (score >= 55) return 'border-yellow-200';
    if (score >= 35) return 'border-orange-200';
    return 'border-red-200';
  };

  // ── Sentiment label + color ────────────────────────────────────────────────
  const getSentimentLabel = (s: number) => {
    if (s < 35) return { text: 'Alarmiste', color: 'text-red-600' };
    if (s <= 65) return { text: 'Neutre', color: 'text-gray-600' };
    return { text: 'Positif', color: 'text-green-600' };
  };

  const sentimentInfo = getSentimentLabel(sentimentScore);

  // ── Sentiment bar color ────────────────────────────────────────────────────
  const getSentimentBarColor = (s: number) => {
    if (s < 35) return 'bg-red-400';
    if (s <= 65) return 'bg-blue-400';
    return 'bg-green-400';
  };

  // ── Rating badge color ─────────────────────────────────────────────────────
  const getRatingColor = (rating: string) => {
    const r = rating.toLowerCase();
    if (/true|vrai|correct|exact|confirmé/.test(r)) return 'bg-green-100 text-green-700';
    if (/false|faux|incorrect|inexact|infondé/.test(r)) return 'bg-red-100 text-red-700';
    if (/misleading|trompeur|partiel/.test(r)) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className={`mt-8 ${getBg()} border-2 ${getBorder()} rounded-2xl p-8 shadow-2xl`}>

      {/* ── Score display ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{label}</h2>
          <p className="text-gray-600 font-medium">{verdict}</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200" />
              <circle
                cx="50" cy="50" r="45"
                fill="none" stroke="url(#scoreGrad)" strokeWidth="4"
                strokeDasharray={`${(score / 100) * 282.6} 282.6`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={score >= 75 ? '#4ade80' : score >= 55 ? '#facc15' : score >= 35 ? '#fb923c' : '#f87171'} />
                  <stop offset="100%" stopColor={score >= 75 ? '#16a34a' : score >= 55 ? '#ca8a04' : score >= 35 ? '#ea580c' : '#dc2626'} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-900">{score}</span>
              <span className="text-xs text-gray-500">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Source info ── */}
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
              <div className="px-3 py-1 bg-red-200 text-red-700 rounded-full text-xs font-bold shrink-0 ml-2">
                🚨 EXTRÉMISTE
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bias badge ── */}
      <div className="mb-6 p-4 bg-white/70 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Biais politique identifié :</span>
          <div className="text-2xl">{getBiasIcon(bias)}</div>
          <span className="text-sm font-bold text-gray-900 capitalize">{bias}</span>
        </div>
      </div>

      {/* ── Score breakdown (4 items) ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="p-3 bg-white/70 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-1">Source</p>
          <p className="text-2xl font-black text-gray-900">{scoreBreakdown.source}</p>
          <p className="text-xs text-gray-400">35%</p>
        </div>
        <div className="p-3 bg-white/70 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-1">ML Analyse</p>
          <p className="text-2xl font-black text-gray-900">{scoreBreakdown.ml}</p>
          <p className="text-xs text-gray-400">40%</p>
        </div>
        <div className="p-3 bg-white/70 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-1">Sentiment</p>
          <p className={`text-2xl font-black ${sentimentInfo.color}`}>{scoreBreakdown.sentiment}</p>
          <p className="text-xs text-gray-400">10%</p>
        </div>
        <div className="p-3 bg-white/70 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-1">Fact-checks</p>
          <p className="text-2xl font-black text-blue-700">+{scoreBreakdown.factCheck}</p>
          <p className="text-xs text-gray-400">15%</p>
        </div>
      </div>

      {/* ── Sentiment indicator ── */}
      <div className="mb-6 p-4 bg-white/70 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-600">TONALITÉ DE L&apos;ARTICLE</p>
          <span className={`text-xs font-bold ${sentimentInfo.color}`}>{sentimentInfo.text} ({sentimentScore}/100)</span>
        </div>
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getSentimentBarColor(sentimentScore)}`}
            style={{ width: `${sentimentScore}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Alarmiste</span>
          <span>Neutre</span>
          <span>Positif</span>
        </div>
      </div>

      {/* ── Fact-check matches ── */}
      {factCheckMatches && factCheckMatches.length > 0 && (
        <div className="mb-6 p-4 bg-white/70 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-3">
            🔍 FACT-CHECKS CORRESPONDANTS ({factCheckMatches.length})
          </p>
          <ul className="space-y-3">
            {factCheckMatches.map((match: FactCheckMatch, i: number) => (
              <li key={i} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ${getRatingColor(match.textualRating)}`}>
                    {match.textualRating}
                  </span>
                  <span className="text-gray-700 line-clamp-2">
                    {match.text.length > 120 ? match.text.substring(0, 120) + '…' : match.text}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 ml-0">
                  <span className="text-xs text-gray-500">par {match.publisherName}</span>
                  {match.reviewUrl && (
                    <a
                      href={match.reviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Voir la vérification →
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Recommendations ── */}
      <div className="mb-6 p-4 bg-white/70 rounded-lg border border-gray-200">
        <p className="text-xs font-medium text-gray-600 mb-2">RECOMMANDATION</p>
        <p className="text-sm font-bold text-gray-900">{recommendations.action}</p>
        <p className="text-sm text-gray-600 mt-2">{recommendations.explanation}</p>
      </div>

      {/* ── ML Justifications ── */}
      {mlJustifications && mlJustifications.length > 0 && (
        <div className="mb-6 p-4 bg-white/70 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-3">ANALYSE ML</p>
          <ul className="space-y-2">
            {mlJustifications.map((j: string, i: number) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-lg mt-0.5 shrink-0">→</span>
                <span>{j}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── URL ── */}
      <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
        <p className="text-xs font-medium text-gray-600 mb-1">URL ANALYSÉE</p>
        <p className="text-xs text-gray-700 break-all font-mono">{url}</p>
      </div>
    </div>
  );
}
