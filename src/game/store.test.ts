import { describe, expect, it } from "vitest";
import type { Tile } from "./state";
import { createGameStore, type GameStore } from "./store";

const FRAME_MS = 100;
const openAnchor: Tile = { x: 10, y: 4 };

describe("When a tower is placed between two advances on an idle board", () => {
	it("should keep the tower after the second advance", () => {
		// Arrange
		const store = createGameStore();
		store.advance(FRAME_MS);
		store.placeTower(openAnchor);

		// Act
		store.advance(FRAME_MS);

		// Assert
		expect(store.getSnapshot().towers.map((tower) => tower.anchor)).toEqual([
			openAnchor,
		]);
	});
});

describe("When the game is paused and resumed between two advances mid-wave", () => {
	it("should keep the enemy progress made before the pause", () => {
		// Arrange
		const store = createGameStore();
		store.startWave();
		store.advance(FRAME_MS);
		const before = store.getSnapshot().enemies[0];
		store.togglePause();
		store.togglePause();

		// Act
		store.advance(FRAME_MS);

		// Assert
		const after = store.getSnapshot().enemies[0];
		expect(after?.progress).toBeGreaterThan(before?.progress ?? 1);
	});
});

describe("When a placement is attempted mid-wave", () => {
	it("should keep the enemy progress made before the attempt", () => {
		// Arrange
		const store = createGameStore();
		store.startWave();
		store.advance(FRAME_MS);
		const before = store.getSnapshot().enemies;

		// Act
		store.placeTower(openAnchor);

		// Assert
		expect(store.getSnapshot().enemies).toEqual(before);
	});
});

describe("When each kind of write is applied", () => {
	const writes = [
		{
			name: "a placement",
			apply: (store: GameStore) => {
				store.placeTower(openAnchor);
			},
		},
		{
			name: "a wave start",
			apply: (store: GameStore) => store.startWave(),
		},
		{
			name: "a pause toggle",
			apply: (store: GameStore) => store.togglePause(),
		},
	];

	for (const write of writes) {
		describe(`Given ${write.name}`, () => {
			it("should give the snapshot a new identity", () => {
				// Arrange
				const store = createGameStore();
				const before = store.getSnapshot();

				// Act
				write.apply(store);

				// Assert
				expect(store.getSnapshot()).not.toBe(before);
			});

			it("should notify every subscriber", () => {
				// Arrange
				const store = createGameStore();
				let notifications = 0;
				store.subscribe(() => {
					notifications += 1;
				});

				// Act
				write.apply(store);

				// Assert
				expect(notifications).toBe(1);
			});
		});
	}
});

describe("When the store advances mid-wave", () => {
	it("should give the snapshot a new identity", () => {
		// Arrange
		const store = createGameStore();
		store.startWave();
		const before = store.getSnapshot();

		// Act
		store.advance(FRAME_MS);

		// Assert
		expect(store.getSnapshot()).not.toBe(before);
	});

	it("should notify every subscriber", () => {
		// Arrange
		const store = createGameStore();
		store.startWave();
		let notifications = 0;
		store.subscribe(() => {
			notifications += 1;
		});

		// Act
		store.advance(FRAME_MS);

		// Assert
		expect(notifications).toBe(1);
	});
});

describe("When the store advances with nothing for the sim to do", () => {
	const idleBoards = [
		{ name: "an idle board", arrange: (_store: GameStore) => {} },
		{
			name: "a paused wave",
			arrange: (store: GameStore) => {
				store.startWave();
				store.togglePause();
			},
		},
	];

	for (const board of idleBoards) {
		describe(`Given ${board.name}`, () => {
			it("should keep the snapshot identity", () => {
				// Arrange
				const store = createGameStore();
				board.arrange(store);
				const before = store.getSnapshot();

				// Act
				store.advance(FRAME_MS);

				// Assert
				expect(store.getSnapshot()).toBe(before);
			});

			it("should not notify subscribers", () => {
				// Arrange
				const store = createGameStore();
				board.arrange(store);
				let notifications = 0;
				store.subscribe(() => {
					notifications += 1;
				});

				// Act
				store.advance(FRAME_MS);

				// Assert
				expect(notifications).toBe(0);
			});
		});
	}
});

describe("When a subscriber unsubscribes", () => {
	it("should no longer be notified of writes", () => {
		// Arrange
		const store = createGameStore();
		let notifications = 0;
		const unsubscribe = store.subscribe(() => {
			notifications += 1;
		});
		unsubscribe();

		// Act
		store.togglePause();

		// Assert
		expect(notifications).toBe(0);
	});
});

describe("When the game is paused through the store", () => {
	it("should report the game paused", () => {
		// Arrange
		const store = createGameStore();

		// Act
		store.togglePause();

		// Assert
		expect(store.getSnapshot().paused).toBe(true);
	});
});
