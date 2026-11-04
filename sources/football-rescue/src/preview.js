import { createGame, startGame } from './engine.js';
import { InputBuffer } from './input.js';

// Only queue real controller actions. The normal engine handles movement,
// hitstop, damage, scoring and collisions just as it does for a human player.
export function createMatchPreview(input = new InputBuffer(), loopSeconds = 18) {
  let game, elapsed, lastJump, lastKick, lastTackle, rounds = 0;
  function restart() {
    input.clear();
    game = createGame({ difficulty: 'rookie' });
    startGame(game);
    elapsed = 0;
    lastJump = -2;
    lastKick = -.4;
    lastTackle = -1;
    rounds++;
  }
  restart();
  return {
    get game() { return game; },
    get rounds() { return rounds; },
    step(dt = 1 / 60) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      if (game.mode === 'lost' || elapsed >= loopSeconds || (game.mode !== 'playing' && elapsed >= 12)) restart();
      elapsed += dt;
      if (game.mode !== 'playing') return;
      const p = game.player;
      const opponent = game.enemies.filter(e => e.hp > 0).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
      const distance = opponent ? Math.abs(opponent.x - p.x) : Infinity;
      const direction = opponent && opponent.x < p.x - 90 ? 'left' : 'right';
      input.release(direction === 'left' ? 'right' : 'left');
      input.press(direction);
      for (const action of ['jump', 'tackle', 'kick']) input.release(action);
      const danger = opponent && distance < 160 && ['windup', 'slide'].includes(opponent.action);
      if (p.y === 0 && elapsed - lastJump > 1.7 && (danger || elapsed - lastJump > 3.3)) {
        input.press('jump'); lastJump = elapsed;
      } else if (p.y === 0 && distance < 145 && elapsed - lastTackle > .95 && p.cooldown <= 0) {
        input.press('tackle'); lastTackle = elapsed;
      } else if (elapsed - lastKick > 1.05 && p.cooldown <= 0) {
        input.press('kick'); lastKick = elapsed;
      }
      input.step(game, dt);
    },
  };
}
