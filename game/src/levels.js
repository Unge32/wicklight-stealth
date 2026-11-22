// WICKLIGHT — the three floors of the Black Lighthouse.
// Legend: '#' wall, '.' floor, 'B' bush (hide), 'C' crate (blocks sight),
// 'L' lamp post (lit pool: dangerous), 'S' starlight shard, 'H' Starlight
// Heart, 'E' exit door, 'P' Wick's start, 'G' a Keeper's post.
// Every map is 40 columns x 15 rows. Patrol waypoints are tile [x, y]
// and must walk on floor — the playtest script checks that.
import { TILE } from './config.js';

function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

export const LEVELS = [
  {
    name: 'The Ground Hall',
    subtitle: 'Wick slips in through the cellar door. Five shards sleep in the dark.',
    parSeconds: 75,
    beamSpeed: 0.17, // radians per second, slow and learnable
    beamOriginTile: [20, 1],
    intro:
      'Collect 5 starlight shards, then reach the green door unseen. ' +
      'Q douses your lantern — dark hides you, but you see less. F spends an ember to dazzle.',
    map: [
      '########################################',
      '#.........' + '.B........' + '....L.....' + '....S...E#',
      '#.........' + '....C.....' + '....G.....' + '.........#',
      '#.........' + '...S......' + '....C.....' + '.........#',
      '#....#####' + '####......' + '....B.....' + '.........#',
      '#.........' + '..........' + '....L.....' + '....S....#',
      '#.........' + '..........' + '....C.....' + '.........#',
      '#.........' + '.G........' + '....B.....' + '....S....#',
      '#.........' + '....C.....' + '..........' + 'G........#',
      '#.........' + '..........' + '#####.....' + '#####....#',
      '#.........' + '....B.....' + '....L.....' + '.........#',
      '#.........' + '..........' + '....C.....' + '....S....#',
      '#.........' + '.....G....' + '..........' + '.........#',
      '#P........' + '..........' + '....B.....' + '.........#',
      '########################################',
    ],
    guards: [
      { spawn: [24, 2], waypoints: [[24, 2], [32, 2], [32, 6], [28, 6], [28, 2]] },
      { spawn: [11, 7], waypoints: [[11, 7], [11, 11], [5, 11], [5, 7]] },
      { spawn: [30, 8], waypoints: [[30, 8], [36, 8], [36, 12], [26, 12], [26, 8]] },
      { spawn: [15, 12], waypoints: [[15, 12], [8, 12], [8, 13], [15, 13]] },
    ],
  },
  {
    name: 'The Gallery of Keepers',
    subtitle: 'Portraits watch from the walls. Six Keepers walk the gallery.',
    parSeconds: 100,
    beamSpeed: 0.28,
    beamOriginTile: [20, 1],
    intro:
      'Seven shards, six Keepers, one faster beam. Bushes hide you; crates block their eyes. ' +
      'Running is loud — walk when a Keeper is near.',
    map: [
      '########################################',
      '#....S....' + '....L.....' + '..........' + '....S...E#',
      '#.........' + '....C.....' + '....G.....' + '.........#',
      '#..#####..' + '##........' + '....B.....' + '....S....#',
      '#.........' + '..........' + '....C.....' + '....G....#',
      '#....B....' + '....S.....' + '....L.....' + '.........#',
      '#.........' + '..G.......' + '..........' + '.........#',
      '#.........' + '..........' + '#####.....' + '#####....#',
      '#....C....' + '..........' + '....B.....' + '....S....#',
      '#.........' + '....G.....' + '..........' + '.........#',
      '#.........' + '..........' + '....C.....' + '....G....#',
      '#....S....' + '....L.....' + '....B.....' + '.........#',
      '#.........' + '....G.....' + '..........' + '.........#',
      '#P........' + '..........' + '....S.....' + '.........#',
      '########################################',
    ],
    guards: [
      { spawn: [24, 2], waypoints: [[24, 2], [33, 2], [33, 6], [28, 6], [28, 2]] },
      { spawn: [34, 4], waypoints: [[34, 4], [37, 4], [37, 6], [34, 6]] },
      { spawn: [12, 6], waypoints: [[12, 6], [12, 3], [17, 3], [17, 6]] },
      { spawn: [14, 9], waypoints: [[14, 9], [18, 9], [18, 12], [8, 12], [8, 9]] },
      { spawn: [34, 10], waypoints: [[34, 10], [37, 10], [37, 13], [34, 13]] },
      { spawn: [14, 12], waypoints: [[14, 12], [14, 13], [10, 13], [10, 12]] },
    ],
  },
  {
    name: 'The Lamp Room',
    subtitle: 'The Starlight Heart burns at the top of the tower. Eight Keepers. No mistakes.',
    parSeconds: 130,
    beamSpeed: 0.38,
    beamOriginTile: [20, 1],
    intro:
      'Nine shards and the Starlight Heart. The beam spins fastest here. ' +
      'Dazzle with F when a Keeper corners you — embers are precious.',
    map: [
      '########################################',
      '#....S....' + '....L.....' + '....B.....' + '....S..HE#',
      '#.........' + '....C.....' + '....G.....' + '.........#',
      '#..#####..' + '##...B....' + '....C.....' + '....S....#',
      '#.........' + '....G.....' + '....L.....' + '....G....#',
      '#....B....' + '....S.....' + '....C.....' + '....S....#',
      '#.........' + '..G.......' + '..........' + '.........#',
      '#.........' + '..........' + '#####.....' + '#####....#',
      '#....C....' + '....B.....' + '....G.....' + '....S....#',
      '#.........' + '....G.....' + '..........' + '....S....#',
      '#.........' + '..........' + '....C.....' + '....G....#',
      '#....S....' + '....L.....' + '....B.....' + '.........#',
      '#.........' + '....G.....' + '..........' + '.........#',
      '#P........' + '..........' + '....S.....' + '.........#',
      '########################################',
    ],
    guards: [
      { spawn: [24, 2], waypoints: [[24, 2], [33, 2], [33, 6], [28, 6], [28, 2]] },
      { spawn: [14, 4], waypoints: [[14, 4], [14, 6], [18, 6], [18, 4]] },
      { spawn: [34, 4], waypoints: [[34, 4], [37, 4], [37, 6], [34, 6]] },
      { spawn: [12, 6], waypoints: [[12, 6], [12, 3], [17, 3], [17, 6]] },
      { spawn: [24, 8], waypoints: [[24, 8], [28, 8], [28, 11], [20, 11], [20, 8]] },
      { spawn: [14, 9], waypoints: [[14, 9], [18, 9], [18, 12], [8, 12], [8, 9]] },
      { spawn: [34, 10], waypoints: [[34, 10], [37, 10], [37, 13], [34, 13]] },
      { spawn: [14, 12], waypoints: [[14, 12], [14, 13], [10, 13], [10, 12]] },
    ],
  },
];

// Parse one ASCII map into the structures the game runs on.
export function parseLevel(level) {
  const grid = level.map.map((row) => row.split(''));
  const walls = new Set();
  const crates = new Set();
  const lamps = new Set();
  const bushes = new Set();
  const shards = [];
  let heart = null;
  let exit = null;
  let playerStart = null;
  const guardSpawns = [];

  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      const ch = grid[y][x];
      const key = `${x},${y}`;
      if (ch === '#') walls.add(key);
      else if (ch === 'C') crates.add(key);
      else if (ch === 'L') lamps.add(key);
      else if (ch === 'B') bushes.add(key);
      else if (ch === 'S') shards.push({ ...tileCenter(x, y), tx: x, ty: y, taken: false });
      else if (ch === 'H') heart = { ...tileCenter(x, y), tx: x, ty: y, taken: false };
      else if (ch === 'E') exit = { ...tileCenter(x, y), tx: x, ty: y };
      else if (ch === 'P') playerStart = { ...tileCenter(x, y), tx: x, ty: y };
      else if (ch === 'G') guardSpawns.push({ ...tileCenter(x, y), tx: x, ty: y });
    }
  }
  return { grid, walls, crates, lamps, bushes, shards, heart, exit, playerStart, guardSpawns };
}

// Walkable for a body: floor, bush, shard, heart, exit, player and guard tiles.
// Walls, crates and lamp posts are solid.
export function isSolidTile(parsed, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= 40 || ty >= 15) return true;
  const key = `${tx},${ty}`;
  return parsed.walls.has(key) || parsed.crates.has(key) || parsed.lamps.has(key);
}

// Blocks a guard's line of sight: walls and crates. Lamp posts are thin.
export function blocksSight(parsed, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= 40 || ty >= 15) return true;
  const key = `${tx},${ty}`;
  return parsed.walls.has(key) || parsed.crates.has(key);
}

export function tileAt(parsed, x, y) {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  if (tx < 0 || ty < 0 || tx >= 40 || ty >= 15) return '#';
  return parsed.grid[ty][tx];
}

export function isBushAt(parsed, x, y) {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  return parsed.bushes.has(`${tx},${ty}`);
}

export function isLampLitAt(parsed, x, y) {
  // Is this point inside any lamp's pool of light? Lamplight counts as lit.
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  for (const key of parsed.lamps) {
    const [lx, ly] = key.split(',').map(Number);
    const dx = (lx - tx) * TILE;
    const dy = (ly - ty) * TILE;
    if (dx * dx + dy * dy < 86 * 86) return true;
  }
  return false;
}
