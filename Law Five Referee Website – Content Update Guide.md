# 📘 Law Five Referee Website – Content Update Guide

This guide explains how to add and manage **Downloads**, **App Gallery Images**, and **Testimonials**.  
All updates use simple JSON files — no HTML editing required.

---

## ✅ Quick Reference

| Type | JSON File | Media Folder | Appears On |
|------|------------|---------------|-------------|
| Downloads | `/scripts/downloads.json` | `/images/downloads/` | `downloads.html` |
| Penalty Shoot-out Gallery | `/scripts/penalty-shootout-images.json` | `/images/penalty-shootout/gallery-images/` | `penalty-shootout.html` |
| QuickLook Today Gallery | `/scripts/quicklook-today-images.json` | `/images/quicklook-today/gallery-images/` | `quicklook-today.html` |
| Penalty Testimonials | `/scripts/penalty-shootout-testimonials.json` | *(no images required)* | `penalty-shootout.html` |
| QuickLook Testimonials | `/scripts/quicklook-today-testimonials.json` | *(no images required)* | `quicklook-today.html` |

---

## 🟩 Adding Files to the Downloads Gallery

### 1. Upload Your Files
Place downloadable resources inside the `/downloads/` folder:

```
downloads/
 ├─ penalty-scorecards.pdf
 ├─ match-report.pdf
 └─ lineup-cards.pdf
```

Add thumbnail images to:

```
images/downloads/
 ├─ scorecard-thumb.jpg
 ├─ matchreport-thumb.jpg
 └─ lineup-thumb.jpg
```

> 💡 **Tip:** Thumbnails look best around **250–300 px wide**.  
> Use simple lowercase filenames (no spaces).

---

### 2. Edit the JSON List
Open `/scripts/downloads.json` and add an entry for each downloadable item:

```json
[
  {
    "thumbnail": "images/downloads/scorecard-thumb.jpg",
    "title": "Penalty Shoot-out Scorecards",
    "description": "Printable cards for tracking penalty results.",
    "file": "downloads/penalty-scorecards.pdf"
  },
  {
    "thumbnail": "images/downloads/matchreport-thumb.jpg",
    "title": "Match Report Template",
    "description": "Editable PDF match report form.",
    "file": "downloads/match-report.pdf"
  },
  {
    "thumbnail": "images/downloads/lineup-thumb.jpg",
    "title": "Lineup Card Sheet",
    "description": "Printable lineup cards for quick team setup.",
    "file": "downloads/lineup-cards.pdf"
  }
]
```

**Fields:**
- `thumbnail` → path to the preview image  
- `title` → display name  
- `description` → brief summary  
- `file` → path to the downloadable file (PDF, ZIP, etc.)

---

### 3. Save and Upload
Upload the following:

- **Files** → `/downloads/…`  
- **Thumbnails** → `/images/downloads/…`  
- **Updated JSON** → `/scripts/downloads.json`

Reload `downloads.html` — your new items appear automatically.

---

## 🟩 Adding Images to App Image Galleries

### 1. Upload Screenshots
Each app has its own gallery folder:

```
images/
 ├─ penalty-shootout/
 │   └─ gallery-images/
 │        ├─ 1.jpg
 │        ├─ 2.jpg
 │        └─ 3.jpg
 └─ quicklook-today/
     └─ gallery-images/
          ├─ 1.jpg
          ├─ 2.jpg
          └─ 3.jpg
```

> 💡 **Tip:** Screenshots display at a **height of 300 px** (width adjusts automatically).  
> Supported formats: `.jpg`, `.png`, `.webp`.

---

### 2. Edit the JSON List
Each app gallery is defined in its own JSON file:

```
scripts/
 ├─ penalty-shootout-images.json
 └─ quicklook-today-images.json
```

Example JSON:

```json
[
  {
    "file": "PenaltyShootoutSimulator - 1_2688.PNG",
    "caption": "Displaying All Reminders in the App",
    "description": "You can limit how many Reminder lists the app uses by selecting Reminders from the menu button and deselecting Reminder lists."
  },
  {
    "file": "PenaltyShootoutSimulator - 2_2688.PNG",
    "caption": "Referee Summary View",
    "description": "Provides immediate access to team results and history."
  }
]
```

**Fields:**
- `file` → filename inside `gallery-images/`  
- `caption` → short title displayed under the image  
- `description` → optional explanatory text

---

### 3. Save and Upload
Upload the new images and the updated JSON:

```
images/penalty-shootout/gallery-images/…
scripts/penalty-shootout-images.json
```

Refresh the app page (`penalty-shootout.html` or `quicklook-today.html`) to see the new screenshots.

---

## 🟩 Adding Testimonials to App Pages

### 1. Create the JSON File
Each app has its own testimonial list:

```
scripts/
 ├─ penalty-shootout-testimonials.json
 └─ quicklook-today-testimonials.json
```

Example JSON:

```json
[
  {
    "quote": "An essential companion for referees—simple, fast, and accurate.",
    "name": "—Alex R.",
    "source": "App Store Review"
  },
  {
    "quote": "We used this app in our regional tournament and it worked flawlessly!",
    "name": "—Chris J.",
    "source": "Regional Referee Committee"
  }
]
```

**Fields:**
- `quote` → testimonial text  
- `name` → reviewer’s name (start with an em dash `—`)  
- `source` → optional attribution or context (e.g., “App Store Review”)

---

### 2. Upload and Verify
Upload the JSON file to `/scripts/`.

Each app page already includes this loader:
```html
<script src="scripts/testimonial-loader.js"></script>
<script>
  loadTestimonials("scripts/penalty-shootout-testimonials.json");
</script>
```

When you refresh the page, the new testimonials appear automatically above the image gallery.

---
# ⚙️ Layout and Spacing Adjustments — App Pages

These settings apply to the **Penalty Shoot-out** and **QuickLook Today** app pages.  
All adjustments are made by editing **`css/style.css`**.  
Scroll to the bottom of that file and look for the section labeled:

```css
/* ===========================================================
   Custom Layout Adjustments — Law Five Referee Website
   =========================================================== */
```

---

## 1. App Intro Section (`.app-intro`)

### 🔹 Adjust the Width of the App Card

Controls the overall width of the app header area (text + promo image).

```css
.app-intro {
  max-width: 1000px;  /* overall width cap */
  width: 85%;         /* responsive width (75–95% typical) */
}
```

- **Narrower:** decrease `width` (e.g., `75%`)
- **Wider:** increase `width` (e.g., `95%`)

---

### 🔹 Adjust the Internal Padding

Controls spacing inside the app card panel.

```css
.app-intro {
  padding: 30px 40px; /* top/bottom, left/right */
}
```

- Increase for more breathing room  
- Decrease for tighter spacing

---

### 🔹 Change Vertical Position of the Text Column

Controls how the text block aligns vertically with the promo image.

```css
.app-text {
  justify-content: center; /* options: flex-start | center | flex-end */
}
```

- `flex-start` → aligns to top  
- `center` → vertically centered  
- `flex-end` → aligns to bottom

---

### 🔹 Adjust Promo Screenshot Height / Max Height

Controls the displayed size of the promotional screenshot.

```css
.app-image img.promo-screenshot {
  max-width: 350px;
  max-height: 480px;
  object-fit: contain;
}
```

- Increase `max-height` for taller images on large screens  
- Use `object-fit: contain;` to prevent stretching

---

## 2. Testimonials Section

### 🔹 Adjust Testimonial Card Width

```css
.testimonial-card {
  max-width: 640px;
  width: 70%;
}
```

- Increase `max-width` to make testimonial cards wider  
- Decrease for a more compact layout

---

### 🔹 Adjust Testimonial Card Padding

```css
.testimonial-card {
  padding: 22px 40px; /* top/bottom, left/right */
}
```

- Increase for more internal space  
- Decrease to tighten the card layout

---

## 3. Gallery Section

### 🔹 Adjust Gallery Card Width and Height

```css
.gallery-item {
  width: 300px;
  height: 380px;
}
```

- **Width:** controls horizontal card size  
- **Height:** total vertical space including caption

---

### 🔹 Adjust Internal Padding of Gallery Cards

```css
.gallery-item {
  padding: 10px;
}
```

- Increase for more white space around the image and text  
- Decrease for denser grids

---

### 🔹 Control Maximum Image Size Inside Cards

```css
.gallery-item img {
  max-width: 100%;
  max-height: 300px;
  object-fit: cover;
}
```

- `max-height` limits how tall screenshots appear  
- Use `object-fit: cover` to crop neatly within frame

---

### 🔹 Adjust the Maximum Size of the Gallery Cards

```css
.gallery-item {
  height: 380px;
}
```

- Raise if captions overflow  
- Lower if you prefer compact cards

---

### 🔹 Adjust Vertical Spacing Above and Below the Gallery Section

Controls how much space separates the gallery from testimonials or other content.

```css
.gallery-section {
  margin-top: 50px;     /* space above gallery */
  margin-bottom: 60px;  /* space below gallery */
  padding-top: 10px;    /* internal spacing above images */
  padding-bottom: 10px; /* internal spacing below images */
}
```

- Increase `margin-top` / `margin-bottom` to open up sections  
- Adjust `padding` for finer control inside the gallery block

---

## 4. Header and Footer

### 🔹 Adjust Header Padding

```css
header {
  padding: 20px 0; /* top/bottom */
}
```

- Increase for taller header bar  
- Decrease for tighter look

---

### 🔹 Adjust Footer Padding

```css
footer {
  padding: 18px 0; /* top/bottom */
}
```

- Increase for more breathing room  
- Decrease for a compact footer

---

## 5. Responsive Behavior

### Tablet Breakpoint (≤ 1024 px)

At medium screen widths (e.g., iPad), the following changes apply automatically:
- `.app-intro` widens to `90%`
- `gap` reduces to `40px`
- Promo image scales down (`max-width: 300px`)

### Mobile Breakpoint (≤ 768 px)

At phone widths:
- `.app-intro` stacks vertically (`flex-direction: column`)
- Text and image center-align
- Padding tightens (`20px`)
- Gallery cards shrink to `220 px × 300 px`
- Header/footer padding slightly reduced

---

## 6. Quick Reference Table

| Element | Property | Typical Range | Description |
|----------|-----------|----------------|--------------|
| `.app-intro` | `width` | 75–95% | Overall app card width |
| `.app-intro` | `padding` | 20–60 px | Internal spacing |
| `.app-text` | `justify-content` | start / center / end | Vertical alignment |
| `.promo-screenshot` | `max-height` | 350–500 px | Image height limit |
| `.testimonial-card` | `max-width` | 500–800 px | Card width |
| `.gallery-item` | `width` | 250–350 px | Gallery card size |
| `.gallery-section` | `margin-top/bottom` | 30–80 px | Vertical section spacing |
| `header/footer` | `padding` | 10–25 px | Top/bottom padding |

---

### 🧭 Editing Tip
- Always **preview after each change** to ensure the layout remains balanced.
- Keep values consistent between both app pages for uniform presentation.

## ⚙️ Troubleshooting

### 🧩 New items aren’t showing up
1. **Check the Console:**  
   Press **F12 → Console** and look for red errors like  
   ```
   GET …/scripts/downloads.json 404 (Not Found)
   ```
   → Ensure the JSON path in your HTML matches your file’s actual location.

2. **Validate JSON format:**  
   Visit https://jsonlint.com and paste your JSON.  
   Common issues:  
   - Missing commas between entries  
   - Trailing comma after the last item  
   - Missing quotes around keys or strings

3. **Confirm file paths:**  
   Verify image and download paths in JSON, e.g.  
   ```json
   "thumbnail": "images/downloads/scorecard-thumb.jpg"
   ```

4. **Reload the page (hard refresh):**  
   Use **Ctrl + F5 (Windows)** or **Cmd + Shift + R (Mac)** to clear cache.

5. **Check file names and case:**  
   Web servers are case-sensitive — `"Scorecard-thumb.jpg"` ≠ `"scorecard-thumb.jpg"`.

---

### 🧩 Broken images or missing icons
- Confirm the image exists in the path listed in JSON.  
- Use relative paths from the site root (`images/...`).  
- Double-check file extensions (`.jpg`, `.png`, `.svg`) and spelling.

---

### 🧩 Still not working?
If everything looks correct but nothing displays:
- Make sure your `<div id="gallery">` or `<div id="downloads-gallery">` exists **before** the script runs.  
- Ensure your loader script (`gallery-loader.js`, `downloads-loader.js`, or `testimonial-loader.js`) is linked at the **bottom** of the HTML file.

---

### ✅ Quick Checks Before Uploading
- JSON validates successfully.  
- Filenames match exactly (case + extension).  
- Scripts are referenced correctly.  
- You performed a hard refresh.

---

**That’s it! 🎉**  
You can now add, remove, or update any app gallery, testimonial, or downloadable file by editing the corresponding JSON — no HTML changes required.
