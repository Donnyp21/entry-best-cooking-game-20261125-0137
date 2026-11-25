// Ember & Thyme — the kitchen simulation: the chef, the stations, the
// burners, the orders and the scoring. Rendering lives in render.js; this
// file only decides what happens when the chef acts and time passes.

import {
  BURNERS, CHEF, INGREDIENTS, PANTRY_ORDER, SHIFT_SECONDS, STATIONS,
} from './config.js';
import {
  RECIPES, findMatchingOrder, itemLabel, nextMissingRaw, plateProgress,
} from './recipes.js';

const MAX_ORDERS = 4;
const PLATE_MAX = 4;

function rectDistance(px, py, r) {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}

function collides(x, y) {
  for (const key of Object.keys(STATIONS)) {
    const r = STATIONS[key];
    if (x + CHEF.radius > r.x && x - CHEF.radius < r.x + r.w
      && y + CHEF.radius > r.y && y - CHEF.radius < r.y + r.h) return true;
  }
  return false;
}

export function createKitchen(random) {
  const state = {
    chef: { x: 640, y: 430, fx: 0, fy: 1, moving: false },
    hand: null,
    plate: [],
    burners: BURNERS.map(() => ({ item: null })),
    orders: [],
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    served: 0,
    failed: 0,
    combo: 0,
    bestCombo: 0,
    spawnTimer: 2,
    nextOrderId: 1,
    rush: false,
    over: false,
    chopping: null, // { kind, left, total }
    chopTick: 0,
    shake: 0,
    floaters: [],
    message: '',
    messageT: 0,
  };

  function floater(text, x, y, color) {
    state.floaters.push({ text, x, y, t: 0, life: 1.4, color });
  }

  function say(text, seconds = 2.2) {
    state.message = text;
    state.messageT = seconds;
  }

  function spawnOrder() {
    const recipe = random.pick(RECIPES);
    const maxPatience = 55 - Math.min(15, state.elapsed / 10);
    state.orders.push({
      id: state.nextOrderId,
      recipe,
      patience: maxPatience,
      maxPatience,
    });
    state.nextOrderId += 1;
  }

  function nearestStation() {
    let best = null;
    let bestD = 86;
    for (const key of Object.keys(STATIONS)) {
      const d = rectDistance(state.chef.x, state.chef.y, STATIONS[key]);
      if (d < bestD) { bestD = d; best = key; }
    }
    return best;
  }

  function grabIngredient(kind, audio) {
    if (state.hand) { say('Hands full — serve or trash it first.'); return; }
    state.hand = { kind, state: 'raw' };
    audio.pickup();
    floater(`+ ${INGREDIENTS[kind].name}`, state.chef.x, state.chef.y - 40, '#fff7e8');
  }

  function interact(audio) {
    const station = nearestStation();
    if (!station) return;
    const chef = state.chef;

    if (station === 'pantry') {
      if (state.hand) { say('Hands full — serve or trash it first.'); return; }
      const kind = nextMissingRaw(state.orders, state.plate, null)
        || random.pick(PANTRY_ORDER);
      grabIngredient(kind, audio);
      return;
    }

    if (station === 'board') {
      if (state.chopping) return;
      if (!state.hand || state.hand.plate) { say('Bring something to chop: tomato, lettuce or mushroom.'); return; }
      const def = INGREDIENTS[state.hand.kind];
      if (!def.chop || state.hand.state !== 'raw') { say(`${itemLabel(state.hand)} needs no chopping.`); return; }
      state.chopping = { kind: state.hand.kind, left: def.chop, total: def.chop };
      state.hand = null;
      audio.chop();
      return;
    }

    if (station === 'stove') {
      if (state.hand && !state.hand.plate) {
        const def = INGREDIENTS[state.hand.kind];
        if (!def.cook || state.hand.state !== 'raw') {
          say(`${itemLabel(state.hand)} does not go on the stove.`);
          return;
        }
        const free = state.burners.find((b) => !b.item);
        if (!free) { say('Both burners are busy.'); return; }
        free.item = { kind: state.hand.kind, state: 'raw', t: 0, cookTime: def.cook, dinged: false };
        state.hand = null;
        audio.sizzle();
        return;
      }
      if (!state.hand) {
        const busy = state.burners.find((b) => b.item);
        if (!busy) { say('Nothing on the stove yet.'); return; }
        state.hand = { kind: busy.item.kind, state: busy.item.state };
        busy.item = null;
        audio.pickup();
      }
      return;
    }

    if (station === 'plating') {
      if (state.hand && state.hand.plate) {
        state.plate = state.hand.plate;
        state.hand = null;
        audio.drop();
        return;
      }
      if (state.hand) {
        if (state.plate.length >= PLATE_MAX) { say('The plate is full.'); return; }
        state.plate.push(state.hand);
        state.hand = null;
        audio.drop();
        return;
      }
      if (state.plate.length === 0) { say('Plate is empty — add ingredients first.'); return; }
      const match = findMatchingOrder(state.plate, state.orders);
      if (match) {
        state.hand = { plate: state.plate.slice() };
        state.plate = [];
        audio.pickup();
        say(`${match.recipe.name} is ready — take it to the SERVE window!`);
        return;
      }
      // Incomplete plate: take the last item back off.
      state.hand = state.plate.pop();
      audio.pickup();
      return;
    }

    if (station === 'serve') {
      if (!state.hand || !state.hand.plate) { say('Bring a finished plate to serve.'); return; }
      const order = findMatchingOrder(state.hand.plate, state.orders);
      if (!order) {
        state.shake = 0.35;
        audio.fail();
        say('No ticket matches this plate — check the order board!');
        return;
      }
      const tip = Math.round(8 * (order.patience / order.maxPatience));
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      const earned = 10 + tip + (state.combo > 1 ? (state.combo - 1) * 2 : 0);
      state.coins += earned;
      state.served += 1;
      state.orders = state.orders.filter((o) => o.id !== order.id);
      state.hand = null;
      audio.serve();
      floater(`+${earned} coins`, STATIONS.serve.x + 160, STATIONS.serve.y - 24, '#f5c542');
      if (state.combo > 1) floater(`COMBO x${state.combo}!`, chef.x, chef.y - 56, '#ffd76a');
      return;
    }

    if (station === 'trash') {
      if (state.hand) { state.hand = null; audio.drop(); say('Binned.'); return; }
      if (state.plate.length) { state.plate = []; audio.drop(); say('Plate cleared.'); }
      return;
    }
  }

  function update(dt, input, audio) {
    if (state.over) return;
    state.elapsed += dt;
    state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
    if (state.timeLeft <= 0) {
      state.over = true;
      return;
    }
    if (!state.rush && state.timeLeft <= 30) {
      state.rush = true;
      audio.rush();
      say('RUSH HOUR — tickets are coming in fast!');
    }
    if (state.messageT > 0) state.messageT -= dt;
    if (state.shake > 0) state.shake -= dt;
    for (const f of state.floaters) f.t += dt;
    state.floaters = state.floaters.filter((f) => f.t < f.life);

    // Chopping channels the chef: hold still, knife does the work.
    if (state.chopping) {
      const c = state.chopping;
      c.left -= dt;
      state.chopTick -= dt;
      if (state.chopTick <= 0) { audio.chop(); state.chopTick = 0.4; }
      if (c.left <= 0) {
        state.hand = { kind: c.kind, state: 'chopped' };
        state.chopping = null;
        audio.chopDone();
      }
      return;
    }

    // Burners cook (and burn) on their own — plan around them.
    for (const burner of state.burners) {
      const item = burner.item;
      if (!item) continue;
      item.t += dt;
      if (item.state === 'raw' && item.t >= item.cookTime) {
        item.state = 'cooked';
        if (!item.dinged) { item.dinged = true; audio.cooked(); }
      } else if (item.state === 'cooked' && item.t >= item.cookTime + 5) {
        item.state = 'burnt';
      }
    }

    // Orders lose patience and expire.
    for (const order of state.orders) order.patience -= dt;
    const expired = state.orders.filter((o) => o.patience <= 0);
    if (expired.length) {
      state.orders = state.orders.filter((o) => o.patience > 0);
      state.combo = 0;
      state.failed += expired.length;
      state.coins = Math.max(0, state.coins - 3 * expired.length);
      audio.fail();
      say(`Ticket expired — -${3 * expired.length} coins, combo lost.`);
    }

    // New tickets arrive faster as the shift wears on.
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.orders.length < MAX_ORDERS) {
      spawnOrder();
      const base = state.rush ? 7 : Math.max(9, 14 - state.elapsed / 60);
      state.spawnTimer = base + random.next() * 3;
    }

    // Movement: keys steer, a click walks; stations are solid.
    const chef = state.chef;
    let vx = 0;
    let vy = 0;
    const steer = input.steer();
    if (steer) {
      vx = steer.x;
      vy = steer.y;
      input.clearTarget();
    } else {
      const target = input.walkTarget();
      if (target) {
        const dx = target.x - chef.x;
        const dy = target.y - chef.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 10) input.clearTarget();
        else { vx = dx / dist; vy = dy / dist; }
      }
    }
    chef.moving = vx !== 0 || vy !== 0;
    if (chef.moving) { chef.fx = vx; chef.fy = vy; }
    const nx = chef.x + vx * CHEF.speed * dt;
    const ny = chef.y + vy * CHEF.speed * dt;
    const cx = Math.max(24 + CHEF.radius, Math.min(1256 - CHEF.radius, nx));
    const cy = Math.max(158 + CHEF.radius, Math.min(696 - CHEF.radius, ny));
    if (!collides(cx, chef.y)) chef.x = cx;
    if (!collides(chef.x, cy)) chef.y = cy;

    // Pantry number keys grab a specific crate.
    const digit = input.takeDigit();
    if (digit >= 1 && digit <= PANTRY_ORDER.length && nearestStation() === 'pantry') {
      grabIngredient(PANTRY_ORDER[digit - 1], audio);
    }

    const actions = input.takeActions();
    if (actions & 1) interact(audio);
  }

  return {
    state,
    update,
    nearestStation,
    spawnOrder,
    reset() {
      const fresh = createKitchen(random);
      Object.assign(state, fresh.state);
    },
  };
}

/** Grade for the end-of-shift screen, from coins served. */
export function shiftGrade(coins, served) {
  if (served >= 12 && coins >= 180) return 'S — Head Chef!';
  if (served >= 9 && coins >= 130) return 'A — Sous Chef';
  if (served >= 6 && coins >= 80) return 'B — Line Cook';
  if (served >= 3) return 'C — Commis';
  return 'D — Keep practising';
}

export { plateProgress };
