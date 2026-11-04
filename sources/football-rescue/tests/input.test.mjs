import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, startGame, step, togglePause } from '../src/engine.js';
import { InputBuffer } from '../src/input.js';

function naturalHitstop() {
  const game = createGame();
  startGame(game);
  for (let frame = 0; frame < 600; frame++) {
    step(game, { right: true, kick: frame % 30 === 0 });
    if (game.freeze > 0 && game.player.y === 0 && game.player.action !== 'hurt') {
      return game;
    }
  }
  assert.fail('ordinary run/shot inputs should create a grounded hitstop');
}

test('released jump edge survives real impact freeze and fires exactly once', () => {
  const game = naturalHitstop(), input = new InputBuffer();
  input.press('jump');
  input.release('jump');
  while (game.freeze > 0) {
    assert.equal(input.step(game), false);
    assert.equal(input.edges.has('jump'), true);
    assert.equal(game.player.y, 0);
  }
  assert.equal(input.step(game), true);
  assert.ok(game.player.y > 0);
  assert.equal(game.events.filter(e => e.type === 'jump').length, 1);
  assert.equal(input.edges.size, 0);
  for (let frame = 0; frame < 15; frame++) {
    input.step(game);
    assert.equal(game.events.some(e => e.type === 'jump'), false);
  }
});

test('all action edges wait for a consumed simulation tick rather than render time', () => {
  const game = naturalHitstop(), input = new InputBuffer();
  for (const action of ['jump', 'tackle', 'kick', 'special']) {
    input.press(action);
    input.release(action);
  }
  while (game.freeze > 0) {
    input.step(game);
    assert.equal(input.edges.size, 4);
  }
  input.step(game);
  assert.equal(input.edges.size, 0);
});

test('production clear used by blur, pause and restart removes queued and held input', () => {
  const game = naturalHitstop(), input = new InputBuffer();
  input.press('jump');
  input.release('jump');
  input.press('right');
  input.clear();
  assert.equal(input.held.size, 0);
  assert.equal(input.edges.size, 0);
  for (let frame = 0; frame < 12; frame++) input.step(game);
  assert.equal(game.player.y, 0);
  assert.equal(game.player.vx, 0);
});

test('paused or zero-delta ticks do not consume input; lifecycle clear still does', () => {
  const game = createGame(), input = new InputBuffer();
  startGame(game);
  input.press('jump');
  input.release('jump');
  assert.equal(input.step(game, 0), false);
  assert.equal(input.edges.has('jump'), true);
  togglePause(game);
  assert.equal(input.step(game), false);
  assert.equal(input.edges.has('jump'), true);
  input.clear();
  togglePause(game);
  input.step(game);
  assert.equal(game.player.y, 0);
});

test('held button repeat cannot enqueue another consumed edge', () => {
  const game = createGame(), input = new InputBuffer();
  startGame(game);
  input.press('jump');
  input.step(game);
  input.press('jump');
  assert.equal(input.edges.size, 0);
  input.release('jump');
  input.press('jump');
  assert.equal(input.edges.has('jump'), true);
});
