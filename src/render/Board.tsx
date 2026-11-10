import { type MouseEvent, useEffect, useRef } from "react";
import type { GameState, Tile } from "../game/state";
import { drawBoard, TILE_SIZE, tileFromPoint } from "./drawBoard";

interface BoardProps {
	state: GameState;
	route: Tile[] | null;
	onTileClick: (tile: Tile) => void;
}

export function Board({ state, route, onTileClick }: BoardProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const width = state.grid.width * TILE_SIZE;
	const height = state.grid.height * TILE_SIZE;

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		// Back the canvas at device resolution so lines and labels stay sharp on high-DPI screens.
		const pixelRatio = window.devicePixelRatio;
		canvas.width = width * pixelRatio;
		canvas.height = height * pixelRatio;
		ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
		drawBoard(ctx, { state, route });
	}, [state, route, width, height]);

	function handleClick(event: MouseEvent<HTMLCanvasElement>) {
		const bounds = event.currentTarget.getBoundingClientRect();
		onTileClick(
			tileFromPoint({
				x: event.clientX - bounds.left,
				y: event.clientY - bounds.top,
			}),
		);
	}

	return (
		<canvas
			ref={canvasRef}
			onClick={handleClick}
			role="img"
			aria-label={`Game board, ${state.grid.width} by ${state.grid.height} tiles. Enemies walk from the spawn on the left to the exit on the right.`}
			style={{ width, height, display: "block" }}
		/>
	);
}
