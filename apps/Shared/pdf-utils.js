//Template list and TEMPLATE_LIST
let TEMPLATE_LIST = [];
let selectedTemplateIndex = 0;
// ─── PDF Template Validation ──────────────────────────────
// validatePdfTemplate()

 async function validatePdfTemplate(pdfUrl) {
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
// findIllegalChars()

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

// ─── Template Carousel & Selection ────────────────────────
// loadTemplates()
async function loadTemplates() {
	const status = $("#templateStatus");
	try {
		const resp = await fetch("templates.json", {
			cache: "no-store"
		});
		if (!resp.ok) throw new Error("HTTP " + resp.status);

		TEMPLATE_LIST = await resp.json();
		window.TEMPLATE_LIST = TEMPLATE_LIST;

		const storedId = localStorage.getItem("fastCardFactoryTemplateId");
		if (storedId) {
			const idx = TEMPLATE_LIST.findIndex(t => String(t.id) === String(storedId));
			if (idx >= 0) selectedTemplateIndex = idx;
		}

		if (status) status.textContent = `Loaded ${TEMPLATE_LIST.length} template(s).`;
	} catch (err) {
		console.error("Error loading templates.json:", err);
		TEMPLATE_LIST = [];
		window.TEMPLATE_LIST = TEMPLATE_LIST;
		if (status) status.textContent = "Error loading templates.";
	}
}
// refreshTemplateCarousel()
function refreshTemplateCarousel() {
	const status = $("#templateStatus");
	if (!TEMPLATE_LIST.length) {
		if (status) status.textContent = "No templates loaded yet.";
		return;
	}

	const tpl = TEMPLATE_LIST[selectedTemplateIndex];

	const img = $("#templateImage");
	const nameEl = $("#templateName");

	if (img) img.src = `./templates/${tpl.png}`;
	if (nameEl) nameEl.textContent = tpl.name || "";

	if (status) status.textContent = `Template ${selectedTemplateIndex + 1} of ${TEMPLATE_LIST.length}`;

	localStorage.setItem("fastCardFactoryTemplateId", tpl.id);
}
// initCarouselControls()
function initCarouselControls() {
		const prev = $("#prevTemplate");
		const next = $("#nextTemplate");

		if (prev) {
			prev.addEventListener("click", () => {
				if (!TEMPLATE_LIST.length) return;
				selectedTemplateIndex = (selectedTemplateIndex - 1 + TEMPLATE_LIST.length) % TEMPLATE_LIST.length;
				refreshTemplateCarousel();
			});
		}

		if (next) {
			next.addEventListener("click", () => {
				if (!TEMPLATE_LIST.length) return;
				selectedTemplateIndex = (selectedTemplateIndex + 1) % TEMPLATE_LIST.length;
				refreshTemplateCarousel();
			});
		}
	}

// ─── PDF Generation from Game Data ────────────────────────

/* ============================================================
	PDF generation (your existing functions rely on PDFLib, JSZip, saveAs)
	Kept function names you already call: generateSinglePdfById, generateCombinedPdf, generateIndividualPdfs
============================================================ */

// buildFieldValuesFromGame()
function buildFieldValuesFromGame(g) {
		if (!g.assigner || typeof g.assigner !== "object") g.assigner = {
			name: "",
			phone: "",
			email: ""
		};
		if (!g.payer || typeof g.payer !== "object") g.payer = {
			name: "",
			phone: "",
			email: ""
		};

		const assignerText = [g.assigner.name, g.assigner.phone, g.assigner.email].filter(Boolean).join(" — ");
		const payerText = [g.payer.name, g.payer.phone, g.payer.email].filter(Boolean).join(" — ");

		let ref1 = g.referee1 || "";
		let ref2 = g.referee2 || "";
		let ref3 = g.referee3 || "";

		let lbl1 = "";
		let lbl2 = "";
		let lbl3 = "";

		if ((ref1 && ref2 && !ref3) || (g._arbiterTwoManCrew === true)) {
			lbl1 = "Sr. Referee";
			lbl2 = "";
			lbl3 = "Jr. Referee";
			ref3 = ref2;
			ref2 = "";
		} else if (ref1 && ref2 && ref3) {
			lbl1 = "Referee";
			lbl2 = "AR1";
			lbl3 = "AR2";
		} else if (ref1 && !ref2 && !ref3) {
			lbl1 = "Referee";
			lbl2 = "";
			lbl3 = "";
		} else {
			lbl1 = ref1 ? "Referee" : "";
			lbl2 = ref2 ? "AR1" : "";
			lbl3 = ref3 ? "AR2" : "";
		}

		return {
			GameNumber: g.game_number || "",
			GameDate: formatGameDate(g.match_date),
			GameTime: formatGameTime(g.match_time),
			GameLocationField: `${g.location || ""}${g.field ? " — " + g.field : ""}`,
			GameAgeDivision: g.age_division || "",

			HomeNameCoach: g.home_team || "",
			VisitorNameCoach: g.away_team || "",

			centerReferee: ref1,
			assistantReferee1: ref2,
			assistantReferee2: ref3,

			RefLabel1: lbl1,
			RefLabel2: lbl2,
			RefLabel3: lbl3,

			Assigner: assignerText,
			Payer: payerText,

			GameAdditionalInfo: g.notes || ""
		};
	}

// fill TemplatePdfForGame()
async function fillTemplatePdfForGame(templateBytes, tpl, g) {
	const srcDoc = await PDFLib.PDFDocument.load(templateBytes);
	const form = srcDoc.getForm();

	const fields = form.getFields();
	const fieldNames = fields.map(f => f.getName());

	fields.forEach(f => {
		try {
			f.setText("");
		} catch (e) {}
	});

	const vals = buildFieldValuesFromGame(g);
	for (const [k, v] of Object.entries(vals)) {
		if (fieldNames.includes(k)) {
			try {
				form.getTextField(k).setText(v || "");
			} catch (e) {}
		}
	}

	form.flatten();
	return await srcDoc.save();
}

// generate SinglePdf()
async function generateSinglePdf(g) {
	if (!g) return;

	if (!TEMPLATE_LIST.length) {
		alert("No templates loaded.");
		return;
	}

	const tpl = TEMPLATE_LIST[selectedTemplateIndex];
	const templateBytes = await fetch(`./templates/${tpl.pdf}?v=${Date.now()}`).then(r => r.arrayBuffer());

	const finalBytes = await fillTemplatePdfForGame(templateBytes, tpl, g);
	saveAs(new Blob([finalBytes], {
		type: "application/pdf"
	}), `Game-${g.game_number || "Match"}.pdf`);
}

// generate SinglePdfById()
async function generateSinglePdfById(gameId) {
	const status = $("#generateStatus");
	if (status) status.textContent = "Generating single-game PDF…";

	try {
		const g = games.find(x => x.id === gameId);
		if (!g) {
			if (status) status.textContent = "Error: game not found.";
			return;
		}
		await generateSinglePdf(g);
		if (status) status.textContent = "Single-game PDF generated.";
	} catch (err) {
		console.error("Error generating single-game PDF:", err);
		if (status) status.textContent = "Error generating single-game PDF.";
	}
}

// generate CombinedPdf()
async function generateCombinedPdf() {
		const selected = games.filter(g => g.selected);
		if (!selected.length) {
			alert("No games selected.");
			return;
		}
		if (!TEMPLATE_LIST.length) {
			alert("No templates loaded.");
			return;
		}

		const status = $("#generateStatus");
		if (status) status.textContent = "Generating combined PDF…";

		pdfProgressShow(selected.length, "Preparing combined PDF…");
		await tickUI();

		try {
			const tpl = TEMPLATE_LIST[selectedTemplateIndex];

			const [templateBytes, backgroundBytes] = await Promise.all([
				fetch(`./templates/${tpl.pdf}?v=${Date.now()}`).then(r => r.arrayBuffer()),
				fetch("./templates/letter-background.pdf").then(r => r.arrayBuffer())
			]);

			const bgDoc = await PDFLib.PDFDocument.load(backgroundBytes);
			const outDoc = await PDFLib.PDFDocument.create();

			const embeddedCards = [];
			let done = 0;
			const total = selected.length;

			for (const g of selected) {
				const cardBytes = await fillTemplatePdfForGame(templateBytes, tpl, g);
				const cleaned = await PDFLib.PDFDocument.load(cardBytes);
				const [page] = await cleaned.copyPages(cleaned, [0]);
				const embedded = await outDoc.embedPage(page);
				embeddedCards.push(embedded);

				done += 1;
				pdfProgressUpdate(done, total, `Processing ${done} of ${total}…`);
				if (done % 2 === 0) await tickUI();
			}

			// hard-coded positions for two 6x4-ish cards on letter
			const TOP = {
				x: 72,
				y: 432
			};
			const BOTTOM = {
				x: 72,
				y: 72
			};

			for (let i = 0; i < embeddedCards.length; i += 2) {
				const [bgPage] = await outDoc.copyPages(bgDoc, [0]);
				const outPage = outDoc.addPage(bgPage);

				outPage.drawPage(embeddedCards[i], TOP);
				if (embeddedCards[i + 1]) {
					outPage.drawPage(embeddedCards[i + 1], BOTTOM);
				}

				if (i % 4 === 0) await tickUI();
			}

			const finalBytes = await outDoc.save();
			saveAs(new Blob([finalBytes], {
				type: "application/pdf"
			}), "MatchCards.pdf");

			if (status) status.textContent = `Combined PDF generated for ${selected.length} game(s).`;
		} catch (err) {
			console.error("Error generating combined PDF:", err);
			if (status) status.textContent = "Error generating combined PDF.";
			alert("Error generating combined PDF. Check console for details.");
		} finally {
			pdfProgressHide();
		}
	}

// generate IndividualPdfs()
async function generateIndividualPdfs() {
	const selected = games.filter(g => g.selected);

	if (!selected.length) {
		alert("No games selected.");
		return;
	}
	if (!TEMPLATE_LIST.length) {
		alert("No templates loaded.");
		return;
	}

	const status = $("#generateStatus");
	if (status) status.textContent = "Generating individual PDFs…";

	pdfProgressShow(selected.length, "Preparing PDFs…");
	await tickUI();

	try {
		const tpl = TEMPLATE_LIST[selectedTemplateIndex];
		const templateBytes = await fetch(`./templates/${tpl.pdf}?v=${Date.now()}`)
			.then(r => r.arrayBuffer());

		// Single PDF path (still show spinner briefly)
		if (selected.length === 1) {
			const g = selected[0];
			pdfProgressUpdate(1, 1, "Generating PDF…");
			await tickUI();

			const finalBytes = await fillTemplatePdfForGame(templateBytes, tpl, g);
			saveAs(new Blob([finalBytes], {
				type: "application/pdf"
			}), `Game-${g.game_number || "Match"}.pdf`);

			if (status) status.textContent = "Single PDF generated.";
			return;
		}

		const zip = new JSZip();

		let done = 0;
		const total = selected.length;

		for (const g of selected) {
			const finalBytes = await fillTemplatePdfForGame(templateBytes, tpl, g);
			const filename = `Game-${g.game_number || "Match"}.pdf`;
			zip.file(filename, finalBytes);

			done += 1;
			pdfProgressUpdate(done, total, `Processing ${done} of ${total}…`);

			// Yield periodically so the UI can paint
			if (done % 2 === 0) await tickUI();
		}

		pdfProgressUpdate(total, total, "Packaging ZIP…");
		await tickUI();

		const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
		const zipBlob = await zip.generateAsync({
			type: "blob"
		});
		saveAs(zipBlob, `MatchCards-${stamp}.zip`);

		if (status) status.textContent = `Generated ${selected.length} PDFs (zipped).`;
	} catch (err) {
		console.error("Error generating individual PDFs:", err);
		if (status) status.textContent = "Error generating individual PDFs.";
		alert("Error generating individual PDFs. Check console for details.");
	} finally {
		pdfProgressHide();
	}
}

// ─── PDF Generation UI Helpers ────────────────────────────
	/* ============================================================
	   PDF Progress UI helpers
	============================================================ */
// get PdfProgressEls()
function getPdfProgressEls() {
	return {
		wrap: document.getElementById("pdfProgressWrap"),
		spin: document.getElementById("pdfSpinner"),
		text: document.getElementById("pdfProgressText"),
		barW: document.getElementById("pdfProgressBarWrap"),
		fill: document.getElementById("pdfProgressFill"),
		count: document.getElementById("pdfProgressCount")
	};
}

// pdf ProgressShow()
function pdfProgressShow(total, message) {
	const els = getPdfProgressEls();
	if (!els.wrap) return;

	els.wrap.classList.remove("hidden");

	if (els.text) els.text.textContent = message || "Working…";

	// If > 10 items, show progress bar + count. Otherwise just spinner + text.
	const showBar = total > 10;

	if (els.barW) {
		if (showBar) els.barW.classList.remove("hidden");
		else els.barW.classList.add("hidden");
	}

	if (els.spin) {
		els.spin.classList.remove("hidden");
	}

	if (els.fill) els.fill.style.width = "0%";
	if (els.count) els.count.textContent = `0 / ${total}`;
}

// pdf ProgressUpdate()
function pdfProgressUpdate(done, total, message) {
	const els = getPdfProgressEls();
	if (!els.wrap) return;

	const safeTotal = Math.max(1, total);
	const pct = Math.max(0, Math.min(100, Math.round((done / safeTotal) * 100)));

	if (els.text && message) els.text.textContent = message;

	if (total > 10) {
		if (els.fill) els.fill.style.width = `${pct}%`;
		if (els.count) els.count.textContent = `${done} / ${total}`;
	} else {
		// For <= 10, keep it simple and show “Processing x of y”
		if (els.text) {
			els.text.textContent = message || `Processing ${done} of ${total}…`;
		}
	}
}

// pdf ProgressHide()
function pdfProgressHide() {
	const els = getPdfProgressEls();
	if (!els.wrap) return;

	els.wrap.classList.add("hidden");
}

// init PdfButtons()
	function initPdfButtons() {
		const combinedBtn = $("#generateCombinedBtn");
		const indivBtn = $("#generateIndividualBtn");

		if (combinedBtn) {
			combinedBtn.addEventListener("click", () => {
				generateCombinedPdf().catch(err => {
					console.error(err);
					const s = $("#generateStatus");
					if (s) s.textContent = "Error generating combined PDF.";
				});
			});
		}

		if (indivBtn) {
			indivBtn.addEventListener("click", () => {
				generateIndividualPdfs().catch(err => {
					console.error(err);
					const s = $("#generateStatus");
					if (s) s.textContent = "Error generating individual PDFs.";
				});
			});
		}
	}


// Make sure PDFLib is already loaded globally (via script or import)
window.generateSinglePdfById = generateSinglePdfById;
export {
  loadTemplates,
  initCarouselControls,
  validatePdfTemplate,
  refreshTemplateCarousel,
  buildFieldValuesFromGame,
  fillTemplatePdfForGame,
  generateSinglePdf,
  generateSinglePdfById,
  generateCombinedPdf,
  generateIndividualPdfs,
  pdfProgressShow,
  pdfProgressUpdate,
  pdfProgressHide,
  initPdfButtons
};
