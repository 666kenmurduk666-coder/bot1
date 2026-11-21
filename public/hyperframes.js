/* HyperFrames compatibility module (v3).
   The main app already renders and wires the video editor controls (#vf*).
   This file exists so /hyperframes.js?v=3 resolves to real JavaScript instead
   of the SPA's text/plain 404 fallback. It has no side effects and exposes a
   tiny status object for diagnostics. */
(function () {
  'use strict';
  var api = {
    version: '3',
    name: 'HyperFrames Video Editor',
    ready: true,
    loadedAt: Date.now(),
    controls: ['vfTitle', 'vfTagline', 'vfCta', 'vfFormat', 'vfColor1', 'vfColor2', 'vfImage', 'vfVoice', 'vfBrief']
  };
  window.Hyperframes = api;
  window.HyperFrames = api;
  try {
    window.dispatchEvent(new CustomEvent('hyperframes:ready', { detail: api }));
  } catch (e) { /* older browsers: no-op */ }
})();
