import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { prepareCharacters } from "../src/character-sprites.js";
import { createRenderer } from "../src/renderer.mjs";
import { createGame, begin, update } from "../src/engine.mjs";
const assets = {
  characters: await loadImage("public/art/character-actions.png"),
  ruby: await loadImage("public/art/ruby-actions.png"),
  geumgang: await loadImage("public/art/geumgang-actions.png"),
  enemies: await loadImage("public/art/enemies-atlas.png"),
  backdrops: await Promise.all(
    ["glass-avenue", "canal-junction", "central-tower"].map((name) =>
      loadImage(`public/art/${name}.png`),
    ),
  ),
  makeCanvas: createCanvas,
};
test("all twelve authored poses have transparent padding and distinct pixels", () => {
 const atlas=prepareCharacters(assets.characters,createCanvas), hashes=new Set();
 assert.equal(atlas.variants[0].length,12);
 for(const frame of atlas.variants[0]){
  assert.ok(frame.w>50&&frame.h>90,'empty or clipped character');
  const data=frame.image.getContext('2d').getImageData(0,0,frame.image.width,frame.image.height).data;
  let transparent=0,filled=0;for(let i=3;i<data.length;i+=4){if(data[i]===0)transparent++;else filled++;}
  assert.ok(transparent>1000&&filled>1000,'alpha or subject missing');
  hashes.add(createHash('sha256').update(data).digest('hex'));
 }
 assert.equal(hashes.size,12);
});
test("three illustrated stage files are distinct", async () => {
  const hashes = await Promise.all(
    ["glass-avenue", "canal-junction", "central-tower"].map(async (name) =>
      createHash("sha256")
        .update(await readFile(`public/art/${name}.png`))
        .digest("hex"),
    ),
  );
  assert.equal(new Set(hashes).size, 3);
  for (const image of assets.backdrops)
    assert.ok(image.width / image.height >= 2.9);
});
test("renderer leaves state untouched in every gameplay and cinematic mode", () => {
  const canvas = createCanvas(1280, 720),
    renderer = createRenderer(canvas.getContext("2d"), assets, {
      reducedMotion: true,
    });
  const g = createGame();
  begin(g);
  update(g, { confirm: true });
  for (const mode of [
    "title",
    "select",
    "help",
    "combat",
    "intro",
    "assembly",
    "finisher",
    "stageclear",
    "victory",
    "defeat",
  ]) {
    g.mode = mode;
    g.modeTime = 2;
    const before = JSON.stringify(g);
    renderer.draw(g);
    assert.equal(JSON.stringify(g), before, mode);
  }
});
test("all sprites stay visible during all eight action poses", () => {
  const canvas = createCanvas(1280, 720),
    renderer = createRenderer(canvas.getContext("2d"), assets);
  for (let row = 0; row < 3; row++)
    for (let pose = 0; pose < 8; pose++) {
      canvas.getContext("2d").clearRect(0, 0, 1280, 720);
      renderer.sprite(row, pose, 600, 600, 1, 1);
      const data = canvas.getContext("2d").getImageData(0, 0, 1280, 720).data;
      let filled = 0;
      for (let j = 3; j < data.length; j += 4) if (data[j] > 0) filled++;
      assert.ok(filled > 2500, `${row}/${pose} empty`);
      const bottom = canvas
        .getContext("2d")
        .getImageData(0, 603, 1280, 117).data;
      assert.ok(
        bottom.every((v) => v === 0),
        `${row}/${pose} below foot anchor`,
      );
    }
});

test('each teammate has twelve authored poses and a different silhouette, not a palette swap', () => {
  const silhouettes = new Set();
  for (const name of ['characters','ruby','geumgang']) {
    const atlas = prepareCharacters(assets[name], createCanvas);
    assert.equal(atlas.variants.length,1,'no recolored substitutes');
    assert.equal(atlas.variants[0].length,12);
    const hashes=new Set();
    for (const frame of atlas.variants[0]) {
      const data=frame.image.getContext('2d').getImageData(0,0,frame.image.width,frame.image.height).data;
      hashes.add(createHash('sha256').update(data).digest('hex'));
      assert.ok(frame.w>50&&frame.h>90,`${name}: missing pose`);
    }
    assert.equal(hashes.size,12);
    const idle=atlas.variants[0][0];
    const data=idle.image.getContext('2d').getImageData(0,0,idle.image.width,idle.image.height).data;
    const alpha=Buffer.from(Array.from({length:data.length/4},(_,i)=>data[i*4+3]>128?255:0));
    silhouettes.add(createHash('sha256').update(alpha).digest('hex'));
  }
  assert.equal(silhouettes.size,3,'identical silhouettes detect accidental recolors');
});
