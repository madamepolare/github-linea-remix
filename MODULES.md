# Linea Suite — Functional Modules

---

## 1. Dashboard

**Purpose:** Centralized overview of agency activity and key metrics.

**User actions:**
- View real-time KPIs (revenue, active projects, pending tasks)
- Customize widget layout (drag & drop grid)
- Switch between predefined templates (Personal, Projects, Finance)
- Access quick actions for common tasks

**Relations:**
- Pulls data from: Projects, Tasks, Invoicing, CRM
- Links to: All modules via quick actions

---

## 2. CRM

**Purpose:** Manage business relationships — companies, contacts, and sales opportunities.

**User actions:**
- Create/edit companies with SIRET auto-lookup
- Manage contacts linked to companies
- Track leads through customizable pipelines (Kanban)
- Run AI-powered prospect searches
- Import contacts from CSV
- Send bulk emails to pipeline entries
- View communication history per entity

**Relations:**
- Feeds into: Projects (client selection), Commercial (quote recipient), Tenders (MOA)
- Syncs with: Gmail (email history), Tenders (partner candidates)

---

## 3. Projects

**Purpose:** Manage project lifecycle from initiation to completion.

**User actions:**
- Create projects linked to CRM clients
- Define phases (ESQ, APS, APD, PRO, DCE, etc.) with Gantt timeline
- Set phase dependencies and auto-calculate dates
- Track deliverables per phase
- Assign team members with roles
- Monitor budget vs. actuals
- Generate meeting reports
- Manage permits and insurances

**Relations:**
- Created from: Commercial (signed quote), Tenders (won bid)
- Links to: Tasks (project tasks), Invoicing (project invoices), Commercial (linked quotes)
- Feeds: Planning (resource allocation), Team (time tracking)

---

## 4. Tasks

**Purpose:** Track and manage work items across the agency.

**User actions:**
- Create tasks with priority, due date, assignees
- Organize via Kanban board or list view
- Add subtasks and checklists
- Comment with @mentions
- Track time spent on tasks
- Filter by project, assignee, status, tags
- Archive completed tasks

**Relations:**
- Linked to: Projects (project tasks), Tenders (bid preparation tasks)
- Feeds: Planning (scheduled tasks), Team (time entries)
- Generated from: Deliverables, AI suggestions

---

## 5. Commercial

**Purpose:** Create and manage quotes, contracts, and fee proposals.

**User actions:**
- Build quotes with phase-based fee structure
- Calculate fees automatically (% of construction budget or fixed)
- Add optional items and variants
- Apply custom PDF themes with agency branding
- Track quote versions
- Send quotes via email
- Collect e-signatures
- Convert signed quotes to projects
- Define payment schedules

**Relations:**
- Sources from: CRM (client), Projects (existing project)
- Converts to: Projects (new project), Invoicing (scheduled invoices)
- Uses: Quote themes, Contract templates, Phase templates

---

## 6. Invoicing

**Purpose:** Bill clients and track payments.

**User actions:**
- Generate invoices from quote payment schedules
- Create manual invoices
- Track payment status (draft, sent, partial, paid, overdue)
- Record payments
- Send payment reminders
- Generate credit notes
- Export for accounting
- Submit to Chorus Pro (public sector)

**Relations:**
- Sources from: Commercial (payment schedule), Projects
- Links to: CRM (billing profile), Documents (PDF storage)

---

## 7. Tenders (Appels d'Offres)

**Purpose:** Manage responses to public and private procurement.

**User actions:**
- Create tender entries with key dates
- Upload DCE documents for AI analysis
- Extract requirements, criteria, and deadlines automatically
- Manage Go/No-Go decisions
- Build team with partners (synced to CRM)
- Track required documents and deliverables
- Write technical memos with AI assistance
- Assign tasks by discipline template

**Relations:**
- Syncs with: CRM (MOA, partners)
- Converts to: Projects (won tender)
- Generates: Tasks (from templates)
- Configured by: Discipline settings (architecture, communication, scenography)

---

## 8. Planning

**Purpose:** Visualize and manage team workload.

**User actions:**
- View team planning grid (weekly/monthly)
- Create time entries (manual or timer)
- Assign tasks to specific time slots
- View absences overlay
- Track billable vs. non-billable time
- Export timesheets
- Get AI planning suggestions

**Relations:**
- Pulls from: Tasks (scheduled tasks), Team (members, absences)
- Links to: Projects (time per project)
- Feeds: Reports (time analytics)

---

## 9. Team / HR

**Purpose:** Manage team members, HR data, and administrative tasks.

**User actions:**
- Maintain employee directory with profiles
- Track employment info (contract type, dates, salary)
- Manage leave requests and balances
- Record absences (sick, vacation, training)
- Schedule and document performance reviews
- Handle recruitment (job offers, applications)
- Export payroll variables
- Manage apprentice school calendars

**Relations:**
- Feeds: Planning (availability), Projects (team assignment)
- Uses: Documents (HR documents)

---

## 10. Documents

**Purpose:** Centralized document management (GED).

**User actions:**
- Upload and organize documents by category
- Create documents from templates
- Track document versions
- Collect e-signatures
- Set reminders for renewals
- Link documents to projects, contacts, or companies

**Relations:**
- Linked to: Projects, CRM, Team, Commercial, Invoicing
- Generates: PDFs (quotes, invoices, contracts)

---

## 11. References

**Purpose:** Manage agency portfolio for communication and tenders.

**User actions:**
- Create reference sheets with images and data
- Tag by project type, client, year
- Mark featured projects
- Export to PDF for tender responses
- Filter and search portfolio

**Relations:**
- Sources from: Projects (completed projects)
- Used by: Tenders (portfolio attachments)

---

## 12. Campaigns

**Purpose:** Track marketing/communication campaigns (for communication agencies).

**User actions:**
- Create campaigns with briefs and objectives
- Define deliverables and assignments
- Track budget spent vs. allocated
- Monitor KPIs
- Manage campaign timeline

**Relations:**
- Links to: CRM (client), Projects (if campaign = project)
- Uses: Tasks (campaign tasks)

---

## 13. Media Planning

**Purpose:** Plan media placements and advertising schedules.

**User actions:**
- Create media calendar
- Schedule placements by channel
- Track costs and reach
- View list or calendar mode

**Relations:**
- Links to: Campaigns, CRM (media partners)

---

## 14. Messages

**Purpose:** Internal team communication.

**User actions:**
- Create team channels
- Send direct messages
- Share files
- Use @mentions
- React with emojis
- Search message history

**Relations:**
- Linked to: Team (members)
- Contextual to: Projects, Tasks (via mentions)

---

## 15. Reports

**Purpose:** Analytics and reporting across modules.

**User actions:**
- View financial reports (revenue, margins)
- Analyze project profitability
- Track time by project/member
- Generate HR statistics
- Export data

**Relations:**
- Aggregates from: Projects, Invoicing, Planning, Team, Commercial

---

## 16. Settings

**Purpose:** Configure workspace and system behavior.

**User actions:**
- Manage workspace info (name, logo, colors)
- Configure modules (enable/disable)
- Set up pipelines and stages
- Define project types and categories
- Create phase templates
- Manage quote themes
- Configure permissions matrix
- Set up email templates
- Connect integrations (Gmail, calendars)

**Relations:**
- Configures: All modules
- Manages: Team (members, roles, permissions)

---

## Module Dependency Map

```
CRM ──────────────┬──────────────► Projects ◄────────── Tenders
  │               │                    │                    │
  │               ▼                    ▼                    │
  │          Commercial ──────► Invoicing                   │
  │               │                    │                    │
  │               └────────────────────┼────────────────────┘
  │                                    │
  ▼                                    ▼
Team ◄────────────────────────── Planning
  │                                    ▲
  │                                    │
  └─────────────► Tasks ───────────────┘
                    │
                    ▼
              Documents ◄──────── Reports
```

---

## Cross-Module Features

| Feature | Modules Involved |
|---------|------------------|
| Time tracking | Tasks, Planning, Projects, Team |
| E-signature | Commercial, Documents, Invoicing |
| PDF generation | Commercial, Invoicing, Documents, Projects |
| AI assistance | Tenders, Commercial, Tasks, CRM |
| Email integration | CRM, Commercial, Invoicing |
| Client portals | Commercial, Projects |
| Discipline config | Tenders, Projects, Commercial |
