---
job: live-repath
shape: backlog
type: feat
ticket: "6"
created: 2026-11-09
ai_docs_version: "2.5.0"
---
# Live repath: mid-wave building, never-trap, anti-juggling

## Goal
Lift maze-core's "no building while enemies are alive" lock. The player can build (and sell) mid-wave; every active enemy smoothly takes the new route from where it stands; no placement may ever trap an enemy; and the classic juggling exploit — toggling a blocker so the wave reverses forever — is refused with a clear reason, while normal maze extension still works. Per `PROMPT.md` sections Core game (placement checks 1–5) and Mazing and anti-juggling behavior.

## Invariants
- Builds on maze-core's `placement`, `pathfinding` and `sim-loop`; checks run in the pure-TS sim.
- A placement during a wave is accepted only if the spawn and every active enemy's current tile can still reach the exit with the footprint blocked. An enemy standing on (or mid-step into) a tile the footprint covers makes that placement illegal.
- Repath is triggered by any layout change (place or remove, whatever the cause), so selling from `tower-combat` gets it for free.
- Enemies transition naturally: an enemy mid-step finishes or reverses only its current step along valid tiles, then follows its new route — never teleports, freezes permanently, or walks through a blocked tile.
- Anti-juggling rule (pragmatic, one place in code): during a wave, a placement is refused if it would make any active enemy immediately reverse direction, or lengthen any active enemy's remaining route by more than 50% (threshold a named constant `balance-pass` may tune). Placements that only lengthen routes modestly — normal maze extension — are allowed. Selling is never blocked by this rule.
- Every refusal names its reason distinctly: "would trap an enemy", "would block the exit", "anti-juggling: would reverse enemies mid-wave".

## Definition of done
- Building mid-wave works; enemies visibly re-route without teleporting, freezing or crossing towers.
- Trap and block placements mid-wave are refused with their reason; juggling attempts (two-route toggle) are refused; extending a maze mid-wave is accepted.
- Headless tests: trap rejection, per-enemy reachability, mid-step transition, reversal and +50% rejection, modest extension accepted, repath on removal.
- Docs: in — `docs/architecture.md` describes the placement rule chain.

## Deliberately untested
- Juggling by selling (sell a blocker to flip the route) is not refused — without the matching blocking placement the loop cannot repeat, so it costs the player 25% per toggle; worst case a player gets one extra reversal per sell.
- Huge-wave performance of per-enemy reachability checks — one BFS distance field from the exit answers every enemy at once, so cost is flat; not load-tested.
