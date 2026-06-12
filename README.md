<div align="center">

<img src="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Crect%20x='2'%20y='2'%20width='8'%20height='8'%20fill='%23a29bfe'/%3E%3Crect%20x='14'%20y='2'%20width='8'%20height='8'%20fill='%23ff6b6b'/%3E%3Crect%20x='2'%20y='14'%20width='8'%20height='8'%20fill='%234ecdc4'/%3E%3Crect%20x='14'%20y='14'%20width='8'%20height='8'%20fill='%23ffe66d'/%3E%3C/svg%3E" width="64" height="64" alt="PixieR logo">

# PixieR — Pixel Art Converter

</div>

PixieR is a 100% client-side web tool that converts any image into pixel art directly in your browser. No uploads, no backend, no API calls — everything happens locally using the HTML5 Canvas API.

**[Live Demo](#)** · **[Report a Bug](https://github.com/cryskyyexp-ux/PixieR-Project/issues)**

---

## Table of Contents

- [Features](#features)
- [How It Works (The Core Algorithm)](#how-it-works-the-core-algorithm)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Option 1: Just Open the File](#option-1-just-open-the-file)
  - [Option 2: Run on Localhost](#option-2-run-on-localhost)
- [How to Use PixieR](#how-to-use-pixier)
- [Detailed Code Walkthrough](#detailed-code-walkthrough)
  - [1. Background Grid Animation](#1-background-grid-animation)
  - [2. Theme Toggle (Light/Dark)](#2-theme-toggle-lightdark)
  - [3. File Upload & Preview](#3-file-upload--preview)
  - [4. The Pixelate Button](#4-the-pixelate-button)
  - [5. The Pixelation Engine (`doPixelate`)](#5-the-pixelation-engine-dopixelate)
  - [6. Scale Modes Explained](#6-scale-modes-explained)
  - [7. Realtime Controls (Width, Height, Chips, Link)](#7-realtime-controls-width-height-chips-link)
  - [8. Zoom & Display Rendering](#8-zoom--display-rendering)
  - [9. View Modes (Split / Compare / Pixel Only)](#9-view-modes-split--compare--pixel-only)
  - [10. Compare Slider Drag Logic](#10-compare-slider-drag-logic)
  - [11. Eyedropper Color Picker](#11-eyedropper-color-picker)
  - [12. Download System](#12-download-system)
  - [13. Toast Notifications](#13-toast-notifications)
- [Data Flow Summary](#data-flow-summary)
- [Browser Support](#browser-support)
- [AI Usage Disclosure](#ai-usage-disclosure)
- [License](#license)

---

## Features

- **100% Client-Side** — no server, no uploads, no API keys, your images never leave your device.
- **Drag & Drop or File Picker** — supports PNG, JPG, WEBP, GIF, BMP.
- **Realtime Pixelation** — adjust width, height, scale mode, and zoom, and the result updates live.
- **Three Scale Modes** — `Fit` (preserve aspect ratio), `Stretch` (force exact dimensions), `Crop` (center-crop to match target ratio).
- **Three View Modes** — Side by Side, Drag-to-Compare Slider, and Pixel-Only zoomed view.
- **Eyedropper Tool** — hover to preview a pixel's hex color, click to copy it to clipboard.
- **Multi-Format Export** — download the result as PNG, JPG, or WebP at its true (small) resolution.
- **Light / Dark Theme** — with an animated, mouse-reactive grid background.
- **Linked Width/Height** — toggle to keep width and height in sync, plus quick-select size chips (16, 32, 64, 128, 256).

---

## How It Works (The Core Algorithm)

The "pixel art" effect is **not** a special filter or AI process — it's two standard image operations chained together:

```
Big detailed photo
      │
      ▼  (1) DOWNSAMPLE — shrink the image to a tiny canvas, e.g. 64×64
      │     The browser averages blocks of source pixels into one pixel each.
      │     This is real data loss — the result IS the pixel art.
      ▼
Tiny 64×64 bitmap  ──────────────► this is what gets saved when you download
      │
      ▼  (2) UPSCALE FOR DISPLAY — stretch the tiny bitmap up using CSS
      │     `image-rendering: pixelated` disables smoothing, so each tiny
      │     pixel becomes a sharp, solid, zoomed-in square.
      ▼
Big blocky pixel art (what you see on screen)
```

In short:
- **Shrinking** the image = creates the pixel art (this is the actual algorithm).
- **Zooming/stretching** it back up = just lets you *see* it clearly. It adds no new information and is not saved in the downloaded file.

---

## Project Structure

```
PixieR-Project/
├── image.png       # Web Preview
├── LICENSE.md      # License
├── index.html      # Page structure & UI elements
├── index.css       # Styling (not covered in this README)
├── main.js         # All application logic
└── README.md
```

---

## Getting Started

PixieR has **zero dependencies** and **no build step**. There's nothing to install or compile.

### Option 1: Just Open the File

The simplest way to use PixieR:

1. Download or clone this repository.
2. Double-click `index.html` (or right-click → **Open with** → your browser).
3. That's it — the app is fully functional.

> **Note:** Some browsers restrict certain features (like `localStorage`) when opening files directly via `file://`. If something feels off, use Option 2 below instead.

### Option 2: Run on Localhost

Running through a local server avoids any `file://` quirks and more closely mirrors how the site behaves when deployed.

#### Using Python (most common, usually pre-installed)

```bash
# Navigate to the project folder
cd PixieR-Project

# Python 3
python -m http.server 8000

# If that doesn't work, try:
python3 -m http.server 8000
```

Then open your browser to:
```
http://localhost:8000
```

#### Using Node.js (`http-server`)

```bash
# Install globally (one-time)
npm install -g http-server

# Navigate to the project folder
cd PixieR-Project

# Run the server
http-server -p 8000
```

Then open:
```
http://localhost:8000
```

#### Using VS Code (Live Server extension)

1. Install the **Live Server** extension by Ritwick Dey.
2. Open the `PixieR-Project` folder in VS Code.
3. Right-click `index.html` → **Open with Live Server**.
4. Your browser will open automatically at something like `http://127.0.0.1:5500`.

#### Using PHP (if installed)

```bash
cd PixieR-Project
php -S localhost:8000
```

Then open:
```
http://localhost:8000
```

To stop any of these servers, go back to the terminal and press `Ctrl + C`.

---

## How to Use PixieR

1. **Load an image** — drag and drop a file onto the drop zone, or click **Choose File** to pick one from your device. Supported formats: PNG, JPG, WEBP, GIF, BMP.
2. **Hit "✨ Pixelate!"** — wait a few seconds while it processes.
3. **Adjust settings in realtime**:
   - **Width / Height** — set the output grid size (4–1024), or use the quick-select chips (16, 32, 64, 128, 256).
   - **🔗 Link button** — keep width and height synced together.
   - **Scale Mode** — choose `Fit` (keep proportions), `Stretch` (force exact size), or `Crop` (center-crop to fit).
   - **Preview Zoom** — control how large the pixel art appears on screen (1×–20×). This does **not** affect the downloaded file size.
4. **Switch views**:
   - **Side by Side** — original and pixelated shown next to each other.
   - **Compare Slider** — drag the handle to reveal more/less of the pixelated version over the original.
   - **Pixel Only** — a large, zoomed-in view of just the result.
5. **Pick colors** — hover over the pixelated result to see each pixel's hex code; click a pixel to copy that hex code to your clipboard.
6. **Download** — click **PNG**, **JPG**, or **WebP** to save the result at its true (small) resolution.
7. **Toggle theme** — use the sun/moon switch in the top-right corner for light/dark mode.

---

## Detailed Code Walkthrough

### 1. Background Grid Animation

```js
const gc = document.getElementById('grid-bg'), gx = gc.getContext('2d');
const SZ = 34; let hx=-1, hy=-1, isDark=false;
```

- A full-screen `<canvas>` (`#grid-bg`) sits behind all content.
- `drawGC()` draws a grid of `34×34` px cells across the entire viewport.
- It tracks the mouse position (`hx`, `hy` = the cell coordinates under the cursor).
- For every cell within a distance of `3` cells from the cursor, it fills that cell with a fading colored highlight (`Math.max(0, .1 - dist*.035)` for light mode, slightly stronger for dark mode) — creating a soft "glow follows your mouse" effect.
- `resizeGC()` re-creates the canvas size on window resize, then redraws.
- The 25 small colored squares in the logo (`#lgrid`) are generated by looping through a fixed color palette (`pal`) and assigning each a random opacity between `0.4` and `0.85`.

### 2. Theme Toggle (Light/Dark)

```js
document.getElementById('themeBtn').addEventListener('click', () => {
  isDark = htmlEl.dataset.theme === 'light';
  htmlEl.dataset.theme = isDark ? 'dark' : 'light';
  drawGC();
});
```

- Clicking the toggle button flips the `data-theme` attribute on `<html>` between `"light"` and `"dark"` (the actual color values for each theme live in the CSS).
- It also updates the `isDark` flag and redraws the background grid so the highlight color/opacity matches the new theme.

### 3. File Upload & Preview

Two entry points feed into the same function:

```js
dz.addEventListener('drop', e => { ... loadFile(f) });
fi.addEventListener('change', () => { ... loadFile(fi.files[0]) });
```

`loadFile(file)` does the following:

1. Resets state: `pixelated = false`, hides the result workspace, shows the "controls locked" message.
2. Shows a progress bar (`setFileProgress`) that fills as the file is read.
3. Uses `FileReader.readAsDataURL(file)` to convert the file into a Base64 Data URL string.
4. `reader.onprogress` updates the progress bar in real time as the file streams in (10% → 80% range).
5. Once read, it creates a new `Image` object (`new Image()`), sets its `src` to the Data URL, and waits for `img.onload`.
6. On load:
   - `srcImg = img` — **this global variable is the single source of truth** for all later pixelation. Nothing else touches the original file again.
   - Displays the original thumbnail, filename, and dimensions (`width × height px · size KB`).
   - Enables the **Pixelate!** button.
   - Shows a toast: *"Image loaded! Hit ✨ Pixelate to convert"*.

### 4. The Pixelate Button

```js
pxBtn.addEventListener('click', () => { ... });
```

When clicked:

1. The button is disabled and its text changes to *"⏳ Processing…"*.
2. A series of `setTimeout` calls animate a progress bar (`btn-prog`) through fixed percentages: `8% → 22% → 45% → 63% → 78% → 90% → 97% → 100%` over roughly **5 seconds total**.
3. **Important:** this 5-second delay is purely cosmetic. The actual pixelation computation (`doPixelate()`) takes only milliseconds. The delay exists to give the user a sense that "real work" is happening.
4. After the delay finishes:
   - `doPixelate()` runs — this is where the real algorithm executes.
   - `pixelated = true` is set, which **unlocks realtime controls** (from this point on, changing settings re-runs pixelation automatically).
   - The button briefly gets a `shimmer` animation class.
   - The result workspace (`#workspace`) becomes visible and the page smooth-scrolls to it.
   - A toast confirms: *"Done! Now tweak settings in realtime"*.

### 5. The Pixelation Engine (`doPixelate`)

This is the core function — everything else just calls this with different inputs.

```js
function doPixelate(){
  if(!srcImg)return;
  document.getElementById('spinner').style.display='flex';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    // ... actual work ...
  }));
}
```

**Step-by-step:**

1. **Read target dimensions** from the width/height inputs, clamped between `4` and `1024`:
   ```js
   const pw = Math.max(4, Math.min(1024, parseInt(pwInput.value) || 64));
   const ph = Math.max(4, Math.min(1024, parseInt(phInput.value) || 64));
   ```

2. **Calculate the actual output size (`sw`, `sh`)** based on the selected scale mode (see [Scale Modes](#6-scale-modes-explained) below). For `fit` mode, this may differ from `pw`/`ph` to preserve aspect ratio.

3. **Create a hidden, temporary canvas** (`small`) sized `sw × sh`.

4. **Draw the source image into the tiny canvas.** This single `drawImage()` call is where the actual pixelation happens — the browser shrinks the full-resolution image down to e.g. 64×64, averaging blocks of pixels into single colors.

5. **Copy the tiny canvas onto the visible result canvas** (`#pixel-canvas`), which is also resized to `sw × sh`. This is a 1:1 copy — no further scaling.
   - `#pixel-canvas` is now the **canonical result**: a real, small bitmap. This is what gets downloaded and what the eyedropper reads from.

6. **Update the dimensions label** (e.g. `"64×64"`).

7. Call `applyZoom()`, `syncCmpCanvas()`, and `syncSoloCanvas()` to update all the other display views with this new result.

8. Hide the loading spinner.

The double `requestAnimationFrame` wrapper ensures the browser has finished its current paint cycle before doing the (synchronous, blocking) canvas work — this keeps the UI from feeling frozen.

### 6. Scale Modes Explained

All three modes are selected via the `.mode-tab` buttons, which set the global `scaleMode` variable and call `schedulePx()`.

#### **Fit** (default — preserves aspect ratio)
```js
const r = srcImg.width / srcImg.height;
if (pw/ph > r) { sw = Math.round(ph * r); sh = ph; }
else           { sw = pw; sh = Math.round(pw / r); }
sc.drawImage(srcImg, 0, 0, sw, sh);
```
The output canvas itself shrinks to match the source's aspect ratio — the whole image is drawn with no cropping or distortion, but the final `sw × sh` may not exactly equal your requested `pw × ph`.

#### **Stretch** (fills the exact grid, ignores ratio)
```js
sw = pw; sh = ph;
sc.drawImage(srcImg, 0, 0, sw, sh);
```
The whole image is squeezed/stretched into exactly `pw × ph`, even if that distorts the original proportions (e.g. a circle could become an oval).

#### **Crop** (center-crop to match ratio, then fit)
```js
const sr = srcImg.width / srcImg.height; // source ratio
const dr = sw / sh;                       // target ratio
let sx=0, sy=0, sW=srcImg.width, sH=srcImg.height;

if (sr > dr) {
  // source is wider than target → trim left/right
  sW = Math.round(srcImg.height * dr);
  sx = (srcImg.width - sW) / 2;
} else {
  // source is taller than target → trim top/bottom
  sH = Math.round(srcImg.width / dr);
  sy = (srcImg.height - sH) / 2;
}
sc.drawImage(srcImg, sx, sy, sW, sH, 0, 0, sw, sh);
```
This uses the 9-argument form of `drawImage`. It first calculates a centered rectangle (`sx, sy, sW, sH`) from the source image that matches the *target's* aspect ratio, then draws **only that rectangle**, scaled to fill `sw × sh` exactly. Effectively: crop the edges off the original, then shrink the remaining middle.

### 7. Realtime Controls (Width, Height, Chips, Link)

**Linked W/H toggle:**
```js
document.getElementById('link-btn').addEventListener('click', function(){
  linked = !linked;
  this.classList.toggle('linked', linked);
  this.textContent = linked ? '🔗' : '🔓';
  if(linked){ phInput.value = pwInput.value; syncChips('h', pwInput.value) }
});
```
When `linked = true`, changing the width input automatically copies the same value into the height input (and vice versa is **not** symmetric — only width drives height when linked).

**Size chips (16/32/64/128/256):**
```js
document.getElementById('chips-w').addEventListener('click', e => {
  const c = e.target.closest('.chip'); if(!c) return;
  setChipActive('w', c.dataset.v); pwInput.value = c.dataset.v;
  if(linked){ phInput.value = c.dataset.v; setChipActive('h', c.dataset.v) }
  schedulePx();
});
```
Clicking a chip sets that input's value directly, highlights the chip as "active" (`setChipActive`), and — if linked — mirrors the change to the other axis.

**Manual typing deactivates chips:**
```js
pwInput.addEventListener('input', () => {
  deactivateChips('w');
  if(linked){ phInput.value = pwInput.value; syncChips('h', pwInput.value) }
  schedulePx();
});
```
If you type a custom number, all chip highlights for that axis are removed (`deactivateChips`) since no preset matches anymore.

**The debounce (`schedulePx`):**
```js
function schedulePx(){
  if(!pixelated) return;
  clearTimeout(debTimer);
  debTimer = setTimeout(doPixelate, 120);
}
```
Every input change calls this instead of `doPixelate()` directly. It:
- Does nothing if you haven't pixelated at least once yet (`pixelated` is `false`).
- Cancels any pending pixelation and schedules a new one `120ms` later. If you change the value again within that window, the timer resets — so rapid changes (like dragging a number spinner) only trigger **one** final recomputation.

### 8. Zoom & Display Rendering

```js
function applyZoom(){
  const c = document.getElementById('pixel-canvas');
  const z = parseInt(zoomSlider.value);
  c.style.width  = (c.width  * z) + 'px';
  c.style.height = (c.height * z) + 'px';
}
```

- `c.width` / `c.height` are the canvas's **internal pixel buffer dimensions** (e.g. `64`). These never change here.
- `c.style.width` / `c.style.height` are the **CSS display size** (e.g. `64 × 6 = 384px`).
- Combined with `image-rendering: pixelated` in the CSS, the browser uses **nearest-neighbor scaling**: each of the 64 internal pixels becomes a solid `6×6` px block on screen, with hard edges and no blur.
- The zoom slider (`1×` to `20×`) triggers `applyZoom()`, plus `syncCmpCanvas()` and `syncSoloCanvas()` to keep the other two views in sync.

### 9. View Modes (Split / Compare / Pixel Only)

```js
function showView(mode){
  document.getElementById('view-split').style.display   = mode==='split'   ? 'grid' : 'none';
  document.getElementById('compare-wrap').style.display = mode==='compare' ? 'block': 'none';
  document.getElementById('view-pixel').style.display   = mode==='pixel'   ? 'block': 'none';
  if(mode==='compare'){ syncCmpCanvas(); setCmpPos(.5) }
  if(mode==='pixel'){ syncSoloCanvas() }
}
```

Clicking a `.view-tab` simply toggles which container is visible via `display`. There are **three separate `<canvas>` elements**, each a *copy* of the main result:

- **Split view** (`#pixel-canvas`) — the canonical canvas, shown next to the original image.
- **Compare view** (`#cmp-canvas`):
  ```js
  function syncCmpCanvas(){
    const src = document.getElementById('pixel-canvas');
    // ... sizes the wrapper to match the image's aspect ratio (capped at 400px height)
    cmp.width = src.width; cmp.height = src.height;
    cmp.style.width = '100%'; cmp.style.height = '100%';
    cmp.style.imageRendering = 'pixelated';
    cmp.style.objectFit = 'contain';
    cmp.getContext('2d').drawImage(src, 0, 0);
  }
  ```
  Copies the pixel data from `#pixel-canvas`, but displays it scaled to fill its container (`object-fit: contain`) rather than using a fixed zoom multiplier.
- **Pixel Only view** (`#solo-canvas`):
  ```js
  function syncSoloCanvas(){
    const src = document.getElementById('pixel-canvas');
    solo.width = src.width; solo.height = src.height;
    const z = parseInt(zoomSlider.value);
    solo.style.width  = (src.width  * z) + 'px';
    solo.style.height = (src.height * z) + 'px';
    solo.getContext('2d').drawImage(src, 0, 0);
  }
  ```
  Same idea, but sized using the zoom slider value (capped visually at `480px` max via CSS).

All three are redrawn from `#pixel-canvas` every time pixelation runs or the zoom changes — they're just different "windows" onto the same underlying bitmap.

### 10. Compare Slider Drag Logic

```js
function setCmpPos(frac){
  const pct = (Math.max(0, Math.min(1, frac)) * 100).toFixed(2);
  document.getElementById('compare-pixel').style.clipPath = `inset(0 ${(100-pct).toFixed(2)}% 0 0)`;
  document.getElementById('compare-divider').style.left = pct + '%';
  document.getElementById('compare-handle').style.left = pct + '%';
}
```

- `frac` is a value from `0` to `1` representing the slider's horizontal position.
- `clip-path: inset(0 X% 0 0)` clips the pixelated layer (`#compare-pixel`) from the **right** edge — so `pct%` of it (from the left) remains visible, revealing the original image underneath for the rest.
- The divider line and the `↔` drag handle are positioned at the same `pct%`.

**Drag handling:**
```js
cmpWrap.addEventListener('mousedown', e => { cmpDragging = true; moveCmp(e) });
addEventListener('mousemove', e => { if(cmpDragging) moveCmp(e) });
addEventListener('mouseup', () => cmpDragging = false);

function moveCmp(e){
  const r = cmpWrap.getBoundingClientRect();
  setCmpPos((e.clientX - r.left) / r.width);
}
```
Mouse (and touch, via equivalent `touchstart`/`touchmove`/`touchend` listeners) position is converted into a `0–1` fraction relative to the container's width, then fed into `setCmpPos`. Because this only changes a CSS `clip-path`, dragging is extremely smooth — no canvas redraw happens during drag.

### 11. Eyedropper Color Picker

```js
pixelCanvas.addEventListener('mousemove', e => {
  const rect = pixelCanvas.getBoundingClientRect();
  const z = parseInt(zoomSlider.value);
  const cx = Math.floor((e.clientX - rect.left) / z);
  const cy = Math.floor((e.clientY - rect.top) / z);
  if(cx<0||cy<0||cx>=pixelCanvas.width||cy>=pixelCanvas.height){ tip.style.display='none'; return }
  const px = pixelCanvas.getContext('2d').getImageData(cx, cy, 1, 1).data;
  const hex = `#${[px[0],px[1],px[2]].map(v=>v.toString(16).padStart(2,'0')).join('')}`;
  // ... show tooltip with color swatch + hex + coordinates
});
```

1. Get the mouse position relative to the canvas element.
2. Divide by the current zoom factor `z` to convert **display pixels** back to **canvas-buffer pixels** (since the canvas is CSS-scaled up by `z`).
3. `getImageData(cx, cy, 1, 1)` reads the RGBA value of that single pixel.
4. Convert each of the R, G, B values to a 2-digit hex string and concatenate into `#rrggbb`.
5. Display this in a floating tooltip alongside the pixel's `(x, y)` coordinates.

**On click**, the same coordinate math runs, and the hex value is copied to the clipboard via `navigator.clipboard.writeText(hex)`, with a toast confirmation.

### 12. Download System

```js
function dlAs(type){
  if(!srcImg){ toast('Load an image first!'); return }
  const c = document.getElementById('pixel-canvas');
  const mime = type==='jpg' ? 'image/jpeg' : type==='webp' ? 'image/webp' : 'image/png';
  const a = document.createElement('a');
  a.download = `pixier_${c.width}x${c.height}.${type}`;
  a.href = c.toDataURL(mime, .95);
  a.click();
  toast(`Saved as ${type.toUpperCase()}`);
}
```

- Reads directly from `#pixel-canvas` — the **small, native-resolution canvas** (e.g. 64×64), *not* any zoomed/CSS-scaled view.
- `canvas.toDataURL(mime, quality)` serializes the canvas's internal pixel buffer into a Base64-encoded image of the chosen format. The `.95` quality argument applies to JPG/WebP (PNG ignores it).
- A temporary `<a>` element with the `download` attribute is created and programmatically clicked, triggering the browser's save dialog.
- The filename includes the actual output dimensions, e.g. `pixier_64x64.png`.
- **The exported file is genuinely small** (e.g. 64×64 pixels) — opening it in any other program will show the same blocky look if that program also uses nearest-neighbor zoom, because the blockiness is a property of the file's actual resolution, not a visual trick.

### 13. Toast Notifications

```js
let tt;
function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(tt);
  tt = setTimeout(() => el.classList.remove('show'), 2800);
}
```

A single reusable `#toast` element. Setting its text and adding the `show` class triggers a CSS transition (defined in `index.css`) to slide it into view. After `2.8` seconds it's hidden again. `clearTimeout(tt)` ensures that if a new toast appears before the old one finishes, the timer restarts properly.

## Data Flow Summary

```
User selects/drops a file
        │
        ▼
   loadFile() → srcImg (Image object — the ONE source of truth, never mutated)
        │
        ▼
   [User clicks "Pixelate!"] → (5s cosmetic delay) → doPixelate()
        │
        ▼
   doPixelate():
     1. Read pw, ph, scaleMode
     2. Compute sw, sh, and source rect (sx,sy,sW,sH) based on scaleMode
     3. drawImage(srcImg, ...) into a tiny offscreen canvas  ← THE ACTUAL PIXELATION
     4. Copy that tiny canvas → #pixel-canvas (the canonical result, still tiny)
     5. applyZoom() → CSS-scale #pixel-canvas up with `pixelated` rendering
     6. syncCmpCanvas() → copy #pixel-canvas → #cmp-canvas (for Compare view)
     7. syncSoloCanvas() → copy #pixel-canvas → #solo-canvas (for Pixel Only view)
        │
        ├──► Eyedropper reads getImageData() directly from #pixel-canvas
        │
        └──► Download reads #pixel-canvas.toDataURL() directly (native small size)

[Any later change to width/height/chips/scaleMode/zoom]
        │
        ▼
   schedulePx() → debounce 120ms → doPixelate() again (steps 1–7 repeat)
```

---

## Browser Support

PixieR relies on standard, widely-supported web APIs:

- `Canvas 2D API` (`drawImage`, `getImageData`, `toDataURL`)
- `FileReader API`
- `clipboard.writeText`
- CSS `image-rendering: pixelated`
- `localStorage` / `sessionStorage`

Works in all modern evergreen browsers (Chrome, Firefox, Edge, Safari). No build step, no dependencies, no bundler — just open `index.html`.

---

## AI Usage Disclosure

This project was developed with the assistance of AI tools. Specifically, AI was used for:

- **UI development** — assistance with layout, component structure, and interactive elements.
- **Bug fixing** — identifying and resolving issues during development.
- **Writing this README.md** — documentation and explanation of the codebase.

The core logic, features, and overall project direction were designed and implemented by the project author. AI was used as a development aid, not as the sole author of the project.

---

## License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Cryskyy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

See the [LICENSE](LICENSE) file for the full text.
