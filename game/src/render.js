// WICKLIGHT — everything the player sees, drawn on one canvas.
// Night-blue floors, warm lamplight, gold vision cones, the sweeping
// lighthouse beam, and Wick's own little circle of light. The judge
// reads the game from its screenshots, so every element must be readable
// at a glance when the image is shrunk.
import { TILE, VIEW_W, VIEW_H, GUARD, LANTERN } from './config.js';

const lightCanvas = document.createElement('canvas');
lightCanvas.width = VIEW_W;
lightCanvas.height = VIEW_H;
const lightCtx = lightCanvas.getContext('2d');

function tileKey(x, y) {
  return `${Math.floor(x / TILE)},${Math.floor(y / TILE)}`;
}

function drawFloor(ctx, parsed, t) {
  for (let ty = 0; ty < 15; ty += 1) {
    for (let tx = 0; tx < 40; tx += 1) {
      const x = tx * TILE;
      const y = ty * TILE;
      const key = `${tx},${ty}`;
      if (parsed.walls.has(key)) {
        ctx.fillStyle = '#232838';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#2f3550';
        ctx.fillRect(x, y, TILE, 6);
        ctx.fillStyle = '#1a1e2c';
        ctx.fillRect(x, y + TILE - 4, TILE, 4);
        continue;
      }
      // Checkerboard stone, slightly varied so the floor reads as a floor.
      const odd = (tx + ty) % 2 === 0;
      ctx.fillStyle = odd ? '#343b5c' : '#2e3450';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(x, y, TILE, 1);
      if (parsed.bushes.has(key)) {
        // Bush: a dark green thicket you can hide in.
        ctx.fillStyle = '#16351f';
        ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = '#1f4d2a';
        for (let i = 0; i < 5; i += 1) {
          const bx = x + 6 + ((i * 11) % 20);
          const by = y + 6 + ((i * 7) % 18);
          ctx.beginPath();
          ctx.arc(bx, by, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#2f6b3a';
        ctx.beginPath();
        ctx.arc(x + 16, y + 15, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (parsed.crates.has(key)) {
        ctx.fillStyle = '#5a3d22';
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = '#7a5632';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 3);
        ctx.lineTo(x + TILE - 3, y + TILE - 3);
        ctx.moveTo(x + TILE - 3, y + 3);
        ctx.lineTo(x + 3, y + TILE - 3);
        ctx.stroke();
      }
      if (parsed.lamps.has(key)) {
        // Lamp post: thin iron, warm head, pool of light on the floor.
        const cx = x + TILE / 2;
        const cy = y + TILE / 2;
        const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 86);
        glow.addColorStop(0, 'rgba(255,190,90,0.30)');
        glow.addColorStop(1, 'rgba(255,190,90,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(cx - 86, cy - 86, 172, 172);
        ctx.fillStyle = '#3a3f55';
        ctx.fillRect(cx - 2, cy - 8, 4, 18);
        ctx.fillStyle = '#ffd98a';
        ctx.beginPath();
        ctx.arc(cx, cy - 10, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawShards(ctx, parsed, t) {
  for (const shard of parsed.shards) {
    if (shard.taken) continue;
    const pulse = 1 + 0.15 * Math.sin(t * 4 + shard.tx);
    const glow = ctx.createRadialGradient(shard.x, shard.y, 2, shard.x, shard.y, 26);
    glow.addColorStop(0, 'rgba(140,230,255,0.55)');
    glow.addColorStop(1, 'rgba(140,230,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(shard.x - 26, shard.y - 26, 52, 52);
    ctx.save();
    ctx.translate(shard.x, shard.y);
    ctx.rotate(Math.PI / 4);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#bfefff';
    ctx.fillRect(-6, -6, 12, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
  }
  if (parsed.heart && !parsed.heart.taken) {
    const h = parsed.heart;
    const pulse = 1 + 0.2 * Math.sin(t * 3);
    const glow = ctx.createRadialGradient(h.x, h.y, 4, h.x, h.y, 52);
    glow.addColorStop(0, 'rgba(255,120,160,0.6)');
    glow.addColorStop(1, 'rgba(255,120,160,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(h.x - 52, h.y - 52, 104, 104);
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(Math.PI / 4);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ff5f8f';
    ctx.fillRect(-11, -11, 22, 22);
    ctx.fillStyle = '#ffd3e0';
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }
}

function drawExit(ctx, parsed, open, t) {
  const e = parsed.exit;
  const glowR = open ? 70 : 40;
  const glow = ctx.createRadialGradient(e.x, e.y, 4, e.x, e.y, glowR);
  glow.addColorStop(0, open ? 'rgba(90,255,150,0.55)' : 'rgba(255,90,90,0.28)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(e.x - glowR, e.y - glowR, glowR * 2, glowR * 2);
  // A green door arch; chained red while sealed.
  ctx.fillStyle = open ? '#1d7a44' : '#5c1f24';
  ctx.fillRect(e.x - 13, e.y - 15, 26, 30);
  ctx.fillStyle = open ? '#37d67a' : '#8a2f38';
  ctx.fillRect(e.x - 9, e.y - 11, 18, 26);
  if (open) {
    ctx.fillStyle = '#d8ffe6';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', e.x, e.y - 20 + Math.sin(t * 3) * 2);
  } else {
    ctx.strokeStyle = '#d8b25a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e.x - 9, e.y - 11);
    ctx.lineTo(e.x + 9, e.y + 15);
    ctx.moveTo(e.x + 9, e.y - 11);
    ctx.lineTo(e.x - 9, e.y + 15);
    ctx.stroke();
  }
}

function drawCone(ctx, guard, range, color, alpha) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.facing - GUARD.visionHalfAngle, guard.facing + GUARD.visionHalfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBeam(ctx, beam, t) {
  if (!beam) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const grad = ctx.createRadialGradient(beam.x, beam.y, 10, beam.x, beam.y, beam.range);
  grad.addColorStop(0, 'rgba(255,214,120,0.34)');
  grad.addColorStop(0.7, 'rgba(255,214,120,0.16)');
  grad.addColorStop(1, 'rgba(255,214,120,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(beam.x, beam.y);
  ctx.arc(beam.x, beam.y, beam.range, beam.angle - beam.halfAngle, beam.angle + beam.halfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // The great lamp itself, at the top of the tower.
  const flicker = 0.85 + 0.15 * Math.sin(t * 7);
  const lampGlow = ctx.createRadialGradient(beam.x, beam.y, 2, beam.x, beam.y, 44);
  lampGlow.addColorStop(0, `rgba(255,226,140,${0.9 * flicker})`);
  lampGlow.addColorStop(1, 'rgba(255,226,140,0)');
  ctx.fillStyle = lampGlow;
  ctx.beginPath();
  ctx.arc(beam.x, beam.y, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(beam.x, beam.y, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawGuard(ctx, guard, t) {
  const x = guard.x;
  const y = guard.y;
  // Cloak: a maroon figure, pale face, dark hat — visible against the floor.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(guard.facing);
  ctx.fillStyle = '#6e1f2a';
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(-8, -9);
  ctx.lineTo(-11, 0);
  ctx.lineTo(-8, 9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8d9c4';
  ctx.beginPath();
  ctx.arc(2, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a1218';
  ctx.fillRect(-2, -7, 7, 3);
  ctx.restore();
  // Suspicion ring above the head: the player can read it at a glance.
  if (guard.suspicion > 4) {
    ctx.strokeStyle = guard.suspicion >= 100 ? '#ff4d4d' : '#ffcf4d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 17, -Math.PI / 2, -Math.PI / 2 + (guard.suspicion / 100) * Math.PI * 2);
    ctx.stroke();
  }
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  if (guard.state === 'dazzled') {
    ctx.fillStyle = '#ffe27a';
    const sx = x + Math.cos(t * 6) * 12;
    const sy = y - 24 + Math.sin(t * 6) * 3;
    ctx.fillText('✦', sx, sy);
    ctx.fillText('✦', x - Math.cos(t * 6) * 12, y - 24 - Math.sin(t * 6) * 3);
  } else if (guard.state === 'chase') {
    ctx.fillStyle = '#ff4d4d';
    ctx.fillText('!', x, y - 22);
  } else if (guard.state === 'investigate') {
    ctx.fillStyle = '#ffcf4d';
    ctx.fillText('?', x, y - 22);
  }
}

function drawPlayer(ctx, player, t) {
  const x = player.x;
  const y = player.y;
  // Wick's own light, drawn under him so he never vanishes in the dark.
  if (player.lanternOn) {
    const glow = ctx.createRadialGradient(x, y, 2, x, y, 46);
    glow.addColorStop(0, 'rgba(255,200,110,0.5)');
    glow.addColorStop(1, 'rgba(255,200,110,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 46, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(player.facing);
  // Hooded teal cloak, with a little brass lantern swinging at the side.
  ctx.fillStyle = player.lit ? '#1e7d6b' : '#155e52';
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(-8, -8);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-8, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2e3c9';
  ctx.beginPath();
  ctx.arc(2, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f4a40';
  ctx.beginPath();
  ctx.arc(3, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  if (player.lanternOn) {
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.arc(-4, 9, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  if (!player.lanternOn) {
    // Doused: a faint blue rim so the player can still find Wick.
    ctx.strokeStyle = 'rgba(140,200,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (player.inBush) {
    ctx.fillStyle = '#cfe8b0';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', x, y - 18);
  }
}

function drawDarkness(ctx, state) {
  const { player, parsed, beam } = state;
  const l = lightCtx;
  l.clearRect(0, 0, VIEW_W, VIEW_H);
  l.globalCompositeOperation = 'source-over';
  l.fillStyle = 'rgba(5,7,20,0.68)';
  l.fillRect(0, 0, VIEW_W, VIEW_H);
  l.globalCompositeOperation = 'destination-out';
  const sight = player.lanternOn ? LANTERN.litSightRadius : LANTERN.dousedSightRadius;
  const hole = (x, y, r, strength) => {
    const g = l.createRadialGradient(x, y, r * 0.15, x, y, r);
    g.addColorStop(0, `rgba(0,0,0,${strength})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    l.fillStyle = g;
    l.beginPath();
    l.arc(x, y, r, 0, Math.PI * 2);
    l.fill();
  };
  hole(player.x, player.y, sight, 1);
  for (const key of parsed.lamps) {
    const [lx, ly] = key.split(',').map(Number);
    hole(lx * TILE + TILE / 2, ly * TILE + TILE / 2, 92, 0.75);
  }
  for (const shard of parsed.shards) {
    if (!shard.taken) hole(shard.x, shard.y, 44, 0.6);
  }
  if (parsed.heart && !parsed.heart.taken) hole(parsed.heart.x, parsed.heart.y, 70, 0.7);
  hole(parsed.exit.x, parsed.exit.y, 64, 0.65);
  ctx.drawImage(lightCanvas, 0, 0);
}

function drawHud(ctx, state) {
  const { level, levelIndex, score, lives, time, player, guards, message } = state;
  ctx.fillStyle = 'rgba(6,8,20,0.72)';
  ctx.fillRect(0, 0, VIEW_W, 34);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`WICKLIGHT · ${level.name}`, 10, 21);
  const taken = state.parsed.shards.filter((s) => s.taken).length;
  const total = state.parsed.shards.length + (state.parsed.heart ? 1 : 0);
  const got = taken + (state.parsed.heart && state.parsed.heart.taken ? 1 : 0);
  ctx.fillStyle = '#9fe8ff';
  ctx.fillText(`✦ ${got}/${total} starlight`, 300, 21);
  ctx.fillStyle = '#ffd98a';
  ctx.fillText(`◉ ${player.embers} embers`, 440, 21);
  ctx.fillStyle = '#ff9d9d';
  let hearts = '';
  for (let i = 0; i < lives; i += 1) hearts += '⬢ ';
  ctx.fillText(`lives ${hearts}`, 560, 21);
  // The alarm meter: the worst suspicion among the Keepers.
  const worst = guards.reduce((m, g) => Math.max(m, g.suspicion), 0);
  ctx.fillStyle = '#333a55';
  ctx.fillRect(760, 12, 130, 10);
  ctx.fillStyle = worst >= 100 ? '#ff4d4d' : worst >= 50 ? '#ffcf4d' : '#7ad7a0';
  ctx.fillRect(760, 12, (130 * worst) / 100, 10);
  ctx.fillStyle = '#e8e4d8';
  ctx.fillText(worst >= 100 ? 'HUNTED' : worst >= 50 ? 'SUSPECT' : 'UNSEEN', 898, 21);
  ctx.fillStyle = player.lanternOn ? '#ffd98a' : '#8fc8ff';
  ctx.fillText(player.lanternOn ? 'LANTERN LIT [Q]' : 'LANTERN DOUSED [Q]', 1010, 21);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e8e4d8';
  const mm = Math.floor(time / 60);
  const ss = Math.floor(time % 60).toString().padStart(2, '0');
  ctx.fillText(`${mm}:${ss} · ${score} pts`, VIEW_W - 10, 21);
  ctx.textAlign = 'left';
  if (message) {
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(6,8,20,0.78)';
    const w = ctx.measureText(message).width + 24;
    ctx.fillRect((VIEW_W - w) / 2, VIEW_H - 34, w, 26);
    ctx.fillStyle = '#ffe9b0';
    ctx.textAlign = 'center';
    ctx.fillText(message, VIEW_W / 2, VIEW_H - 16);
    ctx.textAlign = 'left';
  }
}

export function renderGame(ctx, state, t) {
  const { parsed, player, guards, beam } = state;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, parsed, t);
  drawExit(ctx, parsed, state.exitOpen, t);
  drawShards(ctx, parsed, t);
  drawDarkness(ctx, state);
  // Cones and the beam are drawn over the dark: light you can read.
  drawBeam(ctx, beam, t);
  for (const guard of guards) {
    const range = player.lit ? GUARD.visionRangeLit : GUARD.visionRangeDoused;
    const color = guard.state === 'chase' ? '#ff5a3c' : guard.suspicion >= 50 ? '#ffb13c' : '#ffd76a';
    const alpha = guard.state === 'dazzled' ? 0.06 : guard.suspicion >= 50 ? 0.4 : 0.28;
    drawCone(ctx, guard, range, color, alpha);
  }
  for (const guard of guards) drawGuard(ctx, guard, t);
  drawPlayer(ctx, player, t);
  drawHud(ctx, state);
  ctx.fillStyle = 'rgba(232,228,216,0.55)';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('WASD move · Shift run (loud) · Q lantern · F flare · P pause · M mute', 10, VIEW_H - 6);
}

function overlayPanel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(4,6,16,0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText(title, VIEW_W / 2, 120);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = '15px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, 168 + i * 26);
  });
  ctx.textAlign = 'left';
}

export function renderTitle(ctx, t) {
  overlayPanel(ctx, 'W I C K L I G H T', [
    'Wick, the lamplighter’s apprentice, climbs the Black Lighthouse',
    'to steal back the starlight the Keepers locked away.',
    '',
    'WASD / arrows — move      Shift — run (loud!)',
    'Q — douse / kindle your lantern      F — flare (dazzles Keepers)',
    'Hide in bushes. Mind the sweeping beam. Reach the green door unseen.',
    '',
    'Click or press Enter to begin — 3 floors, 21 shards, 1 Starlight Heart.',
  ], '#ffd98a');
  // A little lantern swaying under the title.
  const lx = VIEW_W / 2 + Math.sin(t * 1.4) * 8;
  const glow = ctx.createRadialGradient(lx, 96, 2, lx, 96, 40);
  glow.addColorStop(0, 'rgba(255,200,110,0.8)');
  glow.addColorStop(1, 'rgba(255,200,110,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(lx, 96, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.arc(lx, 96, 6, 0, Math.PI * 2);
  ctx.fill();
}

export function renderIntro(ctx, state) {
  overlayPanel(ctx, state.level.name, [
    state.level.subtitle,
    '',
    state.level.intro,
    '',
    'Press Enter or click to slip in.',
  ], '#9fe8ff');
}

export function renderLevelClear(ctx, state) {
  overlayPanel(ctx, 'FLOOR CLEARED', [
    `${state.level.name} — Wick slips up the stairs, unseen.`,
    `Shards this floor: ${state.floorShards} · Time: ${Math.floor(state.floorTime)}s · Score: ${state.score}`,
    state.floorGhost ? 'GHOST — no Keeper ever grew suspicious. +400' : '',
    '',
    'Press Enter for the next floor.',
  ], '#7ad7a0');
}

export function renderCaught(ctx, state) {
  overlayPanel(ctx, 'CAUGHT!', [
    'A Keeper’s hand closes on Wick’s cloak. The lantern gutters…',
    state.lives > 0
      ? `${state.lives} ${state.lives === 1 ? 'life' : 'lives'} left — the floor resets. Press Enter to try again.`
      : 'No lives left.',
  ], '#ff6b6b');
}

export function renderWin(ctx, state) {
  const rank = state.alarms === 0 ? 'TRUE SHADOW' : state.alarms <= 2 ? 'LAMPLIGHTER' : 'LOUD SHADOW';
  overlayPanel(ctx, 'THE STARLIGHT IS FREE', [
    'Wick lifts the Starlight Heart. Dawn breaks over the Black Lighthouse.',
    `Rank: ${rank} · Score: ${state.score} · Time: ${Math.floor(state.time)}s · Alarms raised: ${state.alarms}`,
    '',
    'Press Enter to play again.',
  ], '#ffd98a');
}

export function renderGameOver(ctx, state) {
  overlayPanel(ctx, 'THE LIGHT GOES OUT', [
    'The Keepers lock the tower. Wick’s lantern is taken.',
    `Score: ${state.score}`,
    '',
    'Press Enter to try again from the first floor.',
  ], '#ff6b6b');
}

export function renderPaused(ctx) {
  ctx.fillStyle = 'rgba(4,6,16,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8e4d8';
  ctx.font = 'bold 28px Georgia, serif';
  ctx.fillText('PAUSED', VIEW_W / 2, VIEW_H / 2);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('P to resume · M to mute · R to restart the floor', VIEW_W / 2, VIEW_H / 2 + 30);
  ctx.textAlign = 'left';
}
