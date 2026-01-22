# App Limitations, Inconsistencies & Weaknesses

An honest assessment of technical debt, scaling issues, and architectural weaknesses.

---

## 🔴 Critical Issues

### 1. "God Components" (Files > 800 lines)
These components violate single-responsibility and are hard to maintain:

| Component | Lines | Responsibilities |
|-----------|-------|------------------|
| `TaskDetailSheet.tsx` | 819 | Task CRUD, relations (Project/Lead/Company/Contact/Tender), subtasks, time tracking, archiving |
| `TaskListView.tsx` | 903 | Dynamic grouping, sorting, filtering, inline editing, bulk actions, drag-and-drop |
| `QuoteLinesEditor.tsx` | 987 | D&D reordering, AI budget distribution, template loading, line types, group management |

**Impact**: Slow to modify, high bug risk, poor test coverage.

### 2. High-Responsibility Hooks
- **`usePlanningData.ts`** aggregates data from **8 different sources** (tasks, members, events, projects, absences, time entries, teams, apprentice schedules).
  - Creates a single point of failure
  - All-or-nothing loading → poor perceived performance
  - Any source failure breaks the entire planning view

### 3. Console Warnings (Production)
```
Warning: Function components cannot be given refs.
Check the render method of `HeroSection`.
```
- `AnimatedCounter` and `IsometricModules` need `forwardRef()`
- Causes React dev-mode noise and potential bugs with animations

---

## 🟠 Structural Problems

### 4. Inconsistent Data Fetching Patterns
| Pattern | Where Used | Problem |
|---------|------------|---------|
| Custom hooks with `useQuery` | Most modules | ✅ Good |
| Inline `supabase.from()` in components | Some older components | ❌ Bypasses cache, duplicates logic |
| Mix of server-side + client-side filtering | CRM vs Tasks | Inconsistent UX for large datasets |

### 5. Hardcoded Limits & Constants
- **`analyze-dce-before-creation`**: Hardcoded `MAX_DOCS = 15` to avoid timeouts
- **`feeCalculation.ts`**: Fixed `ORDRE_FEE_SCALES` and `PHASE_PERCENTAGES` → not workspace-configurable
- **Supabase default**: 1000-row limit can silently truncate results

### 6. Incomplete Features (TODOs)
| Location | Missing Feature |
|----------|-----------------|
| `useEntityConversations.ts:155` | Unread message tracking per entity |
| `QuoteProductionTab.tsx:320` | Supplier selection per line item |
| Multiple files | Full i18n support (French hardcoded in many places) |

### 7. Circular Dependency Risk
The `QuotePreviewPanel` had re-exports removed to prevent build stack overflows. This indicates:
- Lib → Component → Lib dependency chains exist
- No enforcement of clean import boundaries

---

## 🟡 UI Inconsistencies

### 8. Mobile Experience Gaps
- **MainLayout.tsx** is 275 lines and mixing desktop/mobile logic
- Mobile sub-nav and bottom nav are separate components but with duplicated styling logic
- Some modals/sheets don't respect mobile safe areas consistently

### 9. Mixed Component Patterns
| Area | Pattern A | Pattern B |
|------|-----------|-----------|
| Forms | React Hook Form + Zod | Uncontrolled with manual validation |
| Modals | Sheet (right slide) | Dialog (center) |
| Lists | Virtual scroll | Paginated tables |
| State | Zustand stores | Local `useState` |

No clear guide on when to use which.

### 10. Inconsistent Loading States
- Some views show `Skeleton` components
- Others show spinners
- Some show nothing (blank until loaded)
- No global loading indicator pattern

---

## ⚡ Scalability Concerns

### 11. N+1 Query Patterns
Some hooks fetch related data in loops:
```typescript
// Pseudocode - seen in several places
tasks.forEach(task => {
  fetchProjectDetails(task.project_id);
  fetchCompanyDetails(task.company_id);
});
```
→ Should use `.in()` or joins.

### 12. Client-Side Heavy Operations
- **Gantt chart** calculations done entirely in browser
- **Fee calculations** re-run on every keystroke in quote builder
- **PDF generation** (html2canvas) blocks main thread

### 13. No Pagination on Key Views
These fetch all records at once:
- Team absences calendar
- Workspace events
- Planning schedules
- Time entries for analytics

---

## 🔧 Technical Debt

### 14. 170+ Hooks in `/hooks`
Many hooks are domain-specific but:
- No clear organization (flat folder)
- Some are > 200 lines with multiple responsibilities
- Naming inconsistency (`useCRMCompanies` vs `useContacts`)

### 15. Overloaded Supabase Types
`types.ts` is auto-generated and huge (likely 10k+ lines). Any schema change:
- Triggers full re-validation
- Slow IDE autocomplete
- Can cause build slowdowns

### 16. Missing Test Coverage
No test files visible in the codebase for:
- Business logic (fee calculations, status transitions)
- Critical hooks (data fetching, auth)
- UI components

---

## 🚨 Security Concerns (to verify)

### 17. RLS Policy Gaps
From memory context: hardening was done, but should verify:
- All new tables have RLS enabled
- No overly permissive `USING (true)` policies
- Sensitive fields (salary, evaluations) properly restricted

### 18. Edge Function Error Handling
Some edge functions may expose internal errors to clients. Should use generic error messages.

---

## 📊 Summary Matrix

| Category | Severity | Count | Effort to Fix |
|----------|----------|-------|---------------|
| God Components | High | 3 | High |
| Missing Features | Medium | 5+ | Medium |
| UI Inconsistencies | Medium | 10+ | Low-Medium |
| Scaling Issues | High | 5 | High |
| Technical Debt | Medium | 15+ | Varies |

---

## Recommended Priorities

1. **Immediate**: Fix forwardRef warnings (AnimatedCounter, IsometricModules)
2. **Short-term**: Split TaskDetailSheet and QuoteLinesEditor into sub-components
3. **Medium-term**: Add pagination to all list views with > 100 items
4. **Long-term**: Organize hooks into domain folders, add test coverage
