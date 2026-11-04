export const W=960,H=600,GROUND=530;
export const STAGES=[
 {name:'전반전 · 골문을 열어라',goal:'경기장을 막은 수비수들을 넘고, 오른쪽 골대에 슛!',length:2650,time:160,count:8,objective:'goal'},
 {name:'하프타임 · 동료를 찾아라',goal:'두 선수의 벤치까지 달려가 구출하고 적을 모두 제압!',length:3200,time:190,count:12,objective:'friends'},
 {name:'후반전 · 감독님을 구해줘',goal:'까마귀 대장을 쓰러뜨린 뒤 오른쪽 감독님에게 도착!',length:3550,time:220,count:15,objective:'coach'},
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const toward=(n,t,d)=>n<t?Math.min(t,n+d):Math.max(t,n-d);
const types={duck:{hp:40,speed:103,damage:8},keeper:{hp:64,speed:70,damage:10},captain:{hp:180,speed:85,damage:14}};
export function createGame({difficulty='rookie',practice=false}={}){
 const g={mode:'title',difficulty,practice,stage:0,score:0,totalTime:0,combo:0,comboTime:0,cheer:0,events:[],effects:[],projectiles:[],assists:[],rescued:0,goals:0,shake:0,freeze:0,seed:39177,stats:{kicks:0,tackles:0,headers:0,stomps:0,assists:0,damage:0,kos:0},player:null};
 setupStage(g,0);return g;
}
export function setupStage(g,index){
 g.stage=index;g.time=STAGES[index].time;g.stageTime=0;g.camera=0;g.goalScored=false;g.friends=[{x:1250,saved:false},{x:2700,saved:false}];g.coachSaved=false;g.projectiles=[];g.effects=[];g.assists=[];g.enemies=[];g.events=[];g.freeze=0;g.shake=0;g.combo=0;g.comboTime=0;
 const previousHp=g.player?.hp??100;
 g.player={x:150,y:0,vy:0,vx:0,facing:1,hp:index===0?100:Math.min(100,previousHp+30),action:'idle',actionTime:0,actionDuration:0,attackDone:false,cooldown:0,invuln:0,hitIds:new Set(),stride:0};
 const s=STAGES[index];
 for(let i=0;i<s.count;i++){
  const type=index===2&&i===s.count-1?'captain':(i%4===3&&index>0?'keeper':'duck');
  const def=types[type];const x=470+(s.length-860)*(i/(s.count-1));
  g.enemies.push({id:i,type,x,y:0,vx:0,vy:0,hp:def.hp,maxHp:def.hp,speed:def.speed,facing:-1,action:'wait',timer:.4+(i%3)*.2,actionTime:0,hit:false,stun:0,deadTime:0,active:false});
 }
 if(g.practice){g.time=Infinity;g.enemies=g.enemies.slice(0,4);}
 g.mode='brief';return g;
}
export function startGame(g){g.mode='playing';g.events.push({type:'start'});}
export function togglePause(g){if(g.mode==='playing'){g.mode='paused';g.player.vx=0;return true;}if(g.mode==='paused'){g.mode='playing';return true;}return false;}
export function nextStage(g){if(g.mode!=='stageclear')return false;if(g.stage<2){setupStage(g,g.stage+1);return true;}g.mode='won';return false;}
export function remaining(g){return g.enemies.filter(e=>e.hp>0).length;}
export function announce(g,text,x=g.player.x,y=95,color='#fff'){g.effects.push({kind:'text',text,x,y,color,life:1.3,maxLife:1.3});}
function act(p,name,duration){p.action=name;p.actionTime=0;p.actionDuration=duration;p.attackDone=false;p.hitIds=new Set();}
function damageEnemy(g,e,amount,dir,kind){
 if(e.hp<=0||e.stun>.25)return false;
 e.hp=Math.max(0,e.hp-amount);e.stun=.38;e.vx=dir*(kind==='tackle'?380:230);e.vy=240;e.y=Math.max(e.y,2);e.action='hurt';e.actionTime=0;
 g.comboTime=2.1;g.combo++;g.cheer=Math.min(100,g.cheer+7);g.score+=50+Math.min(10,g.combo)*10;g.freeze=.045;g.shake=Math.max(g.shake,3);g.events.push({type:'hit',kind});
 g.effects.push({kind:'impact',x:e.x,y:e.y+45,life:.25,maxLife:.25});
 if(e.hp===0){g.stats.kos++;g.score+=e.type==='captain'?1500:300;g.cheer=Math.min(100,g.cheer+10);g.player.hp=Math.min(100,g.player.hp+4);announce(g,e.type==='captain'?'대장 격파!':`${g.combo} COMBO`,e.x,105,'#ffe02d');}
 return true;
}
function damagePlayer(g,amount,dir){
 const p=g.player;if(p.invuln>0||g.practice)return false;
 const n=g.difficulty==='cup'?amount*1.5:amount;p.hp=Math.max(0,p.hp-n);p.invuln=1.05;p.vx=dir*190;p.vy=170;p.y=Math.max(p.y,2);act(p,'hurt',.32);g.stats.damage+=n;g.combo=0;g.shake=6;g.freeze=.07;g.events.push({type:'hurt'});announce(g,'앗!',p.x,105,'#ffdcdd');
 if(p.hp<=0){g.mode='lost';g.reason='에너지가 떨어졌어요. 낮은 태클은 점프로 넘고, 골키퍼의 공은 슛으로 되받아치세요.';act(p,'fallen',999);}return true;
}
function projectile(g,{x,y,vx,vy=100,team='player',damage=25,kind='ball'}){g.projectiles.push({x,y,vx,vy,team,damage,kind,life:2.4,spin:0});}
function attackPlayer(g){
 const p=g.player,a=p.action;
 if(a==='kick'||a==='header'){
  if(p.actionTime>=.13&&!p.attackDone){
   p.attackDone=true;projectile(g,{x:p.x+p.facing*54,y:p.y+(a==='header'?88:30),vx:p.facing*750,vy:a==='header'?-60:100,damage:a==='header'?35:27});
   for(const e of g.enemies)if(e.hp>0&&(e.x-p.x)*p.facing>-20&&(e.x-p.x)*p.facing<100&&Math.abs(e.y-p.y)<90)damageEnemy(g,e,25,p.facing,a);
   // A keeper's incoming ball can be parried with the same public shot action.
   for(const b of g.projectiles)if(b.team==='enemy'&&Math.abs(b.x-p.x)<125&&Math.abs(b.y-(p.y+50))<100){b.team='player';b.vx=p.facing*820;b.damage=40;b.life=2;announce(g,'리턴!',p.x,110,'#fff24d');}
   g.events.push({type:'kick'});
  }
 }else if(a==='tackle'&&p.actionTime>.07&&p.actionTime<.32){
  for(const e of g.enemies){if(e.hp<=0||p.hitIds.has(e.id))continue;if(Math.abs(e.x-p.x)<75&&Math.abs(e.y-p.y)<65){
   p.hitIds.add(e.id);
   if(e.action==='slide'){damagePlayer(g,types[e.type].damage,-p.facing);announce(g,'점프로!',p.x,130,'#fff24d');}
   else damageEnemy(g,e,35,p.facing,'tackle');
  }}
 }
}
function updateEnemy(g,e,dt){
 const p=g.player,def=types[e.type];e.actionTime+=dt;
 if(e.hp<=0){e.deadTime+=dt;e.vx*=Math.pow(.15,dt);e.x+=e.vx*dt;e.y=Math.max(0,e.y+e.vy*dt);e.vy-=1600*dt;return;}
 e.active=e.active||Math.abs(e.x-p.x)<670;if(!e.active)return;
 if(e.stun>0){e.stun-=dt;e.x+=e.vx*dt;e.vx*=Math.pow(.06,dt);e.y=Math.max(0,e.y+e.vy*dt);e.vy-=1600*dt;if(e.stun<=0){e.action='walk';e.actionTime=0;e.timer=.65;e.y=0;}return;}
 e.y=0;const dx=p.x-e.x,dist=Math.abs(dx);e.facing=dx<0?-1:1;e.timer-=dt;
 if(e.action==='windup'){
  if(e.timer<=0){e.action=e.type==='duck'?'slide':'throw';e.actionTime=0;e.timer=e.type==='duck'?.42:.42;e.hit=false;
   if(e.type!=='duck')projectile(g,{x:e.x+e.facing*40,y:60,vx:e.facing*(e.type==='captain'?580:430),vy:80,team:'enemy',damage:def.damage});}
 }else if(e.action==='slide'){
  e.x+=e.facing*430*dt;
  if(!e.hit&&Math.abs(e.x-p.x)<53&&p.y<48){e.hit=true;damagePlayer(g,def.damage,e.facing);}
  if(e.timer<=0){e.action='recover';e.timer=.75;e.actionTime=0;}
 }else if(e.action==='throw'){
  if(e.timer<=0){e.action='recover';e.timer=e.type==='captain'?.45:1;e.actionTime=0;}
 }else if(e.action==='recover'){
  if(e.timer<=0){e.action='walk';e.actionTime=0;e.timer=.4;}
 }else{
  e.action='walk';
  const reach=e.type==='duck'?180:450;
  if(dist>reach*.8)e.x+=e.facing*e.speed*dt;
  if(dist<reach&&e.timer<=0){e.action='windup';e.timer=e.type==='captain'?.48:.62;e.actionTime=0;g.events.push({type:'warning'});}
  if(dist<45&&p.y<55&&p.action!=='tackle')damagePlayer(g,def.damage*.7,e.facing);
 }
 e.x=clamp(e.x,40,STAGES[g.stage].length-80);
}
export function step(g,input={},dt=1/60){
 // Return whether this tick reached input consumption. Hitstop must not discard
 // a key press already queued by the browser between animation frames.
 if(g.mode!=='playing')return false;
 dt=clamp(Number.isFinite(dt)?dt:0,0,.05);if(!dt)return false;
 g.events=[];if(g.freeze>0){g.freeze-=dt;return false;}
 const p=g.player,s=STAGES[g.stage];g.totalTime+=dt;g.stageTime+=dt;if(!g.practice)g.time=Math.max(0,g.time-dt);
 if(g.time===0){g.mode='lost';g.reason='시간이 끝났어요! 다음에는 동료 호출로 포위망을 빠르게 돌파해 보세요.';return true;}
 p.invuln=Math.max(0,p.invuln-dt);p.cooldown=Math.max(0,p.cooldown-dt);p.actionTime+=dt;
 if(p.actionTime>=p.actionDuration&&!['idle','run','jump'].includes(p.action)){act(p,p.y>0?'jump':'idle',0);}
 const controllable=!['hurt','tackle'].includes(p.action);const move=(input.right?1:0)-(input.left?1:0);
 if(controllable){
  const target=move*285;p.vx=toward(p.vx,target,(move?1800:2400)*dt);if(move)p.facing=move;
  if(input.jump&&p.y===0){p.vy=655;p.y=.1;act(p,'jump',0);g.events.push({type:'jump'});}
  if(p.cooldown===0&&!['kick','header'].includes(p.action)){
   if(input.kick){act(p,p.y>35?'header':'kick',.36);p.cooldown=.46;g.stats[p.y>35?'headers':'kicks']++;}
   else if(input.tackle){if(p.y<10&&Math.abs(p.vx)>70){act(p,'tackle',.38);p.vx=p.facing*610;p.cooldown=.7;g.stats.tackles++;g.events.push({type:'tackle'});}else{act(p,p.y>35?'header':'kick',.36);p.cooldown=.46;g.stats[p.y>35?'headers':'kicks']++;}}
  }
 }
 if(input.special&&g.cheer>=60){g.cheer-=60;g.stats.assists++;g.assists.push(...[0,1,2].map(i=>({x:p.x-p.facing*(120+i*80),dir:p.facing,life:2.3,hitIds:new Set()})));announce(g,'원팀! 다 같이 간다!',p.x,170,'#fff533');g.events.push({type:'special'});}
 if(p.action==='tackle')p.vx=p.facing*610;
 p.x=clamp(p.x+p.vx*dt,45,s.length-50);const lastY=p.y;p.y+=p.vy*dt;p.vy-=1700*dt;
 if(p.y<=0){p.y=0;p.vy=0;if(p.action==='jump')act(p,'idle',0);}
 if(['idle','run','jump'].includes(p.action)){p.action=p.y>0?'jump':Math.abs(p.vx)>30?'run':'idle';}
 p.stride+=Math.abs(p.vx)*dt/48;attackPlayer(g);
 for(const e of g.enemies){
  updateEnemy(g,e,dt);
  if(e.hp>0&&p.vy<0&&lastY>=56&&p.y<67&&Math.abs(p.x-e.x)<48&&e.stun<=0){damageEnemy(g,e,e.action==='slide'?50:32,p.facing,'stomp');p.y=70;p.vy=390;g.stats.stomps++;announce(g,'밟기!',e.x,115,'#fff52c');}
 }
 for(const a of g.assists){a.life-=dt;a.x+=a.dir*680*dt;for(const e of g.enemies)if(e.hp>0&&!a.hitIds.has(e.id)&&Math.abs(a.x-e.x)<55){a.hitIds.add(e.id);damageEnemy(g,e,30,a.dir,'assist');}}
 g.assists=g.assists.filter(a=>a.life>0);
 for(const b of g.projectiles){
  b.life-=dt;b.spin+=b.vx*dt*.04;b.x+=b.vx*dt;b.y+=b.vy*dt;b.vy-=330*dt;if(b.y<15){b.y=15;b.vy=Math.abs(b.vy)*.7;}
  if(b.team==='player'){
   for(const e of g.enemies)if(e.hp>0&&Math.abs(b.x-e.x)<37&&b.y<105){if(damageEnemy(g,e,b.damage,Math.sign(b.vx),'ball')){b.life=0;break;}}
   if(s.objective==='goal'&&b.x>s.length-120&&b.y<145&&remaining(g)===0&&!g.goalScored){g.goalScored=true;g.goals++;g.score+=1500;b.life=0;announce(g,'GOOOAL!',p.x,190,'#ffe239');g.events.push({type:'goal'});}
  }else if(Math.abs(b.x-p.x)<34&&Math.abs(b.y-(p.y+48))<45){if(damagePlayer(g,b.damage,Math.sign(b.vx)))b.life=0;}
 }
 g.projectiles=g.projectiles.filter(b=>b.life>0&&b.x>-100&&b.x<s.length+100);
 if(s.objective==='friends')for(const f of g.friends)if(!f.saved&&Math.abs(p.x-f.x)<85&&!g.enemies.some(e=>e.hp>0&&Math.abs(e.x-f.x)<240)){f.saved=true;g.rescued++;g.score+=1000;g.cheer=Math.min(100,g.cheer+30);announce(g,'동료 구출!',p.x,150,'#fff63b');}
 if(s.objective==='coach'&&remaining(g)===0&&p.x>s.length-220){g.coachSaved=true;g.score+=2500;}
 const complete=s.objective==='goal'?g.goalScored:s.objective==='friends'?g.friends.every(f=>f.saved)&&remaining(g)===0&&p.x>s.length-230:g.coachSaved;
 if(complete&&g.mode==='playing'){g.score+=Number.isFinite(g.time)?Math.floor(g.time)*10:0;g.mode=g.stage===2||g.practice?'won':'stageclear';act(p,'victory',999);g.events.push({type:'win'});}
 g.comboTime-=dt;if(g.comboTime<=0)g.combo=0;
 g.camera=toward(g.camera,clamp(p.x-W*.34,0,s.length-W),900*dt);g.shake=Math.max(0,g.shake-dt*20);
 for(const e of g.effects){e.life-=dt;if(e.kind==='text')e.y+=dt*30;}g.effects=g.effects.filter(e=>e.life>0);
 return true;
}
export function describe(g){
 const stage=STAGES[g.stage];return `${g.practice?'훈련':'작전 '+(g.stage+1)} · 에너지 ${Math.ceil(g.player.hp)} · 남은 적 ${remaining(g)} · 응원 ${Math.floor(g.cheer)} · 점수 ${g.score} · ${Number.isFinite(g.time)?Math.ceil(g.time)+'초':'시간 제한 없음'} · ${stage.goal}`;
}
