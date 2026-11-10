---
slice: 2026-11-09-build-mid-wave
type: feature
status: todo
created: 2026-11-09
---
# Build mid-wave; enemies re-route smoothly

## Outcome
The building lock is gone. Placing a tower during a wave re-routes every active enemy from where it stands: mid-step enemies finish or step back along valid tiles, then follow the new route. A placement that would trap any active enemy or cover one is refused with 'would trap an enemy'.

## Why now
The riskiest correctness behavior in the whole program (teleport/freeze/trap bugs); everything else here layers on it.
