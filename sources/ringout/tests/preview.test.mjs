import test from "node:test";
import assert from "node:assert/strict";
import { createPreview } from "../src/preview.js";
import { createMatch, step, cpuInput, FIXED_DT } from "../src/engine.js";
import { FIGHTERS, STAGES } from "../src/data.js";

test("preview starts after the real countdown without changing damage or stock rules", () => {
  const preview = createPreview({ seed: 713 });
  const normal = createMatch({ player: FIGHTERS[0].id, cpu: FIGHTERS[1].id,
    stage: STAGES[0].id, difficulty: "normal", seed: 713 });
  while (normal.phase === "countdown") step(normal, {}, FIXED_DT);
  normal.events.length = 0;
  assert.deepEqual(preview.match, normal);
  for (let i = 0; i < 1200; i++) {
    const input = normal.phase === "battle" && normal.hitstop <= 0
      ? cpuInput(normal, normal.fighters[0], normal.fighters[1], FIXED_DT) : {};
    step(normal, input, FIXED_DT);
    preview.tick();
    assert.deepEqual(preview.match, normal);
  }
});

test("both CPUs fight, ring-outs occur, and all stages and fighter pairs rotate", () => {
  const preview = createPreview();
  const stages = new Set(), leads = new Set(), opponents = new Set(), attacks = new Set(), pairings = new Set();
  let changes = 0, kos = 0;
  for (let i = 0; i < 12 * 36 / FIXED_DT; i++) {
    if (preview.tick()) changes++;
    const match = preview.match;
    stages.add(match.stage.id);leads.add(match.fighters[0].id);opponents.add(match.fighters[1].id);
    pairings.add(`${match.stage.id}:${match.fighters[0].id}`);
    assert.notEqual(match.fighters[0].id, match.fighters[1].id);
    for (const fighter of match.fighters) {
      for (const value of [fighter.x, fighter.y, fighter.vx, fighter.vy, fighter.percent, fighter.stocks]) assert.ok(Number.isFinite(value));
      assert.ok(fighter.stocks >= 0 && fighter.stocks <= 3);
    }
    for (const event of match.events) {
      if (event.type === "hit") attacks.add(event.source);
      if (event.type === "ko") kos++;
    }
  }
  assert.equal(pairings.size, STAGES.length * FIGHTERS.length);
  assert.equal(stages.size, STAGES.length);assert.equal(leads.size, FIGHTERS.length);assert.equal(opponents.size, FIGHTERS.length);
  assert.deepEqual([...attacks].sort(), [0, 1]);assert.ok(kos > 0);assert.ok(changes >= 12);
});

test("result and timer boundaries create clean new matches, including deterministic repeats", () => {
  const a = createPreview({ seed: 23, roundSeconds: 1 }), b = createPreview({ seed: 23, roundSeconds: 1 });
  for (let i = 0; i < 500; i++) { a.tick();b.tick(); }
  assert.equal(a.cycle, b.cycle);assert.deepEqual(a.match, b.match);assert.ok(a.cycle >= 4);
  const previous = a.match, cycle = a.cycle;
  previous.phase = "result";previous.winner = 0;
  assert.equal(a.tick(), true);assert.notEqual(a.match, previous);assert.equal(a.cycle, cycle + 1);
  assert.equal(a.match.phase, "battle");assert.equal(a.match.winner, null);
  assert.ok(a.match.fighters.every(f => f.percent === 0 && f.stocks === 3));
});

test("invalid or stalled preview ticks cannot poison the simulation or skip many rounds", () => {
  const preview = createPreview(), snapshot = JSON.stringify(preview.match);
  for (const dt of [0, -1, NaN, Infinity]) assert.equal(preview.tick(dt), false);
  assert.equal(JSON.stringify(preview.match), snapshot);
  preview.tick(1000);assert.equal(preview.cycle, 0);assert.ok(preview.age <= .05);
});
