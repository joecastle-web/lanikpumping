/* CB.art: all visuals, drawn in code. Prerendered sprites + runtime scene painters. */
(function () {
  'use strict';

  var C = CB.COLORS;
  var U = CB.util;
  var FONT = '"Baloo 2","Arial Black",Arial,sans-serif';

  /* playfield geometry, shared with game.js */
  var LAYOUT = {
    SPAWN_Y: 158,
    LAND_Y: 650,
    FIELD_L: 56,
    FIELD_R: 424,
    CAN: { x: 438, y: 552 },
    TANK: { x: 48, y: 632, w: 384, h: 146 }
  };

  /* cinematic geometry */
  var CINE = {
    HORIZON: 430,
    GROUND: 600,
    TRUCK_Y: 585,
    TANK: { x: 245, y: 648, w: 200, h: 112 },
    RISER: { x: 350, y: 548 },
    FAMILY: { x: 396, y: 583 }
  };

  var TRUCK = { W: 280, H: 130, wheels: [56, 214], wheelY: 112, reel: { x: 252, y: 62 }, gauge: { x: 252, y: 30 } };

  var spr = {};

  function mk(w, h) {
    var c = document.createElement('canvas');
    c.width = w * 2;
    c.height = h * 2;
    var g = c.getContext('2d');
    g.scale(2, 2);
    g.lineJoin = 'round';
    g.lineCap = 'round';
    return { c: c, g: g, w: w, h: h };
  }

  function sprite(key, w, h, fn) {
    var s = mk(w, h);
    s.g.translate(w / 2, h / 2);
    fn(s.g);
    spr[key] = { c: s.c, w: w, h: h };
  }

  function panel(key, w, h, fn) {
    var s = mk(w, h);
    fn(s.g);
    spr[key] = { c: s.c, w: w, h: h };
  }

  function rr(g, x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function ink(g, w) {
    g.strokeStyle = C.ink;
    g.lineWidth = w || 4;
    g.stroke();
  }

  function gloss(g, x, y, rx, ry, rot) {
    g.save();
    g.translate(x, y);
    g.rotate(rot || -0.5);
    g.fillStyle = 'rgba(255,255,255,0.4)';
    g.beginPath();
    g.ellipse(0, 0, rx, ry, 0, 0, U.TAU);
    g.fill();
    g.restore();
  }

  function sticker(g, txt, x, y, size, fill, sw, sc) {
    g.font = '800 ' + size + 'px ' + FONT;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (sw) {
      g.lineWidth = sw;
      g.strokeStyle = sc || C.ink;
      g.strokeText(txt, x, y);
    }
    g.fillStyle = fill;
    g.fillText(txt, x, y);
  }

  /* cartoon face: mood in happy|derp|smug|angry|panic|shifty|cool|sad */
  function face(g, x, y, s, mood) {
    var r = 5 * s, gap = 6.5 * s;
    g.save();
    g.translate(x, y);
    if (mood === 'cool') {
      g.fillStyle = C.ink;
      rr(g, -gap - r - 1, -r, (gap + r + 1) * 2, r * 1.7, 3);
      g.fill();
      g.fillRect(-gap - r - 4 * s, -r, 3 * s, 2 * s);
      g.fillRect(gap + r + 1 * s, -r, 3 * s, 2 * s);
    } else {
      var px = mood === 'shifty' ? r * 0.45 : 0;
      var pr = mood === 'panic' ? 1.6 * s : 2.4 * s;
      var er = mood === 'panic' ? r * 1.25 : r;
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(-gap, 0, er, 0, U.TAU); g.arc(gap, 0, er, 0, U.TAU); g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 1.6 * s;
      g.beginPath(); g.arc(-gap, 0, er, 0, U.TAU); g.stroke();
      g.beginPath(); g.arc(gap, 0, er, 0, U.TAU); g.stroke();
      g.fillStyle = C.ink;
      g.beginPath(); g.arc(-gap + px, 0.5, pr, 0, U.TAU); g.arc(gap + px, 0.5, pr, 0, U.TAU); g.fill();
      if (mood === 'smug') {
        g.lineWidth = 2 * s;
        g.beginPath(); g.moveTo(-gap - r, -r * 0.5); g.lineTo(-gap + r, -r * 0.5);
        g.moveTo(gap - r, -r * 0.5); g.lineTo(gap + r, -r * 0.5); g.stroke();
      }
      if (mood === 'angry') {
        g.lineWidth = 2.2 * s;
        g.beginPath(); g.moveTo(-gap - r, -r - 2); g.lineTo(-gap + r * 0.6, -r + 1);
        g.moveTo(gap + r, -r - 2); g.lineTo(gap - r * 0.6, -r + 1); g.stroke();
      }
    }
    g.strokeStyle = C.ink;
    g.lineWidth = 2 * s;
    g.beginPath();
    var my = r + 4 * s;
    if (mood === 'happy') { g.arc(0, my - 2 * s, 4 * s, 0.15 * Math.PI, 0.85 * Math.PI); }
    else if (mood === 'derp') { g.arc(2 * s, my - 2 * s, 3 * s, 0.1 * Math.PI, 0.9 * Math.PI); }
    else if (mood === 'smug') { g.moveTo(-3 * s, my); g.quadraticCurveTo(2 * s, my - 3 * s, 5 * s, my - 1 * s); }
    else if (mood === 'angry') { g.arc(0, my + 3 * s, 4 * s, 1.15 * Math.PI, 1.85 * Math.PI); }
    else if (mood === 'panic') { g.arc(0, my, 2.6 * s, 0, U.TAU); }
    else if (mood === 'sad') { g.arc(0, my + 3 * s, 4 * s, 1.15 * Math.PI, 1.85 * Math.PI); }
    else if (mood === 'cool') { g.moveTo(-4 * s, my); g.quadraticCurveTo(0, my + 2 * s, 5 * s, my - 1.5 * s); }
    else { g.moveTo(-3 * s, my); g.lineTo(3 * s, my); }
    g.stroke();
    if (mood === 'derp') {
      g.fillStyle = '#e8607a';
      rr(g, 1 * s, my - 1 * s, 5 * s, 6 * s, 2.5 * s);
      g.fill();
      ink(g, 1.5 * s);
    }
    g.restore();
  }

  function pooBody(g, s, col, colDark) {
    g.fillStyle = colDark || C.pooDark;
    g.beginPath();
    g.ellipse(0, 12 * s, 24 * s, 13 * s, 0, 0, U.TAU);
    g.fill();
    g.fillStyle = col || C.poo;
    g.beginPath();
    g.ellipse(0, 10 * s, 23 * s, 12 * s, 0, 0, U.TAU);
    g.fill();
    g.beginPath();
    g.ellipse(0, -1 * s, 17 * s, 10 * s, 0, 0, U.TAU);
    g.fill();
    g.beginPath();
    g.ellipse(1 * s, -11 * s, 11 * s, 8 * s, 0, 0, U.TAU);
    g.fill();
    g.beginPath();
    g.moveTo(-4 * s, -16 * s);
    g.quadraticCurveTo(2 * s, -26 * s, 9 * s, -19 * s);
    g.quadraticCurveTo(4 * s, -18 * s, 3 * s, -14 * s);
    g.closePath();
    g.fill();
    g.beginPath();
    g.ellipse(0, 12 * s, 24 * s, 13 * s, 0, 0, Math.PI);
    g.moveTo(-23 * s, 8 * s);
    g.ellipse(0, 10 * s, 23 * s, 12 * s, 0, Math.PI, 0);
    g.ellipse(0, -1 * s, 17 * s, 10 * s, 0, Math.PI, 0);
    g.ellipse(1 * s, -11 * s, 11 * s, 8 * s, 0, Math.PI, 0);
    ink(g, 3.5 * s);
    gloss(g, -8 * s, -12 * s, 4.5 * s, 2.5 * s);
  }

  function buildItems() {
    sprite('poo', 64, 64, function (g) {
      pooBody(g, 1);
      face(g, 0, 2, 1, 'happy');
    });
    sprite('poo2', 64, 64, function (g) {
      pooBody(g, 0.94, '#96653c', '#6a4626');
      face(g, 0, 2, 1, 'derp');
    });
    sprite('poo3', 84, 76, function (g) {
      pooBody(g, 1.3);
      face(g, 0, 2, 1.25, 'cool');
    });
    sprite('pee', 52, 60, function (g) {
      g.fillStyle = '#ffe15c';
      g.beginPath();
      g.moveTo(0, -26);
      g.quadraticCurveTo(16, -4, 16, 8);
      g.arc(0, 8, 16, 0, Math.PI);
      g.quadraticCurveTo(-16, -4, 0, -26);
      g.closePath();
      g.fill();
      ink(g, 3.5);
      gloss(g, -6, 2, 4, 7, 0.3);
      face(g, 0, 8, 0.8, 'happy');
    });
    sprite('tp', 52, 52, function (g) {
      g.save();
      g.rotate(-0.12);
      g.fillStyle = '#fff';
      rr(g, -19, -19, 38, 38, 5);
      g.fill();
      ink(g, 3.5);
      g.strokeStyle = '#c9c4b8';
      g.lineWidth = 2;
      g.setLineDash([3, 4]);
      g.beginPath(); g.moveTo(-19, -12); g.lineTo(19, -12); g.stroke();
      g.beginPath(); g.moveTo(-19, 12); g.lineTo(19, 12); g.stroke();
      g.setLineDash([]);
      face(g, 0, 0, 0.7, 'happy');
      g.restore();
    });
    sprite('roll', 62, 58, function (g) {
      g.fillStyle = '#fff';
      rr(g, -6, 14, 34, 12, 3);
      g.fill();
      ink(g, 3);
      g.beginPath(); g.arc(-6, 0, 22, 0, U.TAU);
      g.fillStyle = '#fff'; g.fill(); ink(g, 3.5);
      g.beginPath(); g.arc(-6, 0, 8, 0, U.TAU);
      g.fillStyle = '#b9b2a4'; g.fill(); ink(g, 3);
      face(g, -6, -2, 0.72, 'panic');
    });
    sprite('wipe', 60, 46, function (g) {
      g.save();
      g.rotate(0.08);
      g.fillStyle = '#fff';
      rr(g, -24, -17, 48, 34, 8);
      g.fill();
      ink(g, 3.5);
      g.fillStyle = '#bfe3ff';
      rr(g, -24, -6, 48, 12, 4);
      g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 1.6;
      rr(g, -24, -6, 48, 12, 4);
      g.stroke();
      sticker(g, 'FLUSHABLE*', 0, 0, 7.5, C.blue, 0);
      face(g, 0, -11, 0.55, 'smug');
      g.strokeStyle = C.gold;
      g.lineWidth = 2.4;
      g.beginPath();
      g.ellipse(0, -22, 11, 3.4, 0, 0, U.TAU);
      g.stroke();
      g.restore();
    });
    sprite('ptowel', 60, 52, function (g) {
      g.save();
      g.rotate(-0.06);
      g.fillStyle = '#efe4cd';
      rr(g, -24, -20, 48, 40, 7);
      g.fill();
      ink(g, 3.5);
      g.fillStyle = '#d9c9a6';
      for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
          g.beginPath();
          g.arc(i * 13, j * 11, 2, 0, U.TAU);
          g.fill();
        }
      }
      face(g, 0, -2, 0.8, 'angry');
      g.restore();
    });
    sprite('grease', 60, 62, function (g) {
      /* the grease jar: bacon fat hunting for a drain to ruin */
      g.save();
      g.rotate(0.1);
      g.fillStyle = '#f2a83b';
      g.beginPath();
      g.ellipse(-6, -22, 9, 6, 0, 0, U.TAU);
      g.fill();
      g.beginPath();
      g.ellipse(-6, -22, 9, 6, 0, 0, U.TAU);
      ink(g, 2.5);
      g.fillStyle = '#f2a83b';
      g.beginPath();
      g.ellipse(6, -24, 7, 5, 0, 0, U.TAU);
      g.fill();
      g.beginPath();
      g.ellipse(6, -24, 7, 5, 0, 0, U.TAU);
      ink(g, 2.5);
      g.fillStyle = '#dceef6';
      rr(g, -17, -19, 34, 42, 6);
      g.fill();
      ink(g, 3.2);
      g.fillStyle = '#f2a83b';
      rr(g, -14, -15, 28, 35, 4);
      g.fill();
      g.fillStyle = '#d9820e';
      g.beginPath();
      g.ellipse(15, -4, 3, 7, 0, 0, U.TAU);
      g.fill();
      g.fillStyle = '#fff';
      rr(g, -14, 2, 28, 14, 3);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 2;
      rr(g, -14, 2, 28, 14, 3);
      g.stroke();
      sticker(g, 'GREASE', 0, 9, 8, '#c76a08', 0);
      face(g, 0, -7, 0.5, 'shifty');
      gloss(g, -12, -6, 2.5, 9, 0);
      g.restore();
    });
    sprite('toy', 56, 52, function (g) {
      g.fillStyle = '#57c04f';
      g.beginPath();
      g.ellipse(2, 6, 17, 12, 0, 0, U.TAU);
      g.fill();
      g.beginPath();
      g.moveTo(16, 2);
      g.quadraticCurveTo(30, -2, 26, 12);
      g.quadraticCurveTo(20, 10, 14, 10);
      g.closePath();
      g.fill();
      g.beginPath();
      g.ellipse(-13, -9, 10, 8, -0.3, 0, U.TAU);
      g.fill();
      g.fillRect(-6, 12, 6, 8);
      g.fillRect(6, 12, 6, 8);
      g.beginPath();
      g.ellipse(2, 6, 17, 12, 0, 0, U.TAU);
      ink(g, 3);
      g.fillStyle = '#2f8a2a';
      g.beginPath();
      g.moveTo(-4, -4); g.lineTo(0, -10); g.lineTo(4, -4);
      g.closePath(); g.fill();
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(-15, -11, 3.4, 0, U.TAU); g.fill();
      g.fillStyle = C.ink;
      g.beginPath(); g.arc(-15, -11, 1.6, 0, U.TAU); g.fill();
    });
    sprite('phone', 40, 58, function (g) {
      g.fillStyle = '#23262d';
      rr(g, -14, -25, 28, 50, 7);
      g.fill();
      ink(g, 3.5);
      g.fillStyle = '#8fd0ff';
      rr(g, -10, -20, 20, 38, 3);
      g.fill();
      g.strokeStyle = '#fff';
      g.lineWidth = 1.8;
      g.beginPath();
      g.moveTo(-8, -16); g.lineTo(2, -4); g.lineTo(-4, 4); g.lineTo(6, 14);
      g.stroke();
      g.fillStyle = C.red;
      g.beginPath(); g.arc(6, -15, 4, 0, U.TAU); g.fill();
      sticker(g, '3', 6, -15, 6, '#fff', 0);
    });
    sprite('fish', 58, 46, function (g) {
      /* the goldfish: belly-up, X eyes. destined for a real funeral */
      g.fillStyle = '#ff8c42';
      g.beginPath();
      g.ellipse(-3, 0, 17, 12, 0, 0, U.TAU);
      g.fill();
      g.beginPath();
      g.moveTo(12, 0); g.lineTo(26, -8); g.lineTo(26, 13);
      g.closePath();
      g.fill();
      g.beginPath();
      g.ellipse(-3, 0, 17, 12, 0, 0, U.TAU);
      ink(g, 3);
      g.beginPath();
      g.moveTo(12, 0); g.lineTo(26, -8); g.lineTo(26, 13);
      g.closePath();
      ink(g, 3);
      /* belly stripe on TOP: he is upside down */
      g.fillStyle = '#ffb347';
      g.beginPath();
      g.ellipse(-2, -8, 8, 4, 0, 0, U.TAU);
      g.fill();
      /* limp fin */
      g.fillStyle = '#e8752e';
      g.beginPath();
      g.moveTo(-2, 10); g.quadraticCurveTo(2, 18, 8, 14); g.quadraticCurveTo(4, 10, 2, 8);
      g.closePath();
      g.fill();
      ink(g, 2);
      /* X eye */
      g.strokeStyle = C.ink;
      g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(-14, -6); g.lineTo(-8, 0);
      g.moveTo(-8, -6); g.lineTo(-14, 0);
      g.stroke();
      /* tongue lolling out */
      g.fillStyle = '#e8607a';
      g.beginPath();
      g.ellipse(-19, 6, 3, 4.5, 0.5, 0, U.TAU);
      g.fill();
      g.beginPath();
      g.ellipse(-19, 6, 3, 4.5, 0.5, 0, U.TAU);
      ink(g, 1.6);
    });
    sprite('diaper', 58, 50, function (g) {
      g.fillStyle = '#fff';
      g.beginPath();
      g.moveTo(-22, -14);
      g.quadraticCurveTo(0, -6, 22, -14);
      g.quadraticCurveTo(24, 8, 8, 18);
      g.quadraticCurveTo(0, 21, -8, 18);
      g.quadraticCurveTo(-24, 8, -22, -14);
      g.closePath();
      g.fill();
      ink(g, 3.5);
      g.fillStyle = '#bfe3ff';
      rr(g, -22, -16, 12, 7, 3); g.fill();
      rr(g, 10, -16, 12, 7, 3); g.fill();
      g.fillStyle = '#f4e09a';
      g.beginPath();
      g.ellipse(0, 12, 8, 5, 0, 0, U.TAU);
      g.fill();
      g.strokeStyle = '#8a8455';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-6, -24); g.quadraticCurveTo(-2, -30, -6, -34);
      g.moveTo(4, -24); g.quadraticCurveTo(8, -30, 4, -34);
      g.stroke();
    });
    sprite('sock', 50, 56, function (g) {
      g.fillStyle = '#7fd6c7';
      g.beginPath();
      g.moveTo(-8, -24);
      g.lineTo(8, -24);
      g.lineTo(8, 4);
      g.quadraticCurveTo(20, 8, 18, 18);
      g.quadraticCurveTo(16, 26, 4, 24);
      g.lineTo(-8, 12);
      g.closePath();
      g.fill();
      ink(g, 3.5);
      g.fillStyle = '#fff';
      g.fillRect(-8, -24, 16, 7);
      g.strokeStyle = C.ink; g.lineWidth = 2;
      g.strokeRect(-8, -24, 16, 7);
      g.strokeStyle = '#4aa896';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-8, -8); g.lineTo(8, -8);
      g.moveTo(-8, 0); g.lineTo(8, 0);
      g.stroke();
      g.strokeStyle = '#8a8455';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(14, -18); g.quadraticCurveTo(18, -24, 14, -28);
      g.stroke();
    });
    sprite('swab', 44, 40, function (g) {
      g.save();
      g.rotate(-0.5);
      g.fillStyle = '#9fd8ff';
      rr(g, -16, -2.5, 32, 5, 2.5);
      g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 2.4;
      rr(g, -16, -2.5, 32, 5, 2.5);
      g.stroke();
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(-18, 0, 6.5, 0, U.TAU); g.fill();
      g.beginPath(); g.arc(18, 0, 6.5, 0, U.TAU); g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 2.4;
      g.beginPath(); g.arc(-18, 0, 6.5, 0, U.TAU); g.stroke();
      g.beginPath(); g.arc(18, 0, 6.5, 0, U.TAU); g.stroke();
      g.restore();
    });
    sprite('floss', 46, 44, function (g) {
      g.strokeStyle = '#4fc47f';
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(-14, -10);
      g.bezierCurveTo(10, -18, 16, 2, -6, 4);
      g.bezierCurveTo(-20, 6, 2, 16, 12, 8);
      g.stroke();
      g.strokeStyle = C.ink;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(-14, -10);
      g.bezierCurveTo(10, -18, 16, 2, -6, 4);
      g.stroke();
      g.fillStyle = '#fff';
      g.save();
      g.rotate(0.5);
      rr(g, 2, 6, 16, 7, 3.5);
      g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 2.2;
      rr(g, 2, 6, 16, 7, 3.5);
      g.stroke();
      g.restore();
    });
    sprite('cig', 42, 36, function (g) {
      g.save();
      g.rotate(0.35);
      g.fillStyle = '#fff';
      rr(g, -16, -5, 22, 10, 3);
      g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 2.6;
      rr(g, -16, -5, 22, 10, 3);
      g.stroke();
      g.fillStyle = '#e8b46a';
      rr(g, 6, -5, 11, 10, 3);
      g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 2.6;
      rr(g, 6, -5, 11, 10, 3);
      g.stroke();
      g.fillStyle = '#9a9a94';
      g.beginPath(); g.arc(-17, 0, 4, 0, U.TAU); g.fill();
      g.strokeStyle = '#8a8455';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-20, -6); g.quadraticCurveTo(-16, -12, -20, -16);
      g.stroke();
      g.restore();
    });
    sprite('hair', 54, 50, function (g) {
      /* shower-drain hair tangle: jet black + stringy, nothing like a poo */
      g.strokeStyle = '#2b2620';
      g.lineWidth = 3.4;
      g.beginPath();
      g.moveTo(-16, -4);
      g.bezierCurveTo(-4, -20, 14, -16, 12, -2);
      g.bezierCurveTo(22, -10, 24, 8, 8, 10);
      g.bezierCurveTo(18, 18, -2, 22, -6, 10);
      g.bezierCurveTo(-20, 18, -26, 2, -14, -2);
      g.bezierCurveTo(-24, -10, -8, -22, 0, -12);
      g.stroke();
      g.fillStyle = '#332e27';
      g.beginPath();
      g.ellipse(0, 1, 13, 10, 0.2, 0, U.TAU);
      g.fill();
      g.strokeStyle = '#57504a';
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(-10, -6);
      g.bezierCurveTo(0, -12, 8, -8, 10, 0);
      g.moveTo(-12, 6);
      g.bezierCurveTo(-2, 12, 8, 8, 12, 4);
      g.stroke();
      g.strokeStyle = '#2b2620';
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(14, -8); g.quadraticCurveTo(22, -14, 25, -10);
      g.moveTo(-16, -8); g.quadraticCurveTo(-24, -14, -25, -8);
      g.moveTo(4, 14); g.quadraticCurveTo(8, 20, 14, 20);
      g.moveTo(-8, 14); g.quadraticCurveTo(-12, 21, -18, 19);
      g.moveTo(12, 10); g.quadraticCurveTo(20, 14, 24, 12);
      g.stroke();
      /* horrified little face, white so it reads on black */
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(-5, -1, 4, 0, U.TAU);
      g.arc(5, -1, 4, 0, U.TAU);
      g.fill();
      g.fillStyle = C.ink;
      g.beginPath();
      g.arc(-5, 0, 1.8, 0, U.TAU);
      g.arc(5, 0, 1.8, 0, U.TAU);
      g.fill();
      g.strokeStyle = '#fff';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(0, 7, 3, 0, U.TAU);
      g.stroke();
    });
    sprite('pad', 58, 42, function (g) {
      g.save();
      g.rotate(-0.08);
      g.fillStyle = '#fff';
      rr(g, -14, -17, 28, 34, 12);
      g.fill();
      ink(g, 3.2);
      g.fillStyle = '#ffd9e3';
      rr(g, -26, -7, 13, 14, 5); g.fill();
      rr(g, 13, -7, 13, 14, 5); g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 2.4;
      rr(g, -26, -7, 13, 14, 5); g.stroke();
      rr(g, 13, -7, 13, 14, 5); g.stroke();
      g.strokeStyle = '#e6a5b8';
      g.lineWidth = 2;
      rr(g, -8, -11, 16, 22, 8);
      g.stroke();
      g.restore();
    });
    sprite('duck', 56, 52, function (g) {
      /* rubber duck: serene, squeaky, absolutely not flushable */
      g.fillStyle = '#ffd23f';
      g.beginPath();
      g.ellipse(3, 9, 19, 12, 0, 0, U.TAU);
      g.fill();
      g.beginPath();
      g.moveTo(16, 4);
      g.quadraticCurveTo(30, -6, 25, 12);
      g.quadraticCurveTo(19, 10, 13, 12);
      g.closePath();
      g.fill();
      g.beginPath();
      g.ellipse(3, 9, 19, 12, 0, 0, U.TAU);
      ink(g, 3);
      g.fillStyle = '#ffd23f';
      g.beginPath();
      g.arc(-10, -8, 12, 0, U.TAU);
      g.fill();
      g.beginPath();
      g.arc(-10, -8, 12, 0, U.TAU);
      ink(g, 3);
      g.fillStyle = '#f5641e';
      rr(g, -28, -8, 13, 8, 4);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 2.5;
      rr(g, -28, -8, 13, 8, 4);
      g.stroke();
      g.strokeStyle = '#d9a41f';
      g.lineWidth = 2.5;
      g.beginPath();
      g.arc(6, 8, 8, Math.PI * 0.2, Math.PI * 1.1);
      g.stroke();
      g.fillStyle = C.ink;
      g.beginPath();
      g.arc(-13, -11, 2.2, 0, U.TAU);
      g.fill();
      gloss(g, -4, 2, 5, 3);
    });
    sprite('car', 58, 46, function (g) {
      /* toy car: somebody's favorite die-cast racer */
      g.fillStyle = C.red;
      g.beginPath();
      g.moveTo(-25, 8);
      g.lineTo(-25, -1);
      g.quadraticCurveTo(-22, -6, -13, -7);
      g.quadraticCurveTo(-9, -16, 1, -16);
      g.quadraticCurveTo(11, -16, 14, -7);
      g.quadraticCurveTo(23, -6, 25, -1);
      g.lineTo(25, 8);
      g.quadraticCurveTo(0, 11, -25, 8);
      g.closePath();
      g.fill();
      ink(g, 3);
      g.fillStyle = '#9fd8ff';
      g.beginPath();
      g.moveTo(-8, -13);
      g.lineTo(0, -13);
      g.lineTo(0, -7);
      g.lineTo(-11, -7);
      g.closePath();
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 2;
      g.stroke();
      g.fillStyle = '#9fd8ff';
      g.beginPath();
      g.moveTo(3, -13);
      g.lineTo(8, -13);
      g.lineTo(11, -7);
      g.lineTo(3, -7);
      g.closePath();
      g.fill();
      g.stroke();
      function wheel(wx) {
        g.fillStyle = '#23262b';
        g.beginPath();
        g.arc(wx, 9, 7, 0, U.TAU);
        g.fill();
        g.strokeStyle = C.ink;
        g.lineWidth = 2.5;
        g.stroke();
        g.fillStyle = '#8d979e';
        g.beginPath();
        g.arc(wx, 9, 3, 0, U.TAU);
        g.fill();
      }
      wheel(-13);
      wheel(14);
      gloss(g, -17, -2, 4, 2);
    });
    sprite('brick', 46, 40, function (g) {
      /* toy building brick: sworn enemy of bare feet and drain pipes */
      g.save();
      g.rotate(0.14);
      g.fillStyle = '#2f7fe0';
      rr(g, -16, -6, 32, 18, 3);
      g.fill();
      ink(g, 3);
      g.fillStyle = '#5ea1f2';
      g.beginPath();
      g.ellipse(-8, -6, 6, 4, 0, 0, U.TAU);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 2.2;
      g.stroke();
      g.fillStyle = '#5ea1f2';
      g.beginPath();
      g.ellipse(8, -6, 6, 4, 0, 0, U.TAU);
      g.fill();
      g.stroke();
      g.fillStyle = '#1d5cb0';
      rr(g, -15, 7, 30, 4, 2);
      g.fill();
      g.restore();
    });
    sprite('hamster', 60, 50, function (g) {
      /* the class hamster: belly-up, paws to heaven. gone, not flushed */
      g.fillStyle = '#e8a25c';
      g.beginPath();
      g.ellipse(4, 4, 20, 13, 0, 0, U.TAU);
      g.fill();
      g.beginPath();
      g.ellipse(4, 4, 20, 13, 0, 0, U.TAU);
      ink(g, 3);
      g.fillStyle = '#f7e3c8';
      g.beginPath();
      g.ellipse(6, 2, 11, 7, 0, 0, U.TAU);
      g.fill();
      /* stiff little paws, pointing up */
      function paw(x1, y1, x2, y2) {
        g.strokeStyle = C.ink;
        g.lineWidth = 4.5;
        g.beginPath();
        g.moveTo(x1, y1); g.lineTo(x2, y2);
        g.stroke();
        g.strokeStyle = '#e8a25c';
        g.lineWidth = 2.4;
        g.beginPath();
        g.moveTo(x1, y1); g.lineTo(x2, y2);
        g.stroke();
      }
      paw(0, -7, -1, -16);
      paw(7, -8, 7, -17);
      paw(14, -6, 16, -14);
      paw(20, -4, 23, -11);
      /* head tipped back at the left end */
      g.fillStyle = '#e8a25c';
      g.beginPath();
      g.arc(-16, -1, 10, 0, U.TAU);
      g.fill();
      g.beginPath();
      g.arc(-16, -1, 10, 0, U.TAU);
      ink(g, 3);
      g.fillStyle = '#e8a25c';
      g.beginPath();
      g.arc(-23, -9, 3.6, 0, U.TAU);
      g.fill();
      g.beginPath();
      g.arc(-23, -9, 3.6, 0, U.TAU);
      ink(g, 2);
      g.fillStyle = '#e8a25c';
      g.beginPath();
      g.arc(-10, -10, 3.6, 0, U.TAU);
      g.fill();
      g.beginPath();
      g.arc(-10, -10, 3.6, 0, U.TAU);
      ink(g, 2);
      /* X eyes */
      g.strokeStyle = C.ink;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-22, -5); g.lineTo(-18, -1);
      g.moveTo(-18, -5); g.lineTo(-22, -1);
      g.moveTo(-14, -5); g.lineTo(-10, -1);
      g.moveTo(-10, -5); g.lineTo(-14, -1);
      g.stroke();
      /* tongue out */
      g.fillStyle = '#e8607a';
      rr(g, -19, 4, 6, 7, 3);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 1.6;
      rr(g, -19, 4, 6, 7, 3);
      g.stroke();
      /* tiny tail */
      g.strokeStyle = '#c9854a';
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(23, 8);
      g.quadraticCurveTo(28, 6, 27, 11);
      g.stroke();
    });
  }

  /* THE Lanik mascot, faithful to the decal painted on the real truck:
     a happy pear of a guy who is mostly head and belly. Giant piano-key
     grin, wide black shades, peach cap with the red L, white tee over a
     proud gut, denim shorts, tan work gloves + gold boots ankle-deep in
     his puddle, green hose looped at his side, blue bucket, thumbs up.
     (x,y) = ground point between his feet; at s=1 he stands ~205 world
     px tall. */
  function mascot(g, x, y, o) {
    o = o || {};
    var s = o.s || 1;
    var leg = o.moving ? Math.sin((o.walk || 0) * 10) * 7 : 0;
    var bob = o.moving ? Math.abs(Math.cos((o.walk || 0) * 10)) * 2.5 : 0;
    var SKIN = '#f2e7d2';
    var TEE = '#fdfcf7';
    var CAP = '#eb9257';
    var CAPD = '#cf7038';
    var TAN = '#dfa94e';
    var TAND = '#b3813a';
    var JEAN = '#4272cc';
    g.save();
    g.translate(x, y);
    if (o.flip) g.scale(-1, 1);
    g.scale(s, s);
    g.lineJoin = 'round';
    g.lineCap = 'round';

    /* muck pool, back layer */
    if (o.puddle) {
      g.fillStyle = '#5d3d1d';
      g.beginPath();
      g.ellipse(2, -3, 64, 13, 0, 0, U.TAU);
      g.ellipse(-58, 0, 16, 7, 0, 0, U.TAU);
      g.ellipse(56, -1, 18, 8, 0, 0, U.TAU);
      g.fill();
      g.fillStyle = '#4a2f14';
      g.beginPath();
      g.ellipse(2, -2, 46, 8, 0, 0, U.TAU);
      g.fill();
    }
    if (o.bucket) {
      g.fillStyle = '#3f8fd6';
      g.beginPath();
      g.moveTo(-92, -28);
      g.lineTo(-68, -28);
      g.lineTo(-71, -2);
      g.lineTo(-89, -2);
      g.closePath();
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 3;
      g.stroke();
      g.fillStyle = '#2c6cab';
      g.beginPath();
      g.ellipse(-80, -28, 12, 3.5, 0, 0, U.TAU);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 2.5;
      g.stroke();
    }

    g.translate(0, -bob);

    /* the hose: out of his grip, up and over in a lazy loop, one ground
       curl, tip trailing off into the muck */
    if (o.hose) {
      var hosePath = function () {
        g.beginPath();
        g.moveTo(-36, -64);
        g.bezierCurveTo(-58, -80, -84, -74, -86, -46);
        g.bezierCurveTo(-87, -26, -76, -12, -62, -10);
        g.arc(-46, -17, 13, Math.PI * 0.82, Math.PI * 2.55);
        g.bezierCurveTo(-38, -2, -20, -2, -8, -5);
      };
      g.strokeStyle = C.hoseDark;
      g.lineWidth = 11;
      hosePath();
      g.stroke();
      g.strokeStyle = C.hose;
      g.lineWidth = 7.5;
      hosePath();
      g.stroke();
    }

    /* stubby denim legs + gold work boots */
    function legAt(lx) {
      g.fillStyle = JEAN;
      rr(g, lx - 9, -46, 18, 30, 6);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 3;
      rr(g, lx - 9, -46, 18, 30, 6);
      g.stroke();
    }
    function bootAt(bx, dir) {
      var bl = dir < 0 ? bx - 22 : bx - 9;
      g.fillStyle = TAN;
      rr(g, bl, -16, 31, 15, 6);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 3;
      rr(g, bl, -16, 31, 15, 6);
      g.stroke();
      g.fillStyle = TAND;
      rr(g, bl, -8, 31, 7, 3);
      g.fill();
    }
    legAt(-15 + leg);
    legAt(15 - leg);
    bootAt(-15 + leg, -1);
    bootAt(15 - leg, 1);

    /* denim shorts under the overhang of the belly */
    g.fillStyle = JEAN;
    g.beginPath();
    g.moveTo(-31, -62);
    g.quadraticCurveTo(0, -56, 31, -62);
    g.quadraticCurveTo(33, -40, 26, -34);
    g.quadraticCurveTo(0, -28, -26, -34);
    g.quadraticCurveTo(-33, -40, -31, -62);
    g.closePath();
    g.fill();
    g.strokeStyle = C.ink;
    g.lineWidth = 3.5;
    g.stroke();
    g.strokeStyle = '#2b52a3';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(0, -52);
    g.lineTo(0, -32);
    g.stroke();
    g.fillStyle = '#6e97e8';
    g.beginPath();
    g.ellipse(-14, -44, 5, 4, 0.3, 0, U.TAU);
    g.fill();

    /* the belly: a proud white egg, wider than the head */
    function bellyPath() {
      g.beginPath();
      g.moveTo(-21, -120);
      g.bezierCurveTo(-42, -110, -48, -76, -37, -54);
      g.quadraticCurveTo(0, -46, 37, -54);
      g.bezierCurveTo(48, -76, 42, -110, 21, -120);
      g.quadraticCurveTo(0, -127, -21, -120);
      g.closePath();
    }
    g.fillStyle = TEE;
    bellyPath();
    g.fill();
    g.strokeStyle = C.ink;
    g.lineWidth = 3.5;
    bellyPath();
    g.stroke();
    g.strokeStyle = 'rgba(26,26,26,0.16)';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(-30, -58);
    g.quadraticCurveTo(0, -50, 30, -58);
    g.stroke();
    gloss(g, -16, -102, 7, 3.5);
    /* chest pocket, like the decal */
    g.strokeStyle = '#b9b2a2';
    g.lineWidth = 2;
    rr(g, 13, -106, 14, 12, 3);
    g.stroke();
    if (!o.flip) {
      g.fillStyle = '#8d97a5';
      g.font = '800 5px ' + FONT;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('LANIK', 20, -100);
    }

    /* arms: white sleeves; one hand works the hose, the other throws
       the world-famous thumbs-up */
    function armPaths() {
      g.beginPath();
      if (o.hose) {
        g.moveTo(-24, -112);
        g.bezierCurveTo(-46, -104, -50, -86, -40, -68);
      } else if (o.carrying) {
        g.moveTo(-24, -112);
        g.quadraticCurveTo(-46, -102, -50, -84);
      } else {
        g.moveTo(-24, -112);
        g.quadraticCurveTo(-44, -98, -41, -74);
      }
      if (o.thumbsUp) {
        g.moveTo(24, -112);
        g.bezierCurveTo(44, -108, 47, -116, 45, -128);
      } else {
        g.moveTo(24, -112);
        g.quadraticCurveTo(44, -98, 41, -74);
      }
      g.stroke();
    }
    g.strokeStyle = C.ink;
    g.lineWidth = 15;
    armPaths();
    g.strokeStyle = TEE;
    g.lineWidth = 10.5;
    armPaths();
    if (o.hose) {
      /* brass coupling poking up out of his grip */
      g.save();
      g.translate(-37, -71);
      g.rotate(-0.7);
      g.fillStyle = TAN;
      rr(g, -5.5, -11, 11, 20, 4);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 2.5;
      rr(g, -5.5, -11, 11, 20, 4);
      g.stroke();
      g.restore();
    }
    function glove(gx, gy, r) {
      g.fillStyle = TAN;
      g.beginPath();
      g.arc(gx, gy, r || 8, 0, U.TAU);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 2.5;
      g.stroke();
    }
    if (o.hose) glove(-39, -66, 8.5);
    else if (o.carrying) glove(-50, -84, 8.5);
    else glove(-41, -73, 8);
    if (o.thumbsUp) {
      /* chunky fist by the cheek, thumb to the sky */
      g.fillStyle = TAN;
      rr(g, 37, -125, 13, 10, 4);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 2.5;
      rr(g, 37, -125, 13, 10, 4);
      g.stroke();
      g.fillStyle = TAN;
      rr(g, 41, -152, 10, 17, 5);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 2.5;
      rr(g, 41, -152, 10, 17, 5);
      g.stroke();
      glove(46, -133, 11.5);
      /* knuckle lines */
      g.strokeStyle = C.ink;
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(41, -140);
      g.quadraticCurveTo(46, -143, 51, -140);
      g.stroke();
    } else {
      glove(41, -73, 8);
    }

    /* the head: giant, no neck, mostly grin */
    g.fillStyle = SKIN;
    g.beginPath();
    g.ellipse(0, -149, 30, 32, 0, 0, U.TAU);
    g.fill();
    g.strokeStyle = C.ink;
    g.lineWidth = 3.5;
    g.stroke();
    /* the piano-key grin, bulging past the jaw */
    g.fillStyle = '#fff';
    g.beginPath();
    g.moveTo(-23, -154);
    g.quadraticCurveTo(0, -146, 23, -154);
    g.quadraticCurveTo(24, -124, 8, -114);
    g.quadraticCurveTo(0, -110, -8, -114);
    g.quadraticCurveTo(-24, -124, -23, -154);
    g.closePath();
    g.fill();
    g.strokeStyle = C.ink;
    g.lineWidth = 2.8;
    g.stroke();
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(-15, -149);
    g.lineTo(-13, -121);
    g.moveTo(-7.5, -148);
    g.lineTo(-7, -114);
    g.moveTo(0, -147);
    g.lineTo(0, -112);
    g.moveTo(7.5, -148);
    g.lineTo(7, -114);
    g.moveTo(15, -149);
    g.lineTo(13, -121);
    g.stroke();
    g.beginPath();
    g.moveTo(-21, -134);
    g.lineTo(21, -134);
    g.stroke();
    /* wide wraparound shades, glinting */
    g.fillStyle = C.ink;
    rr(g, -29, -175, 58, 14, 7);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.45)';
    g.beginPath();
    g.moveTo(-21, -173);
    g.lineTo(-13, -164);
    g.lineTo(-17, -164);
    g.lineTo(-24, -172);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(5, -173);
    g.lineTo(11, -166);
    g.lineTo(8, -166);
    g.lineTo(2, -172);
    g.closePath();
    g.fill();
    /* the peach cap: dome, seam, left brim over the shades, red L */
    g.fillStyle = CAP;
    g.beginPath();
    g.arc(0, -172, 30, Math.PI, 0);
    g.closePath();
    g.fill();
    g.strokeStyle = C.ink;
    g.lineWidth = 3.5;
    g.stroke();
    g.strokeStyle = CAPD;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-9, -200);
    g.quadraticCurveTo(-13, -188, -12, -176);
    g.stroke();
    g.fillStyle = CAP;
    rr(g, -42, -181, 33, 9, 4.5);
    g.fill();
    g.strokeStyle = C.ink;
    g.lineWidth = 2.5;
    rr(g, -42, -181, 33, 9, 4.5);
    g.stroke();
    g.fillStyle = CAPD;
    rr(g, -42, -175, 33, 3, 1.5);
    g.fill();
    g.fillStyle = CAPD;
    g.beginPath();
    g.arc(0, -201, 3.2, 0, U.TAU);
    g.fill();
    g.strokeStyle = C.ink;
    g.lineWidth = 2;
    g.stroke();
    if (!o.flip) sticker(g, 'L', 8, -186, 15, C.red, 3, '#7c1212');

    /* tan splash chunks riding over the boot tops */
    if (o.puddle) {
      g.fillStyle = '#d9b473';
      function blob(bx, by, brx, bry, rot2) {
        g.beginPath();
        g.ellipse(bx, by, brx, bry, rot2 || 0, 0, U.TAU);
        g.fill();
        g.strokeStyle = C.ink;
        g.lineWidth = 2.5;
        g.stroke();
      }
      blob(-32, -7, 13, 8, -0.2);
      blob(31, -5, 15, 8, 0.15);
      blob(-56, -3, 9, 5, 0);
      blob(52, -9, 7, 4.5, 0.4);
      blob(8, -3, 8, 4, 0);
      /* flying droplets, one path each so the fills don't join */
      g.beginPath();
      g.arc(-46, -26, 3, 0, U.TAU);
      g.fill();
      g.beginPath();
      g.arc(44, -22, 2.6, 0, U.TAU);
      g.fill();
      g.beginPath();
      g.arc(-14, -18, 2.2, 0, U.TAU);
      g.fill();
    }

    g.restore();
  }

  /* cinematic-sized wrapper (kept for the timeline code) */
  function tech(g, x, y, o) {
    o = o || {};
    mascot(g, x, y, {
      s: 0.38,
      walk: o.walk,
      moving: o.moving,
      flip: o.flip,
      carrying: o.carrying,
      thumbsUp: o.thumbsUp,
      hose: false,
      puddle: false,
      bucket: false
    });
  }

  function family(g, x, y, o) {
    o = o || {};
    var t = o.t || 0;
    var cheer = o.cheer || 0;
    var mood = o.panic ? 'panic' : (cheer > 0 ? 'happy' : 'sad');
    var members = [
      { dx: -34, h: 46, col: '#3f7ac2', head: 10 },
      { dx: 0, h: 42, col: '#c25a8e', head: 9.5, hair: true },
      { dx: 28, h: 28, col: '#4fc47f', head: 8 }
    ];
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      var hop = cheer > 0 ? Math.abs(Math.sin(t * 7 + i * 1.3)) * 10 * cheer : 0;
      var jitter = o.panic ? Math.sin(t * 22 + i * 2) * 2.5 : 0;
      g.save();
      g.translate(x + m.dx + jitter, y - hop);
      g.fillStyle = m.col;
      rr(g, -m.head, -m.h, m.head * 2, m.h - 6, m.head * 0.8);
      g.fill();
      ink(g, 3);
      g.strokeStyle = C.ink;
      g.lineWidth = 4;
      g.beginPath();
      if (cheer > 0 || o.panic) {
        g.moveTo(-m.head, -m.h + 6); g.lineTo(-m.head - 8, -m.h - 8);
        g.moveTo(m.head, -m.h + 6); g.lineTo(m.head + 8, -m.h - 8);
      } else {
        g.moveTo(-m.head, -m.h + 6); g.lineTo(-m.head - 6, -m.h + 18);
        g.moveTo(m.head, -m.h + 6); g.lineTo(m.head + 6, -m.h + 18);
      }
      g.stroke();
      g.fillStyle = '#ffd9b3';
      g.beginPath();
      g.arc(0, -m.h - m.head + 2, m.head, 0, U.TAU);
      g.fill();
      ink(g, 3);
      if (m.hair) {
        g.fillStyle = '#5f3c1e';
        g.beginPath();
        g.arc(0, -m.h - m.head - 1, m.head, Math.PI, 0);
        g.closePath();
        g.fill();
        ink(g, 2.5);
      }
      face(g, 0, -m.h - m.head + 3, 0.55, mood);
      g.restore();
    }
  }

  /* ---------- playfield panels ---------- */

  function buildPlayfield() {
    panel('bg', 480, 800, function (g) {
      /* bathroom wall */
      g.fillStyle = '#efe3cc';
      g.fillRect(0, 0, 480, 100);
      g.fillStyle = '#e2d2b1';
      for (var i = 0; i < 480; i += 40) g.fillRect(i, 0, 18, 100);
      /* floor */
      g.fillStyle = '#b0793f';
      g.fillRect(0, 100, 480, 26);
      g.strokeStyle = '#8a5a26';
      g.lineWidth = 2;
      for (var f = 0; f < 480; f += 60) {
        g.beginPath(); g.moveTo(f, 100); g.lineTo(f, 126); g.stroke();
      }
      g.strokeStyle = C.ink;
      g.lineWidth = 4;
      g.beginPath(); g.moveTo(0, 100); g.lineTo(480, 100); g.stroke();

      /* fixtures on the floor: sink, toilet, washer */
      /* sink */
      g.fillStyle = '#fff';
      rr(g, 62, 62, 56, 14, 5); g.fill(); ink(g, 3.5);
      g.fillStyle = '#d7dbe0';
      rr(g, 80, 76, 20, 24, 4); g.fill(); ink(g, 3);
      g.strokeStyle = C.ink; g.lineWidth = 3;
      g.beginPath(); g.moveTo(76, 58); g.quadraticCurveTo(90, 48, 96, 60); g.stroke();
      /* toilet */
      g.fillStyle = '#fff';
      rr(g, 216, 44, 20, 34, 5); g.fill(); ink(g, 3.5);
      g.beginPath();
      g.ellipse(250, 82, 26, 14, 0, 0, U.TAU);
      g.fillStyle = '#fff'; g.fill(); ink(g, 3.5);
      g.beginPath();
      g.ellipse(250, 80, 17, 8, 0, 0, U.TAU);
      g.fillStyle = '#9fd8ff'; g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = '#fff';
      rr(g, 230, 88, 40, 12, 4); g.fill(); ink(g, 3);
      /* washer */
      g.fillStyle = '#d7dbe0';
      rr(g, 358, 48, 60, 52, 8); g.fill(); ink(g, 3.5);
      g.beginPath(); g.arc(388, 76, 17, 0, U.TAU);
      g.fillStyle = '#9fd8ff'; g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 3; g.stroke();
      g.beginPath(); g.arc(388, 76, 10, 0, U.TAU);
      g.strokeStyle = '#6aa8cc'; g.lineWidth = 2; g.stroke();
      g.fillStyle = C.red;
      g.beginPath(); g.arc(408, 56, 3.5, 0, U.TAU); g.fill();

      /* sewer manifold band */
      g.fillStyle = '#8d979e';
      g.fillRect(0, 126, 480, 30);
      g.fillStyle = '#77828a';
      g.fillRect(0, 126, 480, 7);
      g.strokeStyle = C.ink;
      g.lineWidth = 4;
      g.strokeRect(-4, 126, 488, 30);
      g.fillStyle = '#2a2e31';
      rr(g, 44, 144, 392, 12, 6);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 3;
      rr(g, 44, 144, 392, 12, 6);
      g.stroke();
      for (var b = 20; b < 480; b += 56) {
        g.fillStyle = '#5f676d';
        g.beginPath(); g.arc(b, 141, 3, 0, U.TAU); g.fill();
      }

      /* shaft interior */
      g.fillStyle = '#c3d2d8';
      g.fillRect(36, 156, 408, 476);
      g.fillStyle = '#b1c2c9';
      for (var s = 70; s < 444; s += 74) g.fillRect(s, 156, 12, 476);
      /* grime streaks */
      g.fillStyle = 'rgba(122,84,38,0.16)';
      g.fillRect(60, 156, 8, 476);
      g.fillRect(250, 156, 10, 476);
      g.fillRect(396, 156, 7, 476);

      /* dirt side walls */
      function dirtCol(x) {
        g.fillStyle = C.dirt;
        g.fillRect(x, 126, 36, 800 - 126);
        g.fillStyle = C.dirtDark;
        for (var p = 0; p < 14; p++) {
          g.beginPath();
          g.ellipse(x + 8 + ((p * 37) % 22), 170 + p * 46, 5, 3.5, p, 0, U.TAU);
          g.fill();
        }
      }
      dirtCol(0);
      dirtCol(444);
      g.strokeStyle = C.ink;
      g.lineWidth = 4;
      g.beginPath(); g.moveTo(36, 156); g.lineTo(36, 640); g.stroke();
      g.beginPath(); g.moveTo(444, 156); g.lineTo(444, 640); g.stroke();

      /* sign on left wall */
      g.save();
      g.translate(4, 300);
      g.rotate(-0.06);
      g.fillStyle = C.hazard;
      rr(g, -6, 0, 44, 74, 6);
      g.fill();
      ink(g, 3);
      g.fillStyle = C.ink;
      g.font = '800 15px ' + FONT;
      g.textAlign = 'center';
      g.save();
      g.translate(16, 37);
      g.rotate(-Math.PI / 2);
      g.fillText('3 P\'s ONLY', 0, 5);
      g.restore();
      g.restore();

      /* dirt bed around the tank */
      g.fillStyle = C.dirt;
      g.fillRect(0, 632, 480, 168);
      g.fillStyle = C.dirtDark;
      for (var q = 0; q < 20; q++) {
        g.beginPath();
        g.ellipse(20 + ((q * 53) % 450), 650 + ((q * 37) % 130), 6, 4, q, 0, U.TAU);
        g.fill();
      }

      /* tank shell */
      var T = LAYOUT.TANK;
      g.fillStyle = '#9aa4ae';
      rr(g, T.x - 10, T.y - 8, T.w + 20, T.h + 18, 20);
      g.fill();
      ink(g, 5);
      g.fillStyle = '#22201c';
      rr(g, T.x, T.y, T.w, T.h, 12);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 3;
      rr(g, T.x, T.y, T.w, T.h, 12);
      g.stroke();
      /* inlet grate teeth along tank mouth */
      g.fillStyle = '#77828a';
      for (var m = T.x + 14; m < T.x + T.w - 10; m += 34) {
        rr(g, m, T.y - 8, 16, 12, 4);
        g.fill();
      }
      /* level marks */
      g.strokeStyle = 'rgba(245,243,238,0.5)';
      g.lineWidth = 2;
      g.font = '800 11px ' + FONT;
      g.fillStyle = 'rgba(245,243,238,0.55)';
      g.textAlign = 'left';
      var marks = [[0.25, '25'], [0.5, '50'], [0.75, '75']];
      for (var mi = 0; mi < marks.length; mi++) {
        var my = T.y + T.h - T.h * marks[mi][0];
        g.beginPath();
        g.moveTo(T.x + 4, my);
        g.lineTo(T.x + 18, my);
        g.stroke();
        g.fillText(marks[mi][1], T.x + 22, my + 4);
      }
    });

    /* trash can sprite */
    sprite('can', 76, 86, function (g) {
      g.fillStyle = '#4a545c';
      g.beginPath();
      g.moveTo(-24, -26);
      g.lineTo(24, -26);
      g.lineTo(19, 34);
      g.quadraticCurveTo(0, 38, -19, 34);
      g.closePath();
      g.fill();
      ink(g, 4);
      g.strokeStyle = '#333b41';
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(-12, -18); g.lineTo(-10, 28);
      g.moveTo(0, -18); g.lineTo(0, 30);
      g.moveTo(12, -18); g.lineTo(10, 28);
      g.stroke();
      g.fillStyle = '#5f6a73';
      g.beginPath();
      g.ellipse(0, -27, 26, 8, 0, 0, U.TAU);
      g.fill();
      ink(g, 4);
      g.fillStyle = '#39424a';
      g.beginPath();
      g.ellipse(0, -27, 19, 5, 0, 0, U.TAU);
      g.fill();
      g.fillStyle = C.hazard;
      rr(g, -17, -8, 34, 16, 4);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 2.5;
      rr(g, -17, -8, 34, 16, 4);
      g.stroke();
      sticker(g, 'TRASH', 0, 0, 11, C.ink, 0);
    });

    /* red edge vignette */
    panel('vig', 480, 800, function (g) {
      var gr = g.createRadialGradient(240, 400, 200, 240, 400, 520);
      gr.addColorStop(0, 'rgba(200,32,43,0)');
      gr.addColorStop(1, 'rgba(200,32,43,0.55)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 480, 800);
    });

  }

  /* ---------- cinematic panels ---------- */

  function buildCine() {
    panel('cineSky', 480, CINE.HORIZON, function (g) {
      var gr = g.createLinearGradient(0, 0, 0, CINE.HORIZON);
      gr.addColorStop(0, C.skyHi);
      gr.addColorStop(1, C.sky);
      g.fillStyle = gr;
      g.fillRect(0, 0, 480, CINE.HORIZON);
      g.fillStyle = C.sun;
      g.beginPath(); g.arc(70, 74, 34, 0, U.TAU); g.fill();
      ink(g, 4);
      g.fillStyle = '#fff';
      function cloud(x, y, s) {
        g.beginPath();
        g.arc(x, y, 16 * s, 0, U.TAU);
        g.arc(x + 20 * s, y - 7 * s, 13 * s, 0, U.TAU);
        g.arc(x + 40 * s, y, 15 * s, 0, U.TAU);
        g.fill();
      }
      cloud(180, 80, 1);
      cloud(330, 130, 0.8);
      cloud(60, 190, 0.7);
    });

    panel('cineHouse', 190, 230, function (g) {
      g.fillStyle = '#fff';
      rr(g, 10, 74, 170, 150, 6);
      g.fill();
      ink(g, 4);
      g.fillStyle = '#3a3f47';
      g.beginPath();
      g.moveTo(0, 80);
      g.lineTo(95, 8);
      g.lineTo(190, 80);
      g.closePath();
      g.fill();
      ink(g, 4);
      g.fillStyle = C.red;
      g.fillRect(150, 26, 16, 34);
      g.strokeStyle = C.ink; g.lineWidth = 3;
      g.strokeRect(150, 26, 16, 34);
      g.fillStyle = C.red;
      rr(g, 82, 150, 34, 74, 4);
      g.fill();
      ink(g, 3.5);
      g.fillStyle = C.gold;
      g.beginPath(); g.arc(108, 188, 3, 0, U.TAU); g.fill();
      function win(x, y) {
        g.fillStyle = '#9fd8ff';
        rr(g, x, y, 34, 30, 4);
        g.fill();
        g.strokeStyle = C.ink; g.lineWidth = 3;
        rr(g, x, y, 34, 30, 4);
        g.stroke();
        g.beginPath();
        g.moveTo(x + 17, y); g.lineTo(x + 17, y + 30);
        g.moveTo(x, y + 15); g.lineTo(x + 34, y + 15);
        g.stroke();
      }
      win(28, 96);
      win(130, 96);
      win(28, 156);
    });

    panel('cineUnder', 480, 200, function (g) {
      /* y offset: drawn at world y 600 */
      g.fillStyle = C.dirtDark;
      g.fillRect(0, 0, 480, 200);
      g.fillStyle = C.dirtDeep;
      for (var q = 0; q < 16; q++) {
        g.beginPath();
        g.ellipse(15 + ((q * 61) % 460), 20 + ((q * 43) % 170), 7, 4.5, q, 0, U.TAU);
        g.fill();
      }
      var T = { x: CINE.TANK.x, y: CINE.TANK.y - 600, w: CINE.TANK.w, h: CINE.TANK.h };
      g.fillStyle = '#9aa4ae';
      rr(g, T.x - 10, T.y - 10, T.w + 20, T.h + 20, 18);
      g.fill();
      ink(g, 5);
      g.fillStyle = '#22201c';
      rr(g, T.x, T.y, T.w, T.h, 10);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 3;
      rr(g, T.x, T.y, T.w, T.h, 10);
      g.stroke();
    });

    /* truck body, facing left; wheels + beacon + gauge needle drawn at runtime */
    panel('truckBody', TRUCK.W, TRUCK.H, function (g) {
      /* chassis */
      g.fillStyle = '#2c3036';
      rr(g, 6, 92, 266, 14, 5);
      g.fill();
      ink(g, 3.5);
      /* cab */
      g.fillStyle = '#fff';
      g.beginPath();
      g.moveTo(10, 92);
      g.lineTo(10, 58);
      g.quadraticCurveTo(12, 30, 38, 26);
      g.lineTo(74, 26);
      g.lineTo(74, 92);
      g.closePath();
      g.fill();
      ink(g, 4);
      g.fillStyle = '#9fd8ff';
      g.beginPath();
      g.moveTo(18, 56);
      g.quadraticCurveTo(20, 36, 40, 33);
      g.lineTo(52, 33);
      g.lineTo(52, 56);
      g.closePath();
      g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 3; g.stroke();
      g.strokeStyle = C.ink;
      g.lineWidth = 3;
      g.beginPath(); g.moveTo(58, 33); g.lineTo(58, 92); g.stroke();
      g.fillStyle = '#d7dbe0';
      rr(g, 8, 78, 10, 14, 3);
      g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 2.5;
      rr(g, 8, 78, 10, 14, 3);
      g.stroke();
      g.fillStyle = C.ink;
      rr(g, 61, 55, 8, 3, 1.5);
      g.fill();
      /* beacon base */
      g.fillStyle = '#3a3f47';
      rr(g, 34, 20, 18, 7, 2);
      g.fill();
      /* steel tank */
      var gr = g.createLinearGradient(0, 26, 0, 92);
      gr.addColorStop(0, C.steelHi);
      gr.addColorStop(0.45, C.steel);
      gr.addColorStop(1, C.steelDark);
      g.fillStyle = gr;
      rr(g, 80, 26, 190, 66, 30);
      g.fill();
      ink(g, 4);
      /* hatches */
      for (var hix = 0; hix < 3; hix++) {
        var hx = 116 + hix * 46;
        g.fillStyle = C.steel;
        g.beginPath();
        g.arc(hx, 26, 12, Math.PI, 0);
        g.closePath();
        g.fill();
        g.strokeStyle = C.ink; g.lineWidth = 3; g.stroke();
        g.fillStyle = C.steelDark;
        g.fillRect(hx - 5, 16, 10, 4);
      }
      /* lettering */
      sticker(g, 'LANIK', 168, 47, 27, C.red, 6, '#fff');
      g.strokeStyle = C.blue;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(120, 58);
      g.quadraticCurveTo(168, 66, 216, 58);
      g.stroke();
      sticker(g, 'PUMPING SERVICE', 168, 70, 11, C.red, 0);
      sticker(g, '1-877-LANIK-56', 168, 83, 10, C.blue, 0);
      /* rear reel + coiled hose */
      g.fillStyle = '#3a3f47';
      g.beginPath(); g.arc(TRUCK.reel.x, TRUCK.reel.y, 17, 0, U.TAU); g.fill();
      ink(g, 3.5);
      g.strokeStyle = C.hose;
      g.lineWidth = 5;
      g.beginPath(); g.arc(TRUCK.reel.x, TRUCK.reel.y, 11, 0, U.TAU); g.stroke();
      g.beginPath(); g.arc(TRUCK.reel.x, TRUCK.reel.y, 6, 0, U.TAU); g.stroke();
      /* gauge face */
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(TRUCK.gauge.x, TRUCK.gauge.y, 10, 0, U.TAU); g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 3; g.stroke();
      /* the mascot painted on the tank, just like the real truck */
      mascot(g, 226, 87, { s: 0.14, thumbsUp: true, puddle: true, hose: true });
      /* mudflap */
      g.fillStyle = '#2c3036';
      rr(g, 272, 92, 6, 18, 2);
      g.fill();
    });

    sprite('wheel', 44, 44, function (g) {
      g.fillStyle = '#23262b';
      g.beginPath(); g.arc(0, 0, 20, 0, U.TAU); g.fill();
      ink(g, 3.5);
      g.fillStyle = '#8d979e';
      g.beginPath(); g.arc(0, 0, 9, 0, U.TAU); g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 2.5; g.stroke();
      g.strokeStyle = '#5f676d';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-9, 0); g.lineTo(9, 0);
      g.moveTo(0, -9); g.lineTo(0, 9);
      g.stroke();
    });
  }

  /* ---------- runtime painters ---------- */

  function drawSprite(g, key, x, y, sx, sy, rot) {
    var s = spr[key];
    if (!s) return;
    g.save();
    g.translate(x, y);
    if (rot) g.rotate(rot);
    g.scale(sx || 1, sy || sx || 1);
    g.drawImage(s.c, -s.w / 2, -s.h / 2, s.w, s.h);
    g.restore();
  }

  function bg(g) {
    g.drawImage(spr.bg.c, 0, 0, 480, 800);
  }

  /* animated liquid inside a tank rect */
  function tankLiquid(g, T, fill, t, danger) {
    var pct = U.clamp(fill, 0, 100) / 100;
    var top = T.y + T.h - (T.h - 8) * pct - 6;
    g.save();
    rr(g, T.x + 3, T.y + 3, T.w - 6, T.h - 6, 9);
    g.clip();
    var col = danger ? '#7a3a20' : C.sludge;
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(T.x, T.y + T.h);
    g.lineTo(T.x, top);
    for (var x = T.x; x <= T.x + T.w; x += 16) {
      g.lineTo(x, top + Math.sin(x * 0.05 + t * 2.2) * 3.5);
    }
    g.lineTo(T.x + T.w, T.y + T.h);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.10)';
    g.beginPath();
    for (var x2 = T.x; x2 <= T.x + T.w; x2 += 16) {
      var yy = top + Math.sin(x2 * 0.05 + t * 2.2) * 3.5;
      if (x2 === T.x) g.moveTo(x2, yy);
      else g.lineTo(x2, yy);
    }
    g.lineWidth = 5;
    g.strokeStyle = 'rgba(255,255,255,0.26)';
    g.stroke();
    /* floaters: corn and lumps riding the surface */
    if (pct > 0.06) {
      for (var f = 0; f < 5; f++) {
        var fx = T.x + 30 + ((f * 83) % (T.w - 60)) + Math.sin(t * 1.4 + f * 2) * 8;
        var fy = top + 6 + Math.sin(t * 2 + f) * 2.5;
        if (f % 2 === 0) {
          g.fillStyle = C.gold;
          rr(g, fx - 4, fy - 2.5, 8, 5, 2.5);
          g.fill();
        } else {
          g.fillStyle = C.pooDark;
          g.beginPath();
          g.ellipse(fx, fy, 7, 4, 0, 0, U.TAU);
          g.fill();
        }
      }
    }
    /* bubbles */
    for (var b = 0; b < 4; b++) {
      var bt = (t * 0.5 + b * 0.27) % 1;
      var bx = T.x + 40 + ((b * 97) % (T.w - 80));
      var by = T.y + T.h - 10 - bt * (T.h * pct * 0.8);
      if (by > top + 6) {
        g.strokeStyle = 'rgba(255,255,255,0.25)';
        g.lineWidth = 2;
        g.beginPath();
        g.arc(bx, by, 3 + b, 0, U.TAU);
        g.stroke();
      }
    }
    g.restore();
  }

  function tankLabel(g, T, fill, danger, blink, drain) {
    var pct = Math.round(U.clamp(fill, 0, 100));
    var cx = T.x + T.w / 2;
    var cy = T.y + T.h / 2 + 4;
    if (danger && blink) return;
    sticker(g, pct + '%', cx, cy - 8, 38, danger ? '#ff6b5e' : '#fff', 7, C.ink);
    var label = drain
      ? (pct >= 90 ? 'CRITICAL!' : pct >= 40 ? 'DRAINING...' : pct > 2 ? 'MUCH BETTER' : 'SQUEAKY CLEAN')
      : (pct >= 90 ? 'CRITICAL!' : pct >= 70 ? 'GETTING SPICY' : pct >= 40 ? 'FILLING UP' : 'COZY');
    sticker(g, label, cx, cy + 22, 15, danger ? '#ff6b5e' : C.cream, 4, C.ink);
  }

  function can(g, gulpT) {
    var sq = gulpT > 0 ? 1 + Math.sin(gulpT * Math.PI) * 0.18 : 1;
    drawSprite(g, 'can', LAYOUT.CAN.x, LAYOUT.CAN.y, sq, 2 - sq > 0.999 ? 1 : (2 - sq), 0);
  }

  function vignette(g, a) {
    if (a <= 0) return;
    g.save();
    g.globalAlpha = U.clamp(a, 0, 1);
    g.drawImage(spr.vig.c, 0, 0, 480, 800);
    g.restore();
  }

  function item(g, it) {
    var squash = 1;
    if (it.state === 'falling') squash = 1 + Math.sin(it.t * 9) * 0.05;
    drawSprite(g, it.type, it.x, it.y, squash, 2 - squash > 0.999 ? 1 : (2 - squash), it.rot);
  }

  /* cinematic painters */

  function cineBase(g, lawnT, t) {
    g.drawImage(spr.cineSky.c, 0, 0, 480, CINE.HORIZON);
    /* lawn */
    var gr1 = [0x9c, 0x8a, 0x4a], gr2 = [0x7e, 0xcb, 0x3f];
    var r = Math.round(U.lerp(gr1[0], gr2[0], lawnT));
    var gn = Math.round(U.lerp(gr1[1], gr2[1], lawnT));
    var b = Math.round(U.lerp(gr1[2], gr2[2], lawnT));
    g.fillStyle = 'rgb(' + r + ',' + gn + ',' + b + ')';
    g.fillRect(0, CINE.HORIZON, 480, CINE.GROUND - CINE.HORIZON);
    g.fillStyle = 'rgba(0,0,0,0.12)';
    g.fillRect(0, CINE.HORIZON, 480, 6);
    /* driveway strip under the truck */
    g.fillStyle = '#c9b391';
    g.fillRect(0, 540, 300, 60);
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 540); g.lineTo(300, 540); g.stroke();
    /* house */
    g.drawImage(spr.cineHouse.c, 288, 340, 190, 230);
    /* underground */
    g.drawImage(spr.cineUnder.c, 0, 600, 480, 200);
    /* riser pipe from lawn down to the tank */
    g.fillStyle = '#8d979e';
    g.fillRect(CINE.RISER.x - 11, CINE.RISER.y, 22, CINE.TANK.y - CINE.RISER.y + 6);
    g.strokeStyle = C.ink;
    g.lineWidth = 3;
    g.strokeRect(CINE.RISER.x - 11, CINE.RISER.y, 22, CINE.TANK.y - CINE.RISER.y + 6);
    g.fillStyle = '#3fa02b';
    g.beginPath();
    g.ellipse(CINE.RISER.x, CINE.RISER.y, 20, 8, 0, 0, U.TAU);
    g.fill();
    ink(g, 3.5);
    /* ground edge over the cutaway */
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(0, CINE.GROUND - 3, 480, 3);
  }

  function truck(g, x, y, o) {
    o = o || {};
    var bounce = o.bounce || 0;
    g.save();
    g.translate(x, y - TRUCK.H + 18 + bounce);
    g.drawImage(spr.truckBody.c, 0, 0, TRUCK.W, TRUCK.H);
    /* wheels */
    for (var i = 0; i < TRUCK.wheels.length; i++) {
      drawSprite(g, 'wheel', TRUCK.wheels[i], TRUCK.wheelY - bounce * 0.5, 1, 1, o.wheelRot || 0);
    }
    /* gauge needle */
    var ga = -2.4 + (o.gauge || 0) * 2.1;
    g.strokeStyle = C.red;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(TRUCK.gauge.x, TRUCK.gauge.y);
    g.lineTo(TRUCK.gauge.x + Math.cos(ga) * 8, TRUCK.gauge.y + Math.sin(ga) * 8);
    g.stroke();
    /* beacon */
    if (o.beaconOn) {
      var on = Math.sin((o.t || 0) * 9) > 0;
      g.fillStyle = on ? '#ffb020' : '#c26a00';
      rr(g, 37, 12, 12, 10, 4);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 2.5;
      rr(g, 37, 12, 12, 10, 4);
      g.stroke();
      if (on) {
        g.fillStyle = 'rgba(255,176,32,0.35)';
        g.beginPath();
        g.arc(43, 16, 16, 0, U.TAU);
        g.fill();
      }
    }
    g.restore();
  }

  /* hose from reel to riser: quadratic curve, extends with ext 0..1, lumps travel when pumping */
  function hose(g, x0, y0, x1, y1, ext, t, pumping) {
    if (ext <= 0.01) return;
    var cx = (x0 + x1) / 2;
    var cy = Math.min(y0, y1) - 60;
    function pt(s) {
      var a = 1 - s;
      return {
        x: a * a * x0 + 2 * a * s * cx + s * s * x1,
        y: a * a * y0 + 2 * a * s * cy + s * s * y1
      };
    }
    var end = U.clamp(ext, 0, 1);
    g.strokeStyle = C.hoseDark;
    g.lineWidth = 15;
    g.beginPath();
    g.moveTo(x0, y0);
    for (var s = 0.05; s <= end; s += 0.05) {
      var p = pt(s);
      g.lineTo(p.x, p.y);
    }
    g.stroke();
    g.strokeStyle = C.hose;
    g.lineWidth = 10;
    g.stroke();
    if (pumping) {
      for (var l = 0; l < 3; l++) {
        var ls = ((t * 0.45 + l / 3) % 1) * end;
        var lp = pt(ls);
        g.fillStyle = C.hoseDark;
        g.beginPath();
        g.arc(lp.x, lp.y, 10, 0, U.TAU);
        g.fill();
        g.fillStyle = C.hose;
        g.beginPath();
        g.arc(lp.x, lp.y, 7, 0, U.TAU);
        g.fill();
      }
    }
    var tip = pt(end);
    g.fillStyle = C.nozzle;
    g.save();
    g.translate(tip.x, tip.y);
    rr(g, -7, -8, 14, 20, 5);
    g.fill();
    g.strokeStyle = C.ink;
    g.lineWidth = 3;
    rr(g, -7, -8, 14, 20, 5);
    g.stroke();
    g.restore();
  }

  function geyserColumn(g, x, y, t, power) {
    if (power <= 0) return;
    g.save();
    g.translate(x, y);
    g.fillStyle = C.sludge;
    g.beginPath();
    g.moveTo(-12 * power, 0);
    for (var i = 0; i <= 10; i++) {
      var yy = -i * 18 * power;
      var w = (12 + Math.sin(t * 11 + i) * 5 + i * 2.2) * power;
      g.lineTo(-w, yy);
    }
    for (var j = 10; j >= 0; j--) {
      var yy2 = -j * 18 * power;
      var w2 = (12 + Math.cos(t * 9 + j) * 5 + j * 2.2) * power;
      g.lineTo(w2, yy2);
    }
    g.closePath();
    g.fill();
    g.strokeStyle = C.sludgeDark;
    g.lineWidth = 4;
    g.stroke();
    g.restore();
  }

  function endCard(g, alpha, big, small) {
    if (alpha <= 0) return;
    g.save();
    g.globalAlpha = U.clamp(alpha, 0, 1);
    g.fillStyle = 'rgba(16,18,22,0.55)';
    g.fillRect(0, 0, 480, 800);
    sticker(g, big, 240, 330, 44, '#fff', 9, C.ink);
    sticker(g, small, 240, 386, 19, C.hazard, 5, C.ink);
    g.restore();
  }

  /* hero-pose mascot portrait for DOM screens */
  function mascotDataURL(size) {
    var c = document.createElement('canvas');
    c.width = size * 2;
    c.height = size * 2;
    var g = c.getContext('2d');
    g.scale(2, 2);
    var k = size / 222;
    mascot(g, size * 0.575, size * 0.96, {
      s: k,
      thumbsUp: true,
      hose: true,
      puddle: true,
      bucket: true
    });
    return c.toDataURL();
  }

  /* waist-up mascot portrait: the big grin + thumbs-up, for the tip card */
  function mascotBustDataURL(size) {
    var c = document.createElement('canvas');
    c.width = size * 2;
    c.height = size * 2;
    var g = c.getContext('2d');
    g.scale(2, 2);
    var k = (size - 6) / 105;
    mascot(g, size * 0.45, 3 + 205 * k, { s: k, thumbsUp: true });
    return c.toDataURL();
  }

  function sprDataURL(key, size) {
    var s = spr[key];
    if (!s) return '';
    var c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    var g = c.getContext('2d');
    var k = Math.min(size / s.w, size / s.h) * 0.92;
    g.drawImage(s.c, (size - s.w * k) / 2, (size - s.h * k) / 2, s.w * k, s.h * k);
    return c.toDataURL();
  }

  function truckDataURL(size) {
    var s = spr.truckBody;
    var c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    var g = c.getContext('2d');
    var k = (size / s.w) * 0.96;
    g.drawImage(s.c, (size - s.w * k) / 2, (size - s.h * k) / 2 - 4, s.w * k, s.h * k);
    var wy = (size - s.h * k) / 2 - 4 + (TRUCK.wheelY * k);
    for (var i = 0; i < TRUCK.wheels.length; i++) {
      var wx = (size - s.w * k) / 2 + TRUCK.wheels[i] * k;
      var ws = spr.wheel;
      g.drawImage(ws.c, wx - (ws.w * k) / 2, wy - (ws.h * k) / 2, ws.w * k, ws.h * k);
    }
    return c.toDataURL();
  }

  function prerender() {
    buildItems();
    buildPlayfield();
    buildCine();
  }

  CB.art = {
    prerender: prerender,
    spr: spr,
    LAYOUT: LAYOUT,
    CINE: CINE,
    TRUCK: TRUCK,
    FONT: FONT,
    bg: bg,
    item: item,
    can: can,
    tankLiquid: tankLiquid,
    tankLabel: tankLabel,
    vignette: vignette,
    cineBase: cineBase,
    truck: truck,
    hose: hose,
    tech: tech,
    mascot: mascot,
    mascotDataURL: mascotDataURL,
    mascotBustDataURL: mascotBustDataURL,
    family: family,
    geyserColumn: geyserColumn,
    endCard: endCard,
    sticker: sticker,
    sprDataURL: sprDataURL,
    truckDataURL: truckDataURL
  };
})();
