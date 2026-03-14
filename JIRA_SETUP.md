# 🎫 Jira Setup — Ticket Management for verifact PRO

## Access

**Project:** verifact-pro (Free Cloud)  
**Link:** https://verifact-pro.atlassian.net (À créer)  
**Auth:** GitHub OAuth

## Workflow

1. **Bug/Feature Request** — Create ticket in Jira
2. **I (Enea) Pick It Up** — Assign to self, add to sprint
3. **Dev** — Branch + commits linked to ticket
4. **PR** — Reference ticket in PR description
5. **Deploy** — Merge to main, auto-close ticket
6. **You Test** — Create new bug ticket if found

## Ticket Types

- 🐛 **Bug** — Issues found in testing
- ✨ **Feature** — New capability request
- 🔧 **Task** — Infrastructure/ops work
- 📝 **Documentation** — Docs updates
- 🎯 **Epic** — Large initiatives (v1.1, v1.2, etc.)

## Current Sprint (v1.1)

### VF-1: ML Credibility Scoring
- Status: In Progress
- Assignee: Enea
- Due: 2026-03-21
- Description: Replace heuristic with XGBoost model

### VF-2: Fact-Check API Integration
- Status: In Progress
- Assignee: Enea
- Due: 2026-03-21

### VF-3: Image Authenticity Detection
- Status: Planned
- Assignee: Enea
- Due: 2026-03-28

### VF-4: Real-Time Monitoring
- Status: Planned
- Assignee: Enea
- Due: 2026-03-28

### VF-5: Browser Extension
- Status: Backlog
- Assignee: Enea
- Due: 2026-04-04

### VF-6: Telegram Bot
- Status: Backlog
- Assignee: Enea
- Due: 2026-04-04

## How to Report Issues

### 1. Create Jira Ticket
```
Title: [Brief description]
Type: Bug / Feature / Task
Description: Details + steps to reproduce
Priority: Highest / High / Medium / Low
Attachment: Screenshot if relevant
```

### 2. Or Just Tell Me (Telegram)
I'll create the ticket autonomously and notify you.

## Labels

- `bug-critical` — Breaks functionality
- `bug-minor` — Cosmetic or edge case
- `enhancement` — Nice-to-have improvement
- `urgent` — Fix ASAP
- `documentation` — Doc updates

## Sprint Schedule

- **Sprint Duration:** 2 weeks
- **Sprint Start:** Every Monday
- **Demo/Review:** Every Friday
- **Retro:** Friday EOD

## Automation

- GitHub commits auto-link to Jira
- PR title format: `VF-1: Fix credibility scoring`
- Auto-close tickets on merge to main
- Slack notifications (when configured)

---

**Status:** Ready for use  
**First Sprint:** v1.1 (2026-03-17 to 2026-03-31)
