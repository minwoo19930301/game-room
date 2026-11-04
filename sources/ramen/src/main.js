import "./styles.css";
import {
  createGame,
  startDay,
  select,
  addIngredient,
  serve,
  tick,
  togglePause,
  advance,
  TOOLS,
  TOOL_NAMES,
  DAYS,
} from "./engine.js";
import { draw, hit, WIDTH, HEIGHT } from "./renderer.js";
const host = document.querySelector("#app");
host.innerHTML = `<div class="cabinet"><header class="topline"><strong>BLUE SHIRT KITCHEN · 보글보글 라면가게</strong><div class="top-actions"><button id="sound" aria-pressed="false">소리 켜기</button><button id="pause" aria-label="일시정지">잠깐 쉬기</button><button id="help">요리법</button></div></header><div class="stage"><canvas id="game" width="1200" height="900" tabindex="0" aria-label="블루의 라면가게. W 물, N 면, S 스프, E 달걀, G 파. 재료 선택 후 숫자 1부터 4로 냄비에 넣습니다. M과 냄비 번호로 냄비를 든 다음 Enter로 서빙합니다."></canvas><section class="menu" aria-label="게임 메뉴"><div class="menu-panel"></div></section><div class="load-status">주방을 준비하고 있어요…</div></div><p class="caption">재료를 냄비로 끌어 넣고, 다 익은 냄비는 쟁반으로! 터치는 재료 → 냄비, 장갑 → 냄비 → 쟁반도 가능해요.</p><details class="manual"><summary>키보드 조작과 요리법 펼치기</summary><p><span class="key">W</span> 물 · <span class="key">N</span> 면 · <span class="key">S</span> 스프 · <span class="key">E</span> 달걀 · <span class="key">G</span> 파 · <span class="key">X</span> 설거지<br>도구를 고르고 <span class="key">1–4</span> 냄비에 넣어요. <span class="key">M</span> 장갑 → <span class="key">1–4</span> 냄비 들기 → <span class="key">Enter</span> 서빙. <span class="key">Esc</span> 들고 있는 도구 취소 · <span class="key">P</span> 일시정지.<br>끓기 시작하면 토핑을 넣고, 익힘 막대의 두 초록 선 사이에서 서빙하면 완벽해요. 주문과 토핑이 같아야 해요. 탄 냄비는 여분 3개까지 교체할 수 있어요.</p><div class="access-controls" aria-label="접근성 조리 도구">${TOOLS.map((t) => `<button data-tool="${t}">${TOOL_NAMES[t]}</button>`).join("")}</div><div class="access-controls" aria-label="접근성 냄비 조작">${[1, 2, 3, 4].map((n) => `<button data-pot="${n - 1}">${n}번 냄비</button>`).join("")}<button id="accessible-serve">쟁반에 서빙</button><button id="restart">처음부터</button></div></details><p class="sr-only" id="announcer" aria-live="polite"></p></div>`;
const canvas = host.querySelector("#game"),
  ctx = canvas.getContext("2d"),
  menu = host.querySelector(".menu"),
  panel = host.querySelector(".menu-panel"),
  loadStatus = host.querySelector(".load-status");
const g = createGame();
const ui = {
  pointer: null,
  drag: null,
  heldPot: null,
  hover: null,
  pressed: null,
  pour: null,
  drop: null,
  toast: null,
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
};
const abort = new AbortController();
const listen = (el, name, fn, options = {}) =>
  el.addEventListener(name, fn, { ...options, signal: abort.signal });
let last = performance.now(),
  frame = 0,
  loaded = false,
  background = null,
  lastPhase = "",
  helpOpen = false,
  audio = null,
  sound = false,
  suspended = false,
  lastEvent = null,
  disposed = false;
const image = new Image();
image.src = "./art/kitchen.png";
image.onload = () => {
  background = image;
  loaded = true;
  loadStatus.hidden = true;
  renderMenu(true);
};
image.onerror = () => {
  loadStatus.textContent =
    "주방 그림을 불러오지 못했어요. 페이지를 새로고침해 주세요.";
};
function beep(type) {
  if (!sound) return;
  try {
    audio ??= new AudioContext();
    audio.resume().catch(() => {});
    const o = audio.createOscillator(),
      gain = audio.createGain();
    o.connect(gain);
    gain.connect(audio.destination);
    o.type = type === "error" ? "triangle" : "sine";
    o.frequency.setValueAtTime(
      type === "serve"
        ? 660
        : type === "error"
          ? 160
          : type === "water"
            ? 340
            : 480,
      audio.currentTime,
    );
    o.frequency.exponentialRampToValueAtTime(
      type === "serve" ? 990 : 240,
      audio.currentTime + 0.13,
    );
    gain.gain.setValueAtTime(0.055, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.2);
    o.start();
    o.stop(audio.currentTime + 0.22);
  } catch {
    sound = false;
  }
}
function feedback() {
  const ev = g.events.at(-1);
  if (ev === lastEvent) return;
  lastEvent = ev;
  if (!ev) return;
  host.querySelector("#announcer").textContent = ev.message;
  beep(ev.type === "ingredient" ? ev.tool : ev.type);
  if (ev.type === "ingredient") {
    if (ev.tool === "water") ui.pour = { pot: ev.pot, start: g.clock };
    else ui.drop = { pot: ev.pot, tool: ev.tool, start: g.clock };
  }
}
function cancelDrag() {
  ui.drag = null;
  ui.heldPot = null;
  ui.pressed = null;
  canvas.classList.remove("dragging");
}
function applyPot(index) {
  if (g.phase !== "play") return;
  if (g.selection === "mitt") {
    ui.heldPot = ui.heldPot === index ? null : index;
    g.focus = index;
    ui.toast = {
      message:
        ui.heldPot === null
          ? "냄비를 내려놓았어요."
          : "오른쪽 쟁반을 누르거나 Enter로 서빙!",
      time: 3,
    };
  } else {
    addIngredient(g, index, g.selection);
    feedback();
  }
}
function serveHeld() {
  if (ui.heldPot === null) {
    ui.toast = { message: "장갑으로 완성된 냄비를 먼저 들어 주세요.", time: 2 };
    return;
  }
  if (serve(g, ui.heldPot)) {
    cancelDrag();
  }
  feedback();
}
function point(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) * WIDTH) / r.width,
    y: ((e.clientY - r.top) * HEIGHT) / r.height,
  };
}
listen(canvas, "pointerdown", (e) => {
  if (g.phase !== "play") return;
  e.preventDefault();
  canvas.focus({ preventScroll: true });
  canvas.setPointerCapture(e.pointerId);
  ui.pointer = point(e);
  const target = hit(ui.pointer.x, ui.pointer.y);
  ui.pressed = { target, start: ui.pointer, moved: false };
  if (target?.kind === "tool") {
    select(g, target.id);
    ui.drag = target.id;
    ui.heldPot = null;
  } else if (target?.kind === "pot" && g.selection === "mitt") {
    ui.heldPot = target.index;
  }
  canvas.classList.add("dragging");
});
listen(canvas, "pointermove", (e) => {
  ui.pointer = point(e);
  ui.hover = hit(ui.pointer.x, ui.pointer.y);
  if (
    ui.pressed &&
    Math.hypot(
      ui.pointer.x - ui.pressed.start.x,
      ui.pointer.y - ui.pressed.start.y,
    ) > 10
  )
    ui.pressed.moved = true;
});
listen(canvas, "pointerup", (e) => {
  if (g.phase !== "play") {
    cancelDrag();
    return;
  }
  const p = point(e),
    target = hit(p.x, p.y),
    pressed = ui.pressed;
  try {
    canvas.releasePointerCapture(e.pointerId);
  } catch {}
  canvas.classList.remove("dragging");
  if (!pressed) return;
  if (ui.drag) {
    if (target?.kind === "pot") {
      addIngredient(g, target.index, ui.drag);
      feedback();
    }
    ui.drag = null;
  } else if (ui.heldPot !== null) {
    if (target?.kind === "tray") serveHeld();
    else if (target?.kind === "pot" && target.index !== ui.heldPot)
      ui.heldPot = null;
  } else if (target?.kind === "pot" && !pressed.moved) {
    applyPot(target.index);
  } else if (target?.kind === "tray") serveHeld();
  ui.pressed = null;
});
listen(canvas, "pointercancel", () => cancelDrag());
listen(canvas, "lostpointercapture", () => {
  ui.drag = null;
  ui.pressed = null;
  canvas.classList.remove("dragging");
});
listen(canvas, "pointerleave", () => {
  ui.hover = null;
  if (!ui.pressed) ui.pointer = null;
});
listen(document, "keydown", (e) => {
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey
  )
    return;
  if (e.target instanceof HTMLButtonElement && ["Enter", " "].includes(e.key))
    return;
  const key = e.key.toLowerCase();
  if (key === "p") {
    e.preventDefault();
    pause();
    return;
  }
  if (key === "escape") {
    e.preventDefault();
    if (helpOpen) {
      closeHelp();
    } else cancelDrag();
    return;
  }
  if (g.phase !== "play") return;
  const mapping = {
    w: "water",
    n: "noodle",
    s: "spice",
    e: "egg",
    g: "green",
    m: "mitt",
    x: "wash",
  };
  if (mapping[key]) {
    e.preventDefault();
    cancelDrag();
    select(g, mapping[key]);
    ui.toast = {
      message: `${TOOL_NAMES[g.selection]} 선택 · 냄비 1–4`,
      time: 2,
    };
  } else if (/^[1-4]$/.test(key)) {
    e.preventDefault();
    applyPot(Number(key) - 1);
  } else if (key === "enter") {
    e.preventDefault();
    serveHeld();
  }
});
function pause() {
  cancelDrag();
  if (helpOpen) {
    closeHelp();
    return;
  }
  togglePause(g);
  renderMenu(true);
}
listen(host.querySelector("#pause"), "click", pause);
listen(host.querySelector("#sound"), "click", () => {
  sound = !sound;
  host.querySelector("#sound").textContent = sound ? "소리 끄기" : "소리 켜기";
  host.querySelector("#sound").setAttribute("aria-pressed", String(sound));
  beep("ingredient");
});
listen(host.querySelector("#help"), "click", () => {
  cancelDrag();
  if (g.phase === "play") {
    togglePause(g);
    suspended = true;
  } else suspended = false;
  helpOpen = true;
  renderMenu(true);
});
function closeHelp() {
  helpOpen = false;
  if (suspended && g.phase === "paused") togglePause(g);
  suspended = false;
  renderMenu(true);
}
for (const button of host.querySelectorAll("[data-tool]"))
  listen(button, "click", () => {
    cancelDrag();
    select(g, button.dataset.tool);
  });
for (const button of host.querySelectorAll("[data-pot]"))
  listen(button, "click", () => applyPot(Number(button.dataset.pot)));
listen(host.querySelector("#accessible-serve"), "click", serveHeld);
listen(host.querySelector("#restart"), "click", () => {
  cancelDrag();
  g.phase = "title";
  renderMenu(true);
});
listen(menu, "click", (e) => {
  const action = e.target.closest("button")?.dataset.action;
  if (!action) return;
  cancelDrag();
  if (action === "start" || action === "practice")
    startDay(g, 1, action === "practice");
  if (action === "resume") togglePause(g);
  if (action === "next") advance(g);
  if (action === "retry") startDay(g, g.day, g.practice);
  if (action === "title") {
    g.phase = "title";
  }
  if (action === "help-close") closeHelp();
  renderMenu(true);
  feedback();
  if (g.phase === "play") canvas.focus({ preventScroll: true });
});
function renderMenu(force = false) {
  const key = helpOpen ? "help" : g.phase;
  if (!force && key === lastPhase) return;
  lastPhase = key;
  menu.hidden = key === "play";
  if (menu.hidden) return;
  let title = "",
    body = "",
    eyebrow = "",
    buttons = "";
  const button = (label, action, secondary = false) =>
    `<button data-action="${action}" class="${secondary ? "secondary" : ""}" ${!loaded && ["start", "practice"].includes(action) ? "disabled" : ""}>${label}</button>`;
  if (key === "title") {
    eyebrow = "냄비 네 개, 정성은 가득!";
    title = "블루의<br>보글보글 라면가게";
    body = "<p>뜨끈한 냄비를 들고 찾아온<br>블루의 주방의 작은 영업 이야기</p>";
    buttons =
      button("가게 열기", "start") + button("느긋한 연습", "practice", true);
  } else if (key === "help") {
    eyebrow = "블루의 비밀 레시피";
    title = "맛있는 한 냄비";
    body =
      "<ol><li>주전자를 골라 냄비에 물을 붓고 면과 스프를 넣어요.</li><li>5초 후 보글보글! 주문표를 보고 달걀·파를 넣어요.</li><li>면 익힘 막대가 초록 선 사이일 때 장갑으로 냄비를 쟁반에!</li><li>같은 주문 손님께 자동 서빙. 완벽한 라면은 연속 팁!</li><li>탄 냄비는 설거지로 교체. 여분 냄비는 하루 3개예요.</li></ol>";
    buttons = button("알겠어요!", "help-close");
  } else if (key === "paused") {
    eyebrow = "불도, 손님도 잠깐 기다려요";
    title = "잠깐 쉬는 시간";
    body = "<p>준비되면 다시 이어서 요리해요.</p>";
    buttons =
      button("계속 끓이기", "resume") + button("처음 화면", "title", true);
  } else if (key === "day-clear") {
    eyebrow = `${g.day}일차 영업 종료`;
    title = "오늘도 잘 먹었습니다!";
    body = `<p>${g.served}그릇 · 매출 ${g.earned.toLocaleString("ko-KR")}원<br>다음 날 목표 ${DAYS[g.day].goal.toLocaleString("ko-KR")}원. 더 다양한 주문이 기다려요.</p>`;
    buttons = button("다음 날 가게 열기", "next");
  } else if (key === "won") {
    eyebrow = "별 셋! 우리 동네 소문난 맛집";
    title = "블루 사장님, 최고!";
    body = `<p>3일 영업을 모두 마쳤어요.<br>누적 매출 ${g.total.toLocaleString("ko-KR")}원</p>`;
    buttons =
      button("다시 영업하기", "start") + button("연습하기", "practice", true);
  } else {
    eyebrow = `${g.day}일차 영업 종료`;
    title = "내일은 더 맛있게!";
    body = `<p>${g.speech}<br>${g.served}그릇 · 매출 ${g.earned.toLocaleString("ko-KR")}원</p>`;
    buttons =
      button("이 날 다시 도전", "retry") + button("연습하기", "practice", true);
  }
  panel.innerHTML = `<p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${body}<div class="menu-buttons">${buttons}</div>`;
}
listen(document, "visibilitychange", () => {
  if (document.hidden && g.phase === "play") {
    cancelDrag();
    togglePause(g);
    renderMenu(true);
  }
});
listen(window, "blur", () => {
  if (g.phase === "play") {
    cancelDrag();
    togglePause(g);
    renderMenu(true);
  }
});
listen(window, "pagehide", (e) => {
  if (e.persisted) {
    if (g.phase === "play") togglePause(g);
    cancelDrag();
  } else dispose();
});
listen(window, "pageshow", () => {
  last = performance.now();
  renderMenu(true);
});
function loop(now) {
  if (disposed) return;
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  tick(g, dt);
  if (ui.toast) ui.toast.time -= g.phase === "play" ? dt : 0;
  feedback();
  draw(ctx, g, ui, background);
  renderMenu();
  frame = requestAnimationFrame(loop);
}
function dispose() {
  if (disposed) return;
  disposed = true;
  cancelAnimationFrame(frame);
  abort.abort();
  cancelDrag();
  image.onload = null;
  image.onerror = null;
  audio?.close().catch(() => {});
}
if (import.meta.hot) import.meta.hot.dispose(dispose);
renderMenu(true);
document.fonts.ready.then(() => {
  if (!disposed) draw(ctx, g, ui, background);
});
frame = requestAnimationFrame(loop);
