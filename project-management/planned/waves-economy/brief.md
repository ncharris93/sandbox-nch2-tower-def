---
job: waves-economy
shape: backlog
type: feat
ticket: "7"
created: 2026-11-09
ai_docs_version: "2.5.0"
---
# Waves and economy: archetypes, 10 waves, lives, win/lose, restart

## Goal
Make it a game you can win or lose. Six readable enemy archetypes (Normal, Runner, Swarm, Brute, Regenerator, Boss), ten waves that teach mechanics before combining them, an intermission with a clear "Start Next Wave", kill bounties and a starting purse that force the expand-vs-upgrade choice, lives that drop visibly on leaks, and victory/defeat overlays with a clean restart. Per `PROMPT.md` sections Enemies, Waves, Economy, Lives/leaks/victory/defeat, Game state and controls.

## Invariants
- Starts after `tower-combat` merges; consumes its enemy health/death event and replaces its placeholder bounty. Archetypes, wave schedule, bounties, lives and game outcome live in the pure-TS sim.
- Archetypes differ in more than health: speed, count/spacing, regeneration, size/visual, life cost. No armor/resistance matrix. Resistance, where used (e.g. Boss vs slow), is partial, never immunity.
- Ten waves following PROMPT's teaching curve (baseline → larger → runners → swarm → brutes → mixes → boss). Difficulty grows through count, health, speed, archetype and composition — not health inflation alone.
- Spawning is over time with a per-wave readable cadence. The next wave never auto-launches; the player starts it.
- Normal enemies cost 1 life; Boss costs more. Defeat at 0 lives; victory only after wave 10 is fully cleared.
- Restart yields a state indistinguishable from a fresh page load.
- Numbers are a first pass; `balance-pass` tunes with the owner.

## Definition of done
- Ten waves playable start to finish with intermissions, wave counter and enemies-remaining shown.
- Each archetype is visually distinct and behaves differently (speed, regen, swarm density, boss health/life cost).
- Bounty gain is visible; lives and leaks give clear feedback; victory and defeat overlays each offer restart, and restart is clean.
- Headless tests: wave schedule and cadence, archetype behaviors (regen, speed), bounty and life accounting, win/lose conditions, restart reset.
- Docs: in — README gains a how-to-play section; `docs/architecture.md` grows waves/economy.

## Deliberately untested
- A full 10-wave run is not asserted for winnability here — that is `balance-pass`'s job; until it lands a player may find a wave unwinnable or trivial.
