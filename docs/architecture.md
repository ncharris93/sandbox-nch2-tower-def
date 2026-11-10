# Architecture

Maze Tower Defense is a client-only single-page app (Vite + React 18 + TypeScript strict). Stack choices are recorded in `docs/tech-stack.yml`.

## Layers

| Layer | Location | Owns | May import |
|---|---|---|---|
| Simulation core | `src/game/` | Game state, grid rules, pathfinding, placement rules | Nothing outside `src/game` — no React, no DOM |
| Board render | `src/render/` | Drawing the board and towers on an HTML Canvas 2D, turning canvas clicks into tiles | `src/game` exports and React |
| App shell | `src/App.tsx`, `src/main.tsx` | Holding the state, asking `src/game` to place towers and for the route, mounting the board, the money counter and the status line | Everything above |

The simulation core is pure TypeScript and is unit-tested headless with Vitest. `src/game/boundary.test.ts` fails the gate if any `src/game` source imports React or touches `document` or `window`. Rendering reads the state and route that the core produces and never computes game rules itself. Canvas output is checked by running the app, not by snapshot tests.

## Seams

Three files are the contracts that follow-on jobs extend:

- `src/game/state.ts` — `GameState`, `Grid`, `Tile` and `createInitialState()`. One state module; towers and enemies are lists of plain records with stable ids handed out from `nextId`. A tower record is `{ id, anchor }`, where `anchor` is the top-left tile of its 2×2 footprint. `STARTING_MONEY` and `TOWER_COST` are named constants here.
- `src/game/pathfinding.ts` — `findRoute({ grid, from, to, blocked })` returns the shortest 4-directional route or `null` when the exit is cut off; `distanceField({ grid, to, blocked })` gives steps-to-target per tile. `blocked` is a set of tile keys (`tileKey`), so a 2×2 tower footprint passes in without a signature change.
- `src/game/placement.ts` — `canPlaceTower({ state, anchor })` checks a placement without changing state; `placeTower({ state, anchor })` runs the same check and, on success, appends the tower, deducts `TOWER_COST` and advances `nextId`. Both return `{ ok: true }` or `{ ok: false, reason }` with a player-readable reason, checked in a fixed order: off-board, spawn/exit, overlap, funds, route. `blockedTiles(state)` is the set of tile keys every tower covers — pass it to `findRoute` as `blocked`.

## Decisions

- [ADR 0001 — Pure-TypeScript fixed-timestep simulation, canvas render, React HUD](adr/0001-pure-ts-fixed-timestep-sim.md)
- [ADR 0002 — Deterministic 4-direction BFS; 2×2 towers on a 1×1 enemy grid](adr/0002-deterministic-bfs-2x2-towers.md)
