/* =========================================================
   GM.PB — interactions du site
   Menu, menu mobile, recherche (Pagefind), filtres,
   formulaire de contact (Web3Forms), newsletter, article.
   ========================================================= */
(function () {
  'use strict';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- Menu déroulant « Catégories » ---------- */
  $all('.dropdown').forEach(function (dd) {
    var btn = $('.dropdown-toggle', dd);
    var panel = $('.dropdown-panel', dd);
    function close() { btn.setAttribute('aria-expanded', 'false'); panel.hidden = true; }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.hidden = open;
    });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { close(); btn.focus(); }
    });
  });

  /* ---------- Menu mobile ---------- */
  var burger = $('.js-burger');
  var mobileMenu = $('#mobile-menu');
  if (burger && mobileMenu) {
    var openIcon = burger.innerHTML;
    var closeIcon = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', open ? 'false' : 'true');
      burger.setAttribute('aria-label', open ? 'Ouvrir le menu' : 'Fermer le menu');
      burger.innerHTML = open ? openIcon : closeIcon;
      mobileMenu.hidden = open;
    });
    $all('.m-toggle', mobileMenu).forEach(function (t) {
      t.addEventListener('click', function () {
        var sub = document.getElementById(t.getAttribute('aria-controls'));
        var open = t.getAttribute('aria-expanded') === 'true';
        t.setAttribute('aria-expanded', open ? 'false' : 'true');
        $('.sign', t).textContent = open ? '+' : '−';
        sub.hidden = open;
      });
    });
    $all('a', mobileMenu).forEach(function (a) {
      a.addEventListener('click', function () { if (a.getAttribute('href').charAt(0) === '#') burger.click(); });
    });
  }

  /* ---------- Recherche (index Pagefind généré à chaque publication) ---------- */
  var overlay = $('#search');
  var input = $('#search-input');
  var results = $('.search-results');
  var countEl = $('.search-count');
  var lastFocus = null;
  var pagefind = null;
  var searchToken = 0;

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function loadPagefind() {
    if (pagefind) return Promise.resolve(pagefind);
    return import('/pagefind/pagefind.js').then(function (pf) {
      pagefind = pf;
      return pf.options ? pf.options({ excerptLength: 22 }).then(function () { return pf; }) : pf;
    });
  }
  function render(list) {
    results.innerHTML = list.map(function (r) {
      var track = (r.meta && r.meta.track) || '';
      var badge = track ? '<span class="badge badge-' + track + '">' + (track === 'gm' ? 'GRAND MARKETING' : 'PETIT BUDGET') + '</span>' : '';
      return '<li><a href="' + escapeHtml(r.url) + '"><span class="r-meta">' + badge + escapeHtml(r.meta && r.meta.category) + '</span>' +
        '<span class="r-title">' + escapeHtml(r.meta && r.meta.title) + '</span><span class="r-ex">' + (r.excerpt || '') + '</span></a></li>';
    }).join('');
  }
  function runSearch() {
    var q = input.value.trim();
    var token = ++searchToken;
    if (!q) { countEl.textContent = 'Tape un mot : fidélité, promo, Instagram…'; results.innerHTML = ''; return; }
    loadPagefind().then(function (pf) {
      return pf.debouncedSearch ? pf.debouncedSearch(q, {}, 150) : pf.search(q);
    }).then(function (search) {
      if (!search || token !== searchToken) return null;
      return Promise.all(search.results.slice(0, 10).map(function (r) { return r.data(); })).then(function (data) {
        if (token !== searchToken) return;
        var n = search.results.length;
        countEl.textContent = n ? n + ' article' + (n > 1 ? 's' : '') + ' trouvé' + (n > 1 ? 's' : '') : 'Aucun article ne correspond. Essaie un autre mot.';
        render(data);
      });
    }).catch(function () {
      countEl.textContent = 'La recherche sera disponible une fois le site publié.';
    });
  }
  function openSearch() {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    runSearch();
    loadPagefind().catch(function () {});
    setTimeout(function () { input.focus(); }, 30);
  }
  function closeSearch() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  if (overlay && input) {
    $all('.js-search-open').forEach(function (b) { b.addEventListener('click', openSearch); });
    $all('.js-search-close').forEach(function (b) { b.addEventListener('click', closeSearch); });
    input.addEventListener('input', runSearch);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSearch(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !overlay.hidden) closeSearch();
      var typing = /input|textarea|select/i.test((document.activeElement || {}).tagName || '');
      if (e.key === '/' && overlay.hidden && !typing) { e.preventDefault(); openSearch(); }
    });
  }

  /* ---------- Filtres de cartes (track et/ou catégorie, cumulables) ---------- */
  var gridState = {};
  function applyFilters(gridId) {
    var grid = document.getElementById(gridId);
    var state = gridState[gridId];
    var shown = 0;
    $all('.card', grid).forEach(function (card) {
      var ok = Object.keys(state.values).every(function (key) {
        var v = state.values[key];
        return v === 'all' || card.getAttribute('data-' + key) === v;
      });
      card.hidden = !ok;
      if (ok) shown++;
    });
    state.groups.forEach(function (g) {
      var count = document.getElementById(g.getAttribute('data-filter-count'));
      if (count) count.textContent = shown + ' article' + (shown > 1 ? 's' : '');
      var empty = document.getElementById(g.getAttribute('data-filter-empty'));
      if (empty) empty.hidden = shown > 0;
    });
  }
  $all('[data-filter-group]').forEach(function (group) {
    var key = group.getAttribute('data-filter-key');
    var gridId = group.getAttribute('data-filter-target');
    if (!document.getElementById(gridId)) return;
    var state = gridState[gridId] || (gridState[gridId] = { values: {}, groups: [] });
    state.groups.push(group);
    var chips = $all('.chip', group);
    var initial = new URLSearchParams(location.search).get(key);
    state.values[key] = chips.some(function (c) { return c.getAttribute('data-value') === initial; }) ? initial : 'all';
    function sync() { chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-value') === state.values[key] ? 'true' : 'false'); }); }
    chips.forEach(function (c) {
      c.addEventListener('click', function () { state.values[key] = c.getAttribute('data-value'); sync(); applyFilters(gridId); });
    });
    sync();
  });
  Object.keys(gridState).forEach(applyFilters);

  /* ---------- Formulaire de contact (Web3Forms) ---------- */
  var contact = $('#contact-form');
  if (contact) {
    var modeBtns = $all('.mode-switch button', contact);
    var devis = $('#devis-fields');
    var typeField = $('#c-type');
    var msgLabel = $('#msg-label');
    var submit = $('#contact-submit');
    var sent = $('#contact-sent');
    var sentText = $('#sent-text');
    var err = $('#contact-error');
    var mode = 'question';
    function setMode(m) {
      mode = m;
      modeBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mode') === m ? 'true' : 'false'); });
      if (devis) devis.hidden = m !== 'devis';
      if (typeField) typeField.value = m === 'devis' ? 'Demande de devis' : 'Question';
      msgLabel.textContent = (m === 'devis' ? 'Décris ton projet en quelques lignes' : 'Ton message') + ' *';
      submit.textContent = m === 'devis' ? 'Envoyer ma demande de devis' : 'Envoyer mon message';
    }
    modeBtns.forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); }); });
    if (modeBtns.length && new URLSearchParams(location.search).get('type') === 'devis') setMode('devis');

    contact.addEventListener('submit', function (e) {
      e.preventDefault();
      var required = $all('[required]', contact).filter(function (f) { return !f.closest('[hidden]'); });
      var bad = required.filter(function (f) { return f.type === 'checkbox' ? !f.checked : !f.value.trim() || !f.checkValidity(); });
      if (bad.length) {
        err.hidden = false;
        err.textContent = 'Il manque quelque chose : vérifie les champs obligatoires (*).';
        bad[0].focus();
        return;
      }
      if (!contact.getAttribute('data-key')) {
        err.hidden = false;
        err.textContent = 'Le formulaire n’est pas encore branché. Ajoute ta clé Web3Forms dans les réglages du site.';
        return;
      }
      err.hidden = true;
      submit.disabled = true;
      var label = submit.textContent;
      submit.textContent = 'Envoi en cours…';
      var data = new FormData(contact);
      $all('input, select, textarea', devis || document.createElement('div')).forEach(function (f) { if (devis && devis.hidden) data.delete(f.name); });
      fetch(contact.action, { method: 'POST', headers: { Accept: 'application/json' }, body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res.success) throw new Error(res.message || 'Erreur');
          sentText.textContent = mode === 'devis' ? 'Je regarde ton projet et je reviens vers toi avec une proposition.' : 'Je te réponds au plus vite.';
          contact.hidden = true;
          sent.hidden = false;
          sent.querySelector('h2').focus();
        })
        .catch(function () {
          err.hidden = false;
          err.textContent = 'Le message n’a pas pu partir. Réessaie dans un instant.';
        })
        .then(function () { submit.disabled = false; submit.textContent = label; });
    });
    var again = $('#contact-again');
    if (again) again.addEventListener('click', function () {
      contact.reset();
      if (modeBtns.length) setMode('question');
      sent.hidden = true;
      contact.hidden = false;
    });
  }

  /* ---------- Newsletter (quand elle sera activée) ---------- */
  $all('.js-newsletter').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var email = $('input[type="email"]', form);
      var msg = $('.form-msg', form);
      if (!email.value || !email.checkValidity()) {
        e.preventDefault();
        msg.hidden = false;
        msg.textContent = 'Vérifie ton adresse e-mail.';
        email.focus();
        return;
      }
      if (!form.getAttribute('action')) {
        e.preventDefault();
        msg.hidden = false;
        msg.textContent = 'La newsletter arrive bientôt !';
      }
    });
  });

  /* ---------- Article : barre de lecture, sommaire actif, copier le lien ---------- */
  var bar = $('.progress');
  var article = $('article');
  if (bar && article) {
    var onScroll = function () {
      var r = article.getBoundingClientRect();
      var total = article.offsetHeight - window.innerHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      bar.style.width = (p * 100) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  var tocLinks = $all('.js-toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) tocLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    tocLinks.forEach(function (a) { var t = document.getElementById(a.getAttribute('href').slice(1)); if (t) io.observe(t); });
  }
  $all('.js-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var done = function () { var t = btn.textContent; btn.textContent = 'Lien copié !'; setTimeout(function () { btn.textContent = t; }, 1800); };
      if (navigator.clipboard) { navigator.clipboard.writeText(location.href).then(done, done); } else { done(); }
    });
  });
})();
