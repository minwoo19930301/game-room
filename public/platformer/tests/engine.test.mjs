import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, update, restart, nextLevel, currentLevel, previewInput, PHYSICS, TILE, STEP } from '../src/engine.mjs';
import { LEVELS } from '../src/levels.mjs';

function map({width=50, enemies=[], coins=[], checkpoint=null, edits=[]}={}) {
  const tiles=Array.from({length:12},(_,y)=>(y>=9?'#':'.').repeat(width));
  for(const [x,y,ch] of edits)tiles[y]=tiles[y].slice(0,x)+ch+tiles[y].slice(x+1);
  return {id:'test',name:'test',theme:'grass',width,height:12,tiles,
    spawn:{x:96,y:392},goal:{x:(width-2)*TILE,y:432},checkpoint,enemies,coins,platforms:[],pipes:[]};
}
function game(options={}) { const g=createGame(0,{levels:[map(options)]});update(g);update(g);return g; }
function step(g,n,input={}){for(let i=0;i<n;i++)update(g,typeof input==='function'?input(g,i):input);return g;}
function item(g,type,x=g.player.x,y=g.player.y) {
  g.items.push({type,x,y,w:26,h:26,vx:0,vy:0,active:true,alive:true});
}
function assertFinite(g) {
  for(const value of [g.player.x,g.player.y,g.player.vx,g.player.vy,g.cameraX,g.time])assert.ok(Number.isFinite(value));
}

test('public state follows the shared contract and does not mutate level data',()=>{
  const snapshot=JSON.stringify(LEVELS),g=createGame();
  assert.equal(TILE,48);assert.equal(currentLevel(g),LEVELS[0]);
  for(const name of ['tiles','enemies','items','coins','platforms','projectiles','particles','events'])assert.ok(Array.isArray(g[name]),name);
  assert.equal(g.player.w,32);assert.equal(g.player.h,40);assert.equal(g.lives,3);
  step(g,60,{right:true});assertFinite(g);assert.equal(JSON.stringify(LEVELS),snapshot);
});
test('fixed simulation has identical movement at 30, 60 and 120 Hz',()=>{
  const results=[30,60,120].map(hz=>{const g=game();for(let i=0;i<hz*2;i++)update(g,{right:true,run:true},1/hz);return [g.player.x,g.player.vx];});
  assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);
});
test('invalid dt and pause leave state untouched; long stalls are bounded',()=>{
  const g=game(),before=JSON.stringify(g);
  for(const dt of [0,-1,NaN,Infinity])update(g,{right:true},dt);
  assert.equal(JSON.stringify(g),before);
  g.paused=true;const paused=JSON.stringify(g);update(g,{right:true});assert.equal(JSON.stringify(g),paused);
  g.paused=false;update(g,{right:true,run:true},100);assert.ok(g.player.x<120);assertFinite(g);
});
test('acceleration, running, braking and ground friction remain distinct',()=>{
  const g=game();update(g,{right:true});assert.ok(g.player.vx>0&&g.player.vx<PHYSICS.walk);
  step(g,60,{right:true});assert.equal(g.player.vx,PHYSICS.walk);
  step(g,60,{right:true,run:true});assert.equal(g.player.vx,PHYSICS.run);
  update(g,{left:true});assert.equal(g.player.pose,'skid');assert.ok(g.player.vx>0);
  step(g,40,{left:true});assert.equal(g.player.vx,-PHYSICS.walk);
  step(g,20);assert.equal(g.player.vx,0);
});
test('held jump rises 3.5 tiles, tap is lower, and a second air press gives no extra jump',()=>{
  const heights=[];
  for(const hold of [2,30]){const g=game(),floor=g.player.y;let min=floor;
    for(let i=0;i<90;i++){update(g,{jump:i<hold});min=Math.min(min,g.player.y);}
    heights.push(floor-min);assert.equal(g.player.y,floor);assert.equal(g.player.onGround,true);
  }
  assert.ok(heights[1]>168&&heights[1]<192,JSON.stringify(heights));assert.ok(heights[0]<heights[1]*.6);
  const g=game();update(g,{jump:true});step(g,5);const vy=g.player.vy;update(g,{jump:true});assert.ok(g.player.vy>vy,'no double jump');
});
test('coyote allows a late edge jump but expires after 80 ms',()=>{
  for(const wait of [2,7]) {
    const g=game();g.player.x=10*TILE;g.player.onGround=false;g.player.coyote=PHYSICS.coyote;g.player.y=300;
    step(g,wait);update(g,{jump:true});assert.equal(g.player.vy<0,wait===2);
  }
});
test('jump pressed shortly before landing is buffered and held jump does not auto-hop',()=>{
  const g=game();g.player.y=375;g.player.vy=150;g.player.onGround=false;
  update(g,{jump:true});step(g,5,{jump:true});assert.ok(g.player.vy<0);
  step(g,110,{jump:true});assert.equal(g.player.onGround,true);assert.equal(g.player.y,392);
});
test('solid wall and floor collision prevent tunneling in both movement directions',()=>{
  const edits=[];for(let y=0;y<9;y++)edits.push([8,y,'P']);
  const g=game({edits});step(g,180,{right:true,run:true});assert.equal(g.player.x,8*TILE-g.player.w);assert.equal(g.player.y,392);
  g.player.x=9*TILE;g.player.vx=-PHYSICS.run;step(g,90,{left:true,run:true});assert.equal(g.player.x,9*TILE);assertFinite(g);
});
test('one-way platform accepts landing from above and passage from below',()=>{
  const g=game({edits:[[2,7,'='],[3,7,'=']]});update(g,{jump:true});step(g,45,{jump:true});
  assert.equal(g.player.y,7*TILE-g.player.h);assert.equal(g.player.onGround,true);
});
test('one head impact at a block seam consumes exactly one block and cannot duplicate coins',()=>{
  const g=game({edits:[[2,6,'?'],[3,6,'?']]});g.player.x=3*TILE-16;
  update(g,{jump:true});step(g,25,{jump:true});assert.equal(g.coinCount,1);
  assert.equal([...g.tiles[6]].filter(c=>c==='X').length,1);
  step(g,50,{jump:true});assert.equal(g.coinCount,1);
});
test('growth block emits one item, growth preserves feet and tall brick breaking works',()=>{
  const g=game({edits:[[2,6,'M'],[4,6,'B']]});update(g,{jump:true});step(g,25,{jump:true});
  assert.equal(g.items.length,1);assert.equal(g.items[0].type,'growth');assert.equal(g.tiles[6][2],'X');
  const foot=g.player.y+g.player.h;item(g,'growth');update(g);assert.equal(g.player.power,'big');assert.equal(g.player.h,72);assert.ok(Math.abs(g.player.y+g.player.h-foot)<12);
  g.player.x=4*TILE+7;g.player.y=432-72;g.player.vy=0;g.player.onGround=true;g.previous.jump=false;
  update(g,{jump:true});step(g,15,{jump:true});assert.equal(g.tiles[6][4],'.');
});
test('growth in a tight ceiling keeps a safe crouched body then stands when clear',()=>{
  const g=game({edits:[[2,7,'B']]});item(g,'growth');update(g);assert.equal(g.player.power,'big');assert.equal(g.player.h,40);
  step(g,45,{right:true});assert.equal(g.player.h,72);assert.equal(g.player.y+g.player.h,432);
});
test('fire power creates at most two real bouncing projectiles and defeats an enemy',()=>{
  const g=game({enemies:[{type:'walker',x:320,y:400,dir:-1}]});item(g,'fire');update(g);assert.equal(g.player.power,'fire');
  for(let i=0;i<90;i++)update(g,{fire:i%16===0});
  assert.equal(g.enemies.length,0);assert.ok(g.score>=1100);assert.ok(g.projectiles.length<=2);
});
test('star protects enemy contact but expires, and hazards still cost a life',()=>{
  const g=game({enemies:[{type:'walker',x:175,y:400}]});item(g,'star');update(g);assert.ok(g.player.invincible>9);
  step(g,24,{right:true});assert.equal(g.mode,'playing');assert.equal(g.enemies.length,0);
  step(g,610);assert.equal(g.player.invincible,0);
  const hazard=game({edits:[[2,8,'^']]});item(hazard,'star');update(hazard);assert.equal(hazard.mode,'dying');assert.equal(hazard.lives,2);
});
test('100 coins grant exactly one life and each map coin collects once',()=>{
  const g=game({coins:[{x:112,y:410}]});g.coinCount=99;g.coins[0].collected=false;update(g);assert.equal(g.coinCount,0);assert.equal(g.lives,4);
  step(g,15);assert.equal(g.lives,4);assert.equal(g.coinCount,0);
});
test('descending feet stomp a walker; side contact kills a small player',()=>{
  const g=game({enemies:[{type:'walker',x:200,y:400}]});g.player.x=200;g.player.y=350;g.player.vy=200;g.player.onGround=false;
  step(g,8);assert.equal(g.enemies.length,0);assert.ok(g.player.vy<0);assert.equal(g.lives,3);
  const side=game({enemies:[{type:'walker',x:150,y:400}]});step(side,15,{right:true});assert.equal(side.mode,'dying');assert.equal(side.lives,2);
});
test('turtle stomps become a stopped shell; kick chains defeat multiple enemies',()=>{
  const g=game({enemies:[{type:'turtle',x:200,y:392},{type:'walker',x:350,y:400},{type:'walker',x:420,y:400}]});
  g.player.x=200;g.player.y=340;g.player.vy=220;g.player.onGround=false;step(g,6);
  const turtle=g.enemies.find(e=>e.type==='turtle');assert.equal(turtle.state,'shell');assert.equal(turtle.vx,0);
  g.player.x=turtle.x-30;g.player.y=392;g.player.vy=0;g.player.onGround=true;update(g,{right:true});assert.equal(turtle.state,'sliding');
  step(g,45);assert.equal(g.enemies.filter(e=>e.type==='walker').length,0);assert.ok(turtle.chain>=2);
});
test('a sliding shell can be stopped with another stomp',()=>{
  const g=game({enemies:[{type:'turtle',x:200,y:392}]});const e=g.enemies[0];e.state='sliding';e.h=30;e.y=402;e.vx=0;
  g.player.x=200;g.player.y=350;g.player.vy=230;g.player.onGround=false;step(g,6);assert.equal(e.state,'shell');assert.equal(e.vx,0);
});
test('powered damage shrinks once and gives recovery invulnerability',()=>{
  const g=game({enemies:[{type:'walker',x:300,y:400}]});item(g,'fire');update(g);
  const e=g.enemies[0];g.player.x=e.x;g.player.y=360;g.player.vy=0;update(g);
  assert.equal(g.player.power,'small');assert.ok(g.player.hurt>1);assert.equal(g.mode,'playing');
  update(g);assert.equal(g.lives,3);
});
test('checkpoint death spends one life and automatically restores that checkpoint',()=>{
  const g=game({checkpoint:{x:240,y:392}});step(g,60,{right:true});assert.equal(g.checkpointReached,true);
  const score=g.score;g.player.y=800;update(g);assert.equal(g.mode,'dying');assert.equal(g.lives,2);
  step(g,80);assert.equal(g.mode,'playing');assert.equal(g.player.x,240);assert.equal(g.score,score);assert.equal(g.player.power,'small');
});
test('three deaths reach game over, restart returns a fresh game with three lives',()=>{
  let g=game();for(let i=0;i<3;i++){g.player.y=800;update(g);step(g,80);}
  assert.equal(g.mode,'gameover');assert.equal(g.lives,0);const old=g;g=restart(g);assert.notEqual(g,old);assert.equal(g.lives,3);assert.equal(g.mode,'playing');
});
test('flag clear carries score, coins and power to the next level and final completion',()=>{
  const a=map({width:12}),b=map({width:12});let g=createGame(0,{levels:[a,b]});item(g,'fire');update(g);g.coinCount=17;
  step(g,230,{right:true,run:true});assert.equal(g.mode,'clear');const score=g.score;g=nextLevel(g);
  assert.equal(g.levelIndex,1);assert.equal(g.coinCount,17);assert.equal(g.score,score);assert.equal(g.player.power,'fire');
  step(g,230,{right:true,run:true});assert.equal(g.mode,'clear');g=nextLevel(g);assert.equal(g.mode,'complete');
});
test('unlocked flag plays a two-second slide and exit walk before awarding clear once',()=>{
  const level=map({width:30});level.goal.x=20*TILE;
  const g=createGame(0,{levels:[level]});
  g.player.x=level.goal.x-g.player.w;g.player.y=250;g.player.vy=0;
  update(g);assert.equal(g.mode,'finishing');assert.equal(g.finishPhase,'flag');assert.equal(g.goalProgress,0);
  const time=g.time,score=g.score,startX=g.player.x;
  step(g,30,{left:true,jump:true,fire:true});
  assert.equal(g.mode,'finishing');assert.equal(g.finishPhase,'flag');assert.equal(g.player.x,startX);
  assert.ok(g.goalProgress>.7&&g.goalProgress<1);assert.ok(g.player.y>250);
  assert.equal(g.time,time);assert.equal(g.score,score);assert.equal(g.events.filter(e=>e.type==='clear').length,0);
  step(g,30,{left:true,jump:true});assert.equal(g.finishPhase,'walk');assert.equal(g.goalProgress,1);
  assert.ok(g.player.x>startX);assert.equal(g.player.y+g.player.h,level.goal.y);
  step(g,60);assert.equal(g.mode,'finishing','no early overlay at two seconds');
  step(g,8);assert.equal(g.mode,'clear');assert.equal(g.player.x+g.player.w/2,level.goal.x+180);
  assert.equal(g.events.filter(e=>e.type==='clear').length,1);assert.ok(g.score>score);
  const finalScore=g.score;step(g,60);assert.equal(g.score,finalScore);assert.equal(g.events.filter(e=>e.type==='clear').length,1);
});
test('previewInput only returns legal inputs and never edits game state',()=>{
  const g=createGame();const snapshot=JSON.stringify(g),input=previewInput(g);
  assert.equal(JSON.stringify(g),snapshot);for(const [key,value] of Object.entries(input)){assert.ok(['left','right','run','jump','fire','down'].includes(key));assert.equal(typeof value,'boolean');}
});
test('required boss locks only the clear trigger and three stomps release the exit',()=>{
  const level=map({width:30,enemies:[{type:'boss',x:600,y:352}]});level.goal.requiresBoss=true;
  const g=createGame(0,{levels:[level]});g.player.x=level.goal.x;update(g);
  assert.equal(g.goalLocked,true);assert.equal(g.mode,'playing');
  const boss=g.enemies[0];
  for(let hit=0;hit<3;hit++) {
    boss.hurt=0;g.player.x=boss.x+20;g.player.y=boss.y-46;g.player.vy=220;g.player.onGround=false;
    update(g);update(g);
    if(hit<2)assert.equal(boss.hp,2-hit);
  }
  assert.equal(g.enemies.length,0);assert.equal(g.goalLocked,false);
  g.player.x=level.goal.x;g.player.y=392;update(g);assert.equal(g.mode,'finishing');step(g,130);assert.equal(g.mode,'clear');
});
test('a boss takes multiple fire hits with a readable damage cooldown',()=>{
  const g=game({enemies:[{type:'boss',x:400,y:352}]});const boss=g.enemies[0];
  function shot(){g.projectiles.push({x:boss.x+10,y:boss.y+20,w:10,h:10,vx:0,vy:0,active:true,type:'fire',age:0,bounces:0});}
  shot();update(g);assert.equal(boss.hp,2);
  shot();update(g);assert.equal(boss.hp,2);
  step(g,20);shot();update(g);assert.equal(boss.hp,1);
  step(g,20);shot();update(g);assert.equal(g.enemies.length,0);
});
test('actual designed levels can be traversed by legal inputs without teleporting',()=>{
  for(let level=0;level<LEVELS.length;level++) {
    const g=createGame(level);let maxX=0;
    for(let i=0;i<60*180&&g.mode!=='clear'&&g.mode!=='gameover';i++) {
      update(g,previewInput(g));maxX=Math.max(maxX,g.player.x);assertFinite(g);
    }
    assert.equal(g.mode,'clear',`${level}: stopped at ${maxX.toFixed(1)}, lives ${g.lives}, position ${g.player.x.toFixed(1)}`);
    assert.ok(g.checkpointReached);
  }
});
test('one uninterrupted legal-input run clears three courses, defeats the boss and reaches complete',()=>{
  let g=createGame();const visited=[],bossHP=new Set();let deaths=0;
  for(let i=0;i<60*240&&g.mode!=='complete'&&g.mode!=='gameover';i++) {
    update(g,previewInput(g));
    const boss=g.enemies.find(e=>e.type==='boss');if(boss)bossHP.add(boss.hp);
    deaths+=g.events.filter(e=>e.type==='death').length;g.events.length=0;
    if(g.mode==='clear') {
      visited.push(g.levelIndex);
      if(g.level.goal.requiresBoss){assert.equal(g.goalLocked,false);assert.equal(boss,undefined);}
      g=nextLevel(g);
    }
  }
  assert.equal(g.mode,'complete');assert.deepEqual(visited,[0,1,2]);
  assert.ok(bossHP.has(3)&&bossHP.has(2)&&bossHP.has(1),'all three actual stomp hits');
  assert.equal(deaths,0);assert.ok(g.score>15000);
});
