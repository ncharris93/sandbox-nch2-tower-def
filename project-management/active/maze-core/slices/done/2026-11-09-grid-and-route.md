---
slice: 2026-11-09-grid-and-route
type: feature
status: done
created: 2026-11-09
spec_written: 2026-11-09
ai_docs_version: "2.5.0"
---
# Grid with spawn, exit and the computed route

## Outcome
`npm run dev` opens a canvas grid with a clearly marked spawn and exit and the BFS route between them drawn on the board. Rides the scaffold: Vite + React + TS strict, Vitest, Biome, Husky + lint-staged, `npm run gate`, a GitHub Actions workflow running the gate on pushes to `main`, README quick start and `docs/architecture.md` skeleton.

## Why now
Every later slice and job forks from this structure and gate; deterministic pathfinding is the core mechanic and the biggest correctness risk, so it is proven first.

## Acceptance criteria
Stack and layering are fixed by `docs/tech-stack.yml`, ADR 0001 and ADR 0002; nothing below adds a dependency outside them.

**Simulation core (`src/game/`, no React/DOM imports)**
- AC1 (test): `createInitialState()` returns a 30×20 grid with spawn at (0,10), exit at (29,10), and empty `towers` and `enemies` arrays.
- AC2 (test): on an open grid the route from spawn to exit starts at spawn, ends at exit, has 30 tiles (shortest length), and each step moves exactly one tile up, down, left or right — never diagonally.
- AC3 (test): calling the route function twice on the same layout returns identical tile lists, and on an open 3×3 grid from (0,0) to (2,2) the route follows the documented fixed neighbor order (N, E, S, W) — expected route written literally in the test.
- AC4 (test): with a blocked tile set, the route never passes through a blocked tile and stays the shortest available length (a wall with one gap yields a route through that gap).
- AC5 (test): when the blocked tiles fully cut spawn from exit, the route function returns `null` (not an empty array or a throw).
- AC6 (test): the distance-to-exit field gives 0 at exit, the BFS step count for reachable tiles, and an explicit unreachable marker for blocked or cut-off tiles.
- AC7 (test): `grep -r "from 'react'\|document\.\|window\." src/game` finds nothing — asserted by a Vitest test that reads the `src/game` sources, so the boundary breaks the gate.

**Board UI**
- AC8 (observe): the board renders the grid on a `<canvas>`; the route is drawn as a continuous line or tile trail from spawn to exit that is visibly distinct from the grid lines — demonstrated by: screenshot of `npm run dev -- --port 5181`.
- AC9 (observe): spawn and exit are identifiable without color — each carries a text label ("Spawn", "Exit") or distinct glyph drawn on the board, and both markers meet 3:1 contrast against the board background (UX2) — demonstrated by: screenshot plus the two contrast ratios recorded.
- AC10 (observe): the canvas has `role="img"` and an `aria-label` describing the board in a sentence (e.g. "Game board, 30 by 20 tiles. Enemies walk from the spawn on the left to the exit on the right.") and the page `<title>` is "Maze Tower Defense" (UX9, UX13) — demonstrated by: DevTools accessibility snapshot of the running page.
- AC11 (observe): the canvas reads from the state and route produced by `src/game` and computes no route itself — demonstrated by: the render module's imports listed in the verify report (only `src/game` exports and React).

**Repo tooling**
- AC12 (observe): `npm install && npm run gate` exits 0, running in order `biome check .`, `tsc --noEmit`, `vitest run`, `vite build` — demonstrated by: gate output with exit code.
- AC13 (observe): the gate fails on a type error — demonstrated by: temporarily adding `const x: number = "a"` in `src/`, running `npm run gate` (non-zero, tsc error shown), then reverting.
- AC14 (observe): Husky pre-commit runs lint-staged (Biome on staged files) and `tsc --noEmit`, and no tests or build (repo-tooling: fast hook) — demonstrated by: `.husky/pre-commit` contents and a commit attempt with a deliberately misformatted staged file being refused (then reverted, never committed).
- AC15 (observe): `.github/workflows/gate.yml` triggers on `push` to `main` only (no `pull_request` trigger), runs `npm ci` then `npm run gate` on Node from `.nvmrc` — demonstrated by: workflow file contents (CI itself is proven after merge, not in the lane).
- AC16 (observe): README has a quick start (`npm install`, `npm run dev`, `npm run gate`) and `docs/architecture.md` names the `src/game` core vs canvas/React split, the two seam files, and links ADR 0001/0002 — demonstrated by: following the README quick start from a clean clone to the running board.

## Contracts
provides: [game-state, pathfinding]
consumes: []
Both stay `status: stub` after this slice (place-towers and enemies-walk extend them). Exported API to land: `state.ts` — `GameState`, `Tile {x, y}`, `createInitialState()`; `pathfinding.ts` — each function takes one options object: `findRoute({ grid, from, to, blocked })` → `Tile[] | null`, `distanceField({ grid, to, blocked })` → `DistanceField`, plus `tileKey(tile)`, `UNREACHABLE` and the `DistanceField` type. `blocked` is a `ReadonlySet` of `tileKey` strings so place-towers can pass a 2×2 footprint without changing the signature.

## Tasks
- T1: Scaffold and gate — Vite + React 18 + TS strict project (`package.json` with `dev`/`build`/`test`/`gate` scripts, `tsconfig`, `vite.config.ts`, `index.html` with the AC10 title), `biome.json`, Husky + lint-staged pre-commit, `.github/workflows/gate.yml`, `.nvmrc`, `.gitignore` additions (`node_modules`, `dist`), README quick start. Do not edit `project-management/policy.md` — the coordinator sets `gate` after this job merges; the lane runs `npm run gate` as its PR proof meanwhile. Do not pin the dev port in config; verification passes `--port 5181`. Covers AC12–AC15 and the README half of AC16. (size: normal)
- T2: Simulation core — `src/game/state.ts` and `src/game/pathfinding.ts` test-first (AC1–AC7), tests beside the sources. State is one module of plain records with stable-id lists per the brief; no per-feature fields beyond the contract description. (size: normal)
- T3: Board render — `src/App.tsx`/`main.tsx` mount a board component that draws grid, spawn, exit and the `findRoute` result on a canvas (AC8–AC11); draw code lives in a render module separate from `src/game`. Write `docs/architecture.md` skeleton (AC16). (size: normal)

## Out of scope
Tower placement, money, input handling on the board, enemies, sim tick and pause (later slices); HUD panels; route preview; PR-triggered CI; any router or state library; canvas snapshot tests (brief: deliberately untested); responsive/touch layout.

## Demonstration
From a clean checkout: `npm install && npm run gate` exits 0; `npm run dev -- --port 5181` shows a 30×20 grid with labelled Spawn (left) and Exit (right) joined by a straight drawn route; DevTools accessibility tree shows the canvas `img` role with its label. Vitest output lists the AC1–AC7 tests passing.

## Notes
- Learnings: job and project learnings files hold no entries yet; nothing to carry in.
