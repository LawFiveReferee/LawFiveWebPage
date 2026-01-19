/**
 * Validate a PDF template for illegal characters
 * in form field names and default text.
 *
 * @param {string} pdfUrl — path to the selected template
 * @returns {Promise<Object>} — report with field info
 */
export async function validatePdfTemplate(pdfUrl) {
  const result = {
    fields: [],
    hasIllegalNames: false,
    hasIllegalValues: false
  };

  try {
    const arrayBuffer = await fetch(pdfUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const form = pdfDoc.getForm();

    // all text fields
    const textFields = form.getTextFields ? form.getTextFields() : [];

    for (const field of textFields) {
      const name = field.getName() || "";
      const defaultValue = field.getText() || "";

      // check both name & default value for illegal chars
      const illegalInName = findIllegalChars(name);
      const illegalInValue = findIllegalChars(defaultValue);

      result.fields.push({
        name,
        defaultValue,
        illegalInName,
        illegalInValue
      });

      if (illegalInName.length) result.hasIllegalNames = true;
      if (illegalInValue.length) result.hasIllegalValues = true;
    }
  } catch (err) {
    console.error("PDF validation failed:", err);
  }

  return result;
}

/**
 * Detect characters not supported by WinAnsi encoding
 * We consider anything outside 0x20–0x7E (printable ASCII)
 * as potentially illegal for default text.
 */
function findIllegalChars(str) {
  const illegal = [];
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    // legal range: space (0x20) through ~ (0x7E)
    if (code < 0x20 || code > 0x7E) {
      illegal.push({
        char: ch,
        code: code.toString(16).toUpperCase()
      });
    }
  }
  return illegal;
}
/**
 * Validate a PDF template and return illegal character report
 */
export async function validatePdfTemplate(pdfUrl) {
  const result = {
    fields: [],
    hasIllegalNames: false,
    hasIllegalValues: false
  };

  try {
    const arrayBuffer = await fetch(pdfUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    for (const field of fields) {
      const name = field.getName() || "";
      let defaultValue = "";

      try {
        defaultValue = field.getText?.() || "";
      } catch (_) {}

      const illegalInName = findIllegalChars(name);
      const illegalInValue = findIllegalChars(defaultValue);

      result.fields.push({
        name,
        defaultValue,
        illegalInName,
        illegalInValue
      });

      if (illegalInName.length) result.hasIllegalNames = true;
      if (illegalInValue.length) result.hasIllegalValues = true;
    }
  } catch (err) {
    console.error("PDF validation failed:", err);
  }

  return result;
}

function findIllegalChars(str) {
  const illegal = [];
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    if (code < 0x20 || code > 0x7E) {
      illegal.push({
        char: ch,
        code: code.toString(16).toUpperCase()
      });
    }
  }
  return illegal;
}
