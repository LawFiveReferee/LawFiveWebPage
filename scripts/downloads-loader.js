/* =====================================
   Law Five Referee – Downloads Loader
   -------------------------------------
   • Loads downloadable item cards from JSON
   • Uses JSON with { thumbnail, title, description, file }
   • Displays cards on downloads.html page
   ===================================== */

/**
 * Loads and displays downloadable items.
 * @param {string} jsonPath – Path to the downloads JSON (e.g. "scripts/downloads.json")
 */
async function loadDownloads(jsonPath) {
  const gallery = document.getElementById("downloads-gallery");
  if (!gallery) {
    console.warn("Downloads gallery not found!");
    return;
  }

  try {
    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error(`Cannot load ${jsonPath}`);
    const items = await response.json();

    items.forEach(entry => {
      const card = document.createElement("div");
      card.classList.add("download-card");

      // Thumbnail
      const img = document.createElement("img");
      img.src = entry.thumbnail;
      img.alt = entry.title;
      card.appendChild(img);

      // Title
      const title = document.createElement("h4");
      title.textContent = entry.title;
      card.appendChild(title);

      // Description
      const desc = document.createElement("p");
      desc.textContent = entry.description;
      card.appendChild(desc);

      // Download link
      const link = document.createElement("a");
      link.href = entry.file;
      link.textContent = "Download";
      link.classList.add("download-link");
      card.appendChild(link);

      gallery.appendChild(card);
    });
  } catch (err) {
    console.error("Downloads failed to load:", err);
  }
}
