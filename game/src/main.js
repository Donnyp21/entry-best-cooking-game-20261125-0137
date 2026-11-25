// Ember & Thyme — boot and the one loop: input is read every frame, the
// kitchen advances in fixed 1/60 s steps (several in a slow frame, none in
// a fast one), and the renderer paints what is there. The game moves
// between four screens: title, play, paused and shift over.
//
// ?seed=N fixes the ticket pattern. ?shot=kitchen|rush|serve|title (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createKitchen, shiftGrade } from './kitchen.js';
import { ACTION_INTERACT, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const kitchen = createKitchen(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, kitchen, seed);
  let painted = 0;
  function paint() {
    renderer.draw(kitchen, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let lastTickSecond = -1;

  function announce(message) {
    status.textContent = message;
  }

  function startShift() {
    kitchen.reset();
    accumulator = 0;
    lastTickSecond = -1;
    screen = SCREEN_PLAY;
    announce('Shift started. Serve tickets before their patience runs out.');
  }

  function endShift() {
    screen = SCREEN_OVER;
    if (kitchen.state.coins > best) {
      best = kitchen.state.coins;
      saveBest(best);
    }
    announce(
      `Shift over. ${kitchen.state.coins} coins, ${kitchen.state.served} dishes served. `
      + `Grade: ${shiftGrade(kitchen.state.coins, kitchen.state.served)}. Best ${best}.`,
    );
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound muted.' : 'Sound on.');
    }
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      if (actions & ACTION_INTERACT) {
        audio.unlock();
        startShift();
      }
      renderer.draw(kitchen, screen, best);
      return;
    }
    if (actions & ACTION_PAUSE) {
      screen = screen === SCREEN_PAUSED ? SCREEN_PLAY : SCREEN_PAUSED;
      announce(screen === SCREEN_PAUSED ? 'Paused.' : 'Playing.');
    }
    if (screen === SCREEN_PAUSED) {
      renderer.draw(kitchen, screen, best);
      return;
    }
    audio.unlock();
    accumulator += elapsed;
    while (accumulator >= STEP) {
      kitchen.update(STEP, input, audio);
      accumulator -= STEP;
    }
    // The timer ticks once a second in the last ten seconds — you feel it.
    const sec = Math.ceil(kitchen.state.timeLeft);
    if (sec !== lastTickSecond) {
      lastTickSecond = sec;
      if (sec <= 10 && sec > 0) audio.tick();
    }
    if (kitchen.state.over) endShift();
    renderer.draw(kitchen, screen, best);
  }

  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
