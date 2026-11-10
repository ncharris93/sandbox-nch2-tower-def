import type { GameState, Tile, Tower } from "../game/state";

export const TILE_SIZE = 28;

const BOARD_COLORS = {
	background: "#0f172a",
	gridLine: "#1e293b",
	route: "#38bdf8",
	spawn: "#4ade80",
	exit: "#f87171",
	tower: "#fbbf24",
	label: "#f8fafc",
} as const;

const LABEL_FONT = "600 13px system-ui, sans-serif";
const LABEL_GAP = 6;

export function tileFromPoint(point: { x: number; y: number }): Tile {
	return {
		x: Math.floor(point.x / TILE_SIZE),
		y: Math.floor(point.y / TILE_SIZE),
	};
}

function tileCenter(tile: Tile): { x: number; y: number } {
	return {
		x: tile.x * TILE_SIZE + TILE_SIZE / 2,
		y: tile.y * TILE_SIZE + TILE_SIZE / 2,
	};
}

function drawGrid(ctx: CanvasRenderingContext2D, state: GameState): void {
	const width = state.grid.width * TILE_SIZE;
	const height = state.grid.height * TILE_SIZE;
	ctx.fillStyle = BOARD_COLORS.background;
	ctx.fillRect(0, 0, width, height);

	ctx.strokeStyle = BOARD_COLORS.gridLine;
	ctx.lineWidth = 1;
	ctx.beginPath();
	// Half-pixel offsets keep 1px lines crisp instead of blurring across two pixels.
	for (let column = 0; column <= state.grid.width; column++) {
		ctx.moveTo(column * TILE_SIZE + 0.5, 0);
		ctx.lineTo(column * TILE_SIZE + 0.5, height);
	}
	for (let row = 0; row <= state.grid.height; row++) {
		ctx.moveTo(0, row * TILE_SIZE + 0.5);
		ctx.lineTo(width, row * TILE_SIZE + 0.5);
	}
	ctx.stroke();
}

function drawRoute(ctx: CanvasRenderingContext2D, route: Tile[]): void {
	const [first, ...rest] = route.map(tileCenter);
	if (!first) return;

	ctx.strokeStyle = BOARD_COLORS.route;
	ctx.lineWidth = 4;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	ctx.beginPath();
	ctx.moveTo(first.x, first.y);
	for (const point of rest) ctx.lineTo(point.x, point.y);
	ctx.stroke();
}

function drawTowers(ctx: CanvasRenderingContext2D, towers: Tower[]): void {
	ctx.fillStyle = BOARD_COLORS.tower;
	for (const { anchor } of towers) {
		ctx.fillRect(
			anchor.x * TILE_SIZE + 2,
			anchor.y * TILE_SIZE + 2,
			2 * TILE_SIZE - 3,
			2 * TILE_SIZE - 3,
		);
	}
}

function drawMarker(
	ctx: CanvasRenderingContext2D,
	marker: { tile: Tile; color: string; label: string; align: CanvasTextAlign },
): void {
	const { tile, color, label, align } = marker;
	ctx.fillStyle = color;
	ctx.fillRect(
		tile.x * TILE_SIZE + 2,
		tile.y * TILE_SIZE + 2,
		TILE_SIZE - 3,
		TILE_SIZE - 3,
	);

	const labelX =
		align === "left" ? tile.x * TILE_SIZE : (tile.x + 1) * TILE_SIZE;
	ctx.fillStyle = BOARD_COLORS.label;
	ctx.font = LABEL_FONT;
	ctx.textAlign = align;
	ctx.textBaseline = "bottom";
	ctx.fillText(label, labelX, tile.y * TILE_SIZE - LABEL_GAP);
}

export function drawBoard(
	ctx: CanvasRenderingContext2D,
	board: { state: GameState; route: Tile[] | null },
): void {
	const { state, route } = board;
	drawGrid(ctx, state);
	if (route) drawRoute(ctx, route);
	drawTowers(ctx, state.towers);
	drawMarker(ctx, {
		tile: state.spawn,
		color: BOARD_COLORS.spawn,
		label: "Spawn",
		align: "left",
	});
	drawMarker(ctx, {
		tile: state.exit,
		color: BOARD_COLORS.exit,
		label: "Exit",
		align: "right",
	});
}
