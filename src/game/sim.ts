import {
	moveEnemies,
	releaseEnemy,
	spawnTestWave,
	TEST_WAVE_SIZE,
} from "./enemies";
import type { GameState } from "./state";

export const SIM_STEP_MS = 1000 / 60;
/** Caps one frame's sim time so a backgrounded tab resumes instead of teleporting enemies. */
export const MAX_FRAME_MS = 250;

// Runs in this order every step; later jobs append their systems.
const SYSTEMS: readonly ((state: GameState) => void)[] = [
	spawnTestWave,
	moveEnemies,
];

/** True from `startTestWave` until the last enemy has spawned and left the board. */
export function isWaveActive(state: GameState): boolean {
	return state.testWave.remaining > 0 || state.enemies.length > 0;
}

/** Spawns the first enemy at once and queues the rest; does nothing while a wave is active. */
export function startTestWave(state: GameState): void {
	if (isWaveActive(state)) return;

	state.testWave = { remaining: TEST_WAVE_SIZE, untilNextSpawnMs: 0 };
	releaseEnemy(state);
}

export function step(state: GameState): void {
	for (const system of SYSTEMS) system(state);
	state.timeMs += SIM_STEP_MS;
}

// Whole ticks keep the bank exact however a total is split into frames: at 3000 per ms both
// a 1000 / 60 ms step and any microsecond frame time are integers, where float ms drift.
const TICKS_PER_MS = 3000;
const TICKS_PER_STEP = Math.round(SIM_STEP_MS * TICKS_PER_MS);

function toTicks(ms: number): number {
	return Math.round(ms * TICKS_PER_MS);
}

/** Runs one fixed step per `SIM_STEP_MS` of clamped frame time, banking the rest; no-op while paused. */
export function advance(params: { state: GameState; elapsedMs: number }): void {
	const { state, elapsedMs } = params;
	if (state.paused) return;

	let pendingTicks =
		toTicks(state.pendingMs) + toTicks(Math.min(elapsedMs, MAX_FRAME_MS));
	while (pendingTicks >= TICKS_PER_STEP) {
		step(state);
		pendingTicks -= TICKS_PER_STEP;
	}
	state.pendingMs = pendingTicks / TICKS_PER_MS;
}
