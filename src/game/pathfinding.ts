import type { Grid, Tile } from "./state";

export const UNREACHABLE = -1;

/** Steps to the target per tile, indexed `[y][x]`; blocked and cut-off tiles hold `UNREACHABLE`. */
export type DistanceField = number[][];

// The fixed order is the determinism tie-break: among equally short moves, the first listed wins.
const NEIGHBOR_OFFSETS: readonly Tile[] = [
	{ x: 0, y: -1 },
	{ x: 1, y: 0 },
	{ x: 0, y: 1 },
	{ x: -1, y: 0 },
];

export function tileKey(tile: Tile): string {
	return `${tile.x},${tile.y}`;
}

function isInside(grid: Grid, tile: Tile): boolean {
	return (
		tile.x >= 0 && tile.y >= 0 && tile.x < grid.width && tile.y < grid.height
	);
}

function neighbors(grid: Grid, tile: Tile): Tile[] {
	return NEIGHBOR_OFFSETS.map((offset) => ({
		x: tile.x + offset.x,
		y: tile.y + offset.y,
	})).filter((neighbor) => isInside(grid, neighbor));
}

function distanceAt(field: DistanceField, tile: Tile): number {
	return field[tile.y]?.[tile.x] ?? UNREACHABLE;
}

function setDistance(field: DistanceField, tile: Tile, distance: number): void {
	(field[tile.y] as number[])[tile.x] = distance;
}

export function distanceField(params: {
	grid: Grid;
	to: Tile;
	blocked: ReadonlySet<string>;
}): DistanceField {
	const { grid, to, blocked } = params;
	const field: DistanceField = Array.from({ length: grid.height }, () =>
		Array<number>(grid.width).fill(UNREACHABLE),
	);
	if (blocked.has(tileKey(to))) return field;

	const queue: Tile[] = [to];
	setDistance(field, to, 0);
	for (let head = 0; head < queue.length; head++) {
		const current = queue[head] as Tile;
		const nextDistance = distanceAt(field, current) + 1;
		for (const neighbor of neighbors(grid, current)) {
			if (blocked.has(tileKey(neighbor))) continue;
			if (distanceAt(field, neighbor) !== UNREACHABLE) continue;
			setDistance(field, neighbor, nextDistance);
			queue.push(neighbor);
		}
	}
	return field;
}

/** First neighbor one step closer to the field's target, or `null` at the target or when cut off. */
export function nextStep(params: {
	grid: Grid;
	field: DistanceField;
	from: Tile;
}): Tile | null {
	const { grid, field, from } = params;
	const distance = distanceAt(field, from);
	if (distance === UNREACHABLE || distance === 0) return null;

	return (
		neighbors(grid, from).find(
			(neighbor) => distanceAt(field, neighbor) === distance - 1,
		) ?? null
	);
}

/** Shortest 4-directional route including both ends, or `null` when `to` cannot be reached. */
export function findRoute(params: {
	grid: Grid;
	from: Tile;
	to: Tile;
	blocked: ReadonlySet<string>;
}): Tile[] | null {
	const { grid, from, to, blocked } = params;
	const field = distanceField({ grid, to, blocked });
	if (distanceAt(field, from) === UNREACHABLE) return null;

	const route: Tile[] = [from];
	for (
		let current = nextStep({ grid, field, from });
		current !== null;
		current = nextStep({ grid, field, from: current })
	) {
		route.push(current);
	}
	return route;
}
