---
job: placement-ux
shape: backlog
type: feat
ticket: "8"
created: 2026-11-09
ai_docs_version: "2.5.0"
---
# Placement UX and readability

## Goal
Make placement deliberate and cause-and-effect obvious. A ghost with range shows where a tower will go and whether it can; every refusal (funds, blocking, trapping, anti-juggling) is visible before the click; hovering previews how the route would change; selection, pause, wave transitions and leaks read at a glance; spawn and exit stay obvious under a full maze; keyboard shortcuts speed up play without being required. Per `PROMPT.md` sections Placement UX, Combat readability and feedback, Game state and controls.

## Invariants
- Starts after `tower-combat` and `live-repath` merge; runs alongside `waves-economy`. Presentation only: it reads the sim's placement verdicts and route, never re-implements a rule.
- The route preview is computed by the sim's own pathfinding on a hypothetical layout; correctness beats elaborate visuals.
- Every control has a clickable affordance; shortcuts are additive (shown in the UI).
- HUD shows money, lives, wave, enemies remaining, selected build type, and selected tower info, per PROMPT's list.

## Definition of done
- Ghost + range + valid/invalid tint follow the cursor in build mode; each refusal reason is shown on hover; insufficient funds is obvious in the build menu too.
- Hover previews the would-be route; spawn/exit remain obvious with a dense maze.
- Selection highlight, clear pause overlay, wave start/clear banners, leak flash and upgrade feedback are present.
- Shortcuts for each tower type, cancel, start wave, pause, upgrade, sell — listed on screen.
- Verified in the running app; logic-bearing helpers (e.g. preview route) have headless tests.
- Docs: in — README lists controls and shortcuts.

## Deliberately untested
- Visual polish is judged by eye in the running app, not by tests — a regression in a tint or banner could slip until a smoke test notices.
- Accessibility beyond keyboard + readable contrast (screen readers on a canvas game) — a blind player cannot play; out of scope for a canvas game.
