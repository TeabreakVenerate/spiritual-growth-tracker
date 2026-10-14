# Product Requirements Document (PRD)

## Objective
Friction-free multi-tenant platform for daily spiritual disciplines with an interactive Telegram scorecard and responsive web dashboard.

## Features
- **Interactive Inline Keyboard Checklist**: Telegram bot ingestion via callback_query buttons allowing members to toggle daily disciplines without manual typing.
  - Prayer check (1 hour): Toggle between checked and unchecked.
  - Bible reading (5 chapters): Toggle between checked and unchecked.
  - Stateful button prompts: Two-step input prompts for Track of the Week and Book of the Month page number.
  - Raw template parser: Ingest and parse pasted multi-line scorecards starting with "Personal Devotion".
- **Decoupled AI Synthesis**: Asynchronous spiritual exhortation and synthesis powered by Gemini 3.5 Flash Lite triggered from the checklist button.
- **Passwordless Dashboard Auth**: 15-minute secure Telegram Magic Links with preview protection.
- **Role-Gated Web Dashboard**: Member view for personal scorecard telemetry and Admin view for aggregate cohort tracking.
