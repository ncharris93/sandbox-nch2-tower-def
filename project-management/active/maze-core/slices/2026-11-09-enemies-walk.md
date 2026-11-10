---
slice: 2026-11-09-enemies-walk
type: feature
status: todo
created: 2026-11-09
---
# A test wave walks the live route

## Outcome
A "Start wave" control spawns a short test wave of enemies over time at the spawn; each walks the current route tile by tile at a fixed-timestep speed, visibly reaches the exit and disappears. Pause/resume freezes and resumes all movement. Building is disabled (with a stated reason) while enemies are alive.

## Why now
Closes the loop that proves the sim tick, movement and route-following the three parallel follow-on jobs all build on.

## Notes
- From grid-and-route review (polish findings): `src/render/Board.tsx:27` reassigns canvas width/height on every redraw, which reallocates the backing store per frame once redraw runs per tick — this slice makes that hot; the spec may pull the sizing split forward and tick the polish line.
