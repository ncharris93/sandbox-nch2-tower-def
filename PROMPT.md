# Tower Defense Game Implementation Prompt

Build a complete, polished, playable tower defense game.

The goal is to produce a working game, not a prototype, mockup, design document, or partial implementation. You are responsible for making reasonable product and technical decisions where the requirements do not specify an answer.

The game should feel like a classic Warcraft III custom-map maze tower defense: an open build area where the player's tower placement creates the enemy route. It should **not** feel like a fixed-lane tower defense such as Bloons TD.

You may use React, TypeScript, and small supporting libraries where useful. Keep the project reasonably lightweight. The finished project should be straightforward to install and run locally.

## Design intent

The central strategic mechanic is **mazing**.

Towers are both weapons and walls. Their placement should change the route enemies take, allowing the player to construct corridors, switchbacks, and kill zones that repeatedly expose enemies to the same defenses.

A good maze should be substantially more effective than simply filling the map with towers.

Do not optimize only for raw path length. Good tower placement should reward the player for routing enemies through useful tower coverage multiple times.

The core gameplay loop is:

**build a maze → create kill zones → start a wave → observe weaknesses → earn money → improve the maze or upgrade towers → survive harder waves → win or lose**

The game should be understandable quickly, but should reward better placement and investment decisions.

---

## Core game

Create a grid-based tower defense game with:

* A clearly visible enemy spawn point.
* A clearly visible destination/end point.
* Enemies that automatically travel from the spawn point to the destination.
* Player-controlled tower placement.
* Towers that act as obstacles to enemy movement.
* Dynamic enemy pathfinding based on the current tower layout.

There must NOT be a predefined fixed enemy path.

Enemies must determine a valid route through the available grid based on the towers the player has placed.

Use actual grid/graph pathfinding such as A*, Dijkstra, breadth-first search, or another appropriate algorithm.

The Towers should take up a 2x2 grid and enemies should require a 1x1 grid to travel. This allows for more interesting and complex tower arrangements.

Prefer simple four-directional grid movement unless another approach has a clear gameplay reason.

The player may place towers on any otherwise-valid buildable tile as long as doing so does not make the destination unreachable.

Before accepting a placement:

1. Temporarily treat the tile as blocked.
2. Verify that the spawn can still reach the destination.
3. If enemies are currently alive, verify that every active enemy can still reach the destination.
4. Reject the placement if any required route becomes impossible.
5. Clearly communicate why the placement was rejected.

Enemies should correctly recalculate their routes when legal tower placement or selling changes the map.

They should transition onto the new route naturally. They must not teleport, freeze permanently, walk through blocked tiles, or become trapped.

Use deterministic pathfinding/tie-breaking where practical so enemy movement feels stable instead of randomly changing between equally valid routes.

---

## Mazing and anti-juggling behavior

The game should support intentional maze construction, including long corridors, switchbacks, chokepoints, and overlapping tower coverage.

However, do not accidentally make repeatedly reversing the entire enemy wave the dominant strategy.

A known exploit in open-maze tower defense games is "juggling": the player creates two possible routes and repeatedly builds/sells a blocking tower so enemies reverse direction indefinitely.

Construction during waves may remain allowed because dynamic repathing is an important part of the game, but implement a simple anti-juggling rule.

At minimum:

* A placement may never trap an active enemy.
* Reject obviously abusive placements that cause active enemies to immediately reverse direction or dramatically increase their remaining path solely through repeated route toggling.
* Clearly communicate when such a placement is rejected.
* Normal maze extension and reasonable mid-wave adjustments should still work.

Choose a pragmatic implementation rather than building an elaborate anti-cheat system.

Selling a tower should immediately make its tile traversable and trigger appropriate repathing.

---

## Towers

Implement three meaningfully different tower types.

Their roles should interact with maze design rather than merely differing in numbers.

### Cannon Tower

A slow-firing, high-impact area-damage tower.

Characteristics:

* High damage per shot.
* Slow attack rate.
* Area-of-effect / splash damage.
* Moderate range.
* Most effective against groups moving through a concentrated kill zone.

Cannon targeting should make a reasonable effort to hit useful enemy clusters rather than blindly shooting an isolated target when a dense group is available.

### Rapid Tower

A fast-firing single-target tower.

Characteristics:

* Lower damage per shot.
* High attack rate.
* Single-target damage.
* Strong sustained damage.
* Especially useful against durable enemies and targets close to leaking.

Its default targeting should favor enemies with the least remaining path distance to the exit, or an equivalent "first" targeting strategy.

### Frost Tower

A utility/control tower.

Characteristics:

* Low direct damage.
* Applies a meaningful movement slow.
* The slow should noticeably increase the amount of time enemies spend inside nearby tower coverage.
* Particularly valuable in important kill zones.

Avoid wasting every Frost attack on the same already-slowed enemy if other useful unslowed targets are available.

The three tower types should create natural synergy:

**Frost increases exposure time → Cannon punishes groups → Rapid finishes dangerous survivors.**

---

## Tower upgrades

Every tower starts at Level 0 and can be upgraded three times:

* Level 0: Base tower
* Level 1
* Level 2
* Level 3

Each upgrade costs currency and should produce a noticeable improvement.

Do not make every upgrade merely a small percentage damage increase. Upgrade progression should reinforce the tower's identity.

Possible progression:

### Cannon

* Level 1: meaningful damage increase
* Level 2: improved splash radius and/or range
* Level 3: major damage and splash improvement

### Rapid

* Level 1: increased attack speed
* Level 2: damage and/or range improvement
* Level 3: very high sustained single-target output

### Frost

* Level 1: stronger slow
* Level 2: longer slow duration and/or range
* Level 3: stronger control, potentially including a small splash slow

Exact numbers are your responsibility to balance.

When a tower is selected, clearly display:

* Tower type
* Current level
* Damage
* Attack rate or cooldown
* Range
* Splash radius where applicable
* Slow strength/duration where applicable
* Upgrade cost
* Sell value

The player must be able to sell towers for a portion of their invested value.

Use a partial refund, roughly in the 70–80% range, rather than a full refund unless testing reveals a strong reason otherwise.

Selling should involve enough loss that placement decisions matter.

---

## Targeting and combat behavior

Tower targeting should be deterministic and understandable.

Do not default every tower to "nearest enemy" if another rule better supports its purpose.

Useful defaults:

* Rapid Tower: enemy furthest along toward the destination.
* Cannon Tower: target that produces a useful splash hit on a cluster, with progress toward the exit as a tiebreaker.
* Frost Tower: dangerous unslowed target, preferring enemies farther along the route.

Projectiles or attacks should visually connect the tower to the target.

Damage should occur consistently and predictably.

Area damage should visibly affect all enemies in the splash area.

Slow effects should have a clear visual indicator and an obvious effect on movement speed.

---

## Enemies

Use several simple enemy archetypes rather than scaling every wave only by increasing health.

Keep the system readable. Do not create a complicated armor/resistance matrix.

Suggested archetypes:

### Normal

Balanced baseline enemy.

### Runner

* Lower health
* High movement speed
* Tests maze coverage and Frost placement

### Swarm

* Many weak enemies
* Tests Cannon splash effectiveness

### Brute

* Slow movement
* High health
* Tests sustained Rapid Tower damage and upgrades

### Regenerator

* Moderate stats
* Slowly restores health while alive
* Encourages concentrated damage rather than weak coverage everywhere

### Boss

* Very high health
* Low count
* Used as a final-wave threat

Enemy mechanics should pressure different defensive arrangements without making any tower type completely useless.

Avoid hard immunity where possible. If an enemy resists an effect, prefer partial resistance rather than total negation.

Enemies should:

* Spawn over time rather than all at once.
* Follow the currently valid route.
* Take damage from towers.
* Die at zero health.
* Award currency when killed.
* Reduce player lives when reaching the destination.
* Display understandable health bars.
* Have visually distinguishable archetypes.

---

## Waves

Implement approximately 10 waves.

The difficulty curve should teach mechanics before combining them.

A reasonable structure is:

1. Baseline enemies — teach basic building and combat.
2. Larger baseline wave — emphasize maze quality.
3. Runners — demonstrate the value of slowing and route coverage.
4. Swarm — demonstrate splash damage.
5. Brutes — demonstrate sustained damage and upgrading.
6. Mixed baseline + runners.
7. Large swarm / mixed-density pressure.
8. Brutes plus faster support.
9. Difficult mixed wave testing the whole defense.
10. Boss plus supporting enemies.

This is guidance, not a mandatory exact composition.

Waves should become harder through a combination of:

* Enemy count
* Health
* Speed
* Enemy archetype
* Composition

Do not rely entirely on exponential health inflation.

Enemy spawning should have a readable cadence. Different waves may use different spacing when that reinforces their character.

Provide a short intermission between waves and a clear "Start Next Wave" control.

Do not automatically launch the next wave before the player has had a reasonable chance to inspect, build, upgrade, and sell.

---

## Economy

Implement a simple but meaningful economy.

The player should:

* Begin with enough money to build several basic towers.
* Spend money to build towers.
* Earn money by killing enemies.
* Spend money to upgrade towers.
* Receive a partial refund when selling.

The economy should continually create a meaningful decision between:

**expanding the maze** and **investing more heavily in towers already covering strong kill zones.**

Upgrading well-positioned towers should generally be more combat-efficient than endlessly adding weak towers, while additional towers should provide route shaping, coverage, and new control points.

Avoid an economy where the obvious action is always "buy the available upgrade immediately."

Avoid an economy where a player can freely rebuild the entire defense with no meaningful cost.

Balance the game so a reasonable first-time strategy can make progress, while poor maze design eventually fails.

---

## Lives, leaks, victory, and defeat

Display remaining player lives clearly.

When an enemy reaches the destination:

1. It should visibly enter or reach the destination.
2. The enemy should disappear.
3. The player should lose the appropriate number of lives.
4. The UI should provide clear feedback that a leak occurred.

Normal enemies may cost one life. Bosses or exceptional enemies may cost more if useful for balance.

The player loses when lives reach zero.

The player wins after surviving the final wave and clearing all remaining enemies.

Victory and defeat should have clear overlays or states with a restart option.

---

## Game state and controls

Display at least:

* Player money
* Remaining lives
* Current wave
* Enemies remaining or wave progress
* Selected tower/build mode
* Relevant tower information when a placed tower is selected

Provide controls to:

* Select each tower type
* Cancel build mode
* Start the next wave
* Pause/resume the game
* Restart the game
* Upgrade a selected tower
* Sell a selected tower

Useful keyboard shortcuts are welcome but must not be required.

---

## Placement UX

Placement should feel deliberate and easy to understand.

While placing a tower:

* Show a placement ghost or preview.
* Show the tower's attack range.
* Clearly distinguish valid and invalid tiles.
* Make insufficient funds obvious.
* Make path-blocking rejection obvious.
* Make anti-juggling rejection obvious when relevant.

If reasonably achievable, previewing how a placement changes the route is valuable, but correctness is more important than an elaborate preview system.

The spawn and destination must remain visually obvious even when many towers are present.

---

## Combat readability and feedback

Simple graphics are acceptable, but the player must be able to understand cause and effect.

Provide lightweight visual feedback such as:

### Cannon

* Visible projectile or firing cue.
* Visible impact/explosion.
* Multiple nearby enemies visibly take damage.

### Rapid

* Frequent projectile or firing cue.
* Clearly focused single-target damage.

### Frost

* Distinct projectile/effect.
* Slowed enemies have a visible status treatment.
* Their reduced movement speed should be obvious.

Also provide:

* Enemy health bars.
* A small death effect or clear removal.
* Visible money gain or clearly updating currency.
* Upgrade feedback.
* Selection highlighting.
* Range visualization for selected towers.
* Clear pause state.
* Clear wave transition feedback.

The goal is not elaborate artwork. The goal is that the player understands **what happened and why**.

---

## Kill zones and maze quality

The game should reward creating places where several sections of the route pass close to the same powerful defenses.

For example, a strong maze may create switchbacks that cause enemies to enter the range of the same upgraded Cannon or Rapid Tower multiple times.

This is intentional.

A long path that spends most of its time outside tower range should often be worse than a somewhat shorter path that repeatedly crosses concentrated tower coverage.

The combination of route geometry, tower role, and upgrade investment should be the heart of the game.

---

## Balance targets

Exact tuning is left to you, but use these principles:

* Early waves should be forgiving enough to learn.
* By the middle waves, random tower placement should perform noticeably worse than intentional mazing.
* Upgrades should become important by roughly the middle of the game.
* Each tower type should have situations where it is clearly useful.
* No single tower type should trivially solve every wave.
* A mixed defense should generally outperform indiscriminate spam.
* Frost/control should amplify damage towers rather than replace them.
* The final waves should test the maze and economy decisions made earlier.
* Winning should feel earned but achievable without requiring perfect play.

Tune costs, damage, health, speed, rewards, and spawn counts after getting the whole gameplay loop working.

---

## Technical expectations

Organize the implementation reasonably.

You may choose:

* Rendering technique
* Component architecture
* State management
* Pathfinding algorithm
* Animation approach
* Supporting libraries

Avoid unnecessary infrastructure or dependencies.

Separate core simulation/game logic from presentation where practical so pathfinding, combat, economy, and wave behavior remain understandable and testable.

Be careful with simulation timing. Pausing should actually stop gameplay progression, and attack/movement behavior should remain stable across normal frame-rate variation.

The project should include everything needed to run locally, including dependency configuration and appropriate scripts.

Do not stop after generating scaffolding.

Do not provide only snippets.

Do not describe what remains to be implemented.

Implement the complete game.

---

## Verification

After implementation:

1. Install required dependencies if the environment permits it.
2. Build and/or type-check the project.
3. Fix compilation and runtime errors.
4. Run any useful automated tests or checks you create.
5. Launch the application if possible.
6. Make a reasonable effort to verify actual gameplay.

Specifically verify:

* Towers can be placed.
* Illegal total path blocking is rejected.
* Towers can create a substantial maze.
* Active enemies can correctly repath after legal map changes.
* Active enemies cannot become permanently trapped.
* Anti-juggling behavior prevents obvious infinite reversal abuse.
* All three tower types attack correctly.
* Cannon splash damages multiple enemies.
* Frost visibly and mechanically slows enemies.
* Upgrades work through Level 3.
* Selling works and reopens pathing.
* Currency changes correctly.
* Waves spawn and advance.
* Enemy archetypes behave differently.
* Enemies can leak and reduce lives.
* Pause/resume works.
* Victory works.
* Defeat works.
* Restart produces a clean new game.

If something is unspecified, make a sensible decision and continue rather than asking for clarification.

The final result should be a **complete, playable maze tower defense game**, not merely a demonstration that pathfinding and towers technically function.

