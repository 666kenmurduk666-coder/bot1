import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};

export const ProductVideo = ({
  title = 'Cyborg Cheebee',
  tagline = 'Your AI Company. Your AI Team.',
  cta = 'Dream Bigger. Let AI Work Harder!',
  brand = 'CYBORG CHEEBEE OFFICE',
  color1 = '#77eaff',
  color2 = '#8b5cf6',
  watermark = true,
  mode = 'product',
  imageUrl = '',
  captions = [],
  voiceoverUrl = '',
  slides = [],
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();
  const vertical = height > width;
  const enter = spring({frame, fps, config: {damping: 200, mass: 0.7}});
  const titleY = interpolate(enter, [0, 1], [vertical ? 90 : 60, 0], clamp);
  const titleOpacity = interpolate(frame, [0, 14], [0, 1], clamp);
  const tagOpacity = interpolate(frame, [20, 38], [0, 1], clamp);
  const ctaOpacity = interpolate(frame, [50, 70], [0, 1], clamp);
  const pulse = 1 + Math.sin(frame / 7) * 0.025;
  const progress = interpolate(frame, [0, durationInFrames], [0, 100], clamp);
  const drift = Math.sin(frame / 60) * 30;

  const normalizedSlides = Array.isArray(slides) ? slides.filter(s => s && (s.imageUrl || s.caption || s.text || s.audioUrl)).slice(0, 40) : [];
  const hasSlides = normalizedSlides.length > 0;
  const fpsN = fps || 30;
  const cum = [];
  let acc = 0;
  normalizedSlides.forEach(sl => { acc += (Number(sl.seconds) || 0); cum.push(acc); });
  const frameSec = frame / fpsN;
  let slideIndex = 0;
  if (hasSlides) { for (let i = 0; i < cum.length; i++) { if (frameSec >= cum[i]) slideIndex = Math.min(i + 1, normalizedSlides.length - 1); } }
  const startSec = slideIndex > 0 ? cum[slideIndex - 1] : 0;
  const endSec = hasSlides ? cum[slideIndex] : (durationInFrames / fpsN);
  const slideDurSec = Math.max(0.1, endSec - startSec);
  const slide = hasSlides ? normalizedSlides[slideIndex] : null;
  const slideFrame = hasSlides ? Math.max(0, Math.round((frameSec - startSec) * fpsN)) : frame;
  const slideDur = slideDurSec * fpsN;
  const slideIn = interpolate(slideFrame, [0, 12], [0, 1], clamp);
  const slideOut = interpolate(slideFrame, [slideDur - 12, slideDur], [1, 0], clamp);
  const slideOpacity = Math.min(slideIn, slideOut);
  const zoom = interpolate(slideFrame, [0, slideDur], [1, 1.08], clamp);

  const lines = Array.isArray(captions) && captions.length
    ? captions.map(String).slice(0, 8)
    : String(tagline).split(/[.!?]/).map(s => s.trim()).filter(Boolean).slice(0, 4);
  if (!lines.length) lines.push(String(tagline));
  const captionIndex = Math.min(lines.length - 1, Math.floor(frame / (durationInFrames / lines.length)));
  const activeCaption = hasSlides ? String(slide?.caption || slide?.text || lines[captionIndex] || '') : (lines[captionIndex] || '');
  const activeImage = hasSlides ? (slide?.imageUrl || '') : (imageUrl || '');
  const showImage = !!activeImage;

  const label = hasSlides ? (slide?.label || 'PLANT TUTORIAL') : (mode === 'recap' ? 'WEEKLY RECAP' : mode === 'agent' ? 'AI AGENT SPOTLIGHT' : 'PRODUCT SPOTLIGHT');

  return (
    <AbsoluteFill style={{background: `linear-gradient(155deg, #080b1a 0%, #131a38 45%, ${color2}33 100%)`, fontFamily: 'Segoe UI, Inter, Arial, sans-serif', overflow: 'hidden'}}>
      {voiceoverUrl ? <Audio src={/^(https?:|file:|data:)/.test(voiceoverUrl) ? voiceoverUrl : staticFile(voiceoverUrl)} /> : null}
      {slide && slide.audioUrl ? <Audio src={/^(https?:|file:|data:)/.test(slide.audioUrl) ? slide.audioUrl : staticFile(slide.audioUrl)} /> : null}
      <div style={{position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: color1, opacity: 0.16, filter: 'blur(90px)', left: -220 + drift, top: -180}} />
      <div style={{position: 'absolute', width: 620, height: 620, borderRadius: '50%', background: color2, opacity: 0.22, filter: 'blur(100px)', right: -200 - drift, bottom: -160}} />
      <div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(#ffffff0b 1px, transparent 1px), linear-gradient(90deg, #ffffff0b 1px, transparent 1px)', backgroundSize: '64px 64px', opacity: 0.35}} />

      <Img src={staticFile('ceo-cheebee.webp')} style={{position: 'absolute', left: vertical ? 44 : 70, top: vertical ? 44 : 60, width: vertical ? 62 : 74, height: vertical ? 62 : 74, borderRadius: '50%', border: `2px solid ${color1}`, objectFit: 'cover', boxShadow: `0 0 28px ${color1}66`}} />

      <AbsoluteFill style={{padding: vertical ? (showImage ? 58 : 90) : 90, justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
        {showImage ? (
          <div style={{height: vertical ? 420 : 360, width: vertical ? 760 : 640, maxWidth: '92%', borderRadius: 28, overflow: 'hidden', border: `2px solid ${color1}88`, boxShadow: `0 24px 80px ${color2}66`, opacity: hasSlides ? slideOpacity : titleOpacity, marginBottom: vertical ? 28 : 22, background: '#0b1328'}}>
            <Img src={/^(https?:|file:|data:)/.test(activeImage) ? activeImage : staticFile(activeImage)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}} />
          </div>
        ) : null}

        <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 22px', borderRadius: 999, border: `1px solid ${color1}88`, background: '#0c1430cc', color: color1, fontSize: vertical ? 20 : 24, letterSpacing: 2, fontWeight: 700, transform: `translateY(${titleY / 2}px)`, opacity: titleOpacity}}>
          <span>✦</span> {label} <span>✦</span>
        </div>

        <div style={{height: vertical ? 20 : 28}} />

        <div style={{fontSize: vertical ? (showImage ? 58 : 82) : 92, lineHeight: 1.05, fontWeight: 800, color: '#fff', letterSpacing: -1.5, transform: `translateY(${titleY}px)`, opacity: titleOpacity, textShadow: '0 12px 60px #000a', maxWidth: '92%'}}>
          {title}
        </div>

        <div style={{height: vertical ? 18 : 20}} />

        <div style={{fontSize: vertical ? 30 : 36, color: '#dbe6ff', opacity: tagOpacity, maxWidth: '86%', lineHeight: 1.35}}>
          {tagline}
        </div>

        <div style={{height: vertical ? 34 : 36}} />

        <div style={{transform: `scale(${pulse})`, opacity: ctaOpacity, padding: '16px 30px', borderRadius: 16, background: `linear-gradient(135deg, ${color1}, ${color2})`, color: '#08101f', fontWeight: 800, fontSize: vertical ? 28 : 32, boxShadow: `0 20px 60px ${color2}66`}}>
          {cta}
        </div>
      </AbsoluteFill>

      <div style={{position: 'absolute', left: 0, right: 0, bottom: 54, display: 'flex', justifyContent: 'center', pointerEvents: 'none'}}>
        <div style={{padding: '12px 22px', borderRadius: 12, background: '#060a18d8', border: `1px solid ${color1}55`, color: '#fff', fontSize: vertical ? 28 : 30, fontWeight: 600, opacity: hasSlides ? slideOpacity : interpolate(frame, [captionIndex * (durationInFrames / lines.length), captionIndex * (durationInFrames / lines.length) + 10], [0, 1], clamp), maxWidth: '88%', textAlign: 'center', lineHeight: 1.35}}>
          {activeCaption}
        </div>
      </div>

      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 8, background: '#ffffff12'}}>
        <div style={{width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${color1}, ${color2})`}} />
      </div>

      <div style={{position: 'absolute', left: vertical ? 40 : 90, bottom: 22, fontSize: 18, letterSpacing: 2, color: '#aab9dd', opacity: 0.75}}>{brand}</div>

      {watermark ? (
        <div style={{position: 'absolute', right: 30, top: 30, padding: '8px 14px', borderRadius: 8, border: '2px solid #ffcc66', color: '#ffcc66', background: '#1a1200cc', fontSize: vertical ? 20 : 22, fontWeight: 800, letterSpacing: 1.5, transform: 'rotate(4deg)'}}>
          PREVIEW • NOT APPROVED
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
