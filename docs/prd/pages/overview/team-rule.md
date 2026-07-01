# Team Rule

> Route: `/team-rule` · Nav group: **Overview** · Status: **Draft**

## 1. Summary

- The **Team Rule** page displays the team's rules and policies as rich text.
- Authorized users can edit the content; all others have a read-only view.

## 2. Goals / Metrics

### Goals

- Give all members a single source of truth for team rules.
- Let authorized users keep rules up to date with a simple editor.

## 3. Users & Permissions

| Role             | View | Edit |
| ---------------- | ---- | ---- |
| GUEST            | No   | No   |
| PLAYER           | Yes  | No   |
| COACH            | Yes  | No   |
| SUPER_ADMIN      | Yes  | Yes  |
| PLAYER (Captain) | Yes  | Yes  |

## 4. UX / Flows

### Entry point

- Sidebar → **Team Rule**.

### View

- The page renders the current rule content as read-only rich text.

### Edit

- Authorized users see an **Edit** toggle that switches the view to an editable text editor.
- Clicking **Save** persists the changes and returns to read-only view.
- Clicking **Cancel** discards changes.

## 5. Functional Requirements

- **FR-1:** PLAYER, COACH, SUPER_ADMIN, and Captain can view the team rule.
- **FR-2:** SUPER_ADMIN and Captain can edit the rule content.
- **FR-3:** Saving shows a success or error toast.
- **FR-4:** The rule last-updated timestamp is tracked server-side.

## 6. Acceptance Criteria (Given/When/Then)

- **AC-1:** Given I am a GUEST, when I navigate to `/team-rule`, then I see a forbidden or no-access state.
- **AC-2:** Given I am a PLAYER, when I view Team Rule, then I see the content but no edit control.
- **AC-3:** Given I am a Captain, when I edit and save the content, then the updated rule is visible to all permitted roles.

## 7. Technical Appendix

### Data model (logical)

Rule:

- `content`: rich text
- `updated_at`: timestamp

### API

- `getRule()` — fetch current rule
- `upsertRule(content)` — create or update
