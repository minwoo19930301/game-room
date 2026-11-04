import { step } from './engine.js';

// The browser and regression tests share this exact queue/consumption boundary.
export class InputBuffer {
  constructor() {
    this.held = new Set();
    this.edges = new Set();
  }
  press(action) {
    if (!this.held.has(action)) this.edges.add(action);
    this.held.add(action);
  }
  release(action) {
    this.held.delete(action);
  }
  clear() {
    this.held.clear();
    this.edges.clear();
  }
  step(game, dt = 1 / 60) {
    const consumed = step(game, {
      left: this.held.has('left'),
      right: this.held.has('right'),
      jump: this.edges.has('jump'),
      tackle: this.edges.has('tackle'),
      kick: this.edges.has('kick'),
      special: this.edges.has('special'),
    }, dt);
    if (consumed) this.edges.clear();
    return consumed;
  }
}
