import { begin, nextStage, update } from './engine.mjs';

// The home preview uses the same inputs and combat rules as a human player.
// Restart the short demonstration with a different lead; never touch HP/damage.
export function createPreviewController(game, { loopSeconds = 24 } = {}) {
  let elapsed = 0, ticks = 0, lead = 0, cycles = 0;
  function restart() {
    begin(game, lead);
    update(game, { confirm: true });
    elapsed = 0;
    ticks = 0;
  }
  restart();
  return {
    get cycles() { return cycles; },
    tick(dt) {
      elapsed += dt;
      ticks++;
      if (elapsed >= loopSeconds || game.mode === 'defeat' || game.mode === 'victory') {
        lead = (lead + 1) % 3;
        cycles++;
        restart();
      }
      if (game.mode === 'stageclear') nextStage(game);
      const input = { confirm: true };
      const p = game.player;
      const target = game.enemies.filter(e => e.hp > 0 || e.down)
        .sort((a,b) => Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
      if (game.mode === 'combat') {
        if (target?.down) input.tag = ticks % 8 === 0;
        else if (target) {
          const d = target.x - p.x;
          input.left = d < -65;
          input.right = d > 65;
          input.attack = ticks % 12 === 0;
          input.special = game.energy > 27 && ticks % 42 === 0;
          input.jump = target.state === 'windup' && target.age > .25 && ticks % 15 === 0;
          input.tag = (p.hp < 35 || (ticks > 0 && ticks % 420 === 0)) && game.tagCooldown === 0 && ticks % 30 === 0;
        } else input.right = true;
      }
      update(game, input, dt);
    },
  };
}
