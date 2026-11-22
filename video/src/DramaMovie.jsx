import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};

const CHARS = {
  andres: {shirt:'#8a6a48', pants:'#4a3a2a', hair:'#a9b0b8', skin:'#e6b58a', glasses:false, beard:true, label:'MANG ANDRES', scale:1},
  rich:   {shirt:'#1c2340', pants:'#141a30', hair:'#a9b0b8', skin:'#e6b58a', tie:'#f5c451', beard:false, label:'DON ANDRES', scale:1},
  lily:   {shirt:'#ff8fb1', pants:'#c94f7a', hair:'#3a2418', skin:'#f0c39c', label:'LILY', scale:.72},
  miguel: {shirt:'#4a9fd6', pants:'#24486b', hair:'#2a1c14', skin:'#e6b58a', label:'MIGUEL', scale:1.05},
  loring: {shirt:'#d98fb1', pants:'#8a4f74', hair:'#2a1c14', skin:'#edbd93', label:'LORING', scale:1},
};

function Blocky({who, frame, speaking, x, y, extra}) {
  const c = CHARS[who] || CHARS.andres;
  const s = (c.scale || 1) * (extra && extra.scale ? extra.scale : 1);
  const blink = (frame % 170) < 6;
  const mouthH = speaking ? 5 + Math.abs(Math.sin(frame / 2.6)) * 11 : 3;
  const bob = speaking ? Math.sin(frame / 5) * 3 : Math.sin(frame / 40) * 1.5;
  return (
    <div style={{position:'absolute', left:x, top:y + bob, transform:`scale(${s})`, transformOrigin:'bottom center', filter:'drop-shadow(0 16px 22px rgba(0,0,0,.45))'}}>
      {/* head */}
      <div style={{position:'relative', width:150, height:140, background:c.skin, borderRadius:26, border:'4px solid rgba(0,0,0,.15)', boxSizing:'border-box'}}>
        <div style={{position:'absolute', left:-4, top:-14, width:158, height:56, background:c.hair, borderRadius:'26px 26px 10px 10px'}} />
        <div style={{position:'absolute', left:26, top:52, width:26, height:blink?4:28, background:'#20242e', borderRadius:6}} />
        <div style={{position:'absolute', right:26, top:52, width:26, height:blink?4:28, background:'#20242e', borderRadius:6}} />
        {!blink ? <><div style={{position:'absolute', left:32, top:57, width:8, height:8, background:'#fff', borderRadius:'50%'}}/><div style={{position:'absolute', right:32, top:57, width:8, height:8, background:'#fff', borderRadius:'50%'}}/></> : null}
        {c.beard ? <div style={{position:'absolute', left:34, top:96, width:82, height:30, background:'#c9cdd2', borderRadius:'0 0 30px 30px', opacity:.85}}/> : null}
        <div style={{position:'absolute', left:'50%', top:96, transform:'translateX(-50%)', width:46, height:mouthH, background:'#7a2d38', borderRadius:'0 0 22px 22px', borderBottom:'3px solid #4a1620'}} />
      </div>
      {/* torso */}
      <div style={{position:'relative', width:170, height:150, margin:'6px auto 0', background:c.shirt, borderRadius:22, border:'4px solid rgba(0,0,0,.15)', boxSizing:'border-box'}}>
        {c.tie ? <div style={{position:'absolute', left:'50%', top:6, transform:'translateX(-50%)', width:18, height:96, background:c.tie, clipPath:'polygon(50% 0,100% 22%,72% 50%,100% 78%,50% 100%,0 78%,28% 50%,0 22%)'}}/> : null}
        {/* arms */}
        <div style={{position:'absolute', left:-34, top:14, width:34, height:112, background:c.shirt, borderRadius:16}} />
        <div style={{position:'absolute', right:-34, top:14, width:34, height:112, background:c.shirt, borderRadius:16}} />
      </div>
      {/* legs */}
      <div style={{display:'flex', gap:14, justifyContent:'center', marginTop:2}}>
        <div style={{width:54, height:96, background:c.pants, borderRadius:'0 0 14px 14px'}} />
        <div style={{width:54, height:96, background:c.pants, borderRadius:'0 0 14px 14px'}} />
      </div>
      <div style={{marginTop:8, textAlign:'center', fontSize:18, fontWeight:800, color:'#fff', letterSpacing:2, textShadow:'0 2px 8px #000'}}>{c.label}</div>
    </div>
  );
}

function Background({kind}) {
  if (kind === 'church') return (
    <AbsoluteFill style={{background:'linear-gradient(180deg,#2b3b57 0%,#6a7484 60%,#9a8f7c 100%)'}}>
      <div style={{position:'absolute', left:'50%', top:0, transform:'translateX(-50%)', width:360, height:330, background:'#d9d2c2', borderRadius:'180px 180px 0 0', opacity:.9}}/>
      <div style={{position:'absolute', inset:0, top:'62%', background:'repeating-linear-gradient(0deg,#8d8070 0 26px,#7a6e60 26px 30px)'}}/>
    </AbsoluteFill>
  );
  if (kind === 'mansion') return (
    <AbsoluteFill style={{background:'linear-gradient(180deg,#17324f 0%,#3f6b8a 55%,#5e8f5a 100%)'}}>
      <div style={{position:'absolute', left:'8%', top:'18%', width:'84%', height:'50%', background:'#e8e3d6', borderRadius:12, boxShadow:'0 20px 60px #0006'}}/>
      <div style={{position:'absolute', left:'8%', top:'9%', width:'84%', height:'12%', background:'#3a3f52', clipPath:'polygon(50% 0,100% 100%,0 100%)'}}/>
      {[20,40,60,80].map((l,i)=><div key={i} style={{position:'absolute', left:l+'%', top:'26%', width:'12%', height:'22%', background:'#8fd3ff', border:'6px solid #f5f1e6'}}/>)}
    </AbsoluteFill>
  );
  if (kind === 'road') return (
    <AbsoluteFill style={{background:'linear-gradient(180deg,#0d1424 0%,#1b2740 60%,#2a2a32 100%)'}}>
      <div style={{position:'absolute', left:-40, top:'30%', width:300, height:120, background:'#fff8d0', filter:'blur(60px)', opacity:.7}}/>
      <div style={{position:'absolute', inset:0, top:'72%', background:'#2a2a32'}}/>
      <div style={{position:'absolute', inset:0, top:'72%', background:'repeating-linear-gradient(90deg,#f5d76e 0 60px,transparent 60px 130px)', height:12}}/>
    </AbsoluteFill>
  );
  if (kind === 'garden') return (
    <AbsoluteFill style={{background:'linear-gradient(180deg,#1e3a5f 0%,#4a7a8c 50%,#4f8a4a 100%)'}}>
      {[[15,70],[35,80],[60,72],[82,78]].map((p,i)=><div key={i} style={{position:'absolute', left:p[0]+'%', top:p[1]+'%', width:70, height:70, background:['#ff8fb1','#ffd36e','#b58cff','#7fe0a8'][i], borderRadius:'50%', filter:'blur(2px)', opacity:.85}} />)}
    </AbsoluteFill>
  );
  if (kind === 'room') return (
    <AbsoluteFill style={{background:'linear-gradient(180deg,#2a2340 0%,#4a3a5e 60%,#6a5568 100%)'}}>
      <div style={{position:'absolute', left:'12%', top:'16%', width:'76%', height:'46%', background:'#1a1a2a', borderRadius:14, border:'12px solid #c9a86a'}}/>
      <div style={{position:'absolute', left:'16%', top:'22%', width:'68%', height:'34%', background:'linear-gradient(135deg,#3a5a7a,#7a4a6a)'}}/>
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{background:'linear-gradient(180deg,#101a2c 0%,#27405e 55%,#4a5a68 100%)'}}>
      {[8,28,50,72,90].map((l,i)=><div key={i} style={{position:'absolute', left:l+'%', top:(20+(i%3)*12)+'%', width:'10%', height:(30+(i%2)*16)+'%', background:'#1c2a3e', opacity:.9}} />)}
    </AbsoluteFill>
  );
}

export const DramaMovie = ({slides = [], title = 'ANG PULUBI NA MAYAMAN', subtitle = '', brand = 'CYBORG CHEEBEE OFFICE'}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const list = Array.isArray(slides) ? slides.filter(Boolean).slice(0, 40) : [];
  const fpsN = fps || 30;
  const cum = [];
  let acc = 0;
  list.forEach(sl => { acc += (Number(sl.seconds) || 0); cum.push(acc); });
  const sec = frame / fpsN;
  let idx = 0;
  for (let i = 0; i < cum.length; i++) { if (sec >= cum[i]) idx = Math.min(i + 1, list.length - 1); }
  const startSec = idx > 0 ? cum[idx - 1] : 0;
  const endSec = cum[idx] || (durationInFrames / fpsN);
  const sl = list[idx] || {};
  const local = frame - Math.round(startSec * fpsN);
  const slideIn = interpolate(local, [0, 12], [0, 1], clamp);
  const slideOut = interpolate(local, [Math.max(0, (endSec - startSec) * fpsN - 12), (endSec - startSec) * fpsN], [1, 0], clamp);
  const opacity = Math.min(slideIn, slideOut);
  const chars = Array.isArray(sl.chars) ? sl.chars : [];
  const speaker = sl.speaker || '';

  return (
    <AbsoluteFill style={{background:'#080d18', fontFamily:'Segoe UI, Arial, sans-serif', overflow:'hidden'}}>
      <Background kind={sl.bg || 'city'} />
      {sl.audioUrl ? <Audio src={/^(https?:|file:|data:)/.test(sl.audioUrl) ? sl.audioUrl : staticFile(sl.audioUrl)} /> : null}
      <AbsoluteFill style={{opacity, padding:40}}>
        <div style={{position:'absolute', left:0, right:0, top:26, textAlign:'center'}}>
          <div style={{display:'inline-block', padding:'8px 20px', borderRadius:999, background:'#0b1224cc', border:'1px solid #f5c45188', color:'#f5c451', fontSize:22, fontWeight:800, letterSpacing:2}}>{title}</div>
          {sl.label ? <div style={{marginTop:10, color:'#fff', fontSize:26, fontWeight:800, textShadow:'0 3px 12px #000'}}>{sl.label}</div> : null}
        </div>
        {chars.length ? chars.map((c, i) => {
          const x = chars.length === 1 ? '50%' : (i === 0 ? '14%' : '54%');
          const speaking = c === speaker || (typeof c === 'object' && c.talking);
          const who = typeof c === 'object' ? c.who : c;
          const extra = typeof c === 'object' ? c : null;
          return <div key={i} style={{position:'absolute', left:x, top:'22%', transform:'translateX(-50%)'}}>
            <Blocky who={who} frame={frame} speaking={speaking} x={0} y={0} extra={extra} />
          </div>;
        }) : null}
        <div style={{position:'absolute', left:0, right:0, bottom:74, display:'flex', justifyContent:'center', padding:'0 30px'}}>
          <div style={{maxWidth:'92%', padding:'16px 24px', borderRadius:16, background:'#060a18e6', border:'2px solid #f5c45177', color:'#fff', fontSize:30, lineHeight:1.4, fontWeight:600, textAlign:'center', textShadow:'0 2px 8px #000'}}>
            {sl.caption || ''}
          </div>
        </div>
        <div style={{position:'absolute', left:0, right:0, bottom:0, height:10, background:'#ffffff18'}}>
          <div style={{width:`${progressPct(cum, sec, endSec)}%`, height:'100%', background:'linear-gradient(90deg,#f5c451,#7c4dff)'}} />
        </div>
        <div style={{position:'absolute', left:30, bottom:18, fontSize:16, letterSpacing:2, color:'#cbd5e8', opacity:.8}}>{brand}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

function progressPct(cum, sec, endSec) {
  if (!cum.length) return 0;
  const total = cum[cum.length - 1] || 1;
  return Math.min(100, (sec / total) * 100);
}
