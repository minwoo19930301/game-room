# 게임룸 (working title)

A repository for **Web Games** only. Phone Controller Games is a separate Render project at `../phone-controller-games`; it has no tab, route or server in this application.

## Play locally

```sh
npm ci
npm run build
npm run dev
```

Open http://127.0.0.1:8810/ . Static hosting root: `public/`.

## Selected, playable Web Games (11)

1. 칠판 기억왕 — remember and repeat arrows (1–4 local keyboard players)
2. 초밥 뷔페 — collect sushi with chopsticks (1–4)
3. 딱딱하게! — timed shield defense (1–4)
4. 친구 세기 — count people by shirt color and pose (1–4)
5. 게이트 러시 — steer a crowd through numeric gates
6. 보글보글 라면가게 — cook and serve ramen
7. 플라잉 슛 구출작전 — football action and rescue
8. 출동! 수호전대 — three playable fighters and robot battles
9. 클래식 체스 — sculpted ivory and ebony pieces
10. 길 건너 한 판 — a voxel road, river and railway crossing game
11. 끝없는 계단 — climb and switch direction before the timer runs out

Stadium supports 1, 2, 3 or 4 people on one keyboard; remaining seats use CPU players. Each title exposes native player-count buttons and the actual key layout. Gamepads are not supported. Individual other games retain touch controls where available.

## Character direction

Navy / “blue shirt” is a character reference, not the title or brand of every game. The 12-pose Navy sprite sheet follows the existing reference: side-parted dark hair, large brown eyes, navy jacket and white T-shirt. Rangers adds separate 12-pose Ruby and Geumgang sheets: Ruby has a red ponytail and lightweight athletic outfit; Geumgang has a broad armored silhouette and gold bracers. Their special moves use different poses and effects. These are illustrated 2D sprites, not an imported or rigged Blender model.

Each setting has its own visual direction: a classroom, sushi restaurant, stone arena, park, coastal runner, warm ramen kitchen, illustrated city and football field. Chess uses traditional sculpted pieces on an ivory-and-green board. The home page uses screenshots of the actual games.

## Home and previews

The home page is a horizontal, keyboard- and swipe-controlled card carousel with minimal captions. The selected card runs an isolated, muted gameplay demo using `?preview=1`. Only one preview is mounted; changing cards or hiding the page disposes it. Reduced-motion preferences disable autoplay, and a pause control is available. Previews do not save scores or player settings.

Phone-controller sports and Biohazard integration belong to the separate Render project. Benchmark games, unselected Stadium games, Party and Pocket collections remain excluded.

## Source layout

- `public/`: portal and deployable games
- `sources/`: editable Vite source + tests for ramen, football and rangers
- `public/art/character-actions.png`: 4 × 3 character action sheet
- `sources/{rangers,football-rescue}/src/character-sprites.js`: pose mapping and outfit variants
- `public/stadium/common/scenes.js`: four Stadium environments
- `scripts/build.mjs`: builds the three Vite games into `public/`
- `scripts/portal.py`: regenerates the curated carousel and catalog; run after builds to refresh resource hashes
- `docs/PROVENANCE.md`: original sources and revisions

Validation: `npm test --workspaces --if-present` (95 gameplay/render tests), `python3 scripts/check-assets.py`, and browser checks for all 11 automatic previews, carousel selection/pause, four-person selection, crossing-game input/score and stair-climbing input/score. The stairs engine also passes normal movement, turning, falling, timeout, restart and four 100-second automatic-preview simulations. Physical phone and simultaneous multi-key hardware testing remain before public release.
