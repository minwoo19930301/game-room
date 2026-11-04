import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, PILOTS, STEP } from '../src/engine.mjs';
import { createPreviewController } from '../src/preview.mjs';

test('preview plays real combat and loops all three leads without changing balance', () => {
  const game = createGame();
  const stats = PILOTS.map(({speed,power}) => ({speed,power}));
  const controller = createPreviewController(game);
  const pilots = new Set(), specials = new Set();
  let highestScore=0;
  for (let i=0;i<60*74;i++) {
    controller.tick(STEP);
    pilots.add(game.pilot);
    if(game.player.attack) specials.add(game.player.attack.kind);
    highestScore=Math.max(highestScore,game.score);
    assert.ok(Number.isFinite(game.player.x));
  }
  assert.deepEqual([...pilots].sort(), [0,1,2]);
  for(const kind of ['launcher','dash','smash']) assert.ok(specials.has(kind),kind);
  assert.ok(highestScore>1000,'preview actually defeats enemies');
  assert.ok(controller.cycles>=3,'preview does not stick on an ending');
  assert.deepEqual(PILOTS.map(({speed,power})=>({speed,power})),stats);
});

test('preview restarts after defeat and advances a cleared stage', () => {
  const game=createGame(), controller=createPreviewController(game);
  game.mode='defeat'; controller.tick(STEP);
  assert.equal(game.mode,'combat');assert.equal(game.pilot,1);
  game.mode='stageclear';controller.tick(STEP);
  assert.equal(game.stage,1);assert.equal(game.mode,'combat');
});
