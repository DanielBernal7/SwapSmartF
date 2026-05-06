import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@swapsmart/recent_swaps";
const MAX = 8;

export type RecentSwap = {
	id: string;
	savedAt: number;
	scanTimes: number[];
	original: {
		name: string;
		brand: string | null;
		sugar: number | null;
	};
	swap: {
		foodId: string | null;
		name: string;
		brand: string | null;
		sugar: number | null;
	};
};

export async function saveSwap(entry: Omit<RecentSwap, "id" | "savedAt" | "scanTimes">): Promise<void> {
	try {
		const existing = await loadSwaps();
		const now = Date.now();
		const latest = existing[0];
		let updated: RecentSwap[];
		if (latest && latest.original.name === entry.original.name && latest.swap.name === entry.swap.name) {
			const refreshed: RecentSwap = {
				...latest,
				savedAt: now,
				scanTimes: [now, ...(latest.scanTimes ?? [latest.savedAt])],
			};
			updated = [refreshed, ...existing.slice(1)].slice(0, MAX);
		} else {
			const next: RecentSwap = {
				...entry,
				id: Math.random().toString(36).slice(2),
				savedAt: now,
				scanTimes: [now],
			};
			updated = [next, ...existing].slice(0, MAX);
		}
		await AsyncStorage.setItem(KEY, JSON.stringify(updated));
	} catch {}
}

export async function clearSwaps(): Promise<void> {
	try {
		await AsyncStorage.removeItem(KEY);
	} catch {}
}

export async function loadSwaps(): Promise<RecentSwap[]> {
	try {
		const raw = await AsyncStorage.getItem(KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as RecentSwap[];
		return parsed.map((e) => ({ ...e, scanTimes: e.scanTimes ?? [e.savedAt] }));
	} catch {
		return [];
	}
}
