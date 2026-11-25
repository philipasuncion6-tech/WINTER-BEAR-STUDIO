const $ = (id) => document.getElementById(id);
const recipient=$('recipient'), occasion=$('occasion'), message=$('message');
const previewTo=$('previewTo'), previewOccasion=$('previewOccasion'), previewMessage=$('previewMessage');
const count=$('count'), createBtn=$('createVideoBtn'), progressWrap=$('progressWrap'), progressBar=$('progressBar'), status=$('status'), result=$('result'), video=$('videoPreview');
function updatePreview(){previewTo.textContent='For '+(recipient.value.trim()||'someone special');previewOccasion.textContent=occasion.value;previewMessage.textContent=message.value.trim()||'Your heartfelt message goes here.';count.textContent=message.value.length+' / 500'}
[recipient,occasion,message].forEach(el=>el.addEventListener('input',updatePreview));
$('previewBtn').addEventListener('click',()=>{updatePreview();$('notePanel').scrollIntoView({behavior:'smooth',block:'center'})});
$('saveNoteBtn').addEventListener('click',()=>{const note={recipient:recipient.value,occasion:occasion.value,message:message.value,savedAt:new Date().toISOString()};localStorage.setItem('winterBearNote',JSON.stringify(note));result.hidden=false;result.textContent='✓ Your message is saved on this device.'});
updatePreview();

function drawScene(ctx,w,h,frame){const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#102c4b');g.addColorStop(.62,'#7196ad');g.addColorStop(1,'#e6f1f4');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
ctx.fillStyle='#fff0c9';ctx.beginPath();ctx.arc(w*.78,h*.15,34,0,Math.PI*2);ctx.fill();
for(let i=0;i<7;i++){const x=(i*83+25)%w,y=h*.35+(i%3)*25;ctx.fillStyle='#173e43';ctx.beginPath();ctx.moveTo(x,y-100);ctx.lineTo(x-42,y+20);ctx.lineTo(x+42,y+20);ctx.closePath();ctx.fill()}
ctx.fillStyle='#674b3d';ctx.fillRect(w*.68,h*.49,105,90);ctx.fillStyle='#49363a';ctx.beginPath();ctx.moveTo(w*.65,h*.5);ctx.lineTo(w*.73,h*.39);ctx.lineTo(w*.82,h*.5);ctx.fill();ctx.fillStyle='#ffd27d';ctx.fillRect(w*.72,h*.54,22,35);
ctx.font='112px serif';ctx.textAlign='center';ctx.fillText('🐻‍❄️',w*.34,h*.67);
ctx.fillStyle='#fff';for(let i=0;i<90;i++){const x=(i*47+frame*1.8)%w,y=(i*71+frame*3.5)%h;ctx.globalAlpha=.45+(i%5)*.1;ctx.beginPath();ctx.arc(x,y,1.5+(i%3),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
ctx.fillStyle='#102b46';ctx.textAlign='center';ctx.font='bold 25px sans-serif';ctx.fillText('A COZY WINTER MOMENT',w/2,h*.79);ctx.font='21px Georgia';const words=(message.value.trim()||'Together feels like home.').slice(0,90);wrapText(ctx,words,w/2,h*.85,w*.82,29)}
function wrapText(ctx,text,x,y,maxWidth,lineHeight){const words=text.split(/\\s+/);let line='';for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);line=word;y+=lineHeight}else line=test}if(line)ctx.fillText(line,x,y)}
async function createVideo(){createBtn.disabled=true;result.hidden=true;progressWrap.hidden=false;progressBar.style.width='5%';status.textContent='Preparing the snowy scene…';let stream,recorder,ffmpeg;
try{const canvas=document.createElement('canvas');canvas.width=540;canvas.height=960;const ctx=canvas.getContext('2d');if(!canvas.captureStream||!window.MediaRecorder)throw new Error('This browser does not support canvas video recording. Please update Chrome or use a supported browser.');
stream=canvas.captureStream(24);const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!mime)throw new Error('Video recording format is not supported on this device.');
const chunks=[];recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1800000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
const stopped=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=()=>reject(new Error('Video recording failed.'))});
let frame=0;const timer=setInterval(()=>{drawScene(ctx,canvas.width,canvas.height,frame++);progressBar.style.width=Math.min(55,5+frame/3)+'%'},1000/24);drawScene(ctx,canvas.width,canvas.height,0);recorder.start(250);await new Promise(r=>setTimeout(r,10000));recorder.stop();await stopped;clearInterval(timer);stream.getTracks().forEach(t=>t.stop());
const webm=new Blob(chunks,{type:mime});if(!window.FFmpeg?.createFFmpeg)throw new Error('MP4 converter did not load. Check your internet connection and try again.');
status.textContent='Converting video to MP4…';progressBar.style.width='65%';ffmpeg=window.FFmpeg.createFFmpeg({log:false,mainName:'main',corePath:'https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js'});await ffmpeg.load();ffmpeg.FS('writeFile','winter.webm',await window.FFmpeg.fetchFile(webm));await ffmpeg.run('-i','winter.webm','-c:v','mpeg4','-q:v','5','-pix_fmt','yuv420p','-movflags','+faststart','winter.mp4');const data=ffmpeg.FS('readFile','winter.mp4');const mp4=new Blob([data.buffer],{type:'video/mp4'});const url=URL.createObjectURL(mp4);video.src=url;video.hidden=false;video.load();
const a=document.createElement('a');a.href=url;a.download='winter-bear-memory.mp4';document.body.appendChild(a);a.click();a.remove();progressBar.style.width='100%';status.textContent='MP4 created and download requested.';result.hidden=false;result.textContent='✓ Your Winter Bear MP4 is ready. It has been sent to your Downloads by the browser. Use the video player below to preview it.';video.scrollIntoView({behavior:'smooth',block:'center'});
}catch(err){result.hidden=false;result.textContent='Export could not finish: '+err.message;status.textContent='Please try again.';if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop())}finally{try{ffmpeg?.exit()}catch{}createBtn.disabled=false}}
createBtn.addEventListener('click',createVideo);
