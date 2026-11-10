export interface Tile {
	x: number;
	y: number;
}

export interface Grid {
	width: number;
	height: number;
}

export interface Tower {
	id: number;
	/** Top-left tile of the 2×2 footprint. */
	anchor: Tile;
}

export interface Enemy {
	id: number;
}

export interface GameState {
	grid: Grid;
	spawn: Tile;
	exit: Tile;
	towers: Tower[];
	enemies: Enemy[];
	money: number;
	/** Next record id to hand out; ids are never reused. */
	nextId: number;
}

const GRID_WIDTH = 30;
const GRID_HEIGHT = 20;
const ENTRY_ROW = 10;

export const STARTING_MONEY = 30;
export const TOWER_COST = 10;

export function createInitialState(): GameState {
	return {
		grid: { width: GRID_WIDTH, height: GRID_HEIGHT },
		spawn: { x: 0, y: ENTRY_ROW },
		exit: { x: GRID_WIDTH - 1, y: ENTRY_ROW },
		towers: [],
		enemies: [],
		money: STARTING_MONEY,
		nextId: 1,
	};
}
