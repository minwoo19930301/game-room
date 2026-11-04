import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step } from '../src/engine.js';
import { InputBuffer } from '../src/input.js';
import { createMatchPreview } from '../src/preview.js';

test('preview uses the real input queue for running, jumping, tackling and shooting', () => {
  class RecordingInput extends InputBuffer {
    actions = new Set();
    press(action) { this.actions.add(action); super.press(action); }
  }
  const input = new RecordingInput(), preview = createMatchPreview(input);
  const initial = preview.game;
  let jumps = 0, maxX = initial.player.x;
  for (let frame = 0; frame < 10 * 60; frame++) {
    preview.step();
    maxX = Math.max(maxX, preview.game.player.x);
    jumps += preview.game.events.filter(e => e.type === 'jump').length;
  }
  assert.equal(preview.game, initial);
  assert.equal(initial.practice, false);
  assert(maxX > 1000);
  assert(jumps > 0);
  assert(initial.stats.tackles > 0);
  assert(initial.stats.kicks + initial.stats.headers > 0);
  assert(initial.stats.kos > 0, 'normal collisions must defeat opponents');
  for (const action of ['right', 'jump', 'tackle', 'kick']) assert(input.actions.has(action));
});

test('preview repeats after a normal match and clears stale input between rounds', () => {
  const input = new InputBuffer(), preview = createMatchPreview(input);
  let previous = preview.game, lastReset = 0, loops = 0;
  for (let frame = 0; frame < 45 * 60; frame++) {
    preview.step();
    if (preview.game !== previous) {
      const elapsed = (frame - lastReset) / 60;
      assert(elapsed >= 12 && elapsed <= 20, `loop duration ${elapsed}`);
      assert.equal(preview.game.score, 0);
      assert.equal(preview.game.mode, 'playing');
      assert.equal(preview.game.player.hp, 100);
      assert.equal(input.held.has('special'), false);
      lastReset = frame; previous = preview.game; loops++;
    }
  }
  assert(loops >= 3);
});

test('preview import leaves ordinary games and invalid time untouched', () => {
  const normal = createGame(), preview = createMatchPreview();
  for (const dt of [0, -1, NaN, Infinity]) preview.step(dt);
  assert.equal(preview.game.totalTime, 0);
  assert.equal(normal.mode, 'brief');
  assert.equal(normal.player.x, 150);
});

test('a loss produced by ordinary engine damage restarts the preview', () => {
  const preview = createMatchPreview(), defeated = preview.game;
  for (let frame = 0; frame < 160 * 60 && defeated.mode === 'playing'; frame++) step(defeated, {}, 1 / 60);
  assert.equal(defeated.mode, 'lost');
  preview.step();
  assert.notEqual(preview.game, defeated);
  assert.equal(preview.game.mode, 'playing');
  assert.equal(preview.game.player.hp, 100);
  assert.equal(preview.rounds, 2);
});
