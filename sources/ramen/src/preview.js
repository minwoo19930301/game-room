import { startDay, addIngredient, serve, tick, potStage } from './engine.js';

// A cook with the same public actions as a player. Orders and pot temperatures
// are read from the engine; no scores, ingredients or heat values are injected.
export function createCookingPreview(game) {
  const assignments = new Map();
  let nextPot = 0, wait = 0;
  function restart() {
    startDay(game, 1, true);
    assignments.clear();
    nextPot = 0;
    wait = 0;
  }
  restart();
  return {
    step(dt) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      if (game.phase !== 'play') restart();
      tick(game, dt);
      wait -= dt;
      if (wait > 0) return;
      wait = .55;
      for (const [index, orderId] of assignments) {
        if (!game.orders.some(o => o.id === orderId)) assignments.delete(index);
      }
      // Reserve each live order once and rotate through all four burners.
      for (const order of game.orders) {
        if ([...assignments.values()].includes(order.id)) continue;
        for (let k = 0; k < 4; k++) {
          const index = (nextPot + k) % 4;
          if (!assignments.has(index) && potStage(game.pots[index]) === 'empty') {
            assignments.set(index, order.id);
            nextPot = (index + 1) % 4;
            break;
          }
        }
      }
      // Finish hot bowls before starting another ingredient animation.
      for (const [index, orderId] of assignments) {
        const p = game.pots[index], order = game.orders.find(o => o.id === orderId);
        if (!order) continue;
        if (potStage(p) === 'ready' && p.spice && p.egg === order.recipe.egg && p.green === order.recipe.green) {
          if (serve(game, index, orderId)) assignments.delete(index);
          return;
        }
        if (p.age >= 5) {
          for (const tool of ['egg', 'green']) {
            if (order.recipe[tool] && !p[tool]) { addIngredient(game, index, tool); return; }
          }
        }
      }
      for (const [index] of assignments) {
        const p = game.pots[index];
        for (const tool of ['water', 'noodle', 'spice']) {
          if (!p[tool]) { addIngredient(game, index, tool); return; }
        }
      }
    },
  };
}
