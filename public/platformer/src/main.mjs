import {createGame,update,restart,nextLevel,currentLevel,previewInput,W,H} from './engine.mjs';
import {createArt,render} from './render.mjs';
import {createAudio} from './audio.mjs';
const PREVIEW=new URLSearchParams(location.search).get('preview')==='1';
document.body.classList.toggle('preview',PREVIEW);
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false}),overlay=$('overlay');
canvas.width=W;canvas.height=H;
const audio=createAudio(),heldKeys=new Set(),touchActions=new Map();
const map={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',KeyX:'jump',ArrowUp:'jump',KeyW:'jump',ShiftLeft:'run',ShiftRight:'run',KeyZ:'run',ArrowDown:'down',KeyS:'down'};
let game=createGame(0,{preview:PREVIEW}),art=null,title=!PREVIEW,paused=false,help=false,last=0,acc=0,raf=0,lastPanel='',ready=false,previewClock=0,lastAnnounce=0,toastClock=0,disposed=false;
let best=0;
if(!PREVIEW){try{best=Number(localStorage.getItem('cloudway-best')||0);}catch{}}
function input(){const actions=new Set([...heldKeys].map(code=>map[code]).filter(Boolean));for(const action of touchActions.values())actions.add(action);return {left:actions.has('left'),right:actions.has('right'),run:actions.has('run'),fire:actions.has('run'),jump:actions.has('jump'),down:actions.has('down')};}
function clearInput(){heldKeys.clear();touchActions.clear();document.querySelectorAll('[data-action]').forEach(b=>b.setAttribute('aria-pressed','false'));}
function start(){clearInput();game=createGame(0);title=false;paused=false;help=false;acc=0;syncPanel();canvas.focus({preventScroll:true});}
function setPause(value){if(PREVIEW||title||!['playing','dying'].includes(game.mode))return;paused=value;clearInput();acc=0;syncPanel();if(!paused)canvas.focus({preventScroll:true});}
function notice(text){if(PREVIEW)return;$('toast').textContent=text;$('toast').classList.add('visible');toastClock=2.5;}
function saveBest(){if(PREVIEW||game.score<=best)return;best=game.score;try{localStorage.setItem('cloudway-best',String(best));}catch{}}
function button(text,action,secondary=false){return `<button data-command="${action}" class="${secondary?'secondary':''}">${text}</button>`;}
function syncPanel(){
 if(PREVIEW){overlay.classList.add('hidden');return;}
 const key=help?'help':title?'title':paused?'paused':game.mode;
 $('pause').disabled=title||!['playing','dying'].includes(game.mode);$('pause').textContent=paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',paused?'계속하기':'일시정지');
 if(key===lastPanel)return;lastPanel=key;overlay.dataset.screen=key;overlay.classList.toggle('hidden',['playing','dying','finishing'].includes(key));if(overlay.classList.contains('hidden'))return;
 let content='';
 if(key==='title') content=`<p class="eyebrow">ONE MORE ADVENTURE</p><h1>구름길<br>어드벤처</h1><p>달리고, 뛰어넘고, 구름 너머로.</p>${button('시작하기 →','start')}<p class="keys">← → 이동 · SPACE 점프 · SHIFT 달리기</p>`;
 else if(key==='paused')content=`<p class="eyebrow">TAKE A BREATH</p><h2>잠깐 쉬는 중</h2>${button('계속하기 →','resume')}${button('다시 시작','retry',true)}`;
 else if(key==='help')content=`<p class="eyebrow">HOW TO PLAY</p><h2>짧게 누르면 작게,<br>길게 누르면 높이.</h2><p>← → 이동 · SPACE / X 점프<br>SHIFT / Z 달리기 · 불꽃<br>↓ 웅크리기 · P / ESC 일시정지</p><p>적은 위에서 밟고, 블록은 아래에서!<br>코인 100개를 모으면 목숨이 하나 늘어요.</p>${button('알겠어요 →','close-help')}`;
 else if(key==='clear')content=`<p class="eyebrow">WORLD ${game.levelIndex+1}-1 CLEAR</p><h2>다음 모험으로!</h2><p class="stats">${String(game.score).padStart(6,'0')} POINTS</p>${button(game.levelIndex===2?'모험 완료 →':'다음 스테이지 →','next')}`;
 else if(key==='complete')content=`<p class="eyebrow">ADVENTURE COMPLETE</p><h2>구름 너머까지<br>도착했어요!</h2><p class="stats">${String(game.score).padStart(6,'0')} POINTS</p>${button('다시 모험하기 →','start')}${button('처음 화면','title',true)}`;
 else content=`<p class="eyebrow">ONE MORE TRY</p><h2>다시 도전할까요?</h2><p class="stats">${String(game.score).padStart(6,'0')} POINTS</p>${button('다시 도전 →','retry')}${button('처음 화면','title',true)}`;
 overlay.innerHTML=`<div class="panel">${content}</div>`;
 if(!title){const first=overlay.querySelector('button');first?.focus({preventScroll:true});}
}
overlay.addEventListener('click',event=>{
 if(PREVIEW||!ready)return;const command=event.target.closest('[data-command]')?.dataset.command;
 if(command==='start')start();
 if(command==='resume')setPause(false);
 if(command==='retry'){game=restart(game);title=false;paused=false;help=false;clearInput();acc=0;syncPanel();canvas.focus({preventScroll:true});}
 if(command==='next'){game=nextLevel(game);clearInput();acc=0;syncPanel();canvas.focus({preventScroll:true});}
 if(command==='title'){game=createGame(0);title=true;paused=false;help=false;clearInput();syncPanel();}
 if(command==='close-help'){help=false;syncPanel();if(!title&&!paused)canvas.focus({preventScroll:true});}
});
$('pause').onclick=()=>setPause(!paused);
$('sound').onclick=()=>{if(PREVIEW)return;const on=audio.set(!audio.enabled);$('sound').textContent=on?'소리 ON':'소리 OFF';$('sound').setAttribute('aria-pressed',String(on));$('sound').setAttribute('aria-label',on?'소리 끄기':'소리 켜기');if(on)audio.play('coin');};
$('help').onclick=()=>{if(PREVIEW||!ready)return;clearInput();help=true;syncPanel();};
window.addEventListener('keydown',event=>{
 if(PREVIEW||!ready||event.ctrlKey||event.metaKey||event.altKey)return;
 if(event.code==='Escape'||event.code==='KeyP'){event.preventDefault();if(event.repeat)return;if(help){help=false;syncPanel();}else setPause(!paused);return;}
 if(event.code==='Enter'&&event.target.tagName!=='BUTTON'&&!event.repeat){if(title){event.preventDefault();start();return;}if(game.mode==='clear'){game=nextLevel(game);syncPanel();return;}}
 if(!map[event.code]||event.target.tagName==='BUTTON'||title||paused||help)return;event.preventDefault();heldKeys.add(event.code);
});
window.addEventListener('keyup',event=>{if(map[event.code]){heldKeys.delete(event.code);if(!PREVIEW&&!title&&event.target.tagName!=='BUTTON')event.preventDefault();}});
for(const buttonEl of document.querySelectorAll('[data-action]')){
 const action=buttonEl.dataset.action;
 buttonEl.addEventListener('pointerdown',event=>{if(PREVIEW||title||paused||help||game.mode!=='playing')return;event.preventDefault();buttonEl.setPointerCapture(event.pointerId);touchActions.set(event.pointerId,action);buttonEl.setAttribute('aria-pressed','true');canvas.focus({preventScroll:true});});
 const release=event=>{touchActions.delete(event.pointerId);buttonEl.setAttribute('aria-pressed',String([...touchActions.values()].includes(action)));};
 buttonEl.addEventListener('pointerup',release);buttonEl.addEventListener('pointercancel',release);buttonEl.addEventListener('lostpointercapture',release);
}
function pauseBackground(){clearInput();if(!PREVIEW&&!title&&game.mode==='playing')setPause(true);last=0;acc=0;}
window.addEventListener('blur',pauseBackground);document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseBackground();});
function frame(now){
 if(disposed)return;raf=requestAnimationFrame(frame);const elapsed=last?Math.min(.1,(now-last)/1000):0;last=now;
 if(!title&&!paused&&!help){acc+=elapsed;let steps=0;while(acc>=1/60&&steps++<8){
  if(PREVIEW){previewClock+=1/60;if(['gameover','clear','complete'].includes(game.mode)||previewClock>26){game=createGame(0,{preview:true});previewClock=0;}update(game,previewInput(game,1/60),1/60);}else update(game,input(),1/60);
  for(const event of game.events||[]){if(!PREVIEW){audio.play(event.type);if(event.type==='checkpoint')notice('체크포인트!');if(event.type==='life')notice('목숨 +1');if(['clear','complete','death'].includes(event.type))saveBest();}}
  game.events.length=0;acc-=1/60;
 }}else acc=0;
 render(ctx,game,art,{preview:PREVIEW,paused,title,time:now/1000});
 if(PREVIEW&&!document.documentElement.dataset.previewReady){document.documentElement.dataset.previewReady='true';parent.postMessage({type:'game-preview-ready'},location.origin);}
 if(toastClock>0){toastClock-=elapsed;if(toastClock<=0)$('toast').classList.remove('visible');}
 if(!PREVIEW&&now-lastAnnounce>900){$('status').textContent=`${currentLevel(game).name} · 점수 ${game.score} · 코인 ${game.coinCount} · 목숨 ${game.lives} · ${Math.ceil(game.time)}초`;lastAnnounce=now;}
 syncPanel();
}
Promise.all([Promise.resolve(createArt()),document.fonts.ready]).then(([assets])=>{art=assets;ready=true;syncPanel();raf=requestAnimationFrame(frame);}).catch(error=>{overlay.innerHTML='<div class="panel"><h2>불러오지 못했어요.</h2><p>새로고침해서 다시 시작해 주세요.</p></div>';console.error(error);});
window.addEventListener('pagehide',event=>{if(event.persisted){pauseBackground();return;}disposed=true;cancelAnimationFrame(raf);audio.dispose();clearInput();});
window.addEventListener('pageshow',()=>{last=0;acc=0;});
