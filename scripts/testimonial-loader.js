/* =====================================
   Law Five Referee – Testimonial Loader
   -------------------------------------
   • Dynamically builds testimonial cards
   • Supports optional "sourceLink" field for clickable attribution
   • Backward-compatible with existing JSON files
   ===================================== */

/**
 * Loads testimonial cards from JSON.
 * @param {string} jsonPath – Path to testimonial JSON (e.g. "scripts/penalty-shootout-testimonials.json")
 */
async function loadTestimonials(jsonPath) {
	const section = document.getElementById("testimonials");
	if (!section) {
		console.warn("Testimonials section not found!");
		return;
	}

	try {
		const response = await fetch(jsonPath);
		if (!response.ok) throw new Error(`Cannot load ${jsonPath}`);
		const testimonials = await response.json();

		testimonials.forEach(item => {
			const card = document.createElement("div");
			card.classList.add("testimonial-card");

			// Quote
			const quote = document.createElement("p");
			quote.classList.add("quote");
			quote.textContent = `“${item.quote}”`;
			card.appendChild(quote);

			// Name / signature
			const name = document.createElement("p");
			name.classList.add("signature");
			name.textContent = item.name;
			card.appendChild(name);

			// Source (optionally with link)
			if (item.source) {
				const source = document.createElement("p");
				source.classList.add("source");

				if (item.sourceLink) {
					const link = document.createElement("a");
					link.href = item.sourceLink;
					link.textContent = item.source;
					link.target = "_blank";
					link.rel = "noopener noreferrer";
					source.appendChild(link);
				} else {
					source.textContent = item.source;
				}

				card.appendChild(source);
			}

			section.appendChild(card);
		});
	} catch (err) {
		console.error("Testimonials failed to load:", err);
	}
}