import { describe, expect, it } from "vitest";
import { findRoute, tileKey } from "./pathfinding";
import {
	blockedTiles,
	canPlaceTower,
	placeTower,
	towerFootprint,
} from "./placement";
import {
	createInitialState,
	type GameState,
	type Tile,
	TOWER_COST,
} from "./state";

const OFF_BOARD_REASON =
	"Not enough room here. A tower needs a 2×2 space inside the board.";
const SPAWN_OR_EXIT_REASON =
	"Towers can't cover the spawn or the exit. Pick another spot.";
const OVERLAP_REASON =
	"That spot overlaps another tower. Pick an empty 2×2 space.";
const ROUTE_REASON =
	"That would block the only route from spawn to exit. Leave a gap.";

const onTheStraightRoute: Tile = { x: 10, y: 9 };

function stateWithTowers(params: {
	anchors: Tile[];
	money?: number;
}): GameState {
	const initial = createInitialState();
	return {
		...initial,
		towers: params.anchors.map((anchor, index) => ({
			id: initial.nextId + index,
			anchor,
		})),
		nextId: initial.nextId + params.anchors.length,
		money: params.money ?? 1000,
	};
}

// Towers stacked down column 10 from the top, leaving only rows 18–19 open.
function wallWithGapAtBottom(): Tile[] {
	return Array.from({ length: 9 }, (_, i) => ({ x: 10, y: i * 2 }));
}

function snapshot(state: GameState) {
	return {
		towers: structuredClone(state.towers),
		money: state.money,
		nextId: state.nextId,
	};
}

describe("When a tower is placed at a legal anchor on a fresh game", () => {
	it("should report success", () => {
		// Arrange
		const state = createInitialState();

		// Act
		const result = placeTower({ state, anchor: onTheStraightRoute });

		// Assert
		expect(result).toEqual({ ok: true });
	});

	it("should append one tower record at that anchor", () => {
		// Arrange
		const state = createInitialState();
		const firstId = state.nextId;

		// Act
		placeTower({ state, anchor: onTheStraightRoute });

		// Assert
		expect(state.towers).toEqual([{ id: firstId, anchor: onTheStraightRoute }]);
	});

	it("should deduct the tower cost from the money", () => {
		// Arrange
		const state = createInitialState();
		const startingMoney = state.money;

		// Act
		placeTower({ state, anchor: onTheStraightRoute });

		// Assert
		expect(state.money).toBe(startingMoney - TOWER_COST);
	});

	it("should block all four footprint tiles", () => {
		// Arrange
		const state = createInitialState();

		// Act
		placeTower({ state, anchor: onTheStraightRoute });

		// Assert
		expect([...blockedTiles(state)].sort()).toEqual(
			["10,9", "11,9", "10,10", "11,10"].sort(),
		);
	});
});

describe("When a tower footprint is computed", () => {
	it("should cover the anchor and the tiles to its right and below", () => {
		// Act
		const footprint = towerFootprint({ x: 3, y: 4 });

		// Assert
		expect(footprint).toEqual([
			{ x: 3, y: 4 },
			{ x: 4, y: 4 },
			{ x: 3, y: 5 },
			{ x: 4, y: 5 },
		]);
	});
});

describe("When a tower is placed across the straight spawn-to-exit row", () => {
	function routeAfterPlacing(): Tile[] | null {
		const state = createInitialState();
		placeTower({ state, anchor: onTheStraightRoute });
		return findRoute({
			grid: state.grid,
			from: state.spawn,
			to: state.exit,
			blocked: blockedTiles(state),
		});
	}

	it("should route around every footprint tile", () => {
		// Arrange
		const footprintKeys = towerFootprint(onTheStraightRoute).map(tileKey);

		// Act
		const route = routeAfterPlacing();

		// Assert
		const coveredFootprintTiles = (route ?? [])
			.map(tileKey)
			.filter((key) => footprintKeys.includes(key));
		expect(route).not.toBeNull();
		expect(coveredFootprintTiles).toEqual([]);
	});

	it("should be longer than the 30-tile straight route", () => {
		// Act
		const route = routeAfterPlacing();

		// Assert
		expect(route?.length).toBeGreaterThan(30);
	});
});

describe("When a placement is refused", () => {
	const refusals: {
		name: string;
		state: () => GameState;
		anchor: Tile;
		reason: string;
	}[] = [
		{
			name: "the anchor is in the last column",
			state: () => createInitialState(),
			anchor: { x: 29, y: 4 },
			reason: OFF_BOARD_REASON,
		},
		{
			name: "the anchor is in the last row",
			state: () => createInitialState(),
			anchor: { x: 4, y: 19 },
			reason: OFF_BOARD_REASON,
		},
		{
			name: "the footprint covers the spawn",
			state: () => createInitialState(),
			anchor: { x: 0, y: 9 },
			reason: SPAWN_OR_EXIT_REASON,
		},
		{
			name: "the footprint covers the exit",
			state: () => createInitialState(),
			anchor: { x: 28, y: 10 },
			reason: SPAWN_OR_EXIT_REASON,
		},
		{
			name: "the footprint lands exactly on an existing tower",
			state: () => stateWithTowers({ anchors: [{ x: 5, y: 5 }] }),
			anchor: { x: 5, y: 5 },
			reason: OVERLAP_REASON,
		},
		{
			name: "the footprint is offset one tile right of an existing tower",
			state: () => stateWithTowers({ anchors: [{ x: 5, y: 5 }] }),
			anchor: { x: 6, y: 5 },
			reason: OVERLAP_REASON,
		},
		{
			name: "the footprint is offset one tile diagonally up-left of an existing tower",
			state: () => stateWithTowers({ anchors: [{ x: 5, y: 5 }] }),
			anchor: { x: 4, y: 4 },
			reason: OVERLAP_REASON,
		},
		{
			name: "the player has less money than a tower costs",
			state: () => stateWithTowers({ anchors: [], money: 5 }),
			anchor: onTheStraightRoute,
			reason: `Not enough money. A tower costs ${TOWER_COST} and you have 5.`,
		},
		{
			name: "the tower would complete a wall across the board",
			state: () => stateWithTowers({ anchors: wallWithGapAtBottom() }),
			anchor: { x: 10, y: 18 },
			reason: ROUTE_REASON,
		},
	];

	for (const refusal of refusals) {
		describe(`Given ${refusal.name}`, () => {
			it("should return the matching reason", () => {
				// Arrange
				const state = refusal.state();

				// Act
				const result = placeTower({ state, anchor: refusal.anchor });

				// Assert
				expect(result).toEqual({ ok: false, reason: refusal.reason });
			});

			it("should leave towers, money and next id unchanged", () => {
				// Arrange
				const state = refusal.state();
				const before = snapshot(state);

				// Act
				placeTower({ state, anchor: refusal.anchor });

				// Assert
				expect(snapshot(state)).toEqual(before);
			});
		});
	}
});

describe("When several refusals apply at once", () => {
	const brokeAndWalled = () =>
		stateWithTowers({
			anchors: [...wallWithGapAtBottom(), { x: 20, y: 4 }],
			money: 0,
		});

	it("should report off-board before funds", () => {
		// Arrange
		const state = brokeAndWalled();

		// Act
		const result = placeTower({ state, anchor: { x: 29, y: 0 } });

		// Assert
		expect(result).toEqual({ ok: false, reason: OFF_BOARD_REASON });
	});

	it("should report off-board before spawn or exit", () => {
		// Arrange
		const state = brokeAndWalled();

		// Act
		const result = placeTower({ state, anchor: { x: 29, y: 10 } });

		// Assert
		expect(result).toEqual({ ok: false, reason: OFF_BOARD_REASON });
	});

	it("should report spawn or exit before overlap and funds", () => {
		// Arrange
		const state = stateWithTowers({ anchors: [{ x: 1, y: 8 }], money: 0 });

		// Act
		const result = placeTower({ state, anchor: { x: 0, y: 9 } });

		// Assert
		expect(result).toEqual({ ok: false, reason: SPAWN_OR_EXIT_REASON });
	});

	it("should report overlap before funds", () => {
		// Arrange
		const state = brokeAndWalled();

		// Act
		const result = placeTower({ state, anchor: { x: 21, y: 5 } });

		// Assert
		expect(result).toEqual({ ok: false, reason: OVERLAP_REASON });
	});

	it("should report funds before a sealed route", () => {
		// Arrange
		const state = brokeAndWalled();

		// Act
		const result = placeTower({ state, anchor: { x: 10, y: 18 } });

		// Assert
		expect(result).toEqual({
			ok: false,
			reason: `Not enough money. A tower costs ${TOWER_COST} and you have 0.`,
		});
	});
});

describe("When placement is checked without placing", () => {
	const anchors: Tile[] = [
		onTheStraightRoute,
		{ x: 29, y: 4 },
		{ x: 0, y: 9 },
		{ x: 6, y: 5 },
		{ x: 10, y: 18 },
	];

	for (const anchor of anchors) {
		describe(`Given the anchor ${tileKey(anchor)}`, () => {
			const state = () =>
				stateWithTowers({
					anchors: [{ x: 5, y: 5 }, ...wallWithGapAtBottom()],
				});

			it("should return what placing would return", () => {
				// Arrange
				const checked = state();
				const placed = state();

				// Act
				const result = canPlaceTower({ state: checked, anchor });

				// Assert
				expect(result).toEqual(placeTower({ state: placed, anchor }));
			});

			it("should not change the state", () => {
				// Arrange
				const checked = state();
				const before = structuredClone(checked);

				// Act
				canPlaceTower({ state: checked, anchor });

				// Assert
				expect(checked).toEqual(before);
			});
		});
	}
});

describe("When several towers are placed", () => {
	it("should take each id from next id and advance it", () => {
		// Arrange
		const state = stateWithTowers({ anchors: [] });
		const firstId = state.nextId;
		placeTower({ state, anchor: { x: 2, y: 2 } });
		placeTower({ state, anchor: { x: 6, y: 2 } });

		// Act
		placeTower({ state, anchor: { x: 10, y: 2 } });

		// Assert
		expect(state.towers.map((tower) => tower.id)).toEqual([
			firstId,
			firstId + 1,
			firstId + 2,
		]);
		expect(state.nextId).toBe(firstId + 3);
	});

	it("should not hand out an id again after a refused placement", () => {
		// Arrange
		const state = stateWithTowers({ anchors: [] });
		placeTower({ state, anchor: { x: 2, y: 2 } });
		placeTower({ state, anchor: { x: 2, y: 2 } });

		// Act
		placeTower({ state, anchor: { x: 6, y: 2 } });

		// Assert
		const ids = state.towers.map((tower) => tower.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("should take ids from next id even when it has moved past earlier towers", () => {
		// Arrange
		const state = stateWithTowers({ anchors: [{ x: 2, y: 2 }] });
		const existingId = state.towers[0]?.id;
		state.nextId = 42;

		// Act
		placeTower({ state, anchor: { x: 6, y: 2 } });

		// Assert
		expect(state.towers.map((tower) => tower.id)).toEqual([existingId, 42]);
		expect(state.nextId).toBe(43);
	});
});
