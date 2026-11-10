import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { nextAnnouncement } from "./announcement";
import { findRoute } from "./game/pathfinding";
import { blockedTiles } from "./game/placement";
import { isWaveActive } from "./game/sim";
import type { Tile } from "./game/state";
import { createGameStore } from "./game/store";
import { Board } from "./render/Board";

const PLACEMENT_HINT = "Click the board to place a tower.";
const TOWER_PLACED = "Tower placed.";
const WAVE_STARTED =
	"Wave started. Building is paused until every enemy has left the board.";
const WAVE_CLEARED = "Wave cleared. You can build again.";

export function App() {
	const [store] = useState(createGameStore);
	const gameState = useSyncExternalStore(store.subscribe, store.getSnapshot);
	const [status, setStatus] = useState({
		message: PLACEMENT_HINT,
		sequence: 0,
	});
	const towerLayout = gameState.towers.map((tower) => tower.id).join();
	// biome-ignore lint/correctness/useExhaustiveDependencies: every write clones the state, but only the towers move the route; tower ids are never reused, so the id list names the layout
	const route = useMemo(
		() =>
			findRoute({
				grid: gameState.grid,
				from: gameState.spawn,
				to: gameState.exit,
				blocked: blockedTiles(gameState),
			}),
		[towerLayout],
	);
	const waveActive = isWaveActive(gameState);

	useEffect(() => {
		let frameId = 0;
		let lastFrameAt = performance.now();

		function tick(now: number) {
			const wasWaveActive = isWaveActive(store.getSnapshot());
			store.advance(now - lastFrameAt);
			lastFrameAt = now;
			if (wasWaveActive && !isWaveActive(store.getSnapshot())) {
				setStatus((previous) => nextAnnouncement(previous, WAVE_CLEARED));
			}
			frameId = requestAnimationFrame(tick);
		}

		frameId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frameId);
	}, [store]);

	function handleTileClick(anchor: Tile) {
		const result = store.placeTower(anchor);
		const message = result.ok ? TOWER_PLACED : result.reason;
		setStatus((previous) => nextAnnouncement(previous, message));
	}

	function handleStartWave() {
		store.startWave();
		setStatus((previous) => nextAnnouncement(previous, WAVE_STARTED));
	}

	return (
		<main>
			<p>Money: {gameState.money}</p>
			<p>
				<button type="button" onClick={handleStartWave} disabled={waveActive}>
					Start Wave
				</button>{" "}
				<button type="button" onClick={store.togglePause}>
					{gameState.paused ? "Resume" : "Pause"}
				</button>{" "}
				{gameState.paused && <strong>Paused</strong>}
			</p>
			<Board state={gameState} route={route} onTileClick={handleTileClick} />
			<p role="status">
				<span key={status.sequence}>{status.message}</span>
			</p>
		</main>
	);
}
