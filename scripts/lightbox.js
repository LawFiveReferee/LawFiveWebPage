/* =====================================
   Law Five Referee – Gallery Lightbox
   ===================================== */
document.addEventListener("DOMContentLoaded", () => {
  const galleries = document.querySelectorAll(".gallery");
  if (!galleries.length) return;

  // Create lightbox container
  const lightbox = document.createElement("div");
  lightbox.classList.add("lightbox");
  lightbox.innerHTML = `
    <span class="close">&times;</span>
    <span class="nav prev">&#10094;</span>
    <img src="" alt="Expanded image" />
    <span class="nav next">&#10095;</span>
  `;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector("img");
  const closeBtn = lightbox.querySelector(".close");
  const nextBtn = lightbox.querySelector(".next");
  const prevBtn = lightbox.querySelector(".prev");

  let images = [];
  let currentIndex = 0;

  // Collect all gallery images
  document.querySelectorAll(".gallery-item img").forEach((img, index) => {
    images.push(img);
    img.dataset.index = index;

    img.addEventListener("click", () => {
      currentIndex = index;
      showImage();
    });
  });

  function showImage() {
    const img = images[currentIndex];
    lightboxImg.src = img.src;
    lightbox.classList.add("active");
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    showImage();
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showImage();
  }

  closeBtn.addEventListener("click", closeLightbox);
  nextBtn.addEventListener("click", nextImage);
  prevBtn.addEventListener("click", prevImage);

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
  });
});
