# Platformer implementation contract

New original side-scrolling platformer; classic responsive 2D platformer mechanics, no flutter/double jump. Zero runtime dependencies. Files served directly, ES modules. Canvas resolution W=960,H=540. Tile size TILE=48 (20 tiles across), floor normally row 9 (y=432); 12 rows total. Coordinates are world pixels, top-left x/y; velocity pixels/second. Level backgrounds/parallax are renderer-owned.

## modules / ownership

- engine.mjs + tests/engine.test.mjs: action_redesign
- levels.mjs + tests/levels.test.mjs: chess_redesign
- render.mjs, art.mjs, optional art assets: stadium_redesign
- main.mjs, audio.mjs, index.html, style.css, preview integration, portal/docs: root

## levels.mjs exports

`TILE=48`, `LEVELS`, `getLevel(index)`: data only. A level is `{id,name,theme,width,height,tiles,spawn,goal,checkpoint,enemies,coins,platforms,pipes}`. `tiles` array strings, width/height in tiles; pixel coordinate objects elsewhere.
- tiles: `.` empty, `#` ground, `B` brick, `?` coin block, `M` growth block, `F` fire block, `S` star block, `L` life block, `X` used block, `P` solid pipe, `=` one-way platform, `^` deadly spikes. Invisible collectible coins use coins array.
- spawn `{x,y}` player top-left (normal small body height40).
- goal `{x,y,requiresBoss?:boolean}` flag pole base world position; optional checkpoint `{x,y}`. `goalLocked` reflects a required living boss; final goal remains locked until it is defeated.
- enemies `{type:'walker'|'turtle'|'plant'|'flyer'|'boss',x,y,dir:-1|1,range?:number,pipeTop?:number}`. x/y top-left. Engine fills dimensions: walkers36x32, turtle38x40, plant30x44, flyer36x30, boss72x80. Default enemy floor y=432-entityHeight. Types beyond walker/turtle optional; implement used types.
- coins `{x,y}` centers radius12.
- platforms `{x,y,w,h,axis:'x'|'y',range,speed}` moving solid top platforms, optional.
- pipes `{x,y,w,h,bonus?:{coins:number}}` pixel rectangles for visual pipe caps and optional collectible room; P tiles already enforce collision. Bonus warp optional, coordinate/gate contract will be expanded if implemented.
- three designed levels, ~120–180 tiles each, grass/cavern/castle. Must be finishable with ~3.5–4 tile full jump height, run gap <=4 tiles, no one-way forced jumps above reach. At least one checkpoint each, flag / final-stage finish reachable. First 30 tiles teach controls safely. Do not reproduce exact external level layout.

## engine.mjs API

Exports `TILE,W=960,H=540`, `createGame(levelIndex=0, options={})`, `update(g,input,dt=1/60)`, `restart(g)`, `nextLevel(g)`, `currentLevel(g)`, `previewInput(g,dt=1/60)`.
- `input={left,right,run,jump,fire,down}` held booleans; engine tracks rising edges. Fire may use same key as run via main. Engine substeps long dt safely; main fixed timestep.
- game.mode `'playing'|'dying'|'gameover'|'finishing'|'clear'|'complete'` (main handles title/pause externally, doesn't call update while paused/title). Finishing hides the menu while the flag descends and the hero walks toward the exit; clear follows automatically.
- game `{levelIndex,level,player,tiles,enemies,items,coins,platforms,projectiles,particles,events,score,coinCount,lives,time,elapsed,cameraX,checkpointReached,mode,clearTime}`.
- `tiles` mutable array strings or array-char rows. Renderer supports either.
- player `{x,y,w,h,vx,vy,dir,onGround,power:'small'|'big'|'fire',invincible:seconds,hurt:seconds,dead:boolean,crouching?:boolean,pose?:string,anim:number}`. `w=32`, small `h=40`, big/fire `h=72`; top-left and feet preserved on size change. At least player.dir ±1.
- enemy `{type,x,y,w,h,vx,vy,dir,alive,state:'walk'|'shell'|'sliding'|'dead',hp?,timer?,anim?}`; state may extend, renderer checks type/state.
- items `{type:'growth'|'fire'|'star'|'life'|'coin',x,y,w,h,vx,vy,active,emerging?:number}`.
- game.coins objects `{x,y,collected}`. projectiles `{x,y,w,h,vx,vy,active,type}`; particles `{x,y,vx,vy,life,maxLife?,type,color?,text?}`.
- game.events bounded array of `{type:'jump'|'stomp'|'coin'|'bump'|'break'|'power'|'fire'|'hurt'|'death'|'checkpoint'|'clear'|'complete'|'life',x?,y?,value?}`. Main consumes then clears after every fixed tick; renderer must not depend on event history.
- engine updates cameraX (fixed vertical). Camera smooth lead but no rubber banding, clamp level width minus W.
- restart returns new game at current checkpoint with run score/coins preserved where appropriate; clarify signature returning object. `nextLevel` returns next game carrying lives/score/coins/power. main always assigns returned object.
- options may include seed, lives, preview (no storage ever in engine). Main controls localStorage in normal mode only.
- previewInput uses actual inputs to traverse first representative segment, jumping enemies/obstacles; no teleporting between steps. Main can reset demo on death/clear or after 24–30s. Prefer demonstration of jump/head block/stomp/growth.

## renderer API

`export function createArt()` synchronous assets (or Promise if image assets, main uses await); `export function render(ctx,g,art,{preview=false,paused=false,title=false,time=0}={})`.
Main canvas960x540. Canvas render draws complete scene+in-canvas minimal HUD; DOM main menus/buttons separate. Crisp classic platformer look (original pixel art allowed) with distinct terrain, coins, animated character, enemies, question blocks, pipes, flag/castle. HUD score, coins, world, time/lives. Drawing visual y uses worldY directly; only subtract g.cameraX horizontally. UI font can use bundled local fonts or system mono. renderer must gracefully handle all engine states.

## testing & preview

Normal game supports start, pause/resume, restart, death/lives, next level, final completion. Keyboard arrows/A-D, Space/X jump, Shift/Z run+fire; mobile multi-pointer left/right/run/jump buttons. ?preview=1 auto-start muted, no storage changes, input blocked, hide DOM UI. After assets+first render set html.dataset.previewReady='true'; parent.postMessage({type:'game-preview-ready'},location.origin) exactly once. Only root uses CUA browser. Do not launch external browser automation; pure Node/Canvas tests allowed.
