]
import {
	loadSavedParsers,
	addOrUpdateParser,
	deleteParser
} from "./parser-store.js";

let currentEditKey = null; // track parser being edited

/**
 * Populate the parser carousel / list
 */
export function refreshParserList() {
	const container = document.getElementById("parserListContainer");
	if (!container) return;

	container.innerHTML = "";
	const list = loadSavedParsers();

	list.forEach(parser => {
		const row = document.createElement("div");
		row.className = "parser-row";
		row.textContent = parser.name;

		// Edit button
		const editBtn = document.createElement("button");
		editBtn.textContent = "Edit";
		editBtn.onclick = () => showParserEditor(parser);
		row.appendChild(editBtn);

		// Delete button
		const delBtn = document.createElement("button");
		delBtn.textContent = "Delete";
		delBtn.onclick = () => {
			if (confirm(`Remove parser "${parser.name}"?`)) {
				deleteParser(parser.key);
				refreshParserList();
			}
		};
		row.appendChild(delBtn);

		container.appendChild(row);
	});
}

/**
 * Show the parser editor modal
 */
export function showParserEditor(parser) {
	currentEditKey = parser?.key || null;

	document.getElementById("parserNameInput").value =
		parser?.name || "";

	document.getElementById("parserDescInput").value =
		parser?.description || "";

	document.getElementById("parserRulesInput").value =
		parser?.rules || "";

	document.getElementById("parserManagerModal").classList.remove("hidden");
}

/**
 * Hide the modal
 */
function closeParserEditor() {
	document.getElementById("parserManagerModal").classList.add("hidden");
}

/**
 * Save parser handler
 */
document.getElementById("saveParserBtn")?.addEventListener("click", () => {
	const name = document.getElementById("parserNameInput").value.trim();
	const desc = document.getElementById("parserDescInput").value.trim();
	const rules = document.getElementById("parserRulesInput").value;

	if (!name) {
		alert("Parser name is required");
		return;
	}

	// Assign a stable key if new
	const key = currentEditKey || `parser-${Date.now()}`;

	addOrUpdateParser({
		key,
		name,
		description: desc,
		rules
	});

	closeParserEditor();
	refreshParserList();
});

/**
 * Cancel parser editing
 */
document.getElementById("cancelParserBtn")?.addEventListener("click", () => {
	closeParserEditor();
});