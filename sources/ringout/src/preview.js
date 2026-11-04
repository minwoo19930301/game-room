import { FIGHTERS, STAGES } from "./data.js";
import { createMatch, cpuInput, step, FIXED_DT } from "./engine.js";

// The first fighter uses the same CPU policy that step() uses for the opponent.
// Countdown, attacks, recovery, damage and ring-outs all remain engine-owned.
function cpuStep(match, dt) {
  const input = match.phase === "battle" && match.hitstop <= 0
    ? cpuInput(match, match.fighters[0], match.fighters[1], dt)
    : {};
  step(match, input, dt);
}

export function createPreview({ seed = 713, roundSeconds = 35, cycle = 0 } = {}) {
  let currentCycle = Math.max(0, Math.floor(cycle));
  let age = 0;
  function makeMatch() {
    const lead = currentCycle % FIGHTERS.length;
    const offset = 1 + Math.floor(currentCycle / FIGHTERS.length) % (FIGHTERS.length - 1);
    const match = createMatch({
      player: FIGHTERS[lead].id,
      cpu: FIGHTERS[(lead + offset) % FIGHTERS.length].id,
      stage: STAGES[currentCycle % STAGES.length].id,
      difficulty: "normal",
      training: false,
      seed: (seed + currentCycle * 1777) >>> 0,
    });
    // Simulate the real countdown before revealing the attract match.
    for (let i = 0; i < 3 / FIXED_DT && match.phase === "countdown"; i++) cpuStep(match, FIXED_DT);
    match.events.length = 0;
    age = 0;
    return match;
  }
  let match = makeMatch();
  return {
    get match() { return match; },
    get cycle() { return currentCycle; },
    get age() { return age; },
    tick(dt = FIXED_DT) {
      if (!Number.isFinite(dt) || dt <= 0) return false;
      const seconds = Math.min(.05, dt);
      let changed = false;
      if (match.phase === "result" || age >= roundSeconds) {
        currentCycle++;
        match = makeMatch();
        changed = true;
      }
      cpuStep(match, seconds);
      age += seconds;
      return changed;
    },
  };
}
