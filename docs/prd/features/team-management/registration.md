# Registration

> Route: `/registration` · Nav group: **Team Management** · Status: **Draft**

## 1. Summary

- **Registration** generates tournament registration documents for a selected league and group of players.
- A 4-step wizard collects player selection, league, an optional PDF template, and a preview before export.

## 2. Goals / metrics

### Goals

- Let authorized users produce a formatted registration PDF or CSV for any league in one pass through the wizard.
- Reduce manual data entry by pre-filling player data into PDF AcroForm fields.

## 3. Users and permissions

| Role             | View | Generate / export |
| ---------------- | ---- | ----------------- |
| GUEST            | No   | No                |
| PLAYER           | Yes  | No                |
| COACH            | Yes  | No                |
| SUPER_ADMIN      | Yes  | Yes               |
| PLAYER (Captain) | Yes  | Yes               |

## 4. UX / flows

### Entry point

- Sidebar → **Registration**.

### Wizard steps

1. **Select players**: multi-select active players; supports select-all.
2. **Select league**: single league picker.
3. **Attach template** _(optional)_: upload a PDF with AcroForm fields; the system maps player data automatically.
4. **Preview & export**: review the selection, add optional notes (≤ 256 chars), then export as PDF or CSV.

### Saved registrations

- Completed registrations can be saved locally and reloaded for future use.

## 5. Functional requirements

- **FR-1:** Only active players appear in the player picker.
- **FR-2:** SUPER_ADMIN and Captain can generate and export registrations.
- **FR-3:** Export formats: PDF (with optional AcroForm mapping) and CSV.
- **FR-4:** When a PDF template is attached, player fields are mapped by AcroForm field name using the aliases in §7.
- **FR-5:** Notes field accepts up to 256 characters.
- **FR-6:** Saved registrations are stored in local storage and can be deleted.

## 6. Acceptance criteria (Given/When/Then)

- **AC-1:** Given I am a COACH, when I open Registration, then I can view but cannot export.
- **AC-2:** Given I am a Captain, when I complete the wizard, then I can download a PDF or CSV.
- **AC-3:** Given I attach a PDF template with a `fullName` field, when I export, then player names are mapped into that field.

## 7. Technical appendix

### PDF field mapping

Fields in an attached template are matched by name, case-insensitively. Each player column accepts any of these aliases (`_components/main.tsx`, `_helpers/pdf.ts`):

| Column     | Accepted AcroForm field names |
| ---------- | ----------------------------- |
| Họ tên     | `hoTen`, `fullName`, `name`   |
| Năm sinh   | `namSinh`, `dob`, `birth`     |
| CCCD       | `cccd`, `cmnd`, `citizen`     |
| Điện thoại | `dienThoai`, `sdt`, `phone`   |
| Số áo      | `soAo`, `jersey`, `number`    |

The same aliases are shown in the field-naming guide rendered in the wizard's template step.

### API

- `buildRegistrationPdf(players, league, template?)`: generate and return the PDF
- Active players: `getActivePlayers()`
- Leagues: `getLeagues()`
