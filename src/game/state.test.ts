import { describe, expect, it } from "vitest";
import { createInitialState, STARTING_MONEY, TOWER_COST } from "./state";

describe("When a new game state is created", () => {
	it("should have a 30 by 20 grid", () => {
		// Act
		const state = createInitialState();

		// Assert
		expect(state.grid).toEqual({ width: 30, height: 20 });
	});

	it("should place the spawn on the left edge and the exit on the right edge", () => {
		// Act
		const state = createInitialState();

		// Assert
		expect(state.spawn).toEqual({ x: 0, y: 10 });
		expect(state.exit).toEqual({ x: 29, y: 10 });
	});

	it("should start with no towers and no enemies", () => {
		// Act
		const state = createInitialState();

		// Assert
		expect(state.towers).toEqual([]);
		expect(state.enemies).toEqual([]);
	});
});

describe("When a new game state is created for placement", () => {
	it("should start with enough money for three towers", () => {
		// Act
		const state = createInitialState();

		// Assert
		expect(state.money).toBe(STARTING_MONEY);
		expect(STARTING_MONEY).toBe(30);
		expect(TOWER_COST).toBe(10);
	});

	it("should start handing out ids from a numeric next id", () => {
		// Act
		const state = createInitialState();

		// Assert
		expect(state.nextId).toBe(1);
	});
});

describe("When a new game state is created for the sim", () => {
	it("should start idle at sim time zero, unpaused, with no test wave queued", () => {
		// Act
		const state = createInitialState();

		// Assert
		expect(state.timeMs).toBe(0);
		expect(state.paused).toBe(false);
		expect(state.pendingMs).toBe(0);
		expect(state.testWave).toEqual({ remaining: 0, untilNextSpawnMs: 0 });
	});
});
