---
slice: 2026-11-09-place-towers
type: feature
status: todo
created: 2026-11-09
---
# Place 2×2 towers that reshape the route

## Outcome
The player clicks the board to place a 2×2 tower (a single basic type for now, with a cost deducted from a money counter). The route redraws around it immediately. A placement that would seal spawn from exit, overlap a tower, cover spawn/exit, leave the board, or cost more than the player has is refused with a visible reason. A player can build a long switchback maze.

## Why now
Mazing is the central mechanic; placement legality is the other correctness risk and the seam tower-combat and live-repath both extend.
