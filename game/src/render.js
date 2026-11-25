// Ember & Thyme — every pixel the game draws, on one 2D canvas. Food is
// drawn with canvas shapes only (no image files): each ingredient has its
// own silhouette, so a ticket, a crate, a burner and a plate all read the
// same way at a glance.

import { BURNERS, FIELD, FONT, INGREDIENTS, PALETTE, PANTRY_ORDER, STATIONS } from './config.js';
import { findMatchingOrder, itemLabel, plateProgress } from './recipes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

/** One ingredient, drawn at (x, y) with radius r, in its current state. */
export function drawIngredient(ctx, kind, state, x, y, r) {
  const def = INGREDIENTS[kind];
  const col = state === 'burnt' ? '#2b2b2b' : state === 'cooked' ? shade(def.color) : def.color;
  const dark = state === 'burnt' ? '#111111' : def.dark;
  ctx.save();
  ctx.translate(x, y);
  if (state === 'chopped') {
    // Three wedges / strips: visibly cut, not whole.
    for (let i = -1; i <= 1; i++) {
      ctx.fillStyle = i === 0 ? col : dark;
      ctx.beginPath();
      ctx.arc(i * r * 0.55, (i % 2) * r * 0.3, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  switch (kind) {
    case 'tomato':
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3f8f4f';
      ctx.beginPath(); ctx.ellipse(0, -r * 0.8, r * 0.5, r * 0.25, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.35, r * 0.25, 0, Math.PI * 2); ctx.fill();
      break;
    case 'lettuce':
      ctx.fillStyle = col;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2); ctx.fill();
      break;
    case 'mushroom':
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(0, -r * 0.25, r * 0.95, Math.PI, 0); ctx.fill();
      ctx.fillRect(-r * 0.95, -r * 0.25, r * 1.9, r * 0.25);
      ctx.fillStyle = '#f7efdd';
      ctx.fillRect(-r * 0.3, -r * 0.1, r * 0.6, r * 0.9);
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.55, r * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.65, r * 0.12, 0, Math.PI * 2); ctx.fill();
      break;
    case 'cheese':
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-r, r * 0.6); ctx.lineTo(r, r * 0.6); ctx.lineTo(r * 0.7, -r * 0.7); ctx.lineTo(-r * 0.7, -r * 0.2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(-r * 0.3, r * 0.15, r * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.1, r * 0.13, 0, Math.PI * 2); ctx.fill();
      break;
    case 'bun':
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.fill();
      ctx.fillRect(-r, 0, r * 2, r * 0.35);
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.45, r * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.55, r * 0.12, 0, Math.PI * 2); ctx.fill();
      break;
    case 'noodle':
      ctx.strokeStyle = col;
      ctx.lineWidth = r * 0.28;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, (i - 1) * r * 0.5, r * 0.6, 0.3, Math.PI * 1.4);
        ctx.stroke();
      }
      break;
    case 'patty':
      ctx.fillStyle = col;
      ellipse(ctx, 0, 0, r, r * 0.55);
      ctx.fill();
      ctx.fillStyle = dark;
      ellipse(ctx, 0, -r * 0.15, r * 0.7, r * 0.3);
      ctx.fill();
      break;
    case 'egg':
      ctx.fillStyle = '#fdf6e3';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = state === 'cooked' ? '#f5a623' : '#f7c948';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2); ctx.fill();
      break;
    default:
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function shade(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + 30);
  const g = Math.min(255, ((n >> 8) & 255) - 10);
  const b = Math.max(0, (n & 255) - 40);
  return `rgb(${r},${g},${b})`;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || FIELD.width;
    const h = canvas.clientHeight || FIELD.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform((canvas.width / FIELD.width), 0, 0, (canvas.height / FIELD.height), 0, 0);
  }

  function text(str, x, y, size, color, align = 'left', weight = '700') {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
  }

  function drawStationBase(r, top, label, highlight, labelColor) {
    ctx.fillStyle = PALETTE.counter;
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.fillStyle = top;
    roundRect(ctx, r.x + 4, r.y + 4, r.w - 8, 26, 7);
    ctx.fill();
    text(label, r.x + r.w / 2, r.y + 17, 13, labelColor || '#fff7e8', 'center');
    if (highlight) {
      ctx.strokeStyle = '#ffd76a';
      ctx.lineWidth = 3;
      roundRect(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 12);
      ctx.stroke();
    }
  }

  function drawPantry(kitchen) {
    const r = STATIONS.pantry;
    drawStationBase(r, PALETTE.counterTop, 'PANTRY  —  E: smart-grab, 1-8: pick', kitchen.nearest === 'pantry');
    PANTRY_ORDER.forEach((kind, i) => {
      const cx = r.x + 20 + i * 36;
      const cy = r.y + 56;
      drawIngredient(ctx, kind, 'raw', cx, cy, 12);
      text(String(i + 1), cx, cy - 20, 10, PALETTE.muted, 'center');
    });
  }

  function drawBoard(kitchen) {
    const r = STATIONS.board;
    drawStationBase(r, PALETTE.boardTop, 'CHOPPING BOARD  —  E: chop', kitchen.nearest === 'board');
    // Knife.
    ctx.save();
    ctx.translate(r.x + r.w - 34, r.y + 46);
    ctx.rotate(-0.5);
    ctx.fillStyle = '#c8ccd4';
    ctx.fillRect(0, -4, 34, 8);
    ctx.fillStyle = '#5d3620';
    ctx.fillRect(-14, -4, 14, 8);
    ctx.restore();
    const c = kitchen.state.chopping;
    if (c) {
      drawIngredient(ctx, c.kind, 'raw', r.x + 60, r.y + 55, 16);
      const frac = 1 - c.left / c.total;
      ctx.fillStyle = '#3a2a18';
      roundRect(ctx, r.x + 90, r.y + 50, 70, 10, 5);
      ctx.fill();
      ctx.fillStyle = PALETTE.gold;
      roundRect(ctx, r.x + 90, r.y + 50, 70 * frac, 10, 5);
      ctx.fill();
      text('CHOP!', r.x + 90, r.y + 72, 11, '#fff7e8');
    } else {
      text('tomato · lettuce · mushroom', r.x + 14, r.y + 68, 11, '#5d3620');
    }
  }

  function drawStove(kitchen) {
    const r = STATIONS.stove;
    drawStationBase(r, PALETTE.stoveTop, 'STOVE  —  E: cook / take', kitchen.nearest === 'stove');
    BURNERS.forEach((b, i) => {
      const item = kitchen.state.burners[i].item;
      ctx.fillStyle = '#22252d';
      ctx.beginPath(); ctx.arc(b.x, b.y + 18, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#565d6d';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(b.x, b.y + 18, b.r - 3, 0, Math.PI * 2); ctx.stroke();
      if (item) {
        // Flame while it cooks.
        if (item.state === 'raw') {
          ctx.fillStyle = 'rgba(255,140,40,0.85)';
          ctx.beginPath();
          ctx.moveTo(b.x - 14, b.y + 34);
          ctx.quadraticCurveTo(b.x - 20, b.y + 8, b.x, b.y - 2);
          ctx.quadraticCurveTo(b.x + 20, b.y + 8, b.x + 14, b.y + 34);
          ctx.closePath(); ctx.fill();
        }
        drawIngredient(ctx, item.kind, item.state, b.x, b.y + 18, 15);
        const frac = Math.min(1, item.t / item.cookTime);
        ctx.strokeStyle = item.state === 'burnt' ? '#e5484d' : item.state === 'cooked' ? '#58b368' : '#f5c542';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(b.x, b.y + 18, b.r + 5, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
        if (item.state === 'burnt') text('BURNT!', b.x, b.y + 52, 11, '#ff8a80', 'center');
        else if (item.state === 'cooked') text('READY', b.x, b.y + 52, 11, '#9be8a8', 'center');
      }
    });
  }

  function drawPlating(kitchen) {
    const r = STATIONS.plating;
    const ready = findMatchingOrder(kitchen.state.plate, kitchen.state.orders);
    drawStationBase(r, PALETTE.counterTop, 'PLATING  —  E: add / take plate', kitchen.nearest === 'plating');
    const px = r.x + r.w / 2;
    const py = r.y + 56;
    if (ready) {
      ctx.strokeStyle = '#ffd76a';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(px, py, 74, 30, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#f4f1ea';
    ctx.beginPath(); ctx.ellipse(px, py, 62, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9c2b2';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(px, py, 62, 24, 0, 0, Math.PI * 2); ctx.stroke();
    kitchen.state.plate.forEach((item, i) => {
      drawIngredient(ctx, item.kind, item.state, px - 36 + i * 24, py - 2, 11);
    });
    if (kitchen.state.plate.length === 0) text('empty plate — build a ticket here', r.x + 16, py, 12, '#e8c88f', 'left');
    if (ready) text(`READY: ${ready.recipe.name} ✓`, px, py - 38, 14, '#ffd76a', 'center');
  }

  function drawServe(kitchen) {
    const r = STATIONS.serve;
    drawStationBase(r, PALETTE.serveTop, 'SERVE WINDOW  —  E: serve plate', kitchen.nearest === 'serve', '#3a2a18');
    // Service bell.
    ctx.fillStyle = '#f5c542';
    ctx.beginPath(); ctx.arc(r.x + 60, r.y + 56, 16, Math.PI, 0); ctx.fill();
    ctx.fillRect(r.x + 44, r.y + 56, 32, 4);
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(r.x + 58, r.y + 36, 4, 6);
    text('Ring the bell!', r.x + 100, r.y + 56, 13, '#3a2a18');
    text('served: ' + kitchen.state.served, r.x + r.w - 16, r.y + 56, 13, '#3a2a18', 'right');
  }

  function drawTrash(kitchen) {
    const r = STATIONS.trash;
    drawStationBase(r, '#6b4a2f', 'TRASH', kitchen.nearest === 'trash');
    ctx.fillStyle = '#4a3220';
    roundRect(ctx, r.x + 34, r.y + 38, 52, 34, 6);
    ctx.fill();
    text('E: bin it', r.x + r.w / 2, r.y + 58, 11, '#d8c3a5', 'center');
  }

  function drawOrderBoard(kitchen) {
    text('ORDER BOARD', 20, 76, 15, PALETTE.text);
    const orders = kitchen.state.orders;
    if (orders.length === 0) {
      text('No tickets yet — the lunch rush is coming…', 170, 108, 15, PALETTE.muted);
      return;
    }
    orders.forEach((order, i) => {
      const x = 16 + i * 308;
      const y = 64;
      const w = 296;
      const h = 86;
      ctx.fillStyle = PALETTE.ticket;
      roundRect(ctx, x, y, w, h, 10);
      ctx.fill();
      ctx.fillStyle = order.recipe.color;
      roundRect(ctx, x, y, 10, h, 5);
      ctx.fill();
      text(order.recipe.name, x + 22, y + 18, 16, PALETTE.ticketInk);
      const done = plateProgress(kitchen.state.plate, order.recipe);
      order.recipe.needs.forEach((need, j) => {
        const ix = x + 40 + j * 78;
        drawIngredient(ctx, need.kind, need.state, ix, y + 46, 14);
        if (j < done) {
          ctx.fillStyle = '#2f7a3e';
          ctx.beginPath(); ctx.arc(ix + 12, y + 32, 8, 0, Math.PI * 2); ctx.fill();
          text('✓', ix + 12, y + 32, 11, '#fff', 'center');
        }
        text(itemLabel(need).replace('Chopped ', 'chop ').replace('Cooked ', 'cook '), ix, y + 70, 10, '#6b5a44', 'center');
      });
      // Patience bar.
      const frac = Math.max(0, order.patience / order.maxPatience);
      const barColor = frac > 0.5 ? '#58b368' : frac > 0.25 ? '#f5a623' : '#e5484d';
      ctx.fillStyle = '#e3d5bd';
      roundRect(ctx, x + 22, y + h - 12, w - 44, 7, 3);
      ctx.fill();
      ctx.fillStyle = barColor;
      roundRect(ctx, x + 22, y + h - 12, (w - 44) * frac, 7, 3);
      ctx.fill();
      text(`${Math.ceil(order.patience)}s`, x + w - 14, y + 18, 12, frac > 0.25 ? '#6b5a44' : '#e5484d', 'right');
    });
  }

  function drawChef(kitchen) {
    const s = kitchen.state;
    const c = s.chef;
    const bob = c.moving ? Math.sin(s.elapsed * 14) * 2 : 0;
    ctx.save();
    ctx.translate(c.x, c.y + bob);
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
    // Body / apron.
    ctx.fillStyle = '#fdf6e3';
    ctx.beginPath(); ctx.arc(0, 4, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e07840';
    ctx.beginPath(); ctx.arc(0, 10, 18, 0, Math.PI); ctx.fill();
    // Head + toque.
    ctx.fillStyle = '#f2c89b';
    ctx.beginPath(); ctx.arc(0, -16, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-8, -26, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -30, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, -26, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-13, -28, 26, 6);
    // Eyes look where the chef walks.
    ctx.fillStyle = '#2b1d12';
    ctx.beginPath(); ctx.arc(c.fx * 3 - 4, -16, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(c.fx * 3 + 4, -16, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Carried item floats above the toque.
    const hand = s.hand;
    if (hand && !hand.plate) {
      drawIngredient(ctx, hand.kind, hand.state, c.x, c.y - 48 + bob, 13);
      text(itemLabel(hand), c.x, c.y - 68 + bob, 11, '#fff7e8', 'center');
    } else if (hand && hand.plate) {
      ctx.fillStyle = '#f4f1ea';
      ctx.beginPath(); ctx.ellipse(c.x, c.y - 46 + bob, 26, 10, 0, 0, Math.PI * 2); ctx.fill();
      hand.plate.forEach((item, i) => {
        drawIngredient(ctx, item.kind, item.state, c.x - 14 + i * 14, c.y - 48 + bob, 7);
      });
    }
    if (s.chopping) {
      text('CHOPPING…', c.x, c.y - 68, 12, '#ffd76a', 'center');
    }
  }

  function drawHud(kitchen) {
    ctx.fillStyle = PALETTE.hud;
    ctx.fillRect(0, 0, FIELD.width, 56);
    text('EMBER & THYME', 20, 29, 20, PALETTE.gold);
    text('Rush Hour Kitchen', 218, 30, 13, PALETTE.muted);
    // Shift timer — the one you can feel.
    const t = Math.ceil(kitchen.state.timeLeft);
    const mm = Math.floor(t / 60);
    const ss = String(t % 60).padStart(2, '0');
    const urgent = kitchen.state.timeLeft <= 30;
    const pulse = urgent ? 1 + Math.sin(kitchen.state.elapsed * 8) * 0.08 : 1;
    ctx.save();
    ctx.translate(640, 29);
    ctx.scale(pulse, pulse);
    text(`⏱ ${mm}:${ss}`, 0, 0, 26, urgent ? '#ff8a80' : '#fff7e8', 'center');
    ctx.restore();
    text(`🪙 ${kitchen.state.coins} coins`, 880, 29, 18, '#ffd76a', 'right');
    text(`served ${kitchen.state.served}`, 1040, 29, 15, PALETTE.text, 'right');
    if (kitchen.state.combo > 1) text(`COMBO x${kitchen.state.combo}`, 1256, 29, 15, '#ffd76a', 'right');
  }

  function drawFloaters(kitchen) {
    for (const f of kitchen.state.floaters) {
      ctx.globalAlpha = Math.max(0, 1 - f.t / f.life);
      text(f.text, f.x, f.y - f.t * 34, 18, f.color, 'center');
      ctx.globalAlpha = 1;
    }
  }

  function drawMessage(kitchen) {
    if (kitchen.state.messageT > 0 && kitchen.state.message) {
      ctx.fillStyle = 'rgba(43,29,18,0.92)';
      const w = Math.min(720, 24 + kitchen.state.message.length * 8.4);
      roundRect(ctx, (FIELD.width - w) / 2, 566, w, 34, 17);
      ctx.fill();
      text(kitchen.state.message, FIELD.width / 2, 584, 15, '#fff7e8', 'center');
    }
  }

  function drawKitchen(kitchen) {
    // Wall and floor.
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 56, FIELD.width, 104);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(0, 56, FIELD.width, 10);
    ctx.fillStyle = PALETTE.tile;
    for (let x = 0; x < FIELD.width; x += 64) {
      ctx.fillRect(x + 2, 76, 60, 60);
    }
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 160, FIELD.width, 560);
    ctx.fillStyle = PALETTE.floorDark;
    for (let y = 200; y < 720; y += 80) ctx.fillRect(0, y, FIELD.width, 4);
    for (let x = 0; x < FIELD.width; x += 120) {
      ctx.fillRect(x, 160, 3, 560);
    }
    drawOrderBoard(kitchen);
    drawPantry(kitchen);
    drawBoard(kitchen);
    drawStove(kitchen);
    drawTrash(kitchen);
    drawPlating(kitchen);
    drawServe(kitchen);
    drawChef(kitchen);
    drawFloaters(kitchen);
    drawMessage(kitchen);
    drawHud(kitchen);
    if (kitchen.state.rush && !kitchen.state.over) {
      ctx.fillStyle = 'rgba(43,29,18,0.88)';
      roundRect(ctx, 470, 296, 340, 34, 17);
      ctx.fill();
      text('★ RUSH HOUR — tickets in fast! ★', 640, 314, 16, '#ffd76a', 'center');
    }
  }

  function overlay(title, lines, foot) {
    ctx.fillStyle = 'rgba(30,18,10,0.82)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(title, 640, 150, 52, PALETTE.gold, 'center');
    lines.forEach((line, i) => {
      text(line.text, 640, 230 + i * 34, line.size || 18, line.color || PALETTE.text, 'center');
    });
    if (foot) text(foot, 640, 230 + lines.length * 34 + 40, 18, '#ffd76a', 'center');
  }

  return {
    draw(kitchen, screen, best) {
      fit();
      ctx.clearRect(0, 0, FIELD.width, FIELD.height);
      if (screen === SCREEN_TITLE) {
        drawKitchen(kitchen);
        overlay('EMBER & THYME', [
          { text: 'Rush Hour Kitchen — a tiny bistro, one chef, a lunch rush.', size: 20 },
          { text: 'WASD / arrows to run · E to grab, chop, cook, plate & serve', size: 18 },
          { text: 'Click a station to walk there · 1–8 grab a pantry crate · M mute · P pause', size: 18 },
          { text: 'Chop it, cook it, plate it, ring the bell — before the ticket burns.', size: 18, color: '#ffd76a' },
          { text: `Best shift so far: ${best} coins`, size: 16, color: PALETTE.muted },
        ], 'Press SPACE or click to start the shift');
        return;
      }
      if (screen === SCREEN_OVER) {
        drawKitchen(kitchen);
        const s = kitchen.state;
        overlay('SHIFT OVER!', [
          { text: `Coins earned: ${s.coins}   ·   Dishes served: ${s.served}   ·   Tickets lost: ${s.failed}`, size: 20 },
          { text: `Best combo: x${s.bestCombo}   ·   Best shift: ${best} coins`, size: 18 },
          { text: 'Grade: ' + (s.served >= 12 && s.coins >= 180 ? 'S — Head Chef!' : s.served >= 9 ? 'A — Sous Chef' : s.served >= 6 ? 'B — Line Cook' : s.served >= 3 ? 'C — Commis' : 'D — Keep practising'), size: 22, color: '#ffd76a' },
        ], 'Press SPACE or click to run another shift');
        return;
      }
      drawKitchen(kitchen);
      if (screen === SCREEN_PAUSED) {
        overlay('PAUSED', [{ text: 'The tickets wait for no chef — but they will wait for you.', size: 18 }], 'Press P or click to resume');
      }
    },
  };
}
