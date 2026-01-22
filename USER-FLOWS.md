# Linea Suite — User Flows

> Step-by-step walkthroughs of how users accomplish key tasks.

---

## 1. Getting Started

### First-time signup

1. User visits the landing page and clicks "Commencer"
2. Enters email, password, and full name
3. Confirms email (auto-confirmed in dev mode)
4. Lands on onboarding screen
5. Creates their first workspace (agency name, industry type)
6. Selects which modules to enable
7. Optionally uploads agency logo
8. Arrives at dashboard — ready to work

### Inviting a colleague

1. Admin goes to Settings → Members
2. Clicks "Inviter un membre"
3. Enters colleague's email and selects role (Admin, Manager, Member)
4. Colleague receives email invitation
5. Colleague clicks link, creates account (or logs in if existing)
6. They now appear in the team list with assigned role

---

## 2. Managing Clients (CRM)

### Adding a new client company

1. User goes to CRM → Companies
2. Clicks "Nouvelle entreprise"
3. Types company name — or enters SIRET for auto-fill
4. System fetches address, legal info from French registry
5. User selects type: Client, sets category (Architecture firm, Developer, etc.)
6. Saves — company card now appears in list

### Adding contacts for that client

1. User opens the company detail page
2. Scrolls to Contacts section, clicks "Ajouter un contact"
3. Enters name, email, phone, job title
4. Contact is now linked to the company
5. User can set one contact as "main contact" for billing

### Tracking a sales opportunity

1. User goes to CRM → Prospection
2. Sees Kanban board with pipeline stages
3. Clicks "+" to add new entry
4. Selects the company/contact to track
5. Card appears in first column (e.g., "Premier contact")
6. User drags card to next stage after each interaction
7. Can click card to add notes, send emails, set reminders
8. When deal is won → converts to project

---

## 3. Creating and Managing Projects

### Creating a project from scratch

1. User goes to Projects
2. Clicks "Nouveau projet"
3. Fills in: project name, code (auto-suggested), type (New build, Renovation...)
4. Selects client from CRM dropdown
5. Enters address, estimated budget, surface area
6. Chooses discipline (Architecture, Communication, Scenography)
7. Saves — project appears in list with "Prospect" status

### Creating a project from a won tender

1. User is on a Tender that was marked as "Gagné" (Won)
2. Clicks "Convertir en projet"
3. System pre-fills: name, client, budget, surface, team members
4. User confirms and adjusts if needed
5. New project is created, linked to the original tender

### Creating a project from a signed quote

1. User has a quote with status "Signé"
2. Clicks "Créer le projet"
3. System pre-fills from quote: client, fee amount, phases
4. Project is created with phases already set up
5. Payment schedule becomes invoicing milestones

### Setting up project phases

1. User opens project → Phases tab
2. Sees empty Gantt timeline
3. Clicks "Ajouter des phases"
4. Can choose template (Standard MOE, Custom) or import from quote
5. Phases appear: ESQ, APS, APD, PRO, DCE, ACT, VISA, DET, AOR
6. User drags phase edges to set dates
7. Sets dependencies: "APD starts after APS ends"
8. System auto-calculates dates when one phase moves

### Tracking project progress

1. User views project dashboard (Synthèse tab)
2. Sees: current phase highlighted, % completion, upcoming deadlines
3. Clicks into Phases tab to update individual phase status
4. Marks phase as "Terminé" when complete
5. Next phase auto-activates based on dependencies
6. Project timeline shows actual vs. planned progress

---

## 4. Commercial Process (Quotes)

### Creating a fee proposal

1. User goes to Commercial → clicks "Nouveau devis"
2. Selects client from CRM (or creates new)
3. Enters project info: name, type, construction budget
4. System suggests fee percentage based on budget brackets
5. User adds phases with fee distribution (ESQ 5%, APS 10%, etc.)
6. Can add optional items client can accept/refuse
7. Previews PDF with agency branding
8. Saves as draft

### Sending quote to client

1. User opens quote, clicks "Envoyer"
2. Enters recipient email (defaults to client main contact)
3. Customizes email message
4. Clicks Send
5. Client receives email with link to view quote online
6. Quote status changes to "Envoyé"

### Client signs the quote

1. Client clicks link in email
2. Views quote in branded public page
3. Reviews phases and total
4. Clicks "Accepter et signer"
5. Draws or types signature
6. Quote status updates to "Signé"
7. Agency receives notification
8. Signed PDF is generated and stored

### Managing quote versions

1. Client requests changes to quote
2. User opens quote, makes modifications
3. Saves — system creates new version automatically
4. User can view version history
5. Sends updated version to client
6. Previous versions remain accessible for reference

---

## 5. Invoicing

### Creating an invoice from schedule

1. User goes to Invoicing
2. Sees list of upcoming scheduled invoices (from quote payment schedules)
3. Clicks "Générer" on a due milestone
4. Invoice is created with correct amount, phase reference
5. User reviews, adjusts if needed
6. Clicks "Envoyer" — client receives invoice email

### Creating a manual invoice

1. User clicks "Nouvelle facture"
2. Selects client and optionally project
3. Adds line items (description, quantity, unit price)
4. Sets due date and payment terms
5. Saves and sends

### Recording a payment

1. User opens invoice
2. Clicks "Enregistrer un paiement"
3. Enters amount, date, payment method
4. If partial payment: invoice shows remaining balance
5. If fully paid: status changes to "Payée"
6. Payment appears in invoice history

### Handling overdue invoices

1. Dashboard shows "Factures en retard" alert
2. User goes to Invoicing → Overdue filter
3. Opens overdue invoice
4. Clicks "Envoyer relance"
5. Client receives reminder email
6. System logs reminder in invoice history
7. Can set up automatic reminders in settings

---

## 6. Task Management

### Creating a task

1. User goes to Tasks (or uses quick-add from anywhere)
2. Clicks "Nouvelle tâche"
3. Enters title and description
4. Assigns to team member(s)
5. Sets due date and priority
6. Optionally links to project
7. Task appears in Kanban under "À faire"

### Working through tasks

1. User sees their assigned tasks in Board view
2. Picks a task, clicks to open details
3. Starts timer for time tracking (or logs time manually)
4. Adds comments to update team
5. Drags task to "En cours" column
6. When done, drags to "Terminé"
7. Time spent is automatically logged to project

### Breaking down complex work

1. User creates main task: "Préparer le DCE"
2. Opens task, goes to Subtasks section
3. Adds subtasks: "CCTP", "Plans", "Estimatif", "Vérification"
4. Checks off subtasks as completed
5. Main task shows progress (2/4 done)
6. When all subtasks done, marks main task complete

---

## 7. Time & Planning

### Logging time worked

1. User clicks timer icon in header (or in task)
2. Timer starts running
3. Works on task
4. Clicks stop — time entry is created
5. Entry shows in Planning view on their row
6. Can edit to add description, adjust time

### Planning the week

1. Manager goes to Planning
2. Sees grid: team members as rows, days as columns
3. Clicks empty cell for a team member
4. Creates time entry or assigns task to that slot
5. Can drag entries to reschedule
6. Team members see their planned work

### Requesting time off

1. User goes to Team → Absences
2. Clicks "Demander une absence"
3. Selects type (Congé, Maladie, Formation)
4. Picks dates
5. Adds reason if needed
6. Submits request
7. Manager receives notification
8. Manager approves or rejects
9. Absence appears on planning grid

### Checking team availability

1. Manager views Planning grid
2. Sees who's working on what each day
3. Absences show as colored blocks
4. Can spot overloaded vs. available team members
5. Uses this to assign new work appropriately

---

## 8. Responding to Tenders

### Adding a new tender opportunity

1. User goes to Tenders
2. Clicks "Nouvel appel d'offre"
3. Enters: title, client (MOA), discipline, submission deadline
4. Uploads DCE documents (PDF)
5. System starts AI analysis

### AI analyzes the documents

1. After upload, AI processes documents
2. Extracts: key dates, budget, surface, criteria, required documents
3. Populates tender synthesis automatically
4. User reviews extracted data
5. Corrects any errors
6. Saves — tender is ready for Go/No-go decision

### Deciding Go or No-go

1. User reviews tender details and team capacity
2. Clicks "Go" or "No-go"
3. If No-go: enters reason, tender is archived
4. If Go: tender moves to "Rédaction" phase
5. System creates task checklist from discipline template

### Building the response team

1. User goes to tender → Équipe tab
2. Adds internal team members with roles
3. Adds external partners (from CRM companies)
4. Sends invitation emails to partners
5. Partners confirm participation
6. Fee distribution is set per partner

### Writing the technical memo

1. User goes to tender → Mémoire tab
2. Sees sections based on evaluation criteria
3. Clicks section to edit
4. Uses AI assistant to draft content
5. Refines and validates each section
6. Tracks completion percentage

### Submitting and tracking result

1. User marks all deliverables as complete
2. Changes status to "Envoyé"
3. Enters actual submission date
4. Waits for client decision
5. Updates to "Gagné" or "Perdu"
6. If won: converts to project

---

## 9. Team & HR Management

### Onboarding a new employee

1. Admin invites new team member (see earlier flow)
2. Goes to Team → Directory
3. Opens new member's profile
4. Fills HR info: contract type, start date, salary, manager
5. Sets up skills and default billing rate
6. Member is now fully set up

### Managing apprentice schedules

1. HR manager opens apprentice's profile
2. Goes to Schedule section
3. Uploads school calendar PDF
4. System parses and creates work/school pattern
5. Planning grid shows school days vs. work days
6. Absences for school are auto-created

### Conducting performance reviews

1. Manager goes to Team → Evaluations
2. Clicks "Planifier un entretien"
3. Selects team member and interview type
4. Sets date and sends calendar invite
5. After meeting, opens evaluation
6. Records notes, objectives, rating
7. Team member can view their evaluation history

---

## 10. Document Management

### Creating a document from template

1. User goes to Documents
2. Clicks "Nouveau document"
3. Selects template (e.g., "Attestation d'assurance")
4. System populates variables from linked entity
5. User reviews and edits content
6. Generates PDF
7. Can request signature if needed

### Requesting a signature

1. User opens document
2. Clicks "Demander signature"
3. Selects signer (internal or external contact)
4. Signer receives email with link
5. Signer views and signs online
6. Signed document is stored with timestamp
7. User gets notification of completion

---

## 11. End-to-End Example: Full Project Lifecycle

### From prospect to paid invoice

**Week 1: Opportunity**
1. Architect meets potential client at event
2. Back at office, creates company in CRM
3. Adds contact person
4. Creates lead in pipeline: "Villa Dupont"

**Week 2: Proposal**
5. Moves lead to "Visite site" after site visit
6. Creates quote: renovation, €300K budget, 12% fees
7. Adds phases: ESQ through DET
8. Sends quote to client

**Week 3: Agreement**
9. Client reviews quote online
10. Requests minor adjustment
11. Architect creates new version
12. Client signs electronically
13. Architect converts quote to project

**Months 1-2: Design**
14. Project starts with ESQ phase
15. Tasks are created for team members
16. Team logs time against project
17. Deliverables are produced and uploaded
18. Phase completes, moves to APS

**Month 3: First invoice**
19. ESQ + APS phases complete
20. Scheduled invoice becomes due
21. Architect generates and sends invoice
22. Client pays
23. Payment is recorded

**Months 4-12: Execution**
24. Phases progress through timeline
25. Regular invoices at milestones
26. Meeting reports generated for client
27. Project completes

**Final: Close out**
28. All invoices paid
29. Project marked as "Terminé"
30. Added to References portfolio
31. Client satisfaction noted in CRM

---

## Quick Reference: Common Actions

| I want to... | Go to... | Action |
|--------------|----------|--------|
| Add a client | CRM → Companies | + Nouvelle entreprise |
| Start a project | Projects | + Nouveau projet |
| Create a quote | Commercial | + Nouveau devis |
| Send an invoice | Invoicing | Select invoice → Envoyer |
| Assign a task | Tasks | + Nouvelle tâche → Assign |
| Log my time | Planning or Task | Timer or + Ajouter temps |
| Request leave | Team → Absences | + Demander absence |
| Upload a document | Documents | + Nouveau document |
| Respond to tender | Tenders | + Nouvel appel d'offre |
| Invite teammate | Settings → Members | + Inviter |
