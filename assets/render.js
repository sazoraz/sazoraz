/* ساز و راز — render.js | موتور رندر مشترک (هم در مرورگر/صفحه‌ساز، هم در Node) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SRR = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  var ICONS = {
    music: 'M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z',
    search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
    user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
    menu: 'M3 6h18M3 12h18M3 18h18',
    close: 'M18 6L6 18M6 6l12 12',
    play: 'M6 4l14 8-14 8z',
    download: 'M12 3v12m0 0l-4-4m4 4l4-4M4 21h16',
    arrow: 'M19 12H5m0 0l6-6m-6 6l6 6',
    bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
    eq: 'M4 20V10M9 20V4M14 20v-8M19 20V7',
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h8',
    headphones: 'M3 18v-6a9 9 0 0118 0v6M3 18a2 2 0 002 2h1v-6H5a2 2 0 00-2 2zM21 18a2 2 0 01-2 2h-1v-6h1a2 2 0 012 2z',
    cart: 'M6 6h15l-2 9H8zM6 6L5 3H2M9 20a1 1 0 100-2 1 1 0 000 2zM18 20a1 1 0 100-2 1 1 0 000 2z',
    mega: 'M3 11v2a1 1 0 001 1h3l5 4V6L7 10H4a1 1 0 00-1 1zM16 8a5 5 0 010 8',
    sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
    forum: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
    star: 'M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z'
  };
  var ICON_NAMES = Object.keys(ICONS);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ic(n, c) { return '<svg class="ic' + (c ? ' ' + c : '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (ICONS[n] || ICONS.music) + '"/></svg>'; }
  function href(u) { u = String(u || '').trim(); return /^(javascript|data|vbscript):/i.test(u) ? '#' : (u || '#'); }

  var DEFAULTS = {
    site: {
      name: 'ساز و راز', tagline: 'استودیو ملودی و هارمونی', badge: 'PRO',
      url: 'https://example.com', title: 'ساز و راز | آهنگسازی، میکس و مسترینگ، آکورد و نت',
      desc: 'مرجع فارسی آهنگسازی و تنظیم، میکس و مسترینگ، آکوردهای مدرن و نت‌های پیانو و گیتار با دانلود رایگان.',
      ogImage: '', favicon: '/assets/favicon.svg', api: ''
    },
    fonts: { heading: 'Vazirmatn', body: 'Vazirmatn', customCss: '' },
    themes: { compose: '#ffd166', mix: '#70d6bc', chords: '#9d8df1', sheets: '#ff70a6', extra: '#ff9770' },
    ui: { bg: '#0e1118', card: '#1b202c', text: '#f4f3f7', muted: '#a9b0c0', radius: 16, shadow: 5, shadowColor: '#000000', dots: true },
    menu: [
      { label: 'آهنگسازی', href: '/compose/', theme: 'compose' },
      { label: 'میکس و مسترینگ', href: '/mixing/', theme: 'mix' },
      { label: 'آکوردها', href: '/chords/', theme: 'chords' },
      { label: 'نت‌ها', href: '/sheets/', theme: 'sheets' },
      { label: 'فروشگاه', href: '/shop/', theme: 'extra' }
    ],
    hero: {
      eyebrow: 'مرجع فارسی خلاقیت موسیقی',
      title1: 'جهان بیت، آکورد و صدا', title2: 'به سبک نئوممفیس!',
      text: 'نت‌های فاخر، آکوردهای مدرن، تنظیم مستقل در استودیو خانگی و مسترکلاس‌های عملی میکس و مسترینگ؛ همه در یک‌جا و به زبان فارسی.',
      btn1: 'کاوش پرطرفدارها', btn1Href: '#compose', btn2: 'ورود به فروشگاه', btn2Href: '/shop/',
      deckTitle: 'تلفیق ماهور و نئوسول', deckSub: 'سمپل‌پک اختصاصی استودیو', deckBadge: 'موتور صوتی v۴'
    },
    sections: [
      {
        id: 'compose', theme: 'compose', icon: 'headphones', title: 'آهنگسازی، تنظیم و ریتم‌سازی', badge: 'DAW Lab',
        sub: 'پروژه‌های قابل ویرایش و دوره‌های تخصصی ریتم', viewAll: 'مشاهده همه', href: '/compose/', auto: 'compose', short: 'آهنگسازی', shortSub: 'پروژه‌های باز',
        cards: [
          { title: 'اصول چیدمان ریتم درامز در سبک ترپ و هیپ‌هاپ مدرن', desc: 'بررسی توزیع فرکانسی های‌هت و کیک ۸۰۸ به همراه فایل لایه‌باز پروژه.', tag: 'پروژه ابلتون', meta: '۶ دقیقه مطالعه', cta: 'دانلود پروژه', href: '#', img: '' },
          { title: 'تکنیک‌های تنظیم هارمونی پیانو در پاپ ایرانی', desc: 'وویسینگ کروماتیک و پیوندهای خط باس در قطعات ماندگار معاصر.', tag: 'مسترکلاس ویدیویی', meta: '۱۴ دقیقه', cta: 'شروع آموزش', href: '#', img: '' },
          { title: 'معرفی ۵ سینتی‌سایزر برتر رایگان برای سبک رترو', desc: 'پریست‌های درخشان آنالوگ برای فضاسازی‌های دهه هشتادی.', tag: 'پلاگین و پریست', meta: '۵ دقیقه', cta: 'دریافت لیست', href: '#', img: '' }
        ]
      },
      {
        id: 'mixing', theme: 'mix', icon: 'eq', title: 'میکس و مسترینگ', badge: 'Sound Eng',
        sub: 'مهندسی صدا، اکولایزر و کمپرسور', viewAll: 'کتابخانه ترفندها', href: '/mixing/', auto: 'mixing', short: 'میکس و مستر', shortSub: 'زنجیره پلاگین‌ها',
        cards: [
          { title: 'کنترل فرکانس‌های بم با کمپرسور چندبانده', desc: 'حل تداخل ساب‌بیس و کیک با داکینگ داینامیک.', tag: 'کمپرسور چندبانده', meta: '۲۰ تا ۲۵۰ هرتز', cta: 'مشاهده ترفند', href: '#', img: '' },
          { title: 'راز شفافیت و درخشش (Air) وکال در میکس نهایی', desc: 'اکولایزر و سچوریشن نواری برای زنده‌تر شدن صدای خواننده.', tag: 'ترفند وکال', meta: '', cta: 'شنیدن نمونه', href: '#', img: '' },
          { title: 'آموزش گین‌استیجینگ اصولی در استودیو', desc: 'تنظیم هدروم مناسب پیش از ورود به شبیه‌سازهای آنالوگ.', tag: 'آموزش پایه', meta: '', cta: 'مطالعه مقاله', href: '#', img: '' }
        ]
      },
      {
        id: 'chords', theme: 'chords', icon: 'music', title: 'مرجع تخصصی آکوردها', badge: 'Harmonics',
        sub: 'دیاگرام انگشت‌گذاری و توالی‌های هارمونیک', viewAll: 'بانک آکورد', href: '/chords/', auto: 'chords', short: 'آکوردها', shortSub: 'دیاگرام زنده',
        cards: [
          { title: 'آکوردهای احساسی مینور ۷ برای گیتار و کیبورد', desc: 'تسلسل هارمونیک مناسب پاپ احساسی ایرانی.', chord: 'Am7', notes: 'لا مینور هفت', tag: '', meta: '', cta: 'نمایش دیاگرام', href: '#', img: '' },
          { title: 'آکوردهای پیشرفته جز و نئوسول', desc: 'افزودن تنشن‌های ۹، ۱۱ و ۱۳ برای حس مدرن.', chord: 'Fmaj9#11', notes: 'فا ماژور ۹ اکستندد', tag: '', meta: '', cta: 'تحلیل تئوری', href: '#', img: '' },
          { title: 'تنش و حل در آواز دشتی', desc: 'کاربرد E7♭9 در سبک ایرانی-مدرن.', chord: 'E7♭9', notes: 'می هفت با نهم بمل', tag: '', meta: '', cta: 'دریافت آکورد', href: '#', img: '' }
        ]
      },
      {
        id: 'sheets', theme: 'sheets', icon: 'file', title: 'آخرین نت‌ها و پارتیتورها', badge: 'PDF Sheets',
        sub: 'پارتیتور پیانو، تبلچر گیتار و علائم زینت', viewAll: 'آرشیو نت‌ها', href: '/sheets/', auto: 'sheets', short: 'نت‌ها', shortSub: 'دانلود PDF',
        cards: [
          { title: 'نت پیانو قطعه «خواب‌های طلایی»', desc: 'نسخه ویرایش‌شده با انگشت‌گذاری دقیق دست چپ و راست.', tag: 'پیانو • متوسط', meta: '۴ صفحه', cta: 'دانلود PDF', href: '#', img: '' },
          { title: 'تبلچر و ملودی سولو گیتار نوستالژیک', desc: 'مجموعه ۱۰ قطعه آرامش‌بخش برای هنرجویان مبتدی.', tag: 'گیتار • مقدماتی', meta: '۳ صفحه', cta: 'دریافت تبلچر', href: '#', img: '' },
          { title: 'پارتیتور کامل ارکستر زهی', desc: 'تفکیک ویولن، آلتو و ویولنسل.', tag: 'زهی • پیشرفته', meta: '۵ صفحه', cta: 'دریافت پارتیتور', href: '#', img: '' }
        ]
      }
    ],
    banner: {
      on: true, icon: 'forum', title: 'آهنگساز یا تنظیم‌کننده مستقل هستید؟',
      text: 'آثار و سمپل‌های خودتان را در فروشگاه ساز و راز با حفظ کپی‌رایت منتشر کنید.', btn: 'ثبت‌نام هنرمند', href: '/account/?mode=register'
    },
    footer: {
      title: 'تابلو اعلانات استودیو', sub: 'فراخوان‌ها، دوره‌ها و به‌روزرسانی‌های ماهانه',
      about: 'ساز و راز؛ جایی برای ساختن، شنیدن و یاد گرفتن موسیقی.',
      copyright: '© ۱۴۰۵ تمامی حقوق برای استودیو ساز و راز محفوظ است.',
      ann: [
        { theme: 'compose', label: 'اطلاعیه', title: 'راه‌اندازی سرور دانلود استم‌ها', text: 'اعضای ویژه می‌توانند فایل‌های چندترک را مستقیم دریافت کنند.', foot: '۴ دقیقه مطالعه', href: '#' },
        { theme: 'mix', label: 'رویداد ویژه', title: 'مسابقه بیت‌سازی «شور و ریتم»', text: 'ریتم مدرن خود را تا پایان هفته ارسال کنید.', foot: 'مهلت: پایان هفته', href: '#' },
        { theme: 'sheets', label: 'آپدیت مسترکلاس', title: 'فصل چهارم: اسرار سایدچین', text: 'آنالیز پروژه واقعی با پرکاشن سنتی و درام‌کیت.', foot: '۹ قسمت جدید', href: '#' }
      ],
      cols: [
        { title: 'بخش‌ها', links: [{ label: 'آهنگسازی', href: '/compose/' }, { label: 'میکس و مسترینگ', href: '/mixing/' }, { label: 'آکوردها', href: '/chords/' }, { label: 'نت‌ها', href: '/sheets/' }] },
        { title: 'حساب کاربری', links: [{ label: 'ورود / ثبت‌نام', href: '/account/' }, { label: 'پنل کاربری', href: '/account/panel/' }, { label: 'فروشگاه', href: '/shop/' }] },
        { title: 'پشتیبانی', links: [{ label: 'تماس با ما', href: '/contact/' }, { label: 'قوانین', href: '/terms/' }, { label: 'حریم خصوصی', href: '/privacy/' }] }
      ]
    }
  };

  function cssVars(s) {
    var t = s.themes, u = s.ui;
    var fh = "'" + s.fonts.heading + "',Tahoma,system-ui,sans-serif", fb = "'" + s.fonts.body + "',Tahoma,system-ui,sans-serif";
    return ':root{--c-compose:' + t.compose + ';--c-mix:' + t.mix + ';--c-chords:' + t.chords + ';--c-sheets:' + t.sheets + ';--c-extra:' + t.extra +
      ';--bg:' + u.bg + ';--card:' + u.card + ';--text:' + u.text + ';--muted:' + u.muted + ';--r:' + u.radius + 'px;--sh:' + u.shadow + 'px;--shc:' + u.shadowColor +
      ';--fh:' + fh + ';--fb:' + fb + '}';
  }

  function fontLink(s) {
    if (s.fonts.customCss) return s.fonts.customCss;
    var std = { Vazirmatn: 1, Lalezar: 1, Tahoma: 1 }, fam = [];
    [s.fonts.heading, s.fonts.body].forEach(function (f) { if (f && !std[f] && fam.indexOf(f) < 0) fam.push(f); });
    if (!fam.length) return '';
    return 'https://fonts.googleapis.com/css2?' + fam.map(function (f) { return 'family=' + encodeURIComponent(f).replace(/%20/g, '+') + ':wght@400;700;900'; }).join('&') + '&display=swap';
  }

  function header(s, active) {
    var m = s.menu.map(function (i) {
      return '<a href="' + esc(href(i.href)) + '" class="t-' + esc(i.theme || 'compose') + (active && active === i.href ? ' on' : '') + '">' + esc(i.label) + '</a>';
    }).join('');
    return '<header class="hdr"><div class="wrap hdr-in">' +
      '<a class="brand" href="/" aria-label="' + esc(s.site.name) + '"><span class="logo">' + ic('eq') + '</span><span class="bt"><b>' + esc(s.site.name) +
      (s.site.badge ? '<i>' + esc(s.site.badge) + '</i>' : '') + '</b><small>' + esc(s.site.tagline) + '</small></span></a>' +
      '<nav class="nav" id="nav" aria-label="منوی اصلی">' + m + '</nav>' +
      '<div class="hdr-act"><a class="ib" href="/search/" aria-label="جستجو">' + ic('search') + '</a>' +
      '<a class="ib hide-m" href="/shop/cart/" aria-label="سبد خرید" data-cart>' + ic('cart') + '</a>' +
      '<a class="auth" href="/account/" data-auth>' + ic('user') + '<span class="t">' + esc(s.site.loginLabel || 'ورود / ثبت‌نام') + '</span></a>' +
      '<button class="ib burger" type="button" aria-label="منو" aria-controls="nav" aria-expanded="false" data-burger>' + ic('menu') + '</button></div>' +
      '</div></header>';
  }

  function footer(s) {
    var f = s.footer;
    var ann = f.ann.map(function (a, i) {
      return '<article class="an t-' + esc(a.theme) + '"><div class="top"><span class="lbl">' + esc(a.label) + '</span><span class="no">' + (i + 1) + '</span></div>' +
        '<h4>' + esc(a.title) + '</h4><p>' + esc(a.text) + '</p><div class="ft"><span>' + esc(a.foot) + '</span><a href="' + esc(href(a.href)) + '">' + esc(f.moreLabel || 'ادامه') + ic('arrow') + '</a></div></article>';
    }).join('');
    var cols = f.cols.map(function (c) {
      return '<div><h5>' + esc(c.title) + '</h5>' + c.links.map(function (l) { return '<a href="' + esc(href(l.href)) + '">' + esc(l.label) + '</a>'; }).join('') + '</div>';
    }).join('');
    return '<footer class="ftr"><div class="wrap">' +
      '<div class="ftr-h"><div class="l"><span class="logo">' + ic('mega') + '</span><div><h3>' + esc(f.title) + '</h3><small>' + esc(f.sub) + '</small></div></div></div>' +
      '<div class="ann">' + ann + '</div>' +
      '<div class="cols"><div><h5>' + esc(s.site.name) + '</h5><p>' + esc(f.about) + '</p></div>' + cols + '</div>' +
      '<div class="copy"><span>' + esc(f.copyright) + '</span><span>' + esc(s.site.tagline) + '</span></div></div></footer>';
  }

  function card(c, sec) {
    var vis;
    if (c.chord) {
      vis = '<div class="chord"><div><b>' + esc(c.chord) + '</b><small>' + esc(c.notes) + '</small></div>' + ic(sec.icon) + '</div>';
    } else {
      vis = '<div class="thumb">' +
        (c.img ? '<img src="' + esc(c.img) + '" alt="' + esc(c.title) + '" width="640" height="360" loading="lazy" decoding="async">' : '<div class="ph">' + ic(sec.icon) + '</div>') +
        (c.tag ? '<span class="chip">' + esc(c.tag) + '</span>' : '') + (c.meta ? '<span class="meta">' + esc(c.meta) + '</span>' : '') + '</div>';
    }
    return '<article class="card">' + vis + '<div class="card-b"><h3><a class="stretch" href="' + esc(href(c.href)) + '">' + esc(c.title) + '</a></h3><p>' + esc(c.desc) + '</p></div>' +
      '<span class="cta">' + esc(c.cta || 'مشاهده') + ic('arrow') + '</span></article>';
  }

  function section(sec) {
    return '<section class="sec t-' + esc(sec.theme) + '" id="' + esc(sec.id) + '" data-auto="' + esc(sec.auto || '') + '" data-theme-key="' + esc(sec.theme) + '" data-icon="' + esc(sec.icon) + '">' +
      '<div class="sec-h"><div class="sec-t"><span class="sec-i">' + ic(sec.icon) + '</span><div><h2>' + esc(sec.title) + (sec.badge ? '<span class="tag">' + esc(sec.badge) + '</span>' : '') + '</h2><p>' + esc(sec.sub) + '</p></div></div>' +
      '<a class="btn btn-w" href="' + esc(href(sec.href)) + '">' + esc(sec.viewAll) + ic('arrow') + '</a></div>' +
      '<div class="grid">' + sec.cards.map(function (c) { return card(c, sec); }).join('') + '</div></section>';
  }

  function hero(s) {
    var h = s.hero;
    var bars = [45, 80, 60, 95, 35, 70, 50, 88, 65, 40].map(function (v, i) { return '<i style="--h:' + v + '%;--d:' + (i * 0.13).toFixed(2) + 's"></i>'; }).join('');
    var quick = s.sections.map(function (x) {
      return '<a class="q t-' + esc(x.theme) + '" href="#' + esc(x.id) + '"><span class="qi">' + ic(x.icon) + '</span><span><b>' + esc(x.short) + '</b><small>' + esc(x.shortSub) + '</small></span></a>';
    }).join('');
    return '<section class="hero"><span class="sh a"></span><span class="sh b"></span><span class="sh c"></span>' +
      '<div class="hero-in"><div><span class="eyebrow">' + esc(h.eyebrow) + '</span>' +
      '<h1>' + esc(h.title1) + '<br><span class="hl">' + esc(h.title2) + '</span></h1><p>' + esc(h.text) + '</p>' +
      '<div class="hero-btns"><a class="btn" href="' + esc(href(h.btn1Href)) + '">' + ic('bolt') + esc(h.btn1) + '</a><a class="btn alt" href="' + esc(href(h.btn2Href)) + '">' + ic('cart') + esc(h.btn2) + '</a></div></div>' +
      '<div class="deck" aria-hidden="true"><div class="deck-top"><div class="dots3"><i></i><i></i><i></i></div><span>' + esc(h.deckBadge) + '</span></div><div class="eq">' + bars + '</div>' +
      '<div class="now"><span class="logo">' + ic('eq') + '</span><div><b>' + esc(h.deckTitle) + '</b><small>' + esc(h.deckSub) + '</small></div><span class="ib">' + ic('play') + '</span></div></div></div>' +
      '<div class="quick">' + quick + '</div></section>';
  }

  function banner(s) {
    var b = s.banner;
    if (!b.on) return '';
    return '<section class="banner"><div class="l"><span class="logo">' + ic(b.icon) + '</span><div><h3>' + esc(b.title) + '</h3><p>' + esc(b.text) + '</p></div></div>' +
      '<a class="btn" href="' + esc(href(b.href)) + '">' + esc(b.btn) + ic('arrow') + '</a></section>';
  }

  function main(s) { return hero(s) + s.sections.map(section).join('') + banner(s); }

  function jsonld(s) {
    var u = s.site.url.replace(/\/$/, '');
    return JSON.stringify({ '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebSite', name: s.site.name, url: u + '/', inLanguage: 'fa-IR', description: s.site.desc },
      { '@type': 'Organization', name: s.site.name, url: u + '/', logo: u + s.site.favicon }
    ] }).replace(/</g, '\\u003c');
  }

  function page(s) {
    var u = s.site.url.replace(/\/$/, ''), fl = fontLink(s);
    var img = s.site.ogImage ? '<meta property="og:image" content="' + esc(s.site.ogImage) + '"><meta name="twitter:image" content="' + esc(s.site.ogImage) + '">' : '';
    return '<!DOCTYPE html>\n<html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
      '<title>' + esc(s.site.title) + '</title><meta name="description" content="' + esc(s.site.desc) + '">' +
      '<link rel="canonical" href="' + esc(u) + '/"><meta name="robots" content="index,follow,max-image-preview:large">' +
      '<meta name="theme-color" content="' + esc(s.ui.bg) + '"><meta name="sr-api" content="' + esc(s.site.api) + '">' +
      '<meta property="og:type" content="website"><meta property="og:locale" content="fa_IR"><meta property="og:site_name" content="' + esc(s.site.name) + '">' +
      '<meta property="og:title" content="' + esc(s.site.title) + '"><meta property="og:description" content="' + esc(s.site.desc) + '"><meta property="og:url" content="' + esc(u) + '/">' +
      '<meta name="twitter:card" content="summary_large_image">' + img +
      '<link rel="icon" href="' + esc(s.site.favicon) + '">' +
      '<link rel="preload" href="/assets/fonts/Vazirmatn.woff2" as="font" type="font/woff2" crossorigin>' +
      (fl ? '<link rel="stylesheet" href="' + esc(fl) + '">' : '') +
      '<link rel="stylesheet" href="/assets/theme.css"><style id="cfg">' + cssVars(s) + '</style>' +
      '<script type="application/ld+json">' + jsonld(s) + '</script></head>' +
      '<body class="' + (s.ui.dots ? 'dots' : '') + '"><a class="skip" href="#main">پرش به محتوا</a>' +
      header(s) + '<main id="main" class="wrap">' + main(s) + '</main>' + footer(s) +
      '<script src="/assets/core.js" defer></script></body></html>';
  }

  return { DEFAULTS: DEFAULTS, ICON_NAMES: ICON_NAMES, esc: esc, ic: ic, cssVars: cssVars, fontLink: fontLink, header: header, footer: footer, main: main, section: section, card: card, page: page };
});
