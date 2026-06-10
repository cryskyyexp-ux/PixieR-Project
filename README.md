# 🎨 PixieR Studio

**PixieR Studio** is an all-in-one web application for creating pixel art, frame-by-frame animation, and short video clips. With a retro-meets-modern interface, PixieR is perfect for pixel artists, GIF animators, YouTube thumbnail creators, and retro game asset designers.

![PixieR Studio Preview](https://pixier.netlify.app/)

---

## ✨ Key Features

### 🎬 Clipping Mode (Short-form Video)
- Timeline with frame controls and adjustable FPS animation
- Export to **WebM**, **MP4**, and **GIF** (animation)
- Resolution presets for YouTube Shorts, TikTok, Reels (9:16, 16:9)
- Watermark, text overlay, and real-time video filters (VHS, CRT, Glitch, Vaporwave, etc.)
- Direct canvas recording to video

### 🎨 Art Mode (Pixel Art & Game Dev)
- Complete toolset: Pencil, Eraser, Bucket, Eyedropper, Line, Circle, Rectangle, Gradient, Dithering
- **Layer system** with opacity, blend modes, visibility, and locking
- **Onion Skin** for accurate frame animation
- Palette editor + preset color schemes (Neon, Retro, GameBoy, NES, Pastel, Earth)
- Export options: Sprite Sheet, PNG Sequence (ZIP), CSS Variables, Unity/Godot JSON

### 🧠 Smart Tools
- Automatic dithering (Floyd-Steinberg, Atkinson, Bayer)
- AI Upscale 2x / 4x (pixel-perfect resampling)
- Auto Outline (stroke generator)
- Mockup exports (GameBoy, iPhone, TV, Arcade cabinet)
- Tile grid & tilemap preview

### 🎚️ Professional Experience
- Undo / Redo (up to 20 steps)
- Zoom & pan canvas (scroll wheel + buttons)
- Full keyboard shortcuts (see below)
- Dark / Light mode with auto persistence
- Autosave to localStorage & full project export (.json)

---

## ▶️ Live Demo

> **Note:** Because this is a single HTML file, simply open `index.html` in any modern browser (Chrome, Edge, Firefox). No server required.

If deployed to GitHub Pages or any static host, the app runs instantly.

---

## 🖥️ How to Use

### 1. Opening / Running
- Download the `index.html` file (and any assets if separated)
- Double-click or drag into your browser
- Best experienced on screens 1280x720 or larger

### 2. Create a New Canvas
- Click the **New** button in the header
- Or use quick presets: 480×270 (16:9), 128×128, 256×256, 270×480 (9:16)

### 3. Drawing Pixels
- Select the **Pencil (P)** tool, adjust brush size (1px, 3px, 5px, 8px)
- Use the color palette on the right panel
- Right-click any palette swatch to set **secondary color**

### 4. Animation
- Add new frames with the **+** button in the timeline
- Enable **Onion Skin** (Art Mode) to see previous frames as ghost overlay
- Set FPS (6–60) and press **Play (▶️)** to preview
- Export as **GIF** or **video (WebM/MP4)**

### 5. Exporting Your Work
- **Export PNG** → current frame as PNG
- **PNG Sequence (ZIP)** → all frames in a single ZIP folder
- **Sprite Sheet** → all frames arranged in a grid
- **Video** → record timeline into video file (optional audio track)

---

## ⌨️ Keyboard Shortcuts

| Key | Function |
|-----|----------|
| `P` | Pencil tool |
| `E` | Eraser tool |
| `B` | Bucket fill |
| `I` | Eyedropper |
| `R` | Rectangle select |
| `M` | Move (drag current layer) |
| `L` | Line tool |
| `C` | Circle tool |
| `T` | Text tool |
| `G` | Gradient tool |
| `D` | Dithering tool |
| `H` | Toggle grid |
| `Z` / `[` `]` | Zoom in / out |
| `F` | Fit to screen |
| `Space` | Play / pause animation |
| `←` / `→` | Previous / Next frame |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + S` | Save project (.json) |
| `Ctrl + E` | Quick export PNG |
| `Delete` / `Backspace` | Cut selection |

---

## 🧩 Technology Stack

- **HTML5 Canvas** – pixel-perfect rendering
- **Vanilla JavaScript** – no frameworks, lightweight performance
- **FileSaver.js** – file saving
- **JSZip** – batch image packaging
- **GIF.js** (lazy-loaded) – GIF encoding when needed
- **Font Awesome 6** – icons
- **Google Fonts** – Inter & Press Start 2P

---

## 📁 Project Structure

| File | Purpose |
|------|---------|
| **index.html** | The entire PixieR Studio application. Contains all HTML structure, CSS styling, and JavaScript logic in one file. |
| **icon.png** | Browser tab icon (favicon). Shown next to the page title. |
| **dev-check.js** | Detects if user is on a mobile device. Redirects to a friendly notice because the app is optimized for desktop/laptop screens. |
| **README.md** | Project documentation (this file). |

---

> All code is contained in one HTML file for easy distribution. The `dev-check.js` script ensures optimal experience by redirecting mobile users to a friendly notice.

---

## 📄 License

**MIT License** – Free to use, modify, and distribute for personal or commercial projects.

---

## 🙌 Contributing

Pull requests are welcome! Please open an issue first to discuss major changes. Report bugs or request features via GitHub Issues.

---

## 💬 Credits

- Pixel art community for continuous inspiration
- Open-source libraries: FileSaver.js, JSZip, GIF.js
- Icons by Font Awesome

---

**PixieR Studio** — *where pixels become stories*
