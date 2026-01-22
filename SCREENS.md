# Linea Suite — Screens & Pages

---

## Public Pages (No Authentication)

### Welcome / Landing
| | |
|---|---|
| **Module** | Marketing |
| **Route** | `/` or `/welcome` |
| **Actions** | View product info, navigate to modules, access login |
| **Navigation** | Direct URL, app logo click when logged out |

### Authentication
| | |
|---|---|
| **Module** | Auth |
| **Route** | `/auth` |
| **Actions** | Sign in, sign up, forgot password |
| **Navigation** | Click "Se connecter" from landing |

### Reset Password
| | |
|---|---|
| **Module** | Auth |
| **Route** | `/reset-password` |
| **Actions** | Set new password after email link |
| **Navigation** | Email link from password reset flow |

### Onboarding
| | |
|---|---|
| **Module** | Auth |
| **Route** | `/onboarding` |
| **Actions** | Complete profile, create/join workspace |
| **Navigation** | Automatic redirect after first signup |

### Accept Invite
| | |
|---|---|
| **Module** | Auth |
| **Route** | `/invite` |
| **Actions** | Accept workspace invitation |
| **Navigation** | Email invitation link |

### Public Quote
| | |
|---|---|
| **Module** | Commercial |
| **Route** | `/q/:token` |
| **Actions** | View quote, download PDF, sign electronically |
| **Navigation** | Link sent by agency to client |

### Client Portal
| | |
|---|---|
| **Module** | Portal |
| **Route** | `/portal/:token` |
| **Actions** | View projects, tasks, invoices, submit requests |
| **Navigation** | Link shared with client contact |

### Company Portal
| | |
|---|---|
| **Module** | Portal |
| **Route** | `/company-portal/:token` |
| **Actions** | View all projects for company, access documents |
| **Navigation** | Link shared with company |

### Framework Request
| | |
|---|---|
| **Module** | Portal |
| **Route** | `/request/:token` |
| **Actions** | Submit request under framework agreement |
| **Navigation** | Link shared for framework contract requests |

### Module Detail (Marketing)
| | |
|---|---|
| **Module** | Marketing |
| **Route** | `/modules/:slug` |
| **Actions** | View module features, testimonials |
| **Navigation** | Landing page module cards |

### Solution Detail (Marketing)
| | |
|---|---|
| **Module** | Marketing |
| **Route** | `/solutions/:slug` |
| **Actions** | View solution by industry |
| **Navigation** | Landing page solutions section |

### Roadmap (Public)
| | |
|---|---|
| **Module** | Marketing |
| **Route** | `/roadmap` |
| **Actions** | View product roadmap |
| **Navigation** | Landing page footer |

### About / Blog / Contact
| | |
|---|---|
| **Module** | Marketing |
| **Routes** | `/about`, `/blog`, `/contact` |
| **Actions** | View company info, articles, contact form |
| **Navigation** | Landing page header/footer |

### Legal Pages
| | |
|---|---|
| **Module** | Legal |
| **Routes** | `/legal/cgv`, `/legal/privacy`, `/legal/mentions` |
| **Actions** | View terms, privacy policy, legal mentions |
| **Navigation** | Footer links |

---

## Protected Pages (Requires Authentication)

### Dashboard
| | |
|---|---|
| **Module** | Dashboard |
| **Route** | `/dashboard` |
| **Actions** | View KPIs, customize widgets, access quick actions |
| **Navigation** | Sidebar "Dashboard" icon, home after login |

### Profile
| | |
|---|---|
| **Module** | User |
| **Route** | `/profile` |
| **Actions** | Edit personal info, change password, notification settings |
| **Navigation** | Avatar dropdown → "Profil" |

### Notifications
| | |
|---|---|
| **Module** | User |
| **Route** | `/notifications` |
| **Actions** | View all notifications, mark as read |
| **Navigation** | Bell icon in header, notifications sidebar |

---

## CRM Module

### CRM Overview
| | |
|---|---|
| **Module** | CRM |
| **Route** | `/crm` or `/crm/overview` |
| **Actions** | View stats, recent activity, quick filters |
| **Navigation** | Sidebar "CRM" |

### CRM Contacts
| | |
|---|---|
| **Module** | CRM |
| **Route** | `/crm/contacts` |
| **Actions** | List/search contacts, create, import CSV, bulk actions |
| **Navigation** | CRM sub-nav "Contacts" |

### CRM Companies
| | |
|---|---|
| **Module** | CRM |
| **Route** | `/crm/companies` |
| **Actions** | List/search companies, create, SIRET lookup, categorize |
| **Navigation** | CRM sub-nav "Entreprises" |

### CRM Prospection
| | |
|---|---|
| **Module** | CRM |
| **Route** | `/crm/prospection` |
| **Actions** | View pipeline Kanban, move entries, send emails, AI prospect |
| **Navigation** | CRM sub-nav "Prospection" |

### Company Detail
| | |
|---|---|
| **Module** | CRM |
| **Route** | `/crm/companies/:id` |
| **Actions** | Edit company, view contacts, documents, quotes, invoices, history |
| **Navigation** | Click company row in list |

### Contact Detail
| | |
|---|---|
| **Module** | CRM |
| **Route** | `/crm/contacts/:id` |
| **Actions** | Edit contact, view communications, linked projects |
| **Navigation** | Click contact row in list |

### Lead Detail
| | |
|---|---|
| **Module** | CRM |
| **Route** | `/crm/leads/:id` |
| **Actions** | Edit lead, update stage, convert to project |
| **Navigation** | Click lead card in pipeline |

---

## Projects Module

### Projects List
| | |
|---|---|
| **Module** | Projects |
| **Route** | `/projects` or `/projects/list` |
| **Actions** | List/filter projects, create, view stats |
| **Navigation** | Sidebar "Projets" |

### Projects Timeline
| | |
|---|---|
| **Module** | Projects |
| **Route** | `/projects/timeline` |
| **Actions** | View all projects on Gantt timeline |
| **Navigation** | Projects sub-nav "Timeline" |

### Project Detail
| | |
|---|---|
| **Module** | Projects |
| **Route** | `/projects/:id` |
| **Actions** | View/edit project, manage phases, deliverables, team, budget |
| **Navigation** | Click project in list |

**Project Detail Tabs:**
- Synthèse (overview)
- Phases (Gantt timeline)
- Livrables (deliverables)
- Tâches (tasks)
- Commercial (quotes/contracts)
- Budget (financials)
- MOE (team structure)
- Documents (files)
- Événements (calendar)
- Chantier (construction tracking)

### Project Settings
| | |
|---|---|
| **Module** | Projects |
| **Route** | `/projects/:id/settings` |
| **Actions** | Configure project-specific settings |
| **Navigation** | Project detail → Settings gear icon |

---

## Tasks Module

### Tasks Board
| | |
|---|---|
| **Module** | Tasks |
| **Route** | `/tasks` or `/tasks/board` |
| **Actions** | View Kanban, drag tasks, create, quick edit |
| **Navigation** | Sidebar "Tâches" |

### Tasks List
| | |
|---|---|
| **Module** | Tasks |
| **Route** | `/tasks/list` |
| **Actions** | Table view with filters, bulk actions, inline edit |
| **Navigation** | Tasks sub-nav "Liste" |

### Tasks Archive
| | |
|---|---|
| **Module** | Tasks |
| **Route** | `/tasks/archive` |
| **Actions** | View completed tasks, restore |
| **Navigation** | Tasks sub-nav "Archives" |

### Task Detail
| | |
|---|---|
| **Module** | Tasks |
| **Route** | `/tasks/:taskId` |
| **Actions** | Edit task, manage subtasks, comments, time tracking |
| **Navigation** | Click task card or row |

---

## Commercial Module

### Commercial List
| | |
|---|---|
| **Module** | Commercial |
| **Route** | `/commercial` or `/commercial/list` |
| **Actions** | List quotes/contracts, filter by status, create |
| **Navigation** | Sidebar "Business" |

### Commercial Monthly
| | |
|---|---|
| **Module** | Commercial |
| **Route** | `/commercial/monthly` |
| **Actions** | View monthly revenue projection, pipeline value |
| **Navigation** | Commercial sub-nav "Mensuel" |

### Commercial Pipeline
| | |
|---|---|
| **Module** | Commercial |
| **Route** | `/commercial/pipeline` |
| **Actions** | View quotes in Kanban by status |
| **Navigation** | Commercial sub-nav "Pipeline" |

### Commercial Document Detail
| | |
|---|---|
| **Module** | Commercial |
| **Route** | `/commercial/:id` |
| **Actions** | View document, edit phases, send, track versions |
| **Navigation** | Click document in list |

### Quote Builder
| | |
|---|---|
| **Module** | Commercial |
| **Route** | `/commercial/quote/new` or `/commercial/quote/:id` |
| **Actions** | Build quote with phases, calculate fees, preview PDF, send |
| **Navigation** | "Nouveau devis" button, edit existing quote |

---

## Invoicing Module

### Invoicing Dashboard
| | |
|---|---|
| **Module** | Invoicing |
| **Route** | `/invoicing` |
| **Actions** | View KPIs (pending, overdue, paid), charts |
| **Navigation** | Sidebar "Facturation" |

### Invoices All
| | |
|---|---|
| **Module** | Invoicing |
| **Route** | `/invoicing/all` |
| **Actions** | List all invoices, filter, create |
| **Navigation** | Invoicing sub-nav "Toutes" |

### Invoices by Status
| | |
|---|---|
| **Module** | Invoicing |
| **Routes** | `/invoicing/pending`, `/invoicing/paid`, `/invoicing/overdue` |
| **Actions** | Filtered invoice lists |
| **Navigation** | Invoicing sub-nav tabs |

---

## Tenders Module

### Tenders Dashboard
| | |
|---|---|
| **Module** | Tenders |
| **Route** | `/tenders` |
| **Actions** | View pipeline stats, upcoming deadlines, create tender |
| **Navigation** | Sidebar "Appels d'Offre" |

### Tenders List
| | |
|---|---|
| **Module** | Tenders |
| **Route** | `/tenders/list` |
| **Actions** | Table view with filters, Kanban toggle |
| **Navigation** | Tenders sub-nav "Liste" |

### Tender Detail
| | |
|---|---|
| **Module** | Tenders |
| **Route** | `/tenders/:id` |
| **Actions** | View AI analysis, manage team, deliverables, mémoire |
| **Navigation** | Click tender in list |

**Tender Detail Tabs:**
- Synthèse (AI-extracted data)
- Équipe (team & partners)
- Livrables (documents to produce)
- Mémoire (technical memo)
- Documents (uploaded files)

---

## Team / HR Module

### HR Dashboard
| | |
|---|---|
| **Module** | Team |
| **Route** | `/team` or `/team/dashboard` |
| **Actions** | View headcount, absences, alerts, hours |
| **Navigation** | Sidebar "RH" |

### Team Users
| | |
|---|---|
| **Module** | Team |
| **Route** | `/team/users` |
| **Actions** | View directory, add member, edit profiles |
| **Navigation** | Team sub-nav "Équipe" |

### Time Tracking
| | |
|---|---|
| **Module** | Team |
| **Route** | `/team/time-tracking` |
| **Actions** | View time entries, validate, export timesheets |
| **Navigation** | Team sub-nav "Temps" |

### Absences
| | |
|---|---|
| **Module** | Team |
| **Route** | `/team/absences` |
| **Actions** | View/create absences, approve requests, balances |
| **Navigation** | Team sub-nav "Absences" |

### Salaries
| | |
|---|---|
| **Module** | Team |
| **Route** | `/team/salaries` |
| **Actions** | View salary info (restricted access) |
| **Navigation** | Team sub-nav "Salaires" |

### Evaluations
| | |
|---|---|
| **Module** | Team |
| **Route** | `/team/evaluations` |
| **Actions** | Schedule interviews, document evaluations |
| **Navigation** | Team sub-nav "Entretiens" |

### Payroll Variables
| | |
|---|---|
| **Module** | Team |
| **Route** | `/team/payroll` |
| **Actions** | Export payroll data for accounting |
| **Navigation** | Team sub-nav "Variables" |

---

## Planning Module

### Team Planning
| | |
|---|---|
| **Module** | Planning |
| **Route** | `/planning` |
| **Actions** | View grid by member, add time entries, schedule tasks |
| **Navigation** | Sidebar "Planning" |

---

## Documents Module

### Documents Dashboard
| | |
|---|---|
| **Module** | Documents |
| **Route** | `/documents` or `/documents/dashboard` |
| **Actions** | View recent, stats, pending signatures |
| **Navigation** | Sidebar "Documents" |

### Documents by Category
| | |
|---|---|
| **Module** | Documents |
| **Routes** | `/documents/all`, `/documents/administrative`, `/documents/project`, `/documents/hr` |
| **Actions** | List/filter documents, upload, create from template |
| **Navigation** | Documents sub-nav |

---

## References Module

### References List
| | |
|---|---|
| **Module** | References |
| **Route** | `/references` |
| **Actions** | View portfolio, filter, create reference |
| **Navigation** | Sidebar "Références" |

### Reference Detail
| | |
|---|---|
| **Module** | References |
| **Route** | `/references/:id` |
| **Actions** | Edit reference, manage images, export PDF |
| **Navigation** | Click reference card |

---

## Campaigns Module

### Campaigns List
| | |
|---|---|
| **Module** | Campaigns |
| **Route** | `/campaigns` |
| **Actions** | List campaigns, filter by status, create |
| **Navigation** | Sidebar "Campagnes" |

### Campaign Detail
| | |
|---|---|
| **Module** | Campaigns |
| **Route** | `/campaigns/:id` |
| **Actions** | Edit campaign, manage deliverables, track KPIs |
| **Navigation** | Click campaign in list |

---

## Media Planning Module

### Media Planning Calendar
| | |
|---|---|
| **Module** | Media Planning |
| **Route** | `/media-planning` |
| **Actions** | View calendar, create placements, track budget |
| **Navigation** | Sidebar "Planning Média" |

---

## Messages Module

### Messages
| | |
|---|---|
| **Module** | Messages |
| **Route** | `/messages` |
| **Actions** | View channels, send messages, create channel |
| **Navigation** | Sidebar "Messages" |

### Channel Detail
| | |
|---|---|
| **Module** | Messages |
| **Route** | `/messages/:channelId` |
| **Actions** | View/send messages in channel, share files |
| **Navigation** | Click channel in sidebar |

---

## Reports Module

### Reports Overview
| | |
|---|---|
| **Module** | Reports |
| **Route** | `/reports` |
| **Actions** | Select report type |
| **Navigation** | Sidebar "Rapports" |

### Report Sections
| | |
|---|---|
| **Module** | Reports |
| **Routes** | `/reports/finance`, `/reports/projects`, `/reports/time`, `/reports/hr` |
| **Actions** | View analytics, charts, export data |
| **Navigation** | Reports sub-nav |

---

## Other Modules

### Materials
| | |
|---|---|
| **Module** | Materials |
| **Route** | `/materials` |
| **Actions** | Manage material library |
| **Navigation** | Sidebar "Matériaux" |

### Objects (Orders)
| | |
|---|---|
| **Module** | Objects |
| **Route** | `/objects` |
| **Actions** | Track furniture/equipment orders |
| **Navigation** | Sidebar "Commandes" |

### Chantier (Construction)
| | |
|---|---|
| **Module** | Chantier |
| **Routes** | `/chantier`, `/chantier/:projectId`, `/chantier/:projectId/:section` |
| **Actions** | Track construction phase, meetings, interventions |
| **Navigation** | Sidebar "Chantier" or from project |

### Documentation (Knowledge Base)
| | |
|---|---|
| **Module** | Documentation |
| **Route** | `/documentation` |
| **Actions** | View/create internal wiki pages |
| **Navigation** | Sidebar "Documentation" |

### Documentation Page
| | |
|---|---|
| **Module** | Documentation |
| **Route** | `/documentation/:id` |
| **Actions** | View/edit documentation page |
| **Navigation** | Click page in documentation list |

### App Roadmap (Internal)
| | |
|---|---|
| **Module** | Meta |
| **Route** | `/app-roadmap` |
| **Actions** | View app feature roadmap, submit feedback |
| **Navigation** | Settings or help menu |

---

## Settings Module

### Settings
| | |
|---|---|
| **Module** | Settings |
| **Route** | `/settings` |
| **Actions** | Configure all workspace settings |
| **Navigation** | Sidebar "Paramètres" or gear icon |

**Settings Sections:**
- Workspace (name, logo, colors)
- Modules (enable/disable)
- Members (users, roles)
- Permissions (matrix editor)
- Projects (types, categories, phases)
- Commercial (templates, themes, VAT)
- Tenders (discipline config)
- CRM (pipelines, categories)
- Documents (templates)
- Integrations (Gmail, calendars)
- Notifications

### Create Workspace
| | |
|---|---|
| **Module** | Settings |
| **Route** | `/settings/workspace/new` |
| **Actions** | Create new workspace |
| **Navigation** | Workspace switcher → "Créer" |

---

## Summary

| Category | Count |
|----------|-------|
| Public pages | 14 |
| Auth pages | 4 |
| Dashboard | 1 |
| CRM | 6 |
| Projects | 4 |
| Tasks | 4 |
| Commercial | 5 |
| Invoicing | 5 |
| Tenders | 3 |
| Team/HR | 7 |
| Planning | 1 |
| Documents | 5 |
| References | 2 |
| Campaigns | 2 |
| Media Planning | 1 |
| Messages | 2 |
| Reports | 5 |
| Other | 6 |
| Settings | 2 |
| **Total** | **~75 screens** |
