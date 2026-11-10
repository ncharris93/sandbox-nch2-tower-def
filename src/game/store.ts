import { type PlacementResult, placeTower } from "./placement";
import { advance, isWaveActive, startTestWave } from "./sim";
import { createInitialState, type GameState, type Tile } from "./state";

export interface GameStore {
	getSnapshot: () => GameState;
	subscribe: (listener: () => void) => () => void;
	placeTower: (anchor: Tile) => PlacementResult;
	startWave: () => void;
	togglePause: () => void;
	advance: (elapsedMs: number) => void;
}

/**
 * Holds the one live game state for `useSyncExternalStore`. Every write applies to a clone of
 * the latest state, so a click and a tick can never overwrite each other's progress.
 */
export function createGameStore(): GameStore {
	let state = createInitialState();
	const listeners = new Set<() => void>();

	function publish(next: GameState): void {
		state = next;
		for (const listener of listeners) listener();
	}

	function write(apply: (draft: GameState) => void): void {
		const draft = structuredClone(state);
		apply(draft);
		publish(draft);
	}

	return {
		getSnapshot: () => state,
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		placeTower(anchor) {
			const draft = structuredClone(state);
			const result = placeTower({ state: draft, anchor });
			if (result.ok) publish(draft);
			return result;
		},
		startWave: () => write(startTestWave),
		togglePause: () =>
			write((draft) => {
				draft.paused = !draft.paused;
			}),
		advance(elapsedMs) {
			// Called every animation frame: publishing an unchanged sim would redraw at 60 Hz for nothing.
			if (state.paused || !isWaveActive(state)) return;

			write((draft) => advance({ state: draft, elapsedMs }));
		},
	};
}
