import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const clamp = {extrapolateLeft:'clamp', extrapolateRight:'clamp'};

// A friendly on-screen presenter. Roblox-style blocky avatar, but built to read as a real "person talking".
function Presenter({frame, speaking, name, color, hair, skin, shirt}) {
  const blink = (frame % 165) < 6;
  const mouth = speaking ? 5 + Math.abs(Math.sin(frame / 2.4)) * 13 : 3;
  const nod = Math.sin(frame / 9) * 2;
  const sway = Math.sin(frame / 48) * 4;
  return (
    <div style={{position:'absolute', left:'50%', top:'20%', transform:`translateX(-50%) translateY(${nod}px)`, transformOrigin:'bottom center'}}>
      <div style={{filter:'drop-shadow(0 18px 26px rgba(0,0,0,.5))', transform:`rotate(${sway/8}deg)`}}>
        {/* head */}
        <div style={{position:'relative', width:190, height:176, background:skin, borderRadius:30, border:'5px solid rgba(0,0,0,.14)', boxSizing:'border-box'}}>
          <div style={{position:'absolute', left:-6, top:-18, width:202, height:70, background:hair, borderRadius:'30px 30px 12px 12px'}} />
          <div style={{position:'absolute', left:34, top:64, width:30, height:blink?5:32, background:'#1d2330', borderRadius:7}} />
          <div style={{position:'absolute', right:34, top:64, width:30, height:blink?5:32, background:'#1d2330', borderRadius:7}} />
          {!blink ? <><div style={{position:'absolute', left:42, top:70, width:9, height:9, background:'#fff', borderRadius:'50%'}}/><div style={{position:'absolute', right:42, top:70, width:9, height:9, background:'#fff', borderRadius:'50%'}}/></> : null}
          <div style={{position:'absolute', left:'50%', top:120, transform:'translateX(-50%)', width:58, height:mouth, background:'#7a2d38', borderRadius:'0 0 24px 24px', borderBottom:'3px solid #4a1620'}} />
          <div style={{position:'absolute', left:18, top:96, width:26, height:10, background:'#ef9a9a', borderRadius:8, opacity:.4}} />
          <div style={{position:'absolute', right:18, top:96, width:26, height:10, background:'#ef9a9a', borderRadius:8, opacity:.4}} />
        </div>
        {/* neck + body */}
        <div style={{width:54, height:26, background:skin, margin:'0 auto'}} />
        <div style={{position:'relative', width:250, height:190, background:shirt, borderRadius:26, border:'5px solid rgba(0,0,0,.14)', boxSizing:'border-box', margin:'0 auto'}}>
          <div style={{position:'absolute', left:'50%', top:0, transform:'translateX(-50%)', width:64, height:120, background:color, clipPath:'polygon(50% 0,100% 24%,72% 50%,100% 76%,50% 100%,0 76%,28% 50%,0 24%)'}} />
          <div style={{position:'absolute', left:-46, top:18, width:46, height:140, background:shirt, borderRadius:22, transform:'rotate(8deg)'}} />
          <div style={{position:'absolute', right:-46, top:18, width:46, height:140, background:shirt, borderRadius:22, transform:'rotate(-8deg)'}} />
        </div>
      </div>
      <div style={{marginTop:14, textAlign:'center'}}>
        <div style={{display:'inline-block', padding:'7px 18px', borderRadius:999, background:'#0b1224e6', border:`2px solid ${color}`, color:'#fff', fontSize:20, fontWeight:800, letterSpacing:1.5}}>{name || 'EDITOR'}</div>
      </div>
    </div>
  );
}

export const TalkingHead = ({title='', subtitle='', captions=[], audioUrl='', name='TAGALOG EDITOR', brand='CYBORG CHEEBEE OFFICE', color1='#f5c451', color2='#7c4dff', seconds=30, script=''}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const lines = Array.isArray(captions) && captions.length ? captions.map(String).slice(0, 12) : String(script || subtitle || '').split(/[.!?]/).map(s=>s.trim()).filter(Boolean).slice(0,8);
  const total = Math.max(1, Number(seconds) || durationInFrames/(fps||30));
  const fpsN = fps || 30;
  const per = total / Math.max(1, lines.length);
  const idx = Math.min(lines.length - 1, Math.max(0, Math.floor((frame/fpsN)/per)));
  const inOp = interpolate(frame - idx*per*fpsN, [0, 10], [0,1], clamp);
  const progress = Math.min(100, (frame/fpsN/total)*100);
  const speaking = !!audioUrl;
  return (
    <AbsoluteFill style={{background:'linear-gradient(160deg,#0b1224 0%,#162347 55%,#1f2d52 100%)', fontFamily:'Segoe UI, Arial, sans-serif', overflow:'hidden'}}>
      {audioUrl ? <Audio src={/^(https?:|file:|data:)/.test(audioUrl) ? audioUrl : staticFile(audioUrl)} /> : null}
      {/* studio shelves */}
      <div style={{position:'absolute', inset:0, opacity:.25, backgroundImage:'repeating-linear-gradient(0deg,#7da8ff22 0 2px,transparent 2px 130px), repeating-linear-gradient(90deg,#7da8ff22 0 2px,transparent 2px 160px)'}} />
      <div style={{position:'absolute', left:'-8%', top:'12%', width:360, height:360, borderRadius:'50%', background:color1, opacity:.12, filter:'blur(80px)'}} />
      <div style={{position:'absolute', right:'-8%', bottom:'8%', width:380, height:380, borderRadius:'50%', background:color2, opacity:.16, filter:'blur(90px)'}} />
      <div style={{position:'absolute', left:0, right:0, top:26, textAlign:'center'}}>
        <div style={{display:'inline-block', padding:'8px 22px', borderRadius:999, background:'#0b1224d9', border:`1px solid ${color1}88`, color:color1, fontSize:22, fontWeight:800, letterSpacing:2}}>{title || 'FROM THE EDITORS'}</div>
      </div>
      <Presenter frame={frame} speaking={speaking} name={name} color={color1} hair="#2a1c14" skin="#e8b88a" shirt="#23324d" />
      <div style={{position:'absolute', left:0, right:0, bottom:96, display:'flex', justifyContent:'center', padding:'0 24px'}}>
        <div style={{maxWidth:'92%', padding:'18px 24px', borderRadius:16, background:'#060a18e8', border:`2px solid ${color1}66`, color:'#fff', fontSize:30, lineHeight:1.4, fontWeight:600, textAlign:'center', opacity:inOp, textShadow:'0 2px 8px #000'}}>
          {lines[idx] || ''}
        </div>
      </div>
      <div style={{position:'absolute', left:0, right:0, bottom:0, height:10, background:'#ffffff18'}}>
        <div style={{width:`${progress}%`, height:'100%', background:`linear-gradient(90deg,${color1},${color2})`}}/>
      </div>
      <div style={{position:'absolute', left:28, bottom:20, fontSize:16, letterSpacing:2, color:'#cbd5e8', opacity:.8}}>{brand}</div>
    </AbsoluteFill>
  );
};
