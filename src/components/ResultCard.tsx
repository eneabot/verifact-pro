'use client';

import { useState } from 'react';
import { getBiasIcon } from '@/lib/mediaDB';
import SentimentBar from './SentimentBar';
import BiasIndicator from './BiasIndicator';
import ClaimCard from './ClaimCard';
import ArticleViewer from './ArticleViewer';
import type { AnalysisResult, FactCheckMatch, ClaimItem } from '@/app/page';

interface ResultCardProps {
  result: AnalysisResult;
  url: string;
}

export default function ResultCard({ result, url }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [showArticleViewer, setShowArticleViewer] = useState(false);
  const {
    score, label, verdict, bias, recommendations, source,
    mlJustifications, scoreBreakdown, factCheckMatches,
    sentimentScore, mlScore, sourceScore,
    highlightedHtml, highlights, highlightStatistics,
  } = result;

  const getScoreColor = (s: number) => {
    if (s >= 75) return 'from-green-400 to-green-600';
    if (s >= 55) return 'from-yellow-400 to-yellow-600';
    if (s >= 35) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const getRatingColor = (rating: string) => {
    const r = rating.toLowerCase();
    if (/true|vrai|correct|exact|confirmé/.test(r)) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    if (/false|faux|incorrect|inexact|infondé/.test(r)) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    if (/misleading|trompeur|partiel/.test(r)) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
    return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mt-8 space-y-4 animate-fadeInUp">
      {/* Main Score Card */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Info section */}
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
              {label}
            </h2>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {verdict}
            </p>
            {source && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Source : <span className="font-bold">{source.name}</span>
              </p>
            )}
          </div>

          {/* Circular score */}
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-slate-700" />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none" stroke="url(#scoreGrad)" strokeWidth="3"
                  strokeDasharray={`${(score / 100) * 282.6} 282.6`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={score >= 75 ? '#4ade80' : score >= 55 ? '#facc15' : score >= 35 ? '#fb923c' : '#f87171'} />
                    <stop offset="100%" stopColor={score >= 75 ? '#16a34a' : score >= 55 ? '#ca8a04' : score >= 35 ? '#ea580c' : '#dc2626'} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-gray-900 dark:text-white">{score}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Source info */}
        {source && (
          <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{source.name}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{source.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Type :</span>
                  <span className="text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded font-medium text-gray-700 dark:text-gray-300">
                    {source.type}
                  </span>
                </div>
              </div>
              {source.isExtremist && (
                <div className="flex-shrink-0 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs font-bold">
                  🚨 EXTRÉMISTE
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Score Breakdown Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass rounded-lg p-4 text-center animate-slideInUp" style={{ animationDelay: '0s' }}>
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">SOURCE</p>
          <p className="text-3xl font-black bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
            {scoreBreakdown.source}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">35%</p>
        </div>

        <div className="glass rounded-lg p-4 text-center animate-slideInUp" style={{ animationDelay: '0.1s' }}>
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">ML</p>
          <p className="text-3xl font-black bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
            {scoreBreakdown.ml}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">40%</p>
        </div>

        <div className="glass rounded-lg p-4 text-center animate-slideInUp" style={{ animationDelay: '0.2s' }}>
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">SENTIMENT</p>
          <p className="text-3xl font-black bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
            {scoreBreakdown.sentiment}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">10%</p>
        </div>

        <div className="glass rounded-lg p-4 text-center animate-slideInUp" style={{ animationDelay: '0.3s' }}>
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">FACT-CHECKS</p>
          <p className="text-3xl font-black bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
            +{scoreBreakdown.factCheck}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">15%</p>
        </div>
      </div>

      {/* Sentiment & Bias */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SentimentBar score={sentimentScore} />
        <BiasIndicator bias={bias} />
      </div>

      {/* Article Viewer Toggle */}
      {highlightedHtml && highlights && highlightStatistics && (
        <div className="glass rounded-xl overflow-hidden">
          <button
            onClick={() => setShowArticleViewer(!showArticleViewer)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 text-left">
              <span className="text-2xl">📄</span>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Voir l'article analysé avec highlighting
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {highlightStatistics.total} affirmation(s) surlignée(s)
                </p>
              </div>
            </div>
            <span className={`text-2xl transform transition-transform ${showArticleViewer ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {showArticleViewer && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <ArticleViewer
                highlightedHtml={highlightedHtml}
                highlights={highlights}
                statistics={highlightStatistics}
              />
            </div>
          )}
        </div>
      )}

      {/* Claims Analysis */}
      {result.claimsAnalysis && result.claimsAnalysis.claims.length > 0 && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Analyse des affirmations
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {result.claimsAnalysis.claims.length} affirmations analysées
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            {result.claimsAnalysis.summary}
          </p>

          <div className="space-y-3">
            {result.claimsAnalysis.claims.map((claim: ClaimItem, idx: number) => (
              <ClaimCard key={idx} claim={claim} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Fact-check matches */}
      {factCheckMatches && factCheckMatches.length > 0 && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🔍</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Fact-checks correspondants ({factCheckMatches.length})
            </h3>
          </div>

          <div className="space-y-3">
            {factCheckMatches.map((match: FactCheckMatch, i: number) => (
              <div key={i} className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors hover:shadow-md hover:shadow-blue-200 dark:hover:shadow-blue-900/30">
                <div className="flex items-start gap-3 mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${getRatingColor(match.textualRating)}`}>
                    {match.textualRating}
                  </span>
                  <p className="text-sm text-gray-900 dark:text-white font-medium flex-1">
                    {match.text.length > 150 ? match.text.substring(0, 150) + '…' : match.text}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    par <span className="font-bold">{match.publisherName}</span>
                  </p>
                  {match.reviewUrl && (
                    <a
                      href={match.reviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      Voir →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="glass rounded-xl p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0">💡</span>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {recommendations.action}
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {recommendations.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* ML Justifications */}
      {mlJustifications && mlJustifications.length > 0 && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🤖</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Analyse ML détaillée
            </h3>
          </div>

          <div className="space-y-3">
            {mlJustifications.map((j: string, i: number) => (
              <div key={i} className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700 flex gap-3">
                <span className="text-lg flex-shrink-0">→</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{j}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* URL Section */}
      <div className="glass rounded-lg p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">URL ANALYSÉE</p>
        <div className="flex items-center gap-2">
          <code className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900/50 px-3 py-2 rounded border border-gray-200 dark:border-slate-700 flex-1 overflow-hidden overflow-ellipsis">
            {url}
          </code>
          <button
            onClick={copyToClipboard}
            className="flex-shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
            title="Copier l'URL"
          >
            {copied ? '✅' : '📋'}
          </button>
        </div>
      </div>
    </div>
  );
}
