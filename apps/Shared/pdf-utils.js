// pdf-utils.js

// Make sure PDFLib is already loaded globally (via script or import)

export async function validatePdfTemplate(pdfUrl) {
  const result = {
    fields: [],
    hasIllegalNames: false,
    hasIllegalValues: false,
    pageSize: null
  };

  try {
    const arrayBuffer = await fetch(pdfUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const form = pdfDoc.getForm();
    const allFields = form.getFields();

    // Get the first page size
    const pages = pdfDoc.getPages();
    if (pages.length > 0) {
      const { width, height } = pages[0].getSize();
      result.pageSize = { width, height };
    }

    for (const field of allFields) {
      const name = field.getName() || "";
      let defaultValue = "";
      try {
        defaultValue = field.getText?.() ?? "";
      } catch (e) {}
      const illegalInName = findIllegalChars(name);
      const illegalInValue = findIllegalChars(defaultValue);
      result.fields.push({ name, defaultValue, illegalInName, illegalInValue });
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
      illegal.push({ char: ch, code: code.toString(16).toUpperCase() });
    }
  }
  return illegal;
}
