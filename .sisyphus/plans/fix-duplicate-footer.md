# Fix Duplicate Footer in Index Page

## TL;DR

> **Quick Summary**: The footer is duplicated on the Index page because it's included in both `App.tsx` (global) and `Index.tsx` (local). We need to remove the local instance from `Index.tsx`.
> 
> **Deliverables**:
> - Updated `src/pages/Index.tsx` with `<Footer />` removed.
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: Sequential

---

## Context

### Original Request
"현재 푸터가 두 줄로 중복되는데... src/pages/Index.tsx 파일에서 <Footer /> 컴포넌트 호출 부분과 관련 import 문을 삭제해줘."

### Diagnosis
- `src/App.tsx` already includes a global `<Footer />`.
- `src/pages/Index.tsx` also imports and renders `<Footer />`.
- Result: Two footers appear on the home page.

---

## Work Objectives

### Core Objective
Remove the redundant footer from the Index page to fix the layout duplication.

### Concrete Deliverables
- `src/pages/Index.tsx`: Remove `import Footer` and `<Footer />`.

### Definition of Done
- [ ] `src/pages/Index.tsx` does not contain `Footer`.

---

## Verification Strategy

### Agent-Executed QA Scenarios

```
Scenario: Verify Footer Removal in Code
  Tool: Bash (grep)
  Preconditions: None
  Steps:
    1. Run: grep "Footer" src/pages/Index.tsx
  Expected Result: No output (or exit code 1) indicating Footer is gone.
  Evidence: Terminal output
```

---

## TODOs

- [ ] 1. Remove Footer from Index.tsx

  **What to do**:
  - Open `src/pages/Index.tsx`.
  - Remove the import: `import Footer from "@/components/Footer";`.
  - Remove the component usage: `<Footer />`.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`dev-browser`] (optional, text edit is sufficient)

  **Acceptance Criteria**:
  - [ ] File `src/pages/Index.tsx` updated successfully.
  - [ ] `grep "Footer" src/pages/Index.tsx` returns no matches.
