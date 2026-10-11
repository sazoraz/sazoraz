/* ساز و راز — post.js | نظرات (فقط کاربران واردشده)، مطالب مرتبط، نوار پیشرفت و اشتراک‌گذاری */
(function () {
  'use strict';
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var SR = window.SR || {}, API = SR.api || '';
  function fd(ts) { return ts ? new Date(ts).toLocaleDateString('fa-IR') : ''; }

  /* نوار پیشرفت خواندن */
  var bar = document.getElementById('pbar'), art = document.querySelector('.prose');
  if (bar && art) addEventListener('scroll', function () { var r = art.getBoundingClientRect(), h = r.height - innerHeight * .5; bar.style.width = Math.max(0, Math.min(100, (-r.top + innerHeight * .3) / h * 100)) + '%'; }, { passive: true });

  /* اشتراک‌گذاری */
  var sh = document.querySelector('[data-share]');
  if (sh) sh.onclick = function () {
    var d = { title: document.title, url: location.href.split('#')[0] };
    if (navigator.share) navigator.share(d).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(d.url).then(function () { sh.textContent = 'لینک کپی شد ✓'; });
  };

  /* مطالب مرتبط (خودکار از posts.json اگر دستی تعیین نشده) */
  var rel = document.querySelector('.related');
  if (rel && rel.dataset.manual !== '1') {
    fetch('/data/posts.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.posts) return;
      var list = d.posts.filter(function (p) { return p.cat === rel.dataset.cat && !new RegExp('/' + rel.dataset.slug + '/?$').test(p.href); }).slice(0, 3);
      if (!list.length) return;
      var g = rel.querySelector('.grid');
      list.forEach(function (p) {
        var a = el('article', 'card'), t = el('div', 'thumb'), cb = el('div', 'card-b'), h = el('h3'), l = el('a', 'stretch', p.title);
        if (p.img) { var im = el('img'); im.src = p.img; im.alt = p.title; im.loading = 'lazy'; t.appendChild(im); } else t.appendChild(el('div', 'ph'));
        l.href = p.href; h.appendChild(l); cb.appendChild(h); if (p.desc) cb.appendChild(el('p', null, p.desc));
        a.appendChild(t); a.appendChild(cb); a.appendChild(el('span', 'cta', 'مشاهده')); g.appendChild(a);
      });
      rel.hidden = false;
    }).catch(function () {});
  }

  /* نظرات */
  var box = document.getElementById('comments'); if (!box) return;
  var post = box.dataset.post, list = document.getElementById('cm-list'), form = document.getElementById('cm-form');
  function load() {
    if (!API) { list.textContent = ''; list.appendChild(el('div', 'muted', 'بخش نظرات هنوز فعال نشده است.')); return; }
    fetch(API + '/api/comments?post=' + encodeURIComponent(post)).then(function (r) { return r.json(); }).then(function (d) {
      list.textContent = ''; var c = d.comments || [];
      if (!c.length) list.appendChild(el('div', 'muted', 'هنوز نظری ثبت نشده است. اولین نفر باشید!'));
      c.forEach(function (x) { var r = el('div', 'li'), b = el('div'); b.appendChild(el('b', null, x.name)); b.appendChild(el('small', 'muted', ' · ' + fd(x.created))); b.appendChild(el('p', null, x.text)); r.appendChild(b); list.appendChild(r); });
    }).catch(function () { list.textContent = 'بارگذاری نظرات ناموفق بود.'; });
  }
  function draw() {
    form.textContent = '';
    if (!(window.SR && SR.session())) {
      var a = el('a', 'btn', 'برای ثبت نظر وارد شوید'); a.href = '/account/?next=' + encodeURIComponent(location.pathname + '#comments'); form.appendChild(a); return;
    }
    var f = el('form', 'fm'); f.innerHTML = '<label>نظر شما<textarea name="text" rows="3" maxlength="1000" required></textarea></label><div class="note-msg" role="status" aria-live="polite"></div><button class="btn" type="submit">ارسال نظر</button><small>نظر شما پس از تأیید مدیر نمایش داده می‌شود.</small>';
    var m = f.querySelector('.note-msg'), btn = f.querySelector('button');
    f.addEventListener('submit', function (e) {
      e.preventDefault(); btn.disabled = true; m.className = 'note-msg';
      SR.fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post: post, text: f.elements.text.value }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (r.status === 401) { SR.logout(); draw(); throw new Error('نشست شما منقضی شده؛ دوباره وارد شوید.'); } if (!r.ok) throw new Error(d.error || 'ارسال ناموفق بود.'); return d; }); })
        .then(function () { f.reset(); m.textContent = 'نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود.'; m.className = 'note-msg show ok'; }, function (er) { m.textContent = er.message || 'ارتباط با سرور برقرار نشد.'; m.className = 'note-msg show err'; })
        .then(function () { btn.disabled = false; });
    });
    form.appendChild(f);
  }
  load(); draw();
})();
