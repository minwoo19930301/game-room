// CPU-only art preview. This script never opens or controls a browser.
import { createCanvas, loadImage, GlobalFonts, Path2D } from "@napi-rs/canvas";
import { writeFile, mkdir } from "node:fs/promises";
import { createGame, startDay, addIngredient, tick } from "../src/engine.js";
import { draw } from "../src/renderer.js";
globalThis.Path2D = Path2D;
// Skia's CPU binding does not decode WOFF2; the official OFL font package supplies
// the equivalent TTF. Browsers continue using our bundled WOFF2 without a CDN.
if (
  !GlobalFonts.registerFromPath(
    "node_modules/galmuri/dist/Galmuri11.ttf",
    "Galmuri",
  )
)
  throw new Error("CPU Galmuri font did not load");
const canvas = createCanvas(1200, 900),
  ctx = canvas.getContext("2d");
const background = await loadImage("public/art/kitchen.png");
const game = createGame();
startDay(game);
for (const tool of ["water", "noodle", "spice"]) addIngredient(game, 0, tool);
for (const tool of ["water", "noodle", "spice"]) addIngredient(game, 1, tool);
tick(game, 5.2);
addIngredient(game, 1, "egg");
addIngredient(game, 2, "water");
tick(game, 2.1);
draw(
  ctx,
  game,
  {
    reducedMotion: false,
    hover: null,
    heldPot: null,
    pointer: null,
    drag: null,
    toast: null,
  },
  background,
);
await mkdir("docs/previews", { recursive: true });
await writeFile("docs/previews/kitchen-cpu.png", canvas.toBuffer("image/png"));
console.log(
  "CPU art preview: docs/previews/kitchen-cpu.png (not browser verification)",
);
