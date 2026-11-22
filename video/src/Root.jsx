import React from 'react';
import {Composition} from 'remotion';
import {ProductVideo} from './ProductVideo';
import {CampusIntro} from './CampusIntro';
import {DramaMovie} from './DramaMovie';
import {TalkingHead} from './TalkingHead';

const defaults = {
  title: 'Cyborg Cheebee',
  tagline: 'Your AI Company. Your AI Team.',
  cta: 'Dream Bigger. Let AI Work Harder!',
  brand: 'CYBORG CHEEBEE OFFICE',
  color1: '#77eaff',
  color2: '#8b5cf6',
  watermark: true,
  mode: 'product',
  imageUrl: '',
  captions: [],
  voiceoverUrl: '',
};

const campusDefaults = {
  title: 'Cyborg Cheebee HQ',
  tagline: 'Our 3D AI campus — where agents work 24/7.',
  cta: 'Dream Bigger. Let AI Work Harder!',
  brand: 'CYBORG CHEEBEE OFFICE',
  color1: '#77eaff',
  color2: '#8b5cf6',
  watermark: true,
  captions: [],
  voiceoverUrl: '',
};

export const RemotionRoot = () => (
  <>
    <Composition
      id="TalkingHead"
      component={TalkingHead}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{title:'',subtitle:'',captions:[],audioUrl:'',name:'TAGALOG EDITOR',brand:'CYBORG CHEEBEE OFFICE',seconds:30,script:''}}
    />
    <Composition
      id="DramaMovie"
      component={DramaMovie}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{slides: [], title:'ANG PULUBI NA MAYAMAN', subtitle:'', brand:'CYBORG CHEEBEE OFFICE'}}
    />
    <Composition
      id="ProductVideo"
      component={ProductVideo}
      durationInFrames={360}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaults}
    />
    <Composition
      id="ProductVideoWide"
      component={ProductVideo}
      durationInFrames={360}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={defaults}
    />
    <Composition
      id="CampusIntro"
      component={CampusIntro}
      durationInFrames={360}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={campusDefaults}
    />
    <Composition
      id="CampusIntroWide"
      component={CampusIntro}
      durationInFrames={360}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={campusDefaults}
    />
  </>
);
