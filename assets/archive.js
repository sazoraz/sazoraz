/* ساز و راز — archive.js | فهرست مطالب هر دسته از /data/posts.json */
(function () {
  'use strict';
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function init() {
    var cat = document.body.dataset.cat, box = document.getElementById('list'), more = document.getElementById('more'), shown = 0, all = [], N = 12;
    function draw() {
      all.slice(shown, shown + N).forEach(function (p) {
        var a = el('article', 'card'), t = el('div', 'thumb'), cb = el('div', 'card-b'), h = el('h3'), l = el('a', 'stretch', p.title);
        if (p.img) { var im = el('img'); im.src = p.img; im.alt = p.title; im.loading = 'lazy'; t.appendChild(im); } else t.appendChild(el('div', 'ph'));
        if (p.tag) t.appendChild(el('span', 'chip', p.tag)); if (p.meta) t.appendChild(el('span', 'meta', p.meta));
        l.href = /^\//.test(p.href || '') ? p.href : '#'; h.appendChild(l); cb.appendChild(h); if (p.desc) cb.appendChild(el('p', null, p.desc));
        a.appendChild(t); a.appendChild(cb); a.appendChild(el('span', 'cta', 'مشاهده')); box.appendChild(a);
      });
      shown += N; more.hidden = shown >= all.length;
    }
    fetch('/data/posts.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : { posts: [] }; }).catch(function () { return { posts: [] }; }).then(function (d) {
      all = (d.posts || []).filter(function (p) { return p.cat === cat; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
      var st = parseInt(box.dataset.static || '0', 10);
      if (st) { shown = st; more.hidden = shown >= all.length; more.onclick = draw; return; }
      box.textContent = ''; if (!all.length) { box.appendChild(el('div', 'box', 'هنوز مطلبی در این بخش منتشر نشده است.')); return; }
      draw(); more.onclick = draw;
    });
  }
  window.SRReady(init);
})();
