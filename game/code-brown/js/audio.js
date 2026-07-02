/* CB.audio: WebAudio-synthesized SFX. No audio files. Lazy init on first user gesture. */
(function () {
  'use strict';

  var ctx = null;
  var master = null;
  var noiseBuf = null;
  var loops = {};
  var muted = CB.save.get('muted') === true;

  function init() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC({ latencyHint: 'interactive' });
    } catch (e) {
      try { ctx = new AC(); } catch (e2) { return; }
    }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 4;
    master.connect(comp);
    comp.connect(ctx.destination);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function unlock() {
    if (ctx && ctx.state !== 'running') {
      ctx.resume().catch(function () {});
    }
  }

  function env(g, t0, vol, attack, dur) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }

  /* one oscillator voice: pitch glide f0 -> f1 over dur */
  function tone(o) {
    if (!ctx) return;
    var t0 = ctx.currentTime + (o.delay || 0);
    var osc = ctx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t0);
    if (o.f1 && o.f1 !== o.f0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t0 + (o.glide || o.dur));
    }
    var g = ctx.createGain();
    env(g, t0, o.vol || 0.3, o.attack || 0.005, o.dur);
    osc.connect(g);
    if (o.filter) {
      var f = ctx.createBiquadFilter();
      f.type = o.filter;
      f.frequency.value = o.ff || 800;
      f.Q.value = o.fq || 1;
      g.connect(f);
      f.connect(master);
    } else {
      g.connect(master);
    }
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.05);
  }

  /* filtered noise burst */
  function noiseHit(o) {
    if (!ctx || !noiseBuf) return;
    var t0 = ctx.currentTime + (o.delay || 0);
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    var f = ctx.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.f || 800, t0);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t0 + o.dur);
    f.Q.value = o.q || 1;
    var g = ctx.createGain();
    env(g, t0, o.vol || 0.3, o.attack || 0.004, o.dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + o.dur + 0.05);
  }

  /* ---------- one-shots ---------- */

  var sfx = {
    pop: function (combo) {
      var c = Math.min(combo || 1, 10);
      tone({ type: 'square', f0: 420 + c * 34, f1: 740 + c * 40, dur: 0.11, vol: 0.22, glide: 0.06 });
      noiseHit({ f: 2400, q: 2, dur: 0.05, vol: 0.08, type: 'highpass' });
    },
    plink: function () {
      tone({ type: 'sine', f0: 300, f1: 130, dur: 0.14, vol: 0.14 });
      noiseHit({ f: 700, f1: 250, q: 2, dur: 0.12, vol: 0.1, type: 'lowpass' });
    },
    splat: function () {
      noiseHit({ f: 900, f1: 160, q: 0.8, dur: 0.22, vol: 0.34, type: 'lowpass' });
      tone({ type: 'sine', f0: 150, f1: 55, dur: 0.16, vol: 0.26 });
    },
    fart: function () {
      var base = 96 + Math.random() * 40;
      if (!ctx) return;
      var t0 = ctx.currentTime;
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(base, t0);
      osc.frequency.exponentialRampToValueAtTime(base * 0.62, t0 + 0.3);
      var lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.value = 24 + Math.random() * 14;
      var lfoG = ctx.createGain();
      lfoG.gain.value = 26;
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);
      var f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 460;
      var g = ctx.createGain();
      env(g, t0, 0.34, 0.01, 0.32);
      osc.connect(f); f.connect(g); g.connect(master);
      osc.start(t0); lfo.start(t0);
      osc.stop(t0 + 0.38); lfo.stop(t0 + 0.38);
    },
    buzz: function () {
      tone({ type: 'square', f0: 110, dur: 0.2, vol: 0.2 });
      tone({ type: 'square', f0: 113, dur: 0.2, vol: 0.2 });
    },
    ding: function (step) {
      var f = 523.25 * Math.pow(2, ((step || 0) % 5) * 2 / 12);
      tone({ type: 'triangle', f0: f, dur: 0.22, vol: 0.2 });
      tone({ type: 'triangle', f0: f * 2, dur: 0.16, vol: 0.08 });
    },
    whoosh: function () {
      noiseHit({ f: 500, f1: 2600, q: 1.4, dur: 0.18, vol: 0.12 });
    },
    ring: function () {
      if (!ctx) return;
      for (var b = 0; b < 2; b++) {
        var dl = b * 2.0;
        tone({ type: 'sine', f0: 440, dur: 1.1, vol: 0.12, delay: dl });
        tone({ type: 'sine', f0: 480, dur: 1.1, vol: 0.12, delay: dl });
      }
    },
    airbrake: function () {
      noiseHit({ f: 3000, f1: 900, q: 0.7, dur: 0.5, vol: 0.22, type: 'bandpass' });
    },
    clunk: function () {
      tone({ type: 'sine', f0: 130, f1: 60, dur: 0.12, vol: 0.32 });
      noiseHit({ f: 300, q: 3, dur: 0.06, vol: 0.16 });
    },
    horn: function () {
      tone({ type: 'sawtooth', f0: 370, dur: 0.28, vol: 0.2, attack: 0.01 });
      tone({ type: 'sawtooth', f0: 466, dur: 0.28, vol: 0.2, attack: 0.01 });
      tone({ type: 'sawtooth', f0: 370, dur: 0.4, vol: 0.2, delay: 0.36 });
      tone({ type: 'sawtooth', f0: 466, dur: 0.4, vol: 0.2, delay: 0.36 });
    },
    jingle: function () {
      var notes = [523.25, 659.25, 783.99, 1046.5];
      for (var i = 0; i < notes.length; i++) {
        tone({ type: 'triangle', f0: notes[i], dur: 0.26, vol: 0.2, delay: i * 0.13 });
        tone({ type: 'square', f0: notes[i] / 2, dur: 0.2, vol: 0.06, delay: i * 0.13 });
      }
      noiseHit({ f: 6000, q: 0.7, dur: 0.5, vol: 0.08, type: 'highpass', delay: 0.52 });
    },
    womp: function () {
      tone({ type: 'sawtooth', f0: 220, f1: 110, dur: 0.5, vol: 0.16, filter: 'lowpass', ff: 700 });
      tone({ type: 'sawtooth', f0: 208, f1: 98, dur: 0.6, vol: 0.14, delay: 0.35, filter: 'lowpass', ff: 600 });
    },
    bigSlurp: function () {
      noiseHit({ f: 250, f1: 1800, q: 3, dur: 0.7, vol: 0.3 });
      tone({ type: 'sine', f0: 90, f1: 320, dur: 0.7, vol: 0.16 });
    }
  };

  /* ---------- stoppable loops ---------- */

  var loopMakers = {
    siren: function () {
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 720;
      var lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.value = 2.6;
      var lfoG = ctx.createGain();
      lfoG.gain.value = 130;
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);
      var g = ctx.createGain();
      g.gain.value = 0.055;
      osc.connect(g);
      g.connect(master);
      osc.start(); lfo.start();
      return { gain: g, nodes: [osc, lfo] };
    },
    engine: function () {
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 52;
      var f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 240;
      var lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 9;
      var lfoG = ctx.createGain();
      lfoG.gain.value = 0.05;
      var g = ctx.createGain();
      g.gain.value = 0.16;
      lfo.connect(lfoG);
      lfoG.connect(g.gain);
      osc.connect(f); f.connect(g); g.connect(master);
      osc.start(); lfo.start();
      return { gain: g, nodes: [osc, lfo], osc: osc };
    },
    reverse: function () {
      var timer = setInterval(function () {
        tone({ type: 'square', f0: 990, dur: 0.16, vol: 0.1 });
      }, 600);
      tone({ type: 'square', f0: 990, dur: 0.16, vol: 0.1 });
      return { timer: timer, nodes: [] };
    },
    gurgle: function () {
      var src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      var f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 320;
      f.Q.value = 2;
      var lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 1.7;
      var lfoG = ctx.createGain();
      lfoG.gain.value = 190;
      lfo.connect(lfoG);
      lfoG.connect(f.frequency);
      var g = ctx.createGain();
      g.gain.value = 0.2;
      src.connect(f); f.connect(g); g.connect(master);
      src.start(); lfo.start();
      var timer = setInterval(function () {
        tone({ type: 'sine', f0: 160 + Math.random() * 140, f1: 60, dur: 0.12, vol: 0.12 });
      }, 320);
      return { gain: g, nodes: [src, lfo], timer: timer };
    }
  };

  function startLoop(name) {
    if (!ctx || loops[name] || !loopMakers[name]) return;
    loops[name] = loopMakers[name]();
  }

  function stopLoop(name) {
    var L = loops[name];
    if (!L) return;
    delete loops[name];
    if (L.timer) clearInterval(L.timer);
    if (L.gain) {
      try {
        L.gain.gain.setValueAtTime(L.gain.gain.value, ctx.currentTime);
        L.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      } catch (e) {}
    }
    setTimeout(function () {
      for (var i = 0; i < L.nodes.length; i++) {
        try { L.nodes[i].stop(); } catch (e) {}
        try { L.nodes[i].disconnect(); } catch (e) {}
      }
    }, 150);
  }

  function stopAllLoops() {
    for (var k in loops) stopLoop(k);
  }

  function engineRpm(x) {
    var L = loops.engine;
    if (!L || !L.osc) return;
    try {
      L.osc.frequency.linearRampToValueAtTime(45 + 35 * x, ctx.currentTime + 0.3);
    } catch (e) {}
  }

  function setMuted(b) {
    muted = !!b;
    CB.save.set('muted', muted);
    if (master) {
      try {
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(muted ? 0 : 0.9, ctx.currentTime + 0.08);
      } catch (e) {
        master.gain.value = muted ? 0 : 0.9;
      }
    }
  }

  CB.audio = {
    init: init,
    unlock: unlock,
    sfx: sfx,
    startLoop: startLoop,
    stopLoop: stopLoop,
    stopAllLoops: stopAllLoops,
    engineRpm: engineRpm,
    setMuted: setMuted,
    toggleMute: function () { setMuted(!muted); return muted; },
    isMuted: function () { return muted; },
    activeLoops: function () { return Object.keys(loops); }
  };
})();
