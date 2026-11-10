---
slice: 2026-11-09-enemies-walk
type: feature
status: done
created: 2026-11-09
spec_written: 2026-11-09
ai_docs_version: "2.5.0"
---
# A test wave walks the live route

## Outcome
A "Start wave" control spawns a short test wave of enemies over time at the spawn; each walks the current route tile by tile at a fixed-timestep speed, visibly reaches the exit and disappears. Pause/resume freezes and resumes all movement. Building is disabled (with a stated reason) while enemies are alive.

## Why now
Closes the loop that proves the sim tick, movement and route-following the three parallel follow-on jobs all build on.

## Acceptance criteria
A wave is *active* from `startTestWave` until its last enemy has spawned and left the board. Constants are named in `## Notes`.
- AC1 (test): `startTestWave(state)` on an idle board spawns `TEST_WAVE_SIZE` enemies at the spawn tile, the first at once and each next after `SPAWN_INTERVAL_MS` more sim time; every enemy gets a fresh id from `nextId`. Calling it while a wave is active changes nothing.
- AC2 (test): every enemy steps through exactly the tiles of `findRoute(spawn → exit)` for the current layout, in order, with 0 towers and with 3 towers placed so the route bends; it advances one tile per `1000 / ENEMY_TILES_PER_SECOND` ms of sim time and is removed from `enemies` on reaching the exit.
- AC3 (test): feeding `advance` the same total elapsed time as 16.67 ms frames, as 33.3 ms frames and as uneven frames yields deep-equal states (sim time, enemy tiles and progress).
- AC4 (test): one `advance` with `elapsedMs: 10_000` moves sim time forward by at most `MAX_FRAME_MS`, so no enemy moves more than `MAX_FRAME_MS × ENEMY_TILES_PER_SECOND / 1000` tiles in that call.
- AC5 (test): while `paused` is true, `advance` with any elapsed time leaves the state deep-equal to before; after resuming, enemies continue from the same tiles and progress.
- AC6 (test): while a wave is active, `canPlaceTower` and `placeTower` refuse every anchor with a player-readable reason that says building resumes when the wave ends, and leave money and towers unchanged; once the last enemy exits, a legal placement succeeds again.
- AC7 (test): the game store applies every write (placement, wave start, pause toggle, advance) to the latest state: a tower placed between two `advance` calls is still there after both, and the enemy progress made before the placement is kept. Each write gives `getSnapshot()` a new identity and notifies subscribers.
- AC8 (observe): the HUD shows a "Start Wave" button and a "Pause"/"Resume" button, both Tab-reachable and Enter/Space-activated with a visible focus ring. While paused, a visible "Paused" text label is shown (not color alone). The status line announces "Wave started…" with the building rule, the refusal reason on a board click mid-wave, and "Wave cleared…" when the last enemy exits. "Start Wave" is disabled while a wave is active. Demonstrated by: driving the dev server on port 5181 by keyboard and mouse, with screenshots of the idle, running, paused and cleared states.
- AC9 (observe): with 0 towers and again with 3 towers bending the route, enemies glide tile to tile along the drawn route and vanish at the exit. Pause freezes them and Resume continues them. Backgrounding the tab for at least 10 s during a wave and returning shows no jump past the clamp. Demonstrated by: a browser session on port 5181 with screenshots before, during and after each wave and around the pause and the background.
- AC10 (observe): the canvas backing store is sized only on mount and on board-size change, never per redraw. Demonstrated by: `evaluate_script` installs a counting `width` setter on the canvas before Start Wave, and it reads 0 after a full wave.

## Contracts
provides: [sim-loop]
consumes: [game-state, pathfinding, placement]
Signatures take one options object and at most 2 positional args (job learning: grid-and-route contract text broke the convention). All changes to consumed seams are additive and recorded as `refinements` in `contracts.yml`:
- game-state: `Enemy` gains `tile: Tile`, `next: Tile` and `progress: number` (0–1 of the step from `tile` to `next`). `GameState` gains `timeMs`, `paused`, `pendingMs` (unspent frame time) and `testWave: { remaining: number; untilNextSpawnMs: number }`. `createInitialState` sets them to idle.
- pathfinding: new `nextStep({ grid, field, from }) → Tile | null` returns the first neighbor one step closer in `NEIGHBOR_OFFSETS` order. `findRoute` uses it internally, so its output is unchanged and AC2 holds by construction.
- placement: a new first check refuses every placement while `isWaveActive(state)`. The check order becomes wave-active, off-board, spawn/exit, overlap, funds, route.
- sim-loop (`src/game/sim.ts`): `advance({ state, elapsedMs })`, `step(state)`, `startTestWave(state)`, `isWaveActive(state)`, `SIM_STEP_MS`, `MAX_FRAME_MS`. `step` runs an ordered list of system functions `(state) => void`, currently spawn then movement from `src/game/enemies.ts`, and later jobs append theirs.

## Tasks
- T1: Sim core, test-first for AC1–AC6. Add the game-state fields, `nextStep` plus the `findRoute` refactor, `src/game/enemies.ts` (spawn and move systems), `src/game/sim.ts`, and the placement wave-active check. The refinements are already recorded in `contracts.yml`. AC2's 3-tower layout must be reachable with starting money (owner A1: no long switchback). (size: normal)
- T2: The store and the HUD, for AC7 and AC8. `src/game/store.ts` (`createGameStore()` → `getSnapshot`, `subscribe`, `placeTower(anchor)`, `startWave()`, `togglePause()`, `advance(elapsedMs)`) clones state then applies each write. `App.tsx` reads it via `useSyncExternalStore` (per tech-stack.yml) and drives `advance` from a `requestAnimationFrame` loop. Add the Start Wave and Pause/Resume buttons and the wave announcements through `nextAnnouncement`. Tick polish `src/App.tsx:26` (functional writes). Update `docs/architecture.md` (layers and seams) to match. (size: normal)
- T3: Render enemies, for AC9 and AC10. `drawBoard` draws each enemy between `tile` and `next` at `progress`, above the route and below the markers. Split `Board.tsx` canvas sizing into its own effect keyed on width, height and DPR, so redraws only draw. Tick polish `src/render/Board.tsx:27`. (size: normal)

## Out of scope
Combat, enemy health, damage, leaks and lives (tower-combat). Real waves, wave scheduling and rewards (waves-economy). Building mid-wave and repathing active enemies (live-repath). Speed controls and placement previews (placement-ux). The other polish findings, which stay in the polish slice.

## Demonstration
Run `npm run gate` green. Then `npm run dev -- --port 5181`. On the empty board, press Start Wave and watch every enemy walk the drawn route and vanish at the exit; a click mid-wave shows the refusal, and "Wave cleared" follows. Place 3 towers that bend the route and run a second wave that follows the bend. Pause mid-wave, wait, then Resume. Background the tab for 10 s or more, then return. Finally, operate both buttons by keyboard alone.

## Notes
- From grid-and-route review (polish findings): `src/render/Board.tsx:27` reassigns canvas width/height on every redraw, which reallocates the backing store per frame once redraw runs per tick — this slice makes that hot; the spec may pull the sizing split forward and tick the polish line.
- From place-towers (owner decision A1): the player starts with money for three towers, so the demonstration and any route-length assumptions must hold on an open or lightly mazed board (0–3 towers); do not script a long switchback maze.
- From place-towers review (polish finding `src/App.tsx:26`): tile clicks clone the render-time `gameState` rather than using a functional `setGameState` update. Once a sim tick also writes state, a click can overwrite tick progress (or a tick can drop a tower), so the spec should route ticks and clicks through functional updates (or one reducer) and tick that polish line.
- Tuning numbers for owner confirmation. These are test-wave and engine values only, and waves-economy and balance-pass own the real ones:
  - `TEST_WAVE_SIZE = 5`: enemies in the test wave.
  - `SPAWN_INTERVAL_MS = 800`: sim time between spawns.
  - `ENEMY_TILES_PER_SECOND = 2`: about 15 s to cross an open 30-wide board.
  - `SIM_STEP_MS = 1000 / 60`: the fixed timestep.
  - `MAX_FRAME_MS = 250`: the most sim time one frame can advance.
- Owner decision A2 (binding, user-approved (owner, via coordinator, "approved")): TEST_WAVE_SIZE = 5, SPAWN_INTERVAL_MS = 800, ENEMY_TILES_PER_SECOND = 2, as placeholders for waves-economy/balance-pass.
- Consumed-seam changes (game-state, pathfinding, placement) auto-approved (policy: contract-additive); the wave-active placement refusal is the brief invariant "Building is disabled while enemies are alive".
