/* Fibralata® — scripts do site (sem dependências) */
(function () {
  var html = document.documentElement;
  html.classList.add('js');

  // Modo revisão: ?revisao ou #revisao destaca textos pendentes e imagens genéricas
  if (/[?&]revisao/.test(location.search) || location.hash === '#revisao') {
    html.classList.add('revisao');
    var bar = document.querySelector('.revisao-bar');
    if (bar) {
      var n = document.querySelectorAll('.pendente').length;
      var g = document.querySelectorAll('img[data-generica]').length;
      bar.querySelector('span').textContent = n + ' pendências de conteúdo · ' + g + ' imagens genéricas nesta página';
    }
  }

  // Eventos para GA4/GTM (dataLayer)
  window.dataLayer = window.dataLayer || [];
  function track(ev, params) { try { window.dataLayer.push(Object.assign({ event: ev }, params || {})); } catch (e) {} }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('wa.me') > -1 || href.indexOf('whatsapp') > -1) track('clique_whatsapp', { local: a.dataset.local || 'site' });
    else if (href.indexOf('tel:') === 0) track('clique_telefone');
    else if (href.indexOf('fibralatalojaonline') > -1) track('clique_loja', { produto: a.dataset.produto || '' });
    else if (href.indexOf('orcamento') > -1) track('clique_orcamento', { local: a.dataset.local || '' });
  });

  // Menu mobile
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('menu');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
    });
  }
  // Submenus (clique/teclado)
  document.querySelectorAll('.has-sub > .nav__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var li = btn.parentElement;
      var open = li.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.querySelectorAll('.has-sub.open').forEach(function (o) { if (o !== li) { o.classList.remove('open'); o.querySelector('.nav__btn').setAttribute('aria-expanded', 'false'); } });
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.has-sub.open').forEach(function (o) { o.classList.remove('open'); });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-sub')) document.querySelectorAll('.has-sub.open').forEach(function (o) { o.classList.remove('open'); });
  });

  // Revelação ao rolar (o que já está na tela aparece de imediato)
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight) el.classList.add('in'); else io.observe(el);
    });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  // Filtro do portfólio
  var filters = document.querySelectorAll('[data-filter]');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.dataset.filter;
      filters.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      document.querySelectorAll('[data-seg]').forEach(function (it) {
        it.hidden = !(f === 'todos' || it.dataset.seg === f);
      });
    });
  });

  // Formulário de orçamento: envia ao endpoint configurado (data-endpoint) ou monta mensagem de WhatsApp
  var form = document.querySelector('form[data-orcamento]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var data = new FormData(form);
      var endpoint = form.dataset.endpoint;
      var msgEl = form.querySelector('.form-msg');
      track('envio_orcamento', { segmento: data.get('segmento') || '' });
      if (endpoint) {
        fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (r) { if (!r.ok) throw new Error(); location.href = form.dataset.obrigado || 'obrigado/'; })
          .catch(function () { msgEl.hidden = false; msgEl.textContent = 'Não foi possível enviar agora. Use o botão de WhatsApp ou ligue (11) 4996-3131.'; });
        return;
      }
      var lines = ['*Pedido de orçamento — Fibralata*'];
      data.forEach(function (v, k) { if (v && k !== 'lgpd') lines.push('*' + k.replace(/_/g, ' ') + ':* ' + v); });
      var url = 'https://wa.me/5511933660977?text=' + encodeURIComponent(lines.join('\n'));
      msgEl.hidden = false;
      msgEl.innerHTML = 'Pronto! Abrimos o WhatsApp com seu pedido preenchido. Se não abriu, <a href="' + url + '" target="_blank" rel="noopener">toque aqui</a>.';
      window.open(url, '_blank', 'noopener');
    });
  }

  // Banner rotativo da Home
  var bn = document.querySelector('[data-banner]');
  if (bn) {
    var slides = bn.querySelectorAll('.banner__slide');
    var dots = bn.querySelectorAll('[data-go]');
    var cur = 0, timer = null, paused = matchMedia('(prefers-reduced-motion: reduce)').matches, hover = false;
    var DELAY = 6000;
    function show(i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        var on = k === cur;
        s.classList.toggle('is-active', on);
        if (on) { s.removeAttribute('aria-hidden'); s.removeAttribute('tabindex'); }
        else { s.setAttribute('aria-hidden', 'true'); s.setAttribute('tabindex', '-1'); }
        var img = s.querySelector('img'); if (on && img && img.loading === 'lazy') img.loading = 'eager';
      });
      dots.forEach(function (d, k) { d.setAttribute('aria-selected', k === cur ? 'true' : 'false'); });
    }
    function play() { stop(); if (!paused && !hover) timer = setInterval(function () { show(cur + 1); }, DELAY); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    bn.querySelector('[data-prev]').addEventListener('click', function () { show(cur - 1); play(); });
    bn.querySelector('[data-next]').addEventListener('click', function () { show(cur + 1); play(); });
    dots.forEach(function (d) { d.addEventListener('click', function () { show(+d.dataset.go); play(); }); });
    var pb = bn.querySelector('[data-pause]');
    function setPause(p) { paused = p; bn.classList.toggle('is-paused', p); pb.setAttribute('aria-label', p ? 'Retomar rotação' : 'Pausar rotação'); pb.firstElementChild.textContent = p ? '▶' : '❚❚'; play(); }
    pb.addEventListener('click', function () { setPause(!paused); });
    if (paused) setPause(true);
    bn.addEventListener('mouseenter', function () { hover = true; stop(); });
    bn.addEventListener('mouseleave', function () { hover = false; play(); });
    bn.addEventListener('focusin', function () { hover = true; stop(); });
    bn.addEventListener('focusout', function () { hover = false; play(); });
    // deslizar no celular
    var x0 = null;
    bn.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    bn.addEventListener('touchend', function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { show(cur + (dx < 0 ? 1 : -1)); play(); }
    });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : play(); });
    play();
  }

  // Ano no rodapé
  var y = document.querySelector('[data-ano]');
  if (y) y.textContent = new Date().getFullYear();
})();
