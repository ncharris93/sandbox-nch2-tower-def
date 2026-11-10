---
job: maze-core
shape: backlog
type: feat
ticket: "1"
created: 2026-11-09
ai_docs_version: "2.5.0"
---
# Maze core: open-field grid, 2×2 wall towers, live pathfinding

## Goal
Stand up the game and its foundation: a browser-playable grid with a visible spawn and exit, where the player places 2×2 towers anywhere legal, the enemy route is computed by real grid pathfinding from the current layout, placements that would seal the exit are refused with a clear reason, and a test wave of enemies spawns over time and walks the live route to the exit. This is job 1 of 6 for `PROMPT.md` (maze-core → tower-combat, waves-economy, live-repath → placement-ux → balance-pass); every later job forks from the structure and gate this one lands.

## Invariants
- Stack per `docs/tech-stack.yml`. No dependency outside it without an owner ask.
- `PROMPT.md` at the repo root is the product spec for the whole program; this job builds only its maze/pathing/placement/movement foundation.
- Simulation core (grid, pathfinding, placement rules, enemy movement, sim tick) is pure TypeScript with no React or DOM imports, and is unit-testable headless. Rendering (canvas) and HUD (React) read from it; they never own game rules.
- Fixed-timestep simulation: movement is identical across frame rates; paused means no sim time advances; a long frame (backgrounded tab) is clamped, never a teleport.
- Towers occupy 2×2 tiles; enemies occupy and move on 1×1 tiles with 4-directional movement only. No predefined path anywhere in code or data.
- Pathfinding is deterministic: same layout → same route, with a fixed neighbor tie-break order.
- A placement is accepted only if spawn can still reach exit with the footprint blocked; every rejection carries a player-readable reason.
- Building is disabled while enemies are alive in this job. Mid-wave building, active-enemy repathing and anti-juggling belong to `live-repath`, which lifts this restriction.
- Game state shape is built to be extended by three parallel follow-on jobs (towers/combat, waves/economy, live repath): one state module, enemies and towers as lists of plain records with stable ids, no per-feature fields baked into unrelated modules.
- One `npm run gate` script is the only pre-merge check set (Biome, `tsc --noEmit`, Vitest, `vite build`); CI runs it on pushes to `main` only.

## Definition of done
- `npm install && npm run dev` opens a playable page: grid, obvious spawn and exit, route drawn, towers placeable, path-blocking placements rejected with a reason, a test wave walks the live route and disappears at the exit.
- Pause/resume stops and resumes all sim progression.
- `npm run gate` green locally and in CI on `main`; Husky pre-commit active.
- Pathfinding, placement legality and movement covered by headless Vitest tests.
- Docs: in. README quick start + `docs/architecture.md` exist and match the code.

## Deliberately untested
- Render performance on low-end/mobile hardware — grid is small (~30×20) and BFS is microseconds; if it bites, frames drop on old laptops, caught later by balance-pass play.
- Canvas visual output is not snapshot-tested — pixel tests are brittle; verifiers check the running app by eye instead, so a visual regression could slip a slice until the next smoke test.
- Touch/mobile input — PROMPT targets a desktop mouse game; a touch user may be unable to place towers.
