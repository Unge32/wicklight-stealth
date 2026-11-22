// WICKLIGHT — the game loop and the state machine. Title, floor intro,
// play, caught, floor clear, win, game over, pause. Wires input, the
// player, the Keepers, the beam, the sounds and the renderer together.
import { TILE, VIEW_W, VIEW_H, LANTERN, SCORE, LIVES, BEAM } from './config.js';
import { LEVELS, parseLevel } from './levels.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createPlayer, updatePlayer } from './player.js';
import { createGuard, updateGuard, applyFlare } from './guards.js';
import {
  renderGame, renderTitle, renderIntro, renderLevelClear,
  renderCaught, renderWin, renderGameOver, renderPaused,
} from './render.js';
import { stageShot } from './shots.js';
import { mulberry32 } from './random.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const input = createInput();
input.attach(window);
const audio = createAudio();

const game = {
  status: 'title', // title | intro | play | caught | clear | win | gameover
  paused: false,
  levelIndex: 0,
  level: LEVELS[0],
  parsed: null,
  player: null,
  guards: [],
  beam: null,
  score: 0,
  lives: LIVES,
  time: 0,
  floorTime: 0,
  floorShards: 0,
  floorAlarmed: false,
  floorGhost: false,
  alarms: 0,
  message: '',
  messageT: 0,
  sealedT: 0,
  exitOpen: false,
};

function loadLevel(index) {
  game.levelIndex = index;
  game.level = LEVELS[index];
  game.parsed = parseLevel(game.level);
  game.player = createPlayer(game.parsed.playerStart);
  const rng = mulberry32(1234 + index * 777);
  game.guards = game.level.guards.map((def, i) => createGuard(def, game.parsed, rng() * 0.5));
  const [bx, by] = game.level.beamOriginTile;
  game.beam = {
    x: bx * TILE + TILE / 2,
    y: by * TILE + TILE / 2,
    angle: Math.PI / 2, // the beam starts pointing down the hall
    range: BEAM.range,
    halfAngle: BEAM.halfAngle,
    speed: game.level.beamSpeed,
  };
  game.floorTime = 0;
  game.floorShards = 0;
  game.floorAlarmed = false;
  game.exitOpen = false;
  game.message = game.level.intro;
  game.messageT = 6;
}
game.loadLevel = loadLevel;

function showMessage(text, seconds) {
  game.message = text;
  game.messageT = seconds;
}

function startGame() {
  game.score = 0;
  game.lives = LIVES;
  game.time = 0;
  game.alarms = 0;
  loadLevel(0);
  game.status = 'intro';
  audio.unlock();
  audio.startWind();
}

function levelCleared() {
  const par = game.level.parSeconds;
  const timeBonus = Math.max(0, Math.floor(par - game.floorTime)) * SCORE.timeBonusPerSecond;
  const ghostBonus = game.floorGhost ? SCORE.ghostBonus : 0;
  game.score += SCORE.levelClear + timeBonus + ghostBonus;
  audio.levelClear();
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.status = 'win';
    audio.win();
  } else {
    game.status = 'clear';
  }
}

function caught() {
  game.lives -= 1;
  game.score = Math.max(0, game.score - SCORE.alarmPenalty);
  audio.caught();
  game.status = game.lives <= 0 ? 'gameover' : 'caught';
}

// Advance the state machine on Enter or a click.
function advance() {
  audio.unlock();
  if (game.status === 'title') startGame();
  else if (game.status === 'intro') game.status = 'play';
  else if (game.status === 'clear') {
    loadLevel(game.levelIndex + 1);
    game.status = 'intro';
  } else if (game.status === 'caught') {
    loadLevel(game.levelIndex);
    game.status = 'intro';
  } else if (game.status === 'win' || game.status === 'gameover') {
    startGame();
  }
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Enter' || event.code === 'Space') {
    if (game.status !== 'play' || game.paused) {
      event.preventDefault();
      advance();
    }
  }
  if (event.code === 'KeyP' && game.status === 'play') {
    game.paused = !game.paused;
  }
  if (event.code === 'KeyM') {
    const muted = audio.toggleMute();
    showMessage(muted ? 'Sound muted [M]' : 'Sound on [M]', 1.5);
  }
  if (event.code === 'KeyR' && game.status === 'play') {
    loadLevel(game.levelIndex);
    game.status = 'intro';
    showMessage('Floor restarted.', 2);
  }
});
canvas.addEventListener('click', () => {
  if (game.status !== 'play') advance();
  else audio.unlock();
});

function drainEvents(events) {
  const noise = [];
  for (const event of events) {
    if (event.type === 'noise') {
      noise.push(event);
    } else if (event.type === 'step') {
      const pan = event.self ? 0 : event.pan || 0;
      audio.footstep(pan, event.loud);
    } else if (event.type === 'pickup') {
      game.score += SCORE.shard;
      game.floorShards += 1;
      audio.pickup();
      showMessage('Starlight shard +100', 1.2);
    } else if (event.type === 'heart') {
      game.score += SCORE.heart;
      game.floorShards += 1;
      audio.heart();
      showMessage('THE STARLIGHT HEART IS YOURS! +500 — reach the door!', 3);
    } else if (event.type === 'sealed') {
      if (game.sealedT <= 0) {
        game.sealedT = 2;
        audio.doorSealed();
        showMessage(`The door is sealed — ${event.left} starlight left.`, 2);
      }
    } else if (event.type === 'exit') {
      levelCleared();
      return { noise, stop: true };
    } else if (event.type === 'flare') {
      const hit = applyFlare(game.guards, event.x, event.y, event.radius);
      audio.flare();
      showMessage(hit > 0 ? `FLARE! ${hit} Keeper${hit > 1 ? 's' : ''} dazzled — run!` : 'Flare spent — no Keeper close enough.', 2);
    } else if (event.type === 'noember') {
      showMessage('No embers left — they refill on the next floor.', 2);
    } else if (event.type === 'lantern') {
      if (event.lit) audio.lanternKindle();
      else audio.lanternDouse();
      showMessage(event.lit ? 'Lantern kindled — you see far, and glow far.' : 'Lantern doused — you are a shadow now.', 1.6);
    } else if (event.type === 'spotted') {
      audio.spotted();
    } else if (event.type === 'alarm') {
      game.alarms += 1;
      game.floorAlarmed = true;
      audio.alarm();
      showMessage('SPOTTED! The Keepers are hunting you — break line of sight!', 2.5);
    } else if (event.type === 'calm') {
      showMessage('The hunt fades… they return to their rounds.', 2);
    } else if (event.type === 'caught') {
      caught();
      return { noise, stop: true };
    }
  }
  return { noise, stop: false };
}

let lastT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000 || 0);
  lastT = now;
  const t = now / 1000;

  if (game.status === 'play' && !game.paused) {
    game.time += dt;
    game.floorTime += dt;
    game.messageT = Math.max(0, game.messageT - dt);
    if (game.messageT <= 0) game.message = '';
    game.sealedT = Math.max(0, game.sealedT - dt);
    game.beam.angle += game.beam.speed * dt;

    const events = [];
    updatePlayer(game.player, dt, { parsed: game.parsed, input, events });
    const { noise, stop } = drainEvents(events);
    if (!stop) {
      const guardEvents = [];
      game.guards.forEach((guard, i) => {
        updateGuard(guard, dt, {
          parsed: game.parsed,
          player: game.player,
          beam: game.beam,
          events: guardEvents,
          noise,
          time: game.time,
          guardDefs: game.level.guards,
          guardIndex: i,
        });
      });
      const result = drainEvents(guardEvents);
      if (result.stop) {
        // Caught during the guards' tick: stop here.
      }
    }
    // The door opens when every shard (and the Heart) is taken.
    const shardsLeft = game.parsed.shards.filter((s) => !s.taken).length;
    const heartLeft = game.parsed.heart && !game.parsed.heart.taken ? 1 : 0;
    game.exitOpen = shardsLeft + heartLeft === 0;
    game.floorGhost = !game.floorAlarmed;
  }

  // --- Draw.
  if (game.status === 'title') renderTitle(ctx, t);
  else if (game.status === 'intro') {
    renderGame(ctx, game, t);
    renderIntro(ctx, game);
  } else if (game.status === 'clear') {
    renderGame(ctx, game, t);
    renderLevelClear(ctx, game);
  } else if (game.status === 'caught') {
    renderGame(ctx, game, t);
    renderCaught(ctx, game);
  } else if (game.status === 'win') {
    renderWin(ctx, game);
  } else if (game.status === 'gameover') {
    renderGameOver(ctx, game);
  } else {
    renderGame(ctx, game, t);
    if (game.paused) renderPaused(ctx);
  }
  input.endFrame();
}

// Screenshot mode: ?shot=cover|bush|flare|win poses a real game state.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
loadLevel(0);
if (shot) {
  stageShot(game, shot);
} else {
  game.status = 'title';
}

// For the headless playtest: a handle to inspect the live game.
window.__wicklight = game;
window.__wicklightReady = true;

requestAnimationFrame(frame);
