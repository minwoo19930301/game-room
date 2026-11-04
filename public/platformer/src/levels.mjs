/** Original, hand-authored courses. Coordinates outside tiles are world pixels.
 * LEVELS is recursively frozen; getLevel() returns an independent mutable copy.
 */
export const TILE = 48;
const HEIGHT = 12;
const FLOOR = 9;

function course(id, name, theme, width) {
  const grid = Array.from({ length: HEIGHT }, (_, row) => Array(width).fill(row >= FLOOR ? '#' : '.'));
  const data = {
    id, name, theme, width, height: HEIGHT,
    tiles: [], spawn: { x: TILE * 2 + 8, y: TILE * FLOOR - 40 },
    goal: { x: TILE * (width - 8), y: TILE * FLOOR },
    checkpoint: null, enemies: [], coins: [], platforms: [], pipes: [],
  };
  const occupiedCoins = new Set();
  return {
    gap(from, through, dangerous = false) {
      for (let row = FLOOR; row < HEIGHT; row++) for (let col = from; col <= through; col++) grid[row][col] = '.';
      if (dangerous) for (let col = from; col <= through; col++) grid[HEIGHT - 1][col] = '^';
    },
    blocks(row, col, text) {
      [...text].forEach((tile, i) => { grid[row][col + i] = tile; });
    },
    ledge(row, from, through) {
      for (let col = from; col <= through; col++) grid[row][col] = '=';
    },
    stair(col, height) {
      for (let row = FLOOR - height; row < FLOOR; row++) grid[row][col] = '#';
    },
    pipe(col, height = 2, plant = false) {
      for (let row = FLOOR - height; row < FLOOR; row++) for (let x = col; x < col + 2; x++) grid[row][x] = 'P';
      const pipe = { x: col * TILE, y: (FLOOR - height) * TILE, w: TILE * 2, h: height * TILE };
      data.pipes.push(pipe);
      if (plant) data.enemies.push({ type: 'plant', x: pipe.x + TILE - 15, y: pipe.y - 44, dir: -1, pipeTop: pipe.y });
    },
    enemy(type, col, dir = -1, row = FLOOR) {
      const heights = { walker: 32, turtle: 40, flyer: 30, boss: 80 };
      const widths = { walker: 36, turtle: 38, flyer: 36, boss: 72 };
      data.enemies.push({ type, x: (col + .5) * TILE - widths[type] / 2, y: row * TILE - heights[type], dir });
    },
    coins(from, through, row = 8) {
      for (let col = from; col <= through; col++) {
        const key = `${col}:${row}`;
        if (occupiedCoins.has(key)) continue;
        occupiedCoins.add(key);
        data.coins.push({ x: (col + .5) * TILE, y: (row + .5) * TILE });
      }
    },
    checkpoint(col) { data.checkpoint = { x: col * TILE + 8, y: FLOOR * TILE - 40 }; },
    finish(goal = {}) { Object.assign(data.goal, goal); data.tiles = grid.map(row => row.join('')); return data; },
  };
}

function grassCourse() {
  const c = course('meadow', '1 · 바람 부는 초원', 'grass', 144);
  // 0–29: safe runway, head-bump reward, a lone walker, then the first pipe.
  c.blocks(6, 7, 'BMB?B'); c.coins(7, 11, 5);
  c.enemy('walker', 14); c.pipe(19, 2);
  c.blocks(6, 25, '?BB'); c.coins(23, 24); c.coins(25, 27, 5);
  c.enemy('walker', 29);

  // 30–65: visible short gaps alternate with safe landing areas and rewards.
  c.gap(34, 35); c.coins(33, 36, 6);
  c.pipe(41, 2);
  c.blocks(6, 46, 'B?BFB'); c.coins(46, 50, 5);
  c.enemy('turtle', 51);
  c.gap(57, 59); c.coins(56, 60, 6);
  c.stair(64, 1); c.stair(65, 2); c.stair(66, 3);
  c.ledge(6, 67, 70); c.coins(66, 70, 5);
  c.checkpoint(73);

  // 76–95: the longest gap has an optional upper bridge and step-up approach.
  c.stair(77, 1); c.stair(78, 2); c.stair(79, 3);
  c.ledge(6, 81, 87); c.blocks(3, 81, 'B?BL'); c.coins(81, 84, 2);
  c.gap(82, 85); c.coins(89, 92);
  c.enemy('walker', 94);

  // 96–143: combine a pipe, a three-tile jump and a final descending route.
  c.pipe(99, 3); c.coins(99, 100, 5);
  c.gap(110, 112); c.coins(109, 113, 6);
  c.blocks(6, 116, 'B?B');
  c.stair(121, 1); c.stair(122, 2); c.stair(123, 3);
  c.ledge(6, 124, 126); c.coins(123, 126, 5);
  c.coins(130, 134);
  return c.finish();
}

function cavernCourse() {
  const c = course('cavern', '2 · 반짝이는 동굴', 'cavern', 156);
  // 0–30: reprise the jump, add shells, and teach the alternate upper route.
  c.blocks(6, 6, 'BM?B'); c.coins(6, 9, 5);
  c.enemy('walker', 13);
  c.stair(18, 1); c.stair(19, 2); c.stair(20, 3);
  c.ledge(6, 21, 25); c.blocks(3, 22, '?B?'); c.coins(22, 24, 2);
  c.enemy('turtle', 29);

  // 31–65: short chasms, then fire before the first pipe plant.
  c.gap(35, 36, true); c.coins(34, 37, 6);
  c.blocks(6, 40, 'BFB'); c.coins(40, 42, 5);
  c.pipe(47, 2, true);
  c.enemy('walker', 54);
  c.gap(59, 61, true); c.coins(58, 62, 6);
  c.checkpoint(67);

  // 68–100: two routes: a cautious raised bridge or a running gap below.
  c.stair(72, 1); c.stair(73, 2); c.stair(74, 3);
  c.ledge(6, 76, 84); c.blocks(3, 77, 'B?BSB'); c.coins(77, 81, 2);
  c.gap(78, 81, true); c.coins(86, 88);
  c.enemy('turtle', 91); c.pipe(97, 2);

  // 101–128: safe banks separate each jump; the high lane offers a life.
  c.gap(106, 108, true); c.coins(105, 109, 6);
  c.blocks(6, 113, 'B?B');
  c.stair(118, 1); c.stair(119, 2); c.stair(120, 3);
  c.ledge(6, 121, 126); c.blocks(3, 122, 'BLB'); c.coins(122, 124, 2);

  // 129–155: one last readable two-tile gap, then an unobstructed flag bank.
  c.gap(132, 133, true); c.coins(131, 134, 6);
  c.enemy('walker', 139); c.coins(143, 146);
  return c.finish();
}

function castleCourse() {
  const c = course('citadel', '3 · 노을빛 성채', 'castle', 168);
  // 0–31: both power-ups and generous footing before the first hazard.
  c.blocks(6, 6, 'BM?B'); c.coins(6, 9, 5);
  c.enemy('walker', 14); c.blocks(6, 20, 'BFB');
  c.pipe(26, 2); c.coins(26, 27, 6);

  // 32–64: lava and spikes are isolated, with recovery space after each.
  c.gap(35, 37, true); c.coins(34, 38, 6);
  c.blocks(8, 44, '^^'); c.coins(43, 46, 5);
  c.enemy('turtle', 51);
  c.pipe(57, 2, true);
  c.checkpoint(64);

  // 65–100: choose the upper bridge or the lower running line.
  c.stair(69, 1); c.stair(70, 2); c.stair(71, 3);
  c.ledge(6, 73, 81); c.blocks(3, 74, 'B?BSB'); c.coins(74, 78, 2);
  c.gap(75, 78, true); c.coins(84, 87);
  c.enemy('walker', 91); c.pipe(97, 2);

  // 101–132: refresh the fire power, then a final jump before the arena.
  c.blocks(6, 103, 'BFB'); c.coins(103, 105, 5);
  c.gap(111, 113, true); c.coins(110, 114, 6);
  c.blocks(8, 120, '^^'); c.coins(119, 122, 5);
  c.blocks(6, 127, 'BMB'); c.coins(127, 129, 5);

  // 133–167: a required three-hit guardian, a broad flat arena and two perches.
  // Its whole patrol plus a player-width margin has an unobstructed ceiling.
  c.stair(136, 1); c.stair(137, 2); c.stair(138, 3);
  c.ledge(6, 139, 143); c.coins(139, 143, 5);
  c.enemy('boss', 150);
  c.ledge(6, 156, 159); c.coins(156, 159, 5);
  c.coins(160, 161);
  return c.finish({ x: 162 * TILE, requiresBoss: true });
}

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
export const LEVELS = deepFreeze([grassCourse(), cavernCourse(), castleCourse()]);

/** Engine callers may mutate every field of the returned level safely. */
export function getLevel(index = 0) {
  if (!Number.isInteger(index) || index < 0 || index >= LEVELS.length) throw new RangeError(`Unknown level index: ${index}`);
  return JSON.parse(JSON.stringify(LEVELS[index]));
}
