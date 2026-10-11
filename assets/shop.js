/* ساز و راز — shop.js | محصولات، سبد خرید و ثبت سفارش کارت‌به‌کارت با آپلود فیش */
(function () {
  'use strict';
  var SR, prods = [], cart = [], info = {};
  function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
  function money(n) { return Number(n || 0).toLocaleString('fa-IR') + ' تومان'; }
  function load() { try { var a = JSON.parse(localStorage.getItem('sr_cart') || '[]'); return Array.isArray(a) ? a.filter(function (x) { return typeof x === 'string'; }).slice(0, 20) : []; } catch (e) { return []; } }
  function save() { try { localStorage.setItem('sr_cart', JSON.stringify(cart)); } catch (e) {} }
  function shrink(file) {
    return new Promise(function (res) {
      if (file.size < 1.5 * 1024 * 1024) return res(file);
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var r = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { URL.revokeObjectURL(u); res(b && b.size < file.size ? b : file); }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(u); res(file); }; img.src = u;
    });
  }
  function drawProducts() {
    var box = document.getElementById('prods'); box.textContent = '';
    if (!prods.length) { var e = el('div', 'box', 'هنوز محصولی منتشر نشده است. به‌زودی اضافه می‌شود.'); box.appendChild(e); return; }
    prods.forEach(function (p) {
      var c = el('article', 'prod'), has = cart.indexOf(p.id) >= 0;
      c.appendChild(el('h3', null, p.title));
      if (p.days) c.appendChild(el('span', 'st approved', '⭐ شامل ' + p.days.toLocaleString('fa-IR') + ' روز پرمیوم'));
      c.appendChild(el('div', 'price', money(p.price)));
      var b = el('button', 'btn' + (has ? ' btn-dark' : ''), has ? 'حذف از سبد' : 'افزودن به سبد'); b.type = 'button';
      b.onclick = function () { var i = cart.indexOf(p.id); if (i >= 0) cart.splice(i, 1); else cart.push(p.id); save(); drawProducts(); drawCart(); };
      c.appendChild(b); box.appendChild(c);
    });
  }
  function note(t, kind) { var m = document.getElementById('omsg'); if (!m) return; m.textContent = t || ''; m.className = 'note-msg' + (t ? ' show ' + (kind || 'err') : ''); }
  function drawCart() {
    var box = document.getElementById('cart'); box.textContent = '';
    cart = cart.filter(function (id) { return prods.some(function (p) { return p.id === id; }); });
    if (!cart.length) { box.appendChild(el('p', 'muted', 'سبد خرید خالی است.')); return; }
    var total = 0, l = el('div', 'list');
    cart.forEach(function (id) { var p = prods.filter(function (x) { return x.id === id; })[0]; total += p.price; var r = el('div', 'li'); r.appendChild(el('span', null, p.title)); r.appendChild(el('b', null, money(p.price))); l.appendChild(r); });
    box.appendChild(l); var t = el('div', 'total'); t.appendChild(el('span', null, 'جمع کل')); t.appendChild(el('b', null, money(total))); box.appendChild(t);
    if (!SR.session()) {
      box.appendChild(el('p', 'muted', 'برای پرداخت ابتدا وارد حساب خود شوید.'));
      var a = el('a', 'btn', 'ورود / ثبت‌نام'); a.href = '/account/?next=/shop/'; box.appendChild(a); return;
    }
    var ci = el('div', 'cardinfo'); ci.appendChild(el('div', 'muted', 'مبلغ را به این کارت واریز کنید:'));
    var num = el('div', 'code', info.card || 'شمارهٔ کارت ثبت نشده'); ci.appendChild(num);
    ci.appendChild(el('div', null, [info.owner, info.bank].filter(Boolean).join(' — ')));
    if (info.card) { var cp = el('button', 'btn btn-w', 'کپی شمارهٔ کارت'); cp.type = 'button'; cp.onclick = function () { var d = info.card.replace(/[^\d]/g, ''); (navigator.clipboard ? navigator.clipboard.writeText(d) : Promise.reject()).then(function () { cp.textContent = 'کپی شد ✓'; }, function () { cp.textContent = 'کپی نشد؛ دستی کپی کنید'; }); }; ci.appendChild(cp); }
    if (info.note) ci.appendChild(el('small', 'muted', info.note));
    box.appendChild(ci);
    var f = el('form', 'fm'); f.innerHTML = '<label>تصویر فیش واریزی<input type="file" name="receipt" accept="image/*" required></label><label>توضیح (اختیاری)<textarea name="note" rows="2" maxlength="300"></textarea></label><div id="omsg" class="note-msg" role="status" aria-live="polite"></div><button class="btn" type="submit">ارسال فیش و ثبت سفارش</button>';
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var btn = f.querySelector('button[type=submit]'), file = f.elements.receipt.files[0]; if (!file) return;
      btn.disabled = true; btn.textContent = 'در حال ارسال...'; note('');
      shrink(file).then(function (blob) {
        var d = new FormData(); d.append('items', cart.join(',')); d.append('note', f.elements.note.value); d.append('receipt', blob, 'receipt.jpg');
        return SR.fetch('/api/orders', { method: 'POST', body: d });
      }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw new Error(d.error || 'ثبت سفارش ناموفق بود.'); return d; }); })
        .then(function (d) { cart = []; save(); drawProducts(); box.textContent = ''; var ok = el('div', 'note-msg show ok', 'فیش شما ارسال شد (سفارش #' + d.order + '). پس از تأیید مدیر، دسترسی شما فعال می‌شود و در پنل کاربری پیام می‌بینید.'); box.appendChild(ok); var a = el('a', 'btn', 'رفتن به پنل کاربری'); a.href = '/account/panel/'; box.appendChild(a); },
          function (er) { note(er.message || 'ارتباط با سرور برقرار نشد.'); btn.disabled = false; btn.textContent = 'ارسال فیش و ثبت سفارش'; });
    });
    box.appendChild(f);
  }
  function init() {
    SR = window.SR; cart = load();
    var P = SR.api ? fetch(SR.api + '/api/products').then(function (r) { return r.json(); }).then(function (d) { return d.products || []; }).catch(function () { return []; }) : Promise.resolve([]);
    var I = fetch('/data/shop.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
    Promise.all([P, I]).then(function (a) { prods = a[0]; info = a[1] || {}; drawProducts(); drawCart(); });
  }
  window.SRReady(init);
})();
