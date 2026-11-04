import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  startDay,
  addIngredient,
  tick,
  serve,
  scorePot,
  RECIPES,
  potStage,
  togglePause,
  wash,
  advance,
  DAYS,
} from "../src/engine.js";
import { hit, POT_POS, TOOL_POS, TRAY } from "../src/renderer.js";
const fresh = (practice = false) => {
  const g = createGame();
  startDay(g, 1, practice);
  return g;
};
function cook(g, index = 0, recipe = g.orders[0].recipe) {
  addIngredient(g, index, "water");
  addIngredient(g, index, "noodle");
  addIngredient(g, index, "spice");
  tick(g, 5.2);
  if (recipe.egg) addIngredient(g, index, "egg");
  if (recipe.green) addIngredient(g, index, "green");
  tick(g, 2.1);
}
test("starts with four empty independent pots and two customer orders", () => {
  const g = fresh();
  assert.equal(g.pots.length, 4);
  assert.equal(g.orders.length, 2);
  assert.notEqual(g.pots[0], g.pots[1]);
  assert.equal(g.earned, 0);
});
test("water, noodles and spice make a ready basic bowl with normal inputs", () => {
  const g = fresh();
  cook(g);
  assert.equal(potStage(g.pots[0]), "ready");
  assert.equal(serve(g, 0), true);
  assert.equal(g.served, 1);
  assert.equal(g.earned, 1000);
  assert.equal(potStage(g.pots[0]), "empty");
  assert.equal(g.orders.length, 2);
});
test("order-specific toppings are required; wrong recipe cannot be served", () => {
  const g = fresh();
  cook(g);
  addIngredient(g, 0, "green");
  assert.equal(serve(g, 0), false);
  assert.equal(g.earned, 0);
});
test("early toppings reduce earnings", () => {
  const g = fresh();
  for (const tool of ["water", "noodle", "spice", "egg"])
    addIngredient(g, 0, tool);
  tick(g, 7.1);
  const good = scorePot({ ...g.pots[0], eggAt: 5.1 }, RECIPES[1]);
  const early = scorePot(g.pots[0], RECIPES[1]);
  assert.ok(early.value < good.value);
  assert.equal(good.value, 1300);
});
test("duplicate water and ingredients are rejected without resetting heat", () => {
  const g = fresh();
  addIngredient(g, 0, "water");
  tick(g, 3);
  assert.equal(addIngredient(g, 0, "water"), false);
  assert.ok(g.pots[0].age > 2.9);
  addIngredient(g, 0, "noodle");
  assert.equal(addIngredient(g, 0, "noodle"), false);
});
test("dry cooking burns and consumed spare is counted on replacement", () => {
  const g = fresh();
  addIngredient(g, 0, "noodle");
  tick(g, 6.1);
  assert.equal(g.pots[0].ruined, true);
  wash(g, 0);
  assert.equal(g.spares, 2);
  assert.equal(g.pots[0].ruined, false);
});
test("four burnt replacements exhaust three spares", () => {
  const g = fresh();
  for (let i = 0; i < 4; i++) {
    addIngredient(g, 0, "noodle");
    tick(g, 6.1);
    wash(g, 0);
  }
  assert.equal(g.phase, "failed");
  assert.equal(g.spares, -1);
});
test("a noodle-free water pot eventually burns dry", () => {
  const g = fresh();
  addIngredient(g, 0, "water");
  tick(g, 34.1);
  assert.equal(g.pots[0].ruined, true);
});
test("undercooked and missing spice bowls are refused", () => {
  const g = fresh();
  addIngredient(g, 0, "water");
  addIngredient(g, 0, "noodle");
  tick(g, 4);
  assert.equal(serve(g, 0), false);
  addIngredient(g, 0, "spice");
  assert.equal(serve(g, 0), false);
  assert.equal(g.served, 0);
});
test("overcooked bowls lose quality then burn", () => {
  const g = fresh();
  cook(g);
  tick(g, 7);
  assert.equal(potStage(g.pots[0]), "soft");
  assert.ok(scorePot(g.pots[0], RECIPES[0]).value < 1000);
  tick(g, 5);
  assert.equal(potStage(g.pots[0]), "burnt");
});
test("pause freezes kitchen, patience and day clock", () => {
  const g = fresh();
  addIngredient(g, 0, "water");
  togglePause(g);
  const before = JSON.stringify(g);
  tick(g, 20);
  assert.equal(JSON.stringify(g), before);
  togglePause(g);
  tick(g, 1);
  assert.ok(g.pots[0].age > 0.99);
});
test("practice pauses business pressure but cooking still requires timing", () => {
  const g = fresh(true);
  addIngredient(g, 0, "water");
  tick(g, 70);
  assert.equal(g.time, 150);
  assert.equal(g.orders[0].patience, g.orders[0].maxPatience);
  assert.equal(g.pots[0].ruined, true);
  assert.equal(g.phase, "play");
});
test("impatient customers leave and replacements arrive", () => {
  const g = fresh();
  const old = g.orders[0].id;
  tick(g, 70.1);
  assert.ok(g.orders.every((o) => o.id !== old));
  assert.equal(g.orders.length, 2);
  assert.equal(g.missed, 2);
});
test("normal game ends on time", () => {
  const g = fresh();
  tick(g, 151);
  assert.equal(g.phase, "failed");
  assert.equal(g.time, 0);
});
test("perfect successive dishes create tips capped at 300", () => {
  const g = fresh(true);
  for (let i = 0; i < 6; i++) {
    const recipe = g.orders[0].recipe;
    cook(g, 0, recipe);
    serve(g, 0);
    assert.equal(g.events.at(-1).value, recipe.price + Math.min(i * 100, 300));
  }
  assert.equal(g.combo, 6);
  assert.match(g.events.at(-1).message, /300원/);
});
test("entire three-day campaign completes only by legal cooking inputs", () => {
  const g = fresh();
  let steps = 0;
  while (g.phase !== "won" && steps < 80) {
    if (g.phase === "day-clear") {
      advance(g);
      continue;
    }
    assert.equal(g.phase, "play");
    const before = g.earned;
    const order = g.orders[0];
    cook(g, 0, order.recipe);
    assert.equal(serve(g, 0, order.id), true);
    assert.ok(g.earned > before);
    steps++;
  }
  assert.equal(g.phase, "won");
  assert.equal(g.day, 3);
  assert.ok(g.total >= DAYS.reduce((s, d) => s + d.goal, 0));
  assert.ok(steps >= 15);
});
test("all four pots can cook and serve independently", () => {
  const g = fresh(true);
  const recipes = [
    g.orders[0].recipe,
    g.orders[1].recipe,
    RECIPES[2],
    RECIPES[3],
  ];
  for (let i = 0; i < 4; i++)
    for (const tool of ["water", "noodle", "spice"]) addIngredient(g, i, tool);
  tick(g, 5.2);
  for (let i = 0; i < 4; i++) {
    if (recipes[i].egg) addIngredient(g, i, "egg");
    if (recipes[i].green) addIngredient(g, i, "green");
  }
  tick(g, 2.1);
  for (let i = 0; i < 4; i++) assert.equal(serve(g, i), true);
  assert.equal(g.served, 4);
});
test("hitbox centers match every rendered tool, pot and tray", () => {
  for (const [index, p] of POT_POS.entries())
    assert.deepEqual(hit(p.x, p.y), { kind: "pot", index });
  for (const p of TOOL_POS)
    assert.deepEqual(hit(p.x, p.y), { kind: "tool", id: p.id });
  assert.deepEqual(hit(TRAY.x, TRAY.y), { kind: "tray" });
  assert.equal(hit(0, 0), null);
});
test("invalid input and time values are inert", () => {
  const g = fresh();
  assert.equal(addIngredient(g, 8, "water"), false);
  assert.equal(addIngredient(g, 0, "alien"), false);
  const before = JSON.stringify(g);
  tick(g, NaN);
  tick(g, -1);
  assert.equal(JSON.stringify(g), before);
});
test("day advance resets cookware and preserves cumulative earnings", () => {
  const g = fresh();
  while (g.phase === "play") {
    cook(g);
    serve(g, 0);
  }
  const total = g.total;
  advance(g);
  assert.equal(g.day, 2);
  assert.equal(g.total, total);
  assert.equal(g.earned, 0);
  assert.ok(g.pots.every((p) => potStage(p) === "empty"));
});
