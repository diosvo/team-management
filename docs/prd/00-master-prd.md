# Master PRD — Saigon Rovers Basketball Team Management

## 1. Product Overview

Team Management is a web app for managing teams, people, and operations (assets, schedules, etc.) with role-based access.

### Problem

Teams often track key operational info in spreadsheets/chats, causing:

- stale information
- unclear ownership
- poor visibility across roles

### Solution

Provide a centralized, role-based hub where users can view and (when authorized) manage team data and workflows.

- Application is a private team portal
- Users are trusted team members (invited via email by admin)
- The role set is small and static

## 2. Target Users

- **GUEST:** limited read-only access (dashboard, roster, matches)
- **PLAYER:** standard team member
- **COACH:** coaching staff
- **SUPER_ADMIN:** administrative access across the application
- **Captain (PLAYER flag):** elevated permissions for registration, matches, roster editing, and team-rule editing

## 3. Primary Use Cases (Jobs-to-be-done)

- A player checks team info, training schedule, and performance metrics.
- A coach manages training sessions, attendance, and match records.
- A captain handles registration, manages the roster, and edits team rules.
- An admin manages teams, configuration, and all operational data.

## 4. Feature Map (High-level)

This is a high-level map; details live in the [`Page Specs`](./pages/README.md) docs.

## 5. Product Principles (Shared UX expectations)

- **Role clarity:** users should never wonder why they can/can’t do something.
- **Fast search:** lists must support filtering.
- **Safe destructive actions:** deletions require confirmation + clear feedback.
- **Deep-linkable state:** filters should be reflected in the URL where reasonable.

## 6. Shared Requirements (Cross-feature)

### Authorization

- UI may hide controls, but **server must enforce** permissions.

### Audit / Logging (optional)

- [ ] For privileged actions (create/edit/delete), capture: actor role, team context, timestamp.

## 7. Non-Functional Requirements

- **Performance:** common pages load quickly for typical team sizes.
- **Accessibility:** keyboard navigation and accessible dialogs.
- **Reliability:** clear loading/error states; avoid duplicate submits.

## 8. Release / Rollout (Light)

- Prefer feature flags for larger changes.
- Ship in small increments with backward-compatible data changes.

## 9. Open Questions

- What are the most important product-level success metrics?
- Which features require audit logs vs. basic activity logging?
