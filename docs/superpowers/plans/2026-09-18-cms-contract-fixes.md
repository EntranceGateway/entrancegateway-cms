# CMS Backend-Contract Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the 3 findings from the cross-repo contract audit of `entrancegateway-cms` against the `entrance-backend` architecture-consolidation plan — one real display bug, one stale type, one pre-existing (and currently broken) request/response shape mismatch.

**Architecture:** `entrancegateway-cms` is a Next.js/TypeScript admin panel. All three fixes are self-contained: Task 1 touches one display line, Task 2 renames one field in two type files, Task 3 fixes one service method's request/response shape. No shared state between tasks, no backend changes needed (the backend side is already correct, already reviewed, already sitting in `entrance-backend`'s own working tree).

**Tech Stack:** Next.js, TypeScript, no new dependencies.

**Spec:** This plan's own findings section below — sourced from a live audit of this repo's actual code (not assumed) against `entrance-backend`'s reviewed 20-task consolidation plan, done 2026-09-18.

## Global Constraints

- No new dependencies.
- Do not run `git add`/`git commit`/`git push` at any point in this plan — the user commits their own work. Every task ends at "leave the change in the working tree," never at a commit step.
- Task 3 starts with investigation, not a fix — do not skip its Step 1 and jump to code.

---

## Task 1: Format `Blog.createdDate` for display instead of rendering it raw

**Files:**
- Modify: `app/dashboard/blog/page.tsx:284`

**Interfaces:**
- Consumes: `blog.createdDate: string` (from `src/types/blog.types.ts`) — now an ISO datetime string (`"2026-09-14T10:15:30..."`) instead of a bare date (`"2026-09-14""`), per `entrance-backend`'s `Blog` entity migrating onto `SluggedEntity`/`AbstractAuditableEntity`.
- Produces: nothing new — this is a display-only fix, no other file depends on this line's output.

Current (renders the raw string):
```tsx
// app/dashboard/blog/page.tsx:283-285
<td className="px-4 md:px-6 py-4 text-sm text-gray-600">
  {blog.createdDate}
</td>
```

The public frontend repo (`entrance-gateway`) already formats this same field correctly in two places, both using this exact pattern:
```tsx
// entrance-gateway/components/features/blogs/BlogDetailContent.tsx:88-92
date: new Date(blog.createdDate).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}),
```
`new Date(...)` parses both the old date-only format and the new ISO-datetime format correctly, so this fix is also safe to land before or after the backend change actually ships.

- [ ] **Step 1: Apply the same formatting inline at the display site**

```tsx
// app/dashboard/blog/page.tsx:283-285
<td className="px-4 md:px-6 py-4 text-sm text-gray-600">
  {new Date(blog.createdDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })}
</td>
```

- [ ] **Step 2: Verify TypeScript compiles clean**

Run: `npx tsc --noEmit`
Expected: no new errors (this file's only change is wrapping an already-`string`-typed value in `new Date(...).toLocaleDateString(...)`, both of which accept a `string`/return a `string`).

- [ ] **Step 3: Visually confirm in the running app**

Run: `npm run dev`, open `/dashboard/blog`, confirm the "Created" column shows a short date like "Sep 14, 2026" instead of a raw ISO string. If the backend you're pointed at hasn't shipped the `createdAt` migration yet, this will still render correctly (the old date-only string parses fine too) — either way, this step confirms no visual regression.

Leave the change in the working tree — no commit.

---

## Task 2: Rename `CategoryBatchFailure`/`TopicBatchFailure`'s stale field to `identifier`

**Files:**
- Modify: `src/types/quiz.types.ts:43` (the `CategoryBatchFailure` interface)
- Modify: `src/types/topic.types.ts:46` (the `TopicBatchFailure` interface)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: nothing new — confirmed via grep during the audit that neither `CategoryBatchFailure.categoryName` nor `TopicBatchFailure.topicName` is read anywhere in this codebase (only `.error` is read off `failures[0]`, in `src/services/category.service.ts` and `src/services/topic.service.ts`), so this rename has no downstream callers to update. Re-confirm this in Step 1 before renaming, in case something was missed.

Current:
```typescript
// src/types/quiz.types.ts:43-47
export interface CategoryBatchFailure {
    index: number;
    categoryName: string;
    error: string;
}
```
```typescript
// src/types/topic.types.ts:45-49
export interface TopicBatchFailure {
    index: number;
    topicName: string;
    error: string;
}
```

The backend's `BatchResult<T>.FailureDetail` (in `entrance-backend`, `src/main/java/com/entrance_gateway/response/BatchResult.java`) has `identifier: String` on every batch-create response — `categoryName`/`topicName`/`templateName` were unified into one name during that plan's Task 17. This CMS type was never updated to match.

- [ ] **Step 1: Re-confirm no code reads the old field names before renaming**

Run:
```bash
grep -rn "\.categoryName" src/services/category.service.ts app/dashboard/categories/
grep -rn "\.topicName" src/services/topic.service.ts app/dashboard/topics/
```
Expected: any hits are on the `Category`/`Topic` entity's own `categoryName`/`topicName` field (a different, unrelated field on a different type — e.g. `category.categoryName` where `category: CategoryApiResponse`), never on a `CategoryBatchFailure`/`TopicBatchFailure` object (e.g. never `failure.categoryName` or `failures[0].categoryName`). If you find a genuine hit on the batch-failure type specifically, stop and read that call site in full before proceeding — the "zero impact" assumption in this task no longer holds and the fix needs to update that call site too.

- [ ] **Step 2: Rename the field in both interfaces**

```typescript
// src/types/quiz.types.ts:43-47
export interface CategoryBatchFailure {
    index: number;
    identifier: string;
    error: string;
}
```
```typescript
// src/types/topic.types.ts:45-49
export interface TopicBatchFailure {
    index: number;
    identifier: string;
    error: string;
}
```

- [ ] **Step 3: Verify TypeScript compiles clean**

Run: `npx tsc --noEmit`
Expected: no errors. If TypeScript surfaces an error pointing at a property-access on the old field name somewhere Step 1's grep missed, fix that call site to use `.identifier` instead — do not revert the rename to make the error go away.

Leave the change in the working tree — no commit.

---

## Task 3: Fix `createQuizTemplate`'s request/response shape mismatch

**Files:**
- Modify: `src/services/quizTemplate.service.ts:105-113` (the `createQuizTemplate` method)

**Interfaces:**
- Consumes: `CreateQuizTemplateRequest` (unchanged, from `src/types/quiz.types.ts:189-196`), `QuizTemplateMutationResponse` (unchanged, from `src/types/quiz.types.ts:198-210`).
- Produces: `createQuizTemplate(payload: CreateQuizTemplateRequest): Promise<ServiceResult>` — same signature as today, same `ServiceResult` shape (`{ success, data?: QuizTemplateMutationResponse, error?, fieldErrors? }`) — callers in `app/dashboard/quiz-templates/create/page.tsx` and `src/hooks/useQuizTemplateForm.ts` need no changes.

**This task starts with investigation. Do not skip Step 1.**

- [ ] **Step 1: Confirm the mismatch is real and currently reproducible**

Read the current implementation (already confirmed once during the audit, re-confirm now):
```typescript
// src/services/quizTemplate.service.ts:105-113 (current)
async createQuizTemplate(payload: CreateQuizTemplateRequest): Promise<ServiceResult> {
  try {
    const response = await apiClient.post<QuizTemplateMutationResponse>(this.endpoint, payload);

    if (!response?.data) {
      return { success: false, error: 'Invalid response from server' };
    }

    return { success: true, data: response.data };
  } catch (error: unknown) {
    const extracted = extractApiError(error, 'Failed to create quiz template');
    return {
      success: false,
      error: extracted.message,
      fieldErrors: extracted.errors,
    };
  }
}
```
`this.endpoint` is `/quiz-templates`. Confirm against the backend (`entrance-backend/src/main/java/com/entrance_gateway/quiz_template/QuizTemplateController.java:38`):
```java
@PostMapping
public ResponseEntity<ApiResponse> createTemplate(@Valid @RequestBody List<QuizTemplateRequest> requests) {
```
The backend's `createTemplate` has always taken a JSON **array** and returned `ApiResponse.data` shaped as `BatchResult<QuizTemplateResponse>` (`{ created: [...], failures: [...] }`) — this predates the architecture-consolidation plan entirely; Task 17 of that plan only renamed `BatchResult.FailureDetail`'s discriminator field, it never touched this endpoint's request or response shape. The CMS sends a bare object and expects a bare object back — every `POST /quiz-templates` call from this method sends the wrong shape and will fail to deserialize on the Spring side (a single JSON object where `List<QuizTemplateRequest>` is expected raises a 400).

Confirm this is genuinely unfixed by checking there's no other code path: `grep -rn "createQuizTemplate" src/ app/` should show exactly one call site (`app/dashboard/quiz-templates/create/page.tsx`), calling this one service method, with no alternate array-wrapping happening upstream. If you find the payload is already wrapped in an array somewhere between the form and this method, STOP — the diagnosis above is wrong and this task needs to be re-scoped, not blindly implemented.

- [ ] **Step 2: Fix `createQuizTemplate` to send an array and unwrap the `BatchResult`**

```typescript
// src/services/quizTemplate.service.ts:105-123 (replaces the method from Step 1)
async createQuizTemplate(payload: CreateQuizTemplateRequest): Promise<ServiceResult> {
  try {
    const response = await apiClient.post<{
      created: QuizTemplateMutationResponse[];
      failures: Array<{ index: number; identifier: string; error: string }>;
    }>(this.endpoint, [payload]);

    if (!response?.data) {
      return { success: false, error: 'Invalid response from server' };
    }

    const failure = response.data.failures?.[0];
    if (failure) {
      return { success: false, error: failure.error };
    }

    const created = response.data.created?.[0];
    if (!created) {
      return { success: false, error: 'Quiz template was not created' };
    }

    return { success: true, data: created };
  } catch (error: unknown) {
    const extracted = extractApiError(error, 'Failed to create quiz template');
    return {
      success: false,
      error: extracted.message,
      fieldErrors: extracted.errors,
    };
  }
}
```
This mirrors the exact pattern already used in `src/services/category.service.ts`'s `createCategory` and `src/services/topic.service.ts`'s `createTopic` — both already send a single-item array and unwrap `failures[0]`/`created[0]` the same way, since both hit genuinely-batch backend endpoints too. `createQuizTemplate`'s public signature (`(payload: CreateQuizTemplateRequest) => Promise<ServiceResult>`) is unchanged, so `app/dashboard/quiz-templates/create/page.tsx:47` and `src/hooks/useQuizTemplateForm.ts` need no changes.

- [ ] **Step 3: Verify TypeScript compiles clean**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Confirm end-to-end against a running backend, if available**

Run the CMS (`npm run dev`) against a running `entrance-backend` instance, go to `/dashboard/quiz-templates/create`, fill out and submit the form. Expected: template is created successfully (no 400 error), and the form's post-create flow (whatever `populateFromResponse` in `src/hooks/useQuizTemplateForm.ts:361` does with the returned data) behaves the same as it does today for `updateQuizTemplate` (which was already correctly shaped). If no backend instance is available in this environment, skip this step and note it as unverified in your report — Steps 1-3 already give strong static confidence, but this is the step that actually proves the fix works, not just compiles.

Leave the change in the working tree — no commit.

---

## Self-Review Notes

- **Coverage:** all 3 audit findings have a task — Task 1 (display bug), Task 2 (stale type), Task 3 (pre-existing request/response mismatch).
- **Placeholder scan:** every step has real code — the `CreateQuizTemplateRequest`/`QuizTemplateMutationResponse` types, the exact current and replacement method bodies, the exact backend endpoint signature that justifies the fix. Task 3's "if you find X, stop" branches are genuine pre-conditions this plan could not resolve without running the investigation itself, not vague hedging.
- **Type consistency:** `ServiceResult`, `QuizTemplateMutationResponse`, `CreateQuizTemplateRequest` are used identically to their existing definitions throughout — Task 3 does not change any type callers depend on.
- **Scope:** deliberately small — 3 tasks, 1 repo, no schema changes, no auth surface, no commits.

---

**Plan complete and saved to `docs/superpowers/plans/2026-09-18-cms-contract-fixes.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
