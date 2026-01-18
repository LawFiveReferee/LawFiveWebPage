// parser-store.js
// Shared backend for storing and managing parsers

const PARSER_KEY = "savedParsers";

/**
 * Load all saved parsers from localStorage
 */
export function loadSavedParsers() {
	try {
		const json = localStorage.getItem(PARSER_KEY) || "[]";
		const list = JSON.parse(json);
		return Array.isArray(list) ? list : [];
	} catch (err) {
		console.error("parserStore.loadSavedParsers() parse error:", err);
		return [];
	}
}

/**
 * Save all parsers to localStorage
 */
export function saveParsers(list) {
	try {
		localStorage.setItem(PARSER_KEY, JSON.stringify(list));
	} catch (err) {
		console.error("parserStore.saveParsers() error:", err);
	}
}

/**
 * Add or update a parser.
 */
export function addOrUpdateParser(parser) {
	const list = loadSavedParsers();
	const idx = list.findIndex(p => p.key === parser.key);
	if (idx >= 0) list[idx] = parser;
	else list.push(parser);
	saveParsers(list);
}

/**
 * Delete a parser
 */
export function deleteParser(key) {
	const list = loadSavedParsers().filter(p => p.key !== key);
	saveParsers(list);
}