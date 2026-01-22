/* =============================================================================
   Shared Schedule Store — schedule-store.js
   Provides an abstraction for parsing, storing, and selecting schedules
   Used by both Game Card Factory and Lineup Card Factory
============================================================================= */

import {
	normalizeGameObject
} from "./parser-utils.js";

// Key used in localStorage
const STORAGE_KEY = "savedSchedules";

function loadAllSchedules() {
	try {
		const json = localStorage.getItem(STORAGE_KEY) || "[]";
		const list = JSON.parse(json);
		return Array.isArray(list) ? list : [];
	} catch (err) {
		console.error("scheduleStore.loadAll() parse error:", err);
		return [];
	}
}

function saveAllSchedules(list) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
	} catch (err) {
		console.error("scheduleStore.saveAll() error:", err);
	}
}

function generateId() {
	return typeof crypto?.randomUUID === "function"
		? crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function makeSchedule(name, rawText, source) {
	return {
		id: generateId(),
		name,
		rawText,
		importSource: source,
		dateCreated: new Date().toISOString(),
		games: []
	};
}

function deleteScheduleById(id) {
	const list = loadAllSchedules().filter(s => s.id !== id);
	saveAllSchedules(list);
}

function updateScheduleById(id, updates) {
	const list = loadAllSchedules().map(s => {
		if (s.id === id) return { ...s, ...updates };
		return s;
	});
	saveAllSchedules(list);
}

function importSchedule({
	rawText,
	parserKey = "generic",
	name,
	source = "",
	save = false
}) {
	if (!rawText || !rawText.trim()) {
		console.warn("scheduleStore.importSchedule: no raw text provided");
		return [];
	}

	// 🔧 Clean raw text of invisible Unicode characters
	const cleanedRaw = rawText.replace(/[\u202F\u00A0]/g, " ");

	let rawGames = [];

	try {
		switch (parserKey) {
			case "generic":
				rawGames = window.parseGenericMapped(cleanedRaw) || [];
				break;
			// Add other parser cases as needed
			default:
				console.warn(`Unknown parserKey "${parserKey}", falling back to generic`);
				rawGames = window.parseGenericMapped(cleanedRaw) || [];
		}
	} catch (err) {
		console.error("scheduleStore.importSchedule parser error:", err);
		rawGames = [];
	}

	const games = rawGames.map(raw => normalizeGameObject(raw));

	if (save) {
		const schedName = name || `Schedule ${new Date().toLocaleString()}`;
		const schedule = makeSchedule(schedName, cleanedRaw, source);
		schedule.games = games;

		const all = loadAllSchedules();
		const idx = all.findIndex(s => s.name === schedName);

		if (idx >= 0) {
			all[idx] = schedule;
		} else {
			all.push(schedule);
		}

		saveAllSchedules(all);
	}

	window.GAME_LIST = games;
	return games;
}

function loadSavedSchedule(id) {
	const list = loadAllSchedules() || [];
	const schedule = list.find(s => s.id === id);

	if (!schedule) {
		console.warn(`scheduleStore.loadSavedSchedule: no schedule found for id="${id}"`);
		window.GAME_LIST = [];
		return [];
	}

	window.GAME_LIST = schedule.games || [];
	return schedule.games;
}

export function getSavedSchedules() {
	try {
		const raw = localStorage.getItem("savedSchedules") || "[]";
		return JSON.parse(raw);
	} catch (e) {
		console.error("Error reading savedSchedules:", e);
		return [];
	}
}
export const ScheduleStore = {
	importSchedule,
	loadSavedSchedule,
	getSavedSchedules,
	deleteScheduleById,
	updateScheduleById
};

// Make available to carousel-ui and apps via window
window.ScheduleStore = ScheduleStore;
