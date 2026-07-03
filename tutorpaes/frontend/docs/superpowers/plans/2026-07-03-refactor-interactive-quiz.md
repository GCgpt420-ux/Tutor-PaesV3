# Refactor Interactive Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the interactive quiz page to delegate answer submissions to the un-duplicated `saveUserAnswer` api helper and confirm proper timeout cleanup on component unmount.

**Architecture:** Use central `saveUserAnswer` function from `@/src/features/exams/api/exams` to replace inline `apiFetch` POST call.

**Tech Stack:** Next.js, React, TypeScript.

---

### Task 1: Refactor quiz page code

**Files:**
- Modify: `tutorpaes/frontend/app/protected/quiz/[subject_code]/[topic_code]/page.tsx`

- [ ] **Step 1: Import saveUserAnswer**
  Import `saveUserAnswer` from `@/src/features/exams/api/exams` at the top of the file.

- [ ] **Step 2: Update handleSubmitAnswer**
  Inside `handleSubmitAnswer()`, replace the raw `apiFetch` POST call to `/quiz/answer` with `saveUserAnswer`.
  Cast the returned promise/response as `BackendAnswerOut` and ensure that properties on `response` are handled correctly.

- [ ] **Step 3: Confirm timeoutRef cleanup**
  Verify/ensure that the `useEffect` hook cleans up the `timeoutRef` by calling `clearTimeout` when the component unmounts.

### Task 2: Verification and compilation check

- [ ] **Step 1: Run linter and type-checker**
  Run typescript compiler `tsc` or next build check to verify that types are fully aligned and correct.

- [ ] **Step 2: Run Jest tests**
  Execute Jest test suite to check that tests pass.
