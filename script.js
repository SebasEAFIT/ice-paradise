/* =========================================================
   UTILS
   ========================================================= */
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const lerp = (a,b,t) => a + (b - a) * t;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));

/* =========================================================
   LOADER
   ========================================================= */
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader').classList.add('done'), 1100);
});

/* =========================================================
   YEAR
   ========================================================= */
const yearEl = document.getElementById('year');
if(yearEl) yearEl.textContent = new Date().getFullYear();

/* =========================================================
   MINI-SCHEDULE — resalta el día actual
   ========================================================= */
(function highlightToday(){
  const today = new Date().getDay(); // 0=Dom, 1=Lun, … 6=Sáb
  const badge = document.querySelector(`.sch-day[data-day="${today}"]`);
  if(badge) badge.classList.add('is-today');
})();

/* =========================================================
   PAUSAR ANIMACIONES OFF-SCREEN — libera GPU/CPU
   ========================================================= */
(function pauseOffscreenAnims(){
  if(!('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll('.mix-card, .promo-card, .info-card-schedule');
  if(!targets.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      e.target.classList.toggle('anim-off', !e.isIntersecting);
    });
  }, {rootMargin: '120px 0px'});
  targets.forEach(t => io.observe(t));
})();

/* =========================================================
   FESTIVOS COLOMBIA — banner cuando aplica regla lunes festivo
   API: date.nager.at (gratis, sin auth). Cache 30 días en localStorage.
   ========================================================= */
(async function holidayBanner(){
  const banner = document.getElementById('schBanner');
  if(!banner) return;

  const year = new Date().getFullYear();
  const cacheKey = `co_holidays_${year}`;

  async function loadHolidays(){
    try{
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if(cached && cached.expires > Date.now()) return cached.data;
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/CO`);
      if(!res.ok) throw new Error('API no respondió');
      const data = await res.json();
      localStorage.setItem(cacheKey, JSON.stringify({
        data, expires: Date.now() + 1000*60*60*24*30 // 30 días
      }));
      return data;
    }catch(err){
      console.warn('Festivos CO no disponibles:', err);
      return [];
    }
  }

  // Parsea "YYYY-MM-DD" como fecha local (evita corrimiento UTC)
  function parseISODate(s){
    const [y,m,d] = s.split('-').map(Number);
    return new Date(y, m-1, d);
  }

  const holidays = await loadHolidays();
  if(!holidays.length) return;

  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);

  // Solo festivos que caen en lunes activan la regla
  const mondayFestivos = holidays
    .map(h => ({ name: h.localName, dt: parseISODate(h.date) }))
    .filter(h => h.dt.getDay() === 1);

  const todayIsFestMon = mondayFestivos.find(h => h.dt.getTime() === today.getTime());
  const tomorrowIsFestMon = mondayFestivos.find(h => h.dt.getTime() === tomorrow.getTime());

  if(todayIsFestMon){
    banner.innerHTML = `
      <span class="sch-banner-icon">🎉</span>
      <div>
        <strong>Hoy es ${todayIsFestMon.name}.</strong>
        Horario especial: abrimos <strong>5:00 pm – 1:00 am</strong>.
      </div>`;
    banner.hidden = false;
  } else if(tomorrowIsFestMon){
    banner.innerHTML = `
      <span class="sch-banner-icon">🎉</span>
      <div>
        <strong>Mañana es ${tomorrowIsFestMon.name}.</strong>
        Hoy abrimos <strong>6:00 pm – 2:00 am</strong>.
      </div>`;
    banner.hidden = false;
  }
})();

/* =========================================================
   NAVBAR scroll + scroll progress + particles fade
   ========================================================= */
const nav = document.getElementById('nav');
const progress = document.getElementById('scroll-progress');
const particlesCanvas = document.getElementById('particles');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if(nav) nav.classList.toggle('scrolled', y > 30);
  if(progress){
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = ((y / h) * 100) + '%';
  }
  if(particlesCanvas){
    const vh = window.innerHeight;
    const op = clamp(1 - (y / (vh*0.85)), 0, 1);
    particlesCanvas.style.opacity = op;
  }
}, {passive:true});

/* =========================================================
   BURGER mobile
   ========================================================= */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
if(burger && mobileMenu){
  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    mobileMenu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    mobileMenu.setAttribute('aria-hidden', !open);
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('open');
    mobileMenu.classList.remove('open');
  }));
}

/* =========================================================
   TABS — menú sabores (solo en landing principal)
   ========================================================= */
(function tabsInit(){
  const tabs = document.querySelectorAll('.tab');
  if(!tabs.length) return;
  // Detecta todos los paneles automáticamente (sin, con, cremosos, todos, …)
  const panes = {};
  document.querySelectorAll('.flavors-grid[data-pane]').forEach(p => {
    panes[p.dataset.pane] = p;
  });
  const todos = panes['todos'];
  if(todos){
    todos.innerHTML = Object.entries(panes)
      .filter(([k]) => k !== 'todos')
      .map(([,el]) => el.innerHTML)
      .join('');
  }
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    Object.values(panes).forEach(p => p.hidden = true);
    if(panes[t.dataset.tab]) panes[t.dataset.tab].hidden = false;
    bindTilt();
  }));
})();

/* =========================================================
   RENDER MENÚ desde data/menu.js
   - Tabla de precios por tamaño
   - Listas de bebidas, cervezas, licores
   - Neverita
   ========================================================= */
(function renderMenu(){
  const D = window.MENU_DATA;
  const fmt = window.MENU_FORMAT || (n => '$' + n);
  if(!D) return;

  // --- Tabla de precios por tamaño ---
  const tableEl = document.getElementById('priceTable');
  if(tableEl){
    const tipos = D.granizados;
    const sizes = ['12','16','22','32'];
    const cols = Object.values(tipos);
    let html = '<div class="pt-row pt-head"><div class="pt-cell pt-size">Tamaño</div>';
    cols.forEach(t => { html += `<div class="pt-cell">${t.label}</div>`; });
    html += '</div>';
    sizes.forEach(s => {
      html += `<div class="pt-row"><div class="pt-cell pt-size">${s} oz${s==='32'?' · litro':''}</div>`;
      cols.forEach(t => {
        const p = t.precios[s];
        html += `<div class="pt-cell pt-price">${p ? fmt(p) : '—'}</div>`;
      });
      html += '</div>';
    });
    tableEl.innerHTML = html;
  }

  // --- Neverita ---
  if(D.neverita){
    const pEl = document.getElementById('neveritaPrice');
    const nEl = document.getElementById('neveritaNote');
    if(pEl) pEl.textContent = fmt(D.neverita.desde);
    if(nEl && D.neverita.nota) nEl.textContent = D.neverita.nota;
  }

  // --- Listas (bebidas, cervezas, licores) ---
  function renderList(id, items){
    const ul = document.getElementById(id);
    if(!ul || !items) return;
    ul.innerHTML = items.map(it => `
      <li class="menu-extra-item">
        <div class="menu-extra-info">
          <span class="menu-extra-name">${it.nombre}</span>
          ${it.nota ? `<span class="menu-extra-note">${it.nota}</span>` : ''}
        </div>
        <span class="menu-extra-price">${fmt(it.precio)}</span>
      </li>
    `).join('');
  }
  renderList('listBebidas', D.bebidas);
  renderList('listOtros', D.otros);
  renderList('listCervezas', D.cervezas);
  renderList('listLicores', D.licores);
})();

/* =========================================================
   PARTICLES — copos/hielo
   ========================================================= */
(function particles(){
  const canvas = document.getElementById('particles');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const colors = ['#00F6FF','#40F8E3','#BFFDAA','#80FBC7','#FFFF8E','#FFFFFF'];
  let w,h,parts;

  function drawFlake(x,y,r,c,a,rot){
    ctx.globalAlpha = a;
    ctx.strokeStyle = c;
    ctx.fillStyle = c;
    ctx.lineWidth = 1;
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(rot);
    for(let i=0;i<6;i++){
      ctx.rotate(Math.PI/3);
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(0,r);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0,r*.55);
      ctx.lineTo(r*.25,r*.75);
      ctx.moveTo(0,r*.55);
      ctx.lineTo(-r*.25,r*.75);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = a*1.2;
    ctx.beginPath(); ctx.arc(x,y,1.2,0,Math.PI*2); ctx.fill();
  }

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const isMob = w < 768;
    const cap = isMob ? 45 : 130;
    const count = Math.min(cap, Math.floor(w*h/(isMob ? 18000 : 12500)));
    parts = Array.from({length:count}, () => {
      const type = Math.random() < 0.35 ? 'flake' : 'dot';
      return {
        type,
        x: Math.random()*w,
        y: Math.random()*h,
        r: type==='flake' ? 4+Math.random()*7 : 1+Math.random()*2.6,
        vy: 0.15 + Math.random()*0.85,
        vx: (Math.random()-0.5)*0.45,
        c: colors[Math.floor(Math.random()*colors.length)],
        a: 0.35 + Math.random()*0.55,
        rot: Math.random()*Math.PI*2,
        vr: (Math.random()-0.5)*0.02,
        sway: Math.random()*Math.PI*2,
        swaySp: 0.005 + Math.random()*0.012
      };
    });
  }
  resize();
  window.addEventListener('resize', resize);
  const FADE = 80;
  function edgeAlpha(x,y){
    const dx = Math.min(x, w - x);
    const dy = Math.min(y, h - y);
    const d = Math.min(dx, dy);
    if(d >= FADE) return 1;
    if(d <= 0) return 0;
    return d / FADE;
  }
  (function loop(){
    ctx.clearRect(0,0,w,h);
    parts.forEach(p => {
      p.sway += p.swaySp;
      p.x += p.vx + Math.sin(p.sway)*0.4;
      p.y += p.vy;
      p.rot += p.vr;
      if(p.y > h+FADE){ p.y = -FADE; p.x = Math.random()*w; }
      if(p.x < -FADE) p.x = w+FADE;
      if(p.x > w+FADE) p.x = -FADE;
      const fade = edgeAlpha(p.x, p.y);
      const alpha = p.a * fade;
      if(alpha < 0.01) return;
      if(p.type==='flake'){
        drawFlake(p.x,p.y,p.r,p.c,alpha*0.9,p.rot);
      } else {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      }
    });
    requestAnimationFrame(loop);
  })();
})();

/* =========================================================
   CURSOR + trail
   ========================================================= */
let cursorOuter, cursorDot;
let mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
let outerX = mouseX, outerY = mouseY;
let dotX = mouseX, dotY = mouseY;
let lastTrail = 0;

if(!isTouch){
  cursorOuter = document.querySelector('.cursor-outer');
  cursorDot = document.querySelector('.cursor-dot');
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    const now = performance.now();
    if(now - lastTrail > 100){
      lastTrail = now;
      emitTrail(e.clientX, e.clientY);
    }
  });
  (function loop(){
    outerX = lerp(outerX, mouseX, 0.18);
    outerY = lerp(outerY, mouseY, 0.18);
    dotX = lerp(dotX, mouseX, 0.42);
    dotY = lerp(dotY, mouseY, 0.42);
    if(cursorOuter){
      cursorOuter.style.transform = `translate(${outerX}px,${outerY}px) translate(-50%,-50%)`;
      cursorDot.style.transform   = `translate(${dotX}px,${dotY}px) translate(-50%,-50%)`;
    }
    requestAnimationFrame(loop);
  })();

  const hoverSel = 'a, button, [data-magnetic], .flavor-card, .value-card, .size-card, .mix-card, .tab';
  document.querySelectorAll(hoverSel).forEach(el => {
    el.addEventListener('mouseenter', () => cursorOuter.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursorOuter.classList.remove('hover'));
  });
}

function emitTrail(x,y){
  const colors = ['#00F6FF','#40F8E3','#BFFDAA','#FFFF8E'];
  const n = 1;
  for(let i=0;i<n;i++){
    const t = document.createElement('div');
    t.className = 'trail';
    const size = 3 + Math.random()*5;
    t.style.width = t.style.height = size+'px';
    t.style.background = colors[Math.floor(Math.random()*colors.length)];
    t.style.left = x + (Math.random()-0.5)*8 + 'px';
    t.style.top  = y + (Math.random()-0.5)*8 + 'px';
    t.style.boxShadow = '0 0 8px currentColor';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 600);
  }
}

/* =========================================================
   RIPPLE on click
   ========================================================= */
document.addEventListener('click', e => {
  if(e.target.closest('iframe,input,textarea,select')) return;
  const r = document.createElement('div');
  r.className = 'ripple';
  r.style.left = e.clientX + 'px';
  r.style.top = e.clientY + 'px';
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 700);
});

/* =========================================================
   PARALLAX mouse multicapa
   ========================================================= */
const parallaxEls = document.querySelectorAll('[data-parallax]');
let tx = 0, ty = 0, cx = 0, cy = 0;
if(!isTouch){
  document.addEventListener('mousemove', e => {
    tx = (e.clientX / window.innerWidth  - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  (function loop(){
    cx = lerp(cx, tx, 0.07);
    cy = lerp(cy, ty, 0.07);
    parallaxEls.forEach(el => {
      const f = parseFloat(el.dataset.parallax) || 0.02;
      const offX = cx * f * 100;
      const offY = cy * f * 100;
      el.style.transform = `translate3d(${offX}px, ${offY}px, 0)`;
    });
    document.querySelectorAll('[data-orbit]').forEach((el,i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      el.style.transform = `translate(${cx*8*dir}px, ${cy*8*dir}px)`;
    });
    requestAnimationFrame(loop);
  })();
}

/* =========================================================
   TILT 3D cards
   ========================================================= */
function bindTilt(){
  document.querySelectorAll('[data-tilt]').forEach(card => {
    if(card.dataset.tiltBound) return;
    card.dataset.tiltBound = '1';
    card.addEventListener('mousemove', e => {
      if(isTouch) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      const rotateX = y * -14;
      const rotateY = x *  14;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.04)`;
      card.style.setProperty('--mx', ((e.clientX - rect.left)/rect.width*100)+'%');
      card.style.setProperty('--my', ((e.clientY - rect.top)/rect.height*100)+'%');
      card.style.setProperty('--r', '260px');
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}
bindTilt();

/* =========================================================
   MAGNETIC buttons
   ========================================================= */
document.querySelectorAll('[data-magnetic]').forEach(btn => {
  if(isTouch) return;
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top  + rect.height/2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if(dist < 90){
      btn.style.transform = `translate(${dx*0.25}px,${dy*0.25}px)`;
    }
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

/* =========================================================
   VIDEO BG — autoplay loop muted (kick para iOS si falla)
   ========================================================= */
(function videoLoop(){
  const v = document.getElementById('bgVideo');
  if(!v) return;
  const tryPlay = () => { const p = v.play(); if(p && p.catch) p.catch(()=>{}); };
  tryPlay();
  ['click','touchstart','scroll'].forEach(ev =>
    window.addEventListener(ev, tryPlay, {once:true, passive:true})
  );
})();

/* =========================================================
   GSAP — entrance animations + scroll triggers
   ========================================================= */
window.addEventListener('load', () => {
  if(typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  if(document.querySelector('.nav'))
    gsap.from('.nav', {y:-80, opacity:0, duration:.8, ease:'power3.out'});

  if(document.querySelector('.hero-title'))
    gsap.from('.hero-title', {y:40, duration:.9, ease:'power3.out', delay:.2, clearProps:'transform'});
  if(document.querySelector('.hero-subtitle'))
    gsap.from('.hero-subtitle', {y:30, opacity:0, duration:.7, ease:'power3.out', delay:1.0});
  if(document.querySelector('.hero-cta'))
    gsap.from('.hero-cta', {y:30, opacity:0, duration:.7, ease:'power3.out', delay:1.2});
  if(document.querySelector('.hero-glass-svg'))
    gsap.from('.hero-glass-svg', {x:80, opacity:0, duration:1, ease:'power3.out', delay:0.6});
  if(document.querySelector('.scroll-indicator'))
    gsap.from('.scroll-indicator', {opacity:0, duration:.6, delay:1.6});

  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 60, opacity: 0, duration: .7, ease:'power3.out',
      scrollTrigger:{trigger: el, start:'top 85%'}
    });
  });

  gsap.utils.toArray('.section-title').forEach(el => {
    gsap.from(el, {
      y: 40, opacity: 0, duration: .8, ease:'power3.out',
      scrollTrigger:{trigger: el, start:'top 90%'}
    });
  });

  if(document.querySelector('.hero-bg-blob'))
    gsap.to('.hero-bg-blob', {
      yPercent: 20, ease:'none',
      scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:true}
    });
  if(document.querySelector('.hero-glass-svg'))
    gsap.to('.hero-glass-svg', {
      yPercent: -25, ease:'none',
      scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:true}
    });
});
