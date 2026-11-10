---
job: balance-pass
shape: backlog
type: feat
ticket: "9"
created: 2026-11-09
ai_docs_version: "2.5.0"
---
# Balance pass: maze beats spam, upgrades matter, winnable

## Goal
Tune the finished game so PROMPT's balance targets hold, with evidence instead of vibes: a headless harness plays scripted strategies through all ten waves, numbers are tuned until good mazing clearly beats tower spam, upgrades matter by mid-game, each tower has its moment, and a reasonable first-time strategy can win — then a full playthrough verifies PROMPT's verification checklist end to end. Per `PROMPT.md` sections Balance targets, Kill zones and maze quality, Verification.

## Invariants
- Starts last, after every other job merges.
- Tuning changes numbers in the stats tables (towers, enemies, waves, economy, anti-juggle threshold) — not mechanics. A mechanic change found necessary goes to the owner as an ask.
- The harness drives the real pure-TS sim headless; no separate balance model.
- The final numbers are the owner's call: the harness report and proposed numbers go to the owner before they ship.

## Definition of done
- Harness runs at least: tower spam (no maze), long maze with weak coverage, kill-zone switchback maze with mixed towers and upgrades, single-tower-type builds — reporting lives lost and money per wave.
- Report shows the switchback maze outperforming spam and long-but-uncovered mazes by mid-game, mixed outperforming single-type, and the reasonable strategy winning without perfect play; the owner approved the numbers.
- Every item in PROMPT's Verification list is demonstrated in the running app and recorded.
- Docs: in — README notes the strategy tips the harness supports.

## Deliberately untested
- Human-perceived fun/difficulty beyond the harness and one owner playthrough — a player of different skill may find the curve off; mitigated by the owner playing it.
