import test from "node:test";
import assert from "node:assert/strict";
import { createCanvas, loadImage, GlobalFonts, Path2D } from "@napi-rs/canvas";
import {
  createGame,
  startDay,
  addIngredient,
  tick,
  togglePause,
} from "../src/engine.js";
import { draw } from "../src/renderer.js";
globalThis.Path2D = Path2D;
assert.ok(
  GlobalFonts.registerFromPath(
    new URL("../../../node_modules/galmuri/dist/Galmuri11.ttf", import.meta.url).pathname,
    "Galmuri",
  ),
);
const background = await loadImage("public/art/kitchen.png");
const ui = () => ({
  reducedMotion: false,
  hover: null,
  heldPot: null,
  pointer: null,
  drag: null,
  toast: null,
});
test("every cookware stage renders without mutating game state", () => {
  const g = createGame();
  startDay(g, 1, true);
  const canvas = createCanvas(1200, 900),
    ctx = canvas.getContext("2d");
  for (const stage of [
    "empty",
    "water",
    "noodle",
    "spice",
    "boil",
    "egg",
    "ready",
    "soft",
    "burnt",
  ]) {
    if (["water", "noodle", "spice", "egg"].includes(stage))
      addIngredient(g, 0, stage);
    if (stage === "boil") tick(g, 5.2);
    if (stage === "ready") tick(g, 2.1);
    if (stage === "soft") tick(g, 7);
    if (stage === "burnt") tick(g, 5);
    const before = JSON.stringify(g);
    draw(ctx, g, ui(), background);
    assert.equal(JSON.stringify(g), before, stage);
  }
  const png = canvas.toBuffer("image/png");
  assert.equal(png.toString("hex", 0, 8), "89504e470d0a1a0a");
});
test("drag, pour, drop, reduced-motion and missing-background rendering are safe", () => {
  const g = createGame();
  startDay(g);
  addIngredient(g, 0, "water");
  const canvas = createCanvas(1200, 900),
    ctx = canvas.getContext("2d");
  for (const modifiers of [
    { pointer: { x: 600, y: 650 }, drag: "noodle" },
    { pointer: { x: 980, y: 650 }, heldPot: 0 },
    { pour: { pot: 0, start: g.clock } },
    { drop: { pot: 0, tool: "egg", start: g.clock } },
    { reducedMotion: true },
  ])
    assert.doesNotThrow(() =>
      draw(ctx, g, { ...ui(), ...modifiers }, background),
    );
  togglePause(g);
  assert.doesNotThrow(() => draw(ctx, g, ui(), null));
});
