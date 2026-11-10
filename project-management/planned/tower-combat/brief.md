---
job: tower-combat
shape: backlog
type: feat
ticket: "5"
created: 2026-11-09
ai_docs_version: "2.5.0"
---
# Tower combat: Cannon, Rapid, Frost with upgrades and selling

## Goal
Turn maze-core's wall towers into weapons. Three towers with distinct jobs — Cannon (slow, splash, punishes groups), Rapid (fast single-target, finishes leakers), Frost (slows to buy exposure time) — each with deterministic, purpose-fit targeting, visible attacks, four levels (0–3) whose upgrades reinforce identity, and selling for a partial refund. Enemies gain health, health bars and death. Per `PROMPT.md` sections Towers, Tower upgrades, Targeting and combat behavior.

## Invariants
- Builds on maze-core's sim core; all combat rules live in the pure-TS simulation, never in render or React.
- Every tower is still a 2×2 wall; placement legality stays maze-core's `placement` module.
- Targeting is deterministic: Rapid → least remaining path distance to exit; Cannon → the target whose splash hits the most enemies, tie-break by progress; Frost → furthest-along unslowed target, falling back to slowed ones only when none are unslowed.
- Combat timing runs on sim time (cooldowns in sim seconds), so pause and frame rate never change outcomes.
- Damage is applied predictably: projectiles resolve on arrival at their target's (or impact point's) position; splash hits every enemy in radius.
- Slow is partial (never a stop) and non-stacking: strongest active slow wins, duration refreshes.
- Sell refund is 75% of total invested (build + upgrades); the footprint becomes traversable immediately.
- This job owns the enemy health/damage/death/slow fields and a death event; enemy archetypes, kill bounties, lives and waves belong to `waves-economy`. A flat placeholder bounty per kill is acceptable until then.
- Exact numbers are this job's first pass; `balance-pass` tunes them with the owner.

## Definition of done
- All three towers buildable from a type selector, each attacking with a distinct visible projectile/effect; Cannon splash visibly damages several enemies; Frost-slowed enemies are tinted and visibly slower.
- Selecting a placed tower shows type, level, damage, rate, range, splash/slow where relevant, upgrade cost and sell value; upgrades work through Level 3 with visible feedback; selling refunds 75% and reopens the route.
- Headless tests cover each targeting rule, splash, slow non-stacking, upgrade stats per level, refund math, and death.
- Docs: in — `docs/architecture.md` grows the combat systems.

## Deliberately untested
- Projectile miss behavior when a target dies mid-flight is simplified (shot fizzles or retargets) — a player may see an occasional wasted shot; cosmetic.
- Balance — numbers are first-pass; a first-time player could find one tower dominant until balance-pass.
