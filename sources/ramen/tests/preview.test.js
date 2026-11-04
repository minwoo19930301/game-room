import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/engine.js';
import { createCookingPreview } from '../src/preview.js';

test('cooking preview follows real orders, heat and serving across all burners', () => {
  const game = createGame(), preview = createCookingPreview(game);
  const tools = new Set(), burners = new Set(), events = new Set();
  let previousEvent, activePots = 0, servings = 0;
  for (let frame = 0; frame < 60 * 30; frame++) {
    preview.step(1 / 30);
    activePots = Math.max(activePots, game.pots.filter(p => p.water).length);
    const event = game.events.at(-1);
    if (event === previousEvent) continue;
    previousEvent = event;
    events.add(event.type);
    if (event.type === 'ingredient') {
      tools.add(event.tool); burners.add(event.pot);
      const pot = game.pots[event.pot];
      if (event.tool !== 'water') assert.equal(pot.water, true, 'water must be added first');
      if (event.tool === 'egg' || event.tool === 'green') assert(pot.age >= 5, 'toppings require boiling water');
    }
    if (event.type === 'serve') { servings++; assert.equal(event.grade, '완벽해요!'); }
  }
  assert.equal(game.practice, true);
  assert.equal(game.phase, 'play');
  assert.equal(game.time, 150, 'practice keeps the normal day clock frozen');
  assert.deepEqual([...tools].sort(), ['egg', 'green', 'noodle', 'spice', 'water']);
  assert.deepEqual([...burners].sort(), [0, 1, 2, 3]);
  assert(activePots >= 2);
  assert(servings >= 10);
  assert.equal(game.served, servings);
  assert(!events.has('error') && !events.has('burn'));
  assert.equal(game.spares, 3);
});

test('preview is opt-in and ignores invalid simulation time', () => {
  const normal = createGame(), demo = createGame();
  const preview = createCookingPreview(demo);
  for (const dt of [0, -1, NaN, Infinity]) preview.step(dt);
  assert.equal(demo.clock, 0);
  assert(demo.pots.every(p => !p.water));
  assert.equal(normal.phase, 'title');
  assert.equal(normal.practice, false);
});
