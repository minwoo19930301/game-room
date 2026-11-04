export const TOOLS = [
  "water",
  "noodle",
  "spice",
  "egg",
  "green",
  "mitt",
  "wash",
];
export const TOOL_NAMES = {
  water: "주전자",
  noodle: "면",
  spice: "스프",
  egg: "달걀",
  green: "파",
  mitt: "주방장갑",
  wash: "설거지",
};
export const RECIPES = [
  { id: "classic", name: "기본 라면", egg: false, green: false, price: 1000 },
  { id: "egg", name: "달걀 라면", egg: true, green: false, price: 1300 },
  { id: "green", name: "파송송 라면", egg: false, green: true, price: 1200 },
  { id: "special", name: "파송송 달걀탁", egg: true, green: true, price: 1600 },
];
export const DAYS = [
  { seconds: 150, goal: 6000, orderWait: 70 },
  { seconds: 150, goal: 10000, orderWait: 62 },
  { seconds: 160, goal: 14000, orderWait: 56 },
];
const emptyPot = () => ({
  water: false,
  noodle: false,
  spice: false,
  egg: false,
  green: false,
  age: 0,
  noodleAge: 0,
  eggAt: null,
  greenAt: null,
  ruined: false,
  spill: false,
});
export function createGame() {
  return {
    phase: "title",
    previousPhase: "play",
    day: 1,
    time: 150,
    earned: 0,
    total: 0,
    served: 0,
    missed: 0,
    combo: 0,
    spares: 3,
    pots: Array.from({ length: 4 }, emptyPot),
    orders: [],
    orderSerial: 0,
    events: [],
    clock: 0,
    selection: "water",
    focus: 0,
    speech: "어서 와요! 오늘도 맛있게 끓여볼까요?",
    speechTime: 6,
    practice: false,
  };
}
export function emit(g, type, message, details = {}) {
  g.events.push({ type, message, ...details });
  if (g.events.length > 30) g.events.shift();
  g.speech = message;
  g.speechTime = 3.5;
}
function addOrder(g) {
  const pool =
    g.day === 1 ? [0, 1, 2, 3] : g.day === 2 ? [1, 2, 3, 3] : [3, 1, 3, 2];
  const recipe = RECIPES[pool[g.orderSerial % pool.length]];
  g.orders.push({
    id: ++g.orderSerial,
    recipe,
    patience: DAYS[g.day - 1].orderWait,
    maxPatience: DAYS[g.day - 1].orderWait,
  });
}
export function startDay(g, day = 1, practice = false) {
  Object.assign(g, {
    phase: "play",
    day,
    time: DAYS[day - 1].seconds,
    earned: 0,
    served: 0,
    missed: 0,
    combo: 0,
    spares: 3,
    pots: Array.from({ length: 4 }, emptyPot),
    orders: [],
    orderSerial: 0,
    clock: 0,
    events: [],
    practice,
    selection: "water",
    focus: 0,
  });
  if (day === 1) g.total = 0;
  addOrder(g);
  addOrder(g);
  emit(
    g,
    "start",
    practice
      ? "연습 영업이에요. 시간과 손님은 기다려 줍니다."
      : "물 → 면·스프 → 보글보글 → 토핑 → 쟁반!",
  );
}
export function select(g, tool) {
  if (TOOLS.includes(tool)) g.selection = tool;
}
export function potStage(p) {
  if (p.ruined) return "burnt";
  if (!p.water) return p.noodle || p.spice ? "dry" : "empty";
  if (p.age < 5) return "heating";
  if (!p.noodle) return "boiling";
  if (p.noodleAge < 7) return "cooking";
  if (p.noodleAge <= 13) return "ready";
  if (p.noodleAge < 18) return "soft";
  return "burnt";
}
export function addIngredient(g, index, tool) {
  if (g.phase !== "play") return false;
  const p = g.pots[index];
  if (!p) return false;
  g.focus = index;
  if (tool === "wash") return wash(g, index);
  if (tool === "mitt") {
    emit(g, "hint", "냄비 손잡이를 잡아 오른쪽 쟁반으로 옮겨 주세요.");
    return false;
  }
  if (p.ruined) {
    emit(g, "error", "탄 냄비는 설거지 도구로 교체해요.");
    return false;
  }
  if (!["water", "noodle", "spice", "egg", "green"].includes(tool))
    return false;
  if (p[tool]) {
    emit(
      g,
      "error",
      tool === "water" ? "물은 이미 충분해요!" : "그 재료는 이미 넣었어요.",
    );
    return false;
  }
  if ((tool === "egg" || tool === "green") && !p.water) {
    emit(g, "error", "먼저 물을 부어야 해요.");
    return false;
  }
  p[tool] = true;
  if (tool === "water") p.age = 0;
  if (tool === "noodle") p.noodleAge = 0;
  if (tool === "egg") p.eggAt = p.age;
  if (tool === "green") p.greenAt = p.age;
  emit(
    g,
    "ingredient",
    {
      water: "쪼르르! 물을 채웠어요.",
      noodle: "꼬들꼬들 면 투하!",
      spice: "스프가 사르르 녹아요.",
      egg:
        p.age >= 5
          ? "달걀 탁! 지금이 딱 좋아요."
          : "조금 일찍 넣었어요. 끓을 때 넣으면 더 맛있어요.",
      green:
        p.age >= 5
          ? "파송송! 향긋한 냄새가 나요."
          : "파는 물이 끓을 때 넣어 주세요.",
    }[tool],
    { pot: index, tool },
  );
  return true;
}
export function wash(g, index) {
  if (g.phase !== "play") return false;
  const p = g.pots[index];
  if (!p || (!p.water && !p.noodle && !p.spice && !p.ruined)) {
    emit(g, "hint", "이 냄비는 이미 깨끗해요.");
    return false;
  }
  if (p.ruined) {
    g.spares--;
    if (g.spares < 0) {
      g.phase = "failed";
      emit(g, "fail", "여분 냄비가 다 떨어졌어요. 다시 도전해요!");
      return true;
    }
  } else {
    g.earned = Math.max(0, g.earned - 100);
    g.combo = 0;
  }
  g.pots[index] = emptyPot();
  emit(
    g,
    "wash",
    p.ruined ? "새 냄비로 교체했어요!" : "반짝반짝! 재료비 100원을 사용했어요.",
    { pot: index },
  );
  return true;
}
export function scorePot(p, recipe) {
  if (!p.water || !p.noodle || !p.spice)
    return { value: 0, grade: "미완성", reason: "물·면·스프가 모두 필요해요." };
  if (p.ruined || p.noodleAge >= 18)
    return {
      value: 0,
      grade: "새까맣게 탔어요",
      reason: "탄 라면은 손님께 드릴 수 없어요.",
    };
  if (p.noodleAge < 7)
    return {
      value: 0,
      grade: "아직 설익었어요",
      reason: "면이 익을 때까지 조금 더 기다려요.",
    };
  if (p.egg !== recipe.egg || p.green !== recipe.green)
    return {
      value: 0,
      grade: "주문이 달라요",
      reason: "주문표의 달걀과 파를 확인해 주세요.",
    };
  let quality = p.noodleAge <= 13 ? 1 : 0.65;
  if ((p.egg && p.eggAt < 5) || (p.green && p.greenAt < 5)) quality -= 0.2;
  const value = Math.round((recipe.price * quality) / 100) * 100;
  return {
    value,
    grade:
      quality === 1
        ? "완벽해요!"
        : quality >= 0.7
          ? "맛있어요!"
          : "조금 아쉬워요",
    reason:
      quality === 1
        ? "꼬들꼬들, 주문도 딱 맞아요."
        : "토핑은 끓을 때, 면은 초록 구간에 꺼내요.",
  };
}
export function serve(g, index, orderId = null) {
  if (g.phase !== "play") return false;
  const p = g.pots[index];
  if (!p) return false;
  const order = orderId
    ? g.orders.find((o) => o.id === orderId)
    : g.orders.find(
        (o) => o.recipe.egg === p.egg && o.recipe.green === p.green,
      );
  if (!order) {
    emit(g, "error", "이 토핑을 주문한 손님이 없어요. 주문표를 봐주세요.");
    return false;
  }
  const result = scorePot(p, order.recipe);
  if (!result.value) {
    emit(g, "error", result.reason, { pot: index });
    return false;
  }
  g.combo = result.grade === "완벽해요!" ? g.combo + 1 : 0;
  const tip =
    result.grade === "완벽해요!" ? Math.min(300, (g.combo - 1) * 100) : 0;
  const earned = result.value + tip;
  g.earned += earned;
  g.total += earned;
  g.served++;
  g.pots[index] = emptyPot();
  g.orders = g.orders.filter((o) => o.id !== order.id);
  addOrder(g);
  emit(
    g,
    "serve",
    `${result.grade} +${earned.toLocaleString("ko-KR")}원${tip ? ` (연속 팁 ${tip}원)` : ""}`,
    { pot: index, value: earned, grade: result.grade },
  );
  if (!g.practice && g.earned >= DAYS[g.day - 1].goal) {
    g.phase = g.day === 3 ? "won" : "day-clear";
    emit(
      g,
      "clear",
      g.day === 3
        ? "별 세 개 라면가게 달성! 고마워요!"
        : `${g.day}일차 목표 달성! 다음 영업도 부탁해요.`,
    );
  }
  return true;
}
export function tick(g, dt) {
  if (g.phase !== "play" || !Number.isFinite(dt) || dt <= 0) return;
  // Integrate bounded slices: CPU tests and real frames share identical heat semantics.
  let remaining = Math.min(dt, 300);
  while (remaining > 1e-8 && g.phase === "play") {
    const step = Math.min(remaining, 0.05);
    remaining -= step;
    g.clock += step;
    g.speechTime = Math.max(0, g.speechTime - step);
    if (!g.practice) g.time = Math.max(0, g.time - step);
    for (const [index, p] of g.pots.entries()) {
      if (p.ruined) continue;
      if (p.water) {
        p.age += step;
        if (p.noodle) p.noodleAge += step;
        if (p.age >= 34 || p.noodleAge >= 18) {
          p.ruined = true;
          g.combo = 0;
          emit(g, "burn", "앗, 냄비가 탔어요! 새 냄비로 교체해요.", {
            pot: index,
          });
        }
      } else if (p.noodle || p.spice) {
        p.age += step;
        if (p.age >= 6) {
          p.ruined = true;
          emit(g, "burn", "물을 넣지 않으면 냄비가 타요!", { pot: index });
        }
      }
    }
    if (!g.practice) {
      for (const order of [...g.orders]) {
        order.patience = Math.max(0, order.patience - step);
        if (order.patience <= 0) {
          g.orders = g.orders.filter((o) => o !== order);
          g.missed++;
          g.combo = 0;
          addOrder(g);
          emit(g, "miss", "손님이 떠났어요. 다음 주문은 서둘러요!");
        }
      }
      if (g.time <= 0) {
        g.phase = "failed";
        emit(g, "fail", "영업시간이 끝났어요. 목표를 향해 다시 도전!");
      }
    }
  }
}
export function togglePause(g) {
  if (g.phase === "play") {
    g.previousPhase = "play";
    g.phase = "paused";
  } else if (g.phase === "paused") {
    g.phase = "play";
  }
}
export function advance(g) {
  if (g.phase === "day-clear") startDay(g, g.day + 1);
}
