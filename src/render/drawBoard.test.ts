import { describe, expect, it } from "vitest";
import { createInitialState } from "../game/state";
import { TILE_SIZE, tileFromPoint } from "./drawBoard";

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
