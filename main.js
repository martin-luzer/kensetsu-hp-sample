(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger) { document.documentElement.classList.remove('js'); return; }
  gsap.registerPlugin(ScrollTrigger);

  // なめらかなスクロール
  if (!reduced && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -64, duration: 1.2 });
      });
    });
  }

  // ヘッダーとスマホの帯
  const header = document.querySelector('.header');
  const hero = document.querySelector('.hero');
  if (header && hero) ScrollTrigger.create({ trigger: hero, start: 'bottom 80px', onEnter: () => header.classList.add('is-solid'), onLeaveBack: () => header.classList.remove('is-solid') });
  const bar = document.querySelector('.spBar');
  const end = document.querySelector('[data-bar-end]');
  if (bar && hero) ScrollTrigger.create({ trigger: hero, start: 'bottom 70%', endTrigger: end || 'body', end: end ? 'top bottom' : 'bottom bottom', onToggle: (s) => bar.classList.toggle('is-on', s.isActive) });

  if (reduced) return;

  // 開くとき：[data-open] を順番に出す（data-open の数字が順番）
  const opens = [...document.querySelectorAll('[data-open]')].sort((a, b) => a.dataset.open - b.dataset.open);
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  const photo = document.querySelector('[data-open-photo]');
  if (photo) {
    tl.fromTo(photo, { clipPath: 'inset(12% 12% 12% 12%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power4.inOut', clearProps: 'clipPath' }, 0)
      .fromTo(photo.querySelector('img'), { scale: 1.18 }, { scale: 1, duration: 2.2 }, 0);
  }
  opens.forEach((el, i) => tl.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 }, 0.45 + i * 0.12));
  if (header) tl.to(header, { opacity: 1, duration: 0.8, ease: 'sine.out' }, 0.9);

  // 出てくる動き（<form> は length を持ち GSAP に中身として開かれるので、必ず <div> などに付ける）
  const up = (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, overwrite: true });
  document.querySelectorAll('[data-each]').forEach((g) => {
    const kids = g.querySelectorAll(':scope > [data-up]');
    ScrollTrigger.create({ trigger: g, start: 'top 85%', once: true, onEnter: () => up(kids) });
  });
  document.querySelectorAll('[data-up]').forEach((el) => {
    if (el.parentElement.hasAttribute('data-each')) return;
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => up(el) });
  });

  // 数字を数え上げる
  document.querySelectorAll('[data-count]').forEach((el) => {
    const endV = Number(el.dataset.count); const o = { v: 0 }; el.textContent = '0';
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => gsap.to(o, { v: endV, duration: 1.4, ease: 'power2.out', onUpdate: () => { el.textContent = 'plain' in el.dataset ? Math.round(o.v) : Math.round(o.v).toLocaleString(); } }) });
  });

  // 写真：下から幕が上がる
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    const st = { trigger: el, start: 'top 82%', once: true };
    gsap.fromTo(el, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.3, ease: 'power4.inOut', clearProps: 'clipPath', scrollTrigger: st });
    const img = el.querySelector('img'); if (img) gsap.fromTo(img, { scale: 1.15 }, { scale: 1, duration: 2, ease: 'power3.out', scrollTrigger: st });
  });

  // 写真がゆっくり上下（奥行き）
  gsap.utils.toArray('[data-parallax]').forEach((el) => {
    gsap.fromTo(el, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // 流れる文字の帯
  gsap.utils.toArray('[data-marquee]').forEach((el) => {
    const inner = el.firstElementChild; inner.innerHTML += inner.innerHTML;
    gsap.to(inner, { xPercent: -50, ease: 'none', duration: Number(el.dataset.marquee) || 30, repeat: -1 });
  });

  // 線がスクロールに合わせて伸びる
  gsap.utils.toArray('[data-grow]').forEach((el) => {
    gsap.fromTo(el, { scaleY: 0 }, { scaleY: 1, ease: 'none', transformOrigin: 'top', scrollTrigger: { trigger: el.parentElement, start: 'top 70%', end: 'bottom 60%', scrub: 0.4 } });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
