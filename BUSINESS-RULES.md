# Linea Suite — Business Rules & Logic

> Documentation of statuses, validations, conditions, and permissions.

---

## 1. User Roles & Permissions

### Role Hierarchy

Roles are ranked from most to least privileged:

| Level | Role | Description |
|-------|------|-------------|
| 4 | **Owner** | Full access, workspace management, billing |
| 3 | **Admin** | User management, delete permissions, sensitive data |
| 2 | **Member** | Create and edit data, manage own work |
| 1 | **Viewer** | Read-only access |

### Permission Matrix

Permissions can be **overridden per workspace** via the settings.

| Area | View | Create | Edit | Delete | Special |
|------|------|--------|------|--------|---------|
| **Projects** | All | Member+ | Member+ | Admin+ | Archive: Admin+ |
| **CRM** | All | Member+ | Member+ | Admin+ | Sensitive data: Admin+ |
| **Commercial** | All | Member+ | Member+ | Admin+ | Send: Member+, Sign: Admin+ |
| **Invoicing** | All | Member+ | Member+ | Admin+ | Send: Member+, Mark paid: Admin+ |
| **Tasks** | All | Member+ | Member+ | Admin+ | Assign: Member+ |
| **Tenders** | All | Member+ | Member+ | Admin+ | Submit: Admin+ |
| **Documents** | All | Member+ | Member+ | Admin+ | Sign: Member+ |
| **Team** | All | — | — | — | Invite/Manage: Admin+, Validate time: Admin+ |
| **Settings** | All | — | Admin+ | — | Manage workspace: Owner only |

**Rule:** A user can only act within their highest permission level. Viewer cannot modify anything.

---

## 2. Status Workflows

### 2.1 Quote/Contract Status

```
Draft → Sent → Accepted → Signed
              ↘ Rejected
              ↘ Expired
```

| Status | Meaning | Allowed Actions |
|--------|---------|-----------------|
| `draft` | Work in progress | Edit, delete |
| `sent` | Sent to client | Edit (creates new version), resend |
| `accepted` | Client agreed verbally | Request signature |
| `signed` | Legally binding | Convert to project, generate invoices |
| `rejected` | Client declined | Archive, duplicate for new version |
| `expired` | Validity period passed | Duplicate to create new quote |

**Rules:**
- Cannot delete a quote once `sent`
- Cannot edit a `signed` quote (must create amendment)
- Quote expires automatically if `valid_until` date passes without signature
- Signing requires Admin+ role

---

### 2.2 Invoice Status

```
Draft → Sent → Partial → Paid
              ↘ Overdue
              ↘ Cancelled → Credit Note
```

| Status | Meaning | Allowed Actions |
|--------|---------|-----------------|
| `draft` | Not yet issued | Edit, delete |
| `sent` | Issued to client | Record payment, send reminder |
| `partial` | Partially paid | Record additional payment |
| `paid` | Fully settled | Mark as reconciled |
| `overdue` | Past due date, unpaid | Send reminder, escalate |
| `cancelled` | Voided | Create credit note |

**Rules:**
- Invoice becomes `overdue` automatically when `due_date` passes and `paid_amount < total`
- Cannot delete an invoice once `sent` (must cancel + credit note)
- Recording payment requires `invoicing.mark_paid` permission
- Partial payments track running balance

---

### 2.3 Project Status

```
Prospect → Active → On Hold → Completed → Archived
                           ↘ Cancelled
```

| Status | Meaning |
|--------|---------|
| `prospect` | Potential project, not confirmed |
| `active` | Work in progress |
| `on_hold` | Temporarily paused |
| `completed` | All phases done |
| `archived` | Closed, for reference only |
| `cancelled` | Stopped, will not proceed |

**Rules:**
- Project can only be `completed` when all phases are `completed`
- Archiving a project hides it from active lists but preserves data
- Time entries can only be logged to `active` projects

---

### 2.4 Task Status

```
To Do → In Progress → Review → Done → Archived
```

| Status | Meaning |
|--------|---------|
| `todo` | Not started |
| `in_progress` | Currently being worked on |
| `review` | Awaiting validation |
| `done` | Completed |
| `archived` | Removed from active lists |

**Rules:**
- Tasks auto-archive after X days in `done` status (configurable)
- Completing a task stops any running timer
- Subtask completion doesn't auto-complete parent task

---

### 2.5 Project Phase Status

```
Pending → In Progress → Completed
```

| Status | Meaning |
|--------|---------|
| `pending` | Not yet started |
| `in_progress` | Currently active |
| `completed` | Finished |

**Rules:**
- Phase cannot start if dependent phases are not `completed`
- Moving phase dates recalculates all dependent phase dates
- Only one phase should typically be `in_progress` at a time (not enforced)

---

### 2.6 Tender Pipeline Status

```
À Approuver → En Cours → Déposés → Gagnés
                                ↘ Perdus
           ↘ No-Go → Archivés
```

| Status | Meaning |
|--------|---------|
| `a_approuver` | New, pending Go/No-Go decision |
| `en_cours` | Active, team building + writing |
| `deposes` | Submitted, awaiting results |
| `gagnes` | Won the bid |
| `perdus` | Lost the bid |
| `no_go` | Decided not to pursue |
| `archives` | Closed, historical |

**Rules:**
- Moving to `no_go` requires a reason
- Moving to `gagnes` enables "Convert to Project" action
- `deposes` status is set when submission is confirmed

---

### 2.7 Deliverable Status

```
Pending → In Progress → Ready to Send → Delivered → Validated
```

| Status | Meaning |
|--------|---------|
| `pending` | Not started |
| `in_progress` | Being worked on |
| `ready_to_send` | Complete, awaiting delivery |
| `delivered` | Sent to client |
| `validated` | Client approved |

---

### 2.8 Absence Request Status

```
Requested → Approved
         ↘ Rejected
```

**Rules:**
- Only managers can approve/reject
- Approved absences appear on planning grid
- Leave balance is decremented upon approval
- Cannot request dates in the past

---

### 2.9 Time Entry Status

```
Draft → Submitted → Validated
                 ↘ Rejected
```

**Rules:**
- Users submit their time entries for validation
- Managers validate time for their team
- Validated time cannot be edited by the user
- Rejected entries return to user for correction

---

## 3. Validation Rules

### 3.1 Required Fields

| Entity | Required Fields |
|--------|-----------------|
| Company | Name, workspace_id |
| Contact | Name, workspace_id |
| Project | Name, code, workspace_id |
| Quote | Document number, title, client, workspace_id |
| Invoice | Number, client, at least one line item |
| Task | Title, workspace_id |
| Tender | Title, submission_deadline |

### 3.2 Quote Validations

| Rule | Condition |
|------|-----------|
| Client required | Must have `client_company_id` before sending |
| Valid until | Auto-calculated: `created_at + validity_days` |
| Total > 0 | Cannot send quote with zero total |
| Phases sum | Sum of phase percentages should equal 100% (warning, not blocking) |

### 3.3 Invoice Validations

| Rule | Condition |
|------|-----------|
| Line items | At least one line item required |
| Due date | Must be ≥ issue date |
| Unique number | Invoice number must be unique per workspace |
| Sequential | Invoice numbers should be sequential (warning) |

### 3.4 Project Validations

| Rule | Condition |
|------|-----------|
| Unique code | Project code must be unique per workspace |
| Dates | End date must be ≥ start date |
| Budget | If fee_percentage set, construction_budget required |

### 3.5 Time Entry Validations

| Rule | Condition |
|------|-----------|
| Duration | Must be > 0 |
| Future dates | Cannot log time in the future |
| Overlap | Warning if entries overlap (not blocked) |
| Daily limit | Warning if > 12 hours/day (not blocked) |

### 3.6 Tender Validations

| Rule | Condition |
|------|-----------|
| Deadline required | Submission deadline mandatory for active tenders |
| Go decision | Cannot move to `en_cours` without explicit Go decision |
| No-go reason | Reason required when marking as `no_go` |

---

## 4. Calculation Rules

### 4.1 Fee Calculation (Commercial)

**Percentage mode:**
```
total_fee = construction_budget × (fee_percentage / 100)
phase_amount = total_fee × (phase_percentage / 100)
```

**Fixed mode:**
```
total_fee = sum(all phase amounts)
```

**Hourly mode:**
```
phase_amount = quantity × unit_price
total_fee = sum(all phase amounts)
```

### 4.2 VAT Calculation

```
amount_ht = sum(line items before tax)
vat_amount = amount_ht × (vat_rate / 100)
amount_ttc = amount_ht + vat_amount
```

**Special case:** VAT exemption (autoliquidation) sets `vat_rate = 0`

### 4.3 Invoice Balance

```
remaining = total_amount - sum(payments)
status = remaining == 0 ? 'paid' : remaining < total ? 'partial' : 'sent'
```

### 4.4 Phase Date Dependencies

When a phase end date changes:
```
for each dependent_phase:
  if dependency_type == 'finish_to_start':
    dependent_phase.start_date = changed_phase.end_date + 1 day
  recalculate dependent_phase.end_date based on duration
  propagate to next dependencies
```

### 4.5 Project Completion

```
project.completion_percentage = 
  count(phases where status == 'completed') / count(all phases) × 100
```

### 4.6 Time Tracking

```
billable_hours = sum(time_entries where is_billable == true)
total_hours = sum(all time_entries)
billable_amount = billable_hours × hourly_rate
```

---

## 5. Conditional Logic

### 5.1 Discipline-based Configuration

The system adapts based on project/tender discipline:

| Discipline | Specific Features |
|------------|-------------------|
| **Architecture** | MOE phases (ESQ→AOR), construction budget %, permits, surface |
| **Communication** | Framework agreements, lots, creative brief, audition |
| **Scenography** | Exhibition type, touring, conservation constraints |

**Rule:** Tender synthesis blocks and form fields are loaded dynamically from discipline configuration.

### 5.2 Module Visibility

Modules can be enabled/disabled per workspace:

- Disabled modules are hidden from navigation
- Data remains but is inaccessible
- Re-enabling restores access

### 5.3 Automatic Actions

| Trigger | Action |
|---------|--------|
| Quote signed | Enable "Create Project" button |
| Quote sent | Record `sent_at` timestamp |
| Invoice due date passed | Change status to `overdue` |
| Phase completed | Check if all phases done → complete project |
| Task moved to Done | Stop running timer |
| Tender marked Won | Enable "Convert to Project" |
| Absence approved | Deduct from leave balance |

### 5.4 AI Extraction Rules

When analyzing tender documents (DCE):
- Extract dates and convert to ISO format
- Extract budget amounts and normalize to euros
- Identify mandatory vs optional documents
- Parse evaluation criteria and weights
- Flag critical alerts (tight deadlines, unusual requirements)

---

## 6. Access Control

### 6.1 Data Isolation

**Rule:** All data is isolated by `workspace_id`. A user can only see data from workspaces they belong to.

Database enforces this via Row Level Security (RLS) policies.

### 6.2 Sensitive Data

Fields marked as sensitive (emails, phones, notes, salaries) require `crm.view_sensitive` or equivalent permission.

### 6.3 External Access

| Portal | Access Level |
|--------|--------------|
| Public Quote | Read quote, sign (token-based, no login) |
| Client Portal | Read projects/tasks/invoices for linked contact |
| Company Portal | Read all projects for linked company |

**Rule:** Portal tokens expire after configured duration or can be revoked.

### 6.4 Team Hierarchy

- Users see their own time entries
- Managers see their team's time entries
- Admins see all time entries
- Validation follows reporting hierarchy

---

## 7. Numbering & Sequences

### 7.1 Auto-generated Numbers

| Entity | Format | Example |
|--------|--------|---------|
| Project code | `YY-NNN` | `24-015` |
| Quote number | `D-YYNNN` | `D-24042` |
| Invoice number | `F-YYNNN` | `F-24087` |

**Rule:** Numbers are sequential per workspace and year.

### 7.2 Version Tracking

- Quotes create new version on edit after `sent`
- Documents track version history
- Version numbers increment: v1, v2, v3...

---

## 8. Business Constraints

### 8.1 Cannot Delete When...

| Entity | Constraint |
|--------|------------|
| Company | Has linked contacts, projects, quotes, or invoices |
| Contact | Has linked projects, quotes, or communications |
| Project | Has linked phases, tasks, invoices, or time entries |
| Quote | Status is `sent`, `signed`, or has linked invoice |
| Invoice | Status is not `draft` |
| User | Is workspace owner |

### 8.2 Cannot Edit When...

| Entity | Constraint |
|--------|------------|
| Signed quote | Immutable (create amendment instead) |
| Sent invoice | Only notes editable |
| Validated time entry | Locked by manager validation |
| Archived task | Must restore first |

### 8.3 Conversion Rules

| From | To | Conditions |
|------|-----|------------|
| Lead | Project | Lead must be at "Won" stage |
| Quote | Project | Quote must be `signed` |
| Tender | Project | Tender must be `gagnes` |
| Pipeline Entry | Lead | Contact/Company must exist |

---

## 9. Unclear / Implicit Rules

The following behaviors exist but are not explicitly documented in code:

| Area | Observation | Clarity |
|------|-------------|---------|
| Quote expiry | Appears to be checked on view, not scheduled | ⚠️ Unclear |
| Invoice overdue | Trigger mechanism not visible | ⚠️ Unclear |
| Task auto-archive | Duration configurable but default unclear | ⚠️ Unclear |
| Email threading | How replies are matched to entries | ⚠️ Unclear |
| Pipeline stage emails | When AI prompt is actually used | ⚠️ Unclear |
| Leave balance calculation | Initial balance setup not documented | ⚠️ Unclear |
| Multi-workspace switching | Session handling during switch | ⚠️ Unclear |
| File size limits | Maximum upload sizes not documented | ⚠️ Unclear |
| Concurrent editing | No explicit locking mechanism visible | ⚠️ Unclear |

---

## 10. Summary Tables

### Status Reference

| Entity | Possible Statuses |
|--------|-------------------|
| Quote | draft, sent, accepted, rejected, expired, signed |
| Invoice | draft, sent, partial, paid, overdue, cancelled |
| Project | prospect, active, on_hold, completed, archived, cancelled |
| Task | todo, in_progress, review, done, archived |
| Phase | pending, in_progress, completed |
| Tender | a_approuver, en_cours, deposes, gagnes, perdus, no_go, archives |
| Deliverable | pending, in_progress, ready_to_send, delivered, validated |
| Absence | requested, approved, rejected |
| Time Entry | draft, submitted, validated, rejected |

### Permission Reference

| Permission | Viewer | Member | Admin | Owner |
|------------|--------|--------|-------|-------|
| View data | ✓ | ✓ | ✓ | ✓ |
| Create records | ✗ | ✓ | ✓ | ✓ |
| Edit records | ✗ | ✓ | ✓ | ✓ |
| Delete records | ✗ | ✗ | ✓ | ✓ |
| Send quotes/invoices | ✗ | ✓ | ✓ | ✓ |
| Sign documents | ✗ | ✗ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✓ | ✓ |
| Manage workspace | ✗ | ✗ | ✗ | ✓ |
| Manage billing | ✗ | ✗ | ✗ | ✓ |
