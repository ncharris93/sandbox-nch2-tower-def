# Architecture

Maze Tower Defense is a client-only single-page app (Vite + React 18 + TypeScript strict). Stack choices are recorded in `docs/tech-stack.yml`.

## Layers

| Layer | Location | Owns | May import |
|---|---|---|---|
| Simulation core | `src/game/` | Game state, grid rules, pathfinding, placement rules, the fixed-timestep sim tick and enemy movement, and the game store | Nothing outside `src/game` — no React, no DOM |
| Board render | `src/render/` | Drawing the board and towers on an HTML Canvas 2D, turning canvas clicks into tiles | `src/game` exports and React |
| App shell | `src/App.tsx`, `src/main.tsx` | Subscribing to the game store, driving `advance` from a `requestAnimationFrame` loop, mounting the board, the money counter, the Start Wave and Pause/Resume buttons and the status line | Everything above |

The simulation core is pure TypeScript and is unit-tested headless with Vitest. `src/game/boundary.test.ts` fails the gate if any `src/game` source imports React or touches `document` or `window`. Rendering reads the state and route that the core produces and never computes game rules itself. Canvas output is checked by running the app, not by snapshot tests.

## Seams

Four files are the contracts that follow-on jobs extend:

- `src/game/state.ts` — `GameState`, `Grid`, `Tile` and `createInitialState()`. One state module; towers and enemies are lists of plain records with stable ids handed out from `nextId`. A tower record is `{ id, anchor }`, where `anchor` is the top-left tile of its 2×2 footprint. An enemy record is `{ id, tile, next, progress }`, where `progress` is the 0–1 share of the step from `tile` to `next`. The state also carries the sim clock (`timeMs`, `pendingMs`), `paused` and the `testWave` spawn queue. `STARTING_MONEY` and `TOWER_COST` are named constants here.
- `src/game/pathfinding.ts` — `findRoute({ grid, from, to, blocked })` returns the shortest 4-directional route or `null` when the exit is cut off; `distanceField({ grid, to, blocked })` gives steps-to-target per tile; `nextStep({ grid, field, from })` returns the first neighbor one step closer, in `NEIGHBOR_OFFSETS` order, or `null` at the target. `blocked` is a set of tile keys (`tileKey`), so a 2×2 tower footprint passes in without a signature change.
- `src/game/placement.ts` — `canPlaceTower({ state, anchor })` checks a placement without changing state; `placeTower({ state, anchor })` runs the same check and, on success, appends the tower, deducts `TOWER_COST` and advances `nextId`. Both return `{ ok: true }` or `{ ok: false, reason }` with a player-readable reason, checked in a fixed order: wave active, off-board, spawn/exit, overlap, funds, route. Building is refused while a wave is active. `blockedTiles(state)` is the set of tile keys every tower covers — pass it to `findRoute` as `blocked`.
- `src/game/sim.ts` — `advance({ state, elapsedMs })` clamps the frame to `MAX_FRAME_MS`, banks it in `pendingMs` and runs `step(state)` once per `SIM_STEP_MS`; it does nothing while `paused`. `step` runs an ordered list of systems `(state) => void` (test-wave spawn, then enemy movement from `src/game/enemies.ts`); later jobs append theirs. `startTestWave(state)` and `isWaveActive(state)` start and report the test wave.

The game store, `createGameStore()` in `src/game/store.ts`, holds the one live state. The app reads it with `useSyncExternalStore(store.subscribe, store.getSnapshot)` and writes only through `placeTower(anchor)`, `startWave()`, `togglePause()` and `advance(elapsedMs)`. Each write clones the latest state, applies the change and publishes the clone, so a click and a tick never overwrite each other.

## Decisions

- [ADR 0001 — Pure-TypeScript fixed-timestep simulation, canvas render, React HUD](adr/0001-pure-ts-fixed-timestep-sim.md)
- [ADR 0002 — Deterministic 4-direction BFS; 2×2 towers on a 1×1 enemy grid](adr/0002-deterministic-bfs-2x2-towers.md)
