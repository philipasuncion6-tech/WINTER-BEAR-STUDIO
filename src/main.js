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
winterScene.src = new URL('./winter-bear-scene.svg', import.meta.url).href;
const snowParticles = Array.from({ length: 145 }, (_, i) => ({
  x: (i * 83.17) % 540,
  y: (i * 61.73) % 960,
  radius: 0.8 + (i % 5) * 0.48,
  speed: 1.2 + (i % 7) * 0.48,
  drift: Math.sin(i * 2.4) * 0.42,
  alpha: 0.34 + (i % 6) * 0.1
}));

function drawScene(ctx, width, height, frame) {
  if (winterScene.complete && winterScene.naturalWidth) {
    ctx.drawImage(winterScene, 0, 0, width, height);
  } else {
    const fallback = ctx.createLinearGradient(0, 0, 0, height);
    fallback.addColorStop(0, '#09264c');
    fallback.addColorStop(1, '#eaf7ff');
    ctx.fillStyle = fallback;
    ctx.fillRect(0, 0, width, height);
  }

  // A gentle, bright aurora shimmer, kept subtle for the foreground.
  const aurora = ctx.createLinearGradient(0, 80, width, 360);
  aurora.addColorStop(0, 'rgba(64,255,205,0)');
  aurora.addColorStop(0.48, 'rgba(80,255,218,0.16)');
  aurora.addColorStop(1, 'rgba(133,144,255,0)');
  ctx.fillStyle = aurora;
  ctx.fillRect(0, 40, width, 360);

  // Three depth layers of continuously falling snow.
  for (const flake of snowParticles) {
    const y = (flake.y + frame * flake.speed) % height;
    const x = (flake.x + Math.sin((frame + flake.y) * 0.018) * 13 + frame * flake.drift * 0.12 + width) % width;
    ctx.globalAlpha = flake.alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, flake.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Soft warm glow from the cabin and lanterns.
  const glow = ctx.createRadialGradient(width * .73, height * .54, 2, width * .73, height * .54, 150);
  glow.addColorStop(0, 'rgba(255,205,112,.17)');
  glow.addColorStop(1, 'rgba(255,205,112,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(width * .42, height * .35, width * .58, height * .42);

  // Personal note appears clearly over the snow in the closing section.
  const fade = Math.min(1, Math.max(0, (frame - 110) / 32));
  ctx.globalAlpha = fade;
  ctx.fillStyle = 'rgba(7, 30, 55, .66)';
  ctx.beginPath();
  ctx.roundRect(width * .07, height * .77, width * .86, height * .17, 18);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,.65)';
  ctx.shadowBlur = 5;
  ctx.font = 'bold 22px Georgia';
  ctx.fillText((recipient.value.trim() || 'Someone special').slice(0, 34), width / 2, height * .81);
  ctx.font = 'bold 25px Georgia';
  const words = (message.value.trim() || 'Together feels like home.').slice(0, 105);
  wrapText(ctx, words, width / 2, height * .85, width * .76, 29);
  ctx.font = '14px sans-serif';
  ctx.fillText('WINTER BEAR STUDIO', width / 2, height * .925);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
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

async function saveMp4(mp4Blob) {
  const fileName = 'winter-bear-memory.mp4';

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

async function createVideo() {
  createBtn.disabled = true;
  result.hidden = true;
  progressWrap.hidden = false;
  progressBar.style.width = '3%';
  status.textContent = 'Preparing the bright snowy scene…';
  if (!winterScene.complete) await new Promise((resolve, reject) => { winterScene.onload = resolve; winterScene.onerror = () => reject(new Error('Winter Bear background could not load.')); });

  let stream;
  let recorder;
  let ffmpeg;
  let frameTimer;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 540;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');

    if (!canvas.captureStream || !window.MediaRecorder) {
      throw new Error('This browser does not support canvas video recording. Please update Chrome.');
    }

    stream = canvas.captureStream(24);
    const supportedType = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ].find((type) => MediaRecorder.isTypeSupported(type));

    if (!supportedType) {
      throw new Error('Video recording format is not supported on this device.');
    }

    const chunks = [];
    recorder = new MediaRecorder(stream, {
      mimeType: supportedType,
      videoBitsPerSecond: 1800000
    });
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size) chunks.push(event.data);
    };

    const recordingStopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = () => reject(new Error('Video recording failed.'));
    });

    let frame = 0;
    const startedAt = performance.now();
    frameTimer = window.setInterval(() => {
      drawScene(ctx, canvas.width, canvas.height, frame++);
      const percent = Math.min(48, 3 + ((performance.now() - startedAt) / 10000) * 45);
      progressBar.style.width = percent + '%';
    }, 1000 / 24);

    drawScene(ctx, canvas.width, canvas.height, 0);
    recorder.start(250);
    await new Promise((resolve) => window.setTimeout(resolve, 10000));
    recorder.stop();
    await recordingStopped;
    window.clearInterval(frameTimer);
    frameTimer = undefined;
    stream.getTracks().forEach((track) => track.stop());

    if (!chunks.length) throw new Error('No video data was recorded.');
    const webmBlob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });

    status.textContent = 'Loading MP4 conversion engine…';
    progressBar.style.width = '52%';

    ffmpeg = new FFmpeg();
    ffmpeg.on('progress', ({ progress }) => {
      if (!Number.isFinite(progress) || progress < 0) return;
      progressBar.style.width = Math.min(94, 52 + Math.round(progress * 42)) + '%';
      status.textContent = 'MP4 conversion: ' + Math.round(progress * 100) + '%';
    });

    ffmpeg.on('log', ({ message: logMessage }) => {
      if (logMessage) console.log('[Winter Bear FFmpeg]', logMessage);
    });

    const assetBase = new URL('assets/', document.baseURI);
    await ffmpeg.load({
      coreURL: new URL('ffmpeg-core-esm.js', assetBase).href,
      wasmURL: new URL('ffmpeg-core-esm.wasm', assetBase).href,
      classWorkerURL: new URL('814.ffmpeg.js', assetBase).href
    });

    status.textContent = 'Writing recorded winter scene…';
    await ffmpeg.writeFile('winter-input.webm', await fetchFile(webmBlob));

    status.textContent = 'Converting Winter Bear video to MP4…';
    await ffmpeg.exec([
      '-i', 'winter-input.webm',
      '-c:v', 'mpeg4',
      '-q:v', '5',
      '-threads', '1',
      '-r', '24',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-an',
      'winter-bear-memory.mp4'
    ]);

    const data = await ffmpeg.readFile('winter-bear-memory.mp4');
    const mp4Blob = new Blob([data], { type: 'video/mp4' });
    const objectUrl = URL.createObjectURL(mp4Blob);
    video.src = objectUrl;
    video.hidden = false;
    video.load();

    const saveMessage = await saveMp4(mp4Blob);
    progressBar.style.width = '100%';
    status.textContent = 'Winter Bear MP4 is ready.';
    result.hidden = false;
    result.textContent = '✓ ' + saveMessage + ' You can preview the video below.';
    video.scrollIntoView({ behavior: 'smooth', block: 'center' });

    await ffmpeg.deleteFile('winter-input.webm').catch(() => {});
    await ffmpeg.deleteFile('winter-bear-memory.mp4').catch(() => {});
  } catch (error) {
    console.error(error);
    result.hidden = false;
    result.textContent = 'Export could not finish: ' + (error.message || String(error));
    status.textContent = 'Please try again.';
  } finally {
    if (frameTimer) window.clearInterval(frameTimer);
    if (recorder && recorder.state === 'recording') recorder.stop();
    if (stream) stream.getTracks().forEach((track) => track.stop());
    if (ffmpeg) ffmpeg.terminate();
    createBtn.disabled = false;
  }
}

createBtn.addEventListener('click', createVideo);
