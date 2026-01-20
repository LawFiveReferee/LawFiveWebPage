/* =====================================
   Law Five Referee – Gallery Loader
   -------------------------------------
   • Dynamically builds gallery items
   • Uses JSON with { file, caption, description }
   • Fades images in after load
   • Limits screenshot height to 300px (width auto)
   ===================================== */

/**
 * Loads gallery images, captions, and descriptions from JSON.
 * @param {string} jsonPath   – Path to the JSON file (e.g. "scripts/quicklook-today-images.json")
 * @param {string} folderPath – Path to the folder containing the actual image files
 */
async function loadGallery(jsonPath, folderPath) {
	const gallery = document.getElementById("gallery");
	if (!gallery) {
		console.warn("Gallery element not found!");
		return;
	}

	try {
		console.log("Loading gallery from JSON:", jsonPath);
		const response = await fetch(jsonPath);
		if (!response.ok) throw new Error(`Could not load JSON file at ${jsonPath}`);

		const images = await response.json();
		if (!Array.isArray(images)) throw new Error("Invalid JSON format: expected an array.");

		/* ---------- Create one gallery item per entry ---------- */
		images.forEach(entry => {
			const filename = typeof entry === "string" ? entry : entry.file;
			const captionText = entry.caption || "";
			const descriptionText = entry.description || "";

			// Outer wrapper for this image, caption, and description
			const container = document.createElement("div");
			container.classList.add("gallery-item");

			/* ---------- Image ---------- */
			const img = document.createElement("img");
			img.src = `${folderPath}/${filename}`;
			img.alt = captionText || filename;

			// Set fixed display size (EDIT HERE to change dimensions)
			img.style.height = "300px"; // limit height of screenshots
			img.style.width = "auto"; // keep natural aspect ratio
			img.style.objectFit = "contain";

			container.appendChild(img);

			/* ---------- Caption ---------- */
			if (captionText) {
				const caption = document.createElement("p");
				caption.textContent = captionText;
				caption.classList.add("caption");
				container.appendChild(caption);
			}

			/* ---------- Description ---------- */
			if (descriptionText) {
				const description = document.createElement("p");
				description.textContent = descriptionText;
				description.classList.add("description");
				container.appendChild(description);
			}

			/* ---------- Fade-in Animation ---------- */
			container.style.opacity = "0";
			gallery.appendChild(container);
			setTimeout(() => {
				container.style.transition = "opacity 0.8s ease";
				container.style.opacity = "1";
			}, 100);
		});

		console.log(`Gallery loaded successfully: ${images.length} images`);
	} catch (err) {
		console.error("Gallery loading failed:", err);
		const fallback = document.createElement("p");
		fallback.textContent = "Gallery unavailable.";
		fallback.style.textAlign = "center";
		fallback.style.color = "#555";
		gallery.appendChild(fallback);
	}
}
/* ---------- End Gallery Loader ---------- */