# Blue Shirt Arcade (working title)

A single repository for **Phone Controller Games** and **Web Games**.

## Play locally

```sh
npm ci
npm run build
npm run dev
```

Open http://127.0.0.1:8810/ . Static hosting root: `public/`.

## Selected, playable Web Games

1. 칠판 기억왕 — remember and repeat arrows (1–4 local keyboard players)
2. 초밥 뷔페 — collect sushi with chopsticks (1–4)
3. 딱딱하게! — timed shield defense (1–4)
4. 친구 세기 — count people by shirt color and pose (1–4)
5. 관문 디펜스 — steer a blue-shirt crowd through numeric gates
6. 보글보글 라면가게 — cook and serve ramen
7. 플라잉 슛 구출작전 — football action and rescue
8. 출동! 셔츠 전대 — three playable fighters and robot battles
9. 블루 체스 — standard piece silhouettes, blue vs obsidian

Game rules and controls are inherited from the selected originals. Stadium is keyboard-first; individual other games have their original touch controls. No phone pairing is implemented yet.

## Character direction

The original flamingo protagonists have been replaced with code-drawn human characters: blue shirts, dark hair, and colored companion shirts. Crowd Defense uses new human geometry; Chess uses traditional silhouettes. This is an initial game-avatar interpretation, **not the existing Navy Blender model or a finalized likeness**. Character poses/colors are editable in `shared/hero.js` and the per-game source copies.

## Next scope (not playable yet)

Phone-controller baseball, tennis/badminton, golf/putting, fishing, lightsaber, air hockey/table tennis; Biohazard integration. Verify the source repository and existing Render service before integration. Benchmark games, unselected Stadium games, Party and Pocket collections are excluded.

## Source layout

- `public/`: portal and deployable games
- `sources/`: editable Vite source + tests for ramen, football and rangers
- `shared/hero.js`: human character renderer
- `scripts/build.mjs`: builds the three Vite games into `public/`
- `scripts/portal.py`: regenerates the curated portal and catalog
- `docs/PROVENANCE.md`: original sources and revisions

Validation: `npm test --workspaces --if-present` (84 inherited gameplay/render tests). Browser smoke checks cover all nine game entries. Detailed manual multi-player and phone-device QA remains before public release.
