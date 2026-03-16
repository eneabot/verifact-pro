'use client';

import { getBiasIcon } from '@/lib/mediaDB';

interface BiasIndicatorProps {
  bias: string;
}

export default function BiasIndicator({ bias }: BiasIndicatorProps) {
  // Map bias to position (0-100)
  const getBiasPosition = (b: string) => {
    const normalized = b.toLowerCase().trim();
    if (normalized === 'far-left' || normalized === 'extreme-left') return 10;
    if (normalized === 'left') return 30;
    if (normalized === 'center-left') return 45;
    if (normalized === 'center') return 50;
    if (normalized === 'center-right') return 55;
    if (normalized === 'right') return 70;
    if (normalized === 'far-right' || normalized === 'extreme-right') return 90;
    return 50;
  };

  const position = getBiasPosition(bias);

  return (
    <div className="p-4 glass rounded-xl animate-slideInUp">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Orientation politique identifiée
        </p>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getBiasIcon(bias)}</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">
            {bias}
          </span>
        </div>
      </div>

      {/* Spectrum bar */}
      <div className="relative h-8 bg-gradient-to-r from-red-400 via-gray-300 to-blue-400 dark:from-red-600 dark:via-slate-700 dark:to-blue-600 rounded-lg overflow-hidden shadow-md">
        {/* Indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-lg flex items-center justify-center transition-all duration-700"
          style={{ left: `calc(${position}% - 16px)` }}
        >
          <span className="text-xs font-bold text-gray-900 dark:text-white">
            {position < 40 ? '👈' : position > 60 ? '👉' : '📍'}
          </span>
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
        <span>Gauche</span>
        <span>Centre</span>
        <span>Droite</span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
        Cette source tend vers une orientation {bias.toLowerCase()} dans ses contenus et éditos.
      </p>
    </div>
  );
}
