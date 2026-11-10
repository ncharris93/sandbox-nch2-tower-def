import { describe, expect, it } from "vitest";
import { type Announcement, nextAnnouncement } from "./announcement";

const TOWER_PLACED = "Tower placed.";

describe("When the same placement outcome is announced twice in a row", () => {
	it("should produce a distinct announcement carrying the same message", () => {
		// Arrange
		const initial: Announcement = { message: "Click the board.", sequence: 0 };
		const first = nextAnnouncement(initial, TOWER_PLACED);

		// Act
		const repeated = nextAnnouncement(first, TOWER_PLACED);

		// Assert
		expect(repeated.message).toBe(TOWER_PLACED);
		expect(repeated).not.toEqual(first);
	});
});
