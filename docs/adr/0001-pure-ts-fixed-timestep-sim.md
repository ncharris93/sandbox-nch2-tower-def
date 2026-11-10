# 0001 — Pure-TypeScript fixed-timestep simulation, canvas render, React HUD

**Status:** accepted · 2026-11-09 · approved by the owner at maze-core shape

## Context
A maze tower defense needs correct, testable pathfinding, combat, economy and wave logic, stable behavior across frame rates, a real pause, and hundreds of moving entities on screen. Three follow-on jobs will extend the same state in parallel.

## Decision
The game rules live in a pure TypeScript simulation module with no React or DOM imports, advanced by a fixed-timestep tick with clamped catch-up. The board renders to an HTML Canvas 2D; React renders only the HUD and panels, subscribing to a state snapshot via `useSyncExternalStore`. No game engine or state library.

## Consequences
- Pathing, placement, combat and waves are unit-tested headless with Vitest.
- Frame-rate changes and backgrounded tabs never change outcomes; pause stops sim time.
- Visual output is checked by running the app, not by tests.
