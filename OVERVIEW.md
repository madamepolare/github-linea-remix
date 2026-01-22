# Linea Suite — Functional Overview

## Purpose

A B2B SaaS platform for managing the full operational lifecycle of creative agencies (architecture, communication, scenography): from client acquisition through project delivery to invoicing.

---

## Main User Types

| Role | Description |
|------|-------------|
| **Agency Owner/Admin** | Configures workspace, manages team, oversees financials |
| **Project Manager** | Handles project phases, deadlines, client deliverables |
| **Team Member** | Executes tasks, logs time, produces deliverables |
| **External Collaborator** | Limited access to specific projects (partners, consultants) |
| **Client (via portal)** | Views project progress, validates deliverables, signs quotes |

---

## Core Problems Solved

### 1. Fragmented tools
Replaces Excel + Word + email + calendar + accounting software with a unified system where CRM, projects, quotes, invoices, and HR share the same data.

### 2. Time-consuming tender responses
AI extracts key info from public procurement documents (DCE), auto-structures response memos, tracks deadlines.

### 3. Complex fee calculations
Automates MOE fee distribution across project phases (ESQ→AOR) based on construction budget percentages.

### 4. Document chaos
Centralizes contracts, quotes, invoices with versioning, e-signature, and PDF generation matching agency branding.

### 5. Resource visibility gaps
Planning grid shows who's working on what, tracks time entries, manages absences, flags capacity issues.

### 6. Discipline-specific workflows
Configures differently for architecture (phases MOE, permits) vs. communication (framework agreements, creative briefs) vs. scenography (exhibitions, touring).

### 7. Client communication friction
Client portals let external stakeholders view progress and sign documents without accounts.

---

## Key Modules

| Module | Function |
|--------|----------|
| **CRM** | Companies, contacts, leads, prospection pipelines |
| **Projects** | Phases, deliverables, team, budget tracking |
| **Commercial** | Quotes, contracts, fee calculation, e-signature |
| **Tenders** | Public procurement response management with AI |
| **Invoicing** | Billing, payments, reminders, Chorus Pro |
| **Tasks** | Kanban/list views, assignments, subtasks |
| **Planning** | Team calendar, time entries, absences |
| **Team/HR** | Directory, leave, salaries, evaluations |
| **Documents** | GED, templates, signatures |
| **References** | Agency portfolio management |
| **Campaigns** | Marketing campaign tracking (communication agencies) |

---

## Technical Foundation

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI**: Lovable AI (Gemini/GPT) for document analysis and content generation
- **Architecture**: Multi-tenant (workspace isolation via RLS), role-based permissions
