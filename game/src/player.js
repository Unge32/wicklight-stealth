// WICKLIGHT — Wick, the lamplighter's apprentice. Movement, the Kindled
// Lantern, flares, noise and loot. Pure logic over the parsed level, so
// the playtest script can drive it in Node without a browser.
import { PLAYER, LANTERN, TILE } from './config.js';
import { isSolidTile, isBushAt, isLampLitAt } from './levels.js';

// Move a circle through the tile grid, sliding along walls: try x, then y.
export function moveCircle(parsed, body, dx, dy) {
  const r = body.radius;
  const nx = body.x + dx;
  if (!circleHitsSolid(parsed, nx, body.y, r)) body.x = nx;
  const ny = body.y + dy;
  if (!circleHitsSolid(parsed, body.x, ny, r)) body.y = ny;
}

export function circleHitsSolid(parsed, x, y, r) {
  const x0 = Math.floor((x - r) / TILE);
  const x1 = Math.floor((x + r) / TILE);
  const y0 = Math.floor((y - r) / TILE);
  const y1 = Math.floor((y + r) / TILE);
  for (let ty = y0; ty <= y1; ty += 1) {
    for (let tx = x0; tx <= x1; tx += 1) {
      if (isSolidTile(parsed, tx, ty)) {
        // Closest point on the tile to the circle centre.
        const cx = Math.max(tx * TILE, Math.min(x, tx * TILE + TILE));
        const cy = Math.max(ty * TILE, Math.min(y, ty * TILE + TILE));
        const ddx = x - cx;
        const ddy = y - cy;
        if (ddx * ddx + ddy * ddy < r * r) return true;
      }
    }
  }
  return false;
}

export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    radius: PLAYER.radius,
    facing: -Math.PI / 2, // Wick starts looking up, toward the tower
    moving: false,
    running: false,
    lanternOn: true, // the lantern's own flame, toggled by Wick
    lit: true, // effective light: lantern OR lamplight — what guards see
    inBush: false,
    inLamplight: false,
    embers: LANTERN.maxEmbers,
    flareCooldown: 0,
    noiseT: 0,
    stepT: 0,
  };
}

// One tick of Wick. ctx: { parsed, input, guards, events, dt }.
// Events pushed: 'pickup' | 'heart' | 'sealed' | 'exit' | 'flare' |
// 'lantern' | 'noise' {x,y,radius} | 'step' {pan,loud}.
export function updatePlayer(player, dt, ctx) {
  const { parsed, input, events } = ctx;
  const mv = input.moveVector();
  player.moving = mv.x !== 0 || mv.y !== 0;
  player.running = input.run && player.moving;
  const speed = player.running ? PLAYER.runSpeed : PLAYER.walkSpeed;
  if (player.moving) {
    player.facing = Math.atan2(mv.y, mv.x);
    moveCircle(parsed, player, mv.x * speed * dt, mv.y * speed * dt);
    // Running feet are loud: every 0.35 s Wick's steps reach the Keepers.
    player.noiseT -= dt;
    if (player.running && player.noiseT <= 0) {
      player.noiseT = 0.35;
      events.push({ type: 'noise', x: player.x, y: player.y, radius: PLAYER.runNoiseRadius });
    }
    player.stepT -= dt;
    if (player.stepT <= 0) {
      player.stepT = player.running ? 0.26 : 0.42;
      events.push({ type: 'step', pan: 0, loud: player.running, self: true });
    }
  }

  // Where is Wick standing? Bushes hide; lamplight exposes.
  player.inBush = isBushAt(parsed, player.x, player.y);
  player.inLamplight = isLampLitAt(parsed, player.x, player.y);

  // The lantern: Q or E kindles and douses it. A doused Wick is a shadow.
  if (input.wasPressed('KeyQ') || input.wasPressed('KeyE')) {
    player.lanternOn = !player.lanternOn;
    events.push({ type: 'lantern', lit: player.lanternOn });
    input.consume('KeyQ');
    input.consume('KeyE');
  }
  // Effective light: a kindled lantern, or standing in a lamp's pool.
  player.lit = player.lanternOn || player.inLamplight;

  // A flare: F spends one ember and dazzles every Keeper near Wick.
  player.flareCooldown = Math.max(0, player.flareCooldown - dt);
  if (input.wasPressed('KeyF') && player.flareCooldown <= 0) {
    input.consume('KeyF');
    if (player.embers > 0) {
      player.embers -= 1;
      player.flareCooldown = 0.6;
      events.push({ type: 'flare', x: player.x, y: player.y, radius: LANTERN.flareRadius });
    } else {
      events.push({ type: 'noember' });
    }
  }

  // Loot: starlight shards, and on the last floor the Starlight Heart.
  for (const shard of parsed.shards) {
    if (!shard.taken && Math.hypot(shard.x - player.x, shard.y - player.y) < 24) {
      shard.taken = true;
      events.push({ type: 'pickup', x: shard.x, y: shard.y });
    }
  }
  if (parsed.heart && !parsed.heart.taken
    && Math.hypot(parsed.heart.x - player.x, parsed.heart.y - player.y) < 26) {
    parsed.heart.taken = true;
    events.push({ type: 'heart', x: parsed.heart.x, y: parsed.heart.y });
  }

  // The exit: sealed until every shard (and the Heart) is taken.
  const exit = parsed.exit;
  if (Math.hypot(exit.x - player.x, exit.y - player.y) < 28) {
    const shardsLeft = parsed.shards.filter((s) => !s.taken).length;
    const heartLeft = parsed.heart && !parsed.heart.taken ? 1 : 0;
    if (shardsLeft + heartLeft === 0) {
      events.push({ type: 'exit' });
    } else {
      events.push({ type: 'sealed', left: shardsLeft + heartLeft });
    }
  }
}
