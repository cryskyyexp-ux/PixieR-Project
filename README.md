# PixieR 🎨

> **Turn any image into pixel art - live, in your browser. No uploads. No API. No BS.**

![PixieR Banner](https://img.shields.io/badge/PixieR-Beta-a29bfe?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHJlY3QgeD0iMiIgeT0iMiIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI2ZmNmI2YiIvPjxyZWN0IHg9IjE0IiB5PSIyIiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjNGVjZGM0Ii8+PHJlY3QgeD0iMiIgeT0iMTQiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNhMjliZmUiLz48cmVjdCB4PSIxNCIgeT0iMTQiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmU2NmQiLz48L3N2Zz4=)
![Version](https://img.shields.io/badge/version-2.0.0-4ecdc4?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-ff6b6b?style=flat-square)
![No Server](https://img.shields.io/badge/server-none-fd79a8?style=flat-square)
![Zero Dependencies](https://img.shields.io/badge/dependencies-0-55efc4?style=flat-square)

---

## ✨ What is PixieR?

PixieR is a **zero-dependency, client-side pixel art converter** built as a single HTML file. Open it in any modern browser and start converting images to pixel art instantly - with a realtime live preview that updates as you tweak settings.

And this project was inspired by Pixilart.com :)

No install. No account. No server. Your images never leave your device.

---

## 🖥️ Features

| Feature | Details |
|---|---|
| 📁 Upload | Drag & drop or click - PNG, JPG, WEBP, GIF, BMP |
| 🔴 Realtime Preview | Canvas updates live as you change any setting (120ms debounce) |
| 📐 Custom Grid Size | Freeform input for width & height - from 4×4 to 1024×1024 |
| 🔗 Linked Dimensions | Toggle W=H lock for perfect square pixel grids |
| ⚡ Preset Chips | One-click presets: 16, 32, 64, 128, 256 |
| 🎭 Scale Modes | **Fit** (preserve ratio), **Stretch** (fill grid), **Crop** (center) |
| 🔍 Zoom Slider | Preview scale from 1× to 20× (CSS zoom, no re-render) |
| 🎨 Eyedropper | Hover pixels to see exact hex color, click to copy to clipboard |
| 🌙 Dark / Light Mode | Full dark mode with animated grid background in both |
| ✨ Grid Background | Interactive grid: cells glow softly around your cursor |
| ⬇️ Export | Download result as PNG, JPG, or WebP |
| 🔒 100% Private | Everything runs in your browser - zero server communication |

---

## 📖 Quick Start

```bash
# Option 1 - just open it
open pixier.html   # macOS
start pixier.html  # Windows
xdg-open pixier.html  # Linux

# Option 2 - serve locally (optional, not required)
npx serve .
python3 -m http.server 8080
```

That's it !.

---

## 📖 How to Use

### 1. Load an Image
Drop any image onto the upload zone, or click **Choose File**.  
A preview appears immediately inside the upload card with filename and dimensions.

### 2. Set Pixel Grid Size
- Type any **width** and **height** (4–1024)
- Or tap a **preset chip**: 16 / 32 / 64 / 128 / 256
- Enable the **🔗 link button** to keep W = H
- Preview regenerates automatically - no button to press

### 3. Choose Scale Mode
| Mode | Behavior |
|---|---|
| **Fit** | Shrinks to fit inside the grid while preserving aspect ratio |
| **Stretch** | Fills the full W×H grid, may distort |
| **Crop** | Center-crops the image to exactly W×H |

### 4. Adjust Zoom
The zoom slider scales the canvas display only (1×–20×).  
The actual pixel resolution stays the same - zoom doesn't affect your download.

### 5. Eyedropper
Hover over any pixel in the output canvas to see its hex color.  
**Click** to copy it to your clipboard.

### 6. Download
Click **PNG**, **JPG**, or **WebP** to save the pixel art.  
File is named `pixier_{W}x{H}.ext` automatically.

---

### How pixelation works

```
Original image
  └─ drawImage(src, 0,0, pixelW, pixelH)     ← browser bicubic downsaple
       └─ result: tiny W×H canvas
            └─ displayed at zoom× via CSS     ← crisp pixelated rendering
```

Each output "pixel" is literally one canvas pixel (1×1 pt), upscaled with CSS  
`image-rendering: pixelated` for the hard-edge retro look.

---

## 🎨 Design System

```
Color Palette:
  --a1  #ff6b6b  Coral red
  --a2  #4ecdc4  Teal
  --a3  #ffe66d  Yellow
  --a4  #a29bfe  Lavender (primary accent)
  --a5  #fd79a8  Pink
  --a6  #55efc4  Mint

Typography: Segoe UI → system-ui → sans-serif
Border radius: 16px cards, 9px controls, 99px chips/pills
Grid cell size: 34×34 px
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Language | Vanilla JavaScript (ES2020) |
| Rendering | HTML5 Canvas |
| Styling | CSS custom properties, no framework |
| Dependencies | **Zero** |
| Build step | **None** |
| Server | **None** |
| File size | ~ ??? KB (Zip/7z, Im lazy to check fr) |

---

## 🗺️ Roadmap

- [ ] Color palette reducer (limit output to N colors)
- [ ] Dithering modes (Floyd-Steinberg, Bayer)
- [ ] Grid overlay toggle (show pixel grid lines on output)
- [ ] Side-by-side slider comparison
- [ ] Copy pixel art as CSS `box-shadow` string
- [ ] Paste image from clipboard (Ctrl+V)
- [ ] Undo history
- [ ] Mobile touch support improvements

---

## 📜 License

MIT - do whatever you want, credit is nice but not required.

---

## 👾 Credits

Built with the Canvas, a dash of obsession over pixel grids, and zero external dependencies.

> *"Every image is just a very, very low resolution version of itself."* - PixieR, probably