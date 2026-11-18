// Shared behaviour for the client sites: mobile menu, scroll reveal, lightbox, quote form.
(function () {
  var d = document;
  d.documentElement.classList.add('js');

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
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

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

  // Quote form: no backend, so the request is handed to WhatsApp or the visitor's email app.
  d.querySelectorAll('form[data-quote]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = new FormData(f), rows = ['Quote request from ' + f.dataset.site];
      [['name', 'Name'], ['phone', 'Phone'], ['email', 'Email'], ['area', 'Area'], ['service', 'Service'], ['details', 'Details']]
        .forEach(function (p) { if (v.get(p[0])) rows.push(p[1] + ': ' + v.get(p[0])); });
      var text = encodeURIComponent(rows.join('\n'));
      if (e.submitter && e.submitter.value === 'email')
        location.href = 'mailto:' + f.dataset.email + '?subject=' + encodeURIComponent('Quote request') + '&body=' + text;
      else window.open('https://wa.me/' + f.dataset.wa + '?text=' + text, '_blank', 'noopener');
      f.querySelector('.form-ok').hidden = false;
    });
  });
})();
