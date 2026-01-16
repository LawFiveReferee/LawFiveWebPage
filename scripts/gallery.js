/* ==========================================
   Gallery Loader Script — Law Five Referee
   ========================================== */

function loadGallery(appFolder, jsonFile, galleryId) {
  const gallery = document.getElementById(galleryId);
  fetch(jsonFile)
    .then(response => {
      if (!response.ok) throw new Error("Gallery JSON not found");
      return response.json();
    })
    .then(images => {
      gallery.innerHTML = ""; // Clear any placeholders
      images.forEach(img => {
        const container = document.createElement("div");
        container.classList.add("gallery-item");
        container.style.textAlign = "center";

        const image = document.createElement("img");
        image.src = `images/${appFolder}/${img.file}`;
        image.alt = img.caption || "Screenshot";

        const caption = document.createElement("div");
        caption.classList.add("caption");
        caption.textContent = img.caption || "";

        const desc = document.createElement("div");
        desc.classList.add("description");
        desc.textContent = img.description || "";

        container.appendChild(image);
        if (img.caption) container.appendChild(caption);
        if (img.description) container.appendChild(desc);

        gallery.appendChild(container);
      });
    })
    .catch(error => {
      console.error("Error loading gallery data:", error);
      gallery.innerHTML = "<p>Gallery could not be loaded.</p>";
    });
}
