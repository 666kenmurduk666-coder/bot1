const fs=require('fs'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const has=id=>html.includes('id=\"'+id+'\"')||html.includes("id='"+id+"'");
[
  'officeCamTools','camZoomIn','camZoomOut','camFit','camReset','camSave','camLoad','camMiniToggle','officeMiniMap','officeCamHint'
].forEach(id=>assert(has(id),'missing office camera control: '+id));
assert(/height:clamp\(520px,72vh,900px\)/.test(html),'3D viewport should scale to desktop viewport height');
assert(/@media\(max-width:700px\)/.test(html),'mobile office viewport styles missing');
assert(/Math\.min\(150,Math\.max\(2\.5,cam3d\.r\*step\)\)/.test(html),'mouse wheel zoom-out range was not expanded');
assert(/Math\.min\(150,Math\.max\(2\.5,pinch0\.r\*pinch0\.d\/d\)\)/.test(html),'pinch zoom-out range was not expanded');
assert(/function fitOfficeCampus\(\)/.test(html),'fit-campus camera preset missing');
assert(/function saveOfficeCamera\(\)/.test(html)&&/function loadOfficeCamera\(\)/.test(html),'camera persistence functions missing');
assert(/function drawOfficeMiniMap\(\)/.test(html),'minimap renderer missing');
assert(/function syncOfficeRendererSize\(\)/.test(html),'renderer resize synchronization missing');
assert(html.includes("https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.min.js"),'pinned Three.js fallback missing');
assert(html.includes("info.textContent='3D · Drag: rotate"),'camera help text missing');
console.log('Office layout controls: PASS (20 assertions)');
