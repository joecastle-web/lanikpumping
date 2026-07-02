/* CB.game: the playfield simulation. Items, waves, tank fill, scoring, particles. */
(function () {
  'use strict';

  var U = CB.util;

  var CONFIG = {
    START_FILL: 10,
    GOOD_FILL: 0.5,
    MISS_SCALE: 1,
    PASSIVE_SCALE: 1,
    FLING_DUR: 0.35,
    CRIT_DUR: 1.6
  };

  /* good = belongs in the tank (never tap); v = speed multiplier */
  var ITEMS = {
    pee:    { good: true,  r: 20, v: 1.0 },
    poo:    { good: true,  r: 24, v: 1.0 },
    poo2:   { good: true,  r: 24, v: 1.0 },
    poo3:   { good: true,  r: 30, v: 0.92 },
    tp:     { good: true,  r: 20, v: 1.05 },
    wipe:   { good: false, r: 24, v: 1.0 },
    ptowel: { good: false, r: 25, v: 0.95 },
    grease: { good: false, r: 26, v: 0.85 },
    toy:    { good: false, r: 23, v: 1.05 },
    phone:  { good: false, r: 22, v: 1.1 },
    fish:   { good: false, r: 22, v: 1.05, bonus: 250 },
    diaper: { good: false, r: 27, v: 0.9 },
    sock:   { good: false, r: 23, v: 1.0 },
    swab:   { good: false, r: 19, v: 1.12 },
    floss:  { good: false, r: 20, v: 1.08 },
    cig:    { good: false, r: 17, v: 1.15 },
    hair:   { good: false, r: 23, v: 1.0 },
    pad:    { good: false, r: 25, v: 0.95 },
    roll:   { good: false, r: 26, v: 0.95 },
    duck:   { good: false, r: 22, v: 1.0 },
    car:    { good: false, r: 22, v: 1.1 },
    brick:  { good: false, r: 18, v: 1.12 },
    hamster:{ good: false, r: 24, v: 0.92, bonus: 250 }
  };

  var QUIPS = {
    wipe: ['LIAR!', '"FLUSHABLE"', 'MARKETING!'],
    ptowel: ['TOO SWOLE!', 'NOT TP!'],
    grease: ['FATBERG FUEL!', 'NOT A DRAIN SNACK!'],
    toy: ['NOT A TOY BOX!', 'RAWR. NO.'],
    phone: ['CALL LANIK ON IT!', 'HELLO? NO.'],
    fish: ['PROPER BURIAL!', 'HE DESERVED BETTER!'],
    diaper: ['ABSOLUTELY NOT', 'CODE YELLOW!'],
    sock: ['HOW?!', 'LAUNDRY DAY!'],
    swab: ['TINY TERROR', 'EAR THIS!'],
    floss: ['STRINGY MENACE'],
    cig: ['GROSS.', 'BUTT OUT!'],
    hair: ['EW.', 'DRAIN SPIDER!'],
    pad: ['TRASH. ALWAYS.'],
    roll: ['A WHOLE ROLL?!', 'SLOW DOWN!'],
    duck: ['NOT BATH TIME!', 'QUACK. NO.'],
    car: ['NO PARKING!', 'VROOM. TRASH.'],
    brick: ['FOOT KILLER!', 'BUILD ELSEWHERE!'],
    hamster: ['BACKYARD FUNERAL!', 'NOT A BURIAL AT SEA!']
  };

  var OOPS_QUIPS = ['THAT BELONGS THERE!', 'THE GOOD STUFF!', 'WHY?!', 'LET IT RIDE!'];

  var WAVES = [
    {
      name: 'MONDAY MORNING', sub: 'ease into it',
      good: 6, junk: 4, speed: 98, interval: 2.0, maxAlive: 3, passive: 0.14, miss: 2.0,
      goodMix: { pee: 2, poo: 3, tp: 2 }, junkMix: { wipe: 3, duck: 1 },
      factTitle: 'LANIK GUY SAYS', fact: 'The 3 P\'s, friend: Pee, Poo and (toilet) Paper. That\'s the whole guest list. NOTHING else goes down the hatch!'
    },
    {
      name: 'THE "FLUSHABLE" LIE', sub: 'believe nothing',
      good: 7, junk: 6, speed: 104, interval: 1.7, maxAlive: 4, passive: 0.16, miss: 2.5,
      goodMix: { pee: 2, poo: 3, tp: 2 }, junkMix: { wipe: 4, swab: 1, ptowel: 1 },
      factTitle: 'LANIK GUY SAYS', fact: '"Flushable" wipes are a dirty lie. That label is marketing, not science. I\'ve pumped a thousand tanks, and the wipes NEVER break down!'
    },
    {
      name: 'TACO TUESDAY', sub: 'hold your fire on the good stuff',
      good: 8, junk: 8, speed: 111, interval: 1.55, maxAlive: 5, passive: 0.19, miss: 3.0,
      goodMix: { poo: 3, poo2: 2, poo3: 2, pee: 1 }, junkMix: { grease: 4, wipe: 2, toy: 1, brick: 1 },
      factTitle: 'LANIK GUY SAYS', fact: 'Grease sets up in your pipes like concrete. Fatbergs are real, and I\'ve shaken hands with a few. The sink is not a deep fryer graveyard!'
    },
    {
      name: 'HOUSE PARTY', sub: 'your guests are animals',
      good: 9, junk: 11, speed: 120, interval: 1.35, maxAlive: 6, passive: 0.21, miss: 3.5,
      goodMix: { pee: 3, poo: 3, poo2: 2, tp: 1 }, junkMix: { cig: 2, ptowel: 2, phone: 1, sock: 2, floss: 1, car: 1, duck: 1, fish: 1 },
      factTitle: 'LANIK GUY SAYS', fact: 'Paper towels are toilet paper that LIFTS WEIGHTS. They do not dissolve. They do not surrender. TRASH them!'
    },
    {
      name: 'LAUNDRY DAY', sub: 'a whole roll is not a serving size',
      good: 10, junk: 14, speed: 129, interval: 1.2, maxAlive: 7, passive: 0.23, miss: 4.0,
      goodMix: { tp: 4, poo: 3, poo2: 2, pee: 1 }, junkMix: { roll: 3, pad: 2, diaper: 2, hair: 2, wipe: 2, sock: 1, hamster: 1, brick: 1 },
      factTitle: 'LANIK GUY SAYS', fact: 'If it can ABSORB, it can EXPAND. Diapers and pads are tank torpedoes. Trash it, don\'t flush it!'
    },
    {
      name: 'CODE BROWN', sub: 'everything, everywhere, all at once',
      good: 11, junk: 18, speed: 140, interval: 1.1, maxAlive: 8, passive: 0.25, miss: 4.5,
      goodMix: { poo: 3, poo2: 2, poo3: 2, pee: 2, tp: 2 }, junkMix: { wipe: 2, grease: 2, ptowel: 2, roll: 2, hair: 2, cig: 1, swab: 1, diaper: 1, phone: 1, toy: 1, duck: 1, car: 1, brick: 1, hamster: 1, fish: 1 },
      factTitle: 'LANIK GUY\'S FINAL WORD', fact: 'Every tank fills up eventually. That\'s not defeat, that\'s PLUMBING. Pump every 3 years, and remember: We Take Crap From Everyone!'
    }
  ];

  var STAR3 = [0, 0, 0, 1, 1, 1];
  var STAR2 = [1, 1, 2, 2, 3, 4];
  var STAR1 = [2, 3, 3, 4, 6, 8];

  var GRADES = [
    [26000, 'S', 'SEPTIC SENSEI'],
    [18000, 'A', 'FLUSH GORDON'],
    [12000, 'B', 'COMMODE COMMANDO'],
    [7000, 'C', 'POTTY TRAINED'],
    [3000, 'D', 'DRAIN ROOKIE'],
    [0, 'F', 'FATBERG FARMER']
  ];

  /* ---------- state ---------- */

  var S = null;
  var parts = [];
  var pops = [];
  var PART_MAX = 160;
  var POP_MAX = 24;

  for (var i = 0; i < PART_MAX; i++) parts.push({ life: 0 });
  for (var j = 0; j < POP_MAX; j++) pops.push({ life: 0 });

  function freshState() {
    return {
      phase: 'idle',
      wave: 1,
      items: [],
      bag: [],
      spawnT: 0,
      lastSpawnX: -999,
      time: 0,
      score: 0,
      combo: 0,
      mult: 1,
      fill: CONFIG.START_FILL,
      stars: [],
      waveMissed: 0,
      critT: 0,
      critFrom: 0,
      gulpT: 0,
      shakeMag: 0,
      shakeT: 0,
      shakeDur: 0.3,
      speedMul: 1,
      noSpawn: false,
      autopilot: false,
      autoT: 0,
      firedEnd: false,
      stats: { junkFlung: 0, clogs: 0, goodTapped: 0, goodDelivered: 0, taps: 0, whiffs: 0, bestCombo: 0 }
    };
  }

  function emit(type, payload) {
    if (CB.game.onEvent) CB.game.onEvent(type, payload);
  }

  /* ---------- helpers ---------- */

  function multFor(combo) {
    if (combo >= 15) return 5;
    if (combo >= 10) return 4;
    if (combo >= 6) return 3;
    if (combo >= 3) return 2;
    return 1;
  }

  function addShake(m) {
    if (CB.reduceMotion) m *= 0.3;
    S.shakeMag = Math.max(S.shakeMag, m);
    S.shakeT = 0;
  }

  function spawnPart(x, y, vx, vy, life, size, color, grav) {
    for (var i = 0; i < PART_MAX; i++) {
      if (parts[i].life <= 0) {
        var p = parts[i];
        p.x = x; p.y = y; p.vx = vx; p.vy = vy;
        p.life = life; p.maxLife = life;
        p.size = size; p.color = color; p.grav = grav || 0;
        return;
      }
    }
  }

  function burst(x, y, n, colors, speed, grav, size) {
    if (CB.reduceMotion) n = Math.ceil(n / 2);
    for (var i = 0; i < n; i++) {
      var a = U.rand(0, U.TAU);
      var v = U.rand(speed * 0.3, speed);
      spawnPart(x, y, Math.cos(a) * v, Math.sin(a) * v - speed * 0.4, U.rand(0.35, 0.7), U.rand(size * 0.6, size), U.pick(colors), grav);
    }
  }

  function popup(x, y, txt, color, size) {
    var oldest = null;
    for (var i = 0; i < POP_MAX; i++) {
      if (pops[i].life <= 0) { oldest = pops[i]; break; }
      if (!oldest || pops[i].life < oldest.life) oldest = pops[i];
    }
    oldest.x = U.clamp(x, 70, 410);
    oldest.y = y;
    oldest.txt = txt;
    oldest.color = color;
    oldest.size = size || 22;
    oldest.life = 0.95;
    oldest.maxLife = 0.95;
  }

  function expandMix(mix, count) {
    var keys = [], weights = [], total = 0, k;
    for (k in mix) { keys.push(k); weights.push(mix[k]); total += mix[k]; }
    var out = [], acc = [], sum = 0, i;
    for (i = 0; i < keys.length; i++) {
      var exact = count * weights[i] / total;
      var base = Math.floor(exact);
      acc.push({ k: keys[i], frac: exact - base });
      sum += base;
      for (var b = 0; b < base; b++) out.push(keys[i]);
    }
    acc.sort(function (a, b) { return b.frac - a.frac; });
    for (i = 0; sum < count; i++, sum++) out.push(acc[i % acc.length].k);
    /* shuffle */
    for (i = out.length - 1; i > 0; i--) {
      var r = (Math.random() * (i + 1)) | 0;
      var tmp = out[i]; out[i] = out[r]; out[r] = tmp;
    }
    return out;
  }

  /* ---------- lifecycle ---------- */

  function reset() {
    S = freshState();
    for (var i = 0; i < PART_MAX; i++) parts[i].life = 0;
    for (var j = 0; j < POP_MAX; j++) pops[j].life = 0;
  }

  function startWave(n) {
    var w = WAVES[n - 1];
    if (!w) return;
    S.wave = n;
    S.phase = 'wave';
    S.bag = expandMix(w.goodMix, w.good).concat(expandMix(w.junkMix, w.junk));
    /* interleave: reshuffle the combined bag */
    for (var i = S.bag.length - 1; i > 0; i--) {
      var r = (Math.random() * (i + 1)) | 0;
      var tmp = S.bag[i]; S.bag[i] = S.bag[r]; S.bag[r] = tmp;
    }
    S.spawnT = 0.6;
    S.waveMissed = 0;
    S.firedEnd = false;
  }

  function spawnItem(type, forcedX) {
    var L = CB.art.LAYOUT;
    var def = ITEMS[type];
    if (!def) return null;
    var w = WAVES[S.wave - 1];
    var x = forcedX;
    if (x == null) {
      for (var tries = 0; tries < 4; tries++) {
        x = U.rand(L.FIELD_L + 26, L.FIELD_R - 26);
        if (Math.abs(x - S.lastSpawnX) > 70) break;
      }
    }
    S.lastSpawnX = x;
    var it = {
      type: type,
      good: def.good,
      r: def.r,
      x: x,
      baseX: x,
      y: L.SPAWN_Y,
      vy: (w ? w.speed : 100) * def.v * U.rand(0.92, 1.08),
      wobA: U.rand(8, 22),
      wobF: U.rand(1.4, 2.6),
      wobPh: U.rand(0, U.TAU),
      rot: U.rand(-0.3, 0.3),
      rotV: U.rand(-0.9, 0.9),
      state: 'falling',
      t: 0
    };
    S.items.push(it);
    burst(x, L.SPAWN_Y + 4, 4, ['#b8c4c9', '#8d979e'], 60, 200, 4);
    return it;
  }

  function flingToCan(it) {
    var L = CB.art.LAYOUT;
    it.state = 'flung';
    it.t = 0;
    it.fx0 = it.x;
    it.fy0 = it.y;
    it.fx1 = L.CAN.x;
    it.fy1 = L.CAN.y - 26;
    it.fcx = (it.x + L.CAN.x) / 2 + 30;
    it.fcy = Math.min(it.y, it.fy1) - 130;
  }

  function resolveJunkTap(it, wx, wy) {
    var def = ITEMS[it.type];
    S.combo++;
    if (S.combo > S.stats.bestCombo) S.stats.bestCombo = S.combo;
    var newMult = multFor(S.combo);
    var gained = 100 * newMult + (def.bonus || 0);
    S.score += gained;
    S.stats.junkFlung++;
    if (newMult > S.mult) {
      CB.audio.sfx.ding(newMult);
      popup(it.x, it.y - 46, 'x' + newMult + '!', '#ffc53d', 30);
    }
    S.mult = newMult;
    flingToCan(it);
    CB.audio.sfx.pop(S.combo);
    burst(it.x, it.y, 8, ['#fff', '#ffc53d', '#f4c20d'], 150, 300, 5);
    popup(it.x, it.y - 16, '+' + gained, '#ffffff', 24);
    if (QUIPS[it.type] && Math.random() < 0.35) {
      popup(it.x, it.y - 74, U.pick(QUIPS[it.type]), '#f5f3ee', 17);
    }
  }

  function resolveGoodTap(it) {
    S.score = Math.max(0, S.score - 150);
    S.combo = 0;
    S.mult = 1;
    S.stats.goodTapped++;
    flingToCan(it);
    CB.audio.sfx.buzz();
    burst(it.x, it.y, 7, ['#c8202b', '#8a5a33'], 130, 300, 5);
    popup(it.x, it.y - 16, '-150', '#ff6b5e', 24);
    popup(it.x, it.y - 60, U.pick(OOPS_QUIPS), '#ff6b5e', 16);
    addShake(4);
    emit('oops', null);
  }

  function tap(wx, wy) {
    if (!S || (S.phase !== 'wave' && S.phase !== 'critical')) return false;
    S.stats.taps++;
    var best = null, bestJunk = null, dBest = 1e9, dBestJunk = 1e9;
    for (var i = 0; i < S.items.length; i++) {
      var it = S.items[i];
      if (it.state !== 'falling') continue;
      var rr = it.r + 24;
      var dx = it.x - wx, dy = it.y - wy;
      var d2 = dx * dx + dy * dy;
      if (d2 <= rr * rr) {
        if (!it.good && d2 < dBestJunk) { bestJunk = it; dBestJunk = d2; }
        if (d2 < dBest) { best = it; dBest = d2; }
      }
    }
    var target = bestJunk || best;
    if (!target) {
      S.stats.whiffs++;
      burst(wx, wy, 3, ['#ffffff'], 60, 0, 3);
      return true;
    }
    if (target.good) resolveGoodTap(target);
    else resolveJunkTap(target, wx, wy);
    return true;
  }

  function landItem(it) {
    var L = CB.art.LAYOUT;
    var w = WAVES[S.wave - 1];
    if (it.good) {
      S.score += 25;
      S.fill += CONFIG.GOOD_FILL;
      S.stats.goodDelivered++;
      it.state = 'splash';
      it.t = 0;
      CB.audio.sfx.plink();
      if ((it.type === 'poo' || it.type === 'poo2' || it.type === 'poo3') && Math.random() < 0.3) {
        CB.audio.sfx.fart();
      }
      burst(it.x, L.LAND_Y, 6, ['#7a5426', '#59391a', '#9c7442'], 90, 260, 4);
      popup(it.x, L.LAND_Y - 34, '+25', '#9fe870', 16);
    } else {
      var pen = (w ? w.miss : 3) * CONFIG.MISS_SCALE;
      S.fill += pen;
      S.combo = 0;
      S.mult = 1;
      S.stats.clogs++;
      S.waveMissed++;
      it.state = 'splash';
      it.t = 0;
      CB.audio.sfx.splat();
      burst(it.x, L.LAND_Y, 14, ['#7a5426', '#59391a', '#c8202b'], 170, 300, 6);
      popup(it.x, L.LAND_Y - 40, 'CLOG! +' + pen.toFixed(1) + '%', '#ff6b5e', 19);
      addShake(6);
      emit('clog', null);
    }
  }

  function endWave() {
    var n = S.wave;
    var missed = S.waveMissed;
    var stars = missed <= STAR3[n - 1] ? 3 : missed <= STAR2[n - 1] ? 2 : missed <= STAR1[n - 1] ? 1 : 0;
    S.stars.push(stars);
    var bonus = stars === 3 ? n * 250 : stars === 2 ? n * 100 : stars === 1 ? n * 50 : 0;
    S.score += bonus;
    S.phase = 'await';
    var w = WAVES[n - 1];
    emit('waveEnd', {
      n: n,
      stars: stars,
      bonus: bonus,
      fact: w.fact,
      factTitle: w.factTitle,
      last: n >= WAVES.length
    });
  }

  function beginCritical() {
    S.phase = 'critical';
    S.critT = 0;
    S.critFrom = S.fill;
    S.items.length = 0;
  }

  function beginGeyser() {
    S.phase = 'geyser';
    S.fill = 100;
    for (var i = 0; i < S.items.length; i++) {
      var it = S.items[i];
      if (it.state === 'falling') burst(it.x, it.y, 4, ['#7a5426', '#59391a'], 120, 300, 5);
    }
    S.items.length = 0;
    addShake(10);
    CB.audio.sfx.splat();
    CB.audio.sfx.fart();
    emit('overflow', null);
  }

  /* ---------- update ---------- */

  function update(rawDt) {
    if (!S || S.phase === 'idle') return;
    var dt = rawDt * S.speedMul;
    S.time += dt;
    var L = CB.art.LAYOUT;
    var w = WAVES[S.wave - 1];

    if (S.gulpT > 0) S.gulpT -= dt * 4;

    if (S.phase === 'wave') {
      S.fill += (w.passive * CONFIG.PASSIVE_SCALE) * dt;

      if (!S.noSpawn && S.bag.length > 0) {
        S.spawnT -= dt;
        var alive = 0;
        for (var a = 0; a < S.items.length; a++) {
          if (S.items[a].state === 'falling') alive++;
        }
        if (S.spawnT <= 0 && alive < w.maxAlive) {
          spawnItem(S.bag.pop());
          S.spawnT = w.interval * U.rand(0.85, 1.15);
        }
      }

      if (S.autopilot) {
        S.autoT -= dt;
        if (S.autoT <= 0) {
          var lowest = null;
          for (var b = 0; b < S.items.length; b++) {
            var cand = S.items[b];
            if (cand.state === 'falling' && !cand.good && (!lowest || cand.y > lowest.y)) lowest = cand;
          }
          if (lowest) tap(lowest.x, lowest.y);
          S.autoT = 0.13;
        }
      }

      if (S.fill >= 100) {
        beginGeyser();
      } else if (S.bag.length === 0 && S.items.length === 0 && !S.firedEnd) {
        S.firedEnd = true;
        endWave();
      }
    } else if (S.phase === 'critical') {
      S.critT += dt;
      var k = Math.min(1, S.critT / CONFIG.CRIT_DUR);
      S.fill = U.lerp(S.critFrom, 99, U.easeInOut(k));
      if (Math.random() < 0.1) addShake(3);
    } else if (S.phase === 'geyser') {
      if (Math.random() < 0.6) {
        var T = L.TANK;
        spawnPart(U.rand(T.x + 40, T.x + T.w - 40), T.y - 6, U.rand(-40, 40), U.rand(-380, -240), U.rand(0.5, 0.9), U.rand(5, 10), U.pick(['#7a5426', '#59391a', '#9c7442']), 520);
      }
      if (Math.random() < 0.08) addShake(5);
    }

    /* items */
    for (var i = S.items.length - 1; i >= 0; i--) {
      var it = S.items[i];
      it.t += dt;
      if (it.state === 'falling') {
        it.y += it.vy * dt;
        it.x = it.baseX + Math.sin(it.t * it.wobF + it.wobPh) * it.wobA;
        it.rot += it.rotV * dt;
        if (it.y >= L.LAND_Y) landItem(it);
      } else if (it.state === 'flung') {
        var ft = Math.min(1, it.t / CONFIG.FLING_DUR);
        var af = 1 - ft;
        it.x = af * af * it.fx0 + 2 * af * ft * it.fcx + ft * ft * it.fx1;
        it.y = af * af * it.fy0 + 2 * af * ft * it.fcy + ft * ft * it.fy1;
        it.rot += 9 * dt;
        if (ft >= 1) {
          it.state = 'dead';
          S.gulpT = 1;
          burst(it.fx1, it.fy1, 6, ['#f4c20d', '#fff', '#8d979e'], 110, 260, 4);
        }
      } else if (it.state === 'splash') {
        it.y += 30 * dt;
        if (it.t > 0.28) it.state = 'dead';
      }
      if (it.state === 'dead') S.items.splice(i, 1);
    }

    /* particles */
    for (var p = 0; p < PART_MAX; p++) {
      var pa = parts[p];
      if (pa.life <= 0) continue;
      pa.life -= dt;
      pa.vy += (pa.grav || 0) * dt;
      pa.x += pa.vx * dt;
      pa.y += pa.vy * dt;
    }
    for (var q = 0; q < POP_MAX; q++) {
      var po = pops[q];
      if (po.life <= 0) continue;
      po.life -= dt;
      po.y -= 44 * dt;
    }

    if (S.shakeMag > 0) {
      S.shakeT += dt;
      if (S.shakeT >= S.shakeDur) S.shakeMag = 0;
    }
  }

  /* ---------- draw ---------- */

  function draw(g) {
    var art = CB.art;
    var L = art.LAYOUT;
    if (!S) return;
    var t = S.time;

    g.save();
    if (S.shakeMag > 0) {
      var f = 1 - S.shakeT / S.shakeDur;
      g.translate((Math.random() * 2 - 1) * S.shakeMag * f, (Math.random() * 2 - 1) * S.shakeMag * f);
    }

    art.bg(g);
    var danger = S.fill >= 85 || S.phase === 'geyser';
    art.tankLiquid(g, L.TANK, S.fill, t, danger);
    art.tankLabel(g, L.TANK, S.fill, danger, danger && Math.sin(t * 6) > 0.55);

    /* geyser column erupting out of the tank */
    if (S.phase === 'geyser') {
      art.geyserColumn(g, L.TANK.x + L.TANK.w / 2, L.TANK.y - 4, t, Math.min(1, 0.4 + t * 0.2));
    }

    /* falling items under flung items */
    var i, it;
    for (i = 0; i < S.items.length; i++) {
      it = S.items[i];
      if (it.state === 'falling' || it.state === 'splash') art.item(g, it);
    }
    for (i = 0; i < S.items.length; i++) {
      it = S.items[i];
      if (it.state === 'flung') art.item(g, it);
    }

    art.can(g, Math.max(0, S.gulpT));

    /* particles */
    for (var p = 0; p < PART_MAX; p++) {
      var pa = parts[p];
      if (pa.life <= 0) continue;
      g.globalAlpha = Math.max(0, pa.life / pa.maxLife);
      g.fillStyle = pa.color;
      g.beginPath();
      g.arc(pa.x, pa.y, pa.size, 0, U.TAU);
      g.fill();
    }
    g.globalAlpha = 1;

    /* popups */
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (var q = 0; q < POP_MAX; q++) {
      var po = pops[q];
      if (po.life <= 0) continue;
      var al = Math.min(1, po.life / 0.35);
      g.globalAlpha = al;
      g.font = '800 ' + po.size + 'px ' + art.FONT;
      g.lineWidth = 5;
      g.strokeStyle = CB.COLORS.ink;
      g.strokeText(po.txt, po.x, po.y);
      g.fillStyle = po.color;
      g.fillText(po.txt, po.x, po.y);
    }
    g.globalAlpha = 1;

    /* danger vignette */
    var va = 0;
    if (S.phase === 'geyser') va = 0.55 + Math.sin(t * 7) * 0.2;
    else if (S.phase === 'critical') va = 0.5 + Math.sin(t * 7) * 0.25;
    else if (S.fill > 85) va = (S.fill - 85) / 15 * 0.6;
    art.vignette(g, va);

    g.restore();
  }

  /* ambient scene for menu backgrounds */
  function drawAmbient(g, t) {
    var art = CB.art;
    art.bg(g);
    art.tankLiquid(g, art.LAYOUT.TANK, 36 + Math.sin(t * 0.5) * 2, t, false);
    art.can(g, 0);
  }

  /* ---------- exports ---------- */

  CB.game = {
    onEvent: null,
    CONFIG: CONFIG,
    ITEMS: ITEMS,
    WAVES: WAVES,
    GRADES: GRADES,
    reset: reset,
    startWave: startWave,
    beginCritical: beginCritical,
    update: update,
    draw: draw,
    drawAmbient: drawAmbient,
    tap: tap,
    waveCount: function () { return WAVES.length; },
    snapshot: function () {
      if (!S) return null;
      return {
        phase: S.phase,
        wave: S.wave,
        score: S.score,
        combo: S.combo,
        mult: S.mult,
        fill: S.fill,
        stars: S.stars.slice(),
        stats: {
          junkFlung: S.stats.junkFlung,
          clogs: S.stats.clogs,
          goodTapped: S.stats.goodTapped,
          goodDelivered: S.stats.goodDelivered,
          taps: S.stats.taps,
          whiffs: S.stats.whiffs,
          bestCombo: S.stats.bestCombo
        }
      };
    },
    gradeFor: function (score) {
      for (var i = 0; i < GRADES.length; i++) {
        if (score >= GRADES[i][0]) return { letter: GRADES[i][1], title: GRADES[i][2] };
      }
      return { letter: 'F', title: GRADES[GRADES.length - 1][2] };
    },
    /* debug + test hooks */
    debugFill: function (p) { if (S) S.fill = U.clamp(p, 0, 100); },
    debugSpawn: function (type, x) { if (S && S.phase === 'wave') return spawnItem(type, x); return null; },
    debugWave: function (n) {
      if (!S) return;
      n = U.clamp(n | 0, 1, WAVES.length);
      S.items.length = 0;
      while (S.stars.length < n - 1) S.stars.push(2);
      startWave(n);
    },
    setSpeed: function (x) { if (S) S.speedMul = U.clamp(x, 0.1, 10); },
    setAutopilot: function (b) { if (S) S.autopilot = !!b; },
    setNoSpawn: function (b) { if (S) S.noSpawn = !!b; },
    itemsRef: function () { return S ? S.items : []; },
    phase: function () { return S ? S.phase : 'idle'; },
    fillPct: function () { return S ? S.fill : 0; }
  };
})();
