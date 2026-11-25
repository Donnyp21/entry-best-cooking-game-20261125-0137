// Ember & Thyme — keyboard and pointer input. Held keys steer the chef;
// one-shot presses (interact, pause, mute) are queued as bit flags and
// taken once by the loop, so a press between frames is never lost or
// counted twice. Clicking sets a walk target; clicking a station up close
// interacts with it. Number keys 1-8 grab that pantry crate.

export const ACTION_INTERACT = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const INTERACT = new Set(['KeyE', 'Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const MUTE = new Set(['KeyM']);
const DIGITS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8'];

export function createInput(canvas) {
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let actions = 0;
  let digit = 0; // 1-8 pressed since last take, 0 = none
  let target = null; // {x, y} in logical coordinates, or null

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
  }

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) up = true;
    else if (DOWN.has(event.code)) down = true;
    else if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (INTERACT.has(event.code)) { if (!event.repeat) actions |= ACTION_INTERACT; }
    else if (PAUSE.has(event.code)) { if (!event.repeat) actions |= ACTION_PAUSE; }
    else if (MUTE.has(event.code)) { if (!event.repeat) actions |= ACTION_MUTE; }
    else if (DIGITS.includes(event.code)) { digit = DIGITS.indexOf(event.code) + 1; }
    else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
    else if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
  });
  window.addEventListener('blur', () => { up = down = left = right = false; target = null; });

  canvas.addEventListener('pointerdown', (event) => {
    target = toLogical(event);
    actions |= ACTION_INTERACT; // a click near a station interacts; elsewhere it walks
  });

  return {
    /** Normalised steering vector from held keys, or null when idle. */
    steer() {
      const x = (right ? 1 : 0) - (left ? 1 : 0);
      const y = (down ? 1 : 0) - (up ? 1 : 0);
      if (x === 0 && y === 0) return null;
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    walkTarget() { return target; },
    clearTarget() { target = null; },
    takeActions() { const t = actions; actions = 0; return t; },
    takeDigit() { const d = digit; digit = 0; return d; },
  };
}
