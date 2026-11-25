# WINTER BEAR STUDIO

A standalone romantic Winter & Snow Bear message studio.

## Current scope
- Winter scene and message editor
- Note preview and local text save
- Animated canvas video recording
- MP4 conversion through FFmpeg.wasm
- Web download; Android native save/play/share integration is the next milestone

## Safety
This repository is independent of AUTUMN-TREE-LOVE-NOTE-STUDIO. No Autumn files or branches are changed.

## Development
Run `npm install` then `npm run dev`.

The MP4 export currently depends on browser MediaRecorder/canvas capture support and network access to the FFmpeg CDN. Android APK builds are a separate validation target; a successful build does not prove device runtime compatibility.
