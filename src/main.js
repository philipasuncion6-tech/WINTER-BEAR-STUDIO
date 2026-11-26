import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const $ = (id) => document.getElementById(id);
const recipient = $('recipient');
const occasion = $('occasion');
const message = $('message');
const previewTo = $('previewTo');
const previewOccasion = $('previewOccasion');
const previewMessage = $('previewMessage');
const count = $('count');
const createBtn = $('createVideoBtn');
const progressWrap = $('progressWrap');
const progressBar = $('progressBar');
const status = $('status');
const result = $('result');
const video = $('videoPreview');

function updatePreview() {
  previewTo.textContent = 'For ' + (recipient.value.trim() || 'someone special');
  previewOccasion.textContent = occasion.value;
  previewMessage.textContent = message.value.trim() || 'Your heartfelt message goes here.';
  count.textContent = message.value.length + ' / 500';
}

[recipient, occasion, message].forEach((element) => element.addEventListener('input', updatePreview));

$('previewBtn').addEventListener('click', () => {
  updatePreview();
  $('notePanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

$('saveNoteBtn').addEventListener('click', () => {
  const note = {
    recipient: recipient.value,
    occasion: occasion.value,
    message: message.value,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem('winterBearNote', JSON.stringify(note));
  result.hidden = false;
  result.textContent = '✓ Your message is saved on this device.';
});

updatePreview();

const winterScene = new Image();
winterScene.src = new URL('../assets/winter-bear-video.webp', import.meta.url).href;
winterScene.onerror = () => { winterScene.onerror = null; winterScene.src = new URL('./winter-bear-scene.svg', import.meta.url).href; };
const snowParticles = Array.from({ length: 320 }, (_, i) => ({
  x: (i * 83.17) % 540,
  y: (i * 61.73) % 960,
  radius: 0.8 + (i % 9) * 0.58,
  speed: 1.05 + (i % 11) * 0.48,
  drift: Math.sin(i * 2.4) * (0.35 + (i % 4) * 0.18),
  alpha: 0.42 + (i % 7) * 0.08,
  depth: i % 3
}));

function drawCover(ctx, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sw = width / scale, sh = height / scale;
  ctx.drawImage(image, (image.width-sw)/2, (image.height-sh)/2, sw, sh, 0, 0, width, height);
}
function drawScene(ctx, width, height, frame) {
  const portrait = height > width;
  if (winterScene.complete && winterScene.naturalWidth) {
    if (portrait) {
      ctx.save(); ctx.filter = 'blur(18px)'; drawCover(ctx,winterScene,width,height); ctx.filter='none';
      ctx.fillStyle='rgba(5,18,32,.3)'; ctx.fillRect(0,0,width,height);
      const scale=Math.min(width/winterScene.width,height*.48/winterScene.height);
      const w=winterScene.width*scale,h=winterScene.height*scale;
      ctx.drawImage(winterScene,(width-w)/2,height*.25,w,h); ctx.restore();
    } else drawCover(ctx,winterScene,width,height);
  } else { ctx.fillStyle='#173b58'; ctx.fillRect(0,0,width,height); }
  for (const flake of snowParticles) {
    const y=(flake.y+frame*flake.speed*(flake.depth===0?.72:flake.depth===2?1.42:1))%height;
    const wind=Math.sin(frame*.022+flake.y*.025)*(flake.depth===2?34:20);
    const x=(flake.x+wind+frame*flake.drift*.18+width)%width;
    ctx.globalAlpha=Math.min(1,flake.alpha*(flake.depth===2?1.32:1));
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,flake.radius*(flake.depth===2?1.45:1),0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  const fade=Math.min(1,Math.max(0,(frame-165)/28));
  const py=portrait?height*.70:height*.68, ph=portrait?height*.27:height*.29;
  ctx.globalAlpha=fade;ctx.fillStyle='rgba(7,24,42,.76)';ctx.beginPath();
  ctx.roundRect(width*.045,py,width*.91,ph,Math.max(12,width*.018));ctx.fill();
  ctx.textAlign='center';ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.65)';ctx.shadowBlur=5;
  ctx.font='bold '+(portrait?23:28)+'px Georgia';
  ctx.fillText((recipient.value.trim()||'Someone special').slice(0,34),width/2,py+ph*.25);
  ctx.font='bold '+(portrait?22:27)+'px Georgia';
  wrapText(ctx,(message.value.trim()||'Together feels like home.').slice(0,105),width/2,py+ph*.48,width*.82,portrait?27:31);
  ctx.font=(portrait?15:17)+'px sans-serif';ctx.fillText('WINTER BEAR STUDIO',width/2,py+ph*.75);
  const shimmer=.82+(Math.sin(frame*.12)+1)*.09;
  const gold=ctx.createLinearGradient(width*.25,0,width*.75,0);
  gold.addColorStop(0,'#9c6a18');gold.addColorStop(.28,'#fff0a6');gold.addColorStop(.52,'#d5a63b');gold.addColorStop(.76,'#fff5c2');gold.addColorStop(1,'#9c6a18');
  ctx.globalAlpha=fade*shimmer;ctx.font='italic '+(portrait?27:31)+'px "Great Vibes","Brush Script MT",cursive';
  ctx.fillStyle=gold;ctx.shadowColor='rgba(255,211,105,.75)';ctx.shadowBlur=13+Math.sin(frame*.12)*4;
  ctx.fillText('Author by P. Asuncion',width/2,py+ph*.92);ctx.shadowBlur=0;ctx.globalAlpha=1;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(/\s+/);
  let line = '';
  for (const word of words) {
    const testLine = line ? line + ' ' + word : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result || '');
      const comma = dataUrl.indexOf(',');
      if (comma < 0) {
        reject(new Error('Could not prepare the MP4 for Android Downloads.'));
        return;
      }
      resolve(dataUrl.slice(comma + 1));
    };
    reader.onerror = () => reject(new Error('Could not read the generated MP4.'));
    reader.readAsDataURL(blob);
  });
}

async function saveMp4(mp4Blob, fileName) {

  if (window.AndroidDownloader && typeof window.AndroidDownloader.saveBase64 === 'function') {
    status.textContent = 'Saving MP4 to Android Downloads…';
    const response = window.AndroidDownloader.saveBase64(fileName, await blobToBase64(mp4Blob));
    if (response !== 'OK') {
      throw new Error(response || 'Android could not save the MP4 to Downloads.');
    }
    return 'Your Winter Bear MP4 is saved in the Android Downloads folder.';
  }

  const url = URL.createObjectURL(mp4Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  return 'Your Winter Bear MP4 download has started.';
}

async function recordFormat(width,height,ffmpeg,label,fileName,progressStart) {
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');
  if(!canvas.captureStream||!window.MediaRecorder)throw new Error('This browser does not support canvas video recording. Please update Chrome.');
  const stream=canvas.captureStream(24);
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
  if(!mime)throw new Error('Video recording format is not supported on this device.');
  const chunks=[],recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1800000});
  recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
  const stopped=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=()=>reject(new Error(label+' recording failed.'));});
  let frame=0;const started=performance.now();
  const timer=window.setInterval(()=>{drawScene(ctx,width,height,frame++);progressBar.style.width=Math.min(progressStart+20,progressStart+(performance.now()-started)/10000*20)+'%';status.textContent='Creating '+label+' video…';},1000/24);
  drawScene(ctx,width,height,0);recorder.start(250);await new Promise(r=>window.setTimeout(r,10000));recorder.stop();await stopped;
  window.clearInterval(timer);stream.getTracks().forEach(t=>t.stop());
  if(!chunks.length)throw new Error('No video data was recorded for '+label+'.');
  await ffmpeg.writeFile('winter-input.webm',await fetchFile(new Blob(chunks,{type:recorder.mimeType||'video/webm'})));
  status.textContent='Converting '+label+' video to MP4…';
  await ffmpeg.exec(['-i','winter-input.webm','-c:v','mpeg4','-q:v','5','-threads','1','-r','24','-pix_fmt','yuv420p','-movflags','+faststart','-an','winter-output.mp4']);
  const data=await ffmpeg.readFile('winter-output.mp4'),blob=new Blob([data],{type:'video/mp4'});
  const url=URL.createObjectURL(blob);video.src=url;video.hidden=false;video.load();
  const saved=await saveMp4(blob,fileName);
  await ffmpeg.deleteFile('winter-input.webm').catch(()=>{});await ffmpeg.deleteFile('winter-output.mp4').catch(()=>{});
  return saved;
}
async function createVideo() {
  createBtn.disabled=true;result.hidden=true;progressWrap.hidden=false;progressBar.style.width='3%';
  status.textContent='Preparing both Winter Bear formats…';let ffmpeg;
  try {
    if(!winterScene.complete)await new Promise(resolve=>{winterScene.onload=resolve;winterScene.onerror=resolve;});
    ffmpeg=new FFmpeg();ffmpeg.on('progress',({progress})=>{if(Number.isFinite(progress)&&progress>=0)progressBar.style.width=Math.min(98,43+Math.round(progress*12))+'%';});
    ffmpeg.on('log',({message})=>{if(message)console.log('[Winter Bear FFmpeg]',message);});
    const base=new URL('assets/',document.baseURI);
    await ffmpeg.load({coreURL:new URL('ffmpeg-core-esm.js',base).href,wasmURL:new URL('ffmpeg-core-esm.wasm',base).href,classWorkerURL:new URL('814.ffmpeg.js',base).href});
    const p=await recordFormat(540,960,ffmpeg,'Portrait 9:16','winter-bear-portrait.mp4',3);
    const l=await recordFormat(960,540,ffmpeg,'Landscape 16:9','winter-bear-landscape.mp4',25);
    progressBar.style.width='100%';status.textContent='Both Winter Bear MP4 videos are ready.';
    result.hidden=false;result.textContent='✓ Portrait and Landscape MP4 files saved. '+p+' '+l;
    video.scrollIntoView({behavior:'smooth',block:'center'});
  } catch(error) {console.error(error);result.hidden=false;result.textContent='Export could not finish: '+(error.message||String(error));status.textContent='Please try again.';}
  finally {if(ffmpeg)ffmpeg.terminate();createBtn.disabled=false;}
}
createBtn.addEventListener('click', createVideo);
