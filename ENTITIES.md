# Linea Suite — Data Entities

> Plain-language description of all data objects in the system.

---

## Core Entities

### Workspace
The top-level container for an agency. All data is isolated per workspace.

| Field | Description |
|-------|-------------|
| Name | Agency name |
| Logo | Agency logo image |
| Colors | Brand colors (primary, secondary) |
| Favicon | Browser tab icon |
| Industry | Architecture, Communication, Scenography |
| Modules enabled | Which features are active |

**Relationships:**
- Contains → Companies, Contacts, Projects, all other data
- Has → Members (users who belong to this workspace)

---

### User Profile
A person who uses the application.

| Field | Description |
|-------|-------------|
| Full name | First and last name |
| Email | Login email |
| Avatar | Profile picture |
| Phone | Contact number |
| Active workspace | Currently selected workspace |

**Relationships:**
- Belongs to → Multiple Workspaces (as member)
- Has → Role in each workspace
- Creates → Tasks, Projects, Documents, etc.

---

### Workspace Member
A user's membership in a specific workspace.

| Field | Description |
|-------|-------------|
| Role | Owner, Admin, Manager, Member, External |
| Job title | Position in agency |
| Joined date | When they joined |
| Is active | Currently active or disabled |

**Relationships:**
- Links → User Profile to Workspace
- Has → Permissions based on role

---

## CRM Entities

### Company
A business entity (client, partner, supplier, prospect).

| Field | Description |
|-------|-------------|
| Name | Company name |
| Type | Client, Partner, Supplier, Prospect |
| Category | Industry category |
| SIRET | French business ID |
| Address | Street, city, postal code, country |
| Phone | Main phone number |
| Email | General contact email |
| Website | Company website |
| Logo | Company logo |
| Notes | Free-form notes |

**Relationships:**
- Has → Multiple Contacts (employees)
- Has → Multiple Departments
- Linked to → Projects (as client)
- Linked to → Quotes and Invoices
- Can have → Billing Profile

---

### Contact
An individual person, usually linked to a company.

| Field | Description |
|-------|-------------|
| Name | Full name |
| First name | Given name |
| Last name | Family name |
| Email | Email address |
| Phone | Phone number |
| Role | Job title |
| Gender | For salutation |
| Location | Office location |
| Notes | Free-form notes |
| Avatar | Photo |

**Relationships:**
- Belongs to → Company (optional)
- Belongs to → Department within company
- Linked to → Projects (as project contact)
- Receives → Quotes, Invoices
- Has → Communication history

---

### Department
A division within a company.

| Field | Description |
|-------|-------------|
| Name | Department name |
| Description | What it does |
| Location | Office location |
| Manager | Person in charge |
| Billing contact | Who handles invoices |

**Relationships:**
- Belongs to → Company
- Has → Contacts (employees)

---

### Lead
A sales opportunity being pursued.

| Field | Description |
|-------|-------------|
| Title | Opportunity name |
| Description | Details |
| Status | Stage in sales pipeline |
| Value | Estimated deal value |
| Probability | Chance of winning (%) |
| Source | How it was acquired |
| Expected close date | When decision expected |
| Notes | Additional info |

**Relationships:**
- Linked to → Company
- Linked to → Contact
- Can convert to → Project
- Belongs to → Pipeline

---

### Pipeline
A customizable sales or prospection workflow.

| Field | Description |
|-------|-------------|
| Name | Pipeline name |
| Type | Lead pipeline or Contact pipeline |
| Stages | Ordered list of steps |

**Relationships:**
- Contains → Stages
- Contains → Leads or Pipeline Entries

---

### Pipeline Stage
One step in a pipeline.

| Field | Description |
|-------|-------------|
| Name | Stage name |
| Color | Visual color |
| Order | Position in sequence |
| AI email prompt | Instructions for AI-generated emails |

**Relationships:**
- Belongs to → Pipeline
- Contains → Leads or Entries at this stage

---

### Pipeline Entry
A contact or company being tracked through a prospection pipeline.

| Field | Description |
|-------|-------------|
| Stage | Current position |
| Entry date | When added to pipeline |
| Notes | Tracking notes |
| Awaiting response | Waiting for reply |
| Last email sent | Date of last outreach |
| Unread replies | Count of new responses |

**Relationships:**
- Links → Contact or Company to Pipeline
- Has → Sent Emails history

---

### Communication
A logged interaction (email, call, meeting, note).

| Field | Description |
|-------|-------------|
| Type | Email, Call, Meeting, Note |
| Title | Subject line |
| Content | Message body |
| Date | When it happened |
| Is pinned | Highlighted as important |
| Attachments | Files attached |

**Relationships:**
- Linked to → Company, Contact, Project, or Lead
- Created by → User
- Can have → Replies (threaded)

---

## Project Entities

### Project
A piece of work for a client.

| Field | Description |
|-------|-------------|
| Name | Project name |
| Code | Internal reference (e.g., "24-015") |
| Type | New construction, Renovation, Interior, etc. |
| Category | Residential, Commercial, Public, etc. |
| Discipline | Architecture, Communication, Scenography |
| Status | Prospect, Active, On Hold, Completed, Archived |
| Description | Project summary |
| Address | Project location |
| Start date | When work begins |
| End date | Target completion |
| Construction budget | Total works budget |
| Surface area | Square meters |
| Fee amount | Total fees |
| Fee percentage | Percentage of works |

**Relationships:**
- Belongs to → Client (Company)
- Has → Project Phases
- Has → Deliverables
- Has → Tasks
- Has → Team Members
- Has → Documents
- Linked to → Quotes and Invoices
- Can have → Sub-projects

---

### Project Phase
A stage of work within a project (e.g., Design, Permit, Construction).

| Field | Description |
|-------|-------------|
| Code | Phase code (ESQ, APS, APD, etc.) |
| Name | Phase name |
| Start date | When phase begins |
| End date | When phase should finish |
| Status | Not started, In progress, Completed |
| Percentage | Fee portion for this phase |
| Amount | Fee amount for this phase |
| Dependencies | Which phases must finish first |

**Relationships:**
- Belongs to → Project
- Has → Deliverables
- Depends on → Other Phases
- Links to → Quote Phases

---

### Deliverable
A document or output to be produced.

| Field | Description |
|-------|-------------|
| Name | Deliverable name |
| Description | What it is |
| Type | Plan, Report, Model, etc. |
| Due date | When it's needed |
| Status | To do, In progress, Review, Done |
| Assigned to | Who's responsible |
| Files | Attached documents |

**Relationships:**
- Belongs to → Project or Phase
- Assigned to → Team Member
- Can generate → Tasks

---

### Project Team Assignment
A person assigned to work on a project.

| Field | Description |
|-------|-------------|
| Role | Their role on this project |
| Hourly rate | Billing rate for this project |
| Start date | When they joined project |
| End date | When assignment ends |
| Is lead | Project lead or not |

**Relationships:**
- Links → Team Member to Project
- Tracked by → Time Entries

---

### Sub-project
A smaller project within a larger one.

| Field | Description |
|-------|-------------|
| Name | Sub-project name |
| Code | Reference code |
| Type | Type of sub-project |
| Budget | Allocated budget |

**Relationships:**
- Belongs to → Parent Project
- Has own → Phases, Tasks

---

## Commercial Entities

### Quote / Contract
A commercial proposal or signed agreement.

| Field | Description |
|-------|-------------|
| Number | Document number |
| Title | Document title |
| Type | Quote, Contract, Amendment |
| Status | Draft, Sent, Accepted, Signed, Refused, Expired |
| Project type | Type of work proposed |
| Total amount | Total fee |
| VAT rate | Tax rate |
| Validity period | How long offer is valid |
| Payment terms | When/how to pay |
| Construction budget | Works amount (for % calculation) |
| Fee mode | Percentage, Fixed, Hourly |
| Fee percentage | If percentage-based |
| Sent date | When sent to client |
| Signed date | When client signed |

**Relationships:**
- Linked to → Client (Company)
- Linked to → Client Contact
- Linked to → Project (optional)
- Has → Quote Phases (line items)
- Has → Payment Schedule
- Has → Versions (history)
- Can convert to → Project
- Uses → Quote Theme (for PDF)

---

### Quote Phase
A line item in a quote representing a work phase.

| Field | Description |
|-------|-------------|
| Code | Phase code |
| Name | Phase name |
| Description | What's included |
| Amount | Fee for this phase |
| Quantity | Units (for hourly) |
| Unit price | Rate per unit |
| Is included | Part of total or optional |
| Start date | Expected start |
| End date | Expected end |

**Relationships:**
- Belongs to → Quote
- Maps to → Project Phase (when converted)

---

### Payment Schedule
Planned billing milestones for a quote.

| Field | Description |
|-------|-------------|
| Title | Milestone name |
| Percentage | Portion of total |
| Amount | Payment amount |
| Planned date | When to invoice |
| Milestone | What triggers this payment |
| Linked phases | Which phases this covers |

**Relationships:**
- Belongs to → Quote
- Generates → Invoice

---

### Quote Theme
Visual template for generating quote PDFs.

| Field | Description |
|-------|-------------|
| Name | Theme name |
| Logo | Header logo |
| Colors | Primary, secondary colors |
| Fonts | Typography choices |
| Header/Footer | Custom content |
| Layout | Document structure |

**Relationships:**
- Used by → Quotes for PDF generation
- Belongs to → Workspace

---

---

## Invoicing Entities

### Invoice
A bill sent to a client.

| Field | Description |
|-------|-------------|
| Number | Invoice number |
| Title | Invoice title |
| Status | Draft, Sent, Partial, Paid, Overdue, Cancelled |
| Issue date | When created |
| Due date | Payment deadline |
| Amount before tax | Net amount |
| VAT amount | Tax amount |
| Total amount | Gross amount |
| Paid amount | How much received |
| Payment method | How client will pay |
| Notes | Additional information |

**Relationships:**
- Linked to → Client (Company)
- Linked to → Project
- Linked to → Quote (from schedule)
- Has → Invoice Line Items
- Has → Payments recorded
- Can have → Credit Note

---

### Invoice Line Item
One line on an invoice.

| Field | Description |
|-------|-------------|
| Description | What it's for |
| Quantity | Number of units |
| Unit price | Price per unit |
| Amount | Line total |
| VAT rate | Tax rate for this line |

**Relationships:**
- Belongs to → Invoice

---

### Payment
A payment received against an invoice.

| Field | Description |
|-------|-------------|
| Amount | Payment amount |
| Date | When received |
| Method | Bank transfer, Check, Card, etc. |
| Reference | Transaction reference |
| Notes | Additional info |

**Relationships:**
- Belongs to → Invoice

---

### Credit Note
A refund or correction document.

| Field | Description |
|-------|-------------|
| Number | Credit note number |
| Amount | Refund amount |
| Reason | Why issued |
| Date | When created |

**Relationships:**
- Linked to → Original Invoice

---

## Task Entities

### Task
A unit of work to be done.

| Field | Description |
|-------|-------------|
| Title | Task name |
| Description | Detailed instructions |
| Status | To do, In progress, Review, Done |
| Priority | Low, Medium, High, Urgent |
| Due date | Deadline |
| Estimated time | How long it should take |
| Actual time | Time spent so far |
| Tags | Labels for categorization |

**Relationships:**
- Linked to → Project (optional)
- Assigned to → One or more Team Members
- Has → Subtasks
- Has → Comments
- Has → Time Entries
- Can be scheduled on → Planning

---

### Subtask
A smaller task within a parent task.

| Field | Description |
|-------|-------------|
| Title | Subtask name |
| Is completed | Done or not |
| Order | Position in list |

**Relationships:**
- Belongs to → Parent Task

---

### Task Comment
A message on a task.

| Field | Description |
|-------|-------------|
| Content | Message text |
| Date | When posted |
| Mentions | Users mentioned |
| Attachments | Files attached |

**Relationships:**
- Belongs to → Task
- Written by → User

---

## Planning Entities

### Time Entry
A record of time spent working.

| Field | Description |
|-------|-------------|
| Date | When work was done |
| Duration | Hours/minutes worked |
| Start time | When started (optional) |
| End time | When ended (optional) |
| Description | What was done |
| Is billable | Chargeable to client |
| Status | Draft, Submitted, Validated |

**Relationships:**
- Logged by → Team Member
- Linked to → Project
- Linked to → Task (optional)

---

### Absence
Time when someone is not available.

| Field | Description |
|-------|-------------|
| Type | Vacation, Sick, Training, School (apprentice), etc. |
| Start date | First day absent |
| End date | Last day absent |
| Is full day | All day or partial |
| Status | Requested, Approved, Rejected |
| Reason | Explanation |

**Relationships:**
- Belongs to → Team Member
- Approved by → Manager

---

### Schedule (Apprentice)
Work/school pattern for apprentices.

| Field | Description |
|-------|-------------|
| Name | Schedule name |
| Start date | Contract start |
| End date | Contract end |
| Pattern | Days at work vs. school |
| PDF file | Uploaded school calendar |

**Relationships:**
- Belongs to → Team Member (apprentice)

---

## Tender Entities

### Tender
A bid or proposal for a public/private contract.

| Field | Description |
|-------|-------------|
| Title | Tender name |
| Reference | Official reference number |
| Client name | Contracting authority |
| Discipline | Architecture, Communication, Scenography |
| Status | Watching, Analyzing, Go, No-go, Writing, Submitted, Won, Lost |
| Submission deadline | When response is due |
| Estimated budget | Works budget |
| Fee estimate | Expected fee |
| Go/No-go decision | Whether to pursue |
| No-go reason | Why not pursuing |

**Relationships:**
- Has → Client (MOA) linked to Company
- Has → Partner Candidates (team)
- Has → Tender Lots (if split)
- Has → Required Documents
- Has → Deliverables to produce
- Has → Memo Sections
- Can convert to → Project

---

### Tender Lot
A portion of a tender when work is split.

| Field | Description |
|-------|-------------|
| Number | Lot number |
| Name | Lot name |
| Description | What's included |
| Budget | Lot budget |

**Relationships:**
- Belongs to → Tender

---

### Tender Partner
A potential team member for a tender response.

| Field | Description |
|-------|-------------|
| Role | Their role in team |
| Status | Invited, Confirmed, Declined |
| Fee share | Their portion of fees |

**Relationships:**
- Links → Company to Tender
- Has → Contact person

---

### Tender Deliverable
A document to produce for the response.

| Field | Description |
|-------|-------------|
| Name | Document name |
| Type | Required type |
| Due date | Internal deadline |
| Status | To do, In progress, Done |
| Assigned to | Who's responsible |
| Files | Completed documents |

**Relationships:**
- Belongs to → Tender
- Assigned to → Team Member or Partner

---

### Tender Memo Section
A section of the technical response document.

| Field | Description |
|-------|-------------|
| Title | Section title |
| Content | Written content |
| Order | Position in document |
| Word limit | Maximum length |
| Status | Draft, Review, Final |

**Relationships:**
- Belongs to → Tender

---

## Team/HR Entities

### Team Member
Extended information about a workspace member for HR.

| Field | Description |
|-------|-------------|
| Contract type | Permanent, Fixed-term, Intern, Apprentice |
| Start date | Employment start |
| End date | Contract end (if fixed) |
| Probation end | End of trial period |
| Salary | Monthly or annual salary |
| Weekly hours | Contracted hours |
| Manager | Who they report to |
| Skills | Professional skills |
| Leave balance | Vacation days remaining |

**Relationships:**
- Extends → User Profile
- Reports to → Another Team Member
- Has → Time Entries
- Has → Absences
- Has → Evaluations
- Assigned to → Projects

---

### Evaluation
A performance review or interview.

| Field | Description |
|-------|-------------|
| Type | Annual review, Probation, Other |
| Date | When scheduled |
| Status | Planned, Completed, Cancelled |
| Notes | Discussion notes |
| Objectives | Goals set |
| Rating | Performance rating |

**Relationships:**
- For → Team Member
- Conducted by → Manager

---

### Skill
A professional competency.

| Field | Description |
|-------|-------------|
| Name | Skill name |
| Category | Skill type |
| Hourly rate | Default billing rate |

**Relationships:**
- Assigned to → Team Members
- Used for → Quote pricing

---

## Document Entities

### Document
A file stored in the system.

| Field | Description |
|-------|-------------|
| Title | Document name |
| Category | Administrative, Project, HR, Commercial |
| Type | Contract, Report, Certificate, etc. |
| Status | Draft, Active, Expired, Archived |
| Valid from | When it takes effect |
| Valid until | Expiration date |
| Description | What it contains |
| Files | Attached files |

**Relationships:**
- Linked to → Project, Company, Contact, or Team Member
- Created from → Template (optional)
- Has → Signatures (if needed)
- Has → Reminders

---

### Document Template
A reusable document structure.

| Field | Description |
|-------|-------------|
| Name | Template name |
| Category | Document category |
| Content | Template structure |
| Variables | Fillable fields |

**Relationships:**
- Used to create → Documents

---

### Signature Request
A request for someone to sign a document.

| Field | Description |
|-------|-------------|
| Signer | Who should sign |
| Status | Pending, Signed, Declined |
| Signed date | When they signed |
| IP address | Technical verification |

**Relationships:**
- Belongs to → Document or Quote
- Sent to → Contact

---

## Other Entities

### Reference
A portfolio item showcasing past work.

| Field | Description |
|-------|-------------|
| Name | Project name |
| Year | Completion year |
| Client | Client name |
| Location | Where it is |
| Type | Project type |
| Description | Project story |
| Images | Photos |
| Is featured | Highlighted in portfolio |
| Surface | Size |
| Budget | Project cost |

**Relationships:**
- Can link to → Completed Project

---

### Campaign
A marketing or communication campaign.

| Field | Description |
|-------|-------------|
| Name | Campaign name |
| Type | Branding, Digital, Print, Event, etc. |
| Status | Draft, Active, Completed |
| Start date | Campaign launch |
| End date | Campaign end |
| Budget | Total budget |
| Spent | Amount spent |
| Brief | Creative brief |
| Objectives | Campaign goals |
| KPIs | Target metrics |

**Relationships:**
- For → Client (Company)
- Linked to → Project (optional)
- Has → Campaign Deliverables

---

### Campaign Deliverable
An asset to produce for a campaign.

| Field | Description |
|-------|-------------|
| Name | Asset name |
| Type | Visual, Video, Copy, etc. |
| Due date | Deadline |
| Status | To do, In progress, Review, Approved |
| Assigned to | Who's producing it |
| Files | Delivered files |

**Relationships:**
- Belongs to → Campaign

---

### Notification
An alert for a user.

| Field | Description |
|-------|-------------|
| Type | Task assigned, Comment, Deadline, etc. |
| Title | Short message |
| Content | Details |
| Is read | Seen or not |
| Date | When triggered |
| Link | Where to go |

**Relationships:**
- Sent to → User
- About → Task, Project, Invoice, etc.

---

### Calendar Event
A scheduled event or meeting.

| Field | Description |
|-------|-------------|
| Title | Event name |
| Start | Start date/time |
| End | End date/time |
| Location | Where it happens |
| Description | Details |
| Attendees | Who's invited |
| Is all day | Full day or timed |
| Recurrence | Repeating pattern |

**Relationships:**
- Linked to → Project (optional)
- Invited → Team Members, Contacts

---

### Message Channel
A chat space for team communication.

| Field | Description |
|-------|-------------|
| Name | Channel name |
| Type | Team channel or Direct message |
| Description | What it's for |
| Members | Who can access |

**Relationships:**
- Contains → Messages
- Has → Members

---

### Message
A chat message.

| Field | Description |
|-------|-------------|
| Content | Message text |
| Date | When sent |
| Mentions | Users mentioned |
| Attachments | Files shared |
| Reactions | Emoji reactions |

**Relationships:**
- In → Channel
- Sent by → User
- Can reply to → Another Message

---

## Summary

| Category | Entities |
|----------|----------|
| Core | Workspace, User Profile, Member |
| CRM | Company, Contact, Department, Lead, Pipeline, Stage, Entry, Communication |
| Projects | Project, Phase, Deliverable, Team Assignment, Sub-project |
| Commercial | Quote/Contract, Quote Phase, Payment Schedule, Quote Theme |
| Invoicing | Invoice, Line Item, Payment, Credit Note |
| Tasks | Task, Subtask, Comment |
| Planning | Time Entry, Absence, Apprentice Schedule |
| Tenders | Tender, Lot, Partner, Deliverable, Memo Section |
| Team/HR | Team Member, Evaluation, Skill |
| Documents | Document, Template, Signature |
| Other | Reference, Campaign, Notification, Event, Message |
| **Total** | **~45 entities** |
