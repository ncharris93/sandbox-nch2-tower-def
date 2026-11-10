import { describe, expect, it } from "vitest";
import { createInitialState } from "../game/state";
import { enemyCenter, TILE_SIZE, tileFromPoint } from "./drawBoard";

describe("When a canvas-local point is mapped to a tile", () => {
	const { grid } = createInitialState();
	const cases = [
		{ point: { x: 0, y: 0 }, tile: { x: 0, y: 0 } },
		{ point: { x: 27, y: 27 }, tile: { x: 0, y: 0 } },
		{ point: { x: 28, y: 0 }, tile: { x: 1, y: 0 } },
		{
			point: { x: grid.width * TILE_SIZE - 1, y: grid.height * TILE_SIZE - 1 },
			tile: { x: 29, y: 19 },
		},
	];

	for (const { point, tile } of cases) {
		it(`should map (${point.x},${point.y}) to tile (${tile.x},${tile.y})`, () => {
			// Act
			const result = tileFromPoint(point);

			// Assert
			expect(result).toEqual(tile);
		});
	}
});

describe("When an enemy is placed on the board for drawing", () => {
	const cases = [
		{ progress: 0, center: { x: 3 * TILE_SIZE + 14, y: 5 * TILE_SIZE + 14 } },
		{
			progress: 0.5,
			center: { x: 3.5 * TILE_SIZE + 14, y: 5 * TILE_SIZE + 14 },
		},
		{ progress: 1, center: { x: 4 * TILE_SIZE + 14, y: 5 * TILE_SIZE + 14 } },
	];

	for (const { progress, center } of cases) {
		it(`should sit ${progress * 100}% of the way from its tile to its next tile`, () => {
			// Arrange
			const enemy = {
				id: 1,
				tile: { x: 3, y: 5 },
				next: { x: 4, y: 5 },
				progress,
			};

			// Act
			const result = enemyCenter(enemy);

			// Assert
			expect(result).toEqual(center);
		});
	}
});
