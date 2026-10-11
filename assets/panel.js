/* ساز و راز — panel.js | پنل کاربری: پروفایل، پیام‌ها، دسترسی‌ها، سفارش‌ها */
(function () {
  'use strict';
  var SR, app;
  function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
  function fd(ts) { return ts ? new Date(ts).toLocaleDateString('fa-IR') : '—'; }
  function money(n) { return Number(n || 0).toLocaleString('fa-IR') + ' تومان'; }
  function api(path, opt) { return SR.fetch(path, opt).then(function (r) { if (r.status === 401) { SR.logout(); location.replace('/account/?next=/account/panel/'); throw new Error('401'); } return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || 'خطا'); return d; }); }); }
  function box(title) { var b = el('section', 'box'), h = el('h2', null, title); b.appendChild(h); return b; }
  var ST = { pending: 'در انتظار تأیید', approved: 'تأیید شد', rejected: 'رد شد' };

  function render(me, msgs, acc, ords, prods) {
    app.textContent = '';
    var title = {}; prods.forEach(function (p) { title[p.id] = p.title; });

    var b1 = el('section', 'box');
    var top = el('div', 'li'); var l = el('div'); l.appendChild(el('b', null, me.name)); l.appendChild(el('div', 'muted', '@' + me.username + (me.email ? ' · ' + me.email : '')));
    top.appendChild(l);
    top.appendChild(el('span', 'st ' + (me.premium ? 'approved' : 'pending'), me.premium ? '⭐ پرمیوم تا ' + fd(me.premium_until) : 'حساب عادی'));
    b1.appendChild(top);
    var act = el('div', 'acts'); var shop = el('a', 'btn', 'رفتن به فروشگاه'); shop.href = '/shop/'; act.appendChild(shop);
    var out = el('button', 'btn btn-dark', 'خروج از حساب'); out.type = 'button';
    out.onclick = function () { SR.fetch('/api/logout', { method: 'POST' }).catch(function () {}).then(function () { SR.logout(); location.replace('/'); }); };
    act.appendChild(out); b1.appendChild(act); app.appendChild(b1);

    var b2 = box('پیام‌ها' + (me.unread ? ' (' + me.unread.toLocaleString('fa-IR') + ' جدید)' : '')), lst = el('div', 'list');
    if (!msgs.length) lst.appendChild(el('div', 'muted', 'پیامی ندارید.'));
    msgs.forEach(function (m) { var r = el('div', 'li' + (m.read ? '' : ' unread')); var c = el('div'); c.appendChild(el('div', null, m.body)); c.appendChild(el('small', 'muted', (m.broadcast ? 'اعلان عمومی · ' : 'پیام مدیر · ') + fd(m.created))); r.appendChild(c); lst.appendChild(r); });
    b2.appendChild(lst); app.appendChild(b2);

    var b3 = box('محصولات و دسترسی‌های من'), l3 = el('div', 'list');
    if (!acc.items.length) l3.appendChild(el('div', 'muted', 'هنوز محصولی فعال نشده است.'));
    acc.items.forEach(function (p) {
      var r = el('div', 'li'); r.appendChild(el('b', null, p.title));
      if (p.link && /^https:\/\//.test(p.link)) { var a = el('a', 'btn', 'باز کردن'); a.href = p.link; a.target = '_blank'; a.rel = 'noopener noreferrer'; r.appendChild(a); }
      l3.appendChild(r);
    });
    b3.appendChild(l3); app.appendChild(b3);

    var b4 = box('سفارش‌های من'), l4 = el('div', 'list');
    if (!ords.length) l4.appendChild(el('div', 'muted', 'سفارشی ثبت نشده است.'));
    ords.forEach(function (o) {
      var r = el('div', 'li'), c = el('div');
      c.appendChild(el('b', null, 'سفارش #' + o.id)); c.appendChild(el('div', 'muted', o.items.split(',').map(function (i) { return title[i] || i; }).join('، ')));
      c.appendChild(el('small', 'muted', money(o.amount) + ' · ' + fd(o.created)));
      r.appendChild(c); r.appendChild(el('span', 'st ' + o.status, ST[o.status] || o.status)); l4.appendChild(r);
    });
    b4.appendChild(l4); app.appendChild(b4);

    var b5 = box('کد بازیابی'); b5.appendChild(el('p', 'muted', 'کد بازیابی شما فقط هنگام ثبت‌نام (یا بعد از هر بازیابی) نمایش داده می‌شود و برای امنیت، رمزشده نگهداری می‌شود؛ بنابراین قابل نمایش دوباره نیست.')); app.appendChild(b5);
    if (me.unread) api('/api/messages/read', { method: 'POST' }).catch(function () {});
  }

  function init() {
    SR = window.SR; app = document.getElementById('app');
    if (!SR.session()) return location.replace('/account/?next=/account/panel/');
    if (!SR.api) { app.textContent = 'آدرس سرور در تنظیمات سایت ثبت نشده است.'; return; }
    var P = fetch(SR.api + '/api/products').then(function (r) { return r.json(); }).then(function (d) { return d.products || []; }).catch(function () { return []; });
    Promise.all([api('/api/me'), api('/api/messages'), api('/api/access'), api('/api/orders'), P]).then(function (a) {
      render(a[0], a[1].messages, a[2], a[3].orders, a[4]);
    }).catch(function (e) { if (e.message !== '401') { app.textContent = ''; var b = el('div', 'box'); b.appendChild(el('p', null, 'بارگذاری پنل ناموفق بود: ' + e.message)); app.appendChild(b); } });
  }
  window.SRReady(init);
})();
