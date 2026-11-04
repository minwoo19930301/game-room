/* Blue Shirt Stadium shared library v2. Vanilla JS, no deps. Load before the game script.
   Provides: STADIUM.palette, drawHero, drawPlayerTag, Game shell (title/setup/countdown/play/end),
   per-player input (1–4 humans, rebindable keys, persisted), sfx, helpers, slots().
   Every game: 960x540 canvas, id="game". Shell handles overlays; game implements init/update(dt)/draw(ctx)/result(). */
(function () {
  const palette = {
    pink: '#3478DB', pinkDark: '#2356A6', pinkLight: '#B8D7FF', cream: '#FFF6EA', sand: '#F5D9A6',
    sky: '#BDEFFF', water: '#7FD3F2', grass: '#9BE38D', ink: '#3A2430', beak: '#2B2B2B', beakTip: '#111',
    leg: '#F2A3C0', white: '#FFFFFF', gold: '#FFD166', red: '#FF5A5F', blue: '#5AA9FF', green: '#4FD37A', purple: '#B388FF',
    players: ['#3478DB', '#E76E56', '#FFD166', '#4FD37A'],
    rivals: ['#5AA9FF', '#FFD166', '#4FD37A']
  };
  const NAMES = ['1P', '2P', '3P', '4P'];

  function shade(hex, amt) { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt; r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b)); return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0'); }

  // pose: idle | jump | run | sleep | dig | eat | dizzy | harden | fly | ball | hit ; t = time; color = body; opts: {flip, rot, alpha}
function drawHero(ctx,x,y,s=1,pose='idle',t=0,color='#3478db',opts={}) {
 ctx.save();ctx.translate(x,y);ctx.rotate(opts.rot||0);ctx.scale(opts.flip?-s:s,s);if(opts.alpha!=null)ctx.globalAlpha=opts.alpha;
 const crouch=['harden','ball','sleep'].includes(pose), run=pose==='run', wave=['fly','jump','hit'].includes(pose);
 ctx.translate(0,crouch?12:Math.sin(t*(run?18:3))*(run?2:1));
 const limb=(a,b,c,d,col,w)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke();};
 const stride=run?Math.sin(t*18)*10:0;
 limb(-7,8,-8+stride,crouch?20:30,'#24334d',9);limb(7,8,8-stride,crouch?20:30,'#24334d',9);
 limb(-8+stride,crouch?21:31,-13+stride,crouch?21:31,'#122035',7);limb(8-stride,crouch?21:31,13-stride,crouch?21:31,'#122035',7);
 ctx.fillStyle=pose==='harden'?'#73869a':color;ctx.beginPath();ctx.roundRect(-15,-17,30,31,7);ctx.fill();
 ctx.fillStyle='#e2efff';ctx.beginPath();ctx.moveTo(-7,-17);ctx.lineTo(0,-10);ctx.lineTo(7,-17);ctx.fill();
 ctx.fillStyle='#fff';for(let j=0;j<3;j++)ctx.fillRect(-1,-6+j*6,2,2);
 const ay=wave?-31:crouch?-5:pose==='eat'?-13:8;
 limb(-14,-11,-23,ay,color,9);limb(14,-11,pose==='eat'?32:23,ay,color,9);
 limb(-23,ay,-24,ay-2,'#efbd95',7);limb(pose==='eat'?32:23,ay,pose==='eat'?35:24,ay-2,'#efbd95',7);
 ctx.fillStyle='#efbd95';ctx.beginPath();ctx.arc(0,-30,14,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#19283e';ctx.beginPath();ctx.arc(0,-34,14,Math.PI,Math.PI*2);ctx.lineTo(13,-29);ctx.lineTo(5,-37);ctx.lineTo(-5,-30);ctx.lineTo(-13,-28);ctx.fill();
 ctx.strokeStyle='#26344a';ctx.lineWidth=2;for(const ex of [-5,5]){ctx.beginPath();ctx.moveTo(ex-1,-29);ctx.lineTo(ex+1,pose==='sleep'?-29:-27);ctx.stroke();}
 ctx.beginPath();ctx.arc(0,-24,3,0,Math.PI);ctx.stroke();
 if(pose==='harden'){ctx.fillStyle='#a6c6df';ctx.strokeStyle='#e8f8ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-17,-10);ctx.lineTo(17,-10);ctx.lineTo(14,12);ctx.lineTo(0,23);ctx.lineTo(-14,12);ctx.closePath();ctx.fill();ctx.stroke();}
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
    const W = canvas.width = 960, H = canvas.height = 540;
    let state = 'title', t = 0, timeLeft = cfg.duration || 0, last = performance.now(), countdown = 0, result = null, endLock = 0, go = 0;
    let cur = { r: 0, c: 0 }, waiting = false, flash = 0;
    const hsKey = 'blue-shirt-arcade:' + cfg.id; let best = +(localStorage.getItem(hsKey) || 0);
    function start() { state = 'count'; countdown = 3; cfg.init(); sfx.count(); }
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
      if (state === 'play' && cfg.duration) hud(ctx, `${timeLeft.toFixed(1)}s`, `BEST ${best}`);
      if (state === 'play' && go > 0) big(ctx, 'GO!', 1 - Math.max(0, 0.8 - go) / 0.8 * 0.5);
      if (state === 'title') titleScreen(ctx);
      if (state === 'setup') setupScreen(ctx);
      if (state === 'count') { overlayDim(ctx, 0.25); big(ctx, String(Math.ceil(countdown))); }
      if (state === 'end') endScreen(ctx);
      input._flush();
      requestAnimationFrame(loop);
    }
    function hud(ctx, l, r) { ctx.save(); ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = palette.ink; ctx.textAlign = 'left'; ctx.fillText(l, 16, 32); ctx.textAlign = 'right'; ctx.fillText(r, W - 16, 32); ctx.restore(); }
    function overlayDim(ctx, a) { ctx.save(); ctx.fillStyle = `rgba(58,36,48,${a})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    function big(ctx, s, alpha = 1) { ctx.save(); ctx.globalAlpha = alpha; ctx.font = 'bold 120px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = palette.white; ctx.strokeStyle = palette.pinkDark; ctx.lineWidth = 8; ctx.strokeText(s, W / 2, H / 2 + 40); ctx.fillText(s, W / 2, H / 2 + 40); ctx.restore(); }
    function titleScreen(ctx) {
      overlayDim(ctx, 0.55); ctx.save(); ctx.textAlign = 'center';
      ctx.fillStyle = palette.cream; ctx.strokeStyle = palette.pinkDark; ctx.lineWidth = 6; ctx.font = 'bold 54px sans-serif'; ctx.strokeText(cfg.title, W / 2, 150); ctx.fillText(cfg.title, W / 2, 150);
      ctx.font = '22px sans-serif'; ctx.fillStyle = palette.white; (cfg.howto || []).forEach((l, i) => ctx.fillText(l, W / 2, 205 + i * 32));
      // player slots
      const sl = slots();
      sl.forEach((s, i) => { const x = W / 2 - 240 + i * 160; ctx.fillStyle = s.human ? s.color : 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.roundRect(x - 64, 350, 128, 54, 12); ctx.fill(); ctx.fillStyle = s.human ? (i === 2 ? palette.ink : palette.white) : 'rgba(255,255,255,.6)'; ctx.font = 'bold 20px sans-serif'; ctx.fillText(s.name + (s.human ? '' : ' CPU'), x, 373); ctx.font = '12px sans-serif'; ctx.fillText(s.human ? `${keyLabel(s.keys.left)}${keyLabel(s.keys.right)} ${keyLabel(s.keys.a)}` : '컴퓨터', x, 394); });
      ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = palette.gold; ctx.fillText('SPACE 로 시작', W / 2, H - 70);
      ctx.font = 'bold 19px sans-serif'; ctx.fillStyle = palette.pinkLight; ctx.fillText(`같이 하려면 숫자 1~4 로 사람 수를 정하세요 (지금 ${settings.humans}명)`, W / 2, H - 36);
      ctx.font = '14px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.fillText('K : 키 설정', W / 2, H - 15);
      drawHero(ctx, 90, H - 110, 1.6, 'idle', t); drawHero(ctx, W - 90, H - 110, 1.6, 'idle', t + 1, palette.players[1], { flip: true });
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
      ctx.fillStyle = palette.cream; ctx.strokeStyle = palette.pinkDark; ctx.lineWidth = 6; ctx.font = 'bold 54px sans-serif'; ctx.strokeText(title, W / 2, 120); ctx.fillText(title, W / 2, 120);
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
