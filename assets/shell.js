/* ساز و راز — shell.js | هدر و فوتر مشترک را روی صفحه‌های داخلی (حساب، پنل، فروشگاه) سوار می‌کند.
   تنظیمات از /data/site.config.json خوانده می‌شود (همان که سازنده منتشر می‌کند)، پس منو و فوتر همیشه هماهنگ‌اند. */
(function () {
  'use strict';
  var R = window.SRR, D = R.DEFAULTS, me = document.currentScript, active = (me && me.dataset.active) || '';
  function merge(a, b) {
    if (Array.isArray(b)) return b;
    if (b && typeof b === 'object' && a && typeof a === 'object' && !Array.isArray(a)) {
      var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = (k in a) ? merge(a[k], b[k]) : b[k]; return o;
    }
    return b === undefined ? a : b;
  }
  window.SRReady = function (f) { if (window.__srr) f(); else (window._srq = window._srq || []).push(f); };
  function ready() { window.__srr = 1; (window._srq || []).forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); window._srq = []; }
  function go(cfg) {
    var s = merge(D, cfg || {}); s.site.api = s.site.api || D.site.api; window.SR_CFG = s;
    var st = document.getElementById('cfg'); if (st) st.textContent = R.cssVars(s);
    var fl = R.fontLink(s); if (fl) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = fl; document.head.appendChild(l); }
    var m = document.createElement('meta'); m.name = 'sr-api'; m.content = s.site.api; document.head.appendChild(m);
    if (s.ui.dots) document.body.classList.add('dots');
    var h = document.getElementById('hdr'), f = document.getElementById('ftr');
    if (h) h.outerHTML = R.header(s, active);
    if (f) f.outerHTML = R.footer(s);
    var c = document.createElement('script'); c.src = '/assets/core.js'; c.onload = ready; c.onerror = ready; document.body.appendChild(c);
  }
  fetch('/data/site.config.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(go);
})();
