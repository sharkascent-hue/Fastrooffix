// Shared behaviour for the client sites: header, mobile menu, scroll reveal, hero parallax,
// photo carousel + lightbox, area checker, problem finder and the quote form.
(function () {
  var d = document, root = d.documentElement;
  root.classList.add('js');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header turns solid once the page scrolls; hero photo drifts slightly.
  var top = d.querySelector('.top'), ticking = false;
  var onScroll = function () {
    var y = window.scrollY;
    if (top) top.classList.toggle('scrolled', y > 20);
    ticking = false;
  };
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // Mobile menu
  var burger = d.querySelector('.burger'), mnav = d.querySelector('.mnav');
  if (burger && mnav) {
    var toggle = function (open) {
      mnav.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
      d.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function () { toggle(!mnav.classList.contains('open')); });
    mnav.addEventListener('click', function (e) { if (e.target.closest('a')) toggle(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
  }

  // Scroll reveal
  var rv = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  // Carousel arrows
  d.querySelectorAll('[data-rail]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var rail = d.querySelector('.rail');
      rail.scrollBy({ left: btn.dataset.rail * Math.min(rail.clientWidth * 0.8, 720), behavior: calm ? 'auto' : 'smooth' });
    });
  });

  // Lightbox
  var links = [].slice.call(d.querySelectorAll('a[data-lb]'));
  if (links.length && window.HTMLDialogElement) {
    var dlg = d.createElement('dialog'), idx = 0;
    dlg.className = 'lb';
    dlg.innerHTML = '<div class="lb-in"><img alt=""></div><button class="x" aria-label="Close">×</button>' +
      '<button class="p" aria-label="Previous photo">‹</button><button class="nx" aria-label="Next photo">›</button><div class="ct"></div>';
    d.body.appendChild(dlg);
    var img = dlg.querySelector('img'), ct = dlg.querySelector('.ct');
    var show = function (i) {
      idx = (i + links.length) % links.length;
      img.src = links[idx].href;
      img.alt = links[idx].querySelector('img').alt;
      ct.textContent = (idx + 1) + ' / ' + links.length;
    };
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); show(i); dlg.showModal(); });
    });
    dlg.querySelector('.x').onclick = function () { dlg.close(); };
    dlg.querySelector('.p').onclick = function () { show(idx - 1); };
    dlg.querySelector('.nx').onclick = function () { show(idx + 1); };
    dlg.addEventListener('click', function (e) { if (e.target.classList.contains('lb-in')) dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  // "Do we cover your area?" checker
  d.querySelectorAll('form[data-areas]').forEach(function (f) {
    var areas = JSON.parse(f.dataset.areas), out = f.querySelector('output');
    var plain = function (s) { return s.toLowerCase().normalize('NFD').replace(/[^a-z0-9 ]/g, '').trim(); };
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = plain(f.querySelector('input').value);
      if (q.length < 2) { out.className = ''; out.textContent = 'Type your town or area, for example ' + areas[1] + '.'; return; }
      var hit = areas.filter(function (a) { var p = plain(a); return p.indexOf(q) > -1 || q.indexOf(p) > -1; })[0];
      out.className = hit || /dublin|^d ?\d/.test(q) ? 'yes' : '';
      out.textContent = hit ? 'Yes, we cover ' + hit + '. Ring ' + f.dataset.phone + ' for a free quote.'
        : /dublin|^d ?\d/.test(q) ? 'Yes, we cover all of Dublin. Ring ' + f.dataset.phone + ' for a free quote.'
        : 'We cover all of Dublin and the surrounding areas. Ring ' + f.dataset.phone + ' and we will confirm straight away.';
    });
  });

  // Problem finder
  d.querySelectorAll('[data-finder]').forEach(function (box) {
    var items = JSON.parse(box.dataset.finder), ans = box.querySelector('.answer');
    var btns = [].slice.call(box.querySelectorAll('.opts button'));
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        var it = items[i];
        ans.querySelector('h3').textContent = it.title;
        ans.querySelector('p').textContent = it.text;
        ans.querySelector('.more').href = it.href;
        ans.querySelector('.ask').href = 'https://wa.me/' + box.dataset.wa + '?text=' +
          encodeURIComponent('Hi, I would like a free quote. Problem: ' + it.label + '.');
        ans.hidden = false;
      });
    });
  });

  // Conversion events for Google Ads / Analytics (picked up by gtag or Tag Manager when installed).
  var track = function (name) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name });
    if (typeof window.gtag === 'function') window.gtag('event', name);
  };
  d.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="tel:"],a[href*="wa.me"]');
    if (a) track(a.href.indexOf('tel:') === 0 ? 'phone_click' : 'whatsapp_click');
  });

  // Quote form: posts to the form backend when one is configured, otherwise opens WhatsApp with the details filled in.
  d.querySelectorAll('form[data-quote]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = new FormData(f), rows = ['Quote request from ' + f.dataset.site], ok = f.querySelector('.form-ok');
      [['name', 'Name'], ['phone', 'Phone'], ['email', 'Email'], ['area', 'Area'], ['service', 'Service'], ['details', 'Details']]
        .forEach(function (p) { if (v.get(p[0])) rows.push(p[1] + ': ' + v.get(p[0])); });
      var done = function (msg) { ok.textContent = msg; ok.hidden = false; };
      var viaWhatsApp = function () {
        window.open('https://wa.me/' + f.dataset.wa + '?text=' + encodeURIComponent(rows.join('\n')), '_blank', 'noopener');
        done('Nearly there: press send in WhatsApp and we will ring you back. Urgent? Call ' + f.dataset.phone + '.');
      };
      track('quote_form_submit');
      if (!f.dataset.endpoint) return viaWhatsApp();
      fetch(f.dataset.endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: v })
        .then(function (r) {
          if (!r.ok) throw 0;
          f.reset();
          done('Thanks, we have your details and will ring you back shortly. Urgent? Call ' + f.dataset.phone + '.');
        })
        .catch(viaWhatsApp);
    });
  });
})();
