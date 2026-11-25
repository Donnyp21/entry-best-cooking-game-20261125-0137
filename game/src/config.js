// Ember & Thyme — Rush Hour Kitchen: every tuning number, colour and station
// in one place. The playfield is a fixed 1280x720 logical area; the renderer
// scales it to the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const SHIFT_SECONDS = 150;
export const RUSH_SECONDS = 30;

export const CHEF = { radius: 22, speed: 310 };

export const STATIONS = {
  // Top wall: pantry crates, chopping board, two-burner stove.
  pantry: { x: 16, y: 168, w: 296, h: 84, label: 'PANTRY' },
  board: { x: 336, y: 168, w: 190, h: 84, label: 'CHOPPING BOARD' },
  stove: { x: 550, y: 168, w: 230, h: 84, label: 'STOVE' },
  // Bottom wall: trash, plating counter, serve window.
  trash: { x: 16, y: 620, w: 120, h: 84, label: 'TRASH' },
  plating: { x: 360, y: 620, w: 540, h: 84, label: 'PLATING' },
  serve: { x: 940, y: 620, w: 324, h: 84, label: 'SERVE WINDOW' },
};

export const BURNERS = [
  { x: 590, y: 206, r: 26 },
  { x: 700, y: 206, r: 26 },
];

/** Ingredients: kind -> display, colour, what it needs, cook/chop seconds. */
export const INGREDIENTS = {
  tomato: { name: 'Tomato', color: '#e5484d', dark: '#a92c31', chop: 1.2, cook: 0 },
  lettuce: { name: 'Lettuce', color: '#58b368', dark: '#2f7a3e', chop: 1.0, cook: 0 },
  mushroom: { name: 'Mushroom', color: '#d9c7a7', dark: '#8a6f4d', chop: 1.3, cook: 0 },
  cheese: { name: 'Cheese', color: '#f5c542', dark: '#c08a12', chop: 0, cook: 0 },
  bun: { name: 'Bun', color: '#e8b06a', dark: '#a9762f', chop: 0, cook: 0 },
  noodle: { name: 'Noodle', color: '#f2d06b', dark: '#b98a1d', chop: 0, cook: 4.5 },
  patty: { name: 'Patty', color: '#8a5a3b', dark: '#5d3a24', chop: 0, cook: 5.5 },
  egg: { name: 'Egg', color: '#fdf6e3', dark: '#d8c690', chop: 0, cook: 4.0 },
};

/** Pantry crates in order, with the number key that grabs each one. */
export const PANTRY_ORDER = ['tomato', 'lettuce', 'mushroom', 'cheese', 'bun', 'noodle', 'patty', 'egg'];

export const PALETTE = {
  wall: '#7a4a2b',
  wallTop: '#5d3620',
  floor: '#c98f4e',
  floorDark: '#b57a3e',
  tile: '#f3e3c8',
  counter: '#8d5a33',
  counterTop: '#d9a05b',
  boardTop: '#e8c88f',
  stoveTop: '#3a3f4a',
  serveTop: '#e8e0d0',
  hud: '#2b1d12',
  text: '#fff7e8',
  muted: '#d8c3a5',
  gold: '#f5c542',
  red: '#e5484d',
  green: '#58b368',
  ticket: '#fff8e6',
  ticketInk: '#3a2a18',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const BEST_KEY = 'ember-thyme.best-coins';
