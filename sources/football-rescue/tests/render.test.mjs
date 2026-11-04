import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {prepareCharacters} from '../src/character-sprites.js';
import {createGame,startGame} from '../src/engine.js';
import {render} from '../src/render.js';
const characters=prepareCharacters(await loadImage('public/art/character-actions.png'),createCanvas);
const assets={characters,player:characters,cast:characters,stadium:await loadImage('public/art/stadium.png')};
test('all football action poses render without modifying simulation and retain distinct silhouettes',()=>{
 const g=createGame();startGame(g);const c=createCanvas(960,600),ctx=c.getContext('2d'),hashes=new Set();
 for(const action of ['idle','run','kick','tackle','jump','header','hurt','fallen','victory']){
  g.player.action=action;g.player.actionTime=.15;g.player.stride=2;g.player.vy=100;g.player.y=action==='jump'?60:0;
  const before=JSON.stringify(g);render(ctx,g,assets,{reducedMotion:true});assert.equal(JSON.stringify(g),before);
  hashes.add(createHash('sha256').update(ctx.getImageData(30,350,200,200).data).digest('hex'));
 }
 assert.ok(hashes.size>=7,`${hashes.size} action silhouettes only`);
});
test('all menus and game outcomes draw with the same authored character atlas',()=>{
 const g=createGame(),ctx=createCanvas(960,600).getContext('2d');
 for(const mode of ['title','brief','playing','paused','won','lost']){g.mode=mode;assert.doesNotThrow(()=>render(ctx,g,assets));}
});
