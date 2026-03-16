'use client';

interface SentimentBarProps {
  score: number;
}

export default function SentimentBar({ score }: SentimentBarProps) {
  const getSentimentLabel = (s: number) => {
    if (s < 35) return { text: '🔴 Alarmiste', color: 'text-red-600' };
    if (s <= 65) return { text: '🟡 Neutre', color: 'text-amber-600' };
    return { text: '🟢 Positif', color: 'text-green-600' };
  };

  const getSentimentBarColor = (s: number) => {
    if (s < 35) return 'from-red-400 to-red-500';
    if (s <= 65) return 'from-amber-400 to-amber-500';
    return 'from-green-400 to-green-500';
  };

  const sentiment = getSentimentLabel(score);

  return (
    <div className="p-4 glass rounded-xl animate-slideInUp">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Tonalité de l&apos;article
        </p>
        <span className={`text-sm font-bold ${sentiment.color}`}>
          {sentiment.text} ({score}/100)
        </span>
      </div>

      {/* Gradient bar */}
      <div className="relative h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${getSentimentBarColor(score)} shadow-lg`}
          style={{ width: `${score}%` }}
        />
        
        {/* Indicator dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-slate-800 rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-md transition-all duration-700"
          style={{ left: `calc(${score}% - 8px)` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
        <span>Alarmiste</span>
        <span>Neutre</span>
        <span>Positif</span>
      </div>
    </div>
  );
}
