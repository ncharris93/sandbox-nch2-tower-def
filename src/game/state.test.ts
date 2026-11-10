import { describe, expect, it } from "vitest";
import { createInitialState } from "./state";

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
