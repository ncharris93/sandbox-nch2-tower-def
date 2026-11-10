import { useEffect, useRef } from "react";
import type { GameState, Tile } from "../game/state";
import { drawBoard, TILE_SIZE } from "./drawBoard";

interface BoardProps {
	state: GameState;
	route: Tile[] | null;
}

export function Board({ state, route }: BoardProps) {
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

	return (
		<canvas
			ref={canvasRef}
			role="img"
			aria-label={`Game board, ${state.grid.width} by ${state.grid.height} tiles. Enemies walk from the spawn on the left to the exit on the right.`}
			style={{ width, height, display: "block" }}
		/>
	);
}
