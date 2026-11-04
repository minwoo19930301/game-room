import test from 'node:test';
import assert from 'node:assert/strict';
import { TILE, LEVELS, getLevel } from '../src/levels.mjs';

const SOLID = new Set('#B?MFSLXP');
const STANDABLE = new Set([...SOLID, '=']);
const ENEMY_SIZE = { walker: [36, 32], turtle: [38, 40], plant: [30, 44], flyer: [36, 30], boss: [72, 80] };
const cell = (level, x, y) => level.tiles[y]?.[x] ?? '.';
const overlap = (a, b) => a.x < b.x + b.w - .01 && a.x + a.w > b.x + .01 && a.y < b.y + b.h - .01 && a.y + a.h > b.y + .01;
function solidOverlap(level, box) {
  for (let row = Math.floor(box.y / TILE); row <= Math.floor((box.y + box.h - .01) / TILE); row++) {
    for (let col = Math.floor(box.x / TILE); col <= Math.floor((box.x + box.w - .01) / TILE); col++) {
      if ((SOLID.has(cell(level, col, row)) || cell(level, col, row) === '^') && overlap(box, { x: col * TILE, y: row * TILE, w: TILE, h: TILE })) return true;
    }
  }
  return false;
}
function surfaces(level, bodyHeight = 72) {
  const nodes = [];
  for (let row = 0; row < level.height; row++) for (let col = 0; col < level.width; col++) {
    if (!STANDABLE.has(cell(level, col, row))) continue;
    const x = (col + .5) * TILE, y = row * TILE;
    if (!solidOverlap(level, { x: x - 16, y: y - bodyHeight, w: 32, h: bodyHeight })) nodes.push({ x, y, col, row });
  }
  return nodes;
}

// Independently trace the engine's documented full held jump. The test models
// walls, head clearance, one-way landings and the grown 32×72 body, not merely
// the horizontal gap width. No flutter or second jump is assumed.
const JUMP_DT = 1 / 240;
function jumpTrajectory() {
  const path = [{ t: 0, y: 0, vy: -740 }];
  let y = 0, vy = -740;
  for (let t = JUMP_DT; t < 1.4; t += JUMP_DT) {
    vy += (vy < 0 ? (t <= .18 ? 1200 : 2100) : 2400) * JUMP_DT;
    y += vy * JUMP_DT;
    path.push({ t, y, vy });
  }
  return path;
}
const TRAJECTORY = jumpTrajectory();
function canJump(level, from, to) {
  const dy = to.y - from.y;
  const landing = TRAJECTORY.find((p, i) => i > 0 && p.vy > 0 && p.y >= dy && TRAJECTORY[i - 1].y < dy);
  if (!landing) return false;
  const vx = (to.x - from.x) / landing.t;
  if (Math.abs(vx) > 340) return false;
  let previousFeet = from.y;
  for (const point of TRAJECTORY) {
    if (!point.t) continue;
    const feet = Math.min(point.t, landing.t) === landing.t ? to.y : from.y + point.y;
    const x = from.x + vx * Math.min(point.t, landing.t);
    if (solidOverlap(level, { x: x - 16, y: feet - 72, w: 32, h: 72 })) return false;
    // A different platform would catch this jump before the intended landing.
    if (point.vy > 0) {
      const row = Math.floor(feet / TILE);
      for (let r = Math.floor(previousFeet / TILE); r <= row; r++) for (let col = Math.floor((x - 15.9) / TILE); col <= Math.floor((x + 15.9) / TILE); col++) {
        if (STANDABLE.has(cell(level, col, r)) && previousFeet <= r * TILE && feet >= r * TILE && r * TILE !== to.y) return false;
      }
    }
    if (point.t >= landing.t) return true;
    previousFeet = feet;
  }
  return false;
}
function reachableSurfaces(level) {
  const nodes = surfaces(level);
  const start = nodes.findIndex(n => n.col === Math.floor((level.spawn.x + 16) / TILE) && n.y === level.spawn.y + 40);
  assert(start >= 0, 'spawn must stand on a valid grown-player surface');
  const found = new Set([start]), queue = [start];
  while (queue.length) {
    const from = nodes[queue.shift()];
    for (let i = 0; i < nodes.length; i++) {
      if (found.has(i)) continue;
      const to = nodes[i];
      if (Math.abs(to.x - from.x) > 400 || from.y - to.y > 180) continue;
      const walking = from.y === to.y && Math.abs(from.col - to.col) === 1
        && !solidOverlap(level, { x: (from.x + to.x) / 2 - 16, y: from.y - 72, w: 32, h: 72 });
      if (walking || canJump(level, from, to)) { found.add(i); queue.push(i); }
    }
  }
  return { nodes, found };
}

for (const level of LEVELS) {
  test(`${level.id}: schema, geometry and safe starts`, () => {
    assert.equal(TILE, 48);
    assert(level.width >= 120 && level.width <= 180);
    assert.equal(level.height, 12);
    assert.equal(level.tiles.length, level.height);
    assert(level.tiles.every(row => row.length === level.width && /^[.#B?MFSLXP=^]+$/.test(row)));
    assert(level.checkpoint);
    for (const pos of [level.spawn, level.checkpoint]) {
      assert(!solidOverlap(level, { ...pos, w: 32, h: 40 }));
      assert(STANDABLE.has(cell(level, Math.floor((pos.x + 16) / TILE), Math.floor((pos.y + 40) / TILE))));
      assert(!level.enemies.some(e => Math.abs(e.x - pos.x) < TILE * 3), 'respawn needs an enemy-free landing bank');
    }
    assert(STANDABLE.has(cell(level, Math.floor(level.goal.x / TILE), Math.floor(level.goal.y / TILE))));
    assert(level.pipes.every(p => p.w === TILE * 2 && p.h <= TILE * 3));
  });

  test(`${level.id}: pits, visible hazards and enemy placement are fair`, () => {
    let run = 0;
    for (let col = 0; col < level.width; col++) {
      if (STANDABLE.has(cell(level, col, 9))) run = 0;
      else { run++; assert(run <= 4, `gap exceeds four tiles near ${col}`); }
      if (col < 30) assert(STANDABLE.has(cell(level, col, 9)), 'first 30 tiles have continuous footing');
    }
    for (let i = 0; i < level.enemies.length; i++) {
      const enemy = level.enemies[i], [w, h] = ENEMY_SIZE[enemy.type] ?? [];
      assert(w && h, `unknown enemy ${enemy.type}`);
      assert(!solidOverlap(level, { ...enemy, w, h }), `enemy ${i} overlaps terrain`);
      assert(enemy.x >= 0 && enemy.x + w < level.width * TILE);
      if (enemy.type !== 'flyer') assert(STANDABLE.has(cell(level, Math.floor((enemy.x + w / 2) / TILE), Math.floor((enemy.y + h) / TILE))));
      if (enemy.type === 'plant') assert(enemy.pipeTop >= 7 * TILE, 'plant plus pipe fits under one full jump');
      for (const other of level.enemies.slice(i + 1)) {
        const [ow, oh] = ENEMY_SIZE[other.type];
        assert(!overlap({ ...enemy, w, h }, { ...other, w: ow, h: oh }), 'enemies must not spawn overlapping');
      }
    }
    for (const coin of level.coins) assert(!solidOverlap(level, { x: coin.x - 10, y: coin.y - 10, w: 20, h: 20 }), 'coin embedded in a solid tile');
  });

  test(`${level.id}: every standable platform and the flag are reachable with a single held jump`, () => {
    const { nodes, found } = reachableSurfaces(level);
    const missing = nodes.filter((_, i) => !found.has(i));
    assert.deepEqual(missing.map(n => `${n.col},${n.row}`), [], 'unreachable platform top');
    assert(nodes.some((n, i) => found.has(i) && n.col === Math.floor(level.goal.x / TILE) && n.y === level.goal.y));
  });
}

test('each course has early power, optional rewards, a checkpoint and a clear identity', () => {
  assert.deepEqual(LEVELS.map(l => l.theme), ['grass', 'cavern', 'castle']);
  assert.equal(new Set(LEVELS.map(l => l.id)).size, 3);
  for (const level of LEVELS) {
    assert(level.tiles.some(row => row.slice(0, 12).includes('M')));
    assert(level.tiles.some(row => row.includes('F')));
    assert(level.tiles.some(row => row.includes('=')));
    assert(level.coins.length >= 35);
    assert(level.checkpoint.x > 30 * TILE && level.checkpoint.x < (level.width - 30) * TILE);
    assert(level.enemies.filter(e => e.type === 'boss').length <= 1);
  }
  assert.equal(LEVELS[2].enemies.filter(e => e.type === 'boss').length, 1);
});

test('the final guardian is required and its whole patrol has clear stomp and fire space', () => {
  assert.equal(LEVELS[2].goal.requiresBoss, true);
  assert(LEVELS.slice(0, 2).every(level => !level.goal.requiresBoss));
  const level = LEVELS[2], boss = level.enemies.find(e => e.type === 'boss');
  const patrol = boss.range ?? 120;
  const from = Math.floor((boss.x - patrol - 32) / TILE);
  const through = Math.floor((boss.x + 72 + patrol + 32) / TILE);
  for (let col = from; col <= through; col++) {
    assert.equal(cell(level, col, 9), '#', 'flat footing throughout the fight');
    for (let row = 0; row < 9; row++) assert.equal(cell(level, col, row), '.', 'no overhead block, pipe, pit or spike in the combat envelope');
  }
  assert(level.goal.x > (through + 1) * TILE, 'exit lies beyond the encounter');
  assert(level.tiles.some(row => row.slice(90, from).includes('F')), 'fire can be earned before the arena');
});

test('getLevel returns an independent mutable copy and exported templates stay frozen', () => {
  const a = getLevel(0), b = getLevel(0);
  a.spawn.x = -1; a.enemies[0].x = -2; a.coins.length = 0; a.tiles[0] = '#'.repeat(a.width);
  assert.notEqual(b.spawn.x, -1); assert.notEqual(b.enemies[0].x, -2); assert(b.coins.length > 0);
  assert.equal(LEVELS[0].tiles[0], '.'.repeat(a.width));
  assert(Object.isFrozen(LEVELS) && Object.isFrozen(LEVELS[0].enemies[0]));
  for (const index of [-1, 3, NaN, .5]) assert.throws(() => getLevel(index), RangeError);
});
