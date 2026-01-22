/**
 * Parse & import schedule text
 * @param {Object} config
 *   rawText    — text to parse
 *   parserKey  — parser to use
 *   save       — whether to save
 *   name       — schedule name (if save)
 */
export function parseAndImport({
  rawText,
  parserKey = "generic",
  save = false,
  name = ""
}) {
  if (!rawText || !rawText.trim()) {
    console.warn("parseAndImport: no input provided");
    return [];
  }

  // Call shared importer
  const games = ScheduleStore.importSchedule({
    rawText,
    parserKey,
    name,
    source: parserKey || "",
    save
  });

  return games;
}
