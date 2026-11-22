'use strict';
/* Remotion renderer used by the office backend.
   Usage: node render.js <config.json> <output.mp4> */
const fs = require('fs');
const path = require('path');
const {bundle} = require('@remotion/bundler');
const {renderMedia, selectComposition} = require('@remotion/renderer');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const configPath = process.argv[2];
  const output = process.argv[3];
  if (!configPath || !output) throw new Error('Usage: node render.js <config.json> <output.mp4>');

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  fs.mkdirSync(path.dirname(output), {recursive: true});

  const serveUrl = await bundle({
    entryPoint: path.join(__dirname, 'src', 'index.js'),
    publicDir: path.join(__dirname, 'public'),
    outDir: path.join(__dirname, '.bundle'),
    onProgress: () => {},
  });

  const base = config.mode === 'campus' ? 'CampusIntro' : (config.mode === 'drama' ? 'DramaMovie' : (config.mode === 'talking' || config.presenter ? 'TalkingHead' : 'ProductVideo'));
  const id = config.format === 'wide' ? base + 'Wide' : base;
  const inputProps = Object.assign({}, config, {
    title: String(config.title || 'Cyborg Cheebee').slice(0, 120),
    tagline: String(config.tagline || 'Your AI Company. Your AI Team.').slice(0, 220),
    cta: String(config.cta || 'Dream Bigger. Let AI Work Harder!').slice(0, 160),
  });

  let composition = await selectComposition({serveUrl, id, inputProps});
  const durSec = Number(config.durationInSeconds || 0);
  const durFrames = Number(config.durationInFrames || 0);
  if (durFrames > 0) composition = {...composition, durationInFrames: Math.round(durFrames)};
  else if (durSec > 0) composition = {...composition, durationInFrames: Math.round(durSec * (composition.fps || 30))};
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: output,
    inputProps,
    browserExecutable: fs.existsSync(CHROME) ? CHROME : undefined,
    chromiumOptions: {disableWebSecurity: false},
    onProgress: ({progress}) => {
      if (Math.round(progress * 100) % 25 === 0) process.stdout.write('.');
    },
  });
  process.stdout.write('\n');
  console.log('RENDERED ' + output);
})().catch((e) => {
  console.error('RENDER_FAILED ' + (e && e.message ? e.message : e));
  process.exit(1);
});
