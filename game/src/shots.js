// WICKLIGHT — screenshot staging. ?shot=<name> loads a level and poses
// it so the screenshots show the game at its best: the cones, the beam,
// the lantern, a hiding Wick, a flare. These are real game states —
// the same states a player reaches by playing — posed for the camera.
import { TILE } from './config.js';

function placeGuard(guard, tx, ty, facing, suspicion, state) {
  guard.x = tx * TILE + TILE / 2;
  guard.y = ty * TILE + TILE / 2;
  guard.facing = facing;
  guard.suspicion = suspicion;
  guard.state = state || 'patrol';
  guard.pauseT = 99; // hold the pose for the screenshot
  guard.target = null;
}

export function stageShot(game, name) {
  if (name === 'win') {
    game.status = 'win';
    game.score = 2840;
    game.time = 214;
    game.alarms = 1;
    return;
  }
  if (name === 'cover') {
    // Floor 1, mid-heist: Wick kindled near the crates, two cones crossing,
    // the beam sweeping down the hall, shards still glittering.
    game.loadLevel(0);
    game.status = 'play';
    game.player.x = 19 * TILE + 16;
    game.player.y = 6 * TILE + 16;
    game.player.lanternOn = true;
    game.player.lit = true;
    game.beam.angle = Math.PI * 0.62;
    placeGuard(game.guards[0], 24, 3, Math.PI * 0.55, 62, 'investigate');
    game.guards[0].lastSeen = { x: game.player.x, y: game.player.y };
    placeGuard(game.guards[1], 11, 9, -Math.PI * 0.4, 18, 'patrol');
    placeGuard(game.guards[2], 30, 10, Math.PI * 0.85, 0, 'patrol');
    placeGuard(game.guards[3], 15, 13, -Math.PI / 2, 0, 'patrol');
    game.parsed.shards[0].taken = true;
    game.score = 100;
    game.message = '';
    return;
  }
  if (name === 'bush') {
    // Wick doused, hidden in the thicket while a Keeper's cone passes by.
    game.loadLevel(0);
    game.status = 'play';
    game.player.x = 24 * TILE + 16;
    game.player.y = 4 * TILE + 16;
    game.player.lanternOn = false;
    game.player.lit = false;
    game.player.inBush = true;
    game.beam.angle = Math.PI * 1.35;
    placeGuard(game.guards[0], 24, 2, Math.PI / 2, 34, 'investigate');
    game.guards[0].lastSeen = { x: 24 * TILE + 16, y: 6 * TILE + 16 };
    placeGuard(game.guards[1], 11, 7, 0, 0, 'patrol');
    placeGuard(game.guards[2], 30, 8, Math.PI, 0, 'patrol');
    placeGuard(game.guards[3], 15, 12, -Math.PI / 2, 0, 'patrol');
    game.message = 'Hidden in the bush — the Keeper walks past…';
    return;
  }
  if (name === 'flare') {
    // Floor 2: Wick's flare bursts and two Keepers stand dazzled.
    game.loadLevel(1);
    game.status = 'play';
    game.player.x = 20 * TILE + 16;
    game.player.y = 5 * TILE + 16;
    game.player.lanternOn = true;
    game.player.lit = true;
    game.player.embers = 2;
    game.beam.angle = Math.PI * 0.8;
    placeGuard(game.guards[0], 24, 4, Math.PI * 0.7, 55, 'dazzled');
    game.guards[0].dazzleT = 2.4;
    placeGuard(game.guards[2], 16, 5, -Math.PI * 0.75, 70, 'dazzled');
    game.guards[2].dazzleT = 2.4;
    placeGuard(game.guards[1], 34, 6, Math.PI, 20, 'patrol');
    placeGuard(game.guards[3], 14, 9, 0, 0, 'patrol');
    placeGuard(game.guards[4], 34, 11, Math.PI / 2, 0, 'patrol');
    placeGuard(game.guards[5], 10, 12, -Math.PI / 2, 0, 'patrol');
    game.parsed.shards[0].taken = true;
    game.parsed.shards[1].taken = true;
    game.score = 200;
    game.message = 'FLARE! The Keepers stand blind — run!';
    return;
  }
  // Unknown shot name: plain level 1, playing.
  game.loadLevel(0);
  game.status = 'play';
}
