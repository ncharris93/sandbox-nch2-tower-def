# 0002 — Deterministic 4-direction BFS; 2×2 towers on a 1×1 enemy grid

**Status:** accepted · 2026-11-09 · approved by the owner at maze-core shape (from `PROMPT.md`)

## Context
The core mechanic is mazing: tower placement must create the enemy route. Enemies need stable, predictable routes, and placements must never seal the exit.

## Decision
Towers occupy 2×2 tiles; enemies move tile to tile with 4-directional movement. Routes come from breadth-first search over unblocked tiles with a fixed neighbor tie-break order, so the same layout always yields the same route. A placement is legal only if spawn still reaches exit with its footprint blocked. There is no predefined path.

## Consequences
- Diagonal squeezes between corner-touching towers are impossible, enabling tight mazes.
- Route changes come only from layout changes, never from tie-break noise.
- Active-enemy reachability and anti-juggling checks extend the same placement module (live-repath).
