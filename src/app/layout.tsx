import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import '@/styles/highlights.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'verifact PRO ⚡ — Fact-checker d\'actualité',
  description: 'Analyseur autonome de fiabilité pour articles d\'actualité français. Détecte satire, biais, désinformation.',
  robots: 'index, follow',
  openGraph: {
    title: 'verifact PRO',
    description: 'Fact-checker autonome d\'actualité française',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="color-scheme" content="light dark" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="verifact-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
