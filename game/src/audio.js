// Ember & Thyme — all sound is synthesised with WebAudio: short oscillator
// blips and noise bursts, no audio files. Created lazily on first user
// gesture so browsers allow it; silent until then.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, filterFreq) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime;
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(t0);
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    isMuted() { return muted; },
    pickup() { tone(520, 0.09, 'sine', 0.12, 700); },
    drop() { tone(300, 0.08, 'sine', 0.1, 220); },
    chop() { noise(0.07, 0.25, 1800); tone(180, 0.06, 'square', 0.08, 120); },
    chopDone() { tone(660, 0.1, 'sine', 0.12, 880); },
    sizzle() { noise(0.25, 0.1, 5000); },
    cooked() { tone(740, 0.12, 'sine', 0.12, 990); },
    serve() {
      [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'triangle', 0.14), i * 90));
    },
    fail() { tone(160, 0.3, 'sawtooth', 0.12, 90); },
    tick() { tone(880, 0.05, 'square', 0.05); },
    rush() { tone(392, 0.18, 'triangle', 0.12, 523); tone(523, 0.18, 'triangle', 0.1, 659); },
  };
}
