import { describe, expect, it } from "vitest";

const gameSources = import.meta.glob<string>("./**/*.ts", {
	query: "?raw",
	import: "default",
	eager: true,
});

const reactOrDomUsage = /from\s+["']react|\bdocument\.|\bwindow\./;

describe("When the simulation core sources are scanned", () => {
	it("should find the state and pathfinding modules", () => {
		// Act
		const paths = Object.keys(gameSources);

		// Assert
		expect(paths).toEqual(
			expect.arrayContaining(["./state.ts", "./pathfinding.ts"]),
		);
	});

	it("should find no React or DOM usage", () => {
		// Act
		const offenders = Object.entries(gameSources)
			.filter(([, source]) => reactOrDomUsage.test(source))
			.map(([path]) => path);

		// Assert
		expect(offenders).toEqual([]);
	});
});
