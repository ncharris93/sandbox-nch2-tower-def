import { findRoute } from "./game/pathfinding";
import { createInitialState } from "./game/state";
import { Board } from "./render/Board";

const initialState = createInitialState();
const initialRoute = findRoute({
	grid: initialState.grid,
	from: initialState.spawn,
	to: initialState.exit,
	blocked: new Set(),
});

export function App() {
	return (
		<main>
			<Board state={initialState} route={initialRoute} />
		</main>
	);
}
