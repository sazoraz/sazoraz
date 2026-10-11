/* ساز و راز — account.js | ورود، ثبت‌نام، بازیابی با کد شخصی */
(function () {
  'use strict';
  function q(s, r) { return (r || document).querySelector(s); }
  function nextUrl() {
    var n = new URLSearchParams(location.search).get('next') || '';
    return (/^\/[^\/\\]/.test(n)) ? n : '/account/panel/';
  }
  function go() { location.replace(nextUrl()); }
  function post(path, body) {
    if (!window.SR.api) return Promise.reject(new Error('آدرس سرور در تنظیمات سایت ثبت نشده است.'));
    return fetch(window.SR.api + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .catch(function () { throw new Error('ارتباط با سرور برقرار نشد. اینترنت را بررسی کنید.'); })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw new Error(d.error || 'خطایی رخ داد؛ دوباره تلاش کنید.'); return d; }); });
  }
  function msg(t, kind) { var m = q('#msg'); m.textContent = t || ''; m.className = 'note-msg' + (t ? ' show ' + (kind || 'err') : ''); }
  function showCode(code, done) {
    var o = document.createElement('div'); o.className = 'modal'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    o.innerHTML = '<div class="box"><h2>کد بازیابی شما</h2><p>این کد فقط همین یک‌بار نمایش داده می‌شود. اگر رمز عبورتان را فراموش کنید، فقط با همین کد می‌توانید دوباره وارد شوید. آن را کپی کنید و جای امنی نگه دارید.</p><div class="code" id="rc"></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-w" type="button" id="cp">کپی کد</button></div><label style="display:flex;gap:8px;align-items:center;margin:14px 0;font-weight:700"><input type="checkbox" id="ok"> کد را ذخیره کردم</label><button class="btn" type="button" id="go" disabled>ادامه</button></div>';
    document.body.appendChild(o); q('#rc', o).textContent = code;
    q('#cp', o).onclick = function () {
      var b = this, ok = function () { b.textContent = 'کپی شد ✓'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(ok, function () { sel(); }); else sel();
      function sel() { var r = document.createRange(); r.selectNodeContents(q('#rc', o)); var s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'کد انتخاب شد؛ کپی کنید'; }
    };
    q('#ok', o).onchange = function () { q('#go', o).disabled = !this.checked; };
    q('#go', o).onclick = done; q('#cp', o).focus();
  }
  function finish(d) {
    window.SR.login({ token: d.token, username: d.username, name: d.name });
    if (d.recovery_code) showCode(d.recovery_code, go); else go();
  }
  /* ورود با گوگل — فقط وقتی /data/google.json شناسهٔ کلاینت داشته باشد نمایش داده می‌شود */
  function google() {
    fetch('/data/google.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (c) {
      var id = c && c.clientId; if (!id || !window.SR.api) return;
      var box = document.createElement('div'); box.style.cssText = 'margin-top:18px;display:grid;justify-items:center;gap:8px'; box.innerHTML = '<small class="muted">یا</small><div id="gbtn"></div>';
      q('#f-login').parentNode.appendChild(box);
      var sc = document.createElement('script'); sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true;
      sc.onload = function () {
        window.google.accounts.id.initialize({ client_id: id, callback: function (r) { msg(''); post('/api/google', { credential: r.credential }).then(finish, function (e) { msg(e.message); }); } });
        window.google.accounts.id.renderButton(q('#gbtn'), { theme: 'filled_black', size: 'large', text: 'continue_with', locale: 'fa' });
      };
      sc.onerror = function () { box.remove(); };
      document.head.appendChild(sc);
    });
  }
  function init() {
    if (window.SR.session()) return go();
    var tabs = document.querySelectorAll('.tabs2 button'), forms = document.querySelectorAll('form.fm');
    function show(t) {
      msg('');
      tabs.forEach(function (b) { b.setAttribute('aria-selected', b.dataset.t === t ? 'true' : 'false'); });
      forms.forEach(function (f) { f.hidden = f.dataset.t !== t; });
    }
    tabs.forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.t); }); });
    var mode = new URLSearchParams(location.search).get('mode'); if (mode === 'register' || mode === 'recover') show(mode);
    function bind(id, path, pick) {
      var f = q('#' + id);
      f.addEventListener('submit', function (e) {
        e.preventDefault(); var btn = q('button[type=submit]', f), old = btn.textContent; btn.disabled = true; btn.textContent = 'کمی صبر کنید...'; msg('');
        var fd = new FormData(f), body = {}; fd.forEach(function (v, k) { body[k] = String(v); });
        post(path, pick ? pick(body) : body).then(finish, function (er) { msg(er.message); }).then(function () { btn.disabled = false; btn.textContent = old; });
      });
    }
    google();
    bind('f-login', '/api/login'); bind('f-register', '/api/register'); bind('f-recover', '/api/recover', function (b) { return { username: b.id, code: b.code, password: b.password }; });
  }
  window.SRReady(init);
})();
