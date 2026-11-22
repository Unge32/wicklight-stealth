// WICKLIGHT — tuning constants. One place for every number that shapes
// how the stealth feels: sight, suspicion, speed, the lantern and the beam.
export const TILE = 32;
export const COLS = 40;
export const ROWS = 15;
export const VIEW_W = 1280;
export const VIEW_H = 480;

// Wick, the lamplighter's apprentice.
export const PLAYER = {
  radius: 11,
  walkSpeed: 132, // px per second, quiet
  runSpeed: 205, // px per second, noisy
  runNoiseRadius: 130, // guards inside this hear running feet
  catchRadius: 26, // a chasing guard this close catches Wick
};

// A guard's eyes. Suspicion is 0..100; at 100 the guard hunts Wick.
export const GUARD = {
  radius: 12,
  patrolSpeed: 62,
  investigateSpeed: 95,
  chaseSpeed: 168,
  visionRangeLit: 168, // how far a guard sees a KINDLED Wick
  visionRangeDoused: 92, // how far a guard sees a DOUSED Wick
  visionHalfAngle: 0.61, // ~35 degrees each side of facing
  bushSpotRadius: 42, // even in a bush, this close you are seen
  suspicionGain: 95, // per second, point-blank, lit, standing still
  suspicionDecay: 26, // per second while unseen
  investigateAt: 50, // suspicion: guard walks over to look
  alarmAt: 100, // suspicion: guard chases and calls the hunt
  alarmCooldown: 4.5, // seconds a hunt lasts after losing Wick
  pauseAtWaypoint: 1.1, // seconds a guard waits at each patrol point
};

// The Kindled Lantern — Wick's signature. Light is a bargain:
// kindled you see far but glow far; doused you vanish but go half-blind;
// a flare spends an ember to dazzle every guard near you.
export const LANTERN = {
  litSightRadius: 300, // how far Wick can see, lantern kindled
  dousedSightRadius: 118, // how far Wick can see, lantern doused
  litDetectBonus: 1.6, // suspicion gain multiplier while kindled
  dousedDetectBonus: 0.45, // suspicion gain multiplier while doused
  flareRadius: 270, // guards inside this are dazzled by a flare
  flareDazzleSeconds: 3.2, // how long a dazzled guard stands blind
  flareSuspicionDrop: 34, // suspicion a dazzled guard loses
  maxEmbers: 3, // flares Wick can carry
};

// The Black Lighthouse's great lamp: one sweeping beam per level.
// Standing in the beam is like standing in a guard's stare, only faster.
export const BEAM = {
  range: 560,
  halfAngle: 0.17, // ~10 degrees each side
  suspicionPerSecond: 150, // being lit by the beam, lit or doused
};

// Lamplight pools on the floor: pretty, and dangerous. A doused Wick
// standing in lamplight counts as lit for detection.
export const LAMP_LIGHT_RADIUS = 86;

export const SCORE = {
  shard: 100,
  heart: 500,
  levelClear: 250,
  timeBonusPerSecond: 5, // under par time
  alarmPenalty: 60,
  ghostBonus: 400, // finish a level never spotted
};

export const LIVES = 3;
