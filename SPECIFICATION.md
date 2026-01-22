# Functional Specification: Linea Suite

**Version**: 1.0  
**Date**: January 2026  
**Purpose**: Complete specification for rebuilding the application from scratch.

---

## 1. Executive Summary

**Linea Suite** is a multi-tenant SaaS platform for professional service agencies (architecture, communication, design). It manages the full client lifecycle: prospecting → project delivery → invoicing → portfolio.

### Target Users
- Architecture firms (MOE contracts, permits, construction phases)
- Communication agencies (campaigns, media planning, briefs)
- Design studios (materials, objects, references)

### Core Value Proposition
One platform replacing: CRM + Project Management + Invoicing + Time Tracking + HR.

---

## 2. System Architecture

### 2.1 Tech Stack (Current)
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand (global) + React Query (server) |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| Realtime | Supabase Realtime subscriptions |
| PDF | jsPDF + html2canvas |
| Calendar | FullCalendar |
| Animations | Framer Motion |

### 2.2 Multi-Tenancy Model
- **Workspace** = tenant boundary
- All tables have `workspace_id` foreign key
- Row Level Security (RLS) enforces isolation
- Users can belong to multiple workspaces

### 2.3 Permission Model
```
Roles: owner > admin > manager > member > viewer

Permissions are:
1. Defined globally with defaults
2. Overridable per workspace via `workspace_role_permissions` table
3. Checked via `has_permission(user_id, permission_key)` SQL function
4. Exposed via `usePermissions()` hook
```

---

## 3. Data Model

### 3.1 Core Entities

#### Workspace
```
- id, name, slug
- logo_url, icon_url, favicon_url
- primary_color, accent_color
- discipline: "architecture" | "communication" | "design"
- enabled_modules: string[]
- settings: JSON (terminology overrides, defaults)
```

#### User Profile
```
- id (links to auth.users)
- email, first_name, last_name, avatar_url
- phone, job_title
- Belongs to: Workspaces (many-to-many via workspace_members)
```

#### Company (CRM)
```
- id, name, siret, vat_number
- address, city, postal_code, country
- industry, website, phone, email
- type: "client" | "prospect" | "partner" | "supplier"
- assigned_to: user_id
- Billing profile (1:1)
- Contacts (1:many)
- Projects (1:many)
```

#### Contact
```
- id, first_name, last_name, email, phone
- job_title, is_primary
- Belongs to: Company
- Can have: Portal access link
```

#### Project
```
- id, name, code, description
- status: "prospect" | "active" | "on_hold" | "completed" | "archived"
- start_date, end_date, deadline
- budget, color
- client_company_id, client_contact_id
- project_type: string (discipline-specific)
- Phases (1:many), Tasks (1:many), Deliverables (1:many)
- Team members (many-to-many)
```

#### Task
```
- id, title, description
- status: "todo" | "in_progress" | "review" | "done"
- priority: "low" | "medium" | "high" | "urgent"
- due_date, estimated_hours
- assigned_to: user_id
- project_id (optional)
- parent_id (for subtasks)
- tags: string[]
- Polymorphic relations: can link to Lead, Company, Contact, Tender
```

#### Commercial Document (Quote/Contract)
```
- id, document_number, document_type: "quote" | "contract"
- title, description
- status: "draft" | "sent" | "accepted" | "signed" | "rejected" | "expired"
- client_company_id, client_contact_id
- fee_mode: "fixed" | "percentage" | "hourly"
- total_amount, vat_rate, currency
- valid_until, signed_at
- Phases/Lines (1:many), Payment Schedule (1:many)
- PDF generation with themes
```

#### Invoice
```
- id, invoice_number
- status: "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled"
- client_company_id, project_id
- amount_ht, amount_ttc, vat_rate
- issue_date, due_date, paid_at
- Lines (1:many), Payments (1:many)
```

#### Time Entry
```
- id, user_id, project_id, task_id
- date, duration_minutes
- description, is_billable
- status: "draft" | "submitted" | "validated" | "invoiced"
```

### 3.2 Secondary Entities

| Entity | Purpose |
|--------|---------|
| Lead | Pre-qualified prospect before becoming Contact |
| Pipeline | Kanban stages for Leads or Contacts |
| Absence | Leave requests with approval workflow |
| Team Member | Extended profile (contract type, hourly cost, skills) |
| Tender | Public market opportunity with analysis workflow |
| Campaign | Marketing campaign with deliverables |
| Document (GED) | File storage with categories and signatures |
| Reference | Portfolio entry from completed projects |
| Notification | In-app alerts with read status |
| Communication | Activity log (notes, emails, calls) per entity |

### 3.3 Entity Relationships Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Workspace  │────<│   Company   │────<│   Contact   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   ▼                   │
       │            ┌─────────────┐            │
       │            │   Project   │<───────────┘
       │            └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────>│    Task     │────>│ Time Entry  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐     ┌─────────────┐
       └───────────>│   Quote     │────>│   Invoice   │
                    └─────────────┘     └─────────────┘
```

---

## 4. User Flows

### 4.1 Authentication
1. User visits `/login` or `/signup`
2. Email + password authentication (Supabase Auth)
3. Auto-confirm enabled (no email verification in dev)
4. On first login → onboarding wizard → create workspace
5. Session persisted, auto-redirect to `/dashboard`

### 4.2 Client Acquisition
```
Lead → Contact → Company → Project
         ↓
    Pipeline (Kanban)
         ↓
    Won/Lost tracking
```

1. Create Lead from prospecting or import
2. Move through pipeline stages (drag-and-drop)
3. Convert to Contact + Company when qualified
4. Create Project linked to Company

### 4.3 Project Delivery
```
Project → Phases → Tasks → Time Entries
              ↓
         Deliverables
              ↓
         Planning Grid
```

1. Create project (manual, from tender, or from signed quote)
2. Define phases with dates (Gantt view)
3. Break into tasks, assign to team
4. Track time against tasks
5. Mark deliverables complete
6. View resource allocation in planning

### 4.4 Invoicing
```
Quote → Sign → Project → Time/Milestones → Invoice → Payment
```

1. Create quote with line items
2. Send to client (PDF or portal link)
3. Client signs (e-signature or manual)
4. Generate project from signed quote
5. Create invoices from payment schedule or manually
6. Track payments, mark paid

### 4.5 Time Tracking
```
Start Timer → Work → Stop → Submit → Validate → Invoice
```

1. Start global timer (top bar)
2. Select project + optional task
3. Stop when done
4. Entry saved as "draft"
5. Submit for validation (if workflow enabled)
6. Admin validates → can be invoiced

---

## 5. Business Rules

### 5.1 Status Workflows

#### Quote Status
```
draft → sent → accepted → signed
                  ↓
              rejected
                  ↓
              expired (auto after valid_until)
```

#### Invoice Status
```
draft → sent → paid
          ↓
       partial (has payments but < total)
          ↓
       overdue (auto after due_date)
```

#### Project Status
```
prospect → active → on_hold → completed → archived
```

#### Task Status
```
todo ↔ in_progress ↔ review → done
```

### 5.2 Validation Rules

| Rule | Enforcement |
|------|-------------|
| Signed quotes are immutable | Block edit if `signed_at` is set |
| Validated time entries locked | Only admin can unlock |
| Invoice number sequential | Trigger generates on insert |
| Quote expiration | Background check or on-access |
| Absence requires approval | Status workflow with approver |
| Deletion blocked if linked | Check FK references before delete |

### 5.3 Calculations

#### Fee Calculation (Architecture)
```javascript
// Percentage mode (MOE)
fee = construction_budget * fee_percentage / 100

// Phase distribution
phases.forEach(phase => {
  phase.amount = fee * PHASE_PERCENTAGES[phase.code]
})
```

#### Invoice Totals
```javascript
amount_ht = lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0)
amount_ttc = amount_ht * (1 + vat_rate / 100)
```

### 5.4 Permissions Matrix

| Action | Owner | Admin | Manager | Member | Viewer |
|--------|-------|-------|---------|--------|--------|
| Create project | ✓ | ✓ | ✓ | ✓ | ✗ |
| Delete project | ✓ | ✓ | ✗ | ✗ | ✗ |
| View financials | ✓ | ✓ | ✓ | ✗ | ✗ |
| Manage team | ✓ | ✓ | ✗ | ✗ | ✗ |
| Validate time | ✓ | ✓ | ✓ | ✗ | ✗ |
| Access settings | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## 6. Module Specifications

### 6.1 MUST HAVE (Core)

#### Dashboard
- Widget-based layout (drag to reorder)
- Stats: revenue, tasks due, time logged, projects active
- Recent activity feed
- Quick actions

#### CRM
- Companies list with filters (type, industry, city)
- Company detail: info, contacts, projects, communications
- Contact management with portal access
- Pipeline view (Kanban) for leads/contacts
- SIRET auto-fill (French API)

#### Projects
- List + Kanban + Calendar views
- Project detail: overview, phases, tasks, team, documents, time
- Gantt chart for phases
- Deliverables tracking
- Budget monitoring

#### Tasks
- List view with grouping (status, project, client, tag)
- Kanban board
- Task detail sheet with subtasks, comments, time
- Filters: status, priority, assignee, due date
- Bulk actions

#### Commercial
- Quote builder with line items
- Phase templates by project type
- PDF preview with themes
- E-signature flow
- Payment schedule generator
- Contract amendments

#### Invoicing
- Invoice list with status filters
- Invoice generator (from quote schedule or manual)
- Payment tracking
- Credit notes
- Overdue reminders

#### Time Tracking
- Global timer (persistent across pages)
- Manual entry form
- Timesheet view (week/month)
- Validation workflow
- Billable vs non-billable

#### Planning
- Resource timeline (FullCalendar)
- Drag-and-drop task scheduling
- Absence overlay
- Workload indicators
- Team capacity view

#### Team
- Member list with roles
- Profile detail (employment info, skills, rate)
- Absence requests and approvals
- Performance evaluations (optional)

#### Documents
- File upload with categories
- Folder structure
- Template management
- Signature tracking

#### Settings
- Workspace branding (logo, colors)
- Module toggles
- Permission matrix
- Terminology customization
- Integration settings

### 6.2 NICE TO HAVE (Secondary)

| Module | Key Features |
|--------|--------------|
| Leads | Separate pre-qualification funnel |
| Search | Global search across all entities |
| Messages | Internal team chat per entity |
| Reports | Analytics dashboards, exports |
| Email | Gmail/Outlook integration |
| Widgets | Customizable dashboard |

### 6.3 EXPERIMENTAL

| Module | Key Features |
|--------|--------------|
| Tenders | AI analysis of public market documents |
| Campaigns | Marketing campaign management |
| Media Planning | Ad placement scheduling |
| References | Portfolio from completed projects |
| AI Features | Budget distribution, prospect generation |
| Chorus Pro | French public invoicing integration |

---

## 7. UI/UX Requirements

### 7.1 Design System
- **Framework**: Tailwind CSS + shadcn/ui
- **Colors**: HSL-based semantic tokens (--primary, --background, etc.)
- **Dark mode**: Full support via CSS variables
- **Typography**: System font stack, consistent sizing scale
- **Spacing**: 4px base unit

### 7.2 Responsive Breakpoints
```
sm: 640px   (mobile landscape)
md: 768px   (tablet)
lg: 1024px  (desktop)
xl: 1280px  (large desktop)
```

### 7.3 Navigation
- **Desktop**: Collapsible sidebar (260px expanded, 72px collapsed)
- **Mobile**: Bottom nav (5 items) + hamburger for full menu
- **TopBar**: Search, notifications, timer, user menu

### 7.4 Common Patterns
| Pattern | When to Use |
|---------|-------------|
| Sheet (right slide) | Detail views, editing |
| Dialog (centered) | Confirmations, quick forms |
| Tabs | Sections within a page |
| Accordion | Collapsible content |
| Skeleton | Loading states |
| Toast | Success/error feedback |

---

## 8. API & Integrations

### 8.1 Internal APIs (Edge Functions)
| Function | Purpose |
|----------|---------|
| `analyze-dce-before-creation` | AI tender document analysis |
| `distribute-budget` | AI fee distribution |
| `generate-prospects` | AI prospect research |
| `send-invoice-email` | Email delivery |
| `check-siret` | French company lookup |

### 8.2 External Integrations
| Service | Purpose | Status |
|---------|---------|--------|
| Supabase Auth | Authentication | Core |
| Supabase Storage | File uploads | Core |
| Google/Outlook Calendar | Event sync | Optional |
| Gmail/Outlook | Email sync | Optional |
| Chorus Pro | Public invoicing | Niche |

### 8.3 Realtime Subscriptions
```sql
-- Tables with realtime enabled
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.communications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
```

---

## 9. Security Requirements

### 9.1 Authentication
- Email/password (no social login currently)
- Session-based (Supabase handles tokens)
- Auto-confirm email for dev environments

### 9.2 Authorization
- Row Level Security (RLS) on all tables
- `workspace_id` filter on every query
- Role-based permissions with workspace overrides
- Sensitive fields (salary, evaluations) restricted to admin/owner

### 9.3 Data Protection
- HTTPS only
- Passwords never stored (Supabase Auth)
- API keys in environment variables (not code)
- File uploads scoped to workspace

---

## 10. Known Limitations

### 10.1 Technical Debt
- 3 components > 800 lines (need splitting)
- 170+ hooks in flat folder structure
- Some N+1 query patterns
- Missing test coverage

### 10.2 Scaling Limits
- Supabase default 1000-row limit per query
- Client-side Gantt calculations
- PDF generation blocks main thread
- Some views lack pagination

### 10.3 Incomplete Features
- Unread message tracking per entity
- Supplier selection in production tab
- Full i18n (French hardcoded in places)

---

## 11. Rebuild Recommendations

If rebuilding from scratch:

### 11.1 Architecture Changes
1. **Use Next.js** for SSR/SSG and better SEO
2. **Add tRPC** for type-safe API layer
3. **Domain-driven folder structure** for hooks/components
4. **Implement testing from day 1** (Vitest + Playwright)

### 11.2 Priority Order
1. Auth + Workspaces + Permissions
2. CRM (Companies + Contacts)
3. Projects + Tasks
4. Time Tracking
5. Commercial + Invoicing
6. Planning
7. Documents
8. Everything else

### 11.3 Data Migration
- Export via Supabase SQL dump
- Transform to new schema if needed
- Validate referential integrity
- Test with production-size dataset

---

## Appendices

### A. File References
- `ENTITIES.md` - Full data model documentation
- `USER-FLOWS.md` - Detailed user journeys
- `BUSINESS-RULES.md` - Status workflows and validations
- `MODULES.md` - Module descriptions and relations
- `FEATURE-TIERS.md` - Priority classification
- `LIMITATIONS.md` - Known issues

### B. Glossary
| Term | Meaning |
|------|---------|
| MOE | Maîtrise d'Œuvre (project management) |
| DCE | Dossier de Consultation des Entreprises (tender docs) |
| HT/TTC | Hors Taxes / Toutes Taxes Comprises (excl/incl VAT) |
| GED | Gestion Électronique de Documents (document management) |
| RLS | Row Level Security |

### C. Contact
For questions about this specification, refer to the documentation files or the original codebase.
