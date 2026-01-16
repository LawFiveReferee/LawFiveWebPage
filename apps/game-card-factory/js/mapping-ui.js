console.log("Mapping UI loaded…");

/* ============================================================
   Standardized Fields
============================================================ */
const STANDARD_FIELD_MAP = [
  { value: "", label: "(ignore)" },

  { value: "game_number",  label: "Game Number" },
  { value: "match_date",   label: "Game Date" },
  { value: "match_time",   label: "Game Time" },
  { value: "age_division", label: "Age/Division" },
  { value: "location",     label: "Location" },
  { value: "field",        label: "Field" },

  { value: "home_team",    label: "Home Team" },
  { value: "away_team",    label: "Away Team" },

  { value: "home_coach",   label: "Home Coach" },
  { value: "away_coach",   label: "Away Coach" },

  { value: "referee1",     label: "Referee Crew 1" },
  { value: "referee2",     label: "Referee Crew 2" },
  { value: "referee3",     label: "Referee Crew 3" },

  { value: "assigner",     label: "Assigner" },
  { value: "payer",        label: "Payer" },
  { value: "notes",        label: "Notes" }
];

let currentHeaders = [];
let currentProfileKey = "";
let currentRawData = "";

/* ============================================================
   OPEN MAPPING UI
============================================================ */
function openGenericMappingUI(headers, profileKey, raw) {
  currentHeaders    = Array.isArray(headers) ? headers : [];
  currentProfileKey = profileKey || "generic-default-profile";
  currentRawData    = raw || "";

  const panel = document.getElementById("genericMappingPanel");
  const tableHost = document.getElementById("mappingTable");

  if (!panel || !tableHost) {
    console.error("Mapping UI elements missing.");
    return;
  }

  panel.classList.remove("hidden");

  const delimiter = "\t"; // TSV only

  const lines = currentRawData
    .split(/\r?\n/)
    .filter(l => l.trim().length);

  const row1 = lines[1]?.split(delimiter).map(c => c.trim()) || [];
  const row2 = lines[2]?.split(delimiter).map(c => c.trim()) || [];

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
          <td>${escapeHtml(h || "(blank)")}</td>
          <td>${escapeHtml(row1[i] || "")}</td>
          <td>${escapeHtml(row2[i] || "")}</td>
          <td>
            <select data-col-index="${i}">
              ${STANDARD_FIELD_MAP.map(f =>
                `<option value="${f.value}">${f.label}</option>`
              ).join("")}
            </select>
          </td>
        </tr>
      `).join("")}
    </table>
  `;

  const saved = loadMapping(currentProfileKey);
  if (saved?.mapping) {
    tableHost.querySelectorAll("select[data-col-index]").forEach(sel => {
      const idx = Number(sel.dataset.colIndex);
      if (typeof saved.mapping[idx] === "string") {
        sel.value = saved.mapping[idx];
      }
    });
  }
}

window.openGenericMappingUI = openGenericMappingUI;

/* ============================================================
   SAVE MAPPING  ✅ FIXED
============================================================ */
function saveCurrentMapping() {
  const tableHost = document.getElementById("mappingTable");
  if (!tableHost) return;

  const mappingArr = [];

  tableHost.querySelectorAll("select[data-col-index]").forEach(sel => {
    const idx = Number(sel.dataset.colIndex); // ✅ CORRECT
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

  console.log("✅ Mapping saved", payload);

  closeMappingPanel(); // ✅ NOW EXECUTES

  if (typeof window.onMappingSaved === "function") {
    window.onMappingSaved(payload);
  }
}

/* ============================================================
   BUTTON WIRING
============================================================ */
document.addEventListener("click", ev => {
  const id = ev.target?.id;
  if (id === "saveMappingProfile") saveCurrentMapping();
  if (id === "cancelMappingProfile") closeMappingPanel();
});

/* ============================================================
   HELPERS
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
  document
    .getElementById("genericMappingPanel")
    ?.classList.add("hidden");
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
