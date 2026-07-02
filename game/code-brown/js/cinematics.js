/* CB.cine: the Lanik truck rescue cinematic (win and overflow-rescue variants). */
(function () {
  'use strict';

  var U = CB.util;

  var cine = {
    active: false,
    kind: 'win',
    t: 0,
    dur: 23,
    rate: 1,
    startFill: 99,
    onDone: null
  };

  var lastT = 0;
  var done = false;
  var wheelRot = 0;
  var lastTruckX = 0;
  var events = [];
  var evIdx = 0;
  var t0 = 0;

  /* small local particle pool: dust, confetti, brown rain */
  var parts = [];
  var PMAX = 90;
  for (var i = 0; i < PMAX; i++) parts.push({ life: 0 });

  function spawnPart(x, y, vx, vy, life, size, color, grav) {
    for (var i = 0; i < PMAX; i++) {
      if (parts[i].life <= 0) {
        var p = parts[i];
        p.x = x; p.y = y; p.vx = vx; p.vy = vy;
        p.life = life; p.maxLife = life;
        p.size = size; p.color = color; p.grav = grav || 0;
        return;
      }
    }
  }

  function seg(t, a, b, ease) {
    if (t <= a) return 0;
    if (t >= b) return 1;
    var k = (t - a) / (b - a);
    return ease ? ease(k) : k;
  }

  function truckX(t) {
    var x = 500;
    x += (-42 - 500) * seg(t, t0, t0 + 3.0, U.easeOutCubic);
    x += (8 - (-42)) * seg(t, t0 + 3.0, t0 + 4.6, U.easeInOut);
    x += (-340 - 8) * seg(t, t0 + 18.6, t0 + 20.8, U.easeInCubic);
    return x;
  }

  function buildEvents() {
    var A = CB.audio;
    events = [
      [t0 + 0.02, function () { A.startLoop('engine'); A.engineRpm(0.95); }],
      [t0 + 3.0, function () { A.startLoop('reverse'); A.engineRpm(0.4); }],
      [t0 + 4.6, function () { A.stopLoop('reverse'); A.sfx.airbrake(); A.engineRpm(0.15); }],
      [t0 + 7.4, function () { A.sfx.clunk(); }],
      [t0 + 7.6, function () {
        A.startLoop('gurgle');
        A.engineRpm(0.55);
        if (cine.kind === 'rescue') A.stopLoop('siren');
      }],
      [t0 + 15.6, function () {
        A.stopLoop('gurgle');
        A.sfx.bigSlurp();
        A.sfx.fart();
        A.engineRpm(0.15);
      }],
      [t0 + 16.6, function () { if (cine.kind === 'win') A.sfx.jingle(); }],
      [t0 + 18.2, function () { A.sfx.horn(); }],
      [t0 + 18.6, function () { A.engineRpm(1); }],
      [t0 + 20.9, function () { A.stopLoop('engine'); }]
    ];
    evIdx = 0;
  }

  function start(kind, startFill, onDone) {
    cine.active = true;
    cine.kind = kind === 'rescue' ? 'rescue' : 'win';
    cine.t = 0;
    cine.rate = cine.kind === 'rescue' ? 1.12 : 1;
    cine.startFill = U.clamp(startFill || 99, 20, 100);
    cine.onDone = onDone || null;
    t0 = cine.kind === 'rescue' ? 2.0 : 0;
    cine.dur = t0 + 21.6;
    lastT = 0;
    done = false;
    wheelRot = 0;
    lastTruckX = truckX(0);
    for (var i = 0; i < PMAX; i++) parts[i].life = 0;
    buildEvents();
  }

  function finish() {
    if (done) return;
    done = true;
    cine.active = false;
    CB.audio.stopAllLoops();
    if (cine.onDone) cine.onDone();
  }

  function skip() {
    if (!cine.active) return;
    finish();
  }

  function update(rawDt) {
    if (!cine.active) return;
    var dt = rawDt * cine.rate;
    lastT = cine.t;
    cine.t += dt;
    var t = cine.t;

    while (evIdx < events.length && events[evIdx][0] <= t) {
      if (events[evIdx][0] > lastT || evIdx === 0) events[evIdx][1]();
      evIdx++;
    }

    var tx = truckX(t);
    wheelRot += (lastTruckX - tx) * 0.045;
    lastTruckX = tx;

    /* dust while driving */
    var driving = (t > t0 && t < t0 + 4.6) || (t > t0 + 18.6 && t < t0 + 20.8);
    if (driving && Math.random() < 0.5 && !CB.reduceMotion) {
      spawnPart(tx + 240, CB.art.CINE.TRUCK_Y - 4, U.rand(20, 70), U.rand(-30, -6), U.rand(0.4, 0.8), U.rand(4, 9), 'rgba(180,160,130,0.7)', -20);
    }

    /* rescue prologue: geyser rain + panic */
    if (cine.kind === 'rescue' && t < t0 + 7.6 && Math.random() < 0.5) {
      var R = CB.art.CINE.RISER;
      spawnPart(R.x + U.rand(-30, 30), R.y - U.rand(120, 200), U.rand(-50, 50), U.rand(-40, 30), U.rand(0.5, 0.9), U.rand(4, 8), U.pick(['#7a5426', '#59391a']), 420);
    }

    /* pump-side bubbles out of the riser lid */
    if (t > t0 + 7.6 && t < t0 + 15.6 && Math.random() < 0.25) {
      var R2 = CB.art.CINE.RISER;
      spawnPart(R2.x + U.rand(-14, 14), R2.y - 4, U.rand(-14, 14), U.rand(-50, -20), U.rand(0.3, 0.6), U.rand(2, 5), 'rgba(255,255,255,0.5)', 60);
    }

    /* celebration confetti */
    if (cine.kind === 'win' && t > t0 + 16.6 && t < t0 + 19 && Math.random() < 0.6 && !CB.reduceMotion) {
      spawnPart(U.rand(60, 460), U.rand(180, 320), U.rand(-40, 40), U.rand(10, 60), U.rand(0.8, 1.4), U.rand(3, 6),
        U.pick(['#f4c20d', '#c8202b', '#1c3f8f', '#7ecb3f', '#fff']), 150);
    }

    for (var p = 0; p < PMAX; p++) {
      var pa = parts[p];
      if (pa.life <= 0) continue;
      pa.life -= dt;
      pa.vy += (pa.grav || 0) * dt;
      pa.x += pa.vx * dt;
      pa.y += pa.vy * dt;
    }

    if (t >= cine.dur) finish();
  }

  function draw(g) {
    if (!cine.active) return;
    var art = CB.art;
    var CN = art.CINE;
    var t = cine.t;

    var pumpA = t0 + 7.6, pumpB = t0 + 15.6;
    var pump = seg(t, pumpA, pumpB, U.easeInOut);
    var fill = U.lerp(cine.startFill, 0, pump);
    var lawnT = cine.kind === 'win'
      ? 0.55 + 0.45 * seg(t, pumpB, t0 + 18)
      : 0.3 + 0.5 * seg(t, pumpB, t0 + 18);

    art.cineBase(g, lawnT, t);
    art.tankLiquid(g, CN.TANK, fill, t, fill > 90);
    art.tankLabel(g, CN.TANK, fill, fill > 90, false, true);

    /* geyser during rescue prologue, dying once the pump kicks in */
    if (cine.kind === 'rescue') {
      var power = t < pumpA ? Math.min(1, 0.5 + t * 0.3) : Math.max(0, 1 - (t - pumpA) * 1.4);
      art.geyserColumn(g, CN.RISER.x, CN.RISER.y - 4, t, power);
    }

    /* family */
    var cheerT = cine.kind === 'win' ? seg(t, t0 + 16.4, t0 + 16.8) : seg(t, t0 + 16.8, t0 + 17.2) * 0.6;
    art.family(g, CN.FAMILY.x, CN.FAMILY.y, {
      t: t,
      cheer: cheerT,
      panic: cine.kind === 'rescue' && t < pumpA
    });

    /* truck + hose + tech */
    var tx = truckX(t);
    var parked = t > t0 + 4.6 && t < t0 + 18.6;
    var bounce = parked ? Math.sin(t * 2.2) * 1.2 : Math.sin(t * 14) * 2.4;
    var pumping = t > pumpA && t < pumpB;
    if (pumping) bounce = Math.sin(t * 10) * 1.8;

    var TR = art.TRUCK;
    var truckTop = CN.TRUCK_Y - TR.H + 18 + bounce;
    var reelX = tx + TR.reel.x;
    var reelY = truckTop + TR.reel.y;

    var hoseExt = seg(t, t0 + 6.0, t0 + 7.4, U.easeInOut) - seg(t, pumpB, t0 + 16.6, U.easeInOut);
    if (hoseExt > 0.01 && parked) {
      art.hose(g, reelX, reelY, CN.RISER.x, CN.RISER.y - 8, hoseExt, t, pumping);
    }

    art.truck(g, tx, CN.TRUCK_Y, {
      wheelRot: wheelRot,
      gauge: pump,
      beaconOn: true,
      t: t,
      bounce: bounce
    });

    /* the tech: hops out, walks to the riser, walks back */
    if (parked) {
      var outT = seg(t, t0 + 4.8, t0 + 6.2, U.easeInOut);
      var backT = seg(t, pumpB + 0.2, t0 + 17.4, U.easeInOut);
      var cabX = tx + 46;
      var techX = U.lerp(U.lerp(cabX, 330, outT), cabX, backT);
      var moving = (outT > 0 && outT < 1) || (backT > 0 && backT < 1);
      if (outT > 0.02 && backT < 0.98) {
        art.tech(g, techX, CN.TRUCK_Y + 2, {
          walk: t,
          moving: moving,
          flip: backT > 0.02 && backT < 0.98,
          carrying: hoseExt > 0.05 && hoseExt < 0.98 && t < pumpA,
          thumbsUp: pumping
        });
      }
    }

    /* particles */
    for (var p = 0; p < PMAX; p++) {
      var pa = parts[p];
      if (pa.life <= 0) continue;
      g.globalAlpha = Math.max(0, pa.life / pa.maxLife);
      g.fillStyle = pa.color;
      g.beginPath();
      g.arc(pa.x, pa.y, pa.size, 0, U.TAU);
      g.fill();
    }
    g.globalAlpha = 1;

    /* flowers pop on the healed lawn */
    if (cine.kind === 'win') {
      var fl = seg(t, t0 + 16.8, t0 + 17.8, U.easeOutBack);
      if (fl > 0) {
        var spots = [[70, 480], [150, 505], [230, 470], [120, 545], [40, 520]];
        for (var s = 0; s < spots.length; s++) {
          var fs = U.clamp(fl * (1 + s * 0.08) - s * 0.08, 0, 1);
          if (fs <= 0) continue;
          g.save();
          g.translate(spots[s][0], spots[s][1]);
          g.scale(fs, fs);
          g.strokeStyle = '#2f8a2a';
          g.lineWidth = 3;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -14); g.stroke();
          g.fillStyle = ['#ff5fa2', '#f4c20d', '#fff'][s % 3];
          for (var pe = 0; pe < 5; pe++) {
            var an = pe / 5 * U.TAU;
            g.beginPath();
            g.arc(Math.cos(an) * 5, -14 + Math.sin(an) * 5, 4, 0, U.TAU);
            g.fill();
          }
          g.fillStyle = '#8a5a33';
          g.beginPath(); g.arc(0, -14, 3.5, 0, U.TAU); g.fill();
          g.restore();
        }
      }
    }

    /* end card */
    var cardA = seg(t, t0 + 19.6, t0 + 20.6);
    if (cine.kind === 'win') {
      art.endCard(g, cardA, 'TANK YOU, LANIK!', '"We Take Crap From Everyone!"');
    } else {
      art.endCard(g, cardA, 'DISASTER AVERTED', 'Next time, call BEFORE the fountain.');
    }
  }

  cine.start = start;
  cine.update = update;
  cine.draw = draw;
  cine.skip = skip;

  CB.cine = cine;
})();
