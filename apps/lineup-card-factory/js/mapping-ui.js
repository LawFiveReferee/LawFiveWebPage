console.log("Mapping UI loaded…");

/* ============================================================
   Standardized Fields (mapping order + display labels)
============================================================ */
const STANDARD_FIELD_MAP = [{
		value: "",
		label: "(ignore)"
	},

	{
		value: "game_number",
		label: "Game Number"
	},
	{
		value: "match_date",
		label: "Game Date"
	},
	{
		value: "match_time",
		label: "Game Time"
	},
	{
		value: "age_division",
		label: "Age/Division"
	},
	{
		value: "location",
		label: "Location"
	},
	{
		value: "field",
		label: "Field"
	},

	{
		value: "home_team",
		label: "Home Team"
	},
	{
		value: "away_team",
		label: "Away Team"
	},

	{
		value: "home_coach",
		label: "Home Coach"
	},
	{
		value: "away_coach",
		label: "Away Coach"
	},

	{
		value: "referee1",
		label: "Referee Crew 1"
	},
	{
		value: "referee2",
		label: "Referee Crew 2"
	},
	{
		value: "referee3",
		label: "Referee Crew 3"
	},

	{
		value: "assigner",
		label: "Assigner"
	},
	{
		value: "payer",
		label: "Payer"
	},
	{
		value: "notes",
		label: "Notes"
	}
];

let currentHeaders = [];
let currentProfileKey = "";
let currentRawData = "";

/* ============================================================
   OPEN MAPPING UI (called by parseGenericMapped)
   - Preserves leading delimiters
   - Uses column index mapping (supports duplicate headers)
============================================================ */
function openGenericMappingUI(headers, profileKey, raw) {
	currentHeaders = Array.isArray(headers) ? headers : [];
	currentProfileKey = profileKey || "generic-default-profile";
	currentRawData = raw || "";

	const panel = document.getElementById("genericMappingPanel");
	const tableHost = document.getElementById("mappingTable");

	if (!panel || !tableHost) {
		console.error("Mapping UI elements missing.");
		return;
	}

	panel.classList.remove("hidden");

	const delimiter = "\t"; // Force tab as only allowed delimiter

	// IMPORTANT: do not trim each line (leading \t would be lost)
	const lines = currentRawData
		.split(/\r?\n/)
		.filter(l => (l || "").trim().length > 0);

	const row1 = lines[1] ? lines[1].split(delimiter).map(c => (c ?? "").trim()) : [];
	const row2 = lines[2] ? lines[2].split(delimiter).map(c => (c ?? "").trim()) : [];

	tableHost.innerHTML = `
    <table class="mapping-table">
      <tr>
        <th>Input Column</th>
        <th>Row 1 Sample</th>
        <th>Row 2 Sample</th>
        <th>Map To Field</th>
      </tr>

      ${currentHeaders.map((h, i) => `
        <tr>
          <td class="input-col">${escapeHtml(h || "(blank)")}</td>
          <td class="sample-col">${escapeHtml(row1[i] || "")}</td>
          <td class="sample-col">${escapeHtml(row2[i] || "")}</td>
          <td>
            <select data-col-index="${i}">
              ${STANDARD_FIELD_MAP.map(f =>
                `<option value="${escapeHtml(f.value)}">${escapeHtml(f.label)}</option>`
              ).join("")}
            </select>
          </td>
        </tr>
      `).join("")}
    </table>
  `;

	// Restore saved mapping
	const saved = loadMapping(currentProfileKey);
	if (saved) {
		const selects = tableHost.querySelectorAll("select[data-col-index]");
		if (Array.isArray(saved.mapping)) {
			selects.forEach(sel => {
				const idx = Number(sel.dataset.colIndex);
				const v = saved.mapping[idx];
				if (typeof v === "string") sel.value = v;
			});
		}
	}
}

window.openGenericMappingUI = openGenericMappingUI;

/* ============================================================
   Button wiring
============================================================ */
document.addEventListener("click", (ev) => {
	const id = ev.target && ev.target.id ? ev.target.id : "";

	if (id === "saveMappingProfile") {
		saveCurrentMapping();
		return;
	}

	if (id === "cancelMappingProfile") {
		closeMappingPanel();
		return;
	}

	if (id === "exportMappingProfile") {
		exportCurrentMapping();
		return;
	}

	if (id === "importMappingProfile") {
		const input = document.getElementById("importMappingFileInput");

		if (input) {
			input.value = "";
			input.click();
		}
		return;
	}

	if (id === "resetMappingProfile") {
		resetCurrentMapping();
		return;
	}
});

/* ============================================================
   Import file input
============================================================ */
document.addEventListener("change", (ev) => {
	const input = ev.target;
	if (!input || input.id !== "importMappingFileInput") return;

	const file = input.files && input.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = () => {
		try {
			const data = JSON.parse(String(reader.result || ""));
			importMappingPayload(data);
		} catch (err) {
			console.error("Import failed:", err);
			alert("Import failed. File is not valid JSON.");
		}
	};
	reader.readAsText(file);
});

/* ============================================================
   Save / Export / Import / Reset
============================================================ */

function saveCurrentMapping() {
	const tableHost = document.getElementById("mappingTable");
	if (!tableHost) return;

	const selects = tableHost.querySelectorAll("select[data-col-index]");
	const mappingArr = [];

	selects.forEach(sel => {
		const idx = Number(sel.dataset.colIndex); // ✅ ONLY index used
		mappingArr[idx] = sel.value || "";
	});

	const payload = {
		version: 1,
		profileKey: currentProfileKey,
		headers: currentHeaders,
		mapping: mappingArr,
		savedAt: new Date().toISOString()
	};

	localStorage.setItem(
		"mapping_" + currentProfileKey,
		JSON.stringify(payload)
	);

	console.log("✅ Mapping saved successfully", payload);

	// ✅ CLOSE PANEL — this line was never reached before due to crash
	closeMappingPanel();
}

function exportCurrentMapping() {
	const saved = loadMapping(currentProfileKey);
	if (!saved) {
		alert("No saved mapping to export.");
		return;
	}

	const blob = new Blob([JSON.stringify(saved, null, 2)], {
		type: "application/json"
	});
	const fileName = `mapping-${sanitizeFileName(currentProfileKey)}.json`;

	// Download without external libs
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	setTimeout(() => {
		URL.revokeObjectURL(a.href);
		a.remove();
	}, 0);
}

function importMappingPayload(data) {
	// Accept either a full payload (preferred) or just {headers,mapping}
	const incoming = (data && typeof data === "object") ? data : null;
	if (!incoming) {
		alert("Import failed: invalid file structure.");
		return;
	}

	const mapping = Array.isArray(incoming.mapping) ? incoming.mapping : null;
	if (!mapping) {
		alert("Import failed: missing mapping array.");
		return;
	}

	const suggestedKey =
		typeof incoming.profileKey === "string" && incoming.profileKey.trim() ?
		incoming.profileKey.trim() :
		currentProfileKey;

	const newKey = prompt("Import mapping as profile key:", suggestedKey);
	if (!newKey) return;

	const targetKey = newKey.trim();
	const existing = localStorage.getItem("mapping_" + targetKey);
	if (existing) {
		const ok = confirm(`A mapping named '${targetKey}' already exists.\nReplace it?`);
		if (!ok) return;
	}

	const payload = {
		version: 1,
		profileKey: targetKey,
		headers: Array.isArray(incoming.headers) ? incoming.headers : currentHeaders,
		mapping: mapping,
		savedAt: new Date().toISOString()
	};

	localStorage.setItem("mapping_" + targetKey, JSON.stringify(payload));

	// If they imported into the currently open profile, refresh dropdowns immediately
	if (targetKey === currentProfileKey) {
		// re-open to apply values
		openGenericMappingUI(currentHeaders, currentProfileKey, currentRawData);
	}

	alert(`Imported mapping '${targetKey}'.`);
}

function resetCurrentMapping() {
	const ok = confirm(`Reset mapping '${currentProfileKey}'?\nThis clears the saved mapping for this profile.`);
	if (!ok) return;

	localStorage.removeItem("mapping_" + currentProfileKey);

	// Clear selects visually
	const tableHost = document.getElementById("mappingTable");
	if (tableHost) {
		const selects = tableHost.querySelectorAll("select[data-col-index]");
		selects.forEach(sel => (sel.value = ""));
	}

	alert("Mapping reset.");
}

/* ============================================================
   Helpers
============================================================ */
function loadMapping(key) {
	try {
		const raw = localStorage.getItem("mapping_" + key);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

function closeMappingPanel() {
	const panel = document.getElementById("genericMappingPanel");
	if (panel) panel.classList.add("hidden");
}

function escapeHtml(s) {
	return String(s ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function sanitizeFileName(s) {
	return String(s || "mapping")
		.toLowerCase()
		.replace(/[^a-z0-9\-_.]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}