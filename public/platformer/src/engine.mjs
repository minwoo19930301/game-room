import { LEVELS } from './levels.mjs';

export const TILE = 48, W = 960, H = 540, STEP = 1 / 60;
export const PHYSICS = Object.freeze({
  walk: 200, run: 340, acceleration: 1150, airAcceleration: 650,
  friction: 1250, brake: 1900, jump: 740, gravity: 2100,
  holdGravity: 1200, fallGravity: 2400, terminal: 820,
  jumpHold: .18, coyote: .08, buffer: .1,
});
const SOLID = new Set(['#', 'B', '?', 'M', 'F', 'S', 'L', 'X', 'P']);
const BLOCKS = { '?': 'coin', M: 'growth', F: 'fire', S: 'star', L: 'life' };
const FLAG_SECONDS = .65, FINISH_SECONDS = 2.1;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const approach = (n, target, amount) => n < target ? Math.min(n + amount, target) : Math.max(n - amount, target);
const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const clone = value => JSON.parse(JSON.stringify(value));
export function currentLevel(g) { return g.level; }
export function tileAt(g, tx, ty) {
  if (ty < 0 || ty >= g.tiles.length) return '.';
  if (tx < 0 || tx >= g.tiles[0].length) return '#';
  return g.tiles[ty][tx];
}
function setTile(g, tx, ty, ch) {
  if (!g.tiles[ty] || tx < 0 || tx >= g.tiles[ty].length) return;
  g.tiles[ty] = g.tiles[ty].slice(0, tx) + ch + g.tiles[ty].slice(tx + 1);
}
function event(g, type, x = g.player.x, y = g.player.y, extra = {}) {
  g.events.push({ type, x, y, ...extra });
  if(g.events.length>64)g.events.splice(0,g.events.length-64);
}
function effect(g, type, x, y, extra = {}) {
  g.particles.push({ type, x, y, vx:0,vy:0,age: 0, life: .5,maxLife:.5, ...extra });
}
function entity(spec, id) {
  const type = spec.type || spec.kind;
  const defaults = {
    walker: { w: 36, h: 32, vx: -65 }, turtle: { w: 38, h: 40, vx: -55 },
    flyer: { w:36,h:30,vx:-70 },boss:{w:72,h:80,vx:-70,hp:3},
    plant: { w: 30, h: 44, vx: 0 }, coin: { w: 18, h: 24, vx: 0 },
    growth: { w: 26, h: 26, vx: 75 }, fire: { w: 26, h: 26, vx: 0 },
    star: { w: 26, h: 26, vx: 110 }, 'life': { w: 26, h: 26, vx: 75 },
  };
  const result = { id, type, x: 0, y: 0, vy: 0, alive: true, state: 'walk',
    age: 0, grounded: false, dir: -1, ...defaults[type], ...clone(spec),
    baseY: spec.y, baseX:spec.x, chain: 0, kickGrace: 0,active:true,anim:0 };
  result.vx = Math.abs(result.vx || 0) * (spec.dir || (result.vx<0?-1:1));
  return result;
}
function loadLevel(g, index, checkpoint = false) {
  g.levelIndex = index;
  g.level = g.levels[index];
  const level = currentLevel(g);
  g.tiles = level.tiles.slice();
  g.enemies = (level.enemies || []).map((e, i) => entity(e, i + 1));
  g.items = [];
  g.coins = (level.coins || []).map(c => ({...c,collected:false}));
  g.platforms = (level.platforms || []).map(p => ({...p,originX:p.x,originY:p.y,age:0,dx:0,dy:0}));
  g.nextId = g.enemies.length + 1;
  g.goalLocked=!!level.goal.requiresBoss&&g.enemies.some(e=>e.type==='boss'&&e.alive);
  g.particles = [];
  g.projectiles = [];
  g.events = [];

  const start = checkpoint && g.checkpoint ? g.checkpoint : level.spawn;
  g.player = { x: start.x, y: start.y, w: 32, h: 40, vx: 0, vy: 0,
    dir: 1, onGround: false, pose: 'idle', power: 'small', anim:0, dead:false,
    invincible: 0, hurt: checkpoint ? 1.5 : 0, fireCooldown: 0,
    coyote: 0, jumpBuffer: 0, jumpHold: 0, stompChain: 0,
  };
  g.cameraX = clamp(start.x - W * .37,0,Math.max(0,g.tiles[0].length*TILE-W));

  g.mode = 'playing';
  g.modeTime = 0;
  g.clearTime = 0;
  g.finishTime = 0;
  g.finishPhase = null;
  g.goalProgress = 0;
  g.time = level.timeLimit || 300;
  g.previous = { jump: false, fire: false };
  g.accumulator = 0;
  g.preview = { jump: false, age: 0, stuck: 0, lastX: start.x };
}
export function createGame(index = 0, options = {}) {
  const levels = options.levels || LEVELS;
  const g = { levels, levelIndex: clamp(index, 0, levels.length - 1),
    lives: options.lives ?? 3, coinCount: 0, score: 0, elapsed: 0,
    checkpoint: null, checkpointReached: false, paused: false };
  loadLevel(g, g.levelIndex);
  return g;
}
export function restart(g) {
  if (g.mode === 'gameover') return createGame(0, {levels:g.levels});
  const next = createGame(g.levelIndex, {levels:g.levels,lives:g.lives});
  next.score=g.score; next.coinCount=g.coinCount; next.elapsed=g.elapsed;
  next.checkpoint=g.checkpoint ? {...g.checkpoint} : null;
  next.checkpointReached=g.checkpointReached;
  loadLevel(next,next.levelIndex,true);
  return next;
}
export function nextLevel(g) {
  if (g.mode !== 'clear') return g;
  if (g.levelIndex + 1 >= g.levels.length) {
    const next={...g,mode:'complete',events:[]};event(next,'complete');return next;
  }
  const next=createGame(g.levelIndex+1,{levels:g.levels,lives:g.lives});
  next.score=g.score;next.coinCount=g.coinCount;next.elapsed=g.elapsed;
  changePower(next,g.player.power);
  return next;
}

function awardCoin(g, x, y) {
  g.coinCount++; g.score += 100;
  event(g, 'coin', x, y); effect(g, 'coin', x, y, { vy: -130 });
  if (g.coinCount >= 100) {
    g.coinCount -= 100; g.lives++; event(g, 'life', x, y); effect(g, 'text', x, y, { text: '1UP', life: 1 });
  }
}
function blocked(g, body) {
  const left = Math.floor((body.x + .001) / TILE), right = Math.floor((body.x + body.w - .001) / TILE);
  const top = Math.floor((body.y + .001) / TILE), bottom = Math.floor((body.y + body.h - .001) / TILE);
  for (let ty = top; ty <= bottom; ty++) for (let tx = left; tx <= right; tx++)
    if (SOLID.has(tileAt(g, tx, ty))) return true;
  return false;
}
function changePower(g, power) {
  const p = g.player, oldH = p.h, desired = power === 'small' ? 40 : 72;
  p.power = power;
  p.h = desired; p.y += oldH - desired;
  // Growth always keeps feet fixed; squeeze down safely under a low ceiling.
  if (desired > oldH && blocked(g, p)) { p.h = oldH; p.y -= oldH - desired; p.crouching = true; }
  else p.crouching = false;
}
function collect(g, e) {
  if (e.active === false || e.alive === false) return;
  e.alive = false; e.active = false;
  if (e.type === 'coin') return awardCoin(g, e.x, e.y);
  if (e.type === 'growth') { if (g.player.power === 'small') changePower(g, 'big'); }
  else if (e.type === 'fire') changePower(g, 'fire');
  else if (e.type === 'star') g.player.invincible = 10;
  else if (e.type === 'life') { g.lives++; event(g, 'life', e.x, e.y); }
  g.score += 1000;
  event(g, 'power', e.x, e.y, { power: e.type });
  effect(g, 'text', e.x, e.y, { text: e.type === 'life' ? '1UP' : '+1000', life: .9 });
}
function bumpBlock(g, tx, ty) {
  const tile = tileAt(g, tx, ty), x = tx * TILE, y = ty * TILE;
  if (tile === 'B' && g.player.power !== 'small') {
    setTile(g, tx, ty, '.'); g.score += 50; event(g, 'break', x, y);
    for (let i = 0; i < 4; i++) effect(g, 'brick', x + 8 + i % 2 * 16, y + 8 + Math.floor(i / 2) * 16,
      { vx: (i % 2 ? 1 : -1) * 95, vy: -180 - Math.floor(i / 2) * 90, life: .7 });
  } else if (BLOCKS[tile]) {
    setTile(g, tx, ty, 'X');
    const type = BLOCKS[tile];
    if (type === 'coin') awardCoin(g, x + 7, y - TILE);
    else g.items.push(entity({ type, x: x + 3, y: y - 26,
      emerging: .3, emergeY: y - 26, vx: type === 'star' ? 110 : type === 'fire' ? 0 : 75 }, g.nextId++));
    event(g, 'bump', x, y); effect(g, 'block', x, y, { life: .2 });
  } else if (tile === 'B') { event(g, 'bump', x, y); effect(g, 'block', x, y, { life: .2 }); }
  // A struck ceiling also knocks an enemy resting on top of that block.
  for (const e of g.enemies) if (e.alive && ['walker', 'turtle'].includes(e.type) &&
    e.x + e.w > x && e.x < x + TILE && Math.abs(e.y + e.h - y) < 8) killEnemy(g, e, 'bump');
}
function moveBody(g, body, dt, isPlayer = false) {
  const oldX = body.x, oldY = body.y;
  body.x += body.vx * dt;
  let hitX = false, hitY = false;
  if (body.vx) {
    const tx = Math.floor((body.vx > 0 ? body.x + body.w - .001 : body.x + .001) / TILE);
    for (let ty = Math.floor((body.y + .001) / TILE); ty <= Math.floor((body.y + body.h - .001) / TILE); ty++) {
      if (!SOLID.has(tileAt(g, tx, ty))) continue;
      body.x = body.vx > 0 ? tx * TILE - body.w : (tx + 1) * TILE;
      hitX = true; break;
    }
  }
  const movingVY = body.vy;
  body.y += movingVY * dt;
  body.grounded = false;
  if (movingVY) {
    const ty = Math.floor((movingVY > 0 ? body.y + body.h - .001 : body.y + .001) / TILE);
    const tx0 = Math.floor((body.x + .001) / TILE), tx1 = Math.floor((body.x + body.w - .001) / TILE);
    const collisions = [];
    for (let tx = tx0; tx <= tx1; tx++) {
      const tile = tileAt(g, tx, ty);
      if (SOLID.has(tile) || (tile === '=' && movingVY > 0 && oldY + body.h <= ty * TILE + .01)) collisions.push(tx);
    }
    if (collisions.length) {
      body.y = movingVY > 0 ? ty * TILE - body.h : (ty + 1) * TILE;
      body.grounded = movingVY > 0; body.vy = 0; hitY = true;
      if (isPlayer && movingVY < 0) {
        // At a seam choose the block nearest the head center, exactly once.
        const middle = body.x + body.w / 2;
        collisions.sort((a, b) => Math.abs((a + .5) * TILE - middle) - Math.abs((b + .5) * TILE - middle));
        bumpBlock(g, collisions[0], ty);
      }
    }
  }
  if (hitX) body.vx = 0;
  return { hitX, hitY, oldX, oldY };
}
function killEnemy(g, e, reason = 'stomp', chain = 0) {
  if (!e.alive) return;
  e.alive = false; e.state = 'dead';
  const points = Math.min(8000, 100 * 2 ** chain);
  g.score += points;
  event(g, reason==='fire'?'fire':'stomp', e.x, e.y);
  effect(g, 'enemy', e.x, e.y, { enemyType: e.type, vx: 70 * g.player.dir, vy: -180, life: .6 });
  effect(g, 'text', e.x, e.y, { text: `+${points}`, life: .7 });
}
function die(g, reason) {
  if (g.mode !== 'playing') return;
  g.mode = 'dying'; g.modeTime = 0;
  g.player.pose = 'dead'; g.player.dead = true; g.player.vy = -450; g.player.vx = 0;
  g.lives = Math.max(0, g.lives - 1); event(g, 'death', g.player.x, g.player.y, { reason });
}
function hurt(g) {
  const p = g.player;
  if (p.hurt > 0 || p.invincible > 0 || g.mode !== 'playing') return;
  if (p.power !== 'small') {
    changePower(g, 'small'); p.hurt = 1.8;
    p.vx = -p.dir * 130; event(g, 'hurt');
  } else die(g, 'enemy');
}
function kickShell(g, e) {
  e.state = 'sliding'; e.vx = (e.x + e.w / 2 >= g.player.x + g.player.w / 2 ? 1 : -1) * 360;
  e.kickGrace = .16; e.chain = 0; event(g, 'stomp', e.x, e.y);
}
function updateEnemies(g, dt, oldPlayerY, jumpHeld) {
  const p = g.player;
  for (const e of g.enemies) {
    if (!e.alive) continue;
    e.awake ||= Math.abs(e.x-p.x)<W*.9;
    if (!e.awake) continue;
    e.age += dt; e.anim += dt; e.kickGrace = Math.max(0, e.kickGrace - dt);
    e.hurt = Math.max(0,(e.hurt||0)-dt);
    if (e.type === 'plant') {
      e.phase = ((e.age + (e.offset || 0)) % 4.2);
      const near = Math.abs(p.x + p.w / 2 - (e.x + e.w / 2)) < 66;
      e.retracted = e.phase < 1.2 || (near && e.retracted !== false);
      e.y = e.baseY + (e.retracted ? e.h : Math.max(0, 1 - Math.min(e.phase - 1.2, 4.2 - e.phase) / .45) * e.h);
      if (!e.retracted && overlaps(p, e)) {
        if (p.invincible > 0) killEnemy(g, e, 'star'); else hurt(g);
      }
      continue;
    }
    if (e.type === 'flyer') {
      e.x=e.baseX+Math.sin(e.age*.95)*(e.range||95);
      e.y=e.baseY+Math.sin(e.age*2.4)*25;
      e.dir=Math.cos(e.age*.95)>0?1:-1;
    } else {
      if(e.type==='boss') {
        const phase=e.age%3.2;
        e.telegraph=phase>2&&phase<2.55;
        e.vx=e.telegraph?0:(phase>=2.55?185:64)*e.dir;
        if(Math.abs(e.x-e.baseX)>(e.range||120))e.dir=-Math.sign(e.x-e.baseX);
      }
      const oldVX = e.vx;
      e.vy = Math.min(PHYSICS.terminal, e.vy + PHYSICS.gravity * dt);
      const result = moveBody(g, e, dt);
      if (result.hitX) { e.vx = -oldVX; e.dir = Math.sign(e.vx)||e.dir; }
      if(e.vx)e.dir=Math.sign(e.vx);
    }
    if (e.y > g.tiles.length * TILE + 100) { e.alive = false; continue; }
    if (!overlaps(p, e) || g.mode !== 'playing') continue;
    if (p.invincible > 0) { killEnemy(g, e, 'star', p.stompChain++); continue; }
    const stomp = p.vy > 0 && oldPlayerY + p.h <= e.y + Math.max(12, p.vy * dt + 2);
    if (stomp) {
      p.y = e.y - p.h;
      p.vy = jumpHeld ? -580 : -390; p.onGround = false; p.coyote = 0;
      event(g, 'stomp', e.x, e.y);
      if (e.type === 'walker' || e.type === 'flyer') killEnemy(g, e, 'stomp', p.stompChain++);
      else if (e.type==='boss') {
        if(!e.hurt) { e.hp--; e.hurt=.7; if(e.hp<=0)killEnemy(g,e,'stomp',4); }
      } else if (e.state === 'shell') kickShell(g, e);
      else {
        const foot = e.y + e.h;
        e.state = 'shell'; e.h = 30; e.y = foot - e.h; e.vx = 0; e.chain = 0;
        g.score += 100;
      }
    } else if (e.type === 'turtle' && e.state === 'shell') kickShell(g, e);
    else if (e.kickGrace <= 0) hurt(g);
  }
  for (const shell of g.enemies) if (shell.alive && shell.type === 'turtle' && shell.state === 'sliding') {
    for (const target of g.enemies) if (target !== shell && target.alive && !target.retracted && overlaps(shell, target))
      killEnemy(g, target, 'shell', shell.chain++);
  }
}
function updateItems(g,dt) {
  for(const coin of g.coins) if(!coin.collected && overlaps(g.player,{x:coin.x-12,y:coin.y-12,w:24,h:24})) {
    coin.collected=true;awardCoin(g,coin.x,coin.y);
  }
  for(const item of g.items) {
    if(!item.active)continue;
    if(item.emerging>0){item.emerging=Math.max(0,item.emerging-dt);continue;}
    const vx=item.vx;
    item.vy=Math.min(PHYSICS.terminal,item.vy+PHYSICS.gravity*dt);
    const result=moveBody(g,item,dt);
    if(result.hitX)item.vx=-vx;
    if(item.type==='star'&&item.grounded)item.vy=-390;
    if(item.y>g.tiles.length*TILE+80)item.active=false;
    if(overlaps(g.player,item))collect(g,item);
  }
}

function updateProjectiles(g, dt) {
  for (const shot of g.projectiles) {
    shot.age += dt; shot.vy += PHYSICS.gravity * dt;
    const result = moveBody(g, shot, dt);
    if (result.hitX || shot.age > 3) { shot.active = false; continue; }
    if (shot.grounded) { shot.vy = -310; shot.bounces++; }
    if (shot.bounces > 5 || shot.y > g.tiles.length * TILE) shot.active = false;
    for (const e of g.enemies) if (e.alive && ['walker', 'turtle', 'plant', 'flyer', 'boss'].includes(e.type) && !e.retracted && overlaps(shot, e)) {
      if(e.type==='boss') { if(!e.hurt){e.hp--;e.hurt=.25;if(e.hp<=0)killEnemy(g,e,'fire',4);} } else killEnemy(g, e, 'fire');
      shot.active = false; break;
    }
  }
  g.projectiles = g.projectiles.filter(s => s.active);
}
function goals(g) {
  const p = g.player, level = currentLevel(g);
  const checkpoint = level.checkpoint;
  if (checkpoint && !g.checkpointReached && p.x + p.w >= checkpoint.x) {
    g.checkpointReached = true; g.checkpoint = { x: checkpoint.x, y: checkpoint.y };
    event(g, 'checkpoint', checkpoint.x, checkpoint.y); effect(g, 'text', p.x, p.y - 20, { text: 'CHECKPOINT', life: 1 });
  }
  const goal = level.goal;
  g.goalLocked=!!goal.requiresBoss&&g.enemies.some(e=>e.type==='boss'&&e.alive);
  if (!g.goalLocked && goal && p.x + p.w >= goal.x && p.y < goal.y + 8 && p.y + p.h > goal.y - 330) {
    if (p.crouching && p.power !== 'small') changePower(g, p.power);
    p.hurt = 0;
    g.mode = 'finishing'; g.modeTime = 0;
    g.finishTime = 0; g.finishPhase = 'flag'; g.goalProgress = 0;
    g.finishStart = { x:p.x, y:p.y };
    g.finishBonus = Math.ceil(g.time) * 10;
    p.vx = 0; p.vy = 0; p.dir = 1; p.pose = 'climb'; p.onGround = false;
  }
}
function finish(g, dt) {
  const p = g.player, goal = currentLevel(g).goal;
  g.finishTime = Math.min(FINISH_SECONDS, g.finishTime + dt);
  g.goalProgress = clamp(g.finishTime / FLAG_SECONDS, 0, 1);
  p.anim += dt;
  p.vy = 0;
  if (g.finishTime < FLAG_SECONDS) {
    g.finishPhase = 'flag';
    const ease = 1 - (1 - g.goalProgress) ** 2;
    p.y = g.finishStart.y + (goal.y - p.h - g.finishStart.y) * ease;
    p.pose = 'climb';
  } else {
    g.finishPhase = 'walk';
    const progress = (g.finishTime - FLAG_SECONDS) / (FINISH_SECONDS - FLAG_SECONDS);
    const exitX = Math.min(currentLevel(g).width * TILE - p.w, goal.x + 180 - p.w / 2);
    p.x = g.finishStart.x + (exitX - g.finishStart.x) * progress;
    p.y = goal.y - p.h;
    p.vx = (exitX - g.finishStart.x) / (FINISH_SECONDS - FLAG_SECONDS);
    p.onGround = true;
    p.pose = 'run';
  }
  g.cameraX = clamp(p.x + p.w / 2 - W * .37, 0, Math.max(0, g.tiles[0].length * TILE - W));
  if (g.finishTime >= FINISH_SECONDS) {
    g.mode = 'clear'; g.modeTime = 0; g.clearTime = 0;
    p.vx = 0; p.pose = 'victory';
    g.score += 1000 + g.finishBonus;
    event(g, 'clear', goal.x, goal.y, { bonus:g.finishBonus });
  }
}
function tick(g, input, dt) {
  g.elapsed += dt; g.modeTime += dt;
  for (const f of g.particles) { f.age += dt; f.life -= dt; f.x += (f.vx || 0) * dt; f.y += (f.vy || 0) * dt; if (f.vy) f.vy += 580 * dt; }
  g.particles = g.particles.filter(f => f.life > 0);
  if (g.mode === 'dying') {
    g.player.vy += PHYSICS.gravity * dt; g.player.y += g.player.vy * dt;
    if (g.modeTime >= 1.3) { if (g.lives > 0) Object.assign(g,restart(g)); else { g.mode = 'gameover'; g.modeTime = 0; } }
    return;
  }
  if (g.mode === 'finishing') { finish(g, dt); return; }
  if (g.mode !== 'playing') { if(g.mode==='clear')g.clearTime+=dt;return; }
  g.time = Math.max(0, g.time - dt);
  if (!g.time) { die(g, 'time'); return; }
  const p = g.player;
  p.anim += dt;
  p.grounded=p.onGround;
  p.invincible = Math.max(0, p.invincible - dt);
  p.hurt = Math.max(0, p.hurt - dt);
  p.fireCooldown = Math.max(0, p.fireCooldown - dt);
  const jumpPressed = !!input.jump && !g.previous.jump;
  const firePressed = !!input.fire && !g.previous.fire;
  const jumpReleased = !input.jump && g.previous.jump;
  g.previous = { jump: !!input.jump, fire: !!input.fire };
  p.coyote = p.onGround ? PHYSICS.coyote : Math.max(0, p.coyote - dt);
  p.jumpBuffer = jumpPressed ? PHYSICS.buffer : Math.max(0, p.jumpBuffer - dt);
  if (jumpReleased && p.vy < -215) p.vy = -215;
  if (p.jumpBuffer > 0 && p.coyote > 0) {
    p.vy = -PHYSICS.jump; p.onGround = false; p.coyote = 0; p.jumpBuffer = 0; p.jumpHold = PHYSICS.jumpHold;
    event(g, 'jump');
  }
  p.jumpHold = Math.max(0, p.jumpHold - dt);
  if (input.down && p.onGround && p.power !== 'small' && !p.crouching) {
    p.y += p.h - 40; p.h=40; p.crouching=true;
  }
  const direction = input.down && p.onGround ? 0 : (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const maxSpeed = input.run ? PHYSICS.run : PHYSICS.walk;
  const braking = direction && Math.sign(p.vx) !== direction && Math.abs(p.vx) > 30;
  if (direction) {
    p.dir = direction;
    p.vx = approach(p.vx, maxSpeed * direction, (p.onGround ? braking ? PHYSICS.brake : PHYSICS.acceleration : PHYSICS.airAcceleration) * dt);
  } else if (p.onGround) p.vx = approach(p.vx, 0, PHYSICS.friction * dt);
  const gravity = p.vy < 0 ? input.jump && p.jumpHold > 0 ? PHYSICS.holdGravity : PHYSICS.gravity : PHYSICS.fallGravity;
  p.vy = Math.min(PHYSICS.terminal, p.vy + gravity * dt);
  const result = moveBody(g, p, dt, true);
  p.onGround=p.grounded;
  p.x = clamp(p.x, 0, g.tiles[0].length * TILE - p.w);
  if (p.onGround) { p.stompChain = 0; p.jumpHold = 0; }
  if (p.crouching && p.power !== 'small' && !input.down) {
    const tall = { ...p, y: p.y - (72 - p.h), h: 72 };
    if (!blocked(g, tall)) { p.y = tall.y; p.h = 72; p.crouching = false; }
  }
  p.pose = p.crouching ? 'crouch' : p.onGround ? braking ? 'skid' : Math.abs(p.vx) > 5 ? 'run' : 'idle' : p.vy < 0 ? 'jump' : 'fall';
  if (firePressed && p.power === 'fire' && p.fireCooldown === 0 && g.projectiles.length < 2) {
    p.fireCooldown = .22;
    g.projectiles.push({ x: p.x + (p.dir > 0 ? p.w : -10), y: p.y + p.h * .5,
      w: 10, h: 10, vx: p.dir * 420, vy: -70, age: 0, active: true, type:'fire', bounces: 0 });
    event(g, 'fire');
  }
  updateItems(g,dt);
  updateEnemies(g, dt, result.oldY, !!input.jump);
  updateProjectiles(g, dt);
  const left = Math.floor((p.x + 2) / TILE), right = Math.floor((p.x + p.w - 2) / TILE);
  for (let ty = Math.floor((p.y + 2) / TILE); ty <= Math.floor((p.y + p.h - 2) / TILE); ty++)
    for (let tx = left; tx <= right; tx++) if (tileAt(g, tx, ty) === '^') die(g,'spikes');
  if (p.y > g.tiles.length * TILE + 80) die(g, 'fall');
  if (g.mode === 'playing') goals(g);
  g.enemies = g.enemies.filter(e => e.alive);
  g.items=g.items.filter(e=>e.active);
  g.cameraX = clamp(p.x + p.w / 2 - W * .37 + p.vx * .12, 0, Math.max(0, g.tiles[0].length * TILE - W));

}
export function update(g, input = {}, dt = STEP) {
  if (g.paused || !Number.isFinite(dt) || dt <= 0) return;
  g.accumulator += Math.min(dt, .15);
  let count = 0;
  while (g.accumulator + 1e-10 >= STEP && count++ < 9) {
    g.accumulator -= STEP;
    tick(g, input, STEP);
  }
}

// A legal-input attract player, shared by home previews and traversal tests.
export function previewInput(g, dt = STEP) {
  const p = g.player;
  if (g.mode !== 'playing') return {};
  const boss=g.enemies.find(e=>e.type==='boss'&&e.alive);
  if(g.level.goal.requiresBoss&&boss&&p.x>boss.x-330) {
    // Predict where the moving boss will be when our feet descend to its head.
    const discriminant=Math.max(0,p.vy*p.vy+2*PHYSICS.fallGravity*(boss.y-(p.y+p.h)));
    const contactTime=clamp((-p.vy+Math.sqrt(discriminant))/PHYSICS.fallGravity,.1,.65);
    const dx=boss.x+boss.w/2+boss.vx*contactTime-(p.x+p.w/2);
    const desired=clamp(dx*4,-PHYSICS.walk,PHYSICS.walk);
    return {left:p.vx>desired+7,right:p.vx<desired-7,
      jump:p.onGround?!g.previous.jump:g.previous.jump&&p.vy<0,
      fire:Math.floor(g.elapsed*5)%2===0};
  }
  const foot = p.y + p.h, reach = p.x + p.w + Math.max(32, Math.abs(p.vx) * .2);
  const footRow = Math.floor((foot + 2) / TILE), frontCol = Math.floor(reach / TILE);
  let obstruction=false;
  for(let tx=Math.floor((p.x+p.w+1)/TILE);tx<=Math.floor((p.x+p.w+150)/TILE);tx++) {
    for(let ty=Math.floor((foot-176)/TILE);ty<=Math.floor((foot-3)/TILE);ty++) {
      if(!SOLID.has(tileAt(g,tx,ty))&&tileAt(g,tx,ty)!=='^')continue;
      const height=foot-ty*TILE, distance=tx*TILE-(p.x+p.w);
      const launch=height>110?128:height>55?92:65;
      if(distance>=-2&&distance<=launch)obstruction=true;
    }
  }
  let groundAhead = false;
  for (let row = footRow; row < g.tiles.length; row++) if (SOLID.has(tileAt(g, frontCol, row)) || tileAt(g, frontCol, row) === '=') groundAhead = true;
  const threat = g.enemies.some(e => e.alive && !e.retracted && e.x > p.x - 15 && e.x - (p.x + p.w) < Math.max(110, p.vx * .35) && Math.abs(e.y + e.h - foot) < 110);
  const jump = p.onGround ? !g.previous.jump && (obstruction || !groundAhead || threat) : g.previous.jump && p.vy<0;

  const dangerBelow = !p.onGround && p.vy>0 && g.enemies.some(e=> {
    if(!e.alive||e.retracted||e.x<=p.x+p.w||e.x-(p.x+p.w)>=175||foot>=e.y+e.h||e.y-foot>=210)return false;
    const fallTime=(-p.vy+Math.sqrt(p.vy*p.vy+2*PHYSICS.fallGravity*Math.max(0,e.y-foot)))/PHYSICS.fallGravity;
    const px=p.x+p.vx*fallTime, ex=e.x+e.vx*fallTime;
    const stomp=e.type!=='plant'&&foot<e.y&&px+p.w>ex+3&&px<ex+e.w-3;
    return !stomp;
  });
  const safeBelow = Array.from({length:Math.max(0,g.tiles.length-footRow)},(_,i)=>tileAt(g,Math.floor((p.x+p.w/2)/TILE),footRow+i)).some(c=>SOLID.has(c)||c==='=');
  const brake=dangerBelow&&safeBelow;
  return { right: !brake, left: brake&&p.vx>25, run: true, jump, fire: Math.floor(g.elapsed * 5) % 2 === 0 };
}
