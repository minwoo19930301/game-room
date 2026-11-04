import "./style.css";
import { FIGHTERS, STAGES, getFighter, getStage } from "./data.js";
import {
  createMatch,
  step,
  FIXED_DT,
  pauseMatch,
  resumeMatch,
} from "./engine.js";
import { createRenderer } from "./renderer.js";
import { createAudio } from "./audio.js";
import { createInputBuffer, KEY_MAP } from "./input.js";
import { createPageLifecycle, isPauseToggle } from "./lifecycle.js";
import { createPreview } from "./preview.js";
const preview = new URLSearchParams(location.search).get("preview") === "1";
document.body.classList.toggle("preview", preview);
const listeners = new AbortController();
const listen = (target, name, handler) => target.addEventListener(name, handler, { signal: listeners.signal });
let uiListeners = new AbortController();
const uiListen = (target, name, handler) => target.addEventListener(name, handler, { signal: uiListeners.signal });
const canvas = document.querySelector("#scene"),
  ui = document.querySelector("#ui"),
  hud = document.querySelector("#battle-hud"),
  announcement = document.querySelector("#announcement"),
  pauseButton = document.querySelector("#pause"),
  status = document.querySelector("#status");
const audio = createAudio(),
  controls = createInputBuffer();
let view,
  assets,
  selected = "coral",
  opponent = "knight",
  stage = "palace",
  training = false,
  difficulty = "beginner",
  match = null,
  screen = "title",
  accumulator = 0,
  lastTime = 0,
  raf = 0,
  disposed = false,
  lastStatus = 0,
  previewController = null,
  previewReady = false,
  graphicsLost = false;
canvas.tabIndex = 0;
if (preview) {
  for (const selector of ["#ui", "#battle-hud", "#announcement", "#pause", "#touch", "footer", "#status"]) {
    const target = document.querySelector(selector);
    if (target) target.hidden = true;
  }
}
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
function clearKeys() {
  controls.clear();
}
function setScreen(value) {
  uiListeners.abort();
  uiListeners = new AbortController();
  screen = value;
  document.body.dataset.screen = value;
  ui.innerHTML = "";
  announcement.textContent = "";
  status.textContent = preview ? "" :
    {
      title: "타이틀 화면",
      selection: "캐릭터와 무대 선택",
      battle: "대전을 시작합니다",
      paused: "일시정지",
      help: "조작 설명",
      result: "경기 종료",
    }[value] || "";
  hud.hidden = preview || value !== "battle";
  pauseButton.hidden = preview || value !== "battle";
  clearKeys();
}
function button(selector, fn) {
  const target = ui.querySelector(selector);
  if (target) uiListen(target, "click", fn);
}
function focusControl(selector) {
  if (preview || disposed) return;
  (selector === "canvas" ? canvas : ui.querySelector(selector))?.focus({ preventScroll: true });
}
function title() {
  match = null;
  setScreen("title");
  view.showMenu(stage, selected);
  ui.innerHTML = `<section class="title-screen"><div class="edition">3D PLATFORM BRAWLER</div><h1 class="logo">RINGOUT<span>링아웃</span></h1><p class="title-sub">더 높이 차고, 더 멀리 날려라.</p><div class="title-buttons"><button class="primary" id="versus">대전 시작</button><button class="secondary" id="practice">자유 연습</button></div><p class="title-note">네 명의 파이터, 세 개의 공중 무대.<br>마지막까지 남으면 승리.</p></section>`;
  button("#versus", () => {
    training = false;
    selection();
  });
  button("#practice", () => {
    training = true;
    selection();
  });
  focusControl("#versus");
}
function selection(focus = "[data-fighter].selected") {
  if (typeof focus !== "string") focus = "[data-fighter].selected";
  match = null;
  setScreen("selection");
  view.showMenu(stage, selected);
  const f = getFighter(selected);
  ui.innerHTML = `<section class="selection"><header class="select-heading"><button class="back" id="back">← 타이틀</button><h1>SELECT YOUR FIGHTER</h1><small>${training ? "자유 연습" : "3 STOCK · 150 SEC"}</small></header><div class="roster" role="group" aria-label="캐릭터 선택">${FIGHTERS.map((p) => `<button class="fighter-option ${p.id === selected ? "selected" : ""}" data-fighter="${p.id}" aria-label="${p.name} 선택" aria-pressed="${p.id === selected}"><img src="${assets.portraits[p.id]}" alt="${p.name}의 3D 전신 모델"/><span class="player-tag">${p.id === selected ? "1P" : "CPU"}</span><span class="role">${p.role}</span><span class="name">${p.name}</span></button>`).join("")}</div><div class="fighter-description"><strong>${f.name} / ${f.role}</strong><span>${f.description}</span></div><div class="stage-label"><span>SELECT STAGE</span><label>상대 <select id="opponent" aria-label="CPU 캐릭터">${FIGHTERS.map((p) => `<option value="${p.id}" ${p.id === opponent ? "selected" : ""}>${p.name}</option>`).join("")}</select></label></div><div class="stage-options" role="group" aria-label="스테이지 선택">${STAGES.map((s) => `<button class="stage-option ${s.id === stage ? "selected" : ""}" data-stage="${s.id}" aria-label="${s.name} 선택" aria-pressed="${s.id === stage}"><img src="${assets.stages[s.id]}" alt="${s.name} 3D 무대"/><span>${s.name}</span></button>`).join("")}</div><div class="selection-bottom"><p>${getStage(stage).description}<br>${training ? "CPU가 기다립니다. 피해율·복귀·방향 공격을 연습하세요." : "상대의 피해율을 올린 뒤 무대 밖으로 날려 보내세요."}</p><button class="primary" id="fight">READY TO FIGHT!</button></div></section>`;
  const difficultyLabel = document.createElement("label");
  difficultyLabel.className = "difficulty-label";
  difficultyLabel.innerHTML = `난이도 <select id="difficulty" aria-label="CPU 난이도"><option value="beginner" ${difficulty === "beginner" ? "selected" : ""}>입문</option><option value="normal" ${difficulty === "normal" ? "selected" : ""}>보통</option></select>`;
  ui.querySelector(".stage-label").append(difficultyLabel);
  ui.querySelectorAll("[data-fighter]").forEach((b) =>
    uiListen(b, "click", () => {
      selected = b.dataset.fighter;
      selection(`[data-fighter="${selected}"]`);
    }),
  );
  ui.querySelectorAll("[data-stage]").forEach((b) =>
    uiListen(b, "click", () => {
      stage = b.dataset.stage;
      selection(`[data-stage="${stage}"]`);
    }),
  );
  uiListen(ui.querySelector("#opponent"), "change", (e) => {
    opponent = e.target.value;
  });
  uiListen(ui.querySelector("#difficulty"), "change", (e) => {
    difficulty = e.target.value;
  });
  button("#back", title);
  button("#fight", begin);
  focusControl(focus);
}
function begin() {
  match = createMatch({
    player: selected,
    cpu: opponent,
    stage,
    training,
    difficulty,
  });
  accumulator = 0;
  setScreen("battle");
  view.begin(match);
  ui.innerHTML = `<div class="mode-label">${training ? "FREE TRAINING" : getStage(stage).subtitle + " · " + (difficulty === "beginner" ? "입문" : "보통")}</div><div class="timer"></div>`;
  paintHUD();
  focusControl("canvas");
}
function beginPreview() {
  previewController = createPreview();
  match = previewController.match;
  accumulator = 0;
  setScreen("battle");
  view.begin(match);
}
function paintHUD() {
  if (!match || preview) return;
  hud.innerHTML = match.fighters
    .map((f, i) => {
      const d = getFighter(f.id);
      return `<section class="fighter-hud" style="--team:${i ? "#8bbbc8" : "#f69c70"}" aria-label="${i ? "CPU" : "1P"} ${d.name}, 피해 ${Math.floor(f.percent)} 퍼센트, 스톡 ${f.stocks}"><img src="${assets.portraits[f.id]}" alt=""/><span class="hud-name">${i ? "CPU" : "1P"} ${d.name}</span><span class="percent" style="color:${f.percent > 130 ? "#f26b51" : f.percent > 70 ? "#f6b34e" : "#fff7d5"}">${Math.floor(f.percent)}<small>%</small></span><span class="stocks">${"◆".repeat(Math.max(0, f.stocks))}</span><span class="shield-meter" style="width:${f.shield}%"></span></section>`;
    })
    .join("");
  const timer = ui.querySelector(".timer");
  if (timer) {
    const t = Math.ceil(match.time);
    timer.textContent = training
      ? "∞"
      : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
  }
}
function pause() {
  if (preview || graphicsLost || !match || screen !== "battle" || !pauseMatch(match)) return;
  setScreen("paused");
  ui.innerHTML = `<section class="overlay"><h1>PAUSED</h1><p>방향 + Z로 공격을 바꾸고, ↑ + X로 무대에 복귀하세요.<br>공중 점프는 한 번 더 사용할 수 있습니다.</p><div class="button-row"><button class="primary" id="resume">계속하기</button><button class="secondary" id="retry">재경기</button><button class="secondary" id="select">선택 화면</button></div></section>`;
  button("#resume", resume);
  button("#retry", begin);
  button("#select", selection);
  focusControl("#resume");
}
function resume() {
  if (preview || graphicsLost || !match || !resumeMatch(match)) return;
  setScreen("battle");
  ui.innerHTML = `<div class="mode-label">${training ? "FREE TRAINING" : getStage(stage).subtitle}</div><div class="timer"></div>`;
  paintHUD();
  accumulator = 0;
  focusControl("canvas");
}
function result() {
  setScreen("result");
  const win = match.winner,
    winner = win === null ? null : getFighter(match.fighters[win].id);
  ui.innerHTML = `<section class="overlay"><h1>${win === 0 ? "VICTORY!" : win === 1 ? "GAME SET" : "DRAW GAME"}</h1>${winner ? `<img class="result-portrait" src="${assets.portraits[winner.id]}" alt="승자 ${winner.name}"/>` : ""}<p>${winner ? `${winner.name}의 승리` : "시간 종료 · 무승부"}<br>1P ${match.fighters[0].stocks} STOCK / CPU ${match.fighters[1].stocks} STOCK<br>진행 시간 ${Math.floor(match.elapsed)}초</p><div class="button-row"><button class="primary" id="rematch">다시 대전</button><button class="secondary" id="choose">캐릭터 선택</button></div></section>`;
  button("#rematch", begin);
  button("#choose", selection);
  status.textContent = winner
    ? `${winner.name} 승리. 다시 대전할 수 있습니다.`
    : "무승부.";
  focusControl("#rematch");
}
function help() {
  if (preview || graphicsLost || !view || screen === "help") return;
  const previous = screen;
  if (screen === "battle") pauseMatch(match);
  setScreen("help");
  ui.innerHTML = `<section class="overlay"><h1>HOW TO PLAY</h1><div class="help-grid"><kbd>← → / A D</kbd><span>이동 · 반대쪽으로 돌아보기</span><kbd>SPACE</kbd><span>점프 · 공중에서 한 번 더</span><kbd>Z / 방향 + Z</kbd><span>공격 / 위·아래·옆 공격</span><kbd>X / ↑ + X</kbd><span>캐릭터 필살기 / 공중 복귀</span><kbd>C</kbd><span>방어 · 게이지가 다 닳으면 해제</span><kbd>↓</kbd><span>보조 발판 내려가기 · 빠른 낙하</span><kbd>ESC / P</kbd><span>일시정지 · 계속하기</span></div><p>피해율이 높을수록 멀리 날아갑니다. 화면 바깥으로 밀려나면 스톡 1개를 잃습니다.<br>150초 뒤에는 남은 스톡, 그다음 낮은 피해율로 승자를 정합니다.<br>가장자리에 매달렸을 때 SPACE로 올라오세요. 터치 버튼은 아래에 있습니다.</p><button class="primary" id="closehelp">확인</button></section>`;
  button("#closehelp", () => {
    if (previous === "battle") {
      screen = "paused";
      resume();
    } else if (previous === "paused") {
      resumeMatch(match);
      screen = "battle";
      pause();
    } else if (previous === "selection") selection();
    else if (previous === "result") result();
    else title();
  });
  focusControl("#closehelp");
}
function input() {
  return controls.consume();
}
function frame(now) {
  if (disposed || graphicsLost) return;
  const dt = lastTime ? Math.min(0.05, Math.max(0, (now - lastTime) / 1000)) : 0;
  lastTime = now;
  if (match && screen === "battle") {
    accumulator += dt;
    while (accumulator >= FIXED_DT) {
      if (preview) {
        const changed = previewController.tick(FIXED_DT);
        match = previewController.match;
        if (changed) view.begin(match);
      } else step(match, match.hitstop > 0 ? {} : input(), FIXED_DT);
      for (const e of match.events) {
        view.spark(e);
        if (!preview) audio.play(e.type);
      }
      accumulator -= FIXED_DT;
    }
    if (!preview && match.phase === "result") {
      result();
    } else if (!preview) {
      announcement.textContent =
        match.phase === "countdown"
          ? match.countdown > 0.4
            ? String(Math.ceil(match.countdown - 0.4))
            : "GO!"
          : match.suddenDeath && match.time > 58
            ? "SUDDEN DEATH!"
            : "";
      paintHUD();
      if (now - lastStatus > 1500) {
        status.textContent = `${training ? "자유 연습, 시간 제한 없음" : `${Math.ceil(match.time)}초`}. 1P ${Math.floor(match.fighters[0].percent)}퍼센트, ${match.fighters[0].stocks} 스톡. CPU ${Math.floor(match.fighters[1].percent)}퍼센트, ${match.fighters[1].stocks} 스톡.`;
        lastStatus = now;
      }
    }
  }
  view.draw(match, screen === "paused" || screen === "help" ? 0 : dt, reduced);
  if (preview && !previewReady) {
    previewReady = true;
    document.documentElement.dataset.previewReady = "true";
    parent.postMessage({ type: "game-preview-ready" }, location.origin);
  }
  raf = requestAnimationFrame(frame);
}
function onKeyDown(e) {
  if (preview || graphicsLost || disposed) return;
  if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
  if (e.code === "Escape" || e.code === "KeyP") {
    e.preventDefault();
    if (!isPauseToggle(e)) return;
    if (screen === "battle") pause();
    else if (screen === "paused") resume();
    return;
  }
  if (KEY_MAP[e.code] && screen === "battle" && e.target.tagName !== "BUTTON") {
    e.preventDefault();
    controls.press(e.code);
  }
}
function onKeyUp(e) {
  if (preview || disposed) return;
  controls.release(e.code);
}
function blur() {
  clearKeys();
  accumulator = 0;
  lastTime = 0;
  if (!preview && screen === "battle") pause();
}
listen(window, "keydown", onKeyDown);
listen(window, "keyup", onKeyUp);
listen(window, "blur", blur);
listen(document, "visibilitychange", () => {
  if (document.hidden) blur();
});
document.querySelectorAll("[data-key]").forEach((b) => {
  let endedNormally = false;
  listen(b, "pointerdown", (e) => {
    if (preview || graphicsLost || screen !== "battle") return;
    e.preventDefault();
    endedNormally = false;
    b.setPointerCapture(e.pointerId);
    controls.press(b.dataset.key);
  });
  listen(b, "pointerup", () => {
    endedNormally = true;
    controls.release(b.dataset.key);
  });
  listen(b, "pointercancel", () => controls.clear());
  listen(b, "lostpointercapture", () => {
    if (!endedNormally) controls.clear();
  });
});
listen(pauseButton, "click", pause);
listen(document.querySelector("#help"), "click", help);
listen(document.querySelector("#sound"), "change", (e) => {
  if (preview) { e.target.checked = false; return; }
  audio.setEnabled(e.target.checked);
});
listen(canvas, "webglcontextlost", (e) => {
  e.preventDefault();
  blur();
  graphicsLost = true;
  cancelAnimationFrame(raf);
  ui.innerHTML =
    '<section class="overlay error"><h1>GRAPHICS PAUSED</h1><p>그래픽 연결이 끊어졌습니다. 페이지를 새로고침해 게임을 다시 시작하세요.</p><button class="primary" id="reload">새로고침</button></section>';
  button("#reload", () => location.reload());
});
try {
  view = createRenderer(canvas);
  if (preview) beginPreview();
  else { assets = view.thumbnails(); title(); }
  raf = requestAnimationFrame(frame);
} catch (error) {
  console.error(error);
  ui.innerHTML =
    '<section class="overlay error"><h1>WEBGL REQUIRED</h1><p>WebGL을 시작하지 못했습니다. 브라우저의 하드웨어 가속 설정을 확인한 뒤 새로고침해 주세요.</p></section>';
  document.querySelector("#help").disabled = true;
}
const pageLifecycle = createPageLifecycle({
  pause: blur,
  resetClock() {
    accumulator = 0;
    lastTime = 0;
  },
  stopFrame() {
    cancelAnimationFrame(raf);
  },
  startFrame() {
    if (view && !disposed && !graphicsLost) raf = requestAnimationFrame(frame);
  },
  dispose() {
    disposed = true;
    clearKeys();
    listeners.abort();
    uiListeners.abort();
    view?.dispose();
    audio.dispose();
  },
});
listen(window, "pagehide", (event) => pageLifecycle.hide(event));
listen(window, "pageshow", (event) => pageLifecycle.show(event));
