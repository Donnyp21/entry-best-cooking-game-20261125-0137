// Ember & Thyme — a tiny seeded random source so staged screenshots and
// play sessions are reproducible from ?seed=N.

export function createRandom(seed) {
  let state = (seed >>> 0) || 1;
  return {
    next() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    },
    int(n) {
      return Math.floor(this.next() * n);
    },
    pick(list) {
      return list[this.int(list.length)];
    },
  };
}
