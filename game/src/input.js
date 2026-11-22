// WICKLIGHT — keyboard (and the menu's mouse clicks). One module owns
// every key the player can press, so main.js never reads events itself.
export function createInput() {
  const keys = new Set();
  const pressed = new Set(); // edge-triggered: true for one frame after keydown
  const codeOf = (event) => event.code;

  function onKeyDown(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(event.code);
    keys.add(event.code);
  }
  function onKeyUp(event) {
    keys.delete(event.code);
  }
  function onBlur() {
    keys.clear();
  }

  const input = {
    // Held keys.
    get up() { return keys.has('KeyW') || keys.has('ArrowUp'); },
    get down() { return keys.has('KeyS') || keys.has('ArrowDown'); },
    get left() { return keys.has('KeyA') || keys.has('ArrowLeft'); },
    get right() { return keys.has('KeyD') || keys.has('ArrowRight'); },
    get run() { return keys.has('ShiftLeft') || keys.has('ShiftRight'); },
    get anyMove() { return input.up || input.down || input.left || input.right; },
    moveVector() {
      let x = 0;
      let y = 0;
      if (input.left) x -= 1;
      if (input.right) x += 1;
      if (input.up) y -= 1;
      if (input.down) y += 1;
      if (x !== 0 && y !== 0) {
        x *= Math.SQRT1_2;
        y *= Math.SQRT1_2;
      }
      return { x, y };
    },
    // Edge-triggered actions, consumed once per frame.
    wasPressed(code) { return pressed.has(code); },
    consume(code) { pressed.delete(code); },
    endFrame() { pressed.clear(); },
    attach(target) {
      target.addEventListener('keydown', onKeyDown);
      target.addEventListener('keyup', onKeyUp);
      target.addEventListener('blur', onBlur);
    },
    detach(target) {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      target.removeEventListener('blur', onBlur);
    },
  };
  return input;
}
