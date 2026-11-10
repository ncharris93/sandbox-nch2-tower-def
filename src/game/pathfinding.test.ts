import { describe, expect, it } from "vitest";
import { distanceField, findRoute, tileKey, UNREACHABLE } from "./pathfinding";
import { createInitialState, type Tile } from "./state";

const noBlockedTiles: ReadonlySet<string> = new Set();

function blockedSet(tiles: Tile[]): ReadonlySet<string> {
	return new Set(tiles.map(tileKey));
}

function columnExcept(params: {
	x: number;
	height: number;
	gapY: number;
}): Tile[] {
	return Array.from({ length: params.height }, (_, y) => ({
		x: params.x,
		y,
	})).filter((tile) => tile.y !== params.gapY);
}

function stepLengths(route: Tile[]): number[] {
	return route.slice(1).map((tile, i) => {
		const previous = route[i] as Tile;
		return Math.abs(tile.x - previous.x) + Math.abs(tile.y - previous.y);
	});
}

describe("When the route is computed on the open starting grid", () => {
	const { grid, spawn, exit } = createInitialState();

	it("should start at the spawn and end at the exit", () => {
		// Act
		const route = findRoute({
			grid,
			from: spawn,
			to: exit,
			blocked: noBlockedTiles,
		});

		// Assert
		expect(route?.[0]).toEqual(spawn);
		expect(route?.at(-1)).toEqual(exit);
	});

	it("should be the shortest route of 30 tiles", () => {
		// Act
		const route = findRoute({
			grid,
			from: spawn,
			to: exit,
			blocked: noBlockedTiles,
		});

		// Assert
		expect(route).toHaveLength(30);
	});

	it("should move exactly one tile orthogonally on every step", () => {
		// Act
		const route = findRoute({
			grid,
			from: spawn,
			to: exit,
			blocked: noBlockedTiles,
		});

		// Assert
		expect(stepLengths(route ?? [])).toEqual(Array(29).fill(1));
	});
});

describe("When the route is computed twice on the same layout", () => {
	it("should return identical tile lists", () => {
		// Arrange
		const { grid, spawn, exit } = createInitialState();
		const blocked = blockedSet([
			{ x: 10, y: 10 },
			{ x: 10, y: 9 },
			{ x: 15, y: 11 },
		]);

		// Act
		const first = findRoute({ grid, from: spawn, to: exit, blocked });
		const second = findRoute({ grid, from: spawn, to: exit, blocked });

		// Assert
		expect(second).toEqual(first);
	});
});

describe("When the route is computed on an open 3 by 3 grid from corner to corner", () => {
	it("should follow the fixed north, east, south, west neighbor order", () => {
		// Arrange
		const grid = { width: 3, height: 3 };

		// Act
		const route = findRoute({
			grid,
			from: { x: 0, y: 0 },
			to: { x: 2, y: 2 },
			blocked: noBlockedTiles,
		});

		// Assert
		expect(route).toEqual([
			{ x: 0, y: 0 },
			{ x: 1, y: 0 },
			{ x: 2, y: 0 },
			{ x: 2, y: 1 },
			{ x: 2, y: 2 },
		]);
	});
});

describe("When the route is computed around blocked tiles", () => {
	describe("given a full-height wall with one gap", () => {
		const { grid, spawn, exit } = createInitialState();
		const gap = { x: 15, y: 3 };
		const wall = columnExcept({ x: gap.x, height: grid.height, gapY: gap.y });
		const blocked = blockedSet(wall);

		it("should pass through the gap", () => {
			// Act
			const route = findRoute({ grid, from: spawn, to: exit, blocked });

			// Assert
			expect(route).toContainEqual(gap);
		});

		it("should never enter a blocked tile", () => {
			// Act
			const route = findRoute({ grid, from: spawn, to: exit, blocked });

			// Assert
			expect(route?.filter((tile) => blocked.has(tileKey(tile)))).toEqual([]);
		});

		it("should be the shortest available length", () => {
			// Act
			const route = findRoute({ grid, from: spawn, to: exit, blocked });

			// Assert
			const detourUpAndBack = 2 * Math.abs(spawn.y - gap.y);
			expect(route).toHaveLength(30 + detourUpAndBack);
		});
	});

	describe("given a wall that fully cuts the spawn from the exit", () => {
		it("should return null", () => {
			// Arrange
			const { grid, spawn, exit } = createInitialState();
			const blocked = blockedSet(
				columnExcept({ x: 15, height: grid.height, gapY: -1 }),
			);

			// Act
			const route = findRoute({ grid, from: spawn, to: exit, blocked });

			// Assert
			expect(route).toBeNull();
		});
	});
});

describe("When the distance-to-exit field is computed", () => {
	describe("given an open 3 by 3 grid with the exit in a corner", () => {
		it("should give 0 at the exit and the step count everywhere else", () => {
			// Arrange
			const grid = { width: 3, height: 3 };

			// Act
			const field = distanceField({
				grid,
				to: { x: 2, y: 2 },
				blocked: noBlockedTiles,
			});

			// Assert
			expect(field).toEqual([
				[4, 3, 2],
				[3, 2, 1],
				[2, 1, 0],
			]);
		});
	});

	describe("given a blocked tile and a pocket it seals off", () => {
		it("should mark the blocked and cut-off tiles unreachable", () => {
			// Arrange
			const grid = { width: 3, height: 3 };
			const blocked = blockedSet([
				{ x: 1, y: 0 },
				{ x: 0, y: 1 },
			]);

			// Act
			const field = distanceField({ grid, to: { x: 2, y: 2 }, blocked });

			// Assert
			expect(field).toEqual([
				[UNREACHABLE, UNREACHABLE, 2],
				[UNREACHABLE, 2, 1],
				[2, 1, 0],
			]);
		});
	});
});
