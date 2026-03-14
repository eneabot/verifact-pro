# ⚡ verifact PRO — Autonomous Fact-Checking for French News

A modern, autonomous fact-checking system that analyzes any French news article in real-time.

## 🎯 Features

- **Parody Detection** — Automatically identifies satire sources (Le Gorafi, etc.)
- **Source Credibility (40%)** — Database of ~50 French media outlets with base scores
- **Content Analysis (60%)** — LLM-powered analysis of article tone, sources, logic
- **Bias Detection** — Identifies political leanings (left, center, right, extremist)
- **Real-Time Scoring** — Dynamic 0-100 score with detailed breakdown
- **Smart Scraping** — Uses Jina AI to extract clean article text (no paywalls)
- **Beautiful UI** — Modern React + Tailwind interface with animated gauges

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend (React + Tailwind)                │
│  - Search bar                               │
│  - Animated score gauge                     │
│  - Detailed verdict & justifications        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  API Route (/api/analyze)                   │
│  1. Extract media source (40% weight)       │
│  2. Scrape article via Jina AI              │
│  3. Analyze with LLM (60% weight)           │
│  4. Return weighted score + justifications  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Data Sources                               │
│  - Media Database (~50 French sources)      │
│  - Jina AI API (content extraction)         │
│  - OpenAI / Anthropic (LLM analysis)        │
└─────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenAI or Anthropic API key (optional, for enhanced LLM analysis)

### Installation

```bash
cd verifact-pro
npm install
```

### Configuration

Copy `.env.example` to `.env.local` and add your API keys:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:
```env
# Option 1: OpenAI
OPENAI_API_KEY=sk-proj-xxxxx...

# Option 2: Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx...
```

**Note:** Without an API key, verifact still works using heuristic-based fallback analysis.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## 🎓 How It Works

### Scoring Algorithm

**Final Score = (Source Score × 0.4) + (Content Score × 0.6)**

#### Source Score (40%)
Based on the media outlet's historical credibility:
- **90-100**: Agences de presse (AFP, Reuters)
- **80-89**: Quotidiens établis (Le Monde, Libération)
- **70-79**: Service public, hebdomadaires
- **50-69**: TV continue, radio privée
- **20-49**: Médias problématiques
- **0-19**: Extrémistes, désinformation
- **0**: Satire/Parodie

#### Content Score (60%)
Analyzed by LLM based on:
- **Evidence**: Citations, numbers, external sources
- **Tone**: Neutral vs. sensationalist/emotional
- **Logic**: Absence of sophisms, conspiracy shortcuts
- **Structure**: Coherence and clarity

### Special Cases

- **Parody Detected** → Score = 0, Label = "PARODIE / SATIRE" 🤣
- **Extremist Source** → Score = 5-20, Label = "DÉSINFORMATION" 🚨
- **Unknown Source** → Score = 50 (fallback), requires manual verification

## 📊 Example Results

```
URL: https://legorafi.fr/article
Result: 🤣 PARODIE — Score 0/100 — "Ne pas partager comme fait réel"

URL: https://lemonde.fr/article
Result: ✅ FIABLE — Score 85/100 — "Source de confiance"

URL: https://francesoir.fr/article
Result: 🚨 DÉSINFORMATION — Score 20/100 — "À vérifier absolument"
```

## 🌍 Deployment

### Option 1: Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Option 2: Cloudflare Pages

```bash
npm run build
# Deploy ./out folder to Cloudflare Pages
```

### Option 3: Self-hosted (Docker)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY .next ./.next
COPY public ./public
CMD ["npm", "start"]
```

## 🔧 Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | No | OpenAI API for enhanced LLM analysis |
| `ANTHROPIC_API_KEY` | No | Anthropic API for enhanced LLM analysis |
| `NODE_ENV` | No | `development` or `production` |

## 📚 API Reference

### POST /api/analyze

**Request:**
```json
{
  "url": "https://lemonde.fr/article-example"
}
```

**Response:**
```json
{
  "score": 85,
  "label": "✅ SOURCE FIABLE",
  "verdict": "Source de confiance — vérification rigoureuse recommandée",
  "satire": false,
  "bias": "centre-gauche",
  "source": {
    "name": "Le Monde",
    "type": "quotidien",
    "description": "Journal de référence avec fact-checking (Décodeurs)"
  },
  "recommendations": {
    "action": "✅ Peut être partagé avec confiance",
    "explanation": "Cette source a un historique de vérification rigoureuse."
  },
  "llmJustifications": [
    "✓ Langage neutre",
    "✓ Présence de sources externes",
    "✓ Utilise des citations/sources"
  ],
  "scoreBreakdown": {
    "source": 87,
    "content": 83,
    "final": 85
  }
}
```

## 🤝 Contributing

Contributions are welcome! To improve verifact:

1. Add more sources to `src/lib/mediaDB.ts`
2. Improve the LLM prompt in `src/app/api/analyze/route.ts`
3. Enhance the UI components
4. Add multilingual support

## ⚖️ Legal

This tool is for informational purposes. Media credibility scores are based on:
- Journalistic rigor and editorial standards
- Fact-checking capabilities
- Historical accuracy record
- Independence and transparency

Scores are **not** definitive judgments but rather **analytical aids** to encourage critical media literacy.

## 📄 License

MIT License — See LICENSE file

## 🔗 Resources

- [Jina AI](https://jina.ai/) — Content extraction
- [OpenAI API](https://openai.com/api/) — LLM analysis
- [Anthropic Claude](https://www.anthropic.com/) — Alternative LLM
- [Décodex (Le Monde)](https://www.lemonde.fr/les-decodeurs/) — French fact-checking
- [AFP Factuel](https://www.afp.com/fr/agence/afp-factuel) — French fact-checking

---

Built with ⚡ by Enea
