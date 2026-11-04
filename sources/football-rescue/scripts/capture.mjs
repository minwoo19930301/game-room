import {createCanvas,loadImage,GlobalFonts} from '@napi-rs/canvas';
import {writeFile,mkdir} from 'node:fs/promises';
import {createGame,startGame,step,W,H} from '../src/engine.js';
import {render,keyChroma} from '../src/render.js';
GlobalFonts.registerFromPath(new URL('../node_modules/galmuri/dist/Galmuri11.ttf',import.meta.url).pathname,'Galmuri11');
const assets={};for(const [key,file] of Object.entries({player:'player-atlas.png',cast:'cast-atlas.png',stadium:'stadium.png'})){const img=await loadImage(new URL('../public/art/'+file,import.meta.url).pathname);assets[key]=key==='stadium'?img:keyChroma(createCanvas(1,1),img);}
const canvas=createCanvas(W,H),ctx=canvas.getContext('2d'),game=createGame();startGame(game);
for(let frame=0;frame<100;frame++)step(game,{right:true,kick:frame%30===0,jump:frame===90},1/60);
render(ctx,game,assets);await mkdir(new URL('../docs/previews/',import.meta.url),{recursive:true});await writeFile(new URL('../docs/previews/cpu-gameplay.png',import.meta.url),canvas.toBuffer('image/png'));console.log('CPU render written: docs/previews/cpu-gameplay.png. This is NOT browser QA.');
