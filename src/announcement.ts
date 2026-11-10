// Screen readers only announce a live region when its content changes, so a repeated
// message needs a fresh sequence to re-render as a new node.
export interface Announcement {
	message: string;
	sequence: number;
}

export function nextAnnouncement(
	previous: Announcement,
	message: string,
): Announcement {
	return { message, sequence: previous.sequence + 1 };
}
