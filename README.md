# Maze Tower Defense

A browser maze tower defense: place 2×2 towers to shape the route enemies walk from spawn to exit.

## Quick start

Requires Node from `.nvmrc` (`nvm use`).

```bash
npm install
npm run dev    # start the dev server and open the printed URL
npm run gate   # Biome, tsc --noEmit, Vitest, vite build — the pre-merge check
```

Click the board to place a tower; the route redraws around it.
