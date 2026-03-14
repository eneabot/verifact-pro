# Changelog — verifact PRO

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-03-14

### Added
- ✨ **Autonomous Fact-Checking System** — Full Next.js app with TypeScript
- ✨ **Parody Detection** — Automatically identifies satire sources (Le Gorafi = 0/100)
- ✨ **Weighted Scoring Algorithm**
  - Source credibility: 40% (database of 50 French media)
  - Content analysis: 60% (LLM-powered)
  - Final score: 0-100
- ✨ **LLM Integration** — OpenAI GPT-4o or Anthropic Claude
  - Analyzes evidence, tone, logic
  - Fallback heuristic without API key
- ✨ **Bias Detection** — Political leanings (gauche/centre/droite/extremiste)
- ✨ **Smart Scraping** — Jina AI integration for clean content extraction
- ✨ **Beautiful UI**
  - React + Tailwind CSS
  - Animated score gauge
  - Real-time feedback
  - Responsive design
- ✨ **API Route** — POST /api/analyze for programmatic access
- ✨ **Media Database**
  - ~50 French news sources
  - Detailed metadata (type, bias, description)
  - Extremist & parody detection flags
- ✨ **Cloudflare Tunnel** — Free, secure public access
- ✨ **GitHub Actions** — CI/CD pipeline for builds
- 📝 **Documentation**
  - README.md with full API docs
  - DEPLOYMENT.md for ops
  - CHANGELOG.md (this file)

### Database Coverage
- **Agences:** AFP (95), Reuters (93)
- **Quotidiens:** Le Monde (87), Libération (80), Le Figaro (82), Le Parisien (78)
- **Service Public:** France Info (86), France 24 (84), Radio France (83)
- **Hebdos:** Le Point (76), L'Express (76), L'Obs (75), Le Canard Enchaîné (86)
- **Pure-players:** Mediapart (85), Reporterre (75), Slate (74), Basta! (72)
- **TV:** BFM TV (68), TF1 (70), LCI (70), CNews (48)
- **Radio:** RTL (73), Europe 1 (62), Sud Radio (52)
- **Satire:** Le Gorafi (0), Poisson d'Avril (0)
- **Extremistes:** E&R (5), Fdesouche (12), Riposte Laïque (8)
- **Problématiques:** FranceSoir (25), Les Crises (35)

## Roadmap

### [1.1.0] - Coming Soon
- [ ] Custom domain setup (e.g., verifact.pro)
- [ ] Move to Cloudflare Tunnel with account (permanent URL)
- [ ] Sentry error tracking
- [ ] Better LLM caching
- [ ] Historical score tracking
- [ ] Shareable verdict cards

### [1.2.0]
- [ ] Browser extension
- [ ] Telegram bot integration
- [ ] Twitter/X bot for automated checks
- [ ] Multi-language support (EN, ES, DE)

### [2.0.0]
- [ ] Machine learning model for content analysis
- [ ] Cross-reference checking with other fact-checkers
- [ ] Source credibility learning from user feedback
- [ ] Real-time news monitoring

---

**Current Version:** 1.0.0  
**Last Updated:** 2026-03-14 09:15 UTC  
**Status:** 🟢 OPERATIONAL
