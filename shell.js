/*!
 * IEH App Shell — একটি স্ক্রিপ্ট, ছয়টা বই।
 * প্রতিটা বইয়ে `<script src="../shell.js" defer></script>` দিলেই ডানদিকে ফ্লোটিং টুলবার আসে।
 * Shadow DOM ব্যবহার হয়, তাই বইয়ের CSS/ID-র সাথে সংঘর্ষ হয় না।
 * ইন্ট্রো পেজে `data-home` অ্যাট্রিবিউট থাকলে টুলবার আঁকা হয় না, শুধু তালিকা (IEHShell.books) পাওয়া যায়।
 */
(function () {
  'use strict';

  var SCRIPT = document.currentScript;
  var ROOT = new URL('./', SCRIPT.src).href;           // শেল যেখানে আছে (রিপোর রুট) — GitHub Pages প্রজেক্ট-পাথেও ঠিক থাকে
  var LS = 'iehapp:';

  var BOOKS = [
    { id: 'part-1', path: 'books/part-1.html', n: '১', kicker: 'প্রথম অংশ', title: 'আন্তর্জাতিক আমদানি–রপ্তানি ব্যবসা',
      desc: 'সোর্সিং, প্রাইসিং, PI/PO, LC ও TT, Incoterms, কস্টিং শিট।', group: 'main' },
    { id: 'part-2', path: 'books/part-2.html', n: '২', kicker: 'দ্বিতীয় অংশ', title: 'Maritime Shipping ও সমুদ্রবন্দর',
      desc: 'কন্টেইনার, ইয়ার্ড, B/L, ডেমারেজ, বন্দর চেকলিস্ট।', group: 'main' },
    { id: 'part-3', path: 'books/part-3.html', n: '৩', kicker: 'তৃতীয় অংশ', title: 'ফ্রেইট ফরোয়ার্ডিং, কাস্টমস ও বাংলাদেশ ইমপোর্ট',
      desc: 'ফরোয়ার্ডিং, কাস্টমস ক্লিয়ারেন্স, বাংলাদেশের আমদানি প্রক্রিয়া।', group: 'main' },
    { id: 'part-4', path: 'books/part-4.html', n: '৪', kicker: 'চতুর্থ অংশ', title: 'ব্যবহারিক আমদানি–রপ্তানি ব্যবস্থাপনা',
      desc: 'হাতে-কলমে ব্যবস্থাপনা, চেকলিস্ট ও বাস্তব প্রয়োগ।', group: 'main' },
    { id: 'china-import', path: 'books/china-import.html', n: '৫', kicker: 'সহায়ক গাইড', title: 'চীন থেকে বাংলাদেশে পণ্য আমদানি',
      desc: 'ছয় পর্ব, Landed Cost ক্যালকুলেটর, টেমপ্লেট ও শব্দকোষ।', group: 'guide' },
    { id: 'freight-guide', path: 'books/freight-guide.html', n: '৬', kicker: 'সহায়ক গাইড', title: 'ফ্রেইট ফরোয়ার্ডিং গাইড',
      desc: 'পরিবহন মাধ্যম, Chargeable Weight ও CBM ক্যালকুলেটর।', group: 'guide' }
  ];
  BOOKS.forEach(function (b) { b.url = ROOT + b.path; });

  /* ---------- ছোট সহায়ক ---------- */
  function lsGet(k) { try { return localStorage.getItem(LS + k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(LS + k, v); } catch (e) {} }

  function currentIndex() {
    var file = location.pathname.split('/').pop();
    for (var i = 0; i < BOOKS.length; i++) if (BOOKS[i].path.split('/').pop() === file) return i;
    return -1;
  }
  var CUR = currentIndex();

  /* ---------- পাবলিক API (ইন্ট্রো পেজের জন্য) ---------- */
  window.IEHShell = {
    books: BOOKS,
    root: ROOT,
    resume: function () {
      try { return JSON.parse(lsGet('last') || 'null'); } catch (e) { return null; }
    },
    read: function () {
      try { return JSON.parse(lsGet('progress') || '{}'); } catch (e) { return {}; }
    }
  };

  if (SCRIPT.hasAttribute('data-home')) return;      // ইন্ট্রো পেজে টুলবার নয়
  if (CUR < 0) return;                               // অচেনা পেজে কিছু করবে না

  /* ---------- শেষ পড়ার জায়গা সংরক্ষণ ---------- */
  var book = BOOKS[CUR];
  var maxPct = 0, saveTimer = null;
  function scrollPct() {
    var h = document.documentElement.scrollHeight - innerHeight;
    return h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0;
  }
  function saveNow() {
    var pct = scrollPct();
    if (pct > maxPct) maxPct = pct;
    lsSet('last', JSON.stringify({ id: book.id, y: Math.round(scrollY), pct: pct, t: Date.now() }));
    var prog = window.IEHShell.read();
    prog[book.id] = Math.max(prog[book.id] || 0, maxPct);
    lsSet('progress', JSON.stringify(prog));
  }
  addEventListener('scroll', function () { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 400); }, { passive: true });
  addEventListener('pagehide', saveNow);
  document.addEventListener('visibilitychange', function () { if (document.hidden) saveNow(); });

  // ইন্ট্রো থেকে "চালিয়ে যান" চাপলে আগের স্ক্রল জায়গায় ফেরা (?resume=Y)
  var m = /[?&]resume=(\d+)/.exec(location.search);
  if (m) {
    var y = +m[1], tries = 0;
    var t = setInterval(function () {
      tries++;
      if (document.documentElement.scrollHeight - innerHeight >= y - 2 || tries > 24) {
        clearInterval(t);
        scrollTo(0, y);
      }
    }, 250);
  }

  /* ---------- Shadow DOM হোস্ট ---------- */
  var host = document.createElement('div');
  host.id = 'ieh-shell-host';
  host.style.cssText = 'all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483000;';
  var pr = document.createElement('style');
  pr.textContent = '@media print{#ieh-shell-host{display:none!important}}';
  document.head.appendChild(pr);
  var root = host.attachShadow({ mode: 'open' });

  var prev = BOOKS[(CUR + BOOKS.length - 1) % BOOKS.length];
  var next = BOOKS[(CUR + 1) % BOOKS.length];

  var ICON = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h5v-6h3v6h5V10"/></svg>',
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 6-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6 6 6-6 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };

  var css = '\
:host{all:initial}\
*{box-sizing:border-box;margin:0;padding:0}\
.wrap{--bg:#ffffff;--fg:#0c1a2e;--mu:#53637c;--line:rgba(12,26,46,.14);--acc:#0d9488;--accs:rgba(13,148,136,.12);--sh:0 10px 34px -10px rgba(12,26,46,.4);\
 position:fixed;inset:0;pointer-events:none;font-family:"Noto Sans Bengali","Solaimanlipi","Kalpurush","Nikosh","Vrinda","Segoe UI",system-ui,sans-serif;font-size:15px;line-height:1.5;color:var(--fg)}\
.wrap.dark{--bg:#111c2e;--fg:#e8eef8;--mu:#9db0c9;--line:rgba(232,238,248,.16);--acc:#2dd4bf;--accs:rgba(45,212,191,.14);--sh:0 10px 34px -10px rgba(0,0,0,.7)}\
button,a{font:inherit;color:inherit;-webkit-tap-highlight-color:transparent}\
svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none}\
/* ফ্লোটিং বার */\
.bar{position:absolute;right:10px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:2px;padding:5px;background:var(--bg);border:1px solid var(--line);border-radius:18px;box-shadow:var(--sh);pointer-events:auto;opacity:.94;transition:opacity .2s,transform .25s}\
.bar:hover,.bar:focus-within{opacity:1}\
.bar.hide{transform:translate(70px,-50%)}\
.ib{display:grid;place-items:center;width:44px;height:44px;border:0;border-radius:13px;background:transparent;cursor:pointer;text-decoration:none;position:relative}\
.ib:hover{background:var(--accs);color:var(--acc)}\
.ib:focus-visible{outline:2px solid var(--acc);outline-offset:1px}\
.ib.on{background:var(--acc);color:#fff}\
.ib .tip{position:absolute;right:calc(100% + 10px);top:50%;transform:translateY(-50%);white-space:nowrap;background:var(--fg);color:var(--bg);padding:4px 10px;border-radius:8px;font-size:13px;opacity:0;pointer-events:none;transition:opacity .15s}\
.ib:hover .tip,.ib:focus-visible .tip{opacity:1}\
.sep{height:1px;background:var(--line);margin:3px 8px}\
.pos{font-size:12px;text-align:center;color:var(--mu);padding:2px 0 3px;font-weight:600}\
/* প্যানেল */\
.scrim{position:absolute;inset:0;background:rgba(6,12,24,.42);opacity:0;pointer-events:none;transition:opacity .2s}\
.open .scrim{opacity:1;pointer-events:auto}\
.panel{position:absolute;top:0;right:0;bottom:0;width:min(380px,92vw);background:var(--bg);border-left:1px solid var(--line);box-shadow:var(--sh);transform:translateX(105%);transition:transform .28s cubic-bezier(.2,.8,.2,1);pointer-events:auto;display:flex;flex-direction:column;visibility:hidden}\
.open .panel{transform:none;visibility:visible}\
.ph{display:flex;align-items:center;justify-content:space-between;padding:14px 14px 10px 18px;border-bottom:1px solid var(--line)}\
.ph b{font-size:17px}\
.pl{overflow:auto;padding:10px 10px 18px;flex:1;overscroll-behavior:contain}\
.gh{font-size:12px;color:var(--mu);font-weight:700;letter-spacing:.04em;padding:12px 10px 6px}\
.it{display:flex;gap:12px;align-items:flex-start;padding:11px 10px;border-radius:14px;text-decoration:none;border:1px solid transparent}\
.it:hover{background:var(--accs)}\
.it:focus-visible{outline:2px solid var(--acc)}\
.it.cur{background:var(--accs);border-color:var(--acc)}\
.num{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;font-weight:700;background:var(--accs);color:var(--acc);flex:none}\
.cur .num{background:var(--acc);color:#fff}\
.tx{min-width:0;flex:1}\
.k{font-size:12px;color:var(--mu)}\
.t{font-weight:700;line-height:1.35}\
.d{font-size:13px;color:var(--mu);margin-top:2px}\
.pg{height:4px;border-radius:4px;background:var(--line);margin-top:7px;overflow:hidden}\
.pg i{display:block;height:100%;background:var(--acc)}\
.badge{font-size:11px;color:var(--acc);font-weight:700}\
.homeit .num{background:transparent;border:1px dashed var(--acc)}\
@media (max-width:700px){\
 .bar{right:6px;flex-direction:column;padding:4px;border-radius:16px}\
 .ib{width:40px;height:40px}\
 .bar>:not(#menu){display:none}\
 .bar{padding:3px;opacity:.88}\
 .ib .tip{display:none}\
 .panel{top:auto;left:0;right:0;width:auto;max-height:78vh;border-left:0;border-top:1px solid var(--line);border-radius:20px 20px 0 0;transform:translateY(105%)}\
}\
@media (prefers-reduced-motion:reduce){*{transition:none!important}}';

  function itemHTML(b, i) {
    var prog = window.IEHShell.read()[b.id] || 0;
    var cur = i === CUR;
    return '<a class="it' + (cur ? ' cur' : '') + '" href="' + b.url + '"' + (cur ? ' aria-current="page"' : '') + '>' +
      '<span class="num">' + b.n + '</span>' +
      '<span class="tx"><span class="k">' + b.kicker + (cur ? ' · <span class="badge">এখন পড়ছেন</span>' : '') + '</span>' +
      '<div class="t">' + b.title + '</div>' +
      '<div class="d">' + b.desc + '</div>' +
      (prog > 0.01 ? '<div class="pg" title="' + Math.round(prog * 100) + '% পড়া হয়েছে"><i style="width:' + Math.round(prog * 100) + '%"></i></div>' : '') +
      '</span></a>';
  }

  function build() {
    var main = '', guide = '';
    BOOKS.forEach(function (b, i) { (b.group === 'main' ? (main += itemHTML(b, i)) : (guide += itemHTML(b, i))); });
    root.innerHTML =
      '<style>' + css + '</style>' +
      '<div class="wrap" id="w">' +
      '<nav class="bar" id="bar" aria-label="বই পরিবর্তনের টুলবার">' +
        '<a class="ib" href="' + ROOT + 'index.html" aria-label="ইন্ট্রো পেজ">' + ICON.home + '<span class="tip">ইন্ট্রো পেজ</span></a>' +
        '<button class="ib" id="menu" aria-haspopup="dialog" aria-expanded="false" aria-label="সব বই (M)">' + ICON.grid + '<span class="tip">সব বই · M</span></button>' +
        '<div class="sep"></div>' +
        '<a class="ib" href="' + prev.url + '" aria-label="আগের বই: ' + prev.title + '">' + ICON.left + '<span class="tip">আগের: ' + prev.kicker + '</span></a>' +
        '<div class="pos" aria-hidden="true">' + book.n + '/' + BOOKS.length + '</div>' +
        '<a class="ib" href="' + next.url + '" aria-label="পরের বই: ' + next.title + '">' + ICON.right + '<span class="tip">পরের: ' + next.kicker + '</span></a>' +
      '</nav>' +
      '<div class="scrim" id="scrim"></div>' +
      '<aside class="panel" id="panel" role="dialog" aria-modal="true" aria-label="সব বই">' +
        '<div class="ph"><b>সব বই</b><button class="ib" id="close" aria-label="বন্ধ করুন">' + ICON.close + '</button></div>' +
        '<div class="pl">' +
          '<a class="it homeit" href="' + ROOT + 'index.html"><span class="num">' + ICON.home + '</span><span class="tx"><div class="t">ইন্ট্রো পেজ</div><div class="d">শুরুর পাতা ও বইয়ের তালিকা</div></span></a>' +
          '<div class="gh">মূল হ্যান্ডবুক</div>' + main +
          '<div class="gh">সহায়ক গাইড</div>' + guide +
        '</div>' +
      '</aside>' +
      '</div>';
  }

  var w, menuBtn, panel, lastFocus;
  function open() {
    lastFocus = document.activeElement;
    build(); bind(); applyTheme();                     // অগ্রগতি সতেজ করতে আবার আঁকা
    w.classList.add('open');
    root.getElementById('menu').setAttribute('aria-expanded', 'true');
    var cur = root.querySelector('.it.cur'); (cur || root.getElementById('close')).focus({ preventScroll: true });
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
  }
  function close() {
    w.classList.remove('open');
    root.getElementById('menu').setAttribute('aria-expanded', 'false');
    root.getElementById('menu').focus({ preventScroll: true });
  }
  function bind() {
    w = root.getElementById('w');
    root.getElementById('menu').onclick = function () { w.classList.contains('open') ? close() : open(); };
    root.getElementById('close').onclick = close;
    root.getElementById('scrim').onclick = close;
  }

  /* ---------- বইয়ের থিম অনুসরণ ---------- */
  function isDark() {
    var el = document.documentElement;
    var t = el.getAttribute('data-theme') || el.getAttribute('data-t');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function applyTheme() { if (w) w.classList.toggle('dark', isDark()); }
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-t', 'class'] });

  /* ---------- কিবোর্ড ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && w && w.classList.contains('open')) { close(); return; }
    var tg = e.target, tag = tg && tg.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (tg && tg.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'm' || e.key === 'M') { e.preventDefault(); w.classList.contains('open') ? close() : open(); }
  });
  // ফোকাস প্যানেলের ভেতরে আটকে রাখা
  root.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !w.classList.contains('open')) return;
    var f = root.querySelectorAll('#panel a,#panel button');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1], a = root.activeElement;
    if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- শুরু ---------- */
  function start() {
    document.body.appendChild(host);
    build(); bind(); applyTheme();
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  if (!m) saveNow();
})();
