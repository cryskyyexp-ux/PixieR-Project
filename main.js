const gc = document.getElementById('grid-bg');
const gx = gc.getContext('2d');
const SZ = 34;
let hx=-1,hy=-1,isDark=false;

function resizeGC(){gc.width=innerWidth;gc.height=innerHeight;drawGC()}
function drawGC(){
  gx.clearRect(0,0,gc.width,gc.height);
  const C=Math.ceil(gc.width/SZ)+2,R=Math.ceil(gc.height/SZ)+2;
  for(let r=0;r<R;r++)for(let c=0;c<C;c++){
    const x=c*SZ,y=r*SZ;
    const dx=c-hx,dy=r-hy,dist=Math.sqrt(dx*dx+dy*dy);
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
addEventListener('resize',resizeGC);
resizeGC();
const pal=['#ff6b6b','#4ecdc4','#ffe66d','#a29bfe','#fd79a8','#55efc4','#fdcb6e','#74b9ff','#e17055'];
const lg=document.getElementById('lgrid');
for(let i=0;i<25;i++){
  const s=document.createElement('span');
  s.style.background=pal[Math.floor(Math.random()*pal.length)];
  s.style.opacity=(Math.random()*.45+.4).toFixed(2);
  lg.appendChild(s);
}
const html=document.documentElement;
document.getElementById('themeBtn').addEventListener('click',()=>{
  isDark=html.dataset.theme==='light';
  html.dataset.theme=isDark?'dark':'light';
  drawGC();
});
let srcImg=null, scaleMode='fit', linked=true, debTimer=null;
const dz=document.getElementById('drop-zone');
const fi=document.getElementById('file-input');

dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('over')});
dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
dz.addEventListener('drop',e=>{
  e.preventDefault();dz.classList.remove('over');
  const f=e.dataTransfer?.files[0];
  if(f&&f.type.startsWith('image/'))loadFile(f);
});
fi.addEventListener('change',e=>{if(fi.files[0])loadFile(fi.files[0])});

function setProgress(pct){
  const w=document.getElementById('load-prog'),b=document.getElementById('load-bar');
  if(pct===null){w.style.display='none';b.style.width='0%';return}
  w.style.display='block';b.style.width=pct+'%';
}

function loadFile(file){
  setProgress(10);
  const reader=new FileReader();
  reader.onprogress=e=>{if(e.lengthComputable)setProgress(10+70*(e.loaded/e.total))};
  reader.onload=ev=>{
    setProgress(85);
    const img=new Image();
    img.onload=()=>{
      srcImg=img;
      // show original thumb in upload zone
      document.getElementById('dz-empty').style.display='none';
      document.getElementById('orig-preview-wrap').style.display='block';
      document.getElementById('orig-thumb').src=ev.target.result;
      document.getElementById('fname').textContent=file.name;
      document.getElementById('fdims').textContent=`${img.width} × ${img.height} px · ${(file.size/1024).toFixed(0)} KB`;
      document.getElementById('file-badge').textContent=file.name.slice(0,22);
      dz.classList.add('has-image');
      // show workspace
      document.getElementById('workspace').style.display='block';
      document.getElementById('ws-orig').src=ev.target.result;
      document.getElementById('orig-dims-lbl').textContent=`${img.width}×${img.height}`;
      setProgress(100);
      setTimeout(()=>setProgress(null),500);
      pixelate();
      toast(`Loaded: ${img.width}×${img.height} · converting… ✨`);
      document.getElementById('workspace').scrollIntoView({behavior:'smooth',block:'start'});
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}
const pwInput=document.getElementById('pw');
const phInput=document.getElementById('ph');
const zoomSlider=document.getElementById('zoom');
const zoomLbl=document.getElementById('zoom-lbl');

// link W=H
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
});

// chips W
document.getElementById('chips-w').addEventListener('click',e=>{
  const c=e.target.closest('.chip');if(!c)return;
  setChipActive('w',c.dataset.v);
  pwInput.value=c.dataset.v;
  if(linked){phInput.value=c.dataset.v;setChipActive('h',c.dataset.v)}
  schedulePx();
});
// chips H
document.getElementById('chips-h').addEventListener('click',e=>{
  const c=e.target.closest('.chip');if(!c)return;
  setChipActive('h',c.dataset.v);
  phInput.value=c.dataset.v;
  schedulePx();
});

function setChipActive(axis,val){
  document.querySelectorAll(`#chips-${axis} .chip`).forEach(c=>c.classList.toggle('on',c.dataset.v===val));
}
function syncChips(axis,val){setChipActive(axis,String(val))}
function deactivateChips(axis){document.querySelectorAll(`#chips-${axis} .chip`).forEach(c=>c.classList.remove('on'))}

// scale mode
document.querySelectorAll('.mode-tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.mode-tab').forEach(x=>x.classList.remove('on'));
  t.classList.add('on');scaleMode=t.dataset.m;schedulePx();
}));
function schedulePx(){clearTimeout(debTimer);debTimer=setTimeout(pixelate,120)}
function pixelate(){
  if(!srcImg)return;
  const sp=document.getElementById('spinner');
  sp.style.display='flex';

  // Use requestAnimationFrame so the spinner actually appears before we block
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const pw=Math.max(4,Math.min(1024,parseInt(pwInput.value)||64));
    const ph=Math.max(4,Math.min(1024,parseInt(phInput.value)||64));
    let sw=pw,sh=ph;

    if(scaleMode==='fit'){
      const r=srcImg.width/srcImg.height;
      if(pw/ph>r){sw=Math.round(ph*r);sh=ph}else{sw=pw;sh=Math.round(pw/r)}
    }

    // Step 1: downsample to tiny canvas
    const small=document.createElement('canvas');
    small.width=sw;small.height=sh;
    const sc=small.getContext('2d');

    if(scaleMode==='crop'){
      const sr=srcImg.width/srcImg.height,dr=sw/sh;
      let sx=0,sy=0,sW=srcImg.width,sH=srcImg.height;
      if(sr>dr){sW=Math.round(srcImg.height*dr);sx=(srcImg.width-sW)/2}
      else{sH=Math.round(srcImg.width/dr);sy=(srcImg.height-sH)/2}
      sc.drawImage(srcImg,sx,sy,sW,sH,0,0,sw,sh);
    }else{
      sc.drawImage(srcImg,0,0,sw,sh);
    }

    // Step 2: paint each pixel as 1×1 block on output canvas
    const out=document.getElementById('pixel-canvas');
    out.width=sw;out.height=sh;
    const oc=out.getContext('2d');
    // Use putImageData for speed — just copy the downsampled pixels directly
    oc.drawImage(small,0,0);

    document.getElementById('pixel-dims-lbl').textContent=`${sw}×${sh}`;
    applyZoom();
    sp.style.display='none';
  }));
}

function applyZoom(){
  const c=document.getElementById('pixel-canvas');
  const z=parseInt(zoomSlider.value);
  c.style.width=(c.width*z)+'px';
  c.style.height=(c.height*z)+'px';
  c.style.imageRendering='pixelated';
}
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
  navigator.clipboard?.writeText(hex).then(()=>toast(`Copied color ${hex} 🎨`));
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