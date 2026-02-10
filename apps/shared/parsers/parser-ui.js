// parser-ui.js
// Uses global ParserStore (loaded via <script> tag)

const {
  loadSavedParsers,
  loadAllParsers,
  addOrUpdateParser,
  deleteParser
} = window.ParserStore || {};


let currentEditKey = null; // track parser being edited

/**
 * Populate the parser list / carousel
 */
export function refreshParserList() {
  const container = document.getElementById("parserListContainer");
  if (!container) return;

  container.innerHTML = "";

  const list = loadSavedParsers();

  if (!list.length) {
    container.innerHTML = `<div class="empty-hint">No saved parsers</div>`;
    return;
  }

  list.forEach(parser => {
    const row = document.createElement("div");
    row.className = "parser-row";

    const name = document.createElement("span");
    name.textContent = parser.name;
    row.appendChild(name);

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.className = "secondary";
    editBtn.textContent = "Edit";
    editBtn.onclick = () => showParserEditor(parser);
    row.appendChild(editBtn);

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.className = "danger";
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      if (confirm(`Delete parser "${parser.name}"?`)) {
        deleteParser(parser.key);
        refreshParserList();
      }
    };
    row.appendChild(delBtn);

    container.appendChild(row);
  });
}

/**
 * Show parser editor UI
 */

export function showParserEditor(parser) {
  currentEditKey = parser?.key || null;

  document.getElementById("parserNameInput").value = parser?.name || "";
  document.getElementById("parserDescInput").value = parser?.description || "";
  document.getElementById("parserRulesInput").value = parser?.rules || "";

  // Mark the textarea to use this parser on import
  const rawArea = document.getElementById("rawInput");
  if (rawArea) {
    if (currentEditKey) {
      rawArea.setAttribute("data-parser-key", currentEditKey);
    } else {
      rawArea.removeAttribute("data-parser-key");
    }
  }

  document.getElementById("parserManagerModal").classList.remove("hidden");
}
/**
 * Save parser from editor
 */
export function saveParserFromEditor() {
  const name = document.getElementById("parserName")?.value.trim();
  const pattern = document.getElementById("parserPattern")?.value.trim();

  if (!name || !pattern) {
    alert("Parser name and pattern are required.");
    return;
  }

  addOrUpdateParser({
    key: currentEditKey,
    name,
    pattern
  });

  currentEditKey = null;
  refreshParserList();

  document.getElementById("parserEditor")?.classList.add("hidden");
}
