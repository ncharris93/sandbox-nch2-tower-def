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
}

const GRID_WIDTH = 30;
const GRID_HEIGHT = 20;
const ENTRY_ROW = 10;

export function createInitialState(): GameState {
	return {
		grid: { width: GRID_WIDTH, height: GRID_HEIGHT },
		spawn: { x: 0, y: ENTRY_ROW },
		exit: { x: GRID_WIDTH - 1, y: ENTRY_ROW },
		towers: [],
		enemies: [],
	};
}
