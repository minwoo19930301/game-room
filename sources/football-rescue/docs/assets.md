# 원화·코드·효과음 출처

## 공개 프로젝트가 사용하는 파일

| 파일 | 내용 | 제작 |
|---|---|---|
| `public/art/player-atlas.png` | 빨간 유니폼 플라밍고 18개 동작 | 2026-09-07 built-in image generation, 신규 원화 및 배경 분리 편집 |
| `public/art/cast-atlas.png` | 오리 6동작·까마귀 6동작·감독 6동작 | 2026-09-07 built-in image generation, 신규 원화 및 배경 분리 편집 |
| `public/art/stadium.png` | 관중석과 지붕의 원본 경기장 그림 | 2026-09-07 built-in image generation |
| Galmuri11 WOFF2 | 게임의 한글·숫자 표시 | npm `galmuri@2.40.3`, SIL Open Font License 1.1 |
| 축구공·골대·벤치·타격 효과 | 동적으로 그리는 게임 오브젝트 | 이 프로젝트의 Canvas 코드 |
| 효과음 | 슛·피격·점프 등 짧은 합성음 | 이 프로젝트의 Web Audio 코드, 기본 꺼짐 |

Galmuri 공식 배포처: [quiple/galmuri](https://github.com/quiple/galmuri), [동봉한 SIL OFL 라이선스](../public/licenses/Galmuri-OFL.md). npm 패키지의 저작권 고지와 라이선스를 `public/licenses/`에 포함하여 빌드 산출물에도 복사합니다. 번들에는 사용하는 WOFF2 한 파일만 포함하며 CPU 캡처는 같은 패키지의 TTF를 읽습니다.

생성 결과 중 최초 아틀라스에 배경이 들어갔기 때문에 built-in 도구에 배경만 단색 cyan으로 바꾸는 편집을 요청했습니다. 런타임 `keyChroma`는 선택한 cyan 범위만 투명화하고, `PLAYER_FRAMES` / `CAST_FRAMES`는 검토한 개별 프레임 경계를 지정합니다. 포즈 그림을 자동 보간한 원형 토큰으로 바꾸지 않습니다.

SHA-256:

```text
player-atlas.png  9db3f1b3d49015073180fbdee208c2636fc782da5bd94f8a1166f67b652b3419
cast-atlas.png    88bfed25c0066f4d0a8d2ba3990703668cc245546de48e7726100d075a564684
stadium.png       3099d02654a8ec887920fd092fa40b34c651432d1e09178369d9095feeb9af94
```

## 생성 프롬프트

아래는 실제 제작에 사용한 프롬프트입니다. CLI/API fallback은 사용하지 않았습니다. 모든 최종 원화는 위 `public/art/` 경로에 저장되어 외부 생성 폴더에 의존하지 않습니다.

### 선수 최초 생성

```text
Use case: stylized-concept. Asset type: production game sprite atlas, 1536x1024 landscape, exactly 6 columns x 3 rows = 18 equally sized cells. Transparent background (real alpha, no checkerboard). Original comic Flash-era football action game. Every cell contains SAME full-body pink flamingo soccer hero, big expressive flamingo head with bent orange-black beak and short curved neck, compact athletic body, crimson-red jersey with single white chest stripe, navy shorts, white socks, black red studded football boots. Thick ink contour and crisp flat 2-tone cel shading, caricature rather than generic cute mascot, expressive brows. Side profile facing RIGHT in every frame, same scale and consistent feet baseline, generous margins with no cross-cell overlap. Row1: idle, run contact left, run passing, run contact right, run airborne stride, run recover. Row2: kick windup, kick leg fully extended, kick recovery, shoulder tackle windup, shoulder charge low forward, shoulder recover. Row3: jump crouch, jump airborne knees raised, diving header with head stretched forward, hurt recoil, fallen flat on back, victory fist raised. Anatomically correct expressive wing-hands with gloves, bent knees, boots at clear differing angles. NO ball, no labels, no numbers, no UI, no border, no grid lines, no copyright characters, no logos, no lighting shadow outside sprite. Production animated sprite sheet, exactly all eighteen distinct complete poses, no cropping. Prefer readable detailed sports cartoon graphics, not pixel art or 3D.
```

### 선수 배경 편집

```text
Edit target: this production animation atlas. Preserve ALL 18 character poses and linework exactly. Replace only entire mottled background and ALL external shadows with perfectly FLAT SOLID pure chroma cyan RGB(0,255,255) #00ffff. No gradients, no shadows, no cyan reflections, no checkerboard. Production chroma key sheet. Fix layout into exact 6 equal columns and 3 equal rows. Every complete sprite must be separated from adjacent sprite, with at least 12 pixels cyan gutters inside its cell; shrink each if needed to fit. Keep original poses, facing right, crimson jersey white stripe navy shorts, same baseline for standing/running poses. No added text or lines. Uniform cyan color is critical for extracting clean alpha in the game.
```

### 경기장

```text
Use case: stylized-concept. Asset type: 2D side scrolling football stadium GAME BACKGROUND panorama, 1792x1024 landscape. NO foreground characters, NO ball, NO UI, NO lettering. Detailed hand-inked early 2000s Flash cartoon art with crisp dark linework, flat cel shade surfaces. Huge Korean-style cup stadium roof arch dominates middle height: white translucent roofing panels and intricate gray steel trusses, open pale cyan blue sky and white comic clouds filling top 35%. Below roof densely packed red and pink spectators in grandstands, staggered rows and yellow stairways; red seating fills middle lower 35%. Lowest 18% lush vivid green football pitch with subtle mowing stripes, white sideline. Eye-level side-on view standing on field, front-on horizontal, not isometric or top down. No perspective vanishing ground, no horizon buildings. Grass ground level perfectly horizontal at bottom 85%, empty clean foreground for small football sprites. Recognizable sports cartoon illustration with carefully drawn structural details and crowd color rhythm. Strong scene depth, wide uncluttered sky for game's overlay HUD. Bright afternoon colors red seating, cool white roof, sky blue, pitch green; no blur, gradients okay only subtle sky, no glow or floating elements. Entire original illustration with no logos or trademarks.
```

### 적·감독 최초 생성

```text
Use case: stylized-concept. Asset type: game sprite atlas 1536x1024 landscape, EXACTLY 6 columns by 3 rows =18 sprites on solid flat cyan #00ffff chroma background with no lighting shadow or gradient. Original comedy football rescue brawler. Thick black ink lines, crisp two tone cel shading, expressive big heads, small athletic bodies in football boots. Side profile all facing LEFT. Each complete sprite in one equally sized cell with generous 15px empty cyan gutter and aligned baseline. Row1 six frames of ivory-white duck troublemaker with large orange beak, yellow soft helmet, plain white football jersey black shorts yellow socks: standing cocky; running leg1; running leg2; jumping low slide tackle anticipation; fully extended ground slide tackle; dazed sitting on ground. Row2 six frames of bulky dark navy raven goalie with oversized black beak, teal striped goalkeeper jersey, padded orange mitts and black shorts: standing blocking; moving left; windup throwing a football (no actual ball); throwing followthrough; diving forward; falling stunned. Row3 six frames of pink flamingo veteran coach with gray eyebrow feathers, royal blue tracksuit, white sneakers, whistle: standing worried; pointing left; walking; cheering both wings; ducking scared; triumphant trophy lift (plain gold cup). No letters, no symbols, no numbers, no logos, no UI, no border, no cell lines. Strong character silhouettes with full bodies, feather details, expressive faces, readable athletic poses. Never crop any feet or beaks or adjacent sprite. Chroma color absent from characters; teal goalie shirt should be dark muted teal not bright cyan.
```

### 적·감독 배경 편집

```text
Edit target. Keep the original eighteen sprites and their poses exactly. Change ONLY the entire mottled background and outside cast shadows to one perfectly flat SOLID BRIGHT CYAN RGB(0,255,255), #00FFFF. No gradients, no lighting, no patterned background, no checkerboard. Pure chroma key cyan. Preserve ink borders and all feather details, unchanged clothes and color. Keep each full body separated with clear cyan gap between neighbors; slightly shrink any overlapping frame in its same cell if necessary. Exact same 6 columns and 3 rows layout. NO text or labels or lines. Uniform solid cyan throughout all background is mandatory for extraction.
```

## 참고물의 범위

[원작 아카이브](https://vidkidz.tistory.com/1382)는 동작과 화면 구성을 이해하는 자료로만 사용했습니다. 이 저장소는 원작 화면 캡처, SWF, 선수 얼굴 사진, 원작 음원을 재배포하지 않습니다. 생성 원화에는 실존 선수나 감독을 지정하지 않았습니다.
