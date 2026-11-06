// 千景建設 専用の動き
// 主役：安全テープの幕（初回だけ・1秒未満）→ ステンシル文字。あとは「左から組み上がる」と「線画が引かれる」だけ。
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- 動きがなくても使えるもの ----------
  // ビフォーアフター：つまみで改修前の写真の幅を変える
  $$('.ba_box').forEach((box) => {
    const range = $('.ba_range', box), before = $('.ba_before', box), handle = $('.ba_handle', box);
    const set = () => { const v = range.value; before.style.clipPath = `inset(0 ${100 - v}% 0 0)`; handle.style.transform = `translateX(${v}cqw)`; };
    range.addEventListener('input', set); set();
  });

  // 施工実績の絞り込み
  const fBtns = $$('.filter button');
  fBtns.forEach((b) => b.addEventListener('click', () => {
    fBtns.forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
    const k = b.dataset.filter;
    $$('.works--page .works_grid li').forEach((li) => { li.hidden = k !== 'all' && li.dataset.kind !== k; });
    window.ScrollTrigger && ScrollTrigger.refresh();  // 高さが変わるので、下の出現位置を測り直す
  }));

  // 動画カード：押すと再生／停止
  $$('.movie_card').forEach((c) => c.addEventListener('click', () => {
    const v = $('video', c);
    if (v.paused) { v.play(); c.classList.add('is-playing'); } else { v.pause(); c.classList.remove('is-playing'); }
  }));

  // 幕：同じタブで2回目以降は出さない
  const curtain = $('.curtain');
  let seen = false;
  try { seen = sessionStorage.getItem('chikage-seen') === '1'; sessionStorage.setItem('chikage-seen', '1'); } catch (e) {}
  if (seen && curtain) curtain.remove();

  if (!window.gsap || !window.ScrollTrigger || reduced) {
    document.documentElement.classList.remove('js'); curtain && curtain.remove(); return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // ステンシル文字を1文字ずつに分ける
  $$('[data-stencil]').forEach((el) => {
    el.setAttribute('aria-label', el.textContent);
    el.innerHTML = [...el.textContent].map((c) => `<span class="ch" aria-hidden="true">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  });

  const header = $('.header');
  const top = $('.hero, .subhero');
  ScrollTrigger.create({ trigger: top, start: 'bottom 80px', onEnter: () => header.classList.add('is-solid'), onLeaveBack: () => header.classList.remove('is-solid') });
  const bar = $('.spBar'), end = $('.contact') || $('.footer');
  ScrollTrigger.create({ trigger: top, start: 'bottom 70%', endTrigger: end, end: 'top bottom', onToggle: (s) => bar.classList.toggle('is-on', s.isActive) });

  // ステンシル：吹き付けのように、カクッと順に現れる
  const stencil = (els, delay = 0) => gsap.to([].concat(els).flatMap((e) => $$('.ch', e)), { opacity: 1, duration: 0.01, stagger: 0.035, delay, ease: 'none' });
  // 組み上がる：左から右へ切り抜きが開く
  const build = (els, delay = 0) => gsap.to(els, { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'power3.out', stagger: 0.08, delay, overwrite: true,
    onComplete: () => [].concat(els).forEach((e) => { e.classList.add('is-built'); e.style.clipPath = ''; }) });  // 年表のひし形など、はみ出す飾りを切らないように最後に外す

  // ---------- 開くとき ----------
  const tl = gsap.timeline();
  let t = 0;
  if (curtain && !seen) {
    tl.to('.curtain_tape', { scaleX: 1, duration: 0.35, ease: 'power3.out' })
      .to('.curtain', { clipPath: 'inset(0 0 100% 0)', duration: 0.45, ease: 'power3.inOut', onComplete: () => curtain.remove() }, 0.42);
    t = 0.7;
  } else if (curtain) curtain.remove();

  const hero = $('.hero') || $('.subhero');
  const heroStencil = $$('[data-stencil]', hero), heroBuild = $$('[data-build]', hero);
  tl.add(() => stencil(heroStencil), t).add(() => build(heroBuild, 0.25), t);
  if ($('.hero_media')) tl.fromTo('.hero_media', { scale: 1.08 }, { scale: 1, duration: 1.6, ease: 'power2.out' }, Math.max(0, t - 0.3));

  // ---------- スクロールで出てくるもの ----------
  ScrollTrigger.batch($$('[data-build]').filter((el) => !hero.contains(el)), { start: 'top 88%', once: true, onEnter: (els) => build(els) });
  $$('[data-stencil]').filter((el) => !hero.contains(el)).forEach((el) => ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => stencil(el) }));

  // 寸法線：線が伸びてから数字が出る
  $$('.dim').forEach((d) => gsap.timeline({ scrollTrigger: { trigger: d, start: 'top 90%', once: true } })
    .to($('i', d), { scaleX: 1, duration: 0.6, ease: 'power3.out', delay: 0.2 }).to($('b', d), { opacity: 1, duration: 0.3 }, '-=0.15'));

  // 線画の重機：見えたら線が引かれていく
  $$('[data-draw]').forEach((svg) => {
    const host = svg.querySelector('use') ? $(svg.querySelector('use').getAttribute('href')) : svg;
    const clone = host.cloneNode(true);  // <use> の中は動かせないので、中身を直接置く
    svg.setAttribute('viewBox', host.getAttribute('viewBox')); svg.innerHTML = clone.innerHTML;
    const paths = $$('path', svg);
    // 線の太さを画面上でそろえているので、線の長さも画面上の長さで測る
    const vb = svg.viewBox.baseVal, r = svg.getBoundingClientRect();
    const k = Math.min(r.width / vb.width, r.height / vb.height) || 1;
    paths.forEach((p) => { p.removeAttribute('pathLength'); const L = Math.ceil(p.getTotalLength() * k) + 2; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    gsap.to(paths, { strokeDashoffset: 0, duration: 1.4, ease: 'power1.inOut', stagger: 0.12, scrollTrigger: { trigger: svg, start: 'top 85%', once: true } });
  });

  // 数字の数え上げ＋進み具合のメーター
  $$('[data-count]').forEach((el) => {
    const n = Number(el.dataset.count), plain = el.hasAttribute('data-plain'), o = { v: plain ? n - 60 : 0 };
    const fmt = (v) => (plain ? String(Math.round(v)) : Math.round(v).toLocaleString('ja-JP'));
    el.textContent = fmt(o.v);
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => gsap.to(o, { v: n, duration: 1.1, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v); } }) });
  });
  $$('.meter i').forEach((m) => gsap.to(m, { scaleX: Number(getComputedStyle(m).getPropertyValue('--to')), duration: 1.1, ease: 'power2.out', scrollTrigger: { trigger: m, start: 'top 90%', once: true } }));

  // あゆみ：縦線が上から伸びる
  const tll = $('.timeline_line');
  if (tll) gsap.to(tll, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 75%', end: 'bottom 60%', scrub: 0.4 } });

  // クレーンのフックは、見えている間だけ揺れる（CSS）
  const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting)));
  $$('.about_crane').forEach((el) => io.observe(el));

  addEventListener('load', () => ScrollTrigger.refresh());
})();
