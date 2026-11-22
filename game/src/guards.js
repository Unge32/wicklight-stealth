// WICKLIGHT — the Keepers. Each one walks a patrol, watches with a
// vision cone, grows suspicious, investigates noises and glimpses, hunts
// when sure, and stands dazzled when Wick's flare catches it.
// Pure logic over the parsed level: the playtest drives it in Node.
import { GUARD, LANTERN, TILE } from './config.js';
import { hasLineOfSight, inBeam, guardSeesFactor } from './vision.js';
import { moveCircle } from './player.js';

export function createGuard(def, parsed, seedOffset = 0) {
  const start = def.waypoints[0];
  return {
    x: start[0] * TILE + TILE / 2,
    y: start[1] * TILE + TILE / 2,
    radius: GUARD.radius,
    facing: 0,
    state: 'patrol', // patrol | investigate | chase | dazzled | return
    suspicion: 0,
    waypointIndex: 1,
    pauseT: 0,
    target: null, // {x, y} the guard is walking toward
    lastSeen: null, // where Wick was last clearly seen
    lastSeenT: 0,
    dazzleT: 0,
    huntT: 0,
    stepT: seedOffset, // stagger footsteps so Keepers don't march in sync
    alarmed: false, // raised the alarm (and the hunt) at least once
  };
}

function angleTo(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function turnToward(guard, targetAngle, dt) {
  let diff = targetAngle - guard.facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const maxTurn = 4.2 * dt;
  guard.facing += Math.max(-maxTurn, Math.min(maxTurn, diff));
}

// One tick of one Keeper. ctx: { parsed, player, beam, dt, events,
// noise: [{x,y,radius}] this frame, time }.
// Events: 'spotted' (suspicion crossed 50) | 'alarm' (crossed 100) |
// 'calm' (hunt ended) | 'step' {pan} | 'caught'.
export function updateGuard(guard, dt, ctx) {
  const { parsed, player, beam, events } = ctx;

  // --- Dazzled: a flare's light burns the Keeper's eyes. It stands still.
  if (guard.state === 'dazzled') {
    guard.dazzleT -= dt;
    guard.suspicion = Math.max(0, guard.suspicion - 12 * dt);
    if (guard.dazzleT <= 0) {
      guard.state = guard.suspicion >= GUARD.investigateAt ? 'investigate' : 'patrol';
      guard.target = guard.suspicion >= GUARD.investigateAt ? guard.lastSeen : null;
    }
    return;
  }

  // --- Perception: the cone, then the beam, then the ears.
  const range = player.lit ? GUARD.visionRangeLit : GUARD.visionRangeDoused;
  let factor = guardSeesFactor(parsed, guard, player, range, GUARD.visionHalfAngle);
  const wasLit = player.lit;
  // The lighthouse beam: bright light, fast suspicion — unless Wick hides
  // in a bush, or a wall stands between the great lamp and Wick.
  if (beam && !player.inBush && inBeam(beam, player.x, player.y)
    && hasLineOfSight(parsed, beam.x, beam.y, player.x, player.y)) {
    factor = Math.max(factor, 1.2);
  }
  if (factor > 0) {
    const gain = GUARD.suspicionGain * factor * (wasLit ? LANTERN.litDetectBonus : LANTERN.dousedDetectBonus);
    const before = guard.suspicion;
    guard.suspicion = Math.min(100, guard.suspicion + gain * dt);
    guard.lastSeen = { x: player.x, y: player.y };
    guard.lastSeenT = ctx.time;
    if (before < GUARD.investigateAt && guard.suspicion >= GUARD.investigateAt) {
      events.push({ type: 'spotted', guard });
    }
  } else {
    // A Keeper that is walking over to look decays slower: it stays
    // curious while it checks the spot, instead of forgetting at once.
    const decay = guard.state === 'investigate' ? 8 : GUARD.suspicionDecay;
    guard.suspicion = Math.max(0, guard.suspicion - decay * dt);
  }

  // Ears: a noise this frame inside the guard's hearing pulls it over.
  for (const noise of ctx.noise || []) {
    const d = Math.hypot(noise.x - guard.x, noise.y - guard.y);
    if (d < noise.radius + 60 && guard.state !== 'chase') {
      guard.suspicion = Math.max(guard.suspicion, GUARD.investigateAt);
      guard.lastSeen = { x: noise.x, y: noise.y };
      if (guard.state === 'patrol' || guard.state === 'return' || guard.state === 'investigate') {
        guard.state = 'investigate';
        guard.target = { x: noise.x, y: noise.y };
      }
    }
  }

  // --- State changes.
  if (guard.suspicion >= GUARD.alarmAt && guard.state !== 'chase') {
    guard.state = 'chase';
    guard.huntT = GUARD.alarmCooldown;
    guard.alarmed = true;
    events.push({ type: 'alarm', guard });
  } else if (guard.suspicion >= GUARD.investigateAt
    && (guard.state === 'patrol' || guard.state === 'return')) {
    // A glimpse is enough: the Keeper stops its round and goes to look.
    guard.state = 'investigate';
    guard.target = guard.lastSeen ? { ...guard.lastSeen } : null;
  } else if (guard.state === 'chase') {
    // The hunt lasts while Wick is seen; it fades a few seconds after.
    if (factor > 0) guard.huntT = GUARD.alarmCooldown;
    else guard.huntT -= dt;
    if (guard.huntT <= 0) {
      guard.state = 'return';
      guard.suspicion = 40; // wary, not calm
      guard.target = null;
      events.push({ type: 'calm', guard });
    }
  } else if (guard.state === 'investigate' && guard.suspicion >= GUARD.alarmAt) {
    guard.state = 'chase';
  } else if (guard.state === 'investigate' && guard.suspicion < 25) {
    guard.state = 'return';
    guard.target = null;
  }

  // --- Movement.
  let speed = 0;
  let moveTo = null;
  if (guard.state === 'patrol') {
    const def = ctx.guardDefs[ctx.guardIndex];
    const wp = def.waypoints[guard.waypointIndex];
    moveTo = { x: wp[0] * TILE + TILE / 2, y: wp[1] * TILE + TILE / 2 };
    speed = GUARD.patrolSpeed;
    if (Math.hypot(moveTo.x - guard.x, moveTo.y - guard.y) < 6) {
      guard.waypointIndex = (guard.waypointIndex + 1) % def.waypoints.length;
      guard.pauseT = GUARD.pauseAtWaypoint;
    }
  } else if (guard.state === 'investigate' && guard.target) {
    moveTo = guard.target;
    speed = GUARD.investigateSpeed;
    if (Math.hypot(moveTo.x - guard.x, moveTo.y - guard.y) < 10) {
      guard.target = null;
      guard.pauseT = 1.4; // looks around, then gives up
      guard.state = 'return';
    }
  } else if (guard.state === 'chase') {
    moveTo = guard.lastSeen || { x: player.x, y: player.y };
    // Chase the living Wick, not just where it was last seen.
    if (factor > 0) moveTo = { x: player.x, y: player.y };
    speed = GUARD.chaseSpeed;
  } else if (guard.state === 'return') {
    const def = ctx.guardDefs[ctx.guardIndex];
    // Walk back to the nearest patrol waypoint, then resume the round.
    let best = 0;
    let bestD = Infinity;
    def.waypoints.forEach((wp, i) => {
      const d = Math.hypot(wp[0] * TILE + TILE / 2 - guard.x, wp[1] * TILE + TILE / 2 - guard.y);
      if (d < bestD) { bestD = d; best = i; }
    });
    moveTo = { x: def.waypoints[best][0] * TILE + TILE / 2, y: def.waypoints[best][1] * TILE + TILE / 2 };
    speed = GUARD.patrolSpeed;
    if (bestD < 8) {
      guard.waypointIndex = (best + 1) % def.waypoints.length;
      guard.state = 'patrol';
    }
  }

  if (guard.pauseT > 0) {
    guard.pauseT -= dt;
  } else if (moveTo) {
    const dx = moveTo.x - guard.x;
    const dy = moveTo.y - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const step = Math.min(dist, speed * dt);
      moveCircle(parsed, guard, (dx / dist) * step, (dy / dist) * step);
      turnToward(guard, Math.atan2(dy, dx), dt);
      guard.stepT -= dt;
      if (guard.stepT <= 0) {
        guard.stepT = guard.state === 'chase' ? 0.3 : 0.55;
        events.push({ type: 'step', pan: (guard.x - 640) / 640, loud: guard.state === 'chase' });
      }
    }
  }

  // --- The catch: a hunting Keeper that reaches Wick ends the run.
  if (guard.state === 'chase'
    && Math.hypot(player.x - guard.x, player.y - guard.y) < 26) {
    events.push({ type: 'caught', guard });
  }
}

// A flare dazzles every Keeper inside its light.
export function applyFlare(guards, x, y, radius) {
  let hit = 0;
  for (const guard of guards) {
    if (guard.state === 'dazzled') continue;
    if (Math.hypot(guard.x - x, guard.y - y) <= radius) {
      guard.state = 'dazzled';
      guard.dazzleT = LANTERN.flareDazzleSeconds;
      guard.suspicion = Math.max(0, guard.suspicion - LANTERN.flareSuspicionDrop);
      hit += 1;
    }
  }
  return hit;
}
