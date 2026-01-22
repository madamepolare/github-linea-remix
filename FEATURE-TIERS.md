# Feature Tiers

Classification of all features by business criticality.

---

## 🔴 MUST HAVE (Core)

Features without which the app has no value. These are the daily-use, revenue-critical capabilities.

| Feature | Why Core |
|---------|----------|
| **Authentication & Workspaces** | No multi-tenant app without this |
| **CRM - Companies & Contacts** | Foundation for all client work |
| **Projects - CRUD & Status** | Central entity everything links to |
| **Tasks - Create, Assign, Track** | Daily operational backbone |
| **Quotes/Contracts - Builder & PDF** | How the agency gets paid |
| **Invoices - Generate & Track** | Direct revenue impact |
| **Time Tracking - Start/Stop/Log** | Billing accuracy, profitability |
| **Team Members - Profiles & Roles** | Who does what |
| **Planning - Resource Allocation** | Prevents overbooking, missed deadlines |
| **Documents - Upload & Organize** | Legal/contractual necessity |
| **Notifications - In-app Alerts** | Users miss critical updates without this |
| **Mobile Navigation** | 30%+ users are on mobile |

**Rule**: If this breaks, users cannot do their job.

---

## 🟡 NICE TO HAVE (Secondary)

Features that improve efficiency or experience but aren't blockers if missing.

| Feature | Why Secondary |
|---------|---------------|
| **CRM Pipelines (Kanban)** | Visual aid, but list view works too |
| **Leads Module** | Can use Contacts with a status instead |
| **Project Phases (Gantt)** | Helpful for complex projects, not all need it |
| **Quote Themes & Templates** | Speeds up work, but manual works |
| **Payment Schedules** | Useful for large contracts only |
| **Absences & Leave Requests** | Important for HR, not daily use |
| **Apprentice Schedules** | Niche (only agencies with apprentices) |
| **Email Integration** | Convenience, can use external email |
| **Document Templates** | Time-saver, not essential |
| **Dashboard Widgets** | Nice overview, but data exists elsewhere |
| **Project Sub-projects** | Only for very large projects |
| **Task Comments & Threads** | Collaboration boost, not critical path |
| **Bulk Actions (CRM, Tasks)** | Efficiency, not core workflow |
| **Search (Global)** | Very helpful at scale, small teams navigate manually |
| **Dark Mode** | User preference, not functional |
| **Post-it / Quick Tasks** | Convenience feature |
| **Client Portal** | Value-add for premium clients only |

**Rule**: Users would complain if removed, but could still operate.

---

## 🟢 EXPERIMENTAL

Features that are innovative, partially implemented, or serve edge cases.

| Feature | Why Experimental |
|---------|------------------|
| **AI Tender Analysis (DCE)** | Cutting-edge, still has 15-doc limit |
| **AI Budget Distribution** | Smart but fallback exists (proportional) |
| **AI Prospect Generation** | Unproven ROI, data quality varies |
| **Chorus Pro Integration** | French public market niche |
| **Media Planning Module** | Only for communication agencies |
| **Campaign Management** | Subset of users (marketing teams) |
| **Portfolio / References** | Nice for marketing, not operational |
| **Check-in / Check-out** | Hybrid work tracking, adoption unclear |
| **Push Notifications** | Requires user opt-in, low adoption typically |
| **Calendar Sync (Google/Outlook)** | Complex OAuth, maintenance burden |
| **E-Signature Flow** | Partially implemented, legal requirements vary |
| **Meeting Reports (CR)** | Specialized for architecture discipline |
| **Material Library** | Niche (interior design / architecture) |
| **Design Objects Library** | Very specialized use case |
| **Roadmap / Feedback Collection** | Meta-feature for product improvement |
| **Tender Partner Candidates** | Consortium management, rare use |
| **Knowledge Base** | Internal docs, often duplicates external wiki |
| **Job Offers & Applications** | HR expansion, not core agency work |

**Rule**: Could be removed or spun off without major user impact.

---

## Visual Summary

```
┌─────────────────────────────────────────────────────────────┐
│                        MUST HAVE                            │
│  Auth · CRM · Projects · Tasks · Quotes · Invoices · Time   │
│  Team · Planning · Documents · Notifications · Mobile       │
├─────────────────────────────────────────────────────────────┤
│                       NICE TO HAVE                          │
│  Pipelines · Leads · Gantt · Templates · Absences · Email   │
│  Widgets · Search · Dark Mode · Portal · Bulk Actions       │
├─────────────────────────────────────────────────────────────┤
│                       EXPERIMENTAL                          │
│  AI Analysis · Chorus Pro · Campaigns · Media Planning      │
│  E-Signature · Calendar Sync · Materials · References       │
└─────────────────────────────────────────────────────────────┘
```

---

## Decision Framework

When prioritizing bugs or improvements:

| Tier | Response Time | Refactor Priority |
|------|---------------|-------------------|
| Must Have | Immediate | High |
| Nice to Have | This sprint | Medium |
| Experimental | Backlog | Low |

---

## Module-to-Tier Mapping

| Module | Tier | Notes |
|--------|------|-------|
| Dashboard | Nice to Have | Aggregates data, not source of truth |
| CRM | **Must Have** | Client = revenue |
| Projects | **Must Have** | Everything links here |
| Tasks | **Must Have** | Daily operations |
| Commercial | **Must Have** | Quotes/Contracts = getting paid |
| Invoicing | **Must Have** | Revenue tracking |
| Planning | **Must Have** | Resource management |
| Team/HR | Mixed | Profiles = Must Have, Leave/Evals = Nice to Have |
| Documents | **Must Have** | Legal necessity |
| Tenders | Nice to Have | Not all agencies do public tenders |
| Campaigns | Experimental | Only communication agencies |
| Media Planning | Experimental | Very niche |
| Messages | Nice to Have | Internal comms, can use Slack |
| Reports | Nice to Have | Analytics, not operations |
| Settings | **Must Have** | Configuration = usability |
| References | Experimental | Marketing, not operations |
