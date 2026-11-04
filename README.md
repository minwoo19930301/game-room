# 게임룸 (working title)

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
5. 게이트 러시 — steer a crowd through numeric gates
6. 보글보글 라면가게 — cook and serve ramen
7. 플라잉 슛 구출작전 — football action and rescue
8. 출동! 수호전대 — three playable fighters and robot battles
9. 클래식 체스 — sculpted ivory and ebony pieces

Game rules and controls are inherited from the selected originals. Stadium is keyboard-first; individual other games have their original touch controls. No phone pairing is implemented yet.

## Character direction

Navy / “blue shirt” is a character reference, not the title or brand of every game. The new 12-pose sprite sheet follows the existing Navy reference: side-parted dark hair, large brown eyes, navy jacket and white T-shirt. Stadium and the two action games use those poses with companion outfit variations. These are illustrated 2D sprites, not an imported or rigged Blender model.

Each setting has its own visual direction: a classroom, sushi restaurant, stone arena, park, coastal runner, warm ramen kitchen, illustrated city and football field. Chess uses traditional sculpted pieces on an ivory-and-green board. The home page uses screenshots of the actual games.

## Next scope (not playable yet)

Phone-controller baseball, tennis/badminton, golf/putting, fishing, lightsaber, air hockey/table tennis; Biohazard integration. Verify the source repository and existing Render service before integration. Benchmark games, unselected Stadium games, Party and Pocket collections are excluded.

## Source layout

- `public/`: portal and deployable games
- `sources/`: editable Vite source + tests for ramen, football and rangers
- `public/art/character-actions.png`: 4 × 3 character action sheet
- `sources/{rangers,football-rescue}/src/character-sprites.js`: pose mapping and outfit variants
- `public/stadium/common/scenes.js`: four Stadium environments
- `scripts/build.mjs`: builds the three Vite games into `public/`
- `scripts/portal.py`: regenerates the curated portal and catalog
- `docs/PROVENANCE.md`: original sources and revisions

Validation: `npm test --workspaces --if-present` (86 gameplay/render tests), `python3 scripts/check-assets.py`, and browser play-screen checks for all nine entries. Detailed manual multi-player and physical phone QA remains before public release.
