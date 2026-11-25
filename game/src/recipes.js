// Ember & Thyme — recipes and orders. A recipe is a list of processed
// ingredients: { kind, state } where state is 'raw' (ready as grabbed),
// 'chopped' or 'cooked'. Recipes combine the same eight ingredients in
// different ways, so one pantry trip can feed two different tickets.

import { INGREDIENTS } from './config.js';

/** name, the dish, its ticket colour and the processed items it needs. */
export const RECIPES = [
  {
    id: 'sunset-noodles',
    name: 'Sunset Noodles',
    color: '#e07840',
    needs: [
      { kind: 'noodle', state: 'cooked' },
      { kind: 'tomato', state: 'chopped' },
      { kind: 'egg', state: 'cooked' },
    ],
  },
  {
    id: 'garden-crunch',
    name: 'Garden Crunch',
    color: '#58b368',
    needs: [
      { kind: 'lettuce', state: 'chopped' },
      { kind: 'tomato', state: 'chopped' },
      { kind: 'cheese', state: 'raw' },
    ],
  },
  {
    id: 'ember-stack',
    name: 'Ember Stack',
    color: '#a9762f',
    needs: [
      { kind: 'bun', state: 'raw' },
      { kind: 'patty', state: 'cooked' },
      { kind: 'cheese', state: 'raw' },
    ],
  },
  {
    id: 'forest-fry',
    name: 'Forest Fry',
    color: '#8a6f4d',
    needs: [
      { kind: 'mushroom', state: 'chopped' },
      { kind: 'egg', state: 'cooked' },
      { kind: 'cheese', state: 'raw' },
    ],
  },
  {
    id: 'golden-bunwich',
    name: 'Golden Bunwich',
    color: '#f5c542',
    needs: [
      { kind: 'bun', state: 'raw' },
      { kind: 'egg', state: 'cooked' },
      { kind: 'lettuce', state: 'chopped' },
    ],
  },
  {
    id: 'thyme-pasta',
    name: 'Thyme Pasta',
    color: '#c05a7a',
    needs: [
      { kind: 'noodle', state: 'cooked' },
      { kind: 'mushroom', state: 'chopped' },
      { kind: 'tomato', state: 'chopped' },
    ],
  },
];

/** A processed item as the player carries it: { kind, state }. */
export function itemLabel(item) {
  const base = INGREDIENTS[item.kind].name;
  if (item.state === 'chopped') return `Chopped ${base}`;
  if (item.state === 'cooked') return `Cooked ${base}`;
  if (item.state === 'burnt') return `Burnt ${base}`;
  return base;
}

/** Does the plate (array of items) match this recipe exactly, as a multiset? */
export function plateMatchesRecipe(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const left = recipe.needs.map((n) => `${n.kind}:${n.state}`).sort();
  const right = plate.map((p) => `${p.kind}:${p.state}`).sort();
  return left.every((v, i) => v === right[i]);
}

/** First order the plate completes, or null. */
export function findMatchingOrder(plate, orders) {
  for (const order of orders) {
    if (plateMatchesRecipe(plate, order.recipe)) return order;
  }
  return null;
}

/** How many of a recipe's items are already on the plate. */
export function plateProgress(plate, recipe) {
  const need = recipe.needs.map((n) => `${n.kind}:${n.state}`);
  const have = plate.map((p) => `${p.kind}:${p.state}`);
  let done = 0;
  for (const h of have) {
    const i = need.indexOf(h);
    if (i >= 0) {
      need.splice(i, 1);
      done += 1;
    }
  }
  return done;
}

/** The next raw ingredient an order still needs (for the pantry smart-grab). */
export function nextMissingRaw(orders, plate, hand) {
  for (const order of orders) {
    const need = order.recipe.needs.map((n) => `${n.kind}:${n.state}`);
    const have = plate.map((p) => `${p.kind}:${p.state}`);
    for (const h of have) {
      const i = need.indexOf(h);
      if (i >= 0) need.splice(i, 1);
    }
    if (hand && !hand.plate) {
      const i = need.indexOf(`${hand.kind}:${hand.state}`);
      if (i >= 0) need.splice(i, 1);
    }
    if (need.length) return need[0].split(':')[0];
  }
  return null;
}

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}
