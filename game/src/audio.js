// WICKLIGHT — every sound is synthesized with WebAudio. No audio files,
// no network: oscillators, filtered noise and envelopes, made in code.
// Footsteps are panned: a guard's steps come from where the guard is.
export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let windNodes = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null, pan = 0) {
    if (!ensure() || muted) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    if (panner) {
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      gain.connect(panner);
      panner.connect(master);
    } else {
      gain.connect(master);
    }
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, vol, filterFreq, pan = 0, when = 0) {
    if (!ensure() || muted) return;
    const t0 = ctx.currentTime + when;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    src.connect(filter);
    filter.connect(gain);
    if (panner) {
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      gain.connect(panner);
      panner.connect(master);
    } else {
      gain.connect(master);
    }
    src.start(t0);
  }

  const audio = {
    unlock() { ensure(); },
    get isMuted() { return muted; },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    // A soft wooden tick. pan -1 (left) .. 1 (right) says where the guard is.
    footstep(pan, loud) {
      noiseBurst(0.07, loud ? 0.22 : 0.09, 420, pan);
    },
    pickup() {
      tone(880, 0.12, 'sine', 0.22);
      tone(1318, 0.18, 'sine', 0.18, 0.07);
    },
    heart() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'sine', 0.2, i * 0.09));
    },
    lanternDouse() {
      tone(320, 0.25, 'sine', 0.14, 0, 140);
      noiseBurst(0.12, 0.08, 900);
    },
    lanternKindle() {
      tone(180, 0.3, 'triangle', 0.16, 0, 520);
    },
    flare() {
      noiseBurst(0.5, 0.3, 2400);
      tone(1567, 0.4, 'sine', 0.14, 0, 2093);
    },
    spotted() {
      tone(196, 0.16, 'square', 0.14);
      tone(147, 0.22, 'square', 0.14, 0.12);
    },
    alarm() {
      tone(440, 0.14, 'sawtooth', 0.16);
      tone(440, 0.14, 'sawtooth', 0.16, 0.18);
      tone(587, 0.3, 'sawtooth', 0.16, 0.36);
    },
    caught() {
      tone(220, 0.5, 'sawtooth', 0.2, 0, 55);
      noiseBurst(0.4, 0.2, 500);
    },
    levelClear() {
      [392, 523, 659, 784].forEach((f, i) => tone(f, 0.25, 'triangle', 0.18, i * 0.1));
    },
    win() {
      [523, 659, 784, 1046, 1318, 1567].forEach((f, i) => tone(f, 0.35, 'triangle', 0.18, i * 0.12));
    },
    doorSealed() {
      tone(110, 0.18, 'square', 0.12);
    },
    startWind() {
      if (!ensure() || windNodes || muted) return;
      const len = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i += 1) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02; // brown-ish, soft
        data[i] = last * 3.2;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      const gain = ctx.createGain();
      gain.gain.value = 0.05;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start();
      // A slow swell, like wind over the tower, on an LFO.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.025;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      windNodes = { src, lfo };
    },
  };
  return audio;
}
