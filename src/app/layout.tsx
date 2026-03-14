import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'verifact PRO ⚡ — Fact-checker d\'actualité',
  description: 'Analyseur autonome de fiabilité pour articles d\'actualité français. Détecte satire, biais, désinformation.',
  viewport: 'width=device-width, initial-scale=1',
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
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="color-scheme" content="light" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
