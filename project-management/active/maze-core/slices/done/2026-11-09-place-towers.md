---
slice: 2026-11-09-place-towers
type: feature
status: done
created: 2026-11-09
spec_written: 2026-11-09
ai_docs_version: "2.5.0"
---
# Place 2×2 towers that reshape the route

## Outcome
The player clicks the board to place a 2×2 tower (a single basic type for now, with a cost deducted from a money counter). The route redraws around it immediately. A placement that would seal spawn from exit, overlap a tower, cover spawn/exit, leave the board, or cost more than the player has is refused with a visible reason. The player starts with enough money for three towers; bigger mazes come from progression (waves-economy).

## Why now
Mazing is the central mechanic; placement legality is the other correctness risk and the seam tower-combat and live-repath both extend.

## Acceptance criteria
Anchor = the tower's top-left tile; the footprint is anchor, +x, +y, +x+y. Reason copy below is exact (sentence case, no exclamation marks, says what went wrong and how to fix it — UX11/UX13).

- AC1 (test): On a fresh `createInitialState()`, `placeTower` at a legal anchor returns `{ ok: true }`, appends one tower record `{ id, anchor }`, deducts `TOWER_COST` from `money`, and all four footprint tiles appear in `blockedTiles(state)`.
- AC2 (test): After a tower is placed across the straight spawn→exit row, `findRoute` over `blockedTiles(state)` avoids every footprint tile and is longer than the 30-tile straight route.
- AC3 (test): Each refusal returns `{ ok: false, reason }` with exactly this reason, and leaves `towers`, `money` and `nextId` unchanged:
  - footprint leaves the board (anchor in the last column or last row) → "Not enough room here. A tower needs a 2×2 space inside the board."
  - footprint covers spawn or exit → "Towers can't cover the spawn or the exit. Pick another spot."
  - footprint overlaps any tile of an existing tower (including a 1-tile offset) → "That spot overlaps another tower. Pick an empty 2×2 space."
  - `money < TOWER_COST` → "Not enough money. A tower costs {TOWER_COST} and you have {money}." (numbers filled in)
  - spawn can no longer reach exit with the footprint blocked (the tower that completes a wall across the board) → "That would block the only route from spawn to exit. Leave a gap."
- AC4 (test): When several refusals apply, the reason reported follows the fixed order of the AC3 list (off-board, spawn/exit, overlap, funds, route) — e.g. an off-board anchor with zero money reports the off-board reason.
- AC5 (test): `canPlaceTower` returns the same result `placeTower` would and never mutates state.
- AC6 (test): Tower ids are unique and increasing across placements and come from `state.nextId`; an id is never reused.
- AC7 (test): `tileFromPoint` maps a canvas-local CSS-pixel point to its tile: (0,0)→(0,0), (27,27)→(0,0), (28,0)→(1,0), last pixel → (29,19).
- AC8 (observe): In the running app, clicking an empty spot draws a filled 2×2 tower covering exactly four tiles, the route redraws around it on the same click, and the HUD reads "Money: {n}" with n reduced by `TOWER_COST`; a status line reads "Tower placed." — demonstrated by: dev server on port 5181, click a tile on the route, screenshot before/after.
- AC9 (observe): A refused click leaves the board and money unchanged and shows the exact AC3 reason in the status line, which is a `role="status"` live region so it is announced (UX9) — demonstrated by: click to overlap a tower, then place towers until money runs out and click a fourth spot (funds reason); the route-sealing reason is proven by AC3's test, since three towers can't seal the board; screenshot plus accessibility snapshot showing the status text.
- AC11 (observe): Tower fill vs board background ≥3:1 and HUD text vs its background ≥4.5:1 (UX2) — demonstrated by: computed contrast ratios for the hex pairs recorded in evidence.

## Contracts
provides: placement
consumes: game-state, pathfinding
Signatures use one options object (learning from grid-and-route: write them in the ≤2-positional-arg shape at spec time); contracts.yml `placement` and `game-state` entries updated to match.

## Tasks
- T1: Placement core. `src/game/state.ts`: `Tower` gains `anchor: Tile`; `GameState` gains `money` and `nextId`; export `STARTING_MONEY` (30 — three towers) and `TOWER_COST` (10) as named constants. New `src/game/placement.ts`: `towerFootprint(anchor)`, `blockedTiles(state)`, `canPlaceTower({ state, anchor })`, `placeTower({ state, anchor })` per AC1–AC6, route check via `findRoute`. Tests first in `src/game/placement.test.ts`; update `state.test.ts` for the new fields. (size: normal)
- T2: Board + HUD wiring. `src/render/drawBoard.ts`: draw towers under the spawn/exit markers; export `tileFromPoint` (AC7, tested). `src/render/Board.tsx`: `onTileClick(tile)` prop from canvas clicks. `src/App.tsx`: hold the state, call `placeTower`, recompute the route from `blockedTiles`, render the money counter and the `role="status"` line (AC8, AC9, AC11). Update `docs/architecture.md` (placement seam, layer table) and README (one line: click to place a tower). (size: normal)

## Out of scope
- Building disabled while enemies are alive — enemies-walk.
- Ghost/hover preview, reason-on-hover, route preview, keyboard placement and shortcuts — placement-ux. Placement is mouse-only in this slice, a known UX4 gap that placement-ux's shortcuts slice closes; flagged, not silently skipped.
- Selling, multiple tower types, real economy values (purse, bounties) — tower-combat, waves-economy, balance-pass.
- Active-enemy/anti-juggle checks — live-repath extends `canPlaceTower`.
- Polish findings (Board.tsx canvas resize, BFS-twice, etc.) — polish slice; this slice redraws per click, not per frame.

## Demonstration
`npm run gate` green. `npm run dev -- --port 5181`: place a tower on the straight route and watch it bend; try each refusal (edge, spawn/exit, overlap, sealing gap) and read its reason; place the three affordable towers, then click a fourth spot and read the funds reason with the money counter at 0.

## Notes
- Owner decision A1 (binding, user-approved (owner, lane session, "Maybe 3 towers to start, 50 is way too many"); follow-up via coordinator, "I think that AC is nonsensical and doesn't make the game fun. you can progress and build-up to the big switchback maze"): STARTING_MONEY = 30 with TOWER_COST = 10 (three towers). AC10 (switchback buildable with starting money) dropped; the big maze is earned through progression.
