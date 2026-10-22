(() => {
  'use strict';

  const WHATSAPP = '5553981111858';
  const root = document.documentElement;
  root.classList.add('js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ---------- Header + botão flutuante ao rolar ---------- */
  const header = $('[data-header]');
  const floatBtn = $('.whatsapp-float');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    floatBtn.classList.toggle('is-visible', y > window.innerHeight * 0.6);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  const toggle = $('[data-menu-toggle]');
  const menu = $('#menu');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    $('.sr-only', toggle).textContent = open ? 'Fechar menu' : 'Abrir menu';
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      setMenu(false);
      toggle.focus();
    }
  });

  /* ---------- Link ativo no menu ---------- */
  const navLinks = $$('.nav ul a');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => navObserver.observe(s));

  /* ---------- Animações de entrada ---------- */
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  // escalona elementos irmãos para um efeito em cascata
  $$('.reveal').forEach((el) => {
    const siblings = $$(':scope > .reveal', el.parentElement);
    const i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty('--delay', `${Math.min(i, 5) * 0.08}s`);
    revealObserver.observe(el);
  });

  /* ---------- Contadores do hero ---------- */
  const countUp = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const format = (n) => n.toFixed(decimals).replace('.', ',');
    if (reduceMotion) return;
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = format(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  $$('[data-count]').forEach(countUp);

  /* ---------- Parallax suave no hero (desktop) ---------- */
  const cards = $$('.hero-card');
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    const hero = $('.hero');
    const depth = [12, -18, 24];
    const base = ['', 'rotate(4deg)', 'rotate(-5deg)'];
    hero.addEventListener('pointermove', (e) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      cards.forEach((c, i) => {
        c.style.transform = `translate3d(${x * depth[i]}px, ${y * depth[i]}px, 0) ${base[i]}`;
      });
    });
  }

  /* ---------- Filtros da galeria ---------- */
  const filters = $$('[data-filter]');
  const items = $$('.gallery-item');
  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.filter;
      filters.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      items.forEach((item) => {
        const show = tag === 'todos' || item.dataset.tags.split(' ').includes(tag);
        item.classList.toggle('is-hidden', !show);
        if (show && !reduceMotion) {
          item.classList.add('is-entering');
          requestAnimationFrame(() => requestAnimationFrame(() => item.classList.remove('is-entering')));
        }
      });
    });
  });

  /* ---------- Lightbox ---------- */
  const lb = $('[data-lightbox]');
  const lbImg = $('[data-lb-img]');
  const lbCaption = $('[data-lb-caption]');
  let current = 0;
  let lastFocus = null;

  const visibleButtons = () => $$('.gallery-item:not(.is-hidden) .gallery-btn');

  const show = (index) => {
    const list = visibleButtons();
    current = (index + list.length) % list.length;
    const btn = list[current];
    const img = $('img', btn);
    lbImg.src = btn.dataset.full;
    lbImg.alt = img.alt;
    lbCaption.textContent = $('.gallery-caption', btn).textContent;
  };

  const openLightbox = (btn) => {
    lastFocus = btn;
    show(visibleButtons().indexOf(btn));
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    $('[data-lb-close]').focus();
  };

  const closeLightbox = () => {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };

  $$('.gallery-btn').forEach((btn) => btn.addEventListener('click', () => openLightbox(btn)));
  $('[data-lb-close]').addEventListener('click', closeLightbox);
  $('[data-lb-prev]').addEventListener('click', () => show(current - 1));
  $('[data-lb-next]').addEventListener('click', () => show(current + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'Tab') {
      // mantém o foco dentro do lightbox
      const focusables = $$('button', lb);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // swipe no celular
  let touchX = null;
  lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- Vídeo: toca só quando visível ---------- */
  const video = $('[data-autoplay]');
  if (video) {
    if (reduceMotion) {
      video.controls = true;
    } else {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          video.preload = 'auto';
          video.play().catch(() => { video.controls = true; });
        } else {
          video.pause();
        }
      }, { threshold: 0.35 }).observe(video);
    }
  }

  /* ---------- Formulário → WhatsApp ---------- */
  const form = $('[data-quote-form]');
  const formError = $('[data-form-error]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const nome = data.get('nome').trim();
    const ideia = data.get('ideia').trim();

    const missing = [];
    [['nome', nome], ['ideia', ideia]].forEach(([name, value]) => {
      const field = form.elements[name];
      field.setAttribute('aria-invalid', String(!value));
      if (!value) missing.push(field);
    });
    if (missing.length) {
      formError.textContent = 'Preencha seu nome e conte um pouco da sua ideia.';
      missing[0].focus();
      return;
    }
    formError.textContent = '';

    const lines = [
      `Olá Pierre! Me chamo ${nome} e vim pelo site.`,
      '',
      `*Ideia:* ${ideia}`,
    ];
    if (data.get('local')) lines.push(`*Local do corpo:* ${data.get('local')}`);
    if (data.get('tamanho')) lines.push(`*Tamanho:* ${data.get('tamanho')}`);
    lines.push('', 'Vou enviar as referências por aqui.');

    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
    track('whatsapp-formulario');
    window.open(url, '_blank', 'noopener');
  });

  /* ---------- Rastreamento de cliques (GA4 / Meta Pixel, se instalados) ---------- */
  function track(label) {
    if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { method: label });
    if (typeof window.fbq === 'function') window.fbq('track', 'Contact', { content_name: label });
  }
  $$('[data-track]').forEach((el) => el.addEventListener('click', () => track(el.dataset.track)));

  /* ---------- Ano no rodapé ---------- */
  $('[data-year]').textContent = new Date().getFullYear();
})();
