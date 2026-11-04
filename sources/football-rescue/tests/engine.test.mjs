import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startGame,step,nextStage,togglePause,remaining,STAGES} from '../src/engine.js';
const active=opts=>{const g=createGame(opts);startGame(g);return g;};
const frames=(g,n,input={})=>{for(let i=0;i<n;i++)step(g,typeof input==='function'?input(i,g):input,1/60);};
test('a new game has a brief, 100 energy and an independent first stage',()=>{const g=createGame();assert.equal(g.mode,'brief');assert.equal(g.player.hp,100);assert.equal(remaining(g),8);assert.equal(g.stage,0);});
test('movement accelerates, faces direction and stops on released input',()=>{const g=active();frames(g,20,{right:true});assert.ok(g.player.x>200);assert.equal(g.player.facing,1);frames(g,10);assert.equal(g.player.vx,0);frames(g,20,{left:true});assert.equal(g.player.facing,-1);});
test('jump leaves ground and gravity lands without repeated jump input',()=>{const g=active();step(g,{jump:true});assert.ok(g.player.y>0);frames(g,90);assert.equal(g.player.y,0);assert.equal(g.player.vy,0);});
test('one shot edge produces exactly one shot and obeys cooldown',()=>{const g=active();step(g,{kick:true});frames(g,20);assert.equal(g.stats.kicks,1);assert.equal(g.projectiles.length,1);});
test('aerial shot is a distinct header',()=>{const g=active();step(g,{jump:true});frames(g,9);step(g,{kick:true});assert.equal(g.player.action,'header');assert.equal(g.stats.headers,1);});
test('moving tackle differs from standing kick',()=>{const g=active();frames(g,6,{right:true});step(g,{right:true,tackle:true});assert.equal(g.player.action,'tackle');assert.equal(g.stats.tackles,1);const other=active();step(other,{tackle:true});assert.equal(other.player.action,'kick');});
test('pause freezes simulation and clears player velocity',()=>{const g=active();frames(g,10,{right:true});assert.equal(togglePause(g),true);const t=g.time,x=g.player.x;frames(g,60,{right:true,kick:true});assert.equal(g.time,t);assert.equal(g.player.x,x);assert.equal(g.player.vx,0);togglePause(g);step(g,{right:true});assert.ok(g.time<t);});
test('time cannot leap after a suspended frame',()=>{const g=active();step(g,{},900);assert.ok(STAGES[0].time-g.time<=.051);});
test('boundary clamps prevent leaving the pitch',()=>{const g=active({practice:true});frames(g,100,{left:true});assert.equal(g.player.x,45);});
test('idle normal input eventually fails honestly from enemy or deadline',()=>{const g=active();frames(g,160*60+180);assert.equal(g.mode,'lost');assert.ok(g.player.hp===0||g.time===0);});
test('training has no damage or time pressure and finite score',()=>{const g=active({practice:true});frames(g,120*60,{right:true});assert.equal(g.player.hp,100);assert.equal(g.time,Infinity);assert.ok(Number.isFinite(g.score));});
test('special cannot be called before earning cheer',()=>{const g=active();step(g,{special:true});assert.equal(g.assists.length,0);assert.equal(g.stats.assists,0);});
test('deterministic public inputs produce identical outcomes',()=>{const a=active(),b=active();const input=i=>({right:true,kick:i%30===0,jump:i%60===0,tackle:i%55===0});frames(a,600,input);frames(b,600,input);assert.deepEqual(a.stats,b.stats);assert.equal(a.score,b.score);assert.equal(a.player.x,b.player.x);});
// Public inputs only: no teleport, HP writes, enemy deletion or internal damage calls.
export function playCampaign(difficulty='rookie'){
 const g=active({difficulty});let frame=0;
 while(!['lost','won'].includes(g.mode)&&frame<60*550){
  if(g.mode==='stageclear'){nextStage(g);startGame(g);}
  const p=g.player,alive=g.enemies.filter(e=>e.hp>0),nearest=alive.sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
  let target=STAGES[g.stage].length-145;
  if(nearest)target=nearest.x-150;
  else if(g.stage===1){const f=g.friends.find(f=>!f.saved);if(f)target=f.x;}
  const dx=target-p.x;const direction=nearest?Math.sign(nearest.x-p.x):1;
  const input={right:dx>18||Math.abs(dx)<=18&&direction>0&&frame%18===0,left:dx< -18||Math.abs(dx)<=18&&direction<0&&frame%18===0,kick:frame%29===0,jump:frame%55===0,special:frame%70===0};
  step(g,input);frame++;
 }
 return {g,frame};
}
test('ordinary run/jump/shot inputs can complete all three stages',()=>{const {g,frame}=playCampaign();assert.equal(g.mode,'won',`Stopped at stage ${g.stage}, hp ${g.player.hp}, remaining ${remaining(g)}, x ${g.player.x}, frame ${frame}`);assert.equal(g.goals,1);assert.equal(g.rescued,2);assert.equal(g.coachSaved,true);assert.equal(g.stats.kos,35);assert.ok(Number.isFinite(g.score));assert.ok(g.stats.kicks+g.stats.headers>30);});
test('cup difficulty remains completable through ordinary public inputs',()=>{const {g}=playCampaign('cup');assert.equal(g.mode,'won');assert.equal(g.coachSaved,true);assert.ok(g.stats.headers>0);assert.ok(g.stats.stomps>0);assert.ok(g.stats.assists>0);});
test('running past living opponents cannot unlock the first goal',()=>{const g=active({practice:true});frames(g,700,{right:true});assert.ok(g.player.x>2400);frames(g,90,i=>({kick:i%30===0}));assert.equal(g.goalScored,false);assert.ok(remaining(g)>0);assert.equal(g.mode,'playing');});
test('a fresh run cannot inherit old projectiles, cheer or score',()=>{const g=active();frames(g,200,i=>({right:true,kick:i%30===0}));assert.ok(g.score>0);const fresh=createGame();assert.equal(fresh.score,0);assert.equal(fresh.cheer,0);assert.equal(fresh.projectiles.length,0);assert.equal(fresh.stats.kos,0);assert.equal(fresh.stageTime,0);});
test('briefs cannot be skipped with movement or nextStage',()=>{const g=createGame();const x=g.player.x;step(g,{right:true,kick:true});assert.equal(g.player.x,x);assert.equal(nextStage(g),false);assert.equal(g.stage,0);});
