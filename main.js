const gc=document.getElementById('grid-bg'),gx=gc.getContext('2d');
const SZ=34;let hx=-1,hy=-1,isDark=false;
function resizeGC(){gc.width=innerWidth;gc.height=innerHeight;drawGC()}
function drawGC(){
  gx.clearRect(0,0,gc.width,gc.height);
  const C=Math.ceil(gc.width/SZ)+2,R=Math.ceil(gc.height/SZ)+2;
  for(let r=0;r<R;r++)for(let c=0;c<C;c++){
    const x=c*SZ,y=r*SZ,dx=c-hx,dy=r-hy,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<3){
      const a=isDark?Math.max(0,.14-dist*.05):Math.max(0,.1-dist*.035);
      gx.fillStyle=isDark?`rgba(255,255,255,${a})`:`rgba(90,80,200,${a})`;
      gx.fillRect(x+1,y+1,SZ-2,SZ-2);
    }
    gx.strokeStyle=isDark?'rgba(255,255,255,.04)':'rgba(80,80,180,.07)';
    gx.lineWidth=1;gx.strokeRect(x+.5,y+.5,SZ,SZ);
  }
}
addEventListener('mousemove',e=>{
  const nx=Math.floor(e.clientX/SZ),ny=Math.floor(e.clientY/SZ);
  if(nx!==hx||ny!==hy){hx=nx;hy=ny;drawGC()}
});
addEventListener('mouseleave',()=>{hx=-1;hy=-1;drawGC()});
addEventListener('resize',resizeGC);resizeGC();
const pal=['#ff6b6b','#4ecdc4','#ffe66d','#a29bfe','#fd79a8','#55efc4','#fdcb6e','#74b9ff','#e17055'];
const lg=document.getElementById('lgrid');
for(let i=0;i<25;i++){
  const s=document.createElement('span');
  s.style.cssText=`background:${pal[i%pal.length]};opacity:${(Math.random()*.45+.4).toFixed(2)}`;
  lg.appendChild(s);
}
const htmlEl=document.documentElement;
document.getElementById('themeBtn').addEventListener('click',()=>{
  isDark=htmlEl.dataset.theme==='light';
  htmlEl.dataset.theme=isDark?'dark':'light';
  drawGC();
});
let srcImg=null, scaleMode='fit', linked=true, debTimer=null;
let pixelated=false;
let viewMode='split';
const dz=document.getElementById('drop-zone');
const fi=document.getElementById('file-input');

dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('over')});
dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
dz.addEventListener('drop',e=>{
  e.preventDefault();dz.classList.remove('over');
  const f=e.dataTransfer?.files[0];
  if(f&&f.type.startsWith('image/'))loadFile(f);
});
fi.addEventListener('change',()=>{if(fi.files[0])loadFile(fi.files[0])});

function setFileProgress(pct){
  const w=document.getElementById('load-prog'),b=document.getElementById('load-bar');
  if(pct===null){w.style.display='none';b.style.width='0%';return}
  w.style.display='block';b.style.width=pct+'%';
}

function loadFile(file){
  pixelated=false;
  document.getElementById('ctrl-lock').classList.add('show');
  document.getElementById('rt-lbl').style.display='none';
  document.getElementById('workspace').style.display='none';

  setFileProgress(10);
  const reader=new FileReader();
  reader.onprogress=e=>{if(e.lengthComputable)setFileProgress(10+70*(e.loaded/e.total))};
  reader.onload=ev=>{
    setFileProgress(88);
    const img=new Image();
    img.onload=()=>{
      srcImg=img;
      document.getElementById('dz-empty').style.display='none';
      document.getElementById('orig-preview-wrap').style.display='block';
      document.getElementById('orig-thumb').src=ev.target.result;
      document.getElementById('fname').textContent=file.name;
      document.getElementById('fdims').textContent=`${img.width} × ${img.height} px · ${(file.size/1024).toFixed(0)} KB`;
      document.getElementById('file-badge').textContent=file.name.slice(0,22);
      dz.classList.add('has-image');
      document.getElementById('px-btn').disabled=false;
      setFileProgress(100);
      setTimeout(()=>setFileProgress(null),500);
      toast(`Image loaded! Hit ✨ Pixelate to convert`);
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}
const pxBtn=document.getElementById('px-btn');
const btnProg=document.getElementById('btn-prog');

pxBtn.addEventListener('click',()=>{
  if(!srcImg||pxBtn.disabled)return;
  pxBtn.disabled=true;
  pxBtn.textContent='⏳ Processing…';
  btnProg.style.display='block';
  let pct=0;
  const steps=[
    {at:0,   val:8},
    {at:300, val:22},
    {at:900, val:45},
    {at:1800,val:63},
    {at:2800,val:78},
    {at:3800,val:90},
    {at:4600,val:97},
  ];
  steps.forEach(({at,val})=>setTimeout(()=>{btnProg.style.width=val+'%'},at));

  setTimeout(()=>{
    btnProg.style.width='100%';
    setTimeout(()=>{
      doPixelate();
      pixelated=true;
      document.getElementById('ctrl-lock').classList.remove('show');
      document.getElementById('rt-lbl').style.display='flex';
      pxBtn.classList.add('shimmer');
      pxBtn.textContent='✨ Pixelate!';
      pxBtn.appendChild(btnProg);
      btnProg.style.width='0%';
      pxBtn.disabled=false;
      setTimeout(()=>pxBtn.classList.remove('shimmer'),900);
      document.getElementById('workspace').style.display='block';
      document.getElementById('ws-orig').src=document.getElementById('orig-thumb').src;
      document.getElementById('orig-dims-lbl').textContent=`${srcImg.width}×${srcImg.height}`;
      document.getElementById('workspace').scrollIntoView({behavior:'smooth',block:'start'});
      toast('Done! 🎉 Now tweak settings in realtime ✨');
    },200);
  },5000);
});
const pwInput=document.getElementById('pw');
const phInput=document.getElementById('ph');
const zoomSlider=document.getElementById('zoom');
const zoomLbl=document.getElementById('zoom-lbl');

document.getElementById('link-btn').addEventListener('click',function(){
  linked=!linked;
  this.classList.toggle('linked',linked);
  this.textContent=linked?'🔗':'🔓';
  if(linked){phInput.value=pwInput.value;syncChips('h',pwInput.value)}
});
pwInput.addEventListener('input',()=>{
  deactivateChips('w');
  if(linked){phInput.value=pwInput.value;syncChips('h',pwInput.value)}
  schedulePx();
});
phInput.addEventListener('input',()=>{deactivateChips('h');schedulePx()});
zoomSlider.addEventListener('input',()=>{
  zoomLbl.textContent=zoomSlider.value+'×';
  applyZoom();
  syncCmpCanvas();
  syncSoloCanvas();
});

document.getElementById('chips-w').addEventListener('click',e=>{
  const c=e.target.closest('.chip');if(!c)return;
  setChipActive('w',c.dataset.v);pwInput.value=c.dataset.v;
  if(linked){phInput.value=c.dataset.v;setChipActive('h',c.dataset.v)}
  schedulePx();
});
document.getElementById('chips-h').addEventListener('click',e=>{
  const c=e.target.closest('.chip');if(!c)return;
  setChipActive('h',c.dataset.v);phInput.value=c.dataset.v;schedulePx();
});

function setChipActive(axis,val){
  document.querySelectorAll(`#chips-${axis} .chip`).forEach(c=>c.classList.toggle('on',c.dataset.v===String(val)));
}
function syncChips(axis,val){setChipActive(axis,String(val))}
function deactivateChips(axis){document.querySelectorAll(`#chips-${axis} .chip`).forEach(c=>c.classList.remove('on'))}

document.querySelectorAll('.mode-tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.mode-tab').forEach(x=>x.classList.remove('on'));
  t.classList.add('on');scaleMode=t.dataset.m;schedulePx();
}));

function schedulePx(){
  if(!pixelated)return;
  clearTimeout(debTimer);debTimer=setTimeout(doPixelate,120);
}
document.querySelectorAll('.view-tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.view-tab').forEach(t=>t.classList.remove('on'));
    tab.classList.add('on');
    viewMode=tab.dataset.view;
    showView(viewMode);
  });
});
function showView(mode){
  document.getElementById('view-split').style.display  = mode==='split'   ? 'grid' : 'none';
  document.getElementById('compare-wrap').style.display= mode==='compare' ? 'block': 'none';
  document.getElementById('view-pixel').style.display  = mode==='pixel'   ? 'block': 'none';
  if(mode==='compare'){syncCmpCanvas();setCmpPos(.5)}
  if(mode==='pixel'){syncSoloCanvas()}
}
function doPixelate(){
  if(!srcImg)return;
  document.getElementById('spinner').style.display='flex';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const pw=Math.max(4,Math.min(1024,parseInt(pwInput.value)||64));
    const ph=Math.max(4,Math.min(1024,parseInt(phInput.value)||64));
    let sw=pw,sh=ph;
    if(scaleMode==='fit'){
      const r=srcImg.width/srcImg.height;
      if(pw/ph>r){sw=Math.round(ph*r);sh=ph}else{sw=pw;sh=Math.round(pw/r)}
    }
    const small=document.createElement('canvas');
    small.width=sw;small.height=sh;
    const sc=small.getContext('2d');
    if(scaleMode==='crop'){
      const sr=srcImg.width/srcImg.height,dr=sw/sh;
      let sx=0,sy=0,sW=srcImg.width,sH=srcImg.height;
      if(sr>dr){sW=Math.round(srcImg.height*dr);sx=(srcImg.width-sW)/2}
      else{sH=Math.round(srcImg.width/dr);sy=(srcImg.height-sH)/2}
      sc.drawImage(srcImg,sx,sy,sW,sH,0,0,sw,sh);
    }else{sc.drawImage(srcImg,0,0,sw,sh)}
    const out=document.getElementById('pixel-canvas');
    out.width=sw;out.height=sh;
    out.getContext('2d').drawImage(small,0,0);

    document.getElementById('pixel-dims-lbl').textContent=`${sw}×${sh}`;
    applyZoom();
    syncCmpCanvas();
    syncSoloCanvas();
    document.getElementById('spinner').style.display='none';
  }));
}

function applyZoom(){
  const c=document.getElementById('pixel-canvas');
  const z=parseInt(zoomSlider.value);
  c.style.width=(c.width*z)+'px';
  c.style.height=(c.height*z)+'px';
}
function syncCmpCanvas(){
  const src=document.getElementById('pixel-canvas');
  if(!src.width)return;
  const wrap=document.getElementById('compare-wrap');
  const ww=wrap.clientWidth||600;
  const aspect=srcImg?srcImg.height/srcImg.width:1;
  const h=Math.min(400,Math.round(ww*aspect));
  wrap.style.height=h+'px';
  document.getElementById('cmp-orig-img').src=document.getElementById('orig-thumb').src;
  const cmp=document.getElementById('cmp-canvas');
  cmp.width=src.width;cmp.height=src.height;
  cmp.style.width='100%';cmp.style.height='100%';
  cmp.style.imageRendering='pixelated';
  cmp.style.objectFit='contain';
  cmp.getContext('2d').drawImage(src,0,0);
}

function syncSoloCanvas(){
  const src=document.getElementById('pixel-canvas');
  if(!src.width)return;
  const solo=document.getElementById('solo-canvas');
  solo.width=src.width;solo.height=src.height;
  const z=parseInt(zoomSlider.value);
  solo.style.width=(src.width*z)+'px';
  solo.style.height=(src.height*z)+'px';
  solo.getContext('2d').drawImage(src,0,0);
}
let cmpDragging=false;
const cmpWrap=document.getElementById('compare-wrap');

function setCmpPos(frac){
  const pct=(Math.max(0,Math.min(1,frac))*100).toFixed(2);
  document.getElementById('compare-pixel').style.clipPath=`inset(0 ${(100-pct).toFixed(2)}% 0 0)`;
  document.getElementById('compare-divider').style.left=pct+'%';
  document.getElementById('compare-handle').style.left=pct+'%';
}

cmpWrap.addEventListener('mousedown',e=>{cmpDragging=true;moveCmp(e)});
cmpWrap.addEventListener('touchstart',e=>{cmpDragging=true;moveCmp(e.touches[0])},{passive:true});
addEventListener('mousemove',e=>{if(cmpDragging)moveCmp(e)});
addEventListener('touchmove',e=>{if(cmpDragging)moveCmp(e.touches[0])},{passive:true});
addEventListener('mouseup',()=>cmpDragging=false);
addEventListener('touchend',()=>cmpDragging=false);

function moveCmp(e){
  const r=cmpWrap.getBoundingClientRect();
  setCmpPos((e.clientX-r.left)/r.width);
}
setCmpPos(.5);
const pixelCanvas=document.getElementById('pixel-canvas');
const tip=document.getElementById('eyedrop-tip');
pixelCanvas.addEventListener('mousemove',e=>{
  const rect=pixelCanvas.getBoundingClientRect();
  const z=parseInt(zoomSlider.value);
  const cx=Math.floor((e.clientX-rect.left)/z);
  const cy=Math.floor((e.clientY-rect.top)/z);
  if(cx<0||cy<0||cx>=pixelCanvas.width||cy>=pixelCanvas.height){tip.style.display='none';return}
  const px=pixelCanvas.getContext('2d').getImageData(cx,cy,1,1).data;
  const hex=`#${[px[0],px[1],px[2]].map(v=>v.toString(16).padStart(2,'0')).join('')}`;
  tip.style.display='block';
  tip.innerHTML=`<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${hex};margin-right:5px;vertical-align:middle;border:1px solid rgba(255,255,255,.3)"></span>${hex} (${cx},${cy})`;
});
pixelCanvas.addEventListener('mouseleave',()=>tip.style.display='none');
pixelCanvas.addEventListener('click',e=>{
  const rect=pixelCanvas.getBoundingClientRect();
  const z=parseInt(zoomSlider.value);
  const cx=Math.floor((e.clientX-rect.left)/z);
  const cy=Math.floor((e.clientY-rect.top)/z);
  if(cx<0||cy<0||cx>=pixelCanvas.width||cy>=pixelCanvas.height)return;
  const px=pixelCanvas.getContext('2d').getImageData(cx,cy,1,1).data;
  const hex=`#${[px[0],px[1],px[2]].map(v=>v.toString(16).padStart(2,'0')).join('')}`;
  navigator.clipboard?.writeText(hex).then(()=>toast(`Copied ${hex} 🎨`));
});
function dlAs(type){
  if(!srcImg){toast('Load an image first!');return}
  const c=document.getElementById('pixel-canvas');
  const mime=type==='jpg'?'image/jpeg':type==='webp'?'image/webp':'image/png';
  const a=document.createElement('a');
  a.download=`pixier_${c.width}x${c.height}.${type}`;
  a.href=c.toDataURL(mime,.95);
  a.click();
  toast(`Saved as ${type.toUpperCase()} ✅`);
}
document.getElementById('dl-png').addEventListener('click',()=>dlAs('png'));
document.getElementById('dl-jpg').addEventListener('click',()=>dlAs('jpg'));
document.getElementById('dl-webp').addEventListener('click',()=>dlAs('webp'));
let tt;
function toast(msg){
  const el=document.getElementById('toast');
  el.textContent=msg;el.classList.add('show');
  clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('show'),2800);
}
(function() {
  const POPUP_KEY = 'pixier_star_popup_closed';
  const NEVER_KEY = 'pixier_star_never_again';
  const SESSION_SHOWN = 'pixier_star_shown_session';
  function createPopupHTML() {
    if (document.getElementById('starPopup')) return;
    
    const popupHTML = `
      <div id="starPopup" class="popup-overlay">
        <div class="popup-card">
          <div class="popup-icon">⭐✨</div>
          <h2>Love PixieR?</h2>
          <p>This tool is 100% free & open source.<br>Support the project by giving a star on GitHub!</p>
          <a href="https://github.com/cryskyyexp-ux/PixieR-Project" target="_blank" rel="noopener noreferrer" class="repo-link" id="popupRepoLink">github.com/cryskyyexp-ux/PixieR-Project</a>
          <div class="popup-buttons">
            <button class="star-btn" id="starNowBtn">🌟 Star on GitHub</button>
            <button class="later-btn" id="laterBtn">⏱️ Remind later</button>
            <button class="never-btn" id="neverBtn">🔕 Don't show again</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', popupHTML);
  }

  function closePopup() {
    const overlay = document.getElementById('starPopup');
    if (overlay) overlay.classList.remove('active');
  }

  function showPopup() {
    const overlay = document.getElementById('starPopup');
    if (overlay) overlay.classList.add('active');
  }

  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) {
      const newToast = document.createElement('div');
      newToast.id = 'toast';
      newToast.style.cssText = `
        position: fixed;
        bottom: 26px;
        left: 50%;
        transform: translateX(-50%) translateY(70px);
        background: var(--text, #1a1a2e);
        color: var(--bg, #ffffff);
        padding: 10px 22px;
        border-radius: 11px;
        font-size: 0.88rem;
        font-weight: 700;
        z-index: 9999;
        opacity: 0;
        transition: transform 0.3s, opacity 0.3s;
        white-space: nowrap;
        pointer-events: none;
      `;
      document.body.appendChild(newToast);
      newToast.innerText = msg;
      newToast.classList.add('show');
      setTimeout(() => newToast.classList.remove('show'), 2600);
      return;
    }
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function shouldShowPopup() {
    const never = localStorage.getItem(NEVER_KEY);
    if (never === 'true') return false;
    const sessionFlag = sessionStorage.getItem(SESSION_SHOWN);
    if (sessionFlag === 'true') return false;
    const closedFlag = localStorage.getItem(POPUP_KEY);
    if (closedFlag === 'true') return false;
    return true;
  }

  function markShown() {
    sessionStorage.setItem(SESSION_SHOWN, 'true');
  }

  function handleStar(e) {
    e.preventDefault();
    window.open('https://github.com/cryskyyexp-ux/PixieR-Project', '_blank');
    localStorage.setItem(POPUP_KEY, 'true');
    localStorage.setItem(NEVER_KEY, 'false');
    closePopup();
    showToast('Thanks a lot! ⭐ You made my day!');
  }

  function handleLater() {
    localStorage.removeItem(POPUP_KEY);
    sessionStorage.removeItem(SESSION_SHOWN);
    closePopup();
    showToast('Reminder set — you\'ll see the popup next visit.');
  }

  function handleNever() {
    localStorage.setItem(NEVER_KEY, 'true');
    localStorage.setItem(POPUP_KEY, 'true');
    sessionStorage.setItem(SESSION_SHOWN, 'true');
    closePopup();
    showToast('Okay, star popup won\'t bother you again 💙');
  }

  function initPopup() {
    createPopupHTML();
    
    const starBtn = document.getElementById('starNowBtn');
    const laterBtn = document.getElementById('laterBtn');
    const neverBtn = document.getElementById('neverBtn');
    const overlay = document.getElementById('starPopup');
    
    if (starBtn) starBtn.addEventListener('click', handleStar);
    if (laterBtn) laterBtn.addEventListener('click', handleLater);
    if (neverBtn) neverBtn.addEventListener('click', handleNever);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          handleLater();
        }
      });
    }
  }
window.addEventListener('load', () => {
    initPopup();
    setTimeout(() => {
      if (shouldShowPopup()) {
        showPopup();
        markShown();
      }
    }, 1200);
  });
})();