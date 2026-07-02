/* CB main: boot, layout, state machine, input, HUD, debug harness. Loads last. */
(function () {
  'use strict';

  var U = CB.util;
  var els = {};
  var ctx = null;
  var scale = 1;
  var lastTs = 0;
  var globalT = 0;
  var freezeT = 0;
  var runKind = 'win';
  var fillAtCall = 99;
  var timers = [];
  var lastHud = { score: '', wave: '', mult: 1 };
  var fpsAcc = 0, fpsN = 0, fpsAvg = 60, fpsClock = 0;
  var debugOn = /(\?|&)debug=1/.test(location.search);

  function $(id) { return document.getElementById(id); }

  function later(fn, ms) {
    var id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function clearTimers() {
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    timers.length = 0;
  }

  /* ---------- layout ---------- */

  function layout() {
    var vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    var vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    scale = Math.min(vw / CB.W, vh / CB.H, 1.25);
    var ox = (vw - CB.W * scale) / 2;
    var oy = (vh - CB.H * scale) / 2;
    els.stage.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + scale + ')';
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    els.canvas.width = Math.max(1, Math.round(CB.W * scale * dpr));
    els.canvas.height = Math.max(1, Math.round(CB.H * scale * dpr));
    ctx = els.canvas.getContext('2d');
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    var landscapePhone = scale < 0.55 && vw > vh;
    els.rotateHint.classList.toggle('hide', !landscapePhone);
  }

  var layoutTimer = null;
  function queueLayout() {
    clearTimeout(layoutTimer);
    layoutTimer = setTimeout(layout, 150);
    setTimeout(layout, 350);
  }

  /* ---------- screens ---------- */

  function showScreen(id) {
    var scr = document.querySelectorAll('#screens .screen');
    for (var i = 0; i < scr.length; i++) scr[i].classList.remove('on');
    if (id) $(id).classList.add('on');
  }

  function setState(next, opts) {
    opts = opts || {};
    clearTimers();
    CB.state = next;
    CB.audio.stopAllLoops();
    els.hud.classList.toggle('hide', !(next === 'PLAY' || next === 'FACT' || next === 'CRITICAL'));
    els.skip.classList.add('hide');

    if (next === 'PLAY' && opts.fresh) {
      lastHud.score = '';
      lastHud.wave = '';
      lastHud.mult = 1;
      els.hudCombo.classList.add('hide');
    }

    if (next === 'TITLE') {
      var best = CB.save.get('best');
      els.titleBest.textContent = 'BEST: ' + best;
      els.titleBest.classList.toggle('hide', !(best > 0));
      showScreen('scr-title');
    } else if (next === 'HOWTO') {
      showScreen('scr-howto');
    } else if (next === 'PLAY') {
      showScreen(null);
      if (opts.fresh) {
        CB.game.reset();
        CB.game.startWave(1);
        banner(CB.game.WAVES[0].name, CB.game.WAVES[0].sub);
      }
      if (opts.grace) {
        freezeT = 0.8;
        banner('READY?', 'the tank waits for no one');
      }
    } else if (next === 'FACT') {
      showScreen('scr-fact');
    } else if (next === 'PAUSE') {
      showScreen('scr-pause');
    } else if (next === 'CRITICAL') {
      showScreen('scr-critical');
      els.btnCall.classList.remove('show');
      if (runKind === 'rescue') {
        els.critTitle.textContent = 'CODE BROWN!';
        els.critSub.textContent = 'It\'s erupting! There is only ONE number to call.';
      } else {
        els.critTitle.textContent = 'TANK AT 99%';
        els.critSub.textContent = 'This is NOT a drill, soldier. You know what to do.';
      }
      CB.audio.startLoop('siren');
      later(function () { els.btnCall.classList.add('show'); }, 1500);
    } else if (next === 'CALLING') {
      showScreen('scr-calling');
      CB.audio.sfx.ring();
      els.callLine.textContent = 'RING... RING...';
      later(function () { els.callLine.textContent = '"Lanik Pumping. We take crap from everyone."'; }, 1700);
      later(function () { els.callLine.textContent = '"A code brown? Say no more. ON OUR WAY."'; }, 3000);
      later(function () { setState('CINEMATIC'); }, 4300);
    } else if (next === 'CINEMATIC') {
      showScreen(null);
      CB.cine.start(runKind, fillAtCall, function () {
        setState('RESULTS');
      });
    } else if (next === 'RESULTS') {
      fillResults();
      showScreen('scr-results');
      if (runKind === 'rescue') CB.audio.sfx.womp();
    }
  }

  /* ---------- banner + fact ---------- */

  function banner(name, sub) {
    els.wbName.textContent = name;
    els.wbSub.textContent = sub || '';
    els.banner.classList.remove('show', 'hide');
    void els.banner.offsetWidth;
    els.banner.classList.add('show');
  }

  var factPayload = null;
  var factShownAt = 0;

  function showFact(p) {
    factPayload = p;
    factShownAt = performance.now();
    els.factTitle.textContent = p.factTitle || 'SARGE SAYS';
    els.factText.textContent = p.fact;
    setState('FACT');
  }

  function dismissFact() {
    if (!factPayload) return;
    if (performance.now() - factShownAt < 600) return;
    var p = factPayload;
    factPayload = null;
    if (p.last) {
      runKind = 'win';
      CB.game.beginCritical();
      fillAtCall = 99;
      setState('CRITICAL');
    } else {
      var w = CB.game.WAVES[p.n];
      CB.game.startWave(p.n + 1);
      setState('PLAY');
      banner(w.name, w.sub);
    }
  }

  /* ---------- game events ---------- */

  function onGameEvent(type, p) {
    if (type === 'waveEnd') {
      later(function () { showFact(p); }, 700);
    } else if (type === 'overflow') {
      runKind = 'rescue';
      fillAtCall = 100;
      later(function () { setState('CRITICAL'); }, 1200);
    } else if (type === 'oops') {
      flash('red');
    }
  }

  function flash(kind) {
    els.flash.classList.remove('red', 'white');
    void els.flash.offsetWidth;
    els.flash.classList.add(kind);
    later(function () { els.flash.classList.remove('red', 'white'); }, 90);
  }

  /* ---------- results ---------- */

  function fillResults() {
    var snap = CB.game.snapshot() || { score: 0, stars: [], stats: {} };
    var st = snap.stats;
    var grade = CB.game.gradeFor(snap.score);
    var starSum = 0;
    for (var i = 0; i < snap.stars.length; i++) starSum += snap.stars[i];

    var win = runKind === 'win';
    els.resTitle.textContent = win ? 'CRISIS AVERTED!' : 'RESCUED BY LANIK';
    els.resTitle.classList.toggle('rescued', !win);
    els.resGrade.textContent = grade.letter;
    els.resGrade.className = 'g-' + grade.letter.toLowerCase();
    els.resGradeTitle.textContent = grade.title;
    els.resScore.textContent = 'SCORE ' + snap.score;
    els.resStars.textContent = '★ ' + starSum + '/' + (CB.game.waveCount() * 3);

    var best = CB.save.get('best');
    var newBest = snap.score > best;
    if (newBest) {
      best = snap.score;
      CB.save.set('best', best);
    }
    els.resBest.textContent = (newBest ? 'NEW BEST! ' : 'BEST ') + best;

    var correct = st.junkFlung || 0;
    var acc = st.taps > 0 ? Math.round(correct / st.taps * 100) : 100;
    var rows = [
      ['Junk intercepted', st.junkFlung || 0],
      ['Clogs caused', st.clogs || 0],
      ['Innocent poos assaulted', st.goodTapped || 0],
      ['Best combo', 'x' + (st.bestCombo || 0)],
      ['Tap accuracy', acc + '%'],
      ['Gallons pumped by Lanik', '1,500']
    ];
    var html = '';
    for (var r = 0; r < rows.length; r++) {
      html += '<li>' + rows[r][0] + '<b>' + rows[r][1] + '</b></li>';
    }
    els.resStats.innerHTML = html;
  }

  /* ---------- input ---------- */

  function toWorld(e) {
    var r = els.stage.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * CB.W / r.width,
      y: (e.clientY - r.top) * CB.H / r.height
    };
  }

  function onPointerDown(e) {
    CB.audio.init();
    CB.audio.unlock();
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('.screen.on') || e.target.closest('#hud')) return;
    if (CB.state === 'PLAY') {
      if (freezeT > 0) return;
      e.preventDefault();
      var w = toWorld(e);
      CB.game.tap(w.x, w.y);
    } else if (CB.state === 'CINEMATIC') {
      e.preventDefault();
      if (CB.cine.t > 2.5) CB.cine.skip();
    }
  }

  /* ---------- pause / lifecycle ---------- */

  function autoPause() {
    CB.audio.stopAllLoops();
    if (CB.state === 'PLAY' || CB.state === 'FACT') {
      if (CB.state === 'FACT') return;
      setState('PAUSE');
    }
  }

  function syncMuteButtons() {
    var m = CB.audio.isMuted();
    els.btnMute.textContent = m ? '✕' : '♪';
    els.btnMute.classList.toggle('off', m);
    els.btnMute2.textContent = m ? 'SOUND: OFF' : 'SOUND: ON';
  }

  /* ---------- HUD ---------- */

  function syncHud() {
    var snap = CB.game.snapshot();
    if (!snap) return;
    var scoreTxt = String(snap.score);
    if (scoreTxt !== lastHud.score) {
      els.hudScore.textContent = scoreTxt;
      lastHud.score = scoreTxt;
    }
    var waveTxt = 'WAVE ' + snap.wave + '/' + CB.game.waveCount();
    if (waveTxt !== lastHud.wave) {
      els.hudWave.textContent = waveTxt;
      lastHud.wave = waveTxt;
    }
    if (snap.mult !== lastHud.mult) {
      if (snap.mult >= 2) {
        els.hudCombo.textContent = 'x' + snap.mult + ' COMBO!';
        els.hudCombo.classList.remove('hide', 'pop');
        void els.hudCombo.offsetWidth;
        els.hudCombo.classList.add('pop');
      } else {
        els.hudCombo.classList.add('hide');
      }
      lastHud.mult = snap.mult;
    }
  }

  /* ---------- main loop ---------- */

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    globalT += dt;

    fpsAcc += dt; fpsN++;
    fpsClock += dt;
    if (fpsClock > 0.5) {
      fpsAvg = fpsN / fpsAcc;
      fpsAcc = 0; fpsN = 0; fpsClock = 0;
      if (debugOn) els.fps.textContent = Math.round(fpsAvg) + ' fps';
    }

    if (freezeT > 0) freezeT -= dt;

    var st = CB.state;
    if (st === 'PLAY' || st === 'FACT' || st === 'CRITICAL' || st === 'CALLING') {
      if (freezeT <= 0 && st !== 'CALLING') CB.game.update(dt);
      CB.game.draw(ctx);
    } else if (st === 'CINEMATIC') {
      CB.cine.update(dt);
      if (CB.cine.active) CB.cine.draw(ctx);
      els.skip.classList.toggle('hide', !(CB.cine.active && CB.cine.t > 2.5));
    } else if (st === 'PAUSE') {
      CB.game.draw(ctx);
    } else {
      CB.game.drawAmbient(ctx, globalT);
    }

    if (st === 'PLAY' || st === 'FACT' || st === 'CRITICAL') syncHud();
  }

  /* ---------- debug harness ---------- */

  function installDebug() {
    els.fps.classList.remove('hide');
    window.CBdbg = {
      wave: function (n) { CB.game.debugWave(n); },
      fill: function (p) { CB.game.debugFill(p); },
      win: function () {
        runKind = 'win';
        CB.game.beginCritical();
        fillAtCall = 99;
        setState('CRITICAL');
      },
      overflow: function () { CB.game.debugFill(100); },
      speed: function (x) { CB.game.setSpeed(x); },
      autopilot: function (b) { CB.game.setAutopilot(b); },
      noSpawn: function (b) { CB.game.setNoSpawn(b); },
      spawn: function (type, x) { return CB.game.debugSpawn(type, x); },
      items: function () { return CB.game.itemsRef(); },
      state: function () {
        return { state: CB.state, snap: CB.game.snapshot(), cine: { active: CB.cine.active, t: CB.cine.t } };
      },
      fps: function () { return fpsAvg; },
      loops: function () { return CB.audio.activeLoops(); },
      worldToScreen: function (x, y) {
        var r = els.stage.getBoundingClientRect();
        return { x: r.left + x * r.width / CB.W, y: r.top + y * r.height / CB.H };
      }
    };
  }

  /* ---------- boot ---------- */

  function refreshGeneratedImages() {
    $('how-i1').src = CB.art.sprDataURL('wipe', 64);
    $('how-i2').src = CB.art.sprDataURL('poo', 64);
    $('how-i3').src = CB.art.truckDataURL(64);
    $('sarge-img').src = CB.art.sprDataURL('sarge', 150);
    $('title-mascot').src = CB.art.mascotDataURL(148);
    $('res-mascot').src = CB.art.mascotDataURL(62);
  }

  function boot() {
    els.stage = $('stage');
    els.canvas = $('game');
    els.hud = $('hud');
    els.hudScore = $('hud-score');
    els.hudCombo = $('hud-combo');
    els.hudWave = $('hud-wave');
    els.banner = $('wave-banner');
    els.wbName = $('wb-name');
    els.wbSub = $('wb-sub');
    els.flash = $('flash');
    els.skip = $('scr-skip');
    els.rotateHint = $('rotate-hint');
    els.fps = $('fps-badge');
    els.titleBest = $('title-best');
    els.factTitle = $('fact-title');
    els.factText = $('fact-text');
    els.critTitle = $('crit-title');
    els.critSub = $('crit-sub');
    els.btnCall = $('btn-call');
    els.callLine = $('call-line');
    els.resTitle = $('res-title');
    els.resGrade = $('res-grade');
    els.resGradeTitle = $('res-grade-title');
    els.resScore = $('res-score');
    els.resBest = $('res-best');
    els.resStars = $('res-stars');
    els.resStats = $('res-stats');
    els.btnMute = $('btn-mute');
    els.btnMute2 = $('btn-mute2');

    CB.reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    CB.art.prerender();
    refreshGeneratedImages();
    if (document.fonts && document.fonts.load) {
      document.fonts.load('800 40px "Baloo 2"').then(function () {
        CB.art.prerender();
        refreshGeneratedImages();
      }).catch(function () {});
    }

    CB.game.reset();
    CB.game.onEvent = onGameEvent;

    layout();
    window.addEventListener('resize', queueLayout);
    window.addEventListener('orientationchange', queueLayout);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', queueLayout);

    els.stage.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('dblclick', function (e) { e.preventDefault(); });
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    $('btn-play').addEventListener('click', function () {
      CB.audio.init(); CB.audio.unlock();
      if (CB.save.get('seenHow')) setState('PLAY', { fresh: true });
      else setState('HOWTO');
    });
    $('btn-how').addEventListener('click', function () { setState('HOWTO'); });
    $('btn-start').addEventListener('click', function () {
      CB.save.set('seenHow', true);
      setState('PLAY', { fresh: true });
    });
    $('scr-fact').addEventListener('click', dismissFact);
    $('btn-pause').addEventListener('click', function () {
      if (CB.state === 'PLAY' && CB.game.phase() === 'wave') setState('PAUSE');
    });
    $('btn-resume').addEventListener('click', function () { setState('PLAY', { grace: true }); });
    $('btn-restart').addEventListener('click', function () { setState('PLAY', { fresh: true }); });
    $('btn-quit').addEventListener('click', function () { setState('TITLE'); });
    els.btnCall.addEventListener('click', function () { setState('CALLING'); });
    $('btn-again').addEventListener('click', function () { setState('PLAY', { fresh: true }); });

    function muteClick() {
      CB.audio.init();
      CB.audio.toggleMute();
      syncMuteButtons();
    }
    els.btnMute.addEventListener('click', muteClick);
    els.btnMute2.addEventListener('click', muteClick);
    syncMuteButtons();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) autoPause();
    });
    window.addEventListener('pagehide', autoPause);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'p' || e.key === 'P') {
        if (CB.state === 'PLAY' && CB.game.phase() === 'wave') setState('PAUSE');
        else if (CB.state === 'PAUSE') setState('PLAY', { grace: true });
      } else if (e.key === 'm' || e.key === 'M') {
        CB.audio.init();
        CB.audio.toggleMute();
        syncMuteButtons();
      }
    });

    if (debugOn) installDebug();

    setState('TITLE');
    requestAnimationFrame(frame);
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
