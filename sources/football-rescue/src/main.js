import './style.css';
import {createGame,startGame,togglePause,nextStage,STAGES,describe} from './engine.js';
import {InputBuffer} from './input.js';
import {render,keyChroma} from './render.js';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
const inputBuffer=new InputBuffer();
let game=createGame(),assets={},held=inputBuffer.held,edges=inputBuffer.edges,frame=0,last=0,acc=0,previousMode='',sound=false,audio=null,helpPaused=false;
game.mode='title';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const keyMap={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',KeyZ:'tackle',KeyJ:'tackle',KeyX:'kick',KeyK:'kick',KeyC:'special',KeyL:'special'};
const load=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('원화 로딩 실패: '+src));img.src=src;});
function clearInput(){inputBuffer.clear();document.querySelectorAll('[data-hold]').forEach(el=>el.removeAttribute('aria-pressed'));}
function press(action){if(game.mode!=='playing')return;inputBuffer.press(action);}
function soundCue(type){if(!sound)return;try{audio??=new AudioContext();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),v=audio.createGain();o.connect(v);v.connect(audio.destination);const f={kick:170,hit:100,hurt:75,goal:660,win:880,jump:350,special:490,tackle:130,start:550}[type];if(!f)return;o.type=type==='hit'?'square':'triangle';o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(f*1.4,audio.currentTime+.08);v.gain.setValueAtTime(.035,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);o.start();o.stop(audio.currentTime+.17);}catch{sound=false;$('sound').textContent='소리 사용할 수 없음';}}
function panels(){
 const m=game.mode;$('menu').classList.toggle('hidden',m!=='title');$('pause-panel').classList.toggle('hidden',m!=='paused');$('results').classList.toggle('hidden',!['won','lost'].includes(m));$('brief').classList.toggle('hidden',!['brief','stageclear'].includes(m));$('pause').disabled=!['playing','paused'].includes(m);$('pause').textContent=m==='paused'?'계속':'일시정지';
 if(m==='brief'){$('brief-num').textContent=game.practice?'TRAINING':'ROUND 0'+(game.stage+1);$('brief-title').textContent=STAGES[game.stage].name;$('brief-copy').textContent=STAGES[game.stage].goal+'\n노란 경고가 뜨면 점프! X 슛으로 공을 날릴 수 있어요.';$('continue').textContent=game.practice?'훈련 시작':'경기장으로';}
 if(m==='stageclear'){$('brief-num').textContent='ROUND CLEAR';$('brief-title').textContent=game.stage===0?'골문이 열렸다!':'동료들이 돌아왔다!';$('brief-copy').textContent=`점수 ${game.score.toLocaleString()}\n다음 작전에 에너지 30을 회복합니다.`;$('continue').textContent='다음 작전';}
 if(m==='won'||m==='lost'){$('result-title').textContent=m==='won'?(game.practice?'훈련 완료!':'감독님 구출 성공!'):'작전은 아직 끝나지 않았다';$('result-copy').textContent=m==='won'?(game.practice?'태클과 점프, 슛으로 훈련장 골문을 열었습니다.\n이제 실제 구출 작전에 도전해 보세요.':'전반·하프타임·후반, 세 번의 돌파를 끝냈습니다.\n오늘의 승리는 원팀!'):game.reason;$('result-stats').textContent=`점수 ${game.score.toLocaleString()} · 제압 ${game.stats.kos} · 밟기 ${game.stats.stomps}\n슛 ${game.stats.kicks} · 태클 ${game.stats.tackles} · 헤딩 ${game.stats.headers}`;}
 $('status').textContent=describe(game);
 if(m!==previousMode){clearInput();if(m==='playing')canvas.focus({preventScroll:true});else if(m==='brief'||m==='stageclear')$('continue').focus({preventScroll:true});else if(m==='paused')$('resume').focus({preventScroll:true});else if(m==='won'||m==='lost')$('again').focus({preventScroll:true});previousMode=m;}
}
function begin(practice=false){clearInput();game=createGame({difficulty:$('difficulty').value,practice});panels();}
function pause(){if(togglePause(game)){clearInput();panels();}}
$('start').onclick=()=>begin();$('practice').onclick=()=>begin(true);$('continue').onclick=()=>{if(game.mode==='stageclear'){nextStage(game);panels();}else{startGame(game);soundCue('start');panels();}};
$('pause').onclick=pause;$('resume').onclick=pause;$('restart').onclick=()=>begin(game.practice);$('again').onclick=()=>begin(game.practice);
for(const id of ['back-menu','result-menu'])$(id).onclick=()=>{game=createGame();game.mode='title';clearInput();panels();};
$('sound').onclick=()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').textContent=sound?'소리 켜짐':'소리 꺼짐';if(sound)soundCue('start');};
$('help').onclick=()=>{helpPaused=game.mode==='playing';if(helpPaused){game.mode='paused';clearInput();panels();}$('help-dialog').showModal();};
$('close-help').onclick=()=>$('help-dialog').close();$('help-dialog').addEventListener('close',()=>{if(helpPaused&&game.mode==='paused'){game.mode='playing';panels();}helpPaused=false;});
window.addEventListener('keydown',event=>{
 if($('help-dialog').open)return;if(['INPUT','SELECT'].includes(event.target.tagName))return;
 if(event.code==='KeyP'||event.code==='Escape'){if(!event.repeat){event.preventDefault();pause();}return;}
 const action=keyMap[event.code];if(!action||game.mode!=='playing')return;event.preventDefault();press(action);
});
window.addEventListener('keyup',event=>{const action=keyMap[event.code];if(action){held.delete(action);if(game.mode==='playing')event.preventDefault();}});
canvas.addEventListener('pointerdown',event=>{if(event.button!==0||game.mode!=='playing')return;event.preventDefault();canvas.focus({preventScroll:true});edges.add('tackle');});
for(const b of document.querySelectorAll('[data-hold],[data-action]')){
 const action=b.dataset.hold||b.dataset.action;b.addEventListener('pointerdown',event=>{if(game.mode!=='playing')return;event.preventDefault();b.setPointerCapture(event.pointerId);press(action);b.setAttribute('aria-pressed','true');});
 const release=()=>{held.delete(action);b.removeAttribute('aria-pressed');};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
 b.addEventListener('keydown',event=>{if(event.code==='Enter'||event.code==='Space'){event.preventDefault();press(action);}});b.addEventListener('keyup',release);
}
function backgroundPause(){clearInput();if(game.mode==='playing'){game.mode='paused';panels();}}
window.addEventListener('blur',backgroundPause);document.addEventListener('visibilitychange',()=>{if(document.hidden)backgroundPause();last=0;acc=0;});
function tick(now){const elapsed=last?Math.min((now-last)/1000,.1):0;last=now;acc+=elapsed;
 while(acc>=1/60){inputBuffer.step(game,1/60);acc-=1/60;for(const event of game.events)soundCue(event.type);game.events=[];}
 render(ctx,game,assets,{reducedMotion:reduced});if(game.mode!==previousMode||Math.floor(now/300)!==Math.floor((now-elapsed*1000)/300))panels();frame=requestAnimationFrame(tick);
}
$('start').disabled=true;$('practice').disabled=true;$('status').textContent='경기장과 선수 원화를 불러오는 중…';
Promise.all([load('./art/player-atlas.png'),load('./art/cast-atlas.png'),load('./art/stadium.png'),document.fonts.ready]).then(([player,cast,stadium])=>{assets={player:keyChroma(document.createElement('canvas'),player),cast:keyChroma(document.createElement('canvas'),cast),stadium};$('start').disabled=false;$('practice').disabled=false;panels();frame=requestAnimationFrame(tick);}).catch(error=>{$('status').textContent=error.message+' 새로고침해주세요.';});
if(import.meta.hot)import.meta.hot.dispose(()=>cancelAnimationFrame(frame));
