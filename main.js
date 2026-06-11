// ============================================================
// PXT FORMAT (PixieR proprietary - obfuscated with signature)
// ============================================================
const PXT_MAGIC = "PIXR2025";
const PXT_VERSION = 2;

function encodePXT(projectData) {
  const json = JSON.stringify(projectData);
  // XOR obfuscation with rolling key derived from magic
  const key = PXT_MAGIC.split('').map(c => c.charCodeAt(0));
  let out = '';
  for (let i = 0; i < json.length; i++) {
    out += String.fromCharCode(json.charCodeAt(i) ^ key[i % key.length]);
  }
  // Base64 + magic header
  return PXT_MAGIC + ':' + PXT_VERSION + ':' + btoa(unescape(encodeURIComponent(out)));
}

function decodePXT(raw) {
  try {
    const parts = raw.split(':');
    if (parts[0] !== PXT_MAGIC) throw new Error('Invalid PXT file');
    const ver = parseInt(parts[1]);
    const b64 = parts.slice(2).join(':');
    const decoded = decodeURIComponent(escape(atob(b64)));
    const key = PXT_MAGIC.split('').map(c => c.charCodeAt(0));
    let json = '';
    for (let i = 0; i < decoded.length; i++) {
      json += String.fromCharCode(decoded.charCodeAt(i) ^ key[i % key.length]);
    }
    return JSON.parse(json);
  } catch(e) {
    throw new Error('Cannot read this file. It may be corrupted or not a PixieR file.');
  }
}

// ============================================================
// TABS SYSTEM
// ============================================================
let TABS = [];
let ACTIVE_TAB = null;
let TAB_COUNTER = 0;

function createTabState(name, w, h, pixW, pixH, fps) {
  return {
    id: ++TAB_COUNTER,
    name: name || `Untitled ${TAB_COUNTER}`,
    unsaved: true,
    canvasWidth: w || 400,
    canvasHeight: h || 400,
    pixelW: pixW || 20,
    pixelH: pixH || 20,
    fps: fps || 12,
    mode: 'clipping',
    frames: [],
    layersCache: {},
    currentFrameIndex: 0,
    activeLayerIndex: 0,
    palette: [...PALETTES.neon],
    primaryColor: '#5B5FFF',
    secondaryColor: '#FFFFFF',
    zoom: 1,
    showGrid: true,
    showSafeZone: true,
    currentFilter: null,
    speed: 1,
    tileSize: 16,
    tileGridVisible: false,
    ditheringMode: 'none',
    antiAlias: false,
    onionSkin: false,
    audioFile: null,
    audioFileName: null,
    textObjects: [], // draggable text objects
  };
}

function newTab(opts) {
  const tab = createTabState(opts && opts.name, opts && opts.w, opts && opts.h, opts && opts.pixW, opts && opts.pixH, opts && opts.fps);
  TABS.push(tab);
  renderTabBar();
  switchToTab(tab.id);
  // Initialize frames
  addFrameToTab(tab);
  setCurrentFrame(0);
  return tab;
}

function switchToTab(id) {
  // Save current state before switching
  if (ACTIVE_TAB) saveCurrentStateToTab(ACTIVE_TAB);

  ACTIVE_TAB = TABS.find(t => t.id === id);
  if (!ACTIVE_TAB) return;

  // Restore state
  APP.canvasWidth = ACTIVE_TAB.canvasWidth;
  APP.canvasHeight = ACTIVE_TAB.canvasHeight;
  APP.pixelW = ACTIVE_TAB.pixelW;
  APP.pixelH = ACTIVE_TAB.pixelH;
  APP.fps = ACTIVE_TAB.fps;
  APP.currentFrameIndex = ACTIVE_TAB.currentFrameIndex;
  APP.activeLayerIndex = ACTIVE_TAB.activeLayerIndex;
  APP.primaryColor = ACTIVE_TAB.primaryColor;
  APP.secondaryColor = ACTIVE_TAB.secondaryColor;
  APP.zoom = ACTIVE_TAB.zoom;
  APP.showGrid = ACTIVE_TAB.showGrid;
  APP.showSafeZone = ACTIVE_TAB.showSafeZone;
  APP.currentFilter = ACTIVE_TAB.currentFilter;
  APP.speed = ACTIVE_TAB.speed;
  APP.tileSize = ACTIVE_TAB.tileSize;
  APP.tileGridVisible = ACTIVE_TAB.tileGridVisible;
  APP.ditheringMode = ACTIVE_TAB.ditheringMode;
  APP.antiAlias = ACTIVE_TAB.antiAlias;
  APP.onionSkin = ACTIVE_TAB.onionSkin;
  PALETTE = [...ACTIVE_TAB.palette];
  FRAMES = ACTIVE_TAB.frames;
  LAYERS_CACHE = ACTIVE_TAB.layersCache;
  TEXT_OBJECTS = ACTIVE_TAB.textObjects;

  // Resize canvases
  [mainCanvas, gridCanvas, overlayCanvas, safezoneCanvas, textOverlayCanvas].forEach(c => {
    c.width = APP.canvasWidth; c.height = APP.canvasHeight;
  });

  document.getElementById('bb-size').textContent = `${APP.canvasWidth}×${APP.canvasHeight}`;
  document.getElementById('bb-pixel').textContent = `${APP.pixelW}×${APP.pixelH}`;
  document.getElementById('fps-num').value = APP.fps;
  document.getElementById('pixel-w').value = APP.pixelW;
  document.getElementById('pixel-h').value = APP.pixelH;
  if (document.getElementById('pixel-w-art')) { document.getElementById('pixel-w-art').value = APP.pixelW; document.getElementById('pixel-h-art').value = APP.pixelH; }

  updateZoom();
  switchMode(ACTIVE_TAB.mode || 'clipping');
  renderPaletteGrid();
  renderQuickColors();
  setPrimaryColor(APP.primaryColor);
  setCurrentFrame(APP.currentFrameIndex);
  updateTimeline();
  renderTabBar();
  drawGrid();
  drawSafeZone();
  updateTextObjectsList();
  renderTextOverlay();
}

function saveCurrentStateToTab(tab) {
  if (!tab) return;
  tab.canvasWidth = APP.canvasWidth;
  tab.canvasHeight = APP.canvasHeight;
  tab.pixelW = APP.pixelW;
  tab.pixelH = APP.pixelH;
  tab.fps = APP.fps;
  tab.currentFrameIndex = APP.currentFrameIndex;
  tab.activeLayerIndex = APP.activeLayerIndex;
  tab.primaryColor = APP.primaryColor;
  tab.secondaryColor = APP.secondaryColor;
  tab.zoom = APP.zoom;
  tab.showGrid = APP.showGrid;
  tab.showSafeZone = APP.showSafeZone;
  tab.currentFilter = APP.currentFilter;
  tab.speed = APP.speed;
  tab.tileSize = APP.tileSize;
  tab.tileGridVisible = APP.tileGridVisible;
  tab.ditheringMode = APP.ditheringMode;
  tab.antiAlias = APP.antiAlias;
  tab.onionSkin = APP.onionSkin;
  tab.palette = [...PALETTE];
  tab.frames = FRAMES;
  tab.layersCache = LAYERS_CACHE;
  tab.textObjects = TEXT_OBJECTS;
  tab.mode = APP.mode;
}

function closeTab(id) {
  if (TABS.length <= 1) { toast('Cannot close last tab','error'); return; }
  const idx = TABS.findIndex(t => t.id === id);
  TABS.splice(idx, 1);
  if (ACTIVE_TAB && ACTIVE_TAB.id === id) {
    const nextIdx = Math.min(idx, TABS.length - 1);
    ACTIVE_TAB = null;
    switchToTab(TABS[nextIdx].id);
  } else {
    renderTabBar();
  }
}

function renderTabBar() {
  const bar = document.getElementById('tab-bar');
  // Keep add button
  const addBtn = bar.querySelector('.tab-add-btn');
  bar.innerHTML = '';

  TABS.forEach(tab => {
    const el = document.createElement('div');
    el.className = 'pxt-tab' + (tab.id === (ACTIVE_TAB && ACTIVE_TAB.id) ? ' active' : '') + (tab.unsaved ? ' unsaved' : '');
    el.innerHTML = `<span class="tab-dot"></span><span class="tab-name" title="${tab.name}">${tab.name}</span><button class="tab-close-btn" onclick="event.stopPropagation();closeTab(${tab.id})">✕</button>`;
    el.onclick = () => switchToTab(tab.id);
    // Double click to rename
    el.querySelector('.tab-name').ondblclick = (e) => {
      e.stopPropagation();
      const n = prompt('Rename tab:', tab.name);
      if (n && n.trim()) { tab.name = n.trim(); renderTabBar(); }
    };
    bar.appendChild(el);
  });

  if (addBtn) bar.appendChild(addBtn);
  else {
    const btn = document.createElement('button');
    btn.className = 'tab-add-btn';
    btn.textContent = '+';
    btn.onclick = () => newTab();
    bar.appendChild(btn);
  }
}

// ============================================================
// APP STATE
// ============================================================
let APP = {
  mode: 'clipping', currentTool: 'pencil', brushSize: 1,
  primaryColor: '#5B5FFF', secondaryColor: '#FFFFFF',
  zoom: 1, showGrid: true, showSafeZone: true, antiAlias: false, onionSkin: false,
  isPlaying: false, fps: 12, currentFrameIndex: 0, playInterval: null, isDark: false,
  speed: 1, tileSize: 16, tileGridVisible: false, currentFilter: null,
  ditheringMode: 'none', activeLayerIndex: 0, isRecording: false,
  canvasWidth: 400, canvasHeight: 400, pixelW: 20, pixelH: 20,
  selection: null, isSelecting: false, selStart: null, copyBuffer: null,
  isDragging: false, lastX: 0, lastY: 0, isPainting: false,
  shiftPressed: false, ctrlPressed: false, altPressed: false,
};

let FRAMES = [];
let LAYERS_CACHE = {};
let TEXT_OBJECTS = []; // {id, text, x, y, font, size, color, outline, align, style, spacing, selected}
let SELECTED_TEXT_OBJ = null;
let TEXT_DRAG_OFFSET = {x:0, y:0};
let TEXT_IS_DRAGGING = false;

const mainCanvas = document.getElementById('main-canvas');
const gridCanvas = document.getElementById('grid-canvas');
const overlayCanvas = document.getElementById('overlay-canvas');
const safezoneCanvas = document.getElementById('safezone-canvas');
const textOverlayCanvas = document.getElementById('text-overlay-canvas');
const ctx = mainCanvas.getContext('2d');
const gridCtx = gridCanvas.getContext('2d');
const overlayCtx = overlayCanvas.getContext('2d');
const sfzCtx = safezoneCanvas.getContext('2d');
const txtCtx = textOverlayCanvas.getContext('2d');

// ============================================================
// CANVAS INIT
// ============================================================
function initCanvas(w, h, pixW, pixH) {
  APP.canvasWidth = w; APP.canvasHeight = h;
  APP.pixelW = pixW || APP.pixelW || 20;
  APP.pixelH = pixH || APP.pixelH || 20;
  [mainCanvas, gridCanvas, overlayCanvas, safezoneCanvas, textOverlayCanvas].forEach(c => {
    c.width = w; c.height = h;
  });
  document.getElementById('bb-size').textContent = `${w}×${h}`;
  document.getElementById('bb-pixel').textContent = `${APP.pixelW}×${APP.pixelH}`;
  FRAMES = []; LAYERS_CACHE = {}; TEXT_OBJECTS = [];
  if (ACTIVE_TAB) { ACTIVE_TAB.frames = FRAMES; ACTIVE_TAB.layersCache = LAYERS_CACHE; ACTIVE_TAB.textObjects = TEXT_OBJECTS; }
  addFrameToTab(ACTIVE_TAB);
  setCurrentFrame(0);
  updateZoom(); drawGrid(); drawSafeZone();
}

function setPixelSize() {
  const w = parseInt(document.getElementById('pixel-w').value) || 20;
  const h = parseInt(document.getElementById('pixel-h').value) || 20;
  APP.pixelW = Math.max(1, Math.min(200, w));
  APP.pixelH = Math.max(1, Math.min(200, h));
  document.getElementById('pixel-w').value = APP.pixelW;
  document.getElementById('pixel-h').value = APP.pixelH;
  if (document.getElementById('pixel-w-art')) {
    document.getElementById('pixel-w-art').value = APP.pixelW;
    document.getElementById('pixel-h-art').value = APP.pixelH;
  }
  document.getElementById('bb-pixel').textContent = `${APP.pixelW}×${APP.pixelH}`;
  if (ACTIVE_TAB) { ACTIVE_TAB.pixelW = APP.pixelW; ACTIVE_TAB.pixelH = APP.pixelH; }
  toast(`Pixel: ${APP.pixelW}×${APP.pixelH}`, 'info');
}

function setPixelSizePreset(w, h) {
  document.getElementById('pixel-w').value = w;
  document.getElementById('pixel-h').value = h;
  if (document.getElementById('pixel-w-art')) { document.getElementById('pixel-w-art').value = w; document.getElementById('pixel-h-art').value = h; }
  setPixelSize();
}

// ============================================================
// LAYER SYSTEM
// ============================================================
function getFrameLayers(fi) {
  if (!LAYERS_CACHE[fi]) {
    const lc = document.createElement('canvas');
    lc.width = APP.canvasWidth; lc.height = APP.canvasHeight;
    LAYERS_CACHE[fi] = [{canvas:lc,name:'Layer 1',visible:true,opacity:1,blendMode:'source-over',locked:false}];
  }
  return LAYERS_CACHE[fi];
}
function getActiveLayer() {
  return getFrameLayers(APP.currentFrameIndex)[APP.activeLayerIndex] || getFrameLayers(APP.currentFrameIndex)[0];
}
function addLayer() {
  const layers = getFrameLayers(APP.currentFrameIndex);
  const lc = document.createElement('canvas');
  lc.width = APP.canvasWidth; lc.height = APP.canvasHeight;
  layers.push({canvas:lc,name:`Layer ${layers.length+1}`,visible:true,opacity:1,blendMode:'source-over',locked:false});
  APP.activeLayerIndex = layers.length - 1;
  renderLayers(); updateLayersPanel(); toast('Layer added','success');
}
function deleteLayer(idx) {
  const layers = getFrameLayers(APP.currentFrameIndex);
  if (layers.length <= 1) { toast('Cannot delete last layer','error'); return; }
  layers.splice(idx, 1);
  APP.activeLayerIndex = Math.min(APP.activeLayerIndex, layers.length - 1);
  renderLayers(); updateLayersPanel();
}
function renderLayers() {
  ctx.clearRect(0, 0, APP.canvasWidth, APP.canvasHeight);
  getFrameLayers(APP.currentFrameIndex).forEach(layer => {
    if (!layer.visible) return;
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blendMode;
    ctx.drawImage(layer.canvas, 0, 0);
  });
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  applyActiveFilter();
  updateMinimap(); updateFrameThumb(APP.currentFrameIndex);
}
function updateLayersPanel() {
  const layers = getFrameLayers(APP.currentFrameIndex);
  const list = document.getElementById('layers-list');
  list.innerHTML = '';
  [...layers].reverse().forEach((layer, rIdx) => {
    const idx = layers.length - 1 - rIdx;
    const item = document.createElement('div');
    item.className = 'layer-item' + (idx === APP.activeLayerIndex ? ' active' : '');
    item.onclick = () => { APP.activeLayerIndex = idx; updateLayersPanel(); syncLayerControls(); };
    item.innerHTML = `
      <button class="layer-vis" onclick="event.stopPropagation();toggleLayerVis(${idx})">${layer.visible?'👁':'🚫'}</button>
      <button class="layer-lock" onclick="event.stopPropagation();toggleLayerLock(${idx})">${layer.locked?'🔒':'🔓'}</button>
      <span class="layer-name">${layer.name}</span>
      <button class="layer-del" onclick="event.stopPropagation();deleteLayer(${idx})"><i class="fa fa-trash"></i></button>`;
    list.appendChild(item);
  });
  syncLayerControls();
}
function toggleLayerVis(idx) { const l=getFrameLayers(APP.currentFrameIndex)[idx]; l.visible=!l.visible; renderLayers(); updateLayersPanel(); }
function toggleLayerLock(idx) { const l=getFrameLayers(APP.currentFrameIndex)[idx]; l.locked=!l.locked; updateLayersPanel(); }
function syncLayerControls() {
  const layer = getActiveLayer(); if (!layer) return;
  document.getElementById('layer-opacity').value = Math.round(layer.opacity*100);
  document.getElementById('layer-opacity-val').textContent = Math.round(layer.opacity*100)+'%';
  document.getElementById('blend-mode-select').value = layer.blendMode;
}
function setLayerOpacity(v) { const l=getActiveLayer(); if(!l) return; l.opacity=v/100; document.getElementById('layer-opacity-val').textContent=v+'%'; renderLayers(); }
function setBlendMode(v) { const l=getActiveLayer(); if(!l) return; l.blendMode=v; renderLayers(); }

// ============================================================
// HISTORY
// ============================================================
const historyManager = {
  history:[], future:[], max:25,
  save() {
    const layers = getFrameLayers(APP.currentFrameIndex);
    const snap = layers.map(layer => {
      const tc = document.createElement('canvas'); tc.width=APP.canvasWidth; tc.height=APP.canvasHeight;
      tc.getContext('2d').drawImage(layer.canvas,0,0); return tc;
    });
    this.history.push({fi:APP.currentFrameIndex, snap});
    if (this.history.length > this.max) this.history.shift();
    this.future = [];
    if (ACTIVE_TAB) ACTIVE_TAB.unsaved = true;
    renderTabBar();
  },
  undo() {
    if (!this.history.length) return;
    const {fi, snap} = this.history.pop();
    const layers = getFrameLayers(fi);
    const cur = layers.map(l => { const tc=document.createElement('canvas'); tc.width=APP.canvasWidth; tc.height=APP.canvasHeight; tc.getContext('2d').drawImage(l.canvas,0,0); return tc; });
    this.future.push({fi, snap:cur});
    snap.forEach((s,i) => { if(layers[i]){const lctx=layers[i].canvas.getContext('2d');lctx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);lctx.drawImage(s,0,0);} });
    renderLayers(); toast('Undo','info');
  },
  redo() {
    if (!this.future.length) return;
    const {fi, snap} = this.future.pop();
    const layers = getFrameLayers(fi);
    const cur = layers.map(l => { const tc=document.createElement('canvas'); tc.width=APP.canvasWidth; tc.height=APP.canvasHeight; tc.getContext('2d').drawImage(l.canvas,0,0); return tc; });
    this.history.push({fi, snap:cur});
    snap.forEach((s,i) => { if(layers[i]){const lctx=layers[i].canvas.getContext('2d');lctx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);lctx.drawImage(s,0,0);} });
    renderLayers(); toast('Redo','info');
  }
};

// ============================================================
// FRAMES
// ============================================================
function addFrameToTab(tab) {
  if (!tab) return;
  const fi = FRAMES.length;
  const thumb = document.createElement('canvas'); thumb.width=APP.canvasWidth; thumb.height=APP.canvasHeight;
  FRAMES.push({thumb});
  getFrameLayers(fi);
  updateTimeline();
  return fi;
}
function addFrame() {
  const fi = addFrameToTab(ACTIVE_TAB);
  setCurrentFrame(fi);
  toast(`Frame ${fi+1} added`,'success');
}
function setCurrentFrame(fi) {
  APP.currentFrameIndex = fi;
  APP.activeLayerIndex = Math.min(APP.activeLayerIndex, getFrameLayers(fi).length-1);
  renderLayers(); updateLayersPanel(); updateTimeline(); updateFrameCountLabel();
  if (APP.onionSkin) renderOnionSkin();
}
function updateFrameCountLabel() {
  document.getElementById('frame-count-label').textContent = `Frame ${APP.currentFrameIndex+1}/${FRAMES.length}`;
  const dur = FRAMES.length / (APP.fps * APP.speed);
  document.getElementById('duration-label').textContent = `≈${dur.toFixed(2)}s`;
}
function updateTimeline() {
  const c = document.getElementById('timeline-frames');
  c.innerHTML = '';
  FRAMES.forEach((f,t) => {
    const el = document.createElement('div');
    el.className = 'frame-thumb' + (t===APP.currentFrameIndex?' active':'');
    el.onclick = () => setCurrentFrame(t);
    const fc = document.createElement('canvas'); fc.width=44; fc.height=44;
    const fctx = fc.getContext('2d');
    getFrameLayers(t).forEach(layer => {
      if (!layer.visible) return;
      fctx.globalAlpha = layer.opacity; fctx.globalCompositeOperation = layer.blendMode;
      fctx.drawImage(layer.canvas,0,0,44,44);
    });
    fctx.globalAlpha=1; fctx.globalCompositeOperation='source-over';
    el.appendChild(fc);
    const num = document.createElement('div'); num.className='frame-num'; num.textContent=t+1; el.appendChild(num);
    if (FRAMES.length > 1) {
      const del = document.createElement('button'); del.className='frame-del'; del.textContent='×';
      del.onclick = e => { e.stopPropagation(); deleteFrame(t); }; el.appendChild(del);
    }
    c.appendChild(el);
  });
  const addBtn = document.createElement('button');
  addBtn.className = 'add-frame-btn'; addBtn.textContent='+';
  addBtn.onclick = () => addFrame(); c.appendChild(addBtn);
  updateFrameCountLabel();
}
function deleteFrame(fi) {
  if (FRAMES.length<=1) { toast('Cannot delete last frame','error'); return; }
  FRAMES.splice(fi,1); delete LAYERS_CACHE[fi];
  const n={};
  Object.keys(LAYERS_CACHE).forEach(k => { const ki=parseInt(k); n[ki>=fi?ki-1:ki]=LAYERS_CACHE[k]; });
  Object.keys(LAYERS_CACHE).forEach(k=>delete LAYERS_CACHE[k]);
  Object.assign(LAYERS_CACHE, n);
  APP.currentFrameIndex = Math.min(APP.currentFrameIndex, FRAMES.length-1);
  setCurrentFrame(APP.currentFrameIndex);
}
function updateFrameThumb(fi) { updateTimeline(); }
function prevFrame() { setCurrentFrame(APP.currentFrameIndex>0?APP.currentFrameIndex-1:FRAMES.length-1); }
function nextFrame() { setCurrentFrame(APP.currentFrameIndex<FRAMES.length-1?APP.currentFrameIndex+1:0); }
function togglePlay() {
  APP.isPlaying = !APP.isPlaying;
  const btn = document.getElementById('play-btn');
  if (APP.isPlaying) {
    btn.textContent='⏸'; btn.style.background='var(--accent4)';
    APP.playInterval = setInterval(nextFrame, 1000/(APP.fps*APP.speed));
  } else {
    btn.textContent='▶'; btn.style.background='var(--accent3)';
    clearInterval(APP.playInterval);
  }
}
function stopPlay() {
  APP.isPlaying=false; clearInterval(APP.playInterval);
  const btn=document.getElementById('play-btn'); btn.textContent='▶'; btn.style.background='var(--accent3)';
  setCurrentFrame(0);
}
function setFPS(v) {
  APP.fps = Math.max(1,Math.min(120,parseInt(v)||12));
  document.getElementById('fps-num').value = APP.fps;
  if (ACTIVE_TAB) ACTIVE_TAB.fps = APP.fps;
  if (APP.isPlaying) { clearInterval(APP.playInterval); APP.playInterval=setInterval(nextFrame,1000/(APP.fps*APP.speed)); }
  updateFrameCountLabel();
}
function setSpeed(s) {
  APP.speed=s;
  document.querySelectorAll('.speed-badge').forEach(el => el.classList.toggle('active', parseFloat(el.textContent)===s));
  if (APP.isPlaying) { clearInterval(APP.playInterval); APP.playInterval=setInterval(nextFrame,1000/(APP.fps*APP.speed)); }
  updateFrameCountLabel();
}

// ============================================================
// TOOLS
// ============================================================
function setTool(t) {
  APP.currentTool = t;
  document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active'));
  const btn = document.getElementById('tool-'+t); if(btn) btn.classList.add('active');
  const cursors = {pencil:'crosshair',eraser:'cell',bucket:'cell',eyedropper:'crosshair',selection:'crosshair',move:'grab',line:'crosshair',circle:'crosshair',rect:'crosshair',text:'default',dither:'crosshair',gradient:'crosshair'};
  mainCanvas.style.cursor = cursors[t]||'crosshair';
  textOverlayCanvas.style.cursor = t==='text'?'default':'none';
  textOverlayCanvas.style.pointerEvents = t==='text'?'auto':'none';
}
function setBrush(s) {
  APP.brushSize=s;
  document.querySelectorAll('.brush-btn').forEach(b=>b.classList.remove('active'));
  const btn=document.getElementById('brush-'+s); if(btn) btn.classList.add('active');
}
function getCanvasCoords(e) {
  const rect = mainCanvas.getBoundingClientRect();
  const x = Math.floor((e.clientX-rect.left)/APP.zoom);
  const y = Math.floor((e.clientY-rect.top)/APP.zoom);
  return {x:Math.max(0,Math.min(APP.canvasWidth-1,x)), y:Math.max(0,Math.min(APP.canvasHeight-1,y))};
}

// ============================================================
// DRAW TOOLS
// ============================================================
function drawPixel(x, y, color) {
  const layer = getActiveLayer(); if(!layer||layer.locked) return;
  const lctx = layer.canvas.getContext('2d');
  lctx.fillStyle = color;
  const hw = Math.floor(APP.pixelW/2), hh = Math.floor(APP.pixelH/2);
  // Snap to pixel grid
  const gx = Math.floor(x/APP.pixelW)*APP.pixelW;
  const gy = Math.floor(y/APP.pixelH)*APP.pixelH;
  lctx.fillRect(gx, gy, APP.pixelW, APP.pixelH);
}
function erasePixel(x, y) {
  const layer = getActiveLayer(); if(!layer||layer.locked) return;
  const lctx = layer.canvas.getContext('2d');
  const gx = Math.floor(x/APP.pixelW)*APP.pixelW;
  const gy = Math.floor(y/APP.pixelH)*APP.pixelH;
  lctx.clearRect(gx, gy, APP.pixelW, APP.pixelH);
}
function bucketFill(x, y, color) {
  const layer = getActiveLayer(); if(!layer||layer.locked) return;
  const lctx = layer.canvas.getContext('2d');
  const imgData = lctx.getImageData(0,0,APP.canvasWidth,APP.canvasHeight);
  const d = imgData.data;
  const si = (y*APP.canvasWidth+x)*4;
  const sr=d[si],sg=d[si+1],sb=d[si+2],sa=d[si+3];
  const tc = hexToRgb(color); if(!tc) return;
  if(tc.r===sr&&tc.g===sg&&tc.b===sb&&sa===255) return;
  const stack=[[x,y]], visited=new Set();
  while(stack.length){
    const[cx,cy]=stack.pop(), k=cy*APP.canvasWidth+cx;
    if(visited.has(k)||cx<0||cx>=APP.canvasWidth||cy<0||cy>=APP.canvasHeight) continue;
    const i=k*4;
    if(Math.abs(d[i]-sr)>32||Math.abs(d[i+1]-sg)>32||Math.abs(d[i+2]-sb)>32||Math.abs(d[i+3]-sa)>32) continue;
    visited.add(k); d[i]=tc.r; d[i+1]=tc.g; d[i+2]=tc.b; d[i+3]=255;
    stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
  }
  lctx.putImageData(imgData,0,0);
}
function eyedropper(x,y) { const d=ctx.getImageData(x,y,1,1).data; setPrimaryColor(rgbToHex(d[0],d[1],d[2])); }
function drawLine(x0,y0,x1,y1,color) {
  const layer=getActiveLayer(); if(!layer||layer.locked) return;
  const lctx=layer.canvas.getContext('2d');
  let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx-dy;
  lctx.fillStyle=color;
  while(true){
    const gx=Math.floor(x0/APP.pixelW)*APP.pixelW, gy=Math.floor(y0/APP.pixelH)*APP.pixelH;
    lctx.fillRect(gx,gy,APP.pixelW,APP.pixelH);
    if(x0===x1&&y0===y1) break;
    const e2=2*err;
    if(e2>-dy){err-=dy;x0+=sx;}
    if(e2<dx){err+=dx;y0+=sy;}
  }
}
function drawCircle(x0,y0,x1,y1,color,filled) {
  const layer=getActiveLayer(); if(!layer||layer.locked) return;
  const lctx=layer.canvas.getContext('2d');
  const rx=Math.abs(x1-x0), ry=Math.abs(y1-y0);
  lctx.beginPath(); lctx.ellipse(x0+.5,y0+.5,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);
  if(filled){lctx.fillStyle=color;lctx.fill();}else{lctx.strokeStyle=color;lctx.lineWidth=APP.brushSize;lctx.stroke();}
}
function drawRect(x0,y0,x1,y1,color,filled) {
  const layer=getActiveLayer(); if(!layer||layer.locked) return;
  const lctx=layer.canvas.getContext('2d');
  const rx=Math.min(x0,x1),ry=Math.min(y0,y1),rw=Math.abs(x1-x0),rh=Math.abs(y1-y0);
  if(filled){lctx.fillStyle=color;lctx.fillRect(rx,ry,rw,rh);}
  else{lctx.strokeStyle=color;lctx.lineWidth=APP.brushSize;lctx.strokeRect(rx+.5,ry+.5,rw,rh);}
}
function drawGradient(x0,y0,x1,y1) {
  const layer=getActiveLayer(); if(!layer||layer.locked) return;
  const lctx=layer.canvas.getContext('2d');
  const grad=lctx.createLinearGradient(x0,y0,x1,y1);
  grad.addColorStop(0,APP.primaryColor); grad.addColorStop(1,APP.secondaryColor);
  lctx.fillStyle=grad; lctx.fillRect(0,0,APP.canvasWidth,APP.canvasHeight);
}
function applyDither(x,y,color) {
  if(APP.ditheringMode==='none'){drawPixel(x,y,color);return;}
  const bayer=[[0,2],[3,1]];
  const thresh=bayer[y%2][x%2]/4;
  const rgb=hexToRgb(color); if(!rgb) return;
  if((rgb.r+rgb.g+rgb.b)/3/255>thresh) drawPixel(x,y,color);
}

// ============================================================
// CANVAS EVENTS
// ============================================================
let drawState = {active:false,startX:0,startY:0};

mainCanvas.addEventListener('mousedown', e => {
  if(e.button!==0&&e.button!==2) return;
  const {x,y} = getCanvasCoords(e);
  APP.isPainting=true; APP.lastX=x; APP.lastY=y;
  document.getElementById('coords-label').textContent=`${x},${y}`;
  if(APP.currentTool==='pencil'&&APP.ditheringMode!=='none'){historyManager.save();applyDither(x,y,APP.primaryColor);renderLayers();return;}
  switch(APP.currentTool){
    case'pencil':historyManager.save();drawPixel(x,y,e.button===2?APP.secondaryColor:APP.primaryColor);renderLayers();break;
    case'eraser':historyManager.save();erasePixel(x,y);renderLayers();break;
    case'bucket':historyManager.save();bucketFill(x,y,APP.primaryColor);renderLayers();break;
    case'eyedropper':eyedropper(x,y);break;
    case'line':case'circle':case'rect':historyManager.save();drawState={active:true,startX:x,startY:y};break;
    case'selection':APP.isSelecting=true;APP.selStart={x,y};APP.selection=null;overlayCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);break;
    case'gradient':historyManager.save();drawState={active:true,startX:x,startY:y};break;
    case'move':APP.isDragging=true;APP.lastX=e.clientX;APP.lastY=e.clientY;break;
  }
  e.preventDefault();
});

mainCanvas.addEventListener('mousemove', e => {
  const {x,y}=getCanvasCoords(e);
  document.getElementById('coords-label').textContent=`${x},${y}`;
  if(!APP.isPainting) return;
  if(APP.currentTool==='pencil'&&APP.ditheringMode!=='none'){applyDither(x,y,APP.primaryColor);renderLayers();return;}
  switch(APP.currentTool){
    case'pencil':drawPixel(x,y,APP.shiftPressed?APP.secondaryColor:APP.primaryColor);renderLayers();break;
    case'eraser':erasePixel(x,y);renderLayers();break;
    case'line':
      if(drawState.active){overlayCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);overlayCtx.strokeStyle=APP.primaryColor;overlayCtx.lineWidth=APP.brushSize;overlayCtx.beginPath();overlayCtx.moveTo(drawState.startX+.5,drawState.startY+.5);overlayCtx.lineTo(x+.5,y+.5);overlayCtx.stroke();}break;
    case'circle':
      if(drawState.active){overlayCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);const rx=Math.abs(x-drawState.startX),ry=Math.abs(y-drawState.startY);overlayCtx.beginPath();overlayCtx.ellipse(drawState.startX+.5,drawState.startY+.5,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);overlayCtx.strokeStyle=APP.primaryColor;overlayCtx.lineWidth=APP.brushSize;overlayCtx.stroke();}break;
    case'rect':
      if(drawState.active){overlayCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);const rx2=Math.min(drawState.startX,x),ry2=Math.min(drawState.startY,y);overlayCtx.strokeStyle=APP.primaryColor;overlayCtx.lineWidth=APP.brushSize;overlayCtx.strokeRect(rx2+.5,ry2+.5,Math.abs(x-drawState.startX),Math.abs(y-drawState.startY));}break;
    case'selection':
      if(APP.isSelecting&&APP.selStart){overlayCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);overlayCtx.setLineDash([4,4]);overlayCtx.strokeStyle='#5B5FFF';overlayCtx.lineWidth=1/APP.zoom;const rx3=Math.min(APP.selStart.x,x),ry3=Math.min(APP.selStart.y,y);overlayCtx.strokeRect(rx3+.5,ry3+.5,Math.abs(x-APP.selStart.x),Math.abs(y-APP.selStart.y));overlayCtx.setLineDash([]);}break;
    case'gradient':
      if(drawState.active){overlayCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);overlayCtx.strokeStyle=APP.primaryColor;overlayCtx.lineWidth=2;overlayCtx.setLineDash([5,5]);overlayCtx.beginPath();overlayCtx.moveTo(drawState.startX,drawState.startY);overlayCtx.lineTo(x,y);overlayCtx.stroke();overlayCtx.setLineDash([]);}break;
    case'move':
      if(APP.isDragging){const dx=(e.clientX-APP.lastX)/APP.zoom,dy=(e.clientY-APP.lastY)/APP.zoom;APP.lastX=e.clientX;APP.lastY=e.clientY;const layer=getActiveLayer();if(!layer)return;const lctx2=layer.canvas.getContext('2d');const tmp=document.createElement('canvas');tmp.width=APP.canvasWidth;tmp.height=APP.canvasHeight;tmp.getContext('2d').drawImage(layer.canvas,0,0);lctx2.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);lctx2.drawImage(tmp,dx,dy);renderLayers();}break;
  }
});

mainCanvas.addEventListener('mouseup', e => {
  const {x,y}=getCanvasCoords(e);
  if(!APP.isPainting&&!APP.isSelecting) return;
  APP.isPainting=false; APP.isDragging=false;
  switch(APP.currentTool){
    case'line':if(drawState.active){overlayCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);drawLine(drawState.startX,drawState.startY,x,y,APP.primaryColor);renderLayers();drawState.active=false;}break;
    case'circle':if(drawState.active){overlayCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);drawCircle(drawState.startX,drawState.startY,x,y,APP.primaryColor,APP.shiftPressed);renderLayers();drawState.active=false;}break;
    case'rect':if(drawState.active){overlayCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);drawRect(drawState.startX,drawState.startY,x,y,APP.primaryColor,APP.shiftPressed);renderLayers();drawState.active=false;}break;
    case'selection':if(APP.isSelecting&&APP.selStart){APP.selection={x:Math.min(APP.selStart.x,x),y:Math.min(APP.selStart.y,y),w:Math.abs(x-APP.selStart.x),h:Math.abs(y-APP.selStart.y)};APP.isSelecting=false;}break;
    case'gradient':if(drawState.active){overlayCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);drawGradient(drawState.startX,drawState.startY,x,y);renderLayers();drawState.active=false;}break;
  }
});
mainCanvas.addEventListener('contextmenu',e=>e.preventDefault());
mainCanvas.addEventListener('mouseleave',()=>{if(APP.isPainting){APP.isPainting=false;if(drawState.active){overlayCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);drawState.active=false;}renderLayers();}});
document.getElementById('canvas-wrapper').addEventListener('wheel',e=>{e.preventDefault();changeZoom(e.deltaY<0?.25:-.25);},{passive:false});

// ============================================================
// TEXT OBJECTS (Draggable - Photoshop style)
// ============================================================
let textObjCounter = 0;
function addTextObject() {
  const text = document.getElementById('text-input-field').value;
  if (!text.trim()) { toast('Enter text first','error'); return; }
  const obj = {
    id: ++textObjCounter,
    text,
    x: APP.canvasWidth/2,
    y: APP.canvasHeight/2,
    font: document.getElementById('text-font').value,
    size: parseInt(document.getElementById('text-size').value)||24,
    color: document.getElementById('text-color').value,
    outline: document.getElementById('text-outline').value,
    align: document.getElementById('text-align').value,
    style: document.getElementById('text-style').value,
    spacing: parseInt(document.getElementById('text-spacing').value)||0,
    selected: false,
  };
  TEXT_OBJECTS.push(obj);
  selectTextObj(obj.id);
  renderTextOverlay();
  updateTextObjectsList();
  if (ACTIVE_TAB) ACTIVE_TAB.textObjects = TEXT_OBJECTS;
  toast('Text added! Drag to reposition','success');
}

function selectTextObj(id) {
  TEXT_OBJECTS.forEach(o => o.selected = (o.id===id));
  SELECTED_TEXT_OBJ = TEXT_OBJECTS.find(o=>o.id===id)||null;
  renderTextOverlay();
  updateTextObjectsList();
}

function deleteTextObject(id) {
  const idx = TEXT_OBJECTS.findIndex(o=>o.id===id);
  if(idx>-1) TEXT_OBJECTS.splice(idx,1);
  if(SELECTED_TEXT_OBJ&&SELECTED_TEXT_OBJ.id===id) SELECTED_TEXT_OBJ=null;
  renderTextOverlay(); updateTextObjectsList();
}

function updateTextObjectsList() {
  const list = document.getElementById('text-objects-list');
  list.innerHTML = '';
  TEXT_OBJECTS.forEach(obj => {
    const el = document.createElement('div');
    el.style.cssText = 'display:flex;align-items:center;gap:4px;padding:4px 6px;border-radius:6px;background:var(--panel2);border:1px solid '+(obj.selected?'var(--accent)':'var(--border)')+';cursor:pointer;';
    el.onclick = () => selectTextObj(obj.id);
    el.innerHTML = `<span style="flex:1;font-size:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${obj.text}</span>
      <button onclick="event.stopPropagation();duplicateTextObj(${obj.id})" style="font-size:9px;border:none;background:none;cursor:pointer;color:var(--accent)" title="Duplicate">⧉</button>
      <button onclick="event.stopPropagation();deleteTextObject(${obj.id})" style="font-size:9px;border:none;background:none;cursor:pointer;color:var(--accent2)" title="Delete">✕</button>`;
    list.appendChild(el);
  });
}

function duplicateTextObj(id) {
  const src = TEXT_OBJECTS.find(o=>o.id===id); if(!src) return;
  const obj = {...src, id:++textObjCounter, x:src.x+10, y:src.y+10};
  TEXT_OBJECTS.push(obj); selectTextObj(obj.id); renderTextOverlay(); updateTextObjectsList();
}

function renderTextOverlay() {
  txtCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);
  TEXT_OBJECTS.forEach(obj => {
    txtCtx.save();
    const fStr = `${obj.style==='bold'?'bold ':obj.style==='italic'?'italic ':''}${obj.size}px "${obj.font}"`;
    txtCtx.font = fStr;
    txtCtx.textAlign = obj.align||'center';
    txtCtx.textBaseline = 'middle';
    // Letter spacing (manual)
    const letters = obj.text.split('');
    let totalW = 0;
    if (obj.spacing !== 0) {
      letters.forEach(ch => { totalW += txtCtx.measureText(ch).width + obj.spacing; });
      totalW -= obj.spacing;
    } else {
      totalW = txtCtx.measureText(obj.text).width;
    }
    let startX = obj.x;
    if (obj.align==='center') startX = obj.x - totalW/2;
    else if (obj.align==='right') startX = obj.x - totalW;
    // Draw outline
    if (obj.outline!=='none') {
      txtCtx.strokeStyle = obj.outline==='black'?'#000':'#fff';
      txtCtx.lineWidth = Math.max(2, obj.size*0.12);
      txtCtx.lineJoin = 'round';
      if (obj.spacing!==0) {
        let cx=startX; letters.forEach(ch=>{txtCtx.strokeText(ch,cx,obj.y);cx+=txtCtx.measureText(ch).width+obj.spacing;});
      } else { txtCtx.strokeText(obj.text, obj.x, obj.y); }
    }
    // Draw text
    txtCtx.fillStyle = obj.color;
    if (obj.spacing!==0) {
      let cx=startX; letters.forEach(ch=>{txtCtx.fillText(ch,cx,obj.y);cx+=txtCtx.measureText(ch).width+obj.spacing;});
    } else { txtCtx.fillText(obj.text, obj.x, obj.y); }
    // Selection box
    if (obj.selected) {
      txtCtx.strokeStyle='rgba(91,95,255,0.8)'; txtCtx.lineWidth=1/APP.zoom;
      txtCtx.setLineDash([3/APP.zoom,3/APP.zoom]);
      const bx=startX-4, by=obj.y-obj.size/2-4, bw=totalW+8, bh=obj.size+8;
      txtCtx.strokeRect(bx,by,bw,bh);
      txtCtx.setLineDash([]);
      // Corner handles
      [[bx,by],[bx+bw,by],[bx,by+bh],[bx+bw,by+bh]].forEach(([hx,hy])=>{
        txtCtx.fillStyle='var(--accent)';
        txtCtx.fillRect(hx-3/APP.zoom,hy-3/APP.zoom,6/APP.zoom,6/APP.zoom);
      });
    }
    txtCtx.restore();
  });
}

// Text drag on text-overlay-canvas
textOverlayCanvas.addEventListener('mousedown', e => {
  if (APP.currentTool !== 'text') return;
  const rect = textOverlayCanvas.getBoundingClientRect();
  const cx = (e.clientX-rect.left)/APP.zoom;
  const cy = (e.clientY-rect.top)/APP.zoom;
  // Find hit text object (reverse order = top-most first)
  let hit = null;
  for (let i=TEXT_OBJECTS.length-1;i>=0;i--) {
    const obj=TEXT_OBJECTS[i];
    txtCtx.font=`${obj.style==='bold'?'bold ':obj.style==='italic'?'italic ':''}${obj.size}px "${obj.font}"`;
    const w=txtCtx.measureText(obj.text).width;
    const bx=obj.x-(obj.align==='center'?w/2:obj.align==='right'?w:0)-4;
    const by=obj.y-obj.size/2-4;
    if(cx>=bx&&cx<=bx+w+8&&cy>=by&&cy<=by+obj.size+8){hit=obj;break;}
  }
  if (hit) {
    selectTextObj(hit.id);
    TEXT_IS_DRAGGING=true;
    TEXT_DRAG_OFFSET={x:cx-hit.x,y:cy-hit.y};
  } else {
    // Deselect
    TEXT_OBJECTS.forEach(o=>o.selected=false);
    SELECTED_TEXT_OBJ=null;
    renderTextOverlay(); updateTextObjectsList();
  }
  e.preventDefault();
});

textOverlayCanvas.addEventListener('mousemove', e => {
  if (!TEXT_IS_DRAGGING || !SELECTED_TEXT_OBJ) return;
  const rect=textOverlayCanvas.getBoundingClientRect();
  const cx=(e.clientX-rect.left)/APP.zoom;
  const cy=(e.clientY-rect.top)/APP.zoom;
  SELECTED_TEXT_OBJ.x = cx - TEXT_DRAG_OFFSET.x;
  SELECTED_TEXT_OBJ.y = cy - TEXT_DRAG_OFFSET.y;
  renderTextOverlay();
  if (ACTIVE_TAB) ACTIVE_TAB.textObjects = TEXT_OBJECTS;
});

textOverlayCanvas.addEventListener('mouseup', () => { TEXT_IS_DRAGGING=false; });
textOverlayCanvas.addEventListener('mouseleave', () => { TEXT_IS_DRAGGING=false; });

function bakeAllTextObjects() {
  if (TEXT_OBJECTS.length===0) { toast('No text objects to bake','error'); return; }
  historyManager.save();
  const layer=getActiveLayer(); if(!layer) return;
  const lctx=layer.canvas.getContext('2d');
  TEXT_OBJECTS.forEach(obj => {
    lctx.save();
    const fStr=`${obj.style==='bold'?'bold ':obj.style==='italic'?'italic ':''}${obj.size}px "${obj.font}"`;
    lctx.font=fStr; lctx.textAlign=obj.align||'center'; lctx.textBaseline='middle';
    if(obj.outline!=='none'){
      lctx.strokeStyle=obj.outline==='black'?'#000':'#fff';
      lctx.lineWidth=Math.max(2,obj.size*0.12); lctx.lineJoin='round';
      lctx.strokeText(obj.text,obj.x,obj.y);
    }
    lctx.fillStyle=obj.color; lctx.fillText(obj.text,obj.x,obj.y);
    lctx.restore();
  });
  TEXT_OBJECTS=[]; SELECTED_TEXT_OBJ=null;
  if(ACTIVE_TAB) ACTIVE_TAB.textObjects=TEXT_OBJECTS;
  renderLayers(); renderTextOverlay(); updateTextObjectsList();
  toast('Text baked to canvas!','success');
}

function clearTextObjects() {
  TEXT_OBJECTS=[]; SELECTED_TEXT_OBJ=null;
  if(ACTIVE_TAB) ACTIVE_TAB.textObjects=TEXT_OBJECTS;
  renderTextOverlay(); updateTextObjectsList();
  toast('Text objects cleared','info');
}

// ============================================================
// ZOOM
// ============================================================
function changeZoom(d) { APP.zoom=Math.max(.1,Math.min(20,APP.zoom+d)); updateZoom(); }
function updateZoom() {
  const container=document.getElementById('canvas-container');
  const w=APP.canvasWidth*APP.zoom, h=APP.canvasHeight*APP.zoom;
  container.style.width=w+'px'; container.style.height=h+'px';
  [mainCanvas,gridCanvas,overlayCanvas,safezoneCanvas,textOverlayCanvas].forEach(c=>{c.style.width=w+'px';c.style.height=h+'px';});
  document.getElementById('zoom-label').textContent=Math.round(APP.zoom*100)/100+'×';
  drawGrid(); drawSafeZone();
}
function fitToScreen() {
  const wrapper=document.getElementById('canvas-wrapper');
  const rw=(wrapper.clientWidth-60)/APP.canvasWidth, rh=(wrapper.clientHeight-60)/APP.canvasHeight;
  APP.zoom=Math.round(Math.min(rw,rh,16)*4)/4; APP.zoom=Math.max(.1,APP.zoom);
  updateZoom();
}

// ============================================================
// GRID & SAFE ZONE
// ============================================================
function drawGrid() {
  gridCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);
  if (!APP.showGrid||APP.zoom<1.5) return;
  gridCtx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--border').trim()||'rgba(100,100,180,.2)';
  gridCtx.lineWidth=1/APP.zoom;
  const stepX=APP.tileGridVisible?APP.tileSize:APP.pixelW;
  const stepY=APP.tileGridVisible?APP.tileSize:APP.pixelH;
  for(let x=0;x<=APP.canvasWidth;x+=stepX){gridCtx.beginPath();gridCtx.moveTo(x,0);gridCtx.lineTo(x,APP.canvasHeight);gridCtx.stroke();}
  for(let y=0;y<=APP.canvasHeight;y+=stepY){gridCtx.beginPath();gridCtx.moveTo(0,y);gridCtx.lineTo(APP.canvasWidth,y);gridCtx.stroke();}
}
function toggleGrid() {
  APP.showGrid=!APP.showGrid;
  ['grid-toggle','grid-toggle-art'].forEach(id=>{const b=document.getElementById(id);if(b)b.classList.toggle('on',APP.showGrid);});
  document.getElementById('grid-toggle-btn')?.classList.toggle('active',APP.showGrid);
  drawGrid();
}
function toggleTileGrid() { APP.tileGridVisible=!APP.tileGridVisible; drawGrid(); }
function setTileSize(v) { APP.tileSize=parseInt(v); if(APP.tileGridVisible) drawGrid(); }
function drawSafeZone() {
  sfzCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);
  if(!APP.showSafeZone||APP.mode!=='clipping') return;
  const mx=APP.canvasWidth*.1, my=APP.canvasHeight*.1;
  sfzCtx.strokeStyle='rgba(255,50,50,0.7)'; sfzCtx.lineWidth=1/APP.zoom;
  sfzCtx.setLineDash([4/APP.zoom,4/APP.zoom]);
  sfzCtx.strokeRect(mx,my,APP.canvasWidth-mx*2,APP.canvasHeight-my*2);
  sfzCtx.setLineDash([]);
  sfzCtx.fillStyle='rgba(255,50,50,0.6)';
  sfzCtx.font=`${11/APP.zoom}px Inter`;
  sfzCtx.fillText('SAFE ZONE',mx+4/APP.zoom,my-4/APP.zoom);
}
function toggleSafeZone() {
  APP.showSafeZone=!APP.showSafeZone;
  ['safezone-toggle'].forEach(id=>{const b=document.getElementById(id);if(b)b.classList.toggle('on',APP.showSafeZone);});
  document.getElementById('safezone-btn')?.classList.toggle('active',APP.showSafeZone);
  drawSafeZone();
}

// ============================================================
// MINIMAP
// ============================================================
function updateMinimap() {
  const mm=document.getElementById('minimap'), mctx=mm.getContext('2d');
  mctx.clearRect(0,0,mm.width,mm.height);
  const r=Math.min(mm.width/APP.canvasWidth,mm.height/APP.canvasHeight);
  const dw=APP.canvasWidth*r, dh=APP.canvasHeight*r;
  mctx.drawImage(mainCanvas,(mm.width-dw)/2,(mm.height-dh)/2,dw,dh);
}

// ============================================================
// COLOR
// ============================================================
const PALETTES = {
  neon:['#FF00FF','#00FFFF','#FF0080','#00FF80','#8000FF','#FFFF00','#FF4500','#00BFFF','#FF69B4','#7FFF00','#FF6347','#40E0D0','#9400D3','#FFD700','#00FF00','#FF1493'],
  retro:['#F8F8F8','#3C3C3C','#7C7C7C','#BCBCBC','#F83800','#F87858','#0058F8','#68A8F8','#00A800','#B8F8B8','#F8A800','#F8D878','#585858','#787878','#B8B8B8','#F8D8F8'],
  gameboy:['#0F380F','#306230','#8BAC0F','#9BBC0F','#0F380F','#306230','#8BAC0F','#9BBC0F','#0F380F','#306230','#8BAC0F','#9BBC0F','#0F380F','#306230','#8BAC0F','#9BBC0F'],
  nes:['#7C7C7C','#0000FC','#0000BC','#4428BC','#940084','#A80020','#A81000','#881400','#503000','#007800','#006800','#005800','#004058','#000000','#000000','#000000'],
  pastel:['#FFB3BA','#FFDFBA','#FFFFBA','#BAFFC9','#BAE1FF','#FFB3FF','#FFD9B3','#B3FFD9','#D9B3FF','#B3FFFF','#FFB3D9','#D9FFB3','#B3B3FF','#FFCCB3','#CCB3FF','#B3FFCC'],
  earth:['#3B1005','#7B3410','#B5651D','#D2691E','#CD853F','#8B4513','#A0522D','#6B3A2A','#4A2512','#2F1B0E','#7C4A1E','#9E5B2A','#5C3317','#8B6914','#A67C52','#C4A35A'],
};
let PALETTE = [...PALETTES.neon];
const QUICK_COLORS = ['#FFFFFF','#000000','#FF4444','#FF9800','#FFFF00','#4CAF50','#00BCD4','#5B5FFF','#9C27B0','#FF5C8A','#795548','#9E9E9E'];

function loadPresetPalette(n) { if(PALETTES[n]){PALETTE=[...PALETTES[n]];renderPaletteGrid();toast(`${n} palette loaded`,'success');} }
function renderPaletteGrid() {
  const g=document.getElementById('palette-grid'); g.innerHTML='';
  PALETTE.forEach(c=>{const s=document.createElement('div');s.className='palette-swatch'+(c===APP.primaryColor?' active':'');s.style.background=c;s.title=c;s.onclick=()=>{setPrimaryColor(c);renderPaletteGrid();};s.addEventListener('contextmenu',e=>{e.preventDefault();setSecondaryColor(c);});g.appendChild(s);});
}
function renderQuickColors() {
  const g=document.getElementById('quick-colors-grid'); g.innerHTML='';
  QUICK_COLORS.forEach(c=>{const s=document.createElement('div');s.className='palette-swatch';s.style.background=c;s.title=c;s.onclick=()=>setPrimaryColor(c);s.addEventListener('contextmenu',e=>{e.preventDefault();setSecondaryColor(c);});g.appendChild(s);});
}
function addColorToPalette(){if(!PALETTE.includes(APP.primaryColor)){PALETTE.push(APP.primaryColor);renderPaletteGrid();}}
function clearPalette(){PALETTE=[];renderPaletteGrid();}
function setPrimaryColor(c) {
  APP.primaryColor=c;
  document.getElementById('current-color').value=c;
  document.getElementById('hex-input').value=c;
  const rgb=hexToRgb(c);
  if(rgb){
    document.getElementById('sl-r').value=rgb.r; document.getElementById('sl-r-v').textContent=rgb.r;
    document.getElementById('sl-g').value=rgb.g; document.getElementById('sl-g-v').textContent=rgb.g;
    document.getElementById('sl-b').value=rgb.b; document.getElementById('sl-b-v').textContent=rgb.b;
  }
  if(ACTIVE_TAB) ACTIVE_TAB.primaryColor=c;
  renderPaletteGrid();
}
function setSecondaryColor(c) { APP.secondaryColor=c; document.getElementById('secondary-color').value=c; if(ACTIVE_TAB) ACTIVE_TAB.secondaryColor=c; }
function swapColors(){const t=APP.primaryColor;setPrimaryColor(APP.secondaryColor);setSecondaryColor(t);}
function resetColors(){setPrimaryColor('#5B5FFF');setSecondaryColor('#FFFFFF');}
function onHexInput(v){if(/^#[0-9A-Fa-f]{6}$/.test(v))setPrimaryColor(v);}
function updateFromSliders() {
  const r=parseInt(document.getElementById('sl-r').value);
  const g=parseInt(document.getElementById('sl-g').value);
  const b=parseInt(document.getElementById('sl-b').value);
  document.getElementById('sl-r-v').textContent=r;
  document.getElementById('sl-g-v').textContent=g;
  document.getElementById('sl-b-v').textContent=b;
  setPrimaryColor(rgbToHex(r,g,b));
}

// ============================================================
// SELECTION OPS
// ============================================================
function copySelection(){if(!APP.selection)return;const{x,y,w,h}=APP.selection;if(!w||!h)return;const tc=document.createElement('canvas');tc.width=w;tc.height=h;tc.getContext('2d').drawImage(mainCanvas,x,y,w,h,0,0,w,h);APP.copyBuffer=tc;toast('Copied!','success');}
function pasteSelection(){if(!APP.copyBuffer)return;const layer=getActiveLayer();if(!layer)return;historyManager.save();const px=APP.selection?APP.selection.x:10,py=APP.selection?APP.selection.y:10;layer.canvas.getContext('2d').drawImage(APP.copyBuffer,px,py);renderLayers();toast('Pasted!','success');}
function cutSelection(){if(!APP.selection)return;const{x,y,w,h}=APP.selection;if(!w||!h)return;copySelection();historyManager.save();const l=getActiveLayer();if(l)l.canvas.getContext('2d').clearRect(x,y,w,h);renderLayers();toast('Cut!','success');}
function selectAll(){APP.selection={x:0,y:0,w:APP.canvasWidth,h:APP.canvasHeight};overlayCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);overlayCtx.setLineDash([4,4]);overlayCtx.strokeStyle='#5B5FFF';overlayCtx.lineWidth=1;overlayCtx.strokeRect(.5,.5,APP.canvasWidth-1,APP.canvasHeight-1);overlayCtx.setLineDash([]);toast('Selected all','info');}

// ============================================================
// TRANSFORMS
// ============================================================
function flipH(){const l=getActiveLayer();if(!l)return;historyManager.save();const lc=l.canvas.getContext('2d'),tmp=document.createElement('canvas');tmp.width=APP.canvasWidth;tmp.height=APP.canvasHeight;tmp.getContext('2d').drawImage(l.canvas,0,0);lc.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);lc.save();lc.scale(-1,1);lc.drawImage(tmp,-APP.canvasWidth,0);lc.restore();renderLayers();}
function flipV(){const l=getActiveLayer();if(!l)return;historyManager.save();const lc=l.canvas.getContext('2d'),tmp=document.createElement('canvas');tmp.width=APP.canvasWidth;tmp.height=APP.canvasHeight;tmp.getContext('2d').drawImage(l.canvas,0,0);lc.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);lc.save();lc.scale(1,-1);lc.drawImage(tmp,0,-APP.canvasHeight);lc.restore();renderLayers();toast('Flipped V','info');}
function rotateCanvas(){
  const layers=getFrameLayers(APP.currentFrameIndex); historyManager.save();
  const nw=APP.canvasHeight,nh=APP.canvasWidth;
  layers.forEach(l=>{const tmp=document.createElement('canvas');tmp.width=APP.canvasWidth;tmp.height=APP.canvasHeight;tmp.getContext('2d').drawImage(l.canvas,0,0);l.canvas.width=nw;l.canvas.height=nh;const lc=l.canvas.getContext('2d');lc.save();lc.translate(nw/2,nh/2);lc.rotate(Math.PI/2);lc.drawImage(tmp,-APP.canvasWidth/2,-APP.canvasHeight/2);lc.restore();});
  APP.canvasWidth=nw;APP.canvasHeight=nh;
  [mainCanvas,gridCanvas,overlayCanvas,safezoneCanvas,textOverlayCanvas].forEach(c=>{c.width=nw;c.height=nh;});
  document.getElementById('bb-size').textContent=`${nw}×${nh}`;
  updateZoom();renderLayers();drawGrid();drawSafeZone();
}

// ============================================================
// FILTERS
// ============================================================
function applyActiveFilter(){
  if(!APP.currentFilter) return;
  const imgData=ctx.getImageData(0,0,APP.canvasWidth,APP.canvasHeight);
  const d=imgData.data, w=APP.canvasWidth, h=APP.canvasHeight;
  switch(APP.currentFilter){
    case'vhs':for(let i=0;i<d.length;i+=4){if(Math.floor(i/4/w)%3===0){d[i]=Math.min(255,d[i]+30);d[i+1]=Math.max(0,d[i+1]-20);}d[i]+=(Math.random()-.5)*20;d[i+1]+=(Math.random()-.5)*20;d[i+2]+=(Math.random()-.5)*20;}break;
    case'crt':for(let i=0;i<d.length;i+=4)if(Math.floor(i/4/w)%2===0){d[i]*=.8;d[i+1]*=.8;d[i+2]*=.8;}break;
    case'gameboy':for(let i=0;i<d.length;i+=4){const b=.299*d[i]+.587*d[i+1]+.114*d[i+2];const v=b<64?15:b<128?48:b<192?139:155;d[i]=v*.61;d[i+1]=v*.74;d[i+2]=v*.06;}break;
    case'glitch':for(let y=0;y<h;y++)if(Math.random()<.05){const off=Math.floor((Math.random()-.5)*20);for(let x=0;x<w;x++){const si=(y*w+(x+off+w)%w)*4;const di=(y*w+x)*4;d[di]=d[si];d[di+1]=d[si+1];d[di+2]=d[si+2];}}break;
    case'vaporwave':for(let i=0;i<d.length;i+=4){d[i]=Math.min(255,d[i]+60);d[i+2]=Math.min(255,d[i+2]+80);d[i+1]=Math.max(0,d[i+1]-20);}break;
    case'neon':for(let i=0;i<d.length;i+=4)if(Math.max(d[i],d[i+1],d[i+2])>100){d[i]=Math.min(255,d[i]*1.4);d[i+1]=Math.min(255,d[i+1]*1.2);d[i+2]=Math.min(255,d[i+2]*1.6);}break;
    case'chromab':const tmp=new Uint8ClampedArray(d);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const ci=(y*w+x)*4;const ri=(y*w+Math.min(w-1,x+3))*4;const bi=(y*w+Math.max(0,x-3))*4;d[ci]=tmp[ri];d[ci+2]=tmp[bi+2];}break;
  }
  ctx.putImageData(imgData,0,0);
}
function toggleFilter(name){
  APP.currentFilter=APP.currentFilter===name?null:name;
  document.querySelectorAll('.filter-chip').forEach(c=>c.classList.toggle('active',c.textContent.toLowerCase().replace(/\s/g,'')===name.toLowerCase()));
  if(APP.currentFilter===null) document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
  renderLayers(); toast(APP.currentFilter?`Filter: ${name}`:'Filter off','info');
}

// ============================================================
// ANTI-ALIAS / ONION
// ============================================================
function toggleAntiAlias(){APP.antiAlias=!APP.antiAlias;const b=document.getElementById('aa-toggle');if(b)b.classList.toggle('on',APP.antiAlias);toast(`AA ${APP.antiAlias?'on':'off'}`,'info');}
function toggleOnionSkin(){APP.onionSkin=!APP.onionSkin;const b=document.getElementById('onion-toggle');if(b)b.classList.toggle('on',APP.onionSkin);renderOnionSkin();}
function renderOnionSkin(){
  if(!APP.onionSkin||APP.currentFrameIndex===0){overlayCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);return;}
  const prev=buildCompositeCanvas(APP.currentFrameIndex-1);
  overlayCtx.clearRect(0,0,APP.canvasWidth,APP.canvasHeight);
  overlayCtx.globalAlpha=.3; overlayCtx.drawImage(prev,0,0); overlayCtx.globalAlpha=1;
}
function setDithering(m){APP.ditheringMode=m;document.querySelectorAll('.dither-chip').forEach(c=>c.classList.toggle('active',c.textContent.toLowerCase().replace('-','').replace(' ','')===m.replace('-','')));toast(`Dither: ${m}`,'info');}

// ============================================================
// MODE SWITCH
// ============================================================
function switchMode(mode) {
  APP.mode=mode;
  document.body.className=mode+'-mode';
  document.getElementById('btn-clipping').classList.toggle('active',mode==='clipping');
  document.getElementById('btn-art').classList.toggle('active',mode==='art');
  document.getElementById('export-clipping').style.display=mode==='clipping'?'flex':'none';
  document.getElementById('export-art').style.display=mode==='art'?'flex':'none';
  document.getElementById('settings-clipping').style.display=mode==='clipping'?'flex':'none';
  document.getElementById('settings-art').style.display=mode==='art'?'flex':'none';
  document.getElementById('art-mode-extras').style.display=mode==='art'?'flex':'none';
  if(ACTIVE_TAB) ACTIVE_TAB.mode=mode;
  drawSafeZone();
}

// ============================================================
// PANEL TABS
// ============================================================
function switchTab(tab) {
  document.querySelectorAll('.panel-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.panel-content').forEach(c=>c.classList.remove('active'));
  document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
}

// ============================================================
// COMPOSITE CANVAS
// ============================================================
function buildCompositeCanvas(fi) {
  const idx=fi!==undefined?fi:APP.currentFrameIndex;
  const ec=document.createElement('canvas'); ec.width=APP.canvasWidth; ec.height=APP.canvasHeight;
  const ectx=ec.getContext('2d');
  getFrameLayers(idx).forEach(l=>{if(!l.visible)return;ectx.globalAlpha=l.opacity;ectx.globalCompositeOperation=l.blendMode;ectx.drawImage(l.canvas,0,0);});
  ectx.globalAlpha=1;ectx.globalCompositeOperation='source-over';
  return ec;
}

// ============================================================
// EXPORT
// ============================================================
function quickExportPNG() {
  const ec=buildCompositeCanvas();
  ec.toBlob(blob=>{saveAs(blob,(ACTIVE_TAB?ACTIVE_TAB.name:'PixieR')+'.png');toast('PNG exported!','success');});
}
function exportThumbnail(){const tc=document.createElement('canvas');tc.width=1280;tc.height=720;const tctx=tc.getContext('2d');tctx.imageSmoothingEnabled=false;tctx.drawImage(buildCompositeCanvas(),0,0,1280,720);tc.toBlob(b=>{saveAs(b,'thumbnail.png');toast('Thumbnail exported!','success');});}
function exportSpriteSheet(){const cols=Math.ceil(Math.sqrt(FRAMES.length));const rows=Math.ceil(FRAMES.length/cols);const sh=document.createElement('canvas');sh.width=APP.canvasWidth*cols;sh.height=APP.canvasHeight*rows;const sc=sh.getContext('2d');FRAMES.forEach((_,i)=>{sc.drawImage(buildCompositeCanvas(i),(i%cols)*APP.canvasWidth,Math.floor(i/cols)*APP.canvasHeight);});sh.toBlob(b=>{saveAs(b,'spritesheet.png');toast('Sprite sheet exported!','success');});}
function exportPaletteJSON(){saveAs(new Blob([JSON.stringify({palette:PALETTE},null,2)],{type:'application/json'}),'palette.json');toast('Palette JSON exported!','success');}
function exportCSSVars(){const lines=[':root {'];PALETTE.forEach((c,i)=>lines.push(`  --color-${i+1}: ${c};`));lines.push('}');saveAs(new Blob([lines.join('\n')],{type:'text/css'}),'palette.css');toast('CSS exported!','success');}
function exportGameDev(engine){const data={engine,frames:FRAMES.map((_,i)=>({frame:i,w:APP.canvasWidth,h:APP.canvasHeight})),palette:PALETTE};saveAs(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),`PixieR_${engine}.json`);toast(`${engine} export ready!`,'success');exportSpriteSheet();}

function exportVideo(fmt) {
  if(FRAMES.length<2){toast('Add more frames','error');return;}
  const exportFps=parseInt(document.getElementById('export-fps').value)||30;
  const scale=parseInt(document.getElementById('export-res').value)||1;
  const toastId=showProgressToast('Recording video...',0);
  document.getElementById('rec-indicator').classList.add('on');
  const rc=document.createElement('canvas'); rc.width=APP.canvasWidth*scale; rc.height=APP.canvasHeight*scale;
  const rctx=rc.getContext('2d'); rctx.imageSmoothingEnabled=false;
  const stream=rc.captureStream(exportFps);
  const chunks=[]; let mr;
  const mime=fmt==='webm'?'video/webm;codecs=vp9':'video/webm';
  try{mr=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8000000});}catch{mr=new MediaRecorder(stream,{videoBitsPerSecond:8000000});}
  mr.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
  mr.onstop=()=>{
    document.getElementById('rec-indicator').classList.remove('on');
    const blob=new Blob(chunks,{type:mr.mimeType});
    const ext=mr.mimeType.includes('mp4')?'mp4':'webm';
    saveAs(blob,`${ACTIVE_TAB?ACTIVE_TAB.name:'PixieR'}.${ext}`);
    updateProgressToast(toastId,100,'Done!'); toast('Video exported!','success');
    setTimeout(()=>removeToast(toastId),2000);
  };
  mr.start(); let fi=0;
  function renderNext(){
    if(fi>=FRAMES.length){mr.stop();return;}
    const fc=buildCompositeCanvas(fi);
    rctx.clearRect(0,0,rc.width,rc.height); rctx.drawImage(fc,0,0,rc.width,rc.height);
    updateProgressToast(toastId,Math.round(fi/FRAMES.length*100));
    fi++; setTimeout(renderNext,1000/exportFps);
  }
  setTimeout(renderNext,100);
}

function exportGIF() {
  if(typeof GIF==='undefined'){
    toast('Loading GIF library...','info');
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js';
    s.onload=()=>doExportGIF(); s.onerror=()=>{toast('GIF fallback: PNG sequence','info');exportPNGSequence();};
    document.head.appendChild(s);
  } else doExportGIF();
}
function doExportGIF(){
  if(typeof GIF==='undefined'){toast('GIF lib unavailable','error');return;}
  const gif=new GIF({workers:2,quality:10,width:APP.canvasWidth,height:APP.canvasHeight,workerScript:'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'});
  const delay=Math.round(1000/APP.fps);
  for(let i=0;i<FRAMES.length;i++) gif.addFrame(buildCompositeCanvas(i),{delay});
  const tid=showProgressToast('Encoding GIF...',0);
  gif.on('progress',p=>updateProgressToast(tid,Math.round(p*100)));
  gif.on('finished',blob=>{saveAs(blob,`${ACTIVE_TAB?ACTIVE_TAB.name:'PixieR'}.gif`);updateProgressToast(tid,100,'Done!');toast('GIF exported!','success');setTimeout(()=>removeToast(tid),2000);});
  gif.render();
}
async function exportPNGSequence(){
  const zip=new JSZip(), folder=zip.folder('frames');
  const tid=showProgressToast('Creating ZIP...',0);
  for(let i=0;i<FRAMES.length;i++){
    updateProgressToast(tid,Math.round(i/FRAMES.length*100));
    const ec=buildCompositeCanvas(i);
    const blob=await new Promise(r=>ec.toBlob(r));
    folder.file(`frame_${String(i+1).padStart(4,'0')}.png`,await blob.arrayBuffer());
    await new Promise(r=>setTimeout(r,0));
  }
  const zb=await zip.generateAsync({type:'blob'});
  saveAs(zb,`${ACTIVE_TAB?ACTIVE_TAB.name:'PixieR'}_frames.zip`);
  updateProgressToast(tid,100,'Done!'); toast('ZIP exported!','success'); setTimeout(()=>removeToast(tid),2000);
}

// ============================================================
// PXT SAVE / LOAD
// ============================================================
async function savePXT() {
  if (ACTIVE_TAB) saveCurrentStateToTab(ACTIVE_TAB);
  const tab = ACTIVE_TAB;
  const name = prompt('Save as filename (without .pxt):', tab ? tab.name : 'MyPixieR');
  if (!name) return;

  const projectData = {
    magic: 'PIXR',
    version: PXT_VERSION,
    name,
    canvasWidth: APP.canvasWidth,
    canvasHeight: APP.canvasHeight,
    pixelW: APP.pixelW,
    pixelH: APP.pixelH,
    mode: APP.mode,
    fps: APP.fps,
    palette: PALETTE,
    textObjects: TEXT_OBJECTS.map(o=>({...o, selected:false})),
    frames: []
  };

  for (let fi=0; fi<FRAMES.length; fi++) {
    const layers = getFrameLayers(fi).map(l => ({
      name: l.name, visible: l.visible, opacity: l.opacity,
      blendMode: l.blendMode, locked: l.locked,
      data: l.canvas.toDataURL('image/png')
    }));
    projectData.frames.push({layers});
  }

  const encoded = encodePXT(projectData);
  const blob = new Blob([encoded], {type: 'application/octet-stream'});
  saveAs(blob, name + '.pxt');

  if (tab) { tab.name = name; tab.unsaved = false; renderTabBar(); }
  toast(`Saved "${name}.pxt"`, 'success');
}

function triggerOpen() {
  document.getElementById('import-file-input').accept = 'image/*,.pxt';
  document.getElementById('import-file-input').click();
}

async function loadPXTFile(file) {
  try {
    const text = await file.text();
    const data = decodePXT(text);

    // Create new tab for loaded file
    const tab = createTabState(data.name || file.name.replace('.pxt',''), data.canvasWidth, data.canvasHeight, data.pixelW, data.pixelH, data.fps);
    TABS.push(tab);

    // Temporarily switch context
    ACTIVE_TAB = tab;
    APP.canvasWidth = data.canvasWidth || 400;
    APP.canvasHeight = data.canvasHeight || 400;
    APP.pixelW = data.pixelW || 20;
    APP.pixelH = data.pixelH || 20;
    APP.fps = data.fps || 12;
    FRAMES = []; LAYERS_CACHE = {}; TEXT_OBJECTS = data.textObjects || [];

    for (let fi=0; fi<(data.frames||[]).length; fi++) {
      const fd = data.frames[fi];
      FRAMES.push({thumb: document.createElement('canvas')});
      const layers = [];
      for (const ld of (fd.layers||[])) {
        const lc = document.createElement('canvas'); lc.width=APP.canvasWidth; lc.height=APP.canvasHeight;
        if (ld.data) await new Promise(resolve => {
          const img=new Image(); img.onload=()=>{lc.getContext('2d').drawImage(img,0,0);resolve();};img.src=ld.data;
        });
        layers.push({canvas:lc,name:ld.name||'Layer',visible:ld.visible!==false,opacity:ld.opacity||1,blendMode:ld.blendMode||'source-over',locked:ld.locked||false});
      }
      LAYERS_CACHE[fi] = layers;
    }

    tab.frames = FRAMES; tab.layersCache = LAYERS_CACHE; tab.textObjects = TEXT_OBJECTS;
    tab.palette = data.palette || [...PALETTES.neon];
    tab.unsaved = false;

    switchToTab(tab.id);
    renderTabBar();
    toast(`Loaded "${tab.name}"`, 'success');
  } catch(e) {
    toast(e.message || 'Failed to load file', 'error');
  }
}

// ============================================================
// IMPORT IMAGE
// ============================================================
document.getElementById('import-file-input').addEventListener('change', async function(e) {
  const file = e.target.files[0]; if(!file) return;
  if (file.name.endsWith('.pxt')) {
    await loadPXTFile(file);
  } else {
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        const mode=confirm('Pixelate image? OK=Pixelated, Cancel=Normal');
        historyManager.save();
        const layer=getActiveLayer(); if(!layer) return;
        const lctx=layer.canvas.getContext('2d');
        if(mode){
          const small=document.createElement('canvas');
          small.width=Math.max(1,Math.round(APP.canvasWidth/APP.pixelW));
          small.height=Math.max(1,Math.round(APP.canvasHeight/APP.pixelH));
          const sc=small.getContext('2d'); sc.imageSmoothingEnabled=false;
          sc.drawImage(img,0,0,small.width,small.height);
          lctx.imageSmoothingEnabled=false; lctx.drawImage(small,0,0,APP.canvasWidth,APP.canvasHeight);
        } else {
          lctx.drawImage(img,0,0,APP.canvasWidth,APP.canvasHeight);
        }
        renderLayers(); toast('Image imported!','success');
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  }
  this.value='';
});

document.getElementById('audio-file-input').addEventListener('change',function(e){
  const f=e.target.files[0]; if(!f) return;
  if(ACTIVE_TAB){ACTIVE_TAB.audioFile=f;ACTIVE_TAB.audioFileName=f.name;}
  document.getElementById('audio-name').textContent=f.name;
  document.getElementById('audio-info').style.display='block';
  toast(`Audio: ${f.name}`,'success'); this.value='';
});
function removeAudio(){if(ACTIVE_TAB){ACTIVE_TAB.audioFile=null;ACTIVE_TAB.audioFileName=null;}document.getElementById('audio-info').style.display='none';toast('Audio removed','info');}

document.getElementById('import-palette-input').addEventListener('change',function(e){
  const f=e.target.files[0]; if(!f) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const img=new Image();img.onload=()=>{
      const tc=document.createElement('canvas');tc.width=img.width;tc.height=img.height;
      const tctx=tc.getContext('2d');tctx.drawImage(img,0,0);
      const d=tctx.getImageData(0,0,tc.width,tc.height).data;
      const colors=new Set();
      for(let i=0;i<d.length;i+=4)if(d[i+3]>128)colors.add(rgbToHex(d[i],d[i+1],d[i+2]));
      PALETTE=[...colors].slice(0,32);renderPaletteGrid();toast(`${PALETTE.length} colors extracted`,'success');
    };img.src=ev.target.result;
  };reader.readAsDataURL(f);this.value='';
});

// ============================================================
// CANVAS PRESETS / VIDEO PRESETS
// ============================================================
function applyVideoPreset(preset) {
  const p={
    'yt-shorts':{w:360,h:640,fps:30},'tiktok':{w:360,h:640,fps:30},
    'reels':{w:360,h:640,fps:30},'youtube':{w:480,h:270,fps:30}
  }[preset];
  if(!p)return;
  if(confirm(`Apply ${preset} preset? (${p.w}×${p.h} @ ${p.fps}fps)`)){
    initCanvas(p.w,p.h,APP.pixelW,APP.pixelH);
    setFPS(p.fps); fitToScreen(); toast(`${preset} applied`,'success');
  }
}
function applyCanvasPreset(preset) {
  const p={'9-16':{w:270,h:480},'16-9':{w:480,h:270},'1-1':{w:256,h:256},'4-5':{w:320,h:400},
    '64':{w:64,h:64},'128':{w:128,h:128},'256':{w:256,h:256},'512':{w:512,h:512}}[preset];
  if(!p)return;
  if(confirm(`Resize to ${p.w}×${p.h}? Clears all frames!`)){initCanvas(p.w,p.h,APP.pixelW,APP.pixelH);fitToScreen();toast(`Canvas: ${p.w}×${p.h}`,'success');}
}

// ============================================================
// WATERMARK
// ============================================================
function applyWatermark(){
  const txt=document.getElementById('watermark-text').value; const pos=document.getElementById('watermark-pos').value;
  if(!txt)return; historyManager.save();
  FRAMES.forEach((_,fi)=>{
    const layers=getFrameLayers(fi);
    const wl={canvas:document.createElement('canvas'),name:'Watermark',visible:true,opacity:.4,blendMode:'source-over',locked:false};
    wl.canvas.width=APP.canvasWidth; wl.canvas.height=APP.canvasHeight;
    const wctx=wl.canvas.getContext('2d');
    wctx.font=`${Math.max(10,APP.canvasWidth*.03)}px Inter`; wctx.fillStyle='#fff'; wctx.textBaseline='bottom';
    const tm=wctx.measureText(txt); let wx,wy;
    switch(pos){case'tl':wx=8;wy=20;break;case'tr':wx=APP.canvasWidth-tm.width-8;wy=20;break;case'bl':wx=8;wy=APP.canvasHeight-8;break;case'br':wx=APP.canvasWidth-tm.width-8;wy=APP.canvasHeight-8;break;default:wx=(APP.canvasWidth-tm.width)/2;wy=APP.canvasHeight/2;}
    wctx.fillText(txt,wx,wy); layers.push(wl);
  });
  renderLayers(); updateLayersPanel(); toast('Watermark applied!','success');
}

// ============================================================
// AI TOOLS
// ============================================================
function aiUpscale(factor){
  const ec=buildCompositeCanvas();
  const uw=APP.canvasWidth*factor,uh=APP.canvasHeight*factor;
  if(!confirm(`Upscale ${factor}×? (${uw}×${uh})`))return;
  const nc=document.createElement('canvas');nc.width=uw;nc.height=uh;
  const nctx=nc.getContext('2d');nctx.imageSmoothingEnabled=false;nctx.drawImage(ec,0,0,uw,uh);
  nc.toBlob(b=>{saveAs(b,`upscaled_${factor}x.png`);toast(`Upscaled ${factor}x!`,'success');});
}
function aiOutline(){
  const l=getActiveLayer(); if(!l)return; historyManager.save();
  const oc=document.createElement('canvas');oc.width=APP.canvasWidth;oc.height=APP.canvasHeight;
  const octx=oc.getContext('2d');
  const src=l.canvas.getContext('2d').getImageData(0,0,APP.canvasWidth,APP.canvasHeight).data;
  const out=octx.createImageData(APP.canvasWidth,APP.canvasHeight);
  const w=APP.canvasWidth,h=APP.canvasHeight;
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const i=(y*w+x)*4; if(src[i+3]<10)continue;
    const nb=[src[((y-1)*w+x)*4+3],src[((y+1)*w+x)*4+3],src[(y*w+x-1)*4+3],src[(y*w+x+1)*4+3]];
    if(nb.some(n=>n<10)){out.data[i]=0;out.data[i+1]=0;out.data[i+2]=0;out.data[i+3]=255;}
  }
  octx.putImageData(out,0,0);
  const layers=getFrameLayers(APP.currentFrameIndex);
  layers.push({canvas:oc,name:'Auto Outline',visible:true,opacity:1,blendMode:'source-over',locked:false});
  APP.activeLayerIndex=layers.length-1; renderLayers(); updateLayersPanel(); toast('Outline generated!','success');
}
function showMockup(type){
  const ec=buildCompositeCanvas();
  const mc=document.createElement('canvas'); mc.width=600; mc.height=600;
  const mctx=mc.getContext('2d');
  mctx.fillStyle='#1A1A2E'; mctx.fillRect(0,0,600,600);
  if(!CanvasRenderingContext2D.prototype.roundRect){CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){this.beginPath();this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath();};}
  switch(type){
    case'gameboy':mctx.fillStyle='#8B956D';mctx.roundRect(150,50,300,500,30);mctx.fill();mctx.fillStyle='#1A1A1A';mctx.roundRect(180,100,240,160,10);mctx.fill();mctx.drawImage(ec,185,105,230,150);break;
    case'iphone':mctx.fillStyle='#111';mctx.roundRect(175,50,250,500,40);mctx.fill();mctx.fillStyle='#000';mctx.roundRect(185,80,230,440,10);mctx.fill();const s=Math.min(230/APP.canvasWidth,440/APP.canvasHeight);mctx.drawImage(ec,185+(230-APP.canvasWidth*s)/2,80+(440-APP.canvasHeight*s)/2,APP.canvasWidth*s,APP.canvasHeight*s);break;
    case'tv':mctx.fillStyle='#333';mctx.roundRect(50,100,500,350,20);mctx.fill();mctx.fillStyle='#000';mctx.fillRect(60,110,480,320);mctx.drawImage(ec,62,112,476,316);break;
  }
  mc.toBlob(b=>{saveAs(b,`mockup_${type}.png`);toast(`${type} mockup exported!`,'success');});
}

// ============================================================
// NEW CANVAS MODAL
// ============================================================
function showNewCanvasModal() {
  document.getElementById('modal-title').textContent = '✨ New Canvas';
  document.getElementById('modal-body').innerHTML = `
    <div class="modal-grid">
      <div class="modal-field"><label>Width (px)</label><input type="number" id="new-w" value="${APP.canvasWidth}" min="8" max="2000"></div>
      <div class="modal-field"><label>Height (px)</label><input type="number" id="new-h" value="${APP.canvasHeight}" min="8" max="2000"></div>
      <div class="modal-field"><label>Pixel W</label><input type="number" id="new-pw" value="${APP.pixelW}" min="1" max="200"></div>
      <div class="modal-field"><label>Pixel H</label><input type="number" id="new-ph" value="${APP.pixelH}" min="1" max="200"></div>
      <div class="modal-field"><label>FPS</label><input type="number" id="new-fps" value="${APP.fps}" min="1" max="120"></div>
      <div class="modal-field"><label>Name</label><input type="text" id="new-name" value="Untitled ${TAB_COUNTER+1}"></div>
    </div>
    <div style="margin-bottom:10px">
      <div style="font-size:9px;font-weight:700;color:var(--text3);margin-bottom:4px">CANVAS PRESETS</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        <span class="preset-badge" onclick="document.getElementById('new-w').value=480;document.getElementById('new-h').value=270">480×270</span>
        <span class="preset-badge" onclick="document.getElementById('new-w').value=270;document.getElementById('new-h').value=480">270×480</span>
        <span class="preset-badge" onclick="document.getElementById('new-w').value=400;document.getElementById('new-h').value=400">400×400</span>
        <span class="preset-badge" onclick="document.getElementById('new-w').value=256;document.getElementById('new-h').value=256">256×256</span>
        <span class="preset-badge" onclick="document.getElementById('new-w').value=128;document.getElementById('new-h').value=128">128×128</span>
        <span class="preset-badge" onclick="document.getElementById('new-w').value=64;document.getElementById('new-h').value=64">64×64</span>
      </div>
    </div>
    <div style="margin-bottom:10px">
      <div style="font-size:9px;font-weight:700;color:var(--text3);margin-bottom:4px">PIXEL SIZE PRESETS</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        <span class="preset-badge" onclick="document.getElementById('new-pw').value=1;document.getElementById('new-ph').value=1">1×1</span>
        <span class="preset-badge" onclick="document.getElementById('new-pw').value=4;document.getElementById('new-ph').value=4">4×4</span>
        <span class="preset-badge" onclick="document.getElementById('new-pw').value=8;document.getElementById('new-ph').value=8">8×8</span>
        <span class="preset-badge" onclick="document.getElementById('new-pw').value=16;document.getElementById('new-ph').value=16">16×16</span>
        <span class="preset-badge" onclick="document.getElementById('new-pw').value=20;document.getElementById('new-ph').value=20">20×20 ★</span>
        <span class="preset-badge" onclick="document.getElementById('new-pw').value=32;document.getElementById('new-ph').value=32">32×32</span>
      </div>
    </div>
    <div class="modal-actions">
      <button class="modal-btn" onclick="closeModal()">Cancel</button>
      <button class="modal-btn primary" onclick="createNewCanvas()">✨ Create</button>
    </div>`;
  document.getElementById('modal-overlay').classList.add('open');
}
function createNewCanvas() {
  const w=parseInt(document.getElementById('new-w').value)||400;
  const h=parseInt(document.getElementById('new-h').value)||400;
  const pw=parseInt(document.getElementById('new-pw').value)||20;
  const ph=parseInt(document.getElementById('new-ph').value)||20;
  const fps=parseInt(document.getElementById('new-fps').value)||12;
  const name=document.getElementById('new-name').value||'Untitled';
  closeModal();

  // Create new tab automatically (Chrome-style)
  const tab = newTab({name,w,h,pixW:pw,pixH:ph,fps});
  initCanvas(w,h,pw,ph);
  setFPS(fps);
  fitToScreen();
  toast(`New canvas "${name}" created!`,'success');
}
function closeModal(){document.getElementById('modal-overlay').classList.remove('open');}
document.getElementById('modal-overlay').addEventListener('click',e=>{if(e.target===document.getElementById('modal-overlay'))closeModal();});

// ============================================================
// THEME
// ============================================================
function toggleTheme(){
  APP.isDark=!APP.isDark;
  document.documentElement.setAttribute('data-theme',APP.isDark?'dark':'');
  document.getElementById('theme-toggle').textContent=APP.isDark?'☀️':'🌙';
  localStorage.setItem('pixier_theme',APP.isDark?'dark':'light');
  drawGrid();
}

// ============================================================
// TOAST
// ============================================================
let toastId=0;
function toast(msg,type='info',dur=2500){
  const id='t'+(++toastId);
  const el=document.createElement('div'); el.id=id; el.className=`toast ${type}`;
  el.innerHTML=`<div class="toast-title">${msg}</div>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(()=>{el.style.opacity='0';el.style.transition='opacity .3s';setTimeout(()=>el.remove(),300);},dur);
  return id;
}
function showProgressToast(title,progress){
  const id='t'+(++toastId);
  const el=document.createElement('div'); el.id=id; el.className='toast info';
  el.innerHTML=`<div class="toast-title">${title}</div><div class="toast-progress"><div class="toast-progress-bar" id="${id}-bar" style="width:${progress}%"></div></div>`;
  document.getElementById('toast-container').appendChild(el); return id;
}
function updateProgressToast(id,progress,title){
  const bar=document.getElementById(id+'-bar'); if(bar) bar.style.width=progress+'%';
  if(title){const el=document.getElementById(id);if(el)el.querySelector('.toast-title').textContent=title;}
}
function removeToast(id){const el=document.getElementById(id);if(el){el.style.opacity='0';setTimeout(()=>el.remove(),300);}}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown',e=>{
  APP.shiftPressed=e.shiftKey; APP.ctrlPressed=e.ctrlKey||e.metaKey; APP.altPressed=e.altKey;
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
  if(APP.ctrlPressed){
    switch(e.key.toLowerCase()){
      case'z':e.preventDefault();historyManager.undo();break;
      case'y':e.preventDefault();historyManager.redo();break;
      case's':e.preventDefault();savePXT();break;
      case'n':e.preventDefault();showNewCanvasModal();break;
      case'c':e.preventDefault();copySelection();break;
      case'v':e.preventDefault();pasteSelection();break;
      case'x':e.preventDefault();cutSelection();break;
      case'a':e.preventDefault();selectAll();break;
      case'e':e.preventDefault();quickExportPNG();break;
      case't':e.preventDefault();newTab();break;
      case'w':e.preventDefault();if(ACTIVE_TAB)closeTab(ACTIVE_TAB.id);break;
    }
    return;
  }
  switch(e.key.toLowerCase()){
    case'p':setTool('pencil');break;
    case'b':setTool('bucket');break;
    case'e':setTool('eraser');break;
    case'i':setTool('eyedropper');break;
    case'r':setTool('selection');break;
    case'm':setTool('move');break;
    case'l':setTool('line');break;
    case'c':setTool('circle');break;
    case't':setTool('text');switchTab('text');break;
    case'd':setTool('dither');break;
    case'g':setTool('gradient');break;
    case'h':toggleGrid();break;
    case'f':fitToScreen();break;
    case' ':e.preventDefault();togglePlay();break;
    case'arrowleft':prevFrame();break;
    case'arrowright':nextFrame();break;
    case'[':changeZoom(-.25);break;
    case']':changeZoom(.25);break;
    case'delete':case'backspace':if(APP.selection&&APP.currentTool==='selection')cutSelection();break;
  }
});
document.addEventListener('keyup',e=>{APP.shiftPressed=e.shiftKey;APP.ctrlPressed=e.ctrlKey||e.metaKey;APP.altPressed=e.altKey;});

// ============================================================
// HELPERS
// ============================================================
function hexToRgb(hex){const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);return r?{r:parseInt(r[1],16),g:parseInt(r[2],16),b:parseInt(r[3],16)}:null;}
function rgbToHex(r,g,b){'#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');return'#'+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');}

// ============================================================
// AUTO-SAVE
// ============================================================
setInterval(()=>{
  try{
    if(ACTIVE_TAB){saveCurrentStateToTab(ACTIVE_TAB);}
    localStorage.setItem('pixier_ts',Date.now().toString());
  }catch(e){}
},30000);

// ============================================================
// INIT
// ============================================================
function init() {
  // Polyfill roundRect
  if(!CanvasRenderingContext2D.prototype.roundRect){
    CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){if(w<2*r)r=w/2;if(h<2*r)r=h/2;this.beginPath();this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath();};
  }

  // Load theme
  if(localStorage.getItem('pixier_theme')==='dark') toggleTheme();

  // Create first tab
  const firstTab = createTabState('Untitled 1', 400, 400, 20, 20, 12);
  TABS.push(firstTab);
  ACTIVE_TAB = firstTab;
  FRAMES = firstTab.frames;
  LAYERS_CACHE = firstTab.layersCache;
  TEXT_OBJECTS = firstTab.textObjects;

  // Init canvas
  [mainCanvas,gridCanvas,overlayCanvas,safezoneCanvas,textOverlayCanvas].forEach(c=>{c.width=400;c.height=400;});
  addFrameToTab(firstTab);
  setCurrentFrame(0);
  updateZoom(); fitToScreen();
  setTool('pencil'); setBrush(1);
  renderPaletteGrid(); renderQuickColors();
  setPrimaryColor('#5B5FFF');

  // Welcome art
  const layer = getActiveLayer();
  if(layer){
    const lc=layer.canvas.getContext('2d');
    const grad=lc.createLinearGradient(0,0,400,400);
    grad.addColorStop(0,'#0D0D2B'); grad.addColorStop(.5,'#1A0A3B'); grad.addColorStop(1,'#2D0A4E');
    lc.fillStyle=grad; lc.fillRect(0,0,400,400);
    // Pixel stars
    for(let i=0;i<120;i++){
      const sx=Math.floor(Math.random()*20)*20;
      const sy=Math.floor(Math.random()*20)*20;
      const br=0.2+Math.random()*.8;
      lc.fillStyle=`rgba(255,255,255,${br})`;
      lc.fillRect(sx,sy,20,20);
    }
    // Pixel logo text
    lc.font='bold 28px "Press Start 2P"';
    lc.textAlign='center'; lc.textBaseline='middle';
    lc.fillStyle='rgba(91,95,255,0.15)';
    lc.fillText('PixieR',202,202);
    lc.fillStyle='rgba(255,255,255,0.9)';
    lc.fillText('PixieR',200,200);
    renderLayers();
  }

  renderTabBar();
  switchMode('clipping');
  drawGrid(); drawSafeZone();
  document.getElementById('fps-num').value = 12;
  document.getElementById('pixel-w').value = 20;
  document.getElementById('pixel-h').value = 20;
  document.getElementById('bb-pixel').textContent = '20×20';

  toast('Welcome to PixieR Studio! 🎨','success',3000);
  setTimeout(()=>toast('Ctrl+S = Save .pxt • Ctrl+T = New Tab • T = Text tool','info',5000),1500);
}

window.addEventListener('load', init);
window.addEventListener('resize', fitToScreen);