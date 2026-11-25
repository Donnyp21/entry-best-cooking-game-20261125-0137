// Ember & Thyme — deterministic staged scenes for screenshots. Each shot
// builds a real kitchen state (real orders, a real plate mid-assembly, a
// real burner mid-cook) and paints it twice, then sets window.__shotReady.
// ?shot=kitchen|rush|serve|title with &seed=N.

import { RECIPES } from './recipes.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function stageKitchen(kitchen, seed) {
  const s = kitchen.state;
  s.orders = [
    { id: 1, recipe: RECIPES[0], patience: 38, maxPatience: 55 }, // Sunset Noodles
    { id: 2, recipe: RECIPES[2], patience: 22, maxPatience: 50 }, // Ember Stack
    { id: 3, recipe: RECIPES[1], patience: 47, maxPatience: 55 }, // Garden Crunch
  ];
  // Dish mid-assembly: two of three Sunset Noodles items already plated.
  s.plate = [
    { kind: 'noodle', state: 'cooked' },
    { kind: 'tomato', state: 'chopped' },
  ];
  // A patty sizzling on the stove for the Ember Stack.
  s.burners[0].item = { kind: 'patty', state: 'raw', t: 3.4, cookTime: 5.5, dinged: false };
  // Chef mid-kitchen carrying the last piece: a cooked egg.
  s.chef.x = 640;
  s.chef.y = 430;
  s.chef.fx = 0;
  s.chef.fy = -1;
  s.hand = { kind: 'egg', state: 'cooked' };
  s.timeLeft = 122;
  s.elapsed = 28;
  s.coins = 34;
  s.served = 2;
  s.combo = 3;
  s.bestCombo = 3;
  s.spawnTimer = 6;
  s.message = 'Egg is cooked — plate it, then ring the bell!';
  s.messageT = 99;
  void seed;
}

function stageRush(kitchen) {
  stageKitchen(kitchen);
  const s = kitchen.state;
  s.orders = [
    { id: 1, recipe: RECIPES[0], patience: 12, maxPatience: 55 },
    { id: 2, recipe: RECIPES[2], patience: 9, maxPatience: 50 },
    { id: 3, recipe: RECIPES[4], patience: 18, maxPatience: 48 },
    { id: 4, recipe: RECIPES[5], patience: 31, maxPatience: 52 },
  ];
  s.plate = [
    { kind: 'bun', state: 'raw' },
    { kind: 'patty', state: 'cooked' },
    { kind: 'cheese', state: 'raw' },
  ];
  s.burners[0].item = { kind: 'egg', state: 'cooked', t: 4.2, cookTime: 4.0, dinged: true };
  s.burners[1].item = { kind: 'noodle', state: 'raw', t: 2.1, cookTime: 4.5, dinged: false };
  s.chef.x = 700;
  s.chef.y = 520;
  s.hand = { plate: s.plate.slice() };
  s.plate = [];
  s.timeLeft = 24;
  s.elapsed = 126;
  s.coins = 148;
  s.served = 9;
  s.combo = 5;
  s.bestCombo = 5;
  s.rush = true;
  s.message = 'Ember Stack ready — to the SERVE window!';
  s.messageT = 99;
  s.floaters = [{ text: '+18 coins', x: 1100, y: 580, t: 0.2, life: 1.4, color: '#f5c542' }];
}

function stageServe(kitchen) {
  stageKitchen(kitchen);
  const s = kitchen.state;
  s.plate = [
    { kind: 'lettuce', state: 'chopped' },
    { kind: 'tomato', state: 'chopped' },
    { kind: 'cheese', state: 'raw' },
  ];
  s.burners[0].item = { kind: 'noodle', state: 'cooked', t: 4.6, cookTime: 4.5, dinged: true };
  s.chef.x = 1010;
  s.chef.y = 520;
  s.chef.fx = 1;
  s.chef.fy = 0;
  s.hand = { plate: s.plate.slice() };
  s.plate = [];
  s.timeLeft = 96;
  s.elapsed = 54;
  s.coins = 62;
  s.served = 4;
  s.combo = 2;
  s.message = 'Garden Crunch ready — ring the bell!';
  s.messageT = 99;
}

export function stageShot(name, kitchen, seed) {
  if (name === 'rush') stageRush(kitchen);
  else if (name === 'serve') stageServe(kitchen);
  else stageKitchen(kitchen, seed);
  return {
    screen: name === 'title' ? SCREEN_TITLE : SCREEN_PLAY,
    best: 148,
  };
}

export { SCREEN_OVER };
