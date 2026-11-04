import {drawCharacter} from './character-sprites.js';
import {W,H,GROUND,STAGES,remaining} from './engine.js';
export const PLAYER_FRAMES=[
 [38,12,177,344],[238,42,267,314],[509,39,265,318],[779,47,255,310],[1037,13,258,315],[1290,52,246,304],
 [14,371,219,307],[243,373,302,309],[550,389,228,291],[783,428,271,247],[1050,420,284,259],[1302,365,234,307],
 [28,732,223,268],[258,678,251,316],[461,738,356,222],[807,695,215,304],[1028,821,295,175],[1330,669,204,332]
];
export const CAST_FRAMES=[
 [12,15,184,310],[226,31,253,295],[510,38,241,292],[765,38,238,292],[947,138,336,191],[1290,71,234,263],
 [2,349,235,289],[227,352,261,284],[492,348,268,295],[768,352,267,285],[990,425,311,201],[1270,392,266,242],
 [16,656,198,342],[192,648,310,352],[510,650,229,352],[751,638,246,363],[1014,767,253,238],[1264,636,271,374]
];
export function keyChroma(canvas,image){
 canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height);
 for(let i=0;i<data.data.length;i+=4){const r=data.data[i],g=data.data[i+1],b=data.data[i+2];if(g>150&&b>150&&r<105&&Math.abs(g-b)<85){data.data[i+3]=0;}else if(g>100&&b>100&&r<90&&Math.abs(g-b)<55){data.data[i+3]=0;}}
 ctx.putImageData(data,0,0);return canvas;
}
function text(ctx,s,x,y,size=18,color='#fff',align='left',stroke=true){ctx.font=`700 ${size}px system-ui, sans-serif`;ctx.textAlign=align;ctx.textBaseline='alphabetic';if(stroke){ctx.lineWidth=4;ctx.strokeStyle='#14272d';ctx.strokeText(s,x,y);}ctx.fillStyle=color;ctx.fillText(s,x,y);}
function rect(ctx,x,y,w,h,fill,stroke='#14272d',line=2){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.strokeRect(x,y,w,h);}}
function sprite(ctx,atlas,frames,frame,x,y,scale,dir=1,nativeDir=1,opacity=1){
 const player=frames===PLAYER_FRAMES;
 const action=(player?[0,1,2,1,2,1,10,5,0,10,4,0,3,3,4,7,10,9]:[0,1,2,4,10,7,0,1,6,5,10,7,8,8,8,9,10,9])[frame]??0;
 drawCharacter(ctx,atlas,action,x,y,340*scale,{variant:player?0:frame>=12?2:1,facing:dir,alpha:opacity,lean:player&&frame===10?.15*dir:0});
}
function playerFrame(p){switch(p.action){case'run':return 1+Math.floor(p.stride)%5;case'kick':return p.actionTime<.11?6:p.actionTime<.25?7:8;case'tackle':return p.actionTime<.07?9:p.actionTime<.31?10:11;case'jump':return p.vy>50?13:12;case'header':return 14;case'hurt':return 15;case'fallen':return 16;case'victory':return 17;default:return 0;}}
function enemyFrame(e,t){const k=e.type==='duck'?0:6;if(e.hp<=0||e.action==='hurt')return k+5;if(e.action==='windup')return k+(e.type==='duck'?3:2);if(e.action==='slide')return 4;if(e.action==='throw')return 9;if(e.action==='recover')return k;if(e.action==='walk')return k+1+(e.type==='duck'?Math.floor(t*9)%2:0);return k;}
function ball(ctx,x,y,r=13,spin=0,enemy=false){ctx.save();ctx.translate(x,y);ctx.rotate(spin);ctx.fillStyle=enemy?'#ffca64':'#fffff2';ctx.strokeStyle='#142631';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#152535';for(let j=0;j<5;j++){ctx.save();ctx.rotate(j*Math.PI*2/5);ctx.beginPath();ctx.moveTo(0,-3);ctx.lineTo(-4,-7);ctx.lineTo(-3,-r);ctx.lineTo(4,-r);ctx.lineTo(5,-7);ctx.closePath();ctx.fill();ctx.restore();}ctx.beginPath();for(let j=0;j<5;j++){const a=j*Math.PI*2/5;ctx.lineTo(Math.cos(a)*5,Math.sin(a)*5);}ctx.closePath();ctx.fill();ctx.restore();}
function goal(ctx,x){ctx.save();ctx.translate(x,GROUND);ctx.fillStyle='#fcfff433';ctx.strokeStyle='#e8f9fc';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-146);ctx.lineTo(85,-166);ctx.lineTo(140,-144);ctx.lineTo(140,0);ctx.closePath();ctx.fill();ctx.stroke();for(let i=10;i<140;i+=14){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,-145-i*.08);ctx.stroke();}for(let j=-130;j<0;j+=16){ctx.beginPath();ctx.moveTo(1,j);ctx.lineTo(139,j);ctx.stroke();}ctx.strokeStyle='#263444';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-146);ctx.lineTo(86,-166);ctx.lineTo(86,-10);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.stroke();ctx.restore();}
function bench(ctx,x){ctx.save();ctx.translate(x,GROUND);rect(ctx,-75,-72,150,45,'#bb3a3a');rect(ctx,-80,-30,160,10,'#e7d0a1');rect(ctx,-65,-20,8,20,'#3e4343');rect(ctx,60,-20,8,20,'#3e4343');ctx.restore();}
function HUD(ctx,g,assets){const p=g.player,s=STAGES[g.stage];ctx.save();
 rect(ctx,82,13,255,63,'#effafdde');text(ctx,'ENERGY',95,32,16,'#ae1734','left',false);text(ctx,Math.ceil(p.hp)+'%',320,32,14,'#162d38','right',false);rect(ctx,95,42,225,18,'#263845');rect(ctx,98,45,219*p.hp/100,12,p.hp>35?'#13b8a0':'#f34042',null);
 rect(ctx,365,13,230,61,'#17364ced');text(ctx,g.practice?'TRAINING':'ROUND 0'+(g.stage+1),480,35,16,'#ffde37','center',false);text(ctx,g.practice?'∞':Math.ceil(g.time)+'″',480,60,23,'#fff','center',false);
 rect(ctx,624,13,322,62,'#f4fbeede');text(ctx,'LEFT',640,35,18,'#ac1632','left',false);text(ctx,String(remaining(g)).padStart(2,'0'),930,37,26,'#142c39','right',false);text(ctx,s.objective==='goal'?'골대에 슛!':s.objective==='friends'?`동료 ${g.friends.filter(f=>f.saved).length} / 2`:'감독님을 찾아라',641,62,12,'#183746','left',false);
 rect(ctx,760,89,183,22,'#1e303c');rect(ctx,763,92,177*g.cheer/100,16,g.cheer>=60?'#ffda25':'#48bcd5',null);text(ctx,g.cheer>=60?'C  동료 준비 완료':'응원 '+Math.floor(g.cheer)+' / 60',752,107,12,g.cheer>=60?'#ffdc26':'#fff','right');
 ctx.restore();
}
export function render(ctx,g,assets,{reducedMotion=false,preview=false}={}){
 ctx.clearRect(0,0,W,H);ctx.save();
 if(g.shake>0&&!reducedMotion)ctx.translate(Math.sin(g.stageTime*130)*g.shake,Math.cos(g.stageTime*110)*g.shake*.5);
 const bg=assets.stadium;if(bg){const bw=W+170;const offset=-(g.camera/(STAGES[g.stage].length-W))*170;ctx.drawImage(bg,offset,0,bw,570);}else{ctx.fillStyle='#a5d6e9';ctx.fillRect(0,0,W,H);}
 // The pitch scrolls independently of the slower distant roof and stands.
 ctx.fillStyle=g.stage===1?'#55a62c':'#54aa26';ctx.fillRect(0,528,W,72);for(let x=-g.camera%160;x<W;x+=160){ctx.fillStyle='#6eb72b';ctx.fillRect(x,528,80,72);}ctx.strokeStyle='#e3f4c1';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,555);ctx.lineTo(W,555);ctx.stroke();
 ctx.save();ctx.translate(-g.camera,0);
 for(let x=160;x<STAGES[g.stage].length;x+=400){ctx.strokeStyle='#e4f2cb99';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,529);ctx.lineTo(x-18,600);ctx.stroke();}
 const s=STAGES[g.stage];if(s.objective==='goal')goal(ctx,s.length-115);
 if(s.objective==='friends')for(const f of g.friends){bench(ctx,f.x);sprite(ctx,assets.cast,CAST_FRAMES,f.saved?15:12,f.x,GROUND,.31,1,-1);text(ctx,f.saved?'구출 완료':'동료',f.x,GROUND-127,16,f.saved?'#ffeb3a':'#fff','center');}
 if(s.objective==='coach'){bench(ctx,s.length-180);sprite(ctx,assets.cast,CAST_FRAMES,g.mode==='won'?17:12,s.length-180,GROUND,.35,1,-1);text(ctx,'감독님',s.length-180,GROUND-142,15,'#fff','center');}
 const entities=[...g.enemies.filter(e=>e.hp>0||e.deadTime<1.2).map(e=>({e,y:e.y,type:'enemy'})),{e:g.player,y:g.player.y,type:'player'}];
 for(const {e,type} of entities){if(e.x<g.camera-150||e.x>g.camera+W+150)continue;ctx.fillStyle='#173d3170';ctx.beginPath();ctx.ellipse(e.x,GROUND+3,type==='player'?26:32,7,0,0,Math.PI*2);ctx.fill();
  if(type==='player'){
   if(e.action==='tackle'&&!reducedMotion){ctx.strokeStyle='#fff';ctx.lineWidth=3;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(e.x-e.facing*(55+i*7),GROUND-e.y-20-i*13);ctx.lineTo(e.x-e.facing*(100+i*7),GROUND-e.y-20-i*13);ctx.stroke();}}
   sprite(ctx,assets.player,PLAYER_FRAMES,playerFrame(e),e.x,GROUND-e.y,.34,e.facing,1,e.invuln>0&&Math.floor(g.stageTime*16)%2?.45:1);
   if(e.y===0&&['idle','run'].includes(e.action))ball(ctx,e.x+e.facing*(27+Math.sin(e.stride)*5),GROUND-13,11,e.stride);
   ctx.fillStyle='#ffdd29';ctx.beginPath();ctx.moveTo(e.x-7,GROUND-e.y-133);ctx.lineTo(e.x+7,GROUND-e.y-133);ctx.lineTo(e.x,GROUND-e.y-123);ctx.fill();
  }else{
   const scale=e.type==='captain'?.46:e.type==='keeper'?.36:.32;
   sprite(ctx,assets.cast,CAST_FRAMES,enemyFrame(e,g.stageTime),e.x,GROUND-e.y,scale,e.facing,-1,e.hp<=0?Math.max(0,1-e.deadTime/1.2):1);
   if(e.action==='windup'){text(ctx,e.type==='duck'?'낮은 태클!':'슛 준비!',e.x,GROUND-130,13,'#fff126','center');ctx.fillStyle='#ffcf2b';ctx.beginPath();ctx.moveTo(e.x-7,GROUND-119);ctx.lineTo(e.x+7,GROUND-119);ctx.lineTo(e.x,GROUND-109);ctx.fill();}
   if(e.hp>0&&(e.hp<e.maxHp||e.type==='captain')){rect(ctx,e.x-31,GROUND-(e.type==='captain'?161:113),62,7,'#162a34',null);rect(ctx,e.x-29,GROUND-(e.type==='captain'?159:111),58*e.hp/e.maxHp,3,e.type==='captain'?'#ff4855':'#ffd93a',null);}
  }
 }
 for(const a of g.assists){sprite(ctx,assets.player,PLAYER_FRAMES,1+Math.floor(g.stageTime*12)%5,a.x,GROUND,.31,a.dir);ctx.fillStyle='#ffefab';ctx.fillRect(a.x-15,GROUND-72,30,4);}
 for(const b of g.projectiles){if(!reducedMotion){ctx.strokeStyle=b.team==='enemy'?'#ffb04c99':'#fff6';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(b.x-b.vx*.035,GROUND-b.y);ctx.lineTo(b.x,GROUND-b.y);ctx.stroke();}ball(ctx,b.x,GROUND-b.y,13,b.spin,b.team==='enemy');}
 for(const fx of g.effects){ctx.save();ctx.globalAlpha=Math.min(1,fx.life*3);if(fx.kind==='text')text(ctx,fx.text,fx.x,GROUND-fx.y,22,fx.color,'center');else{ctx.translate(fx.x,GROUND-fx.y);const r=22*(1.2-fx.life/fx.maxLife);ctx.fillStyle='#fff9c2';ctx.strokeStyle='#f25b1e';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<18;i++){const a=i*Math.PI/9,rad=i%2?r*.45:r;ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}ctx.closePath();ctx.fill();ctx.stroke();}ctx.restore();}
 if(g.mode==='title'){sprite(ctx,assets.player,PLAYER_FRAMES,17,760,GROUND+12,.88,1);ball(ctx,830,GROUND-13,30,.4);sprite(ctx,assets.cast,CAST_FRAMES,12,900,GROUND+12,.46,1,-1);}
 ctx.restore();ctx.restore();
 // Mask portrait artwork to a deliberate HUD window instead of letting it spill over.
 if(!preview&&g.mode!=='title'){
  rect(ctx,13,13,63,75,'#ffedb5');ctx.save();ctx.beginPath();ctx.rect(15,15,59,71);ctx.clip();drawCharacter(ctx,assets.characters,0,44,126,112);ctx.restore();
  HUD(ctx,g,assets);
  text(ctx,'PLAYER 07',15,103,10,'#fff');text(ctx,'SCORE '+String(g.score).padStart(6,'0'),94,101,14,'#fff');
  text(ctx,`→ ${Math.max(0,Math.ceil((s.length-g.player.x)/10))} m`,940,579,13,'#fff','right');
  if(g.stageTime<5){rect(ctx,190,151,580,51,'#effcffdf');text(ctx,s.goal,480,183,15,'#163345','center',false);}
  if(g.combo>1)text(ctx,g.combo+' HIT!',480,139,29,'#ffdc2c','center');
 }
}
