# Design System & UI Specifications

## Theme & Palette
- Theme: Responsive editorial dashboard.
- Background: Covenant Navy (`#060d17`)
- Surface Cards: Deep Azure (`#0b1626` / `#0F3D70`)
- Accent & Highlights: Gold (`#f59e0b` / Tailwind `amber-400`/`amber-500`) and Crisp White (`#ffffff`)
- Borders: Subtle Slate (`#1e293b` / Tailwind `slate-800`)

## UI Elements & Layout
- Strict Tailwind CSS utility usage across all views.
- Unified Daily Scorecard Cards:
  - Header with date and status pill.
  - Prayer Check indicator (1 hour: completed vs pending).
  - Bible Reading indicator (5 chapters: completed vs pending).
  - Track for the Week highlight container.
  - Book of the Month page number badge.
  - AI Synthesis callout box with golden left border.
- Member View:
  - Personal active streak counter.
  - Cumulative prayer days and Bible reading counts.
  - Chronological daily scorecard feed.
- Admin View:
  - Network-wide telemetry metrics (Active Users, Total Scorecards, Discipline Completion Rates).
  - Anonymized live cohort scorecard activity.
