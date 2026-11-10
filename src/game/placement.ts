import { findRoute, tileKey } from "./pathfinding";
import { isWaveActive } from "./sim";
import { type GameState, type Tile, TOWER_COST } from "./state";

export type PlacementResult = { ok: true } | { ok: false; reason: string };

const WAVE_ACTIVE_REASON =
	"Building is paused while enemies are on the board. It resumes when the wave ends.";
const OFF_BOARD_REASON =
	"Not enough room here. A tower needs a 2×2 space inside the board.";
const SPAWN_OR_EXIT_REASON =
	"Towers can't cover the spawn or the exit. Pick another spot.";
const OVERLAP_REASON =
	"That spot overlaps another tower. Pick an empty 2×2 space.";
const ROUTE_REASON =
	"That would block the only route from spawn to exit. Leave a gap.";

function notEnoughMoneyReason(money: number): string {
	return `Not enough money. A tower costs ${TOWER_COST} and you have ${money}.`;
}

export function towerFootprint(anchor: Tile): Tile[] {
	return [
		anchor,
		{ x: anchor.x + 1, y: anchor.y },
		{ x: anchor.x, y: anchor.y + 1 },
		{ x: anchor.x + 1, y: anchor.y + 1 },
	];
}

export function blockedTiles(state: GameState): ReadonlySet<string> {
	return new Set(
		state.towers.flatMap((tower) => towerFootprint(tower.anchor).map(tileKey)),
	);
}

/** Reports the first failing rule in order: wave active, off-board, spawn/exit, overlap, funds, route. */
export function canPlaceTower(params: {
	state: GameState;
	anchor: Tile;
}): PlacementResult {
	const { state, anchor } = params;
	if (isWaveActive(state)) return { ok: false, reason: WAVE_ACTIVE_REASON };

	const { grid, spawn, exit } = state;
	const footprint = towerFootprint(anchor);
	const footprintKeys = footprint.map(tileKey);

	const isOnBoard = footprint.every(
		(tile) =>
			tile.x >= 0 && tile.y >= 0 && tile.x < grid.width && tile.y < grid.height,
	);
	if (!isOnBoard) return { ok: false, reason: OFF_BOARD_REASON };

	const coversSpawnOrExit =
		footprintKeys.includes(tileKey(spawn)) ||
		footprintKeys.includes(tileKey(exit));
	if (coversSpawnOrExit) return { ok: false, reason: SPAWN_OR_EXIT_REASON };

	const occupied = blockedTiles(state);
	if (footprintKeys.some((key) => occupied.has(key))) {
		return { ok: false, reason: OVERLAP_REASON };
	}

	if (state.money < TOWER_COST) {
		return { ok: false, reason: notEnoughMoneyReason(state.money) };
	}

	const route = findRoute({
		grid,
		from: spawn,
		to: exit,
		blocked: new Set([...occupied, ...footprintKeys]),
	});
	if (route === null) return { ok: false, reason: ROUTE_REASON };

	return { ok: true };
}

/** On success, mutates `state`: appends the tower, deducts `TOWER_COST` and advances `nextId`. */
export function placeTower(params: {
	state: GameState;
	anchor: Tile;
}): PlacementResult {
	const result = canPlaceTower(params);
	if (!result.ok) return result;

	const { state, anchor } = params;
	state.towers.push({ id: state.nextId, anchor });
	state.nextId += 1;
	state.money -= TOWER_COST;
	return result;
}
