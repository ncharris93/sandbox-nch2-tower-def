import { useMemo, useState } from "react";
import { nextAnnouncement } from "./announcement";
import { findRoute } from "./game/pathfinding";
import { blockedTiles, placeTower } from "./game/placement";
import { createInitialState, type Tile } from "./game/state";
import { Board } from "./render/Board";

const PLACEMENT_HINT = "Click the board to place a tower.";
const TOWER_PLACED = "Tower placed.";

export function App() {
	const [gameState, setGameState] = useState(createInitialState);
	const [status, setStatus] = useState({
		message: PLACEMENT_HINT,
		sequence: 0,
	});
	const route = useMemo(
		() =>
			findRoute({
				grid: gameState.grid,
				from: gameState.spawn,
				to: gameState.exit,
				blocked: blockedTiles(gameState),
			}),
		[gameState],
	);

	function handleTileClick(anchor: Tile) {
		// placeTower mutates on success, so it works on a copy that React sees as new state.
		const nextState = structuredClone(gameState);
		const result = placeTower({ state: nextState, anchor });
		if (!result.ok) {
			setStatus((previous) => nextAnnouncement(previous, result.reason));
			return;
		}
		setGameState(nextState);
		setStatus((previous) => nextAnnouncement(previous, TOWER_PLACED));
	}

	return (
		<main>
			<p>Money: {gameState.money}</p>
			<Board state={gameState} route={route} onTileClick={handleTileClick} />
			<p role="status">
				<span key={status.sequence}>{status.message}</span>
			</p>
		</main>
	);
}
