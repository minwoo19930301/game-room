import {drawHero} from './hero.js';
import { DAYS, TOOL_NAMES, potStage } from "./engine.js";
import {
  ellipse,
  round,
  text,
  path,
  tool,
  pot,
  burner,
  steam,
  tray,
  egg,
  scallion,
} from "./art.js";
export const WIDTH = 1200,
  HEIGHT = 900;
export const POT_POS = [
  { x: 208, y: 579 },
  { x: 478, y: 579 },
  { x: 208, y: 748 },
  { x: 478, y: 748 },
];
export const TOOL_POS = [
  { id: "noodle", x: 197, y: 243, w: 180, h: 115 },
  { id: "spice", x: 423, y: 243, w: 180, h: 115 },
  { id: "egg", x: 197, y: 365, w: 180, h: 105 },
  { id: "green", x: 423, y: 365, w: 180, h: 105 },
  { id: "water", x: 711, y: 636, w: 185, h: 218 },
  { id: "mitt", x: 786, y: 797, w: 99, h: 110 },
  { id: "wash", x: 648, y: 805, w: 116, h: 94 },
];
export const TRAY = { x: 1030, y: 755, w: 272, h: 145 };
export function hit(x, y) {
  if (
    x >= TRAY.x - TRAY.w / 2 &&
    x <= TRAY.x + TRAY.w / 2 &&
    y >= TRAY.y - 90 &&
    y <= TRAY.y + 70
  )
    return { kind: "tray" };
  for (const [index, p] of POT_POS.entries()) {
    if (Math.abs(x - p.x) < 111 && y > p.y - 83 && y < p.y + 78)
      return { kind: "pot", index };
  }
  for (const p of TOOL_POS) {
    if (Math.abs(x - p.x) < p.w / 2 && Math.abs(y - p.y) < p.h / 2)
      return { kind: "tool", id: p.id };
  }
  return null;
}
function badge(c, label, x, y, w = 170) {
  round(c, x - w / 2, y - 19, w, 38, 10, "#ffe8cd", "#c56b78", 2);
  text(c, label, x, y, 17);
}
function potStatus(p) {
  return {
    empty: "물부터 부어 주세요",
    dry: "물이 없어요!",
    heating: "물을 데우는 중",
    boiling: "보글보글! 면을 넣어요",
    cooking: "면이 익는 중",
    ready: "지금 서빙하세요!",
    soft: "면이 불고 있어요",
    burnt: "탄 냄비 · 교체 필요",
  }[potStage(p)];
}
function recipeIcons(c, recipe, x, y) {
  text(c, "면·스프", x, y, 14, "#95545b");
  if (recipe.egg) egg(c, x + (recipe.green ? -18 : 0), y + 21, 0.29, true);
  if (recipe.green) scallion(c, x + (recipe.egg ? 18 : 0), y + 21, 0.29, true);
}
export function draw(c, g, ui, bg) {
  c.clearRect(0, 0, WIDTH, HEIGHT);
  c.fillStyle='#e9e2d4';c.fillRect(0,0,WIDTH,HEIGHT);
 c.strokeStyle='#d3cbbd';c.lineWidth=2;for(let x=0;x<WIDTH;x+=70){c.beginPath();c.moveTo(x,80);c.lineTo(x,HEIGHT);c.stroke();}for(let y=80;y<HEIGHT;y+=70){c.beginPath();c.moveTo(0,y);c.lineTo(WIDTH,y);c.stroke();}
 round(c,620,100,550,350,18,'#b9d8dc','#45636d',5);round(c,655,125,480,270,12,'#dff2ed');
 drawHero(c,930,360,3.2,'idle',g.clock,'#3478db');
 round(c,10,435,1180,450,18,'#b68258','#76573f',6);round(c,20,445,1160,30,6,'#e1bb82');
 round(c,40,110,515,310,12,'#d6ba8a','#76573f',4);
  const t = ui.reducedMotion ? 0 : g.clock;
  // Top strip is part of the kitchen, not a dashboard wrapper.
  path(
    c,
    "M0 0H1200V79Q1170 68 1140 79Q1110 68 1080 79Q1050 68 1020 79Q990 68 960 79Q930 68 900 79Q870 68 840 79Q810 68 780 79Q750 68 720 79Q690 68 660 79Q630 68 600 79Q570 68 540 79Q510 68 480 79Q450 68 420 79Q390 68 360 79Q330 68 300 79Q270 68 240 79Q210 68 180 79Q150 68 120 79Q90 68 60 79Q30 68 0 79Z",
    "#f65c91",
    "#b84066",
    3,
  );
  text(c, "블루의 라면가게", 180, 36, 31, "#fff5d8");
  text(c, `${g.day}일차`, 387, 22, 19, "#fff5d8");
  text(
    c,
    g.practice ? "연습 중" : `${Math.ceil(g.time)} 초`,
    387,
    52,
    23,
    "#fff5d8",
  );
  round(c, 450, 19, 248, 38, 14, "#b83562", "#ffbeca", 2);
  round(
    c,
    455,
    24,
    238 * (g.time / DAYS[g.day - 1].seconds),
    28,
    10,
    "#ffb8c7",
  );
  text(
    c,
    `${g.earned.toLocaleString("ko-KR")} / ${DAYS[g.day - 1].goal.toLocaleString("ko-KR")} 원`,
    848,
    38,
    23,
    "#fff4c9",
  );
  text(c, `여분 냄비 ${Math.max(0, g.spares)}`, 1093, 23, 17, "#fff5df");
  text(
    c,
    g.combo > 1 ? `${g.combo} 연속 완벽!` : "정성 한 냄비",
    1093,
    51,
    18,
    "#fff5df",
  );
  // Ingredient shelves contain live draggable sprites, not pictures baked into art.
  for (const p of TOOL_POS.slice(0, 4)) {
    if (g.selection === p.id) {
      round(
        c,
        p.x - p.w / 2 + 5,
        p.y - p.h / 2 + 6,
        p.w - 10,
        p.h - 8,
        12,
        "#fff0b84d",
        "#fff3bc",
        3,
      );
    }
    if (p.id === "egg") {
      egg(c, p.x - 30, p.y, 0.7);
      egg(c, p.x + 29, p.y + 5, 0.71);
    } else if (p.id === "green") {
      tool(c, p.id, p.x, p.y + 2, 0.9);
    } else {
      tool(c, p.id, p.x, p.y, 0.89);
    }
    badge(
      c,
      `${TOOL_NAMES[p.id]}  [${{ noodle: "N", spice: "S", egg: "E", green: "G" }[p.id]}]`,
      p.x,
      p.y + 51,
      120,
    );
  }
  // Handwritten order tickets are placed by the pass, leaving the chef visible.
  for (const [i, o] of g.orders.entries()) {
    const x = 937 + i * 139,
      y = 433;
    c.save();
    c.translate(x, y);
    c.rotate(i ? 0.035 : -0.025);
    path(
      c,
      "M-68-71L68-71 68 60 59 53 49 60 39 53 29 60 19 53 9 60-1 53-11 60-21 53-31 60-41 53-51 60-60 53-68 60Z",
      "#fff5da",
      "#b76a71",
      2,
    );
    round(c, -13, -78, 26, 14, 3, "#da8c68", "#986341", 2);
    text(c, `주문 ${o.id}`, 0, -48, 16, "#b35568");
    text(
      c,
      o.recipe.name,
      0,
      -22,
      o.recipe.name.length > 7 ? 14 : 17,
      "#7a3443",
    );
    recipeIcons(c, o.recipe, 0, -3);
    round(c, -48, 40, 96, 9, 4, "#f0c4b1");
    round(
      c,
      -48,
      40,
      (96 * o.patience) / o.maxPatience,
      9,
      4,
      o.patience < 15 ? "#ea675c" : "#7fa579",
    );
    c.restore();
  }
  const speech = g.speechTime > 0 ? g.speech : "토핑은 물이 끓을 때!";
  round(c, 585, 105, 200, 111, 20, "#fff8e7", "#c57679", 3);
  path(c, "M773 179L802 198 776 162", "#fff8e7", "#c57679", 3);
  wrap(c, speech, 685, 134, 16, 172, 24);
  // Stove enamel and individual burner rings are interactive foreground paths.
  path(c, "M74 498H595L614 819 57 819Z", "#ff9fbd", "#c66d84", 3);
  path(c, "M60 818H615V853H55Z", "#f480a4", "#b94d73", 3);
  for (const [i, pos] of POT_POS.entries()) {
    const p = g.pots[i],
      held = ui.heldPot === i;
    burner(
      c,
      pos.x,
      pos.y + 9,
      !p.ruined && (p.water || p.noodle || p.spice),
      t,
    );
    if (!held)
      pot(
        c,
        pos.x,
        pos.y,
        p,
        t,
        ui.hover?.kind === "pot" && ui.hover.index === i,
      );
    if (!held && (p.ruined || (p.water && p.age >= 5)))
      steam(c, pos.x, pos.y, t, p.ruined);
    const stage = potStage(p);
    ellipse(c, pos.x - 110, pos.y + 43, 15, 15, "#fff0ce", "#bc7381", 2);
    text(c, String(i + 1), pos.x - 110, pos.y + 43, 20, "#9a4261");
    const yy = pos.y + 84;
    round(c, pos.x - 95, yy - 8, 190, 15, 6, "#eaa38e", "#a65f55", 1.5);
    if (p.water) {
      const pct = p.noodle
        ? Math.min(1, p.noodleAge / 18)
        : Math.min(0.33, p.age / 15);
      round(
        c,
        pos.x - 93,
        yy - 6,
        186 * pct,
        11,
        5,
        stage === "ready"
          ? "#87b97e"
          : stage === "soft" || stage === "burnt"
            ? "#d45853"
            : "#ffd15d",
      );
    }
    if (p.noodle) {
      c.fillStyle = "#568e61";
      c.fillRect(pos.x - 95 + (190 * 7) / 18, yy - 10, 3, 19);
      c.fillRect(pos.x - 95 + (190 * 13) / 18, yy - 10, 3, 19);
    }
    text(
      c,
      potStatus(p),
      pos.x,
      pos.y + 64,
      16,
      stage === "ready" ? "#36643f" : "#8a3b4a",
    );
  }
  for (const id of ["water", "mitt", "wash"]) {
    const p = TOOL_POS.find((p) => p.id === id);
    if (g.selection === id)
      ellipse(
        c,
        p.x,
        p.y + 42,
        id === "water" ? 91 : 61,
        22,
        "#fff4caaa",
        "#fff5c1",
        3,
      );
    tool(c, id, p.x, p.y, id === "water" ? 0.93 : id === "mitt" ? 1.1 : 0.88);
    badge(
      c,
      `${TOOL_NAMES[id]} [${{ water: "W", mitt: "M", wash: "X" }[id]}]`,
      p.x,
      p.y + (id === "water" ? 100 : 60),
      id === "water" ? 172 : 126,
    );
  }
  tray(c, TRAY.x, TRAY.y, ui.heldPot !== null);
  badge(c, "완성 냄비를 여기로!", TRAY.x, TRAY.y + 88, 239);
  text(c, "SERVE", TRAY.x, TRAY.y - 105, 23, "#9a5465");
  if (g.selection === "mitt" && ui.heldPot === null)
    text(c, "장갑 선택 → 냄비 → 쟁반", 1030, 615, 17, "#8c4857");
  // Chef reactions are driven by cooking events (sparkle, blush, sweat, speech),
  // while the detailed character itself belongs to the original background plate.
  const event = g.events.at(-1);
  if (g.speechTime > 1.5 && event) {
    if (["error", "burn", "miss"].includes(event.type)) {
      path(
        c,
        "M877 286Q861 316 876 319Q895 320 877 286",
        "#a9dfe9",
        "#75aebe",
        2,
      );
    }
    if (["serve", "clear"].includes(event.type)) {
      for (const [xx, yy] of [
        [784, 244],
        [900, 216],
        [913, 297],
      ]) {
        path(
          c,
          `M${xx} ${yy - 13}L${xx + 4} ${yy - 3} ${xx + 13} ${yy} ${xx + 4} ${yy + 3} ${xx} ${yy + 13} ${xx - 4} ${yy + 3} ${xx - 13} ${yy} ${xx - 4} ${yy - 3}Z`,
          "#fff3ae",
          "#efb74b",
          1.5,
        );
      }
    }
  }
  if (ui.pour) {
    const age = g.clock - ui.pour.start;
    if (age < 0.65) {
      const pos = POT_POS[ui.pour.pot];
      c.save();
      c.strokeStyle = "#9ddce2";
      c.lineWidth = 9;
      c.beginPath();
      c.moveTo(pos.x + 20, pos.y - 148);
      c.quadraticCurveTo(pos.x + 3, pos.y - 103, pos.x, pos.y - 30);
      c.stroke();
      tool(c, "water", pos.x + 112, pos.y - 114, 0.63, -0.5);
      c.restore();
    }
  }
  if (ui.drop) {
    const age = g.clock - ui.drop.start;
    if (age < 0.5) {
      const pos = POT_POS[ui.drop.pot];
      const lift = (1 - age / 0.5) * 100;
      tool(c, ui.drop.tool, pos.x, pos.y - 30 - lift, 0.6);
    }
  }
  if (ui.pointer && (ui.drag || ui.heldPot !== null)) {
    const { x, y } = ui.pointer;
    if (ui.heldPot !== null) {
      pot(c, x, y - 12, g.pots[ui.heldPot], t, false, 0.8);
      tool(c, "mitt", x + 78, y + 22, 0.8, -0.2);
    } else {
      tool(c, ui.drag, x, y, 0.73);
    }
  }
  if (ui.toast && ui.toast.time > 0) {
    round(c, 390, 855, 420, 34, 12, "#fff5dd", "#bf697b", 2);
    text(c, ui.toast.message, 600, 872, 16, "#8f415a");
  }
}
function wrap(c, str, x, y, size, width, lineHeight) {
  let line = "",
    row = 0;
  for (const char of str) {
    c.font = `${size}px Galmuri, sans-serif`;
    if (c.measureText(line + char).width > width && line) {
      text(c, line, x, y + row * lineHeight, size);
      line = char;
      row++;
    } else line += char;
  }
  if (line) text(c, line, x, y + row * lineHeight, size);
}
