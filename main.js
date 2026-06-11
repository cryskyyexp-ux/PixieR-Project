/* ── LOGO PIXELS ── */
const colors = ['#ff6b6b','#4ecdc4','#ffe66d','#a29bfe','#fd79a8','#55efc4','#fdcb6e','#74b9ff'];
const lx = document.getElementById('logo-px');
for(let i=0;i<16;i++){
  const s = document.createElement('span');
  s.style.background = colors[Math.floor(Math.random()*colors.length)];
  s.style.opacity = (Math.random()*.5+.5).toFixed(2);
  lx.appendChild(s);
}

/* ── GRID CANVAS BACKGROUND ── */
const gc = document.getElementById('grid-canvas');
const gctx = gc.getContext('2d');
const CELL = 36;
let hovX=-1, hovY=-1;
let dark = false;

function resizeGrid(){
  gc.width = window.innerWidth;
  gc.height = window.innerHeight;
  drawGrid();
}

function drawGrid(){
  gctx.clearRect(0,0,gc.width,gc.height);
  const cols = Math.ceil(gc.width/CELL)+1;
  const rows = Math.ceil(gc.height/CELL)+1;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const x = c*CELL, y = r*CELL;
      const isHov = (c===hovX && r===hovY);
      const dx = c-hovX, dy = r-hovY;
      const dist = Math.sqrt(dx*dx+dy*dy);
      if(isHov || dist<2.2){
        const alpha = dark ? Math.max(0, 0.13 - dist*0.04) : Math.max(0, 0.09 - dist*0.03);
        gctx.fillStyle = dark ? `rgba(255,255,255,${alpha})` : `rgba(100,100,180,${alpha})`;
        gctx.fillRect(x+1,y+1,CELL-2,CELL-2);
      }
      gctx.strokeStyle = dark ? 'rgba(255,255,255,0.04)' : 'rgba(80,80,160,0.07)';
      gctx.lineWidth = 1;
      gctx.strokeRect(x+.5,y+.5,CELL,CELL);
    }
  }
}

window.addEventListener('mousemove', e=>{
  const nx = Math.floor(e.clientX/CELL);
  const ny = Math.floor(e.clientY/CELL);
  if(nx!==hovX||ny!==hovY){ hovX=nx; hovY=ny; drawGrid(); }
});
window.addEventListener('mouseleave',()=>{ hovX=-1;hovY=-1;drawGrid(); });
window.addEventListener('resize', resizeGrid);
resizeGrid();

/* ── THEME ── */
const html = document.documentElement;
const themeBtn = document.getElementById('theme-btn');
themeBtn.addEventListener('click',()=>{
  dark = html.getAttribute('data-theme')==='light';
  html.setAttribute('data-theme', dark?'dark':'light');
  drawGrid();
});

/* ── DRAG & DROP ── */
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
let sourceImg = null;

dropZone.addEventListener('dragover', e=>{ e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave',()=> dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e=>{
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const f = e.dataTransfer.files[0];
  if(f && f.type.startsWith('image/')) loadFile(f);
});
fileInput.addEventListener('change', e=>{ if(e.target.files[0]) loadFile(e.target.files[0]); });

function loadFile(file){
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      sourceImg = img;
      document.getElementById('orig-img').src = ev.target.result;
      document.getElementById('orig-info').textContent = `${img.width} × ${img.height} px`;
      document.getElementById('convert-btn').disabled = false;
      showToast('Image loaded! Hit Pixelate ✨');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

/* ── PRESETS ── */
document.getElementById('chip-w').addEventListener('click', e=>{
  const chip = e.target.closest('.chip');
  if(!chip) return;
  document.querySelectorAll('#chip-w .chip').forEach(c=>c.classList.remove('active'));
  chip.classList.add('active');
  document.getElementById('px-w').value = chip.dataset.w;
});
document.getElementById('chip-h').addEventListener('click', e=>{
  const chip = e.target.closest('.chip');
  if(!chip) return;
  document.querySelectorAll('#chip-h .chip').forEach(c=>c.classList.remove('active'));
  chip.classList.add('active');
  document.getElementById('px-h').value = chip.dataset.h;
});

/* sync typed value → deselect chips */
document.getElementById('px-w').addEventListener('input', ()=>{
  document.querySelectorAll('#chip-w .chip').forEach(c=>c.classList.remove('active'));
});
document.getElementById('px-h').addEventListener('input', ()=>{
  document.querySelectorAll('#chip-h .chip').forEach(c=>c.classList.remove('active'));
});

/* ── SCALE MODE ── */
let scaleMode = 'fit';
document.querySelectorAll('.mode-tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.mode-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    scaleMode = tab.dataset.mode;
  });
});

/* ── ZOOM ── */
const zoomRange = document.getElementById('zoom-range');
const zoomVal = document.getElementById('zoom-val');
zoomRange.addEventListener('input',()=>{
  zoomVal.textContent = zoomRange.value+'×';
  if(document.getElementById('preview-section').style.display !== 'none'){
    applyZoom();
  }
});

function applyZoom(){
  const canvas = document.getElementById('pixel-canvas');
  const z = parseInt(zoomRange.value);
  canvas.style.width = (canvas.width * z)+'px';
  canvas.style.height = (canvas.height * z)+'px';
}

/* ── PIXELATE ── */
document.getElementById('convert-btn').addEventListener('click', pixelate);

function pixelate(){
  if(!sourceImg) return;
  const pw = Math.max(4, Math.min(1024, parseInt(document.getElementById('px-w').value)||64));
  const ph = Math.max(4, Math.min(1024, parseInt(document.getElementById('px-h').value)||64));

  // progress
  const pb = document.getElementById('progress-bar');
  const pi = document.getElementById('progress-inner');
  pb.style.display = 'block';
  pi.style.width = '0%';

  setTimeout(()=>{ pi.style.width='30%'; }, 30);

  // small offscreen canvas for downsampling
  const small = document.createElement('canvas');
  let sw = pw, sh = ph;

  if(scaleMode === 'fit'){
    const ratio = sourceImg.width / sourceImg.height;
    if(pw/ph > ratio) { sw = Math.round(ph*ratio); sh = ph; }
    else { sw = pw; sh = Math.round(pw/ratio); }
  } else {
    sw = pw; sh = ph;
  }

  small.width = sw; small.height = sh;
  const sc = small.getContext('2d');

  if(scaleMode === 'crop'){
    // center-crop
    const srcRatio = sourceImg.width / sourceImg.height;
    const dstRatio = sw / sh;
    let sx=0,sy=0,sW=sourceImg.width,sH=sourceImg.height;
    if(srcRatio > dstRatio){ sW = Math.round(sourceImg.height*dstRatio); sx=(sourceImg.width-sW)/2; }
    else { sH = Math.round(sourceImg.width/dstRatio); sy=(sourceImg.height-sH)/2; }
    sc.drawImage(sourceImg, sx,sy,sW,sH, 0,0,sw,sh);
  } else {
    sc.drawImage(sourceImg, 0,0,sw,sh);
  }

  pi.style.width = '60%';

  // get pixel data
  const imgData = sc.getImageData(0,0,sw,sh);
  const d = imgData.data;

  // draw final canvas — each pixel = 1×1 on the output canvas
  const out = document.getElementById('pixel-canvas');
  out.width = sw;
  out.height = sh;
  const oc = out.getContext('2d');

  for(let y=0;y<sh;y++){
    for(let x=0;x<sw;x++){
      const idx = (y*sw+x)*4;
      const r=d[idx], g=d[idx+1], b=d[idx+2], a=d[idx+3];
      oc.fillStyle = `rgba(${r},${g},${b},${a/255})`;
      oc.fillRect(x,y,1,1);
    }
  }

  pi.style.width = '100%';
  setTimeout(()=>{ pb.style.display='none'; pi.style.width='0%'; },400);

  document.getElementById('pixel-info').textContent = `${sw} × ${sh} pixels`;
  document.getElementById('preview-section').style.display = 'block';
  applyZoom();
  document.getElementById('preview-section').scrollIntoView({behavior:'smooth',block:'start'});
  showToast(`Done! ${sw}×${sh} pixel art ready 🎉`);
}

/* ── DOWNLOAD ── */
function downloadCanvas(type){
  const canvas = document.getElementById('pixel-canvas');
  const mime = type==='jpg' ? 'image/jpeg' : type==='webp' ? 'image/webp' : 'image/png';
  const ext  = type;
  const link = document.createElement('a');
  link.download = `pixier_${canvas.width}x${canvas.height}.${ext}`;
  link.href = canvas.toDataURL(mime, 0.95);
  link.click();
  showToast(`Saved as ${ext.toUpperCase()} ✅`);
}
document.getElementById('dl-png').addEventListener('click',()=>downloadCanvas('png'));
document.getElementById('dl-jpg').addEventListener('click',()=>downloadCanvas('jpg'));
document.getElementById('dl-webp').addEventListener('click',()=>downloadCanvas('webp'));

/* ── TOAST ── */
let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2600);
}