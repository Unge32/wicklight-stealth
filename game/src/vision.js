// WICKLIGHT — line of sight and vision cones. Everything here is pure
// geometry over the parsed level: no DOM, no canvas, so the playtest
// script can drive it in Node.
import { TILE } from './config.js';
import { blocksSight } from './levels.js';

// Does any wall or crate stand between (x0,y0) and (x1,y1)?
// Steps along the segment in small increments and asks the grid.
export function hasLineOfSight(parsed, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const steps = Math.ceil(dist / 6);
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const tx = Math.floor((x0 + dx * t) / TILE);
    const ty = Math.floor((y0 + dy * t) / TILE);
    if (blocksSight(parsed, tx, ty)) return false;
  }
  return true;
}

// Is the point (x,y) inside a guard's cone? Facing is radians.
export function inVisionCone(guard, x, y, range, halfAngle) {
  const dx = x - guard.x;
  const dy = y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 4) return true;
  let angle = Math.atan2(dy, dx) - guard.facing;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return Math.abs(angle) <= halfAngle;
}

// Is the point (x,y) inside the sweeping lighthouse beam?
// Beam origin, current angle, range and half-angle come from the level.
export function inBeam(beam, x, y) {
  const dx = x - beam.x;
  const dy = y - beam.y;
  const dist = Math.hypot(dx, dy);
  if (dist > beam.range) return false;
  if (dist < 4) return true;
  let angle = Math.atan2(dy, dx) - beam.angle;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return Math.abs(angle) <= beam.halfAngle;
}

// How "seen" is Wick right now, 0..1, from one guard's eyes?
// 0 means invisible to this guard. Bushes, darkness and distance hide;
// lamplight, a kindled lantern and running give you away.
export function guardSeesFactor(parsed, guard, player, range, halfAngle) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (!inVisionCone(guard, player.x, player.y, range, halfAngle)) return 0;
  if (!hasLineOfSight(parsed, guard.x, guard.y, player.x, player.y)) return 0;
  // Hidden in a bush unless the guard is right on top of you.
  if (player.inBush && dist > 42) return 0;
  // Closeness dominates: near is seen even in the dark.
  const closeness = 1 - dist / range;
  let factor = 0.25 + 0.75 * closeness;
  if (player.lit) factor *= 1.6; // kindled lantern or lamplight
  else factor *= 0.45; // doused: a shadow among shadows
  if (player.running) factor *= 1.35;
  return Math.min(1.4, factor);
}
