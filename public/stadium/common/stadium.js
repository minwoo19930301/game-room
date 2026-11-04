/* Party minigames shared library v2. Vanilla JS, no deps. Load before the game script.
   Provides: STADIUM.palette, drawHero, drawPlayerTag, Game shell (title/setup/countdown/play/end),
   per-player input (1–4 humans, rebindable keys, persisted), sfx, helpers, slots().
   Every game: 960x540 canvas, id="game". Shell handles overlays; game implements init/update(dt)/draw(ctx)/result(). */
(function () {
  const palette = {
    pink: '#3478DB', pinkDark: '#2356A6', pinkLight: '#B8D7FF', cream: '#FFF6EA', sand: '#F5D9A6',
    sky: '#BDEFFF', water: '#7FD3F2', grass: '#9BE38D', ink: '#25343D', beak: '#2B2B2B', beakTip: '#111',
    leg: '#F2A3C0', white: '#FFFFFF', gold: '#FFD166', red: '#FF5A5F', blue: '#5AA9FF', green: '#4FD37A', purple: '#B388FF',
    players: ['#3478DB', '#E76E56', '#FFD166', '#4FD37A'],
    rivals: ['#5AA9FF', '#FFD166', '#4FD37A']
  };
  const NAMES = ['1P', '2P', '3P', '4P'];

  function shade(hex, amt) { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt; r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b)); return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0'); }

  // pose: idle | jump | run | sleep | dig | eat | dizzy | harden | fly | ball | hit ; t = time; color = body; opts: {flip, rot, alpha}
const actorSheet = new Image();
actorSheet.src = new URL('../../art/character-actions.png',document.currentScript.src).href;
const frames=[], variants=new Map();
actorSheet.onload=()=>{
 const cw=actorSheet.naturalWidth/4,ch=actorSheet.naturalHeight/3;
 for(let n=0;n<12;n++){
  const tile=document.createElement('canvas');tile.width=Math.floor(cw);tile.height=Math.floor(ch);const c=tile.getContext('2d',{willReadFrequently:true});c.drawImage(actorSheet,(n%4)*cw,Math.floor(n/4)*ch,cw,ch,0,0,cw,ch);
  const pix=c.getImageData(0,0,tile.width,tile.height);let l=tile.width,r=0,top=tile.height,bot=0;
  for(let y=0;y<tile.height;y++)for(let x=0;x<tile.width;x++)if(pix.data[(y*tile.width+x)*4+3]>35){l=Math.min(l,x);r=Math.max(r,x);top=Math.min(top,y);bot=Math.max(bot,y)}
  frames.push({tile,pix,l,r,top,bot,w:r-l+1,h:bot-top+1});
 }
};
function actorTile(n,color){
 const f=frames[n];if(!f)return null;
 const key=n+color;if(variants.has(key))return variants.get(key);
 const c=document.createElement('canvas');c.width=f.tile.width;c.height=f.tile.height;const ctx=c.getContext('2d');ctx.drawImage(f.tile,0,0);
 // Jersey hues preserve skin and hair. Colors are required by the counting game.
 if(color&&color.toLowerCase()!=='#3478db'){
 const target=parseInt(color.slice(1),16),rgb=[target>>16&255,target>>8&255,target&255];const d=ctx.getImageData(0,0,c.width,c.height);
 for(let j=0;j<d.data.length;j+=4){const r=d.data[j],g=d.data[j+1],b=d.data[j+2];const py=Math.floor(j/4/c.width);if(py>f.top+f.h*.30&&py<f.top+f.h*.70&&d.data[j+3]&&b>r*1.17&&b>g*1.03&&b>23&&r<140){const light=Math.max(.3,Math.min(1.15,b/105)),blend=Math.max(0,Math.min(1,(b-Math.max(r,g)-7)/11));for(let k=0;k<3;k++)d.data[j+k]=Math.min(255,d.data[j+k]*(1-blend)+rgb[k]*light*blend)}}ctx.putImageData(d,0,0);
 }variants.set(key,c);return c;
}
function drawHero(ctx,x,y,s=1,pose='idle',t=0,color='#3478db',opts={}){
 if(!frames.length)return;
 const n=pose==='run'?1+Math.floor(t*9)%2:({idle:0,jump:3,eat:8,fly:9,harden:6,hit:7,dizzy:7,sleep:10,ball:10,dig:10,point:11}[pose]??0),f=frames[n];
 const factor=85/frames[0].h;const w=f.w*factor,h=f.h*factor;
 ctx.save();ctx.translate(x,y+34*s);ctx.rotate(opts.rot||0);ctx.scale(opts.flip?-s:s,s);if(opts.alpha!=null)ctx.globalAlpha=opts.alpha;
 const bob=pose==='run'?Math.sin(t*18)*1.3:pose==='idle'?Math.sin(t*2.4)*.6:0;
 ctx.drawImage(actorTile(n,color),f.l,f.top,f.w,f.h,-w/2,-h+bob,w,h);
 if(pose==='harden'){ctx.strokeStyle='#d6efef99';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-37,31,48,0,0,Math.PI*2);ctx.stroke()}
 ctx.restore();
}

  // small badge "1P" / "CPU" in player color
  function drawPlayerTag(ctx, x, y, i, label) {
    const s = slots()[i]; const txt = label || (s.human ? s.name : s.name + ' CPU');
    ctx.save(); ctx.font = 'bold 13px sans-serif'; const w = ctx.measureText(txt).width + 14;
    ctx.fillStyle = s.color; ctx.beginPath(); ctx.roundRect(x - w / 2, y - 11, w, 22, 11); ctx.fill();
    ctx.fillStyle = i === 2 ? palette.ink : palette.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + 1); ctx.restore();
  }

  // --- sfx (WebAudio beeps) ---
  let actx = null;
  function beep(freq = 440, dur = 0.08, type = 'square', vol = 0.05) {
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(); const g = actx.createGain(); o.type = type; o.frequency.value = freq; g.gain.value = vol; o.connect(g); g.connect(actx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur); o.stop(actx.currentTime + dur); } catch (e) { }
  }
  const sfx = {
    beep,
    tap: () => beep(660, 0.05), good: () => { beep(880, 0.08); setTimeout(() => beep(1320, 0.1), 60); }, bad: () => beep(160, 0.2, 'sawtooth'),
    win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.15), i * 90)), lose: () => [400, 300, 200].forEach((f, i) => setTimeout(() => beep(f, 0.2, 'triangle'), i * 120)),
    tick: () => beep(1000, 0.03, 'sine', 0.03), count: () => beep(740, 0.12, 'sine', 0.06), go: () => beep(1180, 0.25, 'sine', 0.07),
    hit: () => beep(220, 0.12, 'square', 0.06), pop: () => beep(1500, 0.04, 'sine', 0.05)
  };

  // --- settings (persisted, shared by all games on this origin) ---
  const ACTIONS = ['up', 'down', 'left', 'right', 'a', 'b'];
  const ACTION_LABEL = { up: '↑', down: '↓', left: '←', right: '→', a: 'A', b: 'B' };
  const DEFAULT_KEYS = [
    { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', a: 'Space', b: 'Enter' },
    { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', a: 'KeyC', b: 'KeyV' },
    { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL', a: 'Comma', b: 'Period' },
    { up: 'KeyT', down: 'KeyG', left: 'KeyF', right: 'KeyH', a: 'KeyB', b: 'KeyN' },
  ];
  const SKEY = 'blue-shirt-arcade:settings:v2';
  let settings = { humans: 1, keys: DEFAULT_KEYS.map(k => ({ ...k })) };
  try { const s = JSON.parse(localStorage.getItem(SKEY) || 'null'); if (s && s.keys && s.keys.length === 4) settings = { humans: Math.min(4, Math.max(1, s.humans | 0 || 1)), keys: s.keys.map((k, i) => ({ ...DEFAULT_KEYS[i], ...k })) }; } catch (e) { }
  function saveSettings() { try { localStorage.setItem(SKEY, JSON.stringify(settings)); } catch (e) { } }
  function keyLabel(code) { if (!code) return '—'; const AR = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' }; if (AR[code]) return AR[code]; return code.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Arrow/, '').replace('Space', 'SPACE').replace('Enter', 'ENTER').replace('Comma', ',').replace('Period', '.').replace('Numpad', 'N').replace('Shift', 'SHIFT').replace('Control', 'CTRL'); }

  function slots() { return NAMES.map((name, i) => ({ i, name, color: palette.players[i], human: i < settings.humans, keys: settings.keys[i] })); }
  const humans = () => settings.humans;
  const isHuman = i => i < settings.humans;
  const nameOf = i => NAMES[i];

  // --- input ---
  const keys = {}; const pressed = {}; let captureCb = null;
  window.addEventListener('keydown', e => {
    if (captureCb) { e.preventDefault(); const cb = captureCb; captureCb = null; cb(e.code); return; }
    if (!keys[e.code]) pressed[e.code] = true; keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  const pcache = [];
  function pInput(i) {
    if (!pcache[i]) pcache[i] = {
      i, hit: a => !!pressed[settings.keys[i][a]], down: a => !!keys[settings.keys[i][a]], code: a => settings.keys[i][a],
      get human() { return i < settings.humans; }, axis() { const k = settings.keys[i]; return { x: (keys[k.right] ? 1 : 0) - (keys[k.left] ? 1 : 0), y: (keys[k.down] ? 1 : 0) - (keys[k.up] ? 1 : 0) }; }
    };
    return pcache[i];
  }
  const input = { down: c => !!keys[c], hit: c => !!pressed[c], p: pInput, _flush: () => { for (const k in pressed) delete pressed[k]; } };

  // --- Game shell ---
  // cfg: { id, title, howto (string[]), duration (s, 0 = untimed → call api.finish()), init(), update(dt), draw(ctx),
  //        result() -> { scores:[4 numbers], text?, lowerIsBetter? }  (legacy: { score, text, win } still accepted) }
  function Game(cfg) {
    const canvas = document.getElementById('game'); const ctx = canvas.getContext('2d');
    const W = 960, H = 540; const resolution=Math.min(2,window.devicePixelRatio||1);canvas.width=W*resolution;canvas.height=H*resolution;ctx.scale(resolution,resolution);
    let state = 'title', t = 0, timeLeft = cfg.duration || 0, last = performance.now(), countdown = 0, result = null, endLock = 0, go = 0;
    let cur = { r: 0, c: 0 }, waiting = false, flash = 0;
    const hsKey = 'blue-shirt-arcade:' + cfg.id; let best = +(localStorage.getItem(hsKey) || 0);
    function start() { if(!frames.length)return;state = 'count'; countdown = 3; cfg.init(); sfx.count(); }
    function finish() {
      if (state !== 'play') return;
      state = 'end'; endLock = 0.8; const r = cfg.result() || {};
      if (Array.isArray(r.scores)) {
        const sc = r.scores.slice(0, 4).map(v => +v || 0);
        const order = sc.map((v, i) => i).sort((a, b) => r.lowerIsBetter ? sc[a] - sc[b] : sc[b] - sc[a]);
        const ranks = []; order.forEach((pi, k) => { ranks[pi] = k > 0 && sc[pi] === sc[order[k - 1]] ? ranks[order[k - 1]] : k + 1; });
        const win = ranks[0] === 1 || slots().some(s => s.human && ranks[s.i] === 1);
        result = { scores: sc, ranks, order, text: r.text || '', win, score: sc[0] };
      } else result = { score: +r.score || 0, text: r.text || '', win: !!r.win };
      if (result.score > best) { best = result.score; try { localStorage.setItem(hsKey, best); } catch (e) { } }
      result.win ? sfx.win() : sfx.lose();
    }
    const api = { W, H, ctx, get time() { return t; }, get timeLeft() { return timeLeft; }, finish, get best() { return best; }, state: () => state, get humans() { return settings.humans; }, slots, isHuman, nameOf, p: pInput };
    let inited = false; // first init happens on the first frame, after `g = Game(...)` has been assigned in the game script
    function loop(now) {
      if (!inited) { inited = true; cfg.init(); }
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; if (flash > 0) flash -= dt;
      if (state === 'title') {
        if (input.hit('Space') || input.hit('Enter')) start();
        for (let d = 1; d <= 4; d++) if (input.hit('Digit' + d) || input.hit('Numpad' + d)) { settings.humans = d; saveSettings(); sfx.pop(); }
        if (input.hit('KeyK') || input.hit('Tab')) { state = 'setup'; cur = { r: 0, c: 0 }; sfx.tap(); }
      } else if (state === 'setup') {
        if (!waiting) {
          if (input.hit('ArrowUp')) cur.r = (cur.r + 3) % 4; if (input.hit('ArrowDown')) cur.r = (cur.r + 1) % 4;
          if (input.hit('ArrowLeft')) cur.c = (cur.c + 5) % 6; if (input.hit('ArrowRight')) cur.c = (cur.c + 1) % 6;
          if (input.hit('Enter') || input.hit('Space')) { waiting = true; captureCb = code => { if (code !== 'Escape') { settings.keys[cur.r][ACTIONS[cur.c]] = code; saveSettings(); sfx.good(); } waiting = false; }; }
          if (input.hit('KeyR')) { settings.keys = DEFAULT_KEYS.map(k => ({ ...k })); saveSettings(); flash = 0.5; sfx.pop(); }
          if (input.hit('Escape') || input.hit('KeyK') || input.hit('Tab')) { state = 'title'; sfx.tap(); }
        }
      } else if (state === 'count') {
        const before = Math.ceil(countdown); countdown -= dt;
        if (Math.ceil(countdown) < before && countdown > 0) sfx.count();
        if (countdown <= 0) { state = 'play'; timeLeft = cfg.duration || 0; go = 0.8; sfx.go(); }
      } else if (state === 'play') {
        if (go > 0) go -= dt;
        cfg.update(dt);
        if (cfg.duration && state === 'play') { timeLeft -= dt; if (timeLeft <= 0) { timeLeft = 0; finish(); } }
      } else if (state === 'end') {
        endLock -= dt;
        for (let d = 1; d <= 4; d++) if (input.hit('Digit' + d) || input.hit('Numpad' + d)) { settings.humans = d; saveSettings(); sfx.pop(); }
        if (endLock <= 0 && (input.hit('Space') || input.hit('Enter'))) start();
      }
      ctx.clearRect(0, 0, W, H);
      cfg.draw(ctx);
      if (state === 'play' && cfg.duration && cfg.id !== 'sushi') hud(ctx, `${timeLeft.toFixed(1)}s`, `BEST ${best}`);
      if (state === 'play' && go > 0) big(ctx, 'GO!', 1 - Math.max(0, 0.8 - go) / 0.8 * 0.5);
      if (state === 'title') titleScreen(ctx);
      if (state === 'setup') setupScreen(ctx);
      if (state === 'count') { overlayDim(ctx, 0.25); big(ctx, String(Math.ceil(countdown))); }
      if (state === 'end') endScreen(ctx);
      input._flush();
      requestAnimationFrame(loop);
    }
    canvas.addEventListener('pointerdown',e=>{const box=canvas.getBoundingClientRect(),x=(e.clientX-box.left)*W/box.width,y=(e.clientY-box.top)*H/box.height;if(state==='title'){if(y>=344&&y<=402&&x>=64&&x<=624){settings.humans=Math.min(4,Math.max(1,Math.floor((x-64)/140)+1));saveSettings();sfx.pop()}else if(y>=428)start()}else if(state==='end'&&endLock<=0)start();});
    function hud(ctx, l, r) { ctx.save(); ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = palette.ink; ctx.textAlign = 'left'; ctx.fillText(l, 16, 32); ctx.textAlign = 'right'; ctx.fillText(r, W - 16, 32); ctx.restore(); }
    function overlayDim(ctx, a) { ctx.save(); ctx.fillStyle = `rgba(12,24,31,${a})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    function big(ctx, s, alpha = 1) { ctx.save(); ctx.globalAlpha = alpha; ctx.font = 'bold 120px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = palette.white; ctx.strokeStyle = palette.pinkDark; ctx.lineWidth = 8; ctx.strokeText(s, W / 2, H / 2 + 40); ctx.fillText(s, W / 2, H / 2 + 40); ctx.restore(); }
    function titleScreen(ctx) {
      ctx.save();overlayDim(ctx,.35);
      const shade=ctx.createLinearGradient(0,0,750,0);shade.addColorStop(0,'#101f2ff5');shade.addColorStop(.72,'#152836f5');shade.addColorStop(1,'#15283600');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
      ctx.textAlign='left';ctx.font='700 12px sans-serif';ctx.fillStyle='#c5d6d4';ctx.fillText('PARTY COLLECTION   /   '+({says:'MEMORY',sushi:'SUSHI',harden:'TIMING',stampede:'OBSERVATION'}[cfg.id]||'PLAY'),64,65);
      ctx.fillStyle='#f6f3e8';ctx.font='800 46px sans-serif';ctx.fillText(cfg.title,60,132);
      ctx.fillStyle='#c4b184';ctx.fillRect(64,158,44,3);
      let yy=206;ctx.font='18px sans-serif';ctx.fillStyle='#d0d9dc';
      for(const l of cfg.howto||[]){let chunk='';for(const word of l.split(' ')){if(ctx.measureText(chunk+word).width>515){ctx.fillText(chunk,64,yy);yy+=26;chunk=''}chunk+=word+' '}ctx.fillText(chunk,64,yy);yy+=31;}
      slots().forEach((p,i)=>{const x=64+i*140;rr(ctx,x,344,128,55,9,p.human?'#f0ead9':'#ffffff0e');ctx.fillStyle=p.human?'#193443':'#8c9da6';ctx.font='700 17px sans-serif';ctx.fillText(p.name+(p.human?'':'  CPU'),x+13,367);ctx.font='11px sans-serif';ctx.fillText(p.human?`${keyLabel(p.keys.left)} ${keyLabel(p.keys.right)} · ${keyLabel(p.keys.a)}`:'컴퓨터',x+13,387);});
      rr(ctx,64,428,258,55,9,frames.length?'#d6b370':'#596977');ctx.fillStyle='#182d39';ctx.font='800 18px sans-serif';ctx.fillText(frames.length?'게임 시작     →':'캐릭터 준비 중…',84,462);
      ctx.font='13px sans-serif';ctx.fillStyle='#b1c1c6';ctx.fillText('SPACE / 클릭',343,460);ctx.fillText('숫자 1–4 : 사람 수   ·   K : 키 설정',64,510);
      drawHero(ctx,785,266,3.2,cfg.id==='sushi'?'eat':cfg.id==='harden'?'harden':cfg.id==='says'?'point':'idle',t);
      ctx.restore();
    }
    function setupScreen(ctx) {
      overlayDim(ctx, 0.8); ctx.save(); ctx.textAlign = 'center';
      ctx.fillStyle = palette.cream; ctx.font = 'bold 36px sans-serif'; ctx.fillText('키 설정', W / 2, 70);
      ctx.font = '15px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText('방향키로 이동 · ENTER 누른 뒤 원하는 키 입력 · R 초기화 · ESC 닫기', W / 2, 100);
      const x0 = 150, y0 = 150, cw = 118, rh = 70;
      ACTIONS.forEach((a, c) => { ctx.fillStyle = palette.pinkLight; ctx.font = 'bold 18px sans-serif'; ctx.fillText(ACTION_LABEL[a], x0 + 60 + c * cw + 60, y0 - 12); });
      slots().forEach((s, r) => {
        const y = y0 + r * rh; drawPlayerTag(ctx, x0 - 40, y + 30, r, s.name + (s.human ? '' : ' CPU'));
        ACTIONS.forEach((a, c) => {
          const x = x0 + 60 + c * cw, sel = cur.r === r && cur.c === c;
          ctx.fillStyle = sel ? (waiting ? palette.gold : palette.pink) : 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.roundRect(x + 6, y + 8, cw - 12, 44, 10); ctx.fill();
          ctx.fillStyle = sel ? palette.ink : palette.white; ctx.font = 'bold 18px sans-serif'; ctx.fillText(sel && waiting ? '키 입력…' : keyLabel(s.keys[a]), x + cw / 2, y + 37);
        });
      });
      if (flash > 0) { ctx.fillStyle = palette.gold; ctx.font = 'bold 20px sans-serif'; ctx.fillText('기본값으로 되돌렸습니다', W / 2, H - 40); }
      ctx.restore();
    }
    function endScreen(ctx) {
      overlayDim(ctx, 0.6); ctx.save(); ctx.textAlign = 'center';
      const title = result.win ? '승리!' : '종료';
      ctx.fillStyle = palette.cream; ctx.strokeStyle = palette.pinkDark; ctx.lineWidth = 6; ctx.font = 'bold 48px sans-serif'; ctx.strokeText(title, W / 2, 120); ctx.fillText(title, W / 2, 120);
      if (result.scores) {
        const sl = slots();
        result.order.forEach((pi, k) => {
          const y = 175 + k * 52, s = sl[pi], rank = result.ranks[pi];
          ctx.fillStyle = rank === 1 ? 'rgba(255,209,102,.25)' : 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.roundRect(W / 2 - 220, y - 22, 440, 44, 10); ctx.fill();
          ctx.textAlign = 'left'; ctx.fillStyle = palette.white; ctx.font = 'bold 24px sans-serif'; ctx.fillText(rank + '위', W / 2 - 200, y + 8);
          drawPlayerTag(ctx, W / 2 - 100, y, pi);
          ctx.textAlign = 'right'; ctx.fillStyle = s.color; ctx.font = 'bold 26px sans-serif'; ctx.fillText(String(result.scores[pi]), W / 2 + 200, y + 9);
        });
        ctx.textAlign = 'center'; ctx.font = '20px sans-serif'; ctx.fillStyle = palette.white; if (result.text) ctx.fillText(result.text, W / 2, 400);
      } else { ctx.font = '24px sans-serif'; ctx.fillStyle = palette.white; ctx.fillText(result.text, W / 2, 230); }
      ctx.font = '18px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(`최고 기록 ${best}`, W / 2, 430);
      ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = palette.gold; ctx.fillText('SPACE 로 다시', W / 2, H - 52);
      ctx.font = '15px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText(`숫자 1~4 로 사람 수 바꾸기 (지금 ${settings.humans}명)`, W / 2, H - 26);
      ctx.restore();
    }
    requestAnimationFrame(loop);
    return api;
  }

  // --- helpers ---
  function bg(ctx, W, H, top = palette.sky, bottom = palette.cream) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bottom); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  function text(ctx, s, x, y, size = 22, color = palette.ink, align = 'center', weight = 'bold') { ctx.save(); ctx.font = `${weight} ${size}px sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(s, x, y); ctx.restore(); }
  function rr(ctx, x, y, w, h, r, fill) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;

  window.STADIUM = { palette, drawHero, drawPlayerTag, Game, input, sfx, bg, text, rr, rand, clamp, lerp, shade, slots, humans, isHuman, nameOf, keyLabel, ACTIONS, settings: () => settings };
})();
