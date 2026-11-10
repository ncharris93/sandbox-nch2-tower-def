import { distanceField, nextStep } from "./pathfinding";
import { blockedTiles } from "./placement";
import { SIM_STEP_MS } from "./sim";
import type { Enemy, GameState } from "./state";

// Test-wave and engine placeholders (owner decision A2); waves-economy and balance-pass own the real values.
export const TEST_WAVE_SIZE = 5;
export const SPAWN_INTERVAL_MS = 800;
export const ENEMY_TILES_PER_SECOND = 2;

// Steps of 1000 / 60 ms don't sum exactly in floating point (30 × 1/30 is just under 1),
// so a boundary reached after a whole number of steps would otherwise slip one step late.
const FLOAT_SLACK = 1e-9;

function exitField(state: GameState) {
	return distanceField({
		grid: state.grid,
		to: state.exit,
		blocked: blockedTiles(state),
	});
}

/** Puts one enemy on the spawn tile and books the next spawn one interval later. */
export function releaseEnemy(state: GameState): void {
	const { grid, spawn, testWave } = state;
	const next = nextStep({ grid, field: exitField(state), from: spawn });
	state.enemies.push({
		id: state.nextId,
		tile: spawn,
		next: next ?? spawn,
		progress: 0,
	});
	state.nextId += 1;
	testWave.remaining -= 1;
	testWave.untilNextSpawnMs += SPAWN_INTERVAL_MS;
}

/** Releases a due enemy at the start of its step, so it walks that step like the first enemy walks step one. */
export function spawnTestWave(state: GameState): void {
	const { testWave } = state;
	if (testWave.remaining === 0) return;

	if (testWave.untilNextSpawnMs <= FLOAT_SLACK) releaseEnemy(state);
	testWave.untilNextSpawnMs -= SIM_STEP_MS;
}

/** Advances every enemy along the live route; an enemy with no further step has reached the exit and leaves. */
export function moveEnemies(state: GameState): void {
	const { grid } = state;
	const field = exitField(state);
	const progressPerStep = (SIM_STEP_MS * ENEMY_TILES_PER_SECOND) / 1000;
	const remaining: Enemy[] = [];

	for (const enemy of state.enemies) {
		enemy.progress += progressPerStep;
		if (enemy.progress < 1 - FLOAT_SLACK) {
			remaining.push(enemy);
			continue;
		}

		const next = nextStep({ grid, field, from: enemy.next });
		if (next === null) continue;

		enemy.tile = enemy.next;
		enemy.next = next;
		enemy.progress = Math.max(0, enemy.progress - 1);
		remaining.push(enemy);
	}
	state.enemies = remaining;
}
