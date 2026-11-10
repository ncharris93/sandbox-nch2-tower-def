---
slice: 2026-11-09-grid-and-route
type: feature
status: todo
created: 2026-11-09
---
# Grid with spawn, exit and the computed route

## Outcome
`npm run dev` opens a canvas grid with a clearly marked spawn and exit and the BFS route between them drawn on the board. Rides the scaffold: Vite + React + TS strict, Vitest, Biome, Husky + lint-staged, `npm run gate`, a GitHub Actions workflow running the gate on pushes to `main`, README quick start and `docs/architecture.md` skeleton.

## Why now
Every later slice and job forks from this structure and gate; deterministic pathfinding is the core mechanic and the biggest correctness risk, so it is proven first.
