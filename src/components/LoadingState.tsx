'use client';

export default function LoadingState() {
  return (
    <div className="mt-12 flex flex-col items-center justify-center animate-fadeInUp">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin" />
        <div className="absolute inset-2 border-4 border-transparent border-b-pink-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          ⚡ Analyse en cours...
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Évaluation source • ML • sentiment • fact-checks
        </p>
      </div>
      
      <div className="mt-6 flex gap-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
}
