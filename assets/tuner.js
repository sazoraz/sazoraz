/* ساز و راز — تیونر گیتار | همه‌چیز روی گوشی کاربر پردازش می‌شود؛ صدا جایی ارسال نمی‌شود. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var SOL = ['دو', 'دو دیز', 'ر', 'ر دیز', 'می', 'فا', 'فا دیز', 'سل', 'سل دیز', 'لا', 'لا دیز', 'سی'];
  var INST = {
    guitar: { fmin: 65, fft: 4096, tun: [
      ['استاندارد (E A D G B E)', [40, 45, 50, 55, 59, 64]],
      ['دراپ دی (Drop D)', [38, 45, 50, 55, 59, 64]],
      ['نیم‌پرده پایین (Eb)', [39, 44, 49, 54, 58, 63]],
      ['یک پرده پایین (D)', [38, 43, 48, 53, 57, 62]],
      ['DADGAD', [38, 45, 50, 55, 57, 62]],
      ['اوپن جی (Open G)', [38, 43, 50, 55, 59, 62]],
      ['اوپن دی (Open D)', [38, 45, 50, 54, 57, 62]]] },
    bass: { fmin: 28, fft: 8192, tun: [
      ['استاندارد ۴ سیم (E A D G)', [28, 33, 38, 43]],
      ['۵ سیم (B E A D G)', [23, 28, 33, 38, 43]],
      ['دراپ دی', [26, 33, 38, 43]],
      ['نیم‌پرده پایین (Eb)', [27, 32, 37, 42]]] },
    uke: { fmin: 200, fft: 4096, tun: [['استاندارد (G C E A)', [67, 60, 64, 69]]] }
  };
  var A4 = 440, inst = 'guitar', tun = 0, target = -1 /* -1 = خودکار */, strings = [];
  var ac = null, an = null, stream = null, timer = 0, buf = null, hist = [], lastGood = 0, mutedUntil = 0, running = false;

  var hz = function (m) { return A4 * Math.pow(2, (m - 69) / 12); };
  var midiOf = function (f) { return 69 + 12 * Math.log(f / A4) / Math.LN2; };
  var noteName = function (m) { var r = ((m % 12) + 12) % 12; return { n: NAMES[r], s: SOL[r], o: Math.floor(m / 12) - 1 }; };

  /* ---- نشانگر ---- */
  (function ticks() {
    var g = $('tnTicks'), h = '';
    for (var c = -50; c <= 50; c += 10) {
      var a = c * 1.4 * Math.PI / 180, r1 = c === 0 || Math.abs(c) === 50 ? 94 : 99, r2 = 108, s = Math.sin(a), co = Math.cos(a);
      h += '<line class="tk' + (c === 0 ? ' m' : '') + '" x1="' + (150 + r1 * s).toFixed(1) + '" y1="' + (150 - r1 * co).toFixed(1) + '" x2="' + (150 + r2 * s).toFixed(1) + '" y2="' + (150 - r2 * co).toFixed(1) + '"/>';
    }
    g.innerHTML = h;
  })();

  /* ---- ساخت دکمهٔ سیم‌ها و فهرست کوک ---- */
  function fillTunings() {
    var s = $('tnTun'), h = ''; INST[inst].tun.forEach(function (t, i) { h += '<option value="' + i + '">' + t[0] + '</option>'; }); s.innerHTML = h; s.value = String(tun);
  }
  function buildStrings() {
    strings = INST[inst].tun[tun][1].slice(); var n = strings.length, half = Math.ceil(n / 2), L = '', R = '', i;
    var btn = function (i) { var q = noteName(strings[i]); return '<button type="button" class="tn-str" data-i="' + i + '" aria-label="سیم ' + q.n + '">' + q.n.replace('#', '♯') + '<small>' + q.s + '</small></button>'; };
    for (i = half - 1; i >= 0; i--) L += btn(i);
    for (i = half; i < n; i++) R += btn(i);
    $('tnL').innerHTML = L; $('tnR').innerHTML = R; target = -1; $('tnAuto').hidden = true; mark();
  }
  function mark(near) {
    var els = document.querySelectorAll('.tn-str');
    for (var i = 0; i < els.length; i++) { var k = +els[i].dataset.i; els[i].classList.toggle('sel', k === target); els[i].classList.toggle('near', near === k && target < 0); }
  }

  /* ---- صدای مرجع: سیم گیتار واقعی‌نما (Karplus-Strong + طنین بدنهٔ آکوستیک) ---- */
  var CACHE = {}, curSrc = null;
  function pluck(f, sr) {
    var key = Math.round(f * 100) + '@' + sr; if (CACHE[key]) return CACHE[key];
    var P = sr / f, d = P - 0.5, D = Math.floor(d - 0.5), fr = d - D, a = (1 - fr) / (1 + fr), i;
    var T60 = Math.max(1.5, 3.4 - f / 180), rho = Math.pow(10, -3 * P / (sr * T60));
    var buf = new Float32Array(D), seed = 12345, lp = 0, mean = 0;
    for (i = 0; i < D; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; var nz = seed / 2147483648 - 1; lp += 0.55 * (nz - lp); buf[i] = lp; }
    var pp = Math.max(1, Math.round(0.16 * D)); for (i = D - 1; i >= pp; i--) buf[i] -= buf[i - pp] * 0.9; /* محل زخمه */
    for (i = 0; i < D; i++) mean += buf[i]; mean /= D; var mx = 1e-6; for (i = 0; i < D; i++) { buf[i] -= mean; if (Math.abs(buf[i]) > mx) mx = Math.abs(buf[i]); } for (i = 0; i < D; i++) buf[i] /= mx;
    var len = Math.floor(sr * 3.4), out = new Float32Array(len), idx = 0, prev = 0, apx = 0, apy = 0, n, s, l, y, peak = 0;
    for (n = 0; n < len; n++) {
      s = buf[idx]; out[n] = s; l = 0.5 * s + 0.5 * prev; prev = s;
      y = a * l + apx - a * apy; apx = l; apy = y; buf[idx] = rho * y; if (++idx >= D) idx = 0;
    }
    if (f < 170) for (n = 0; n < len; n++) out[n] = Math.tanh(1.9 * out[n]); /* کمی هارمونیک برای بلندگوی ضعیف گوشی */
    for (n = 0; n < len; n++) { if (Math.abs(out[n]) > peak) peak = Math.abs(out[n]); }
    var fade = Math.floor(sr * 0.2); for (n = 0; n < len; n++) out[n] = out[n] / (peak || 1) * 0.85 * (n > len - fade ? (len - n) / fade : 1);
    return (CACHE[key] = out);
  }
  function ctx() { if (!ac) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ac = new C(); } if (ac.state === 'suspended') ac.resume(); return ac; }
  function playSynth(f) {
    var c = ctx(); if (!c) return; if (curSrc) { try { curSrc.stop(); } catch (e) {} }
    var data = pluck(f, c.sampleRate), b = c.createBuffer(1, data.length, c.sampleRate); b.getChannelData(0).set(data);
    var src = c.createBufferSource(); src.buffer = b; curSrc = src;
    var chain = src, add = function (type, fq, g, q) { var n = c.createBiquadFilter(); n.type = type; n.frequency.value = fq; if (g) n.gain.value = g; if (q) n.Q.value = q; chain.connect(n); chain = n; };
    add('peaking', 98, 5, 3.5); add('peaking', 205, 4, 3); add('peaking', 410, 2, 2); add('lowpass', 5200, 0, 0.7);
    var g = c.createGain(); g.gain.value = 0.95; chain.connect(g); g.connect(c.destination); src.start();
    mutedUntil = Date.now() + 3400;
  }

  /* ---- صدای واقعی ساز: نمونه‌های ضبط‌شده (Soundfont) — اول از خود سایت، بعد از CDN؛ اگر نشد صدای ساختگی ---- */
  var SND = {
    guitar: [['acoustic_guitar_steel', 'گیتار آکوستیک (فولاد)'], ['acoustic_guitar_nylon', 'گیتار کلاسیک (نایلون)'], ['electric_guitar_clean', 'گیتار الکتریک (کلین)']],
    bass: [['electric_bass_finger', 'باس الکتریک'], ['acoustic_bass', 'باس آکوستیک']],
    uke: [['acoustic_guitar_nylon', 'نایلون (شبیه اوکوله)']]
  };
  var SF_BASES = ['/assets/snd/', 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/'];
  var FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'], banks = {}, snd = 0;
  var noteKey = function (m) { return FLAT[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); };
  function fetchText(url) {
    var cs = window.caches && caches.open ? caches.open('sr-tuner-v1') : Promise.resolve(null);
    return cs.then(function (c) {
      return (c ? c.match(url) : Promise.resolve(null)).then(function (hit) {
        if (hit) return hit.text();
        return fetch(url).then(function (r) { if (!r.ok) throw new Error('http'); var cp = r.clone(); return r.text().then(function (t) { if (c && t.length > 20000) { try { c.put(url, cp); } catch (e) {} } return t; }); });
      });
    }).catch(function () { return fetch(url).then(function (r) { if (!r.ok) throw new Error('http'); return r.text(); }); });
  }
  function loadBank(name) {
    if (banks[name]) return banks[name].p;
    var bk = banks[name] = { notes: {}, buf: {} }, i = 0;
    bk.p = new Promise(function (ok, no) {
      (function next() {
        if (i >= SF_BASES.length) return no(new Error('none'));
        fetchText(SF_BASES[i++] + name + '-mp3.js').then(function (t) {
          var re = /"([A-G][b#]?\d)"\s*:\s*"data:audio\/[a-z0-9.+-]+;base64,([^"]+)"/g, m, n = 0;
          while ((m = re.exec(t))) { bk.notes[m[1]] = m[2]; n++; }
          if (n > 10) ok(bk); else next();
        }).catch(next);
      })();
    });
    bk.p.catch(function () { delete banks[name]; });
    return bk.p;
  }
  function decode(bk, key) {
    if (bk.buf[key]) return Promise.resolve(bk.buf[key]);
    var raw = atob(bk.notes[key]), u = new Uint8Array(raw.length), k; for (k = 0; k < raw.length; k++) u[k] = raw.charCodeAt(k);
    var c = ctx();
    return new Promise(function (ok, no) { var r = c.decodeAudioData(u.buffer, ok, no); if (r && r.then) r.then(ok, no); }).then(function (b) { return (bk.buf[key] = b); });
  }
  var playTok = 0;
  function play(f, m) {
    var tok = ++playTok, name = SND[inst][Math.min(snd, SND[inst].length - 1)][0], key = noteKey(m), c = ctx(); if (!c) return;
    if (curSrc) { try { curSrc.stop(); } catch (e) {} }
    var first = !banks[name] || !banks[name].notes[key]; if (first) msg('در حال دریافت صدای ساز (فقط بار اول)...');
    loadBank(name).then(function (bk) {
      if (!bk.notes[key]) throw new Error('nonote');
      return decode(bk, key);
    }).then(function (buf) {
      msg(''); if (tok !== playTok) return;
      var src = c.createBufferSource(); src.buffer = buf; src.playbackRate.value = A4 / 440; curSrc = src;
      var g = c.createGain(); g.gain.value = 1; src.connect(g); g.connect(c.destination); src.start(); mutedUntil = Date.now() + Math.min(3500, buf.duration * 1000);
    }).catch(function () { msg(''); if (tok === playTok) playSynth(f); });
  }

  /* ---- تشخیص زیر و بمی (NSDF / McLeod) ---- */
  function detect(raw, sr, fmin) {
    var n = raw.length >> 1, x = new Float32Array(n), i, rms = 0; sr = sr / 2;
    for (i = 0; i < n; i++) { x[i] = (raw[2 * i] + raw[2 * i + 1]) * 0.5; rms += x[i] * x[i]; }
    rms = Math.sqrt(rms / n); if (rms < 0.006) return null;
    var minLag = Math.floor(sr / 1400), maxLag = Math.min(Math.floor(sr / fmin), n >> 1), nsdf = new Float32Array(maxLag + 2), tau, j;
    for (tau = minLag - 1; tau <= maxLag + 1; tau++) {
      var acf = 0, m = 0, lim = n - tau; if (lim < 8) break;
      for (j = 0; j < lim; j++) { acf += x[j] * x[j + tau]; m += x[j] * x[j] + x[j + tau] * x[j + tau]; }
      nsdf[tau] = m > 0 ? 2 * acf / m : 0;
    }
    var peaks = [], pos = nsdf[minLag] > 0, cur = pos ? minLag : -1;
    for (tau = minLag + 1; tau <= maxLag; tau++) {
      if (!pos && nsdf[tau] > 0 && nsdf[tau - 1] <= 0) { pos = true; cur = tau; }
      if (pos) { if (nsdf[tau] > nsdf[cur]) cur = tau; if (nsdf[tau] <= 0) { peaks.push(cur); pos = false; } }
    }
    if (pos && cur > 0) peaks.push(cur);
    if (!peaks.length) return null;
    var mx = 0; peaks.forEach(function (p) { if (nsdf[p] > mx) mx = nsdf[p]; });
    if (mx < 0.55) return null;
    var pk = peaks.filter(function (p) { return nsdf[p] >= 0.9 * mx; })[0];
    if (pk <= minLag || pk >= maxLag) return null;
    var a = nsdf[pk - 1], b = nsdf[pk], c = nsdf[pk + 1], d = a - 2 * b + c, sh = d !== 0 ? (a - c) / (2 * d) : 0;
    return sr / (pk + sh);
  }

  /* ---- نمایش ---- */
  var needle = $('tnNeedle');
  function show(f) {
    var q, tm, cents;
    if (target >= 0) { tm = strings[target]; cents = 100 * (midiOf(f) - tm); cents = ((cents + 600) % 1200 + 1200) % 1200 - 600; }
    else {
      var m = midiOf(f), best = 0, bd = 1e9, k; for (k = 0; k < strings.length; k++) { var dist = Math.abs(m - strings[k]); if (dist < bd) { bd = dist; best = k; } }
      tm = strings[best]; cents = 100 * (m - tm); cents = ((cents + 600) % 1200 + 1200) % 1200 - 600; mark(best);
    }
    q = noteName(tm);
    $('tnNote').textContent = q.n.replace('#', '♯'); $('tnOct').textContent = q.o; $('tnSol').textContent = q.s;
    $('tnHz').textContent = f.toFixed(1) + ' هرتز'; $('tnCt').textContent = (cents > 0 ? '+' : '') + cents.toFixed(0) + ' سنت';
    var cl = Math.max(-50, Math.min(50, cents)); needle.style.transform = 'rotate(' + (cl * 1.4).toFixed(1) + 'deg)';
    var ok = Math.abs(cents) <= 5, st = $('tnSt');
    needle.setAttribute('class', 'tn-needle on' + (ok ? ' ok' : '')); st.className = 'tn-st ' + (ok ? 'ok' : cents < 0 ? 'lo' : 'hi');
    st.textContent = ok ? 'کوک است ✓' : cents < 0 ? 'پایین است ♭ — سیم را سفت‌تر کن' : 'بالا است ♯ — سیم را شل‌تر کن';
  }
  function idle() {
    needle.style.transform = 'rotate(0deg)'; needle.setAttribute('class', 'tn-needle'); $('tnSt').className = 'tn-st'; $('tnSt').textContent = running ? 'یک سیم را بنواز...' : 'میکروفون خاموش است';
    $('tnCt').textContent = '— سنت'; $('tnHz').textContent = '— هرتز'; mark();
  }
  function tick() {
    if (!an || Date.now() < mutedUntil) return;
    an.getFloatTimeDomainData(buf);
    var f = detect(buf, ac.sampleRate, INST[inst].fmin);
    if (f) { hist.push(f); if (hist.length > 5) hist.shift(); var s = hist.slice().sort(function (a, b) { return a - b; }); show(s[s.length >> 1]); lastGood = Date.now(); }
    else if (Date.now() - lastGood > 900) { hist = []; idle(); }
  }

  /* ---- میکروفون ---- */
  function msg(t) { $('tnMsg').textContent = t || ''; }
  function start() {
    if (running) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg('مرورگر شما از میکروفون پشتیبانی نمی‌کند. می‌توانی از صدای مرجع هر سیم استفاده کنی.'); return; }
    var c = ctx(); if (!c) { msg('مرورگر شما از پردازش صدا پشتیبانی نمی‌کند.'); return; }
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (s) {
      stream = s; var src = c.createMediaStreamSource(s); an = c.createAnalyser(); an.fftSize = INST[inst].fft; buf = new Float32Array(an.fftSize); src.connect(an);
      running = true; hist = []; lastGood = Date.now(); timer = setInterval(tick, 70); $('tnMic').textContent = '⏹ خاموش‌کردن میکروفون'; msg(''); idle();
    }).catch(function () { msg('دسترسی به میکروفون داده نشد. در تنظیمات مرورگر، اجازهٔ میکروفون را برای این سایت فعال کن.'); });
  }
  function stop() {
    if (timer) clearInterval(timer); timer = 0; if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; an = null; running = false;
    $('tnMic').textContent = '🎤 روشن‌کردن میکروفون'; idle();
  }

  /* ---- رویدادها ---- */
  $('tnMic').onclick = function () { running ? stop() : start(); };
  $('tnAuto').onclick = function () { target = -1; this.hidden = true; mark(); };
  $('tnHead').addEventListener('click', function (e) {
    var b = e.target.closest('.tn-str'); if (!b) return; var i = +b.dataset.i; target = i; $('tnAuto').hidden = false; mark(); play(hz(strings[i]), strings[i]); hist = [];
  });
  $('tnInst').onchange = function () { inst = this.value; tun = 0; fillTunings(); fillSnd(); buildStrings(); if (running) { stop(); start(); } };
  function fillSnd() { var h = '', l = SND[inst]; l.forEach(function (x, i) { h += '<option value="' + i + '">' + x[1] + '</option>'; }); $('tnSnd').innerHTML = h; snd = 0; }
  $('tnSnd').onchange = function () { snd = +this.value; };
  $('tnTun').onchange = function () { tun = +this.value; buildStrings(); };
  function setA(v) { A4 = Math.max(415, Math.min(466, v)); $('tnA').textContent = A4; }
  $('tnM').onclick = function () { setA(A4 - 1); }; $('tnP').onclick = function () { setA(A4 + 1); };
  document.addEventListener('visibilitychange', function () { if (document.hidden && running) stop(); });

  fillTunings(); fillSnd(); buildStrings(); idle();
  window.__tn = { pluck: pluck, detect: detect, play: play };

  /* بنر کوچک (از تنظیمات سایت: «بنر تیونر» در ساز صفحهٔ اصلی) */
  (window.SRReady || function (f) { f(); })(function () {
    try { var el = $('tnAd'), c = window.SR_CFG && window.SR_CFG.tunerBanner; if (el && c && window.SRR && SRR.miniBanner) el.innerHTML = SRR.miniBanner(c); } catch (e) {}
  });
})();
