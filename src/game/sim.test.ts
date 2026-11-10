import { describe, expect, it } from "vitest";
import {
	ENEMY_TILES_PER_SECOND,
	SPAWN_INTERVAL_MS,
	TEST_WAVE_SIZE,
} from "./enemies";
import { findRoute, tileKey } from "./pathfinding";
import { blockedTiles, placeTower } from "./placement";
import {
	advance,
	isWaveActive,
	MAX_FRAME_MS,
	SIM_STEP_MS,
	startTestWave,
	step,
} from "./sim";
import { createInitialState, type GameState, type Tile } from "./state";

const STEPS_PER_SPAWN = Math.round(SPAWN_INTERVAL_MS / SIM_STEP_MS);
const STEPS_PER_TILE = Math.round(1000 / ENEMY_TILES_PER_SECOND / SIM_STEP_MS);

// Three towers, affordable with the starting money, that push the route off the straight row.
const bendingAnchors: Tile[] = [
	{ x: 10, y: 9 },
	{ x: 14, y: 10 },
	{ x: 18, y: 9 },
];

function runSteps(params: { state: GameState; count: number }): void {
	for (let i = 0; i < params.count; i++) step(params.state);
}

function currentRoute(state: GameState): Tile[] {
	return (
		findRoute({
			grid: state.grid,
			from: state.spawn,
			to: state.exit,
			blocked: blockedTiles(state),
		}) ?? []
	);
}

function stateWithBendingTowers(): GameState {
	const state = createInitialState();
	for (const anchor of bendingAnchors) placeTower({ state, anchor });
	return state;
}

/** Steps until the wave is over, recording every tile each enemy occupies plus the tile it left toward. */
function walksOfTheWave(state: GameState): string[][] {
	const walks = new Map<number, string[]>();
	const lastNext = new Map<number, string>();
	while (isWaveActive(state)) {
		for (const enemy of state.enemies) {
			const walk = walks.get(enemy.id) ?? [];
			if (walk.at(-1) !== tileKey(enemy.tile)) walk.push(tileKey(enemy.tile));
			walks.set(enemy.id, walk);
			lastNext.set(enemy.id, tileKey(enemy.next));
		}
		step(state);
	}
	return [...walks].map(([id, walk]) => [...walk, lastNext.get(id) ?? ""]);
}

function framesTotalling(params: { pattern: number[]; totalMs: number }) {
	const frames: number[] = [];
	let spent = 0;
	for (let i = 0; spent < params.totalMs; i++) {
		const frame = Math.min(
			params.pattern[i % params.pattern.length] as number,
			params.totalMs - spent,
		);
		frames.push(frame);
		spent += frame;
	}
	return frames;
}

function playFrames(frames: number[]): GameState {
	const state = createInitialState();
	startTestWave(state);
	for (const elapsedMs of frames) advance({ state, elapsedMs });
	return state;
}

describe("When a test wave is started on an idle board", () => {
	it("should spawn the first enemy at the spawn tile at once", () => {
		// Arrange
		const state = createInitialState();

		// Act
		startTestWave(state);

		// Assert
		expect(state.enemies).toHaveLength(1);
		expect(state.enemies[0]?.tile).toEqual(state.spawn);
		expect(state.enemies[0]?.progress).toBe(0);
	});

	it("should not spawn the next enemy until a spawn interval of sim time has passed", () => {
		// Arrange
		const state = createInitialState();
		startTestWave(state);

		// Act
		runSteps({ state, count: STEPS_PER_SPAWN - 1 });

		// Assert
		expect(state.enemies).toHaveLength(1);
	});

	it("should spawn the next enemy at the spawn tile in the step that starts once the interval has passed", () => {
		// Arrange
		const state = createInitialState();
		startTestWave(state);

		// Act
		runSteps({ state, count: STEPS_PER_SPAWN + 1 });

		// Assert
		expect(state.enemies).toHaveLength(2);
		expect(state.enemies[1]?.tile).toEqual(state.spawn);
	});

	it("should spawn exactly the test wave size in total", () => {
		// Arrange
		const state = createInitialState();
		startTestWave(state);

		// Act
		runSteps({ state, count: STEPS_PER_SPAWN * (TEST_WAVE_SIZE - 1) + 1 });

		// Assert
		expect(state.enemies).toHaveLength(TEST_WAVE_SIZE);
		expect(state.testWave.remaining).toBe(0);
	});

	it("should give every enemy a fresh id from next id", () => {
		// Arrange
		const state = createInitialState();
		placeTower({ state, anchor: { x: 2, y: 2 } });
		const firstId = state.nextId;
		startTestWave(state);

		// Act
		runSteps({ state, count: STEPS_PER_SPAWN * (TEST_WAVE_SIZE - 1) + 1 });

		// Assert
		expect(state.enemies.map((enemy) => enemy.id)).toEqual(
			Array.from({ length: TEST_WAVE_SIZE }, (_, i) => firstId + i),
		);
		expect(state.nextId).toBe(firstId + TEST_WAVE_SIZE);
	});

	it("should make the wave active", () => {
		// Arrange
		const state = createInitialState();

		// Act
		startTestWave(state);

		// Assert
		expect(isWaveActive(state)).toBe(true);
	});
});

describe("When a test wave is started while one is active", () => {
	it("should change nothing", () => {
		// Arrange
		const state = createInitialState();
		startTestWave(state);
		runSteps({ state, count: STEPS_PER_SPAWN + 5 });
		const before = structuredClone(state);

		// Act
		startTestWave(state);

		// Assert
		expect(state).toEqual(before);
	});
});

describe("When the board is idle", () => {
	it("should report no active wave", () => {
		// Act
		const state = createInitialState();

		// Assert
		expect(isWaveActive(state)).toBe(false);
	});
});

describe("When enemies walk the route", () => {
	const layouts = [
		{ name: "no towers", state: createInitialState },
		{ name: "three towers bending the route", state: stateWithBendingTowers },
	];

	for (const layout of layouts) {
		describe(`Given ${layout.name}`, () => {
			it("should step every enemy through exactly the tiles of the current route", () => {
				// Arrange
				const state = layout.state();
				const route = currentRoute(state).map(tileKey);
				startTestWave(state);

				// Act
				const walks = walksOfTheWave(state);

				// Assert
				expect(walks).toEqual(Array(TEST_WAVE_SIZE).fill(route));
			});

			it("should still hold the previous tile one step before a tile's worth of time", () => {
				// Arrange
				const state = layout.state();
				startTestWave(state);

				// Act
				runSteps({ state, count: STEPS_PER_TILE - 1 });

				// Assert
				expect(state.enemies[0]?.tile).toEqual(state.spawn);
			});

			it("should advance one tile per tile's worth of sim time", () => {
				// Arrange
				const state = layout.state();
				const route = currentRoute(state);
				startTestWave(state);

				// Act
				runSteps({ state, count: STEPS_PER_TILE * 3 });

				// Assert
				expect(state.enemies[0]?.tile).toEqual(route[3]);
			});

			it("should remove an enemy exactly when it reaches the exit", () => {
				// Arrange
				const state = layout.state();
				const stepsToExit = (currentRoute(state).length - 1) * STEPS_PER_TILE;
				startTestWave(state);
				const firstId = state.enemies[0]?.id;
				runSteps({ state, count: stepsToExit - 1 });
				const beforeArriving = state.enemies.map((enemy) => enemy.id);

				// Act
				step(state);

				// Assert
				expect(beforeArriving).toContain(firstId);
				expect(state.enemies.map((enemy) => enemy.id)).not.toContain(firstId);
			});
		});
	}

	it("should bend the route with the three towers", () => {
		// Act
		const route = currentRoute(stateWithBendingTowers());

		// Assert
		expect(route.length).toBeGreaterThan(30);
	});
});

describe("When the whole wave has left the board", () => {
	it("should leave no enemies and report the wave inactive", () => {
		// Arrange
		const state = createInitialState();
		const stepsToClear =
			STEPS_PER_SPAWN * (TEST_WAVE_SIZE - 1) +
			(currentRoute(state).length - 1) * STEPS_PER_TILE;
		startTestWave(state);

		// Act
		runSteps({ state, count: stepsToClear });

		// Assert
		expect(state.enemies).toEqual([]);
		expect(isWaveActive(state)).toBe(false);
	});

	it("should still report the wave active one step before the last enemy exits", () => {
		// Arrange
		const state = createInitialState();
		const stepsToClear =
			STEPS_PER_SPAWN * (TEST_WAVE_SIZE - 1) +
			(currentRoute(state).length - 1) * STEPS_PER_TILE;
		startTestWave(state);

		// Act
		runSteps({ state, count: stepsToClear - 1 });

		// Assert
		expect(isWaveActive(state)).toBe(true);
	});
});

describe("When the same elapsed time is fed in different frame sizes", () => {
	const totalMs = 3010;

	it("should give the same state for 16.67 ms and 33.3 ms frames", () => {
		// Arrange
		const smallFrames = framesTotalling({ pattern: [16.67], totalMs });
		const largeFrames = framesTotalling({ pattern: [33.3], totalMs });

		// Act
		const fromSmall = playFrames(smallFrames);
		const fromLarge = playFrames(largeFrames);

		// Assert
		expect(fromLarge).toEqual(fromSmall);
	});

	it("should give the same state for 16.67 ms and uneven frames", () => {
		// Arrange
		const smallFrames = framesTotalling({ pattern: [16.67], totalMs });
		const unevenFrames = framesTotalling({
			pattern: [5, 41.3, 12.5, 120, 3.3, 70.25],
			totalMs,
		});

		// Act
		const fromSmall = playFrames(smallFrames);
		const fromUneven = playFrames(unevenFrames);

		// Assert
		expect(fromUneven).toEqual(fromSmall);
	});

	it("should have moved the enemies along the way", () => {
		// Act
		const state = playFrames(framesTotalling({ pattern: [16.67], totalMs }));

		// Assert
		expect(state.timeMs).toBeGreaterThan(2990);
		expect(state.enemies[0]?.tile).not.toEqual(state.spawn);
	});
});

describe("When one frame reports a very long elapsed time", () => {
	it("should move sim time forward by at most the frame clamp", () => {
		// Arrange
		const state = createInitialState();
		startTestWave(state);

		// Act
		advance({ state, elapsedMs: 10_000 });

		// Assert
		expect(state.timeMs).toBeLessThanOrEqual(MAX_FRAME_MS);
	});

	it("should move no enemy further than the clamp allows", () => {
		// Arrange
		const state = createInitialState();
		startTestWave(state);
		const maxTiles = (MAX_FRAME_MS * ENEMY_TILES_PER_SECOND) / 1000;

		// Act
		advance({ state, elapsedMs: 10_000 });

		// Assert
		expect(state.enemies[0]?.tile).toEqual(state.spawn);
		expect(state.enemies[0]?.progress).toBeLessThanOrEqual(maxTiles);
	});
});

describe("When the game is paused mid-wave", () => {
	function midWave(): GameState {
		const state = createInitialState();
		startTestWave(state);
		advance({ state, elapsedMs: 200 });
		advance({ state, elapsedMs: 210 });
		return state;
	}

	it("should leave the state unchanged however much time elapses", () => {
		// Arrange
		const state = midWave();
		state.paused = true;
		const before = structuredClone(state);

		// Act
		advance({ state, elapsedMs: 5000 });

		// Assert
		expect(state).toEqual(before);
	});

	it("should continue from the same tiles and progress once resumed", () => {
		// Arrange
		const paused = midWave();
		paused.paused = true;
		advance({ state: paused, elapsedMs: 5000 });
		paused.paused = false;
		const neverPaused = midWave();

		// Act
		advance({ state: paused, elapsedMs: 100 });
		advance({ state: neverPaused, elapsedMs: 100 });

		// Assert
		expect(paused).toEqual(neverPaused);
	});
});
