/**
 * Media Database — ~50 French news sources
 * Curated trust scores based on: journalistic rigor, fact-checking processes, editorial history
 */

export interface MediaSource {
  domain: string;
  name: string;
  type: 'agence' | 'quotidien' | 'hebdo' | 'tv' | 'radio' | 'pure-player' | 'blog' | 'satire' | 'extremiste';
  baseScore: number; // 0-100
  bias: 'gauche' | 'centre-gauche' | 'centre' | 'centre-droit' | 'droite' | 'extremiste' | 'satirique' | 'indépendant';
  description: string;
  isParody?: boolean;
  isExtremist?: boolean;
}

export const MEDIA_DATABASE: MediaSource[] = [
  // ────────── AGENCES DE PRESSE (BASE SCORE 90+) ──────────────
  {
    domain: 'afp.com',
    name: 'AFP (Agence France Presse)',
    type: 'agence',
    baseScore: 95,
    bias: 'centre',
    description: 'Agence de presse internationale, contrôle éditorial très strict'
  },
  {
    domain: 'reuters.com',
    name: 'Reuters',
    type: 'agence',
    baseScore: 93,
    bias: 'centre',
    description: 'Agence de presse de référence mondiale'
  },

  // ────────── QUOTIDIENS NATIONAUX (BASE SCORE 75-90) ──────────────
  {
    domain: 'lemonde.fr',
    name: 'Le Monde',
    type: 'quotidien',
    baseScore: 87,
    bias: 'centre-gauche',
    description: 'Journal de référence, équipe fact-checking Décodeurs'
  },
  {
    domain: 'lefigaro.fr',
    name: 'Le Figaro',
    type: 'quotidien',
    baseScore: 82,
    bias: 'centre-droit',
    description: 'Quotidien établi, rigueur éditoriale'
  },
  {
    domain: 'liberation.fr',
    name: 'Libération',
    type: 'quotidien',
    baseScore: 80,
    bias: 'gauche',
    description: 'Quotidien national avec fact-checking CheckNews'
  },
  {
    domain: 'leparisien.fr',
    name: 'Le Parisien',
    type: 'quotidien',
    baseScore: 78,
    bias: 'centre',
    description: 'Quotidien populaire mais établi'
  },

  // ────────── SERVICE PUBLIC (BASE SCORE 80-90) ──────────────
  {
    domain: 'francetvinfo.fr',
    name: 'France Télévisions Info',
    type: 'tv',
    baseScore: 86,
    bias: 'centre',
    description: 'Service public, section Vrai ou Fake'
  },
  {
    domain: 'france24.com',
    name: 'France 24',
    type: 'tv',
    baseScore: 84,
    bias: 'centre',
    description: 'Info internationale service public français'
  },
  {
    domain: 'radiofrance.fr',
    name: 'Radio France',
    type: 'radio',
    baseScore: 83,
    bias: 'centre',
    description: 'Radio service public'
  },
  {
    domain: 'franceinter.fr',
    name: 'France Inter',
    type: 'radio',
    baseScore: 82,
    bias: 'centre-gauche',
    description: 'Radio publique généraliste'
  },

  // ────────── PRESSE DE QUALITÉ / INVESTIGATIF (BASE SCORE 75-85) ──────────────
  {
    domain: 'mediapart.fr',
    name: 'Mediapart',
    type: 'pure-player',
    baseScore: 85,
    bias: 'gauche',
    description: 'Média indépendant, investigatif reconnu'
  },
  {
    domain: 'lecanardenchaine.fr',
    name: 'Le Canard Enchaîné',
    type: 'hebdo',
    baseScore: 86,
    bias: 'indépendant',
    description: 'Hebdo satirique mais aussi investigatif fiable'
  },
  {
    domain: 'ouest-france.fr',
    name: 'Ouest-France',
    type: 'quotidien',
    baseScore: 78,
    bias: 'centre',
    description: 'Premier quotidien français par diffusion'
  },

  // ────────── HEBDOMADAIRES (BASE SCORE 70-80) ──────────────
  {
    domain: 'lepoint.fr',
    name: 'Le Point',
    type: 'hebdo',
    baseScore: 76,
    bias: 'centre-droit',
    description: 'Newsmagazine généraliste'
  },
  {
    domain: 'lexpress.fr',
    name: 'L\'Express',
    type: 'hebdo',
    baseScore: 76,
    bias: 'centre',
    description: 'Newsmagazine, ligne libérale'
  },
  {
    domain: 'nouvelobs.com',
    name: 'L\'Obs',
    type: 'hebdo',
    baseScore: 75,
    bias: 'centre-gauche',
    description: 'Newsmagazine généraliste'
  },

  // ────────── TV CONTINUE & RADIO PRIVÉE (BASE SCORE 65-75) ──────────────
  {
    domain: 'bfmtv.com',
    name: 'BFM TV',
    type: 'tv',
    baseScore: 68,
    bias: 'centre-droit',
    description: 'Info continue, quelques inexactitudes fréquentes'
  },
  {
    domain: 'tf1info.fr',
    name: 'TF1 Info',
    type: 'tv',
    baseScore: 70,
    bias: 'centre',
    description: 'Info TV privée'
  },
  {
    domain: 'lci.fr',
    name: 'LCI',
    type: 'tv',
    baseScore: 70,
    bias: 'centre',
    description: 'Info continue TF1'
  },
  {
    domain: 'rtl.fr',
    name: 'RTL',
    type: 'radio',
    baseScore: 73,
    bias: 'centre',
    description: 'Radio privée généraliste'
  },
  {
    domain: 'europe1.fr',
    name: 'Europe 1',
    type: 'radio',
    baseScore: 62,
    bias: 'droite',
    description: 'Radio, dérive éditoriale depuis rachat Bolloré'
  },

  // ────────── MÉDIAS ALTERNATIFS (BASE SCORE 65-75) ──────────────
  {
    domain: 'reporterre.net',
    name: 'Reporterre',
    type: 'pure-player',
    baseScore: 75,
    bias: 'gauche',
    description: 'Média écologiste indépendant, bien sourcé'
  },
  {
    domain: 'bastamag.net',
    name: 'Basta!',
    type: 'pure-player',
    baseScore: 72,
    bias: 'gauche',
    description: 'Enquêtes sociales sourcées'
  },
  {
    domain: 'slate.fr',
    name: 'Slate FR',
    type: 'pure-player',
    baseScore: 74,
    bias: 'centre-gauche',
    description: 'Magazine en ligne, analyses décryptage'
  },
  {
    domain: 'huffingtonpost.fr',
    name: 'HuffPost FR',
    type: 'pure-player',
    baseScore: 68,
    bias: 'centre-gauche',
    description: 'Info/opinion en ligne'
  },

  // ────────── MÉDIAS PROBLÉMATIQUES (BASE SCORE < 50) ──────────────
  {
    domain: 'cnews.fr',
    name: 'CNews',
    type: 'tv',
    baseScore: 48,
    bias: 'droite',
    description: '⚠️ Chaîne d\'opinion, contenu sensationnaliste, mises en demeure ARCOM'
  },
  {
    domain: 'sudradio.fr',
    name: 'Sud Radio',
    type: 'radio',
    baseScore: 52,
    bias: 'droite',
    description: '⚠️ Contenus complotistes réguliers'
  },
  {
    domain: 'francesoir.fr',
    name: 'FranceSoir',
    type: 'pure-player',
    baseScore: 25,
    bias: 'extremiste',
    description: '🚨 Déréférencé Google News, désinformation COVID, perte agrément presse'
  },
  {
    domain: 'les-crises.fr',
    name: 'Les Crises',
    type: 'blog',
    baseScore: 35,
    bias: 'gauche',
    description: '⚠️ Blog d\'analyse pro-russe en géopolitique'
  },

  // ────────── SOURCES EXTRÉMISTES & DÉSINFORMATION (BASE SCORE 0-20) ──────────────
  {
    domain: 'egaliteetreconciliation.fr',
    name: 'Égalité & Réconciliation',
    type: 'extremiste',
    baseScore: 5,
    bias: 'extremiste',
    description: '🚨 Site de Soral, condamnations multiples, désinformation systématique',
    isExtremist: true
  },
  {
    domain: 'fdesouche.com',
    name: 'Fdesouche',
    type: 'extremiste',
    baseScore: 12,
    bias: 'extremiste',
    description: '🚨 Agrégateur identitaire, décontextualisation',
    isExtremist: true
  },
  {
    domain: 'ripostelaique.com',
    name: 'Riposte Laïque',
    type: 'extremiste',
    baseScore: 8,
    bias: 'extremiste',
    description: '🚨 Site islamophobe, condamnations',
    isExtremist: true
  },

  // ────────── SATIRE & PARODIE (BASE SCORE 0) ──────────────
  {
    domain: 'legorafi.fr',
    name: 'Le Gorafi',
    type: 'satire',
    baseScore: 0,
    bias: 'satirique',
    description: '📰 Parodie d\'actualité (équivalent français de The Onion)',
    isParody: true
  },
  {
    domain: 'legorafi.com',
    name: 'Le Gorafi',
    type: 'satire',
    baseScore: 0,
    bias: 'satirique',
    description: '📰 Parodie d\'actualité',
    isParody: true
  },
  {
    domain: 'poisson-avril.fr',
    name: 'Poisson d\'Avril',
    type: 'satire',
    baseScore: 0,
    bias: 'satirique',
    description: '📰 Parodie satirique',
    isParody: true
  },
];

/**
 * Find media source by domain
 */
export function findMediaSource(url: string): MediaSource | null {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '').toLowerCase();
    
    return MEDIA_DATABASE.find(media => 
      domain.includes(media.domain) || media.domain.includes(domain)
    ) || null;
  } catch {
    return null;
  }
}

/**
 * Get bias color/icon
 */
export function getBiasIcon(bias: string): string {
  const icons: Record<string, string> = {
    'gauche': '🔴',
    'centre-gauche': '🟡',
    'centre': '⚪',
    'centre-droit': '🟠',
    'droite': '🔵',
    'extremiste': '⚫',
    'satirique': '🤣',
    'indépendant': '⭐'
  };
  return icons[bias] || '❓';
}
