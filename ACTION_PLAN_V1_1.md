# 🚀 verifact PRO v1.1 — Action Plan

## Strategic Priority (Autonomous Decision)

### Why This Order?
1. **ML Scoring** — Core engine improvement (highest impact)
2. **Fact-Check APIs** — Real data integration (credibility boost)
3. **Image Detection** — Multi-modal support (30% of requests)
4. **Real-Time Monitoring** — Trending claims (engagement)
5. **Browser Extension** — Distribution (growth lever)
6. **Telegram Bot** — Engagement (mobile-first)

## v1.1 Implementation Timeline

### Week 1 (2026-03-17 to 2026-03-23)

#### VF-1: ML Credibility Scoring
**Status:** In Progress  
**Files Created:**
- `src/lib/ml/credibility.py` — XGBoost placeholder
- Extracts 10 features from content
- Ensemble: source 40% × content 60%

**Next Steps:**
1. ✅ Feature extraction (done)
2. 🔲 Train XGBoost model (need data)
3. 🔲 API integration
4. 🔲 A/B test vs heuristics

**Effort:** 16h  
**Assignee:** Enea  
**Deadline:** 2026-03-21

#### VF-2: Fact-Check DB Integration
**Status:** In Progress  
**Files Created:**
- `src/lib/factcheck-api.ts` — Multi-source aggregator
- WikiFactCheck + Snopes + AFP Factuel
- Verdict mapping + confidence scoring

**Next Steps:**
1. ✅ API skeleton (done)
2. 🔲 WikiFactCheck implementation
3. 🔲 Snopes scraping/partnership
4. 🔲 Real-time indexing

**Effort:** 12h  
**Assignee:** Enea  
**Deadline:** 2026-03-21

### Week 2 (2026-03-24 to 2026-03-30)

#### VF-3: Image Authenticity Detection
**Status:** Planned  
**Components:**
- AI-generated image detection (TinyImageNet)
- Reverse image search (Google Images API)
- Metadata extraction (EXIF)
- Deepfake face detection (MediaPipe)

**Tech Stack:**
- Python + OpenCV
- Hugging Face models
- Google Images API

**Effort:** 20h  
**Deadline:** 2026-03-28

#### VF-4: Real-Time Monitoring
**Status:** Planned  
**Components:**
- NewsAPI integration (trending articles)
- Automatic claim extraction
- Batch fact-checking
- "Checked 2h ago" metadata

**Tech Stack:**
- NewsAPI (free tier)
- Scheduled jobs (Node-cron)
- Redis cache

**Effort:** 16h  
**Deadline:** 2026-03-28

### Week 3-4 (2026-03-31 to 2026-04-13)

#### VF-5: Browser Extension
**Planned Components:**
- Chrome/Firefox support
- Right-click context menu
- Sidebar with analysis
- Dark/light themes

**Tech:** Manifest V3 + React

#### VF-6: Telegram Bot
**Planned Components:**
- `/check <url>` command
- Inline analysis
- Saved checks history
- Inline sharing

**Tech:** python-telegram-bot + FastAPI

## Testing & Feedback Loop

### Phase 1: Internal Testing (You)
1. **Clone v1.1 branch** when ready
2. **Test specific features** — report via Jira
3. **Bug reports format:**
   ```
   Title: [BUG] ML scoring too high for satire
   Steps: 1. Go to https://...
          2. Click Analyze
          3. See score 45, expected 0
   ```

### Phase 2: Iteration
- **Bug severity:** Critical / High / Medium / Low
- **Fix SLA:** Critical = <4h, High = <24h
- **Auto-updates** on main branch

### Phase 3: Release
- **Public beta** when v1.1 stable
- **User feedback** collection
- **Metrics** (accuracy, speed, crashes)

## Metrics to Track

### Accuracy
- Vs known fact-checks: target >95%
- Vs human reviewers: target >92%

### Performance
- Response time: <3s target
- API latency: <500ms

### Engagement
- Daily active users
- Checks per user
- Extension installs
- Bot commands

## How to Report Issues

### Option A: Direct Telegram
```
"Bug: ML model gives 85 for Le Gorafi"
```
→ I'll create VF-{N} automatically

### Option B: Create Jira Ticket
```
https://verifact-pro.atlassian.net
Type: Bug
Title: ML scoring too high for parodies
```

### Option C: GitHub Issue
```
https://github.com/eneabot/verifact-pro/issues
Label: [bug]
```

---

## My Autonomy Contract

I will:
- ✅ Decide priorities myself (with your strategic input)
- ✅ Push code daily (when changes made)
- ✅ Create tickets for bugs you report
- ✅ Close tickets on deploy
- ✅ Update docs automatically
- ✅ Stay <2h response time for critical bugs

You will:
- ✅ Test features (when deployed)
- ✅ Report bugs (any format)
- ✅ Provide strategic direction (when needed)
- ✅ Give GTM feedback (when ready)

---

**Status:** Ready to Execute  
**Sprint Start:** 2026-03-17 (Monday)  
**Sprint End:** 2026-03-31 (Monday)  
**Demo:** Every Friday EOD
