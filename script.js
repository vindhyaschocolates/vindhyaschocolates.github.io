/* Vindhya's Homemade Chocolates — interactions: 3D stage, ring carousel, menu, order builder */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var PHONE = '918726580017';
  /* Google Sheet capture: paste your Apps Script web-app URL here (see SHEETS-SETUP.md). Leave empty to switch it off. */
  var SHEET_URL = 'https://script.google.com/macros/s/AKfycby4FacwQYH4QBNV0xNQZ7ZHGzOD5BQpRG6MqN8tVelhoCaPkF28n1X4VLJUhh9o3dVi/exec';
  function sendToSheet(type, data) {
    if (!SHEET_URL) return;
    try {
      data.type = type; data.page = location.href;
      var body = new URLSearchParams(data).toString();
      fetch(SHEET_URL, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body }).catch(function () {});
    } catch (e) {}
  }

  /* ---------- helpers ---------- */
  function store(key, val) {
    try { if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null'); localStorage.setItem(key, JSON.stringify(val)); } catch (e) { return null; }
  }
  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- split headline ---------- */
  $$('[data-split]').forEach(function (el) {
    var text = el.textContent, base = parseFloat(el.getAttribute('data-delay') || 0);
    el.setAttribute('aria-label', text); el.textContent = '';
    el.style.setProperty('--base', base + 's');
    text.split('').forEach(function (ch, i) {
      var s = document.createElement('span');
      s.setAttribute('aria-hidden', 'true');
      if (ch === ' ') { s.className = 'sp'; } else { s.className = 'ch'; s.textContent = ch; }
      s.style.setProperty('--i', i); el.appendChild(s);
    });
  });

  /* ---------- header / progress / burger ---------- */
  var header = $('.site-header'), prog = $('#progress'), toTop = $('#toTop');
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    if (header) header.classList.toggle('scrolled', y > 30);
    if (prog) prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    if (toTop) toTop.classList.toggle('show', y > 700);
  }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });
  var burger = $('#burger'), nav = $('#nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open);
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }); });
  }

  /* ---------- reveal + counters ---------- */
  function countUp(el) {
    var end = parseFloat(el.getAttribute('data-count')), pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '';
    if (reduced) { el.textContent = pre + end + suf; return; }
    var t0 = null, dur = 1400;
    function step(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3); el.textContent = pre + Math.round(end * e) + suf; if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        $$('[data-count]', e.target).forEach(countUp);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else { $$('.reveal').forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- hero 3D parallax ---------- */
  var hero = $('#hero'), stage = $('#stage');
  if (hero && stage && !reduced) {
    var tx = 0, ty = 0, cx = 0, cy = 0, pointerActive = false, heroVisible = true;
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; pointerActive = true;
    });
    hero.addEventListener('pointerleave', function () { pointerActive = false; });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; }).observe(hero);
    var t0 = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop);
      if (!heroVisible) return;
      if (!pointerActive) { var s = (now - t0) / 1000; tx = Math.sin(s * 0.5) * 0.7; ty = Math.cos(s * 0.4) * 0.4; }
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      stage.style.setProperty('--px', (cx * 0.5).toFixed(3));
      stage.style.setProperty('--py', (cy * 0.4).toFixed(3));
      stage.style.setProperty('--rx', (cx * 9).toFixed(2));
      stage.style.setProperty('--ry', (cy * -6).toFixed(2));
    })(t0);
  }

  /* ---------- gold dust canvas ---------- */
  var cv = $('#dust');
  if (cv && !reduced) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, P = [], dpr = Math.min(window.devicePixelRatio || 1, 2), visible = true;
    function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function mk(init) { return { x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: Math.random() * 2 + 0.4, v: Math.random() * 0.35 + 0.1, a: Math.random() * Math.PI * 2, s: Math.random() * 0.02 + 0.005, o: Math.random() * 0.6 + 0.2 }; }
    size(); var N = W < 700 ? 28 : 64; for (var i = 0; i < N; i++) P.push(mk(true));
    window.addEventListener('resize', size);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(cv);
    (function draw() {
      requestAnimationFrame(draw); if (!visible) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; p.y -= p.v; p.a += p.s; p.x += Math.sin(p.a) * 0.35;
        if (p.y < -10) P[i] = mk(false);
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, 'rgba(255,226,160,' + p.o + ')'); g.addColorStop(1, 'rgba(255,226,160,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill();
      }
    })();
  }

  /* ---------- tilt cards ---------- */
  if (finePointer && !reduced) {
    $$('[data-tilt]').forEach(function (el) {
      var big = el.classList.contains('mvisual') || el.classList.contains('gift-art');
      var max = big ? 7 : 10;
      el.addEventListener('pointermove', function (e) {
        var b = el.getBoundingClientRect(), nx = (e.clientX - b.left) / b.width, ny = (e.clientY - b.top) / b.height;
        el.style.transform = 'perspective(1100px) rotateX(' + ((0.5 - ny) * max).toFixed(2) + 'deg) rotateY(' + ((nx - 0.5) * max * 1.2).toFixed(2) + 'deg)' + (big ? '' : ' translateZ(6px)');
        el.style.setProperty('--gx', (nx * 100).toFixed(1) + '%'); el.style.setProperty('--gy', (ny * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
    $$('.magnet').forEach(function (m) {
      m.addEventListener('pointermove', function (e) {
        var b = m.getBoundingClientRect(); m.style.transform = 'translate(' + ((e.clientX - b.left - b.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - b.top - b.height / 2) * 0.28).toFixed(1) + 'px)';
      });
      m.addEventListener('pointerleave', function () { m.style.transform = ''; });
    });
  }

  /* ---------- menu tabs ---------- */
  var tabs = $$('.mtab'), panels = $$('.mpanel');
  function openCat(id, scroll) {
    tabs.forEach(function (t) { var on = t.getAttribute('data-tab') === id; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    panels.forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-panel') === id); });
    if (scroll) { var m = $('#menu'); if (m) window.scrollTo({ top: m.getBoundingClientRect().top + window.scrollY - 60, behavior: reduced ? 'auto' : 'smooth' }); }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { openCat(t.getAttribute('data-tab')); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); openCat(n.getAttribute('data-tab')); }
    });
  });

  /* ---------- 3D ring carousel ---------- */
  var ring = $('#ring'), wrap = $('#ringWrap');
  if (ring && wrap) {
    var cards = $$('.rcard', ring), n = cards.length, theta = 360 / n, radius = 320, angle = 0, target = 0, auto = !reduced, dragging = false, startX = 0, startT = 0, moved = 0, resumeTimer, idx = -1;
    var cats = cards.map(function (c) { return c.getAttribute('data-cat'); });
    function layout() {
      var cw = cards[0].offsetWidth; radius = Math.round((cw / 2 + 64) / Math.tan(Math.PI / n));
      cards.forEach(function (c, i) { c.style.transform = 'rotateY(' + (i * theta) + 'deg) translateZ(' + radius + 'px)'; });
    }
    layout(); window.addEventListener('resize', layout);
    function labelFor(i) {
      var c = cards[i], cap = $('.rcap', c);
      $('#rKick').textContent = $('small', cap).textContent; $('#rName').textContent = $('b', cap).textContent; $('#rFrom').textContent = $('span', cap).textContent;
    }
    function snap() { target = Math.round(target / theta) * theta; }
    function pause() { auto = false; clearTimeout(resumeTimer); if (!reduced) resumeTimer = setTimeout(function () { auto = true; }, 5000); }
    function go(dir) { snap(); target -= dir * theta; pause(); }
    function rotateTo(i) { var cur = Math.round(-target / theta), diff = ((i - cur) % n + n) % n; if (diff > n / 2) diff -= n; target -= diff * theta; pause(); }
    var vis = true; if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(wrap);
    (function loop() {
      requestAnimationFrame(loop); if (!vis) return;
      if (auto && !dragging) target -= 0.14;
      angle += (target - angle) * 0.085;
      ring.style.transform = 'translateZ(' + (-radius) + 'px) rotateY(' + angle.toFixed(3) + 'deg)';
      var k = ((Math.round(-angle / theta) % n) + n) % n;
      if (k !== idx) { idx = k; cards.forEach(function (c, i) { c.classList.toggle('front', i === k); }); labelFor(k); }
    })();
    $('#rPrev').addEventListener('click', function () { go(-1); });
    $('#rNext').addEventListener('click', function () { go(1); });
    $('#rOpen').addEventListener('click', function () { openCat(cats[idx], true); });
    wrap.addEventListener('pointerdown', function (e) { dragging = true; moved = 0; startX = e.clientX; startT = target; wrap.classList.add('drag'); auto = false; clearTimeout(resumeTimer); });
    window.addEventListener('pointermove', function (e) { if (!dragging) return; var dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx)); target = startT + dx * 0.32; });
    window.addEventListener('pointerup', function () { if (!dragging) return; dragging = false; wrap.classList.remove('drag'); snap(); pause(); });
    cards.forEach(function (c, i) { c.addEventListener('click', function () { if (moved > 6) return; if (i === idx) openCat(cats[i], true); else rotateTo(i); }); });
    wrap.setAttribute('tabindex', '0');
    wrap.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });
  }

  /* ---------- order builder ---------- */
  var KEY = 'vindhyas_order_v1', TTL = 2 * 60 * 60 * 1000;
  /* basket lives in sessionStorage only: forgotten when the tab/browser is closed, and after 2 hours */
  function loadCart() { try { var d = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (d && d.t && Date.now() - d.t < TTL && d.c) return d.c; } catch (e) {} try { localStorage.removeItem(KEY); } catch (e) {} return {}; }
  var cart = loadCart();
  var drawer = $('#drawer'), scrim = $('#scrim'), body = $('#cartBody'), count = $('#cartCount');
  function rupees(n) { return '₹' + n.toLocaleString('en-IN'); }
  function money(a, b) { return a === b ? rupees(a) : rupees(a) + '–' + rupees(b).slice(1); }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), c: cart })); } catch (e) {} }
  function render() {
    var ids = Object.keys(cart), q = 0, lo = 0, hi = 0, lines = [];
    body.innerHTML = '';
    if (!ids.length) { body.innerHTML = '<div class="empty"><b>Your order is empty</b>Tap the <b style="display:inline;font-size:inherit">+</b> next to any chocolate on the menu to add it here.</div>'; }
    ids.forEach(function (id) {
      var it = cart[id]; q += it.qty; lo += it.min * it.qty; hi += it.max * it.qty;
      lines.push('• ' + it.qty + ' × ' + it.name + ' (' + money(it.min, it.max) + (it.qty > 1 ? ' each' : '') + ')');
      var row = document.createElement('div'); row.className = 'citem';
      row.innerHTML = '<div class="ci">' + it.name.replace(/</g, '&lt;') + '<small>' + money(it.min, it.max) + ' each</small></div><div class="qty"><button type="button" data-a="-" aria-label="Less">−</button><span>' + it.qty + '</span><button type="button" data-a="+" aria-label="More">+</button></div>';
      row.addEventListener('click', function (e) {
        var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (!a) return;
        it.qty += a === '+' ? 1 : -1; if (it.qty <= 0) delete cart[id]; save(); render();
      });
      body.appendChild(row);
    });
    count.textContent = q; count.classList.toggle('has', q > 0);
    $('#cartTotal').textContent = q ? money(lo, hi) : '₹0';
    var send = $('#sendOrder'); send.classList.toggle('disabled', !q);
    var name = $('#custName').value.trim(), note = $('#custNote').value.trim();
    var msg = "Hi Vindhya's! I'd like to place an order:\n" + lines.join('\n') + (q ? '\n\nEstimated total: ' + money(lo, hi) : '') + (name ? '\nName: ' + name : '') + (($('#custAddr').value.trim()) ? '\nDelivery address: ' + $('#custAddr').value.trim() : '') + (note ? '\nNote: ' + note : '') + '\n\nPlease confirm availability, the final price (customisation may change it) and delivery charges. Thank you!';
    send.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(msg);
  }
  function openDrawer(open) {
    drawer.classList.toggle('open', open); scrim.classList.toggle('open', open); drawer.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  $('#cartOpen').addEventListener('click', function () { openDrawer(true); });
  $('#cartClose').addEventListener('click', function () { openDrawer(false); });
  scrim.addEventListener('click', function () { openDrawer(false); });
  $('#cartClear').addEventListener('click', function () { cart = {}; save(); render(); });
  $('#custName').addEventListener('input', render); $('#custNote').addEventListener('input', render); $('#custAddr').addEventListener('input', render);
  $('#sendOrder').addEventListener('click', function () {
    var ids = Object.keys(cart); if (!ids.length) return;
    var hp = $('#hpOrder'); if (hp && hp.value) return;
    var lo = 0, hi = 0, q = 0, items = ids.map(function (id) { var it = cart[id]; q += it.qty; lo += it.min * it.qty; hi += it.max * it.qty; return it.qty + ' x ' + it.name; });
    sendToSheet('order', { name: $('#custName').value.trim(), phone: $('#custPhone').value.trim(), area: $('#custArea').value.trim(), address: $('#custAddr').value.trim(), items: items.join('; '), qty: q, total: money(lo, hi), note: $('#custNote').value.trim() });
    setTimeout(function () { cart = {}; save(); ['#custName', '#custPhone', '#custArea', '#custAddr', '#custNote'].forEach(function (k) { var el = $(k); if (el) el.value = ''; }); render(); openDrawer(false); toast('Order sent — thank you! 🍫'); }, 1200);
  });
  var lf = $('#leadForm');
  if (lf) lf.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('#leadMsg'), f = lf.elements, name = f.name.value.trim(), ph = f.phone.value.replace(/[^\d+]/g, '');
    msg.className = 'lf-msg';
    if (f.website.value) return;
    if (!name || ph.replace(/\D/g, '').length < 10) { msg.textContent = 'Please enter your name and a valid phone number.'; msg.classList.add('err'); return; }
    var last = store('vindhyas_lead_ts'); if (last && Date.now() - last < 30000) { msg.textContent = 'Already received — thank you!'; msg.classList.add('ok'); return; }
    sendToSheet('lead', { name: name, phone: ph, interest: f.interest.value.trim() });
    store('vindhyas_lead_ts', Date.now());
    msg.textContent = 'Thank you, ' + name + '! We’ll be in touch on WhatsApp. 🍫'; msg.classList.add('ok'); lf.reset();
  });
  $$('.prow').forEach(function (row) {
    $('.add', row).addEventListener('click', function (e) {
      var id = row.getAttribute('data-id'), btn = e.currentTarget;
      if (!cart[id]) cart[id] = { name: row.getAttribute('data-name'), min: +row.getAttribute('data-min'), max: +row.getAttribute('data-max'), qty: 0 };
      cart[id].qty++; save(); render();
      btn.classList.add('ok'); btn.firstChild.textContent = '✓'; setTimeout(function () { btn.classList.remove('ok'); btn.firstChild.textContent = '+'; }, 900);
      count.classList.remove('bump'); void count.offsetWidth; count.classList.add('bump');
      toast('Added: ' + cart[id].name);
    });
  });
  render();

  /* ---------- lightbox ---------- */
  var lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  function closeLb() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); }
  $$('.gitem').forEach(function (g) {
    g.addEventListener('click', function () { var im = $('img', g); lbImg.src = im.src; lbImg.alt = im.alt; lbCap.textContent = $('figcaption', g).textContent; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); });
  });
  $('#lbClose').addEventListener('click', closeLb); lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeLb(); openDrawer(false); } });
})();
