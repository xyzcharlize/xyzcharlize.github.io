const elements = [...document.querySelectorAll<HTMLDivElement>('.space-unicorn')];
const trail = document.querySelector<HTMLDivElement>('.space-unicorn-trail');
const control = document.querySelector<HTMLButtonElement>('.space-unicorn-control');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const TARGETS =
  'main h1, main h2, main h3, main img, main article, main .section-head, main .btn, main .note-title, footer p';
const HOPPER_LINES = [
  'to the focus!',
  'phi grid vibes',
  'own the outcome',
  'teach the new workflow',
  'denim + gold',
  'neigh',
];
const FLYER_LINES = [
  'stripes, airborne',
  'just gliding',
  'paws off the page',
  'keep up, horn',
  'along the spiral',
  'a soft rawr',
];

const W = 96;
const H = 86;

type Point = { x: number; y: number };
type Perch = { el: Element; dx: number; dy: number };
type Flight = { from: Point; target: Perch; start: number; duration: number; strides: number };
type Unicorn = {
  el: HTMLDivElement;
  sprite: HTMLImageElement;
  bubble: HTMLDivElement;
  flyer: boolean;
  key: string;
  pos: Point;
  previous: Point;
  perch: Perch | null;
  flight: Flight | null;
  face: number;
  nextHop: number;
  bubbleTimer: number;
  parkTimer: number;
  parked: boolean;
};

if (elements.length === 2 && control) {
  const storedParked = (key: string) => {
    try {
      return sessionStorage.getItem(key) !== '0';
    } catch {
      return true;
    }
  };

  const unicorns: Unicorn[] = elements.map((el, index) => ({
    el,
    sprite: el.querySelector<HTMLImageElement>('.space-unicorn__sprite')!,
    bubble: el.querySelector<HTMLDivElement>('.space-unicorn__bubble')!,
    flyer: el.dataset.kind === 'flyer',
    key: index === 0 ? 'space-unicorn-parked' : 'space-unicorn-flyer-parked',
    pos: { x: index === 0 ? innerWidth - W - 28 : 28, y: innerHeight + 40 },
    previous: { x: 0, y: innerHeight + 40 },
    perch: null,
    flight: null,
    face: index === 0 ? -1 : 1,
    nextHop: performance.now() + 900 + index * 700,
    bubbleTimer: 0,
    parkTimer: 0,
    parked: storedParked(index === 0 ? 'space-unicorn-parked' : 'space-unicorn-flyer-parked'),
  }));

  let frame = 0;
  let pausedAt: number | null = performance.now();

  const scale = () => (innerWidth <= 640 ? 0.72 : 1);
  const headerBottom = () =>
    Math.max(0, document.querySelector('header')?.getBoundingClientRect().bottom ?? 0);
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(value, Math.max(min, max)));

  const landingPoint = (bot: Unicorn, perch: Perch): Point => {
    const r = perch.el.getBoundingClientRect();
    const s = scale();
    return {
      x: clamp(r.left + perch.dx, 12, innerWidth - W * s - 12),
      y: clamp(
        r.top + perch.dy - (bot.flyer ? H * s * 0.95 : H * s * 0.55),
        headerBottom() + 18,
        innerHeight - H * s - 12,
      ),
    };
  };

  const isUsable = (node: Element) => {
    const r = node.getBoundingClientRect();
    const s = scale();
    if (r.width < 64 || r.height < 12 || r.top < headerBottom() + H * s + 8 || r.top > innerHeight - 24)
      return false;
    if (r.right < 0 || r.left > innerWidth) return false;
    const style = getComputedStyle(node);
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0.1;
  };

  const pickPerch = (bot: Unicorn): Perch | null => {
    const visible = [...document.querySelectorAll(TARGETS)].filter(isUsable);
    const alternatives = visible.filter((node) => node !== bot.perch?.el);
    const candidates = alternatives.length ? alternatives : visible;
    if (!candidates.length) return null;
    const scored = candidates
      .map((node) => {
        const r = node.getBoundingClientRect();
        return {
          el: node,
          score: Math.random() * 400 + Math.min(Math.hypot(r.left - bot.pos.x, r.top - bot.pos.y), 500),
        };
      })
      .sort((a, b) => b.score - a.score);

    for (const { el: node } of scored) {
      const r = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const size = parseFloat(style.fontSize);
      const line = parseFloat(style.lineHeight) || size * 1.2;
      const dy = /^H[1-6]$/.test(node.tagName) ? Math.max(0, (line - size) / 2 + size * 0.14) : 0;
      const span = Math.max(0, Math.min(r.width, innerWidth) - W * scale());
      for (const dx of [Math.random() * span, 0, span]) {
        const perch = { el: node, dx, dy };
        const to = landingPoint(bot, perch);
        if (
          unicorns.every(
            (other) => other === bot || other.parked || Math.abs(to.x - other.pos.x) > 150 * scale(),
          )
        ) {
          return perch;
        }
      }
    }
    return null;
  };

  const launch = (bot: Unicorn, now: number) => {
    const target = pickPerch(bot);
    if (!target) {
      bot.nextHop = now + 1200;
      return;
    }
    const to = landingPoint(bot, target);
    const distance = Math.hypot(to.x - bot.pos.x, to.y - bot.pos.y);
    bot.flight = {
      from: { ...bot.pos },
      target,
      start: now,
      duration: Math.min(4200, 1400 + distance * 2.6),
      strides: Math.max(2, Math.round(distance / 220)),
    };
    bot.perch = null;
    bot.el.dataset.state = 'flying';
  };

  const spark = (bot: Unicorn, x: number, y: number) => {
    if (!trail) return;
    const dot = document.createElement('span');
    dot.className = 'space-unicorn-spark';
    dot.style.setProperty('--spark', bot.flyer ? '#e8a04a' : '#f3b6d8');
    dot.style.setProperty('--drift', `${bot.face > 0 ? -18 : 18}px`);
    dot.style.left = `${Math.round(x)}px`;
    dot.style.top = `${Math.round(y)}px`;
    trail.append(dot);
    window.setTimeout(() => dot.remove(), 900);
  };

  const render = (bot: Unicorn, tilt = 0) => {
    bot.el.style.transform = `translate3d(${Math.round(bot.pos.x)}px, ${Math.round(bot.pos.y)}px, 0) scale(${scale()})`;
    bot.sprite.style.transform = `scaleX(${bot.face}) rotate(${tilt}deg)`;
  };

  const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

  const move = (bot: Unicorn, now: number) => {
    bot.previous = { ...bot.pos };
    if (bot.flight) {
      const flight = bot.flight;
      if (!flight.target.el.isConnected || !isUsable(flight.target.el)) {
        bot.flight = null;
        launch(bot, now);
        return;
      }
      const t = Math.min(1, (now - flight.start) / flight.duration);
      const e = ease(t);
      const to = landingPoint(bot, flight.target);
      const stride = (t * flight.strides) % 1;
      const s = scale();
      const cruise = clamp(
        Math.min(flight.from.y, to.y) - (bot.flyer ? 46 : 24),
        headerBottom() + 18,
        innerHeight - H * s - 12,
      );
      const rising = Math.min(1, t * flight.strides);
      const level = flight.from.y + (cruise - flight.from.y) * Math.min(1, rising);
      const landing = Math.max(0, t - (1 - 1 / flight.strides)) * flight.strides;
      const baseY = level + (to.y - level) * landing;
      const leap = Math.sin(stride * Math.PI) * (bot.flyer ? 58 : 44);
      bot.pos = {
        x: flight.from.x + (to.x - flight.from.x) * e,
        y: baseY - leap,
      };
      const vx = bot.pos.x - bot.previous.x;
      if (Math.abs(vx) > 0.3) bot.face = vx > 0 ? 1 : -1;
      const rock = Math.sin(stride * Math.PI * 2) * 9;
      render(bot, -rock * bot.face);
      if (Math.random() < 0.16) {
        const s = scale();
        spark(bot, bot.pos.x + (bot.face > 0 ? 6 : W * s - 6), bot.pos.y + H * s * 0.42);
      }
      if (t >= 1) {
        bot.perch = flight.target;
        bot.flight = null;
        bot.el.dataset.state = bot.flyer ? 'hovering' : 'idle';
        bot.nextHop = now + 2600 + Math.random() * 3200;
      }
    } else if (bot.perch) {
      if (!bot.perch.el.isConnected || !isUsable(bot.perch.el)) launch(bot, now);
      else {
        bot.pos = landingPoint(bot, bot.perch);
        render(bot);
        if (now >= bot.nextHop) launch(bot, now);
      }
    } else if (now >= bot.nextHop) launch(bot, now);
  };

  const tick = (now: number) => {
    frame = 0;
    unicorns.filter((bot) => !bot.parked).forEach((bot) => move(bot, now));
    frame = requestAnimationFrame(tick);
  };

  const syncControl = () => {
    const allParked = unicorns.every((bot) => bot.parked);
    control.textContent = allParked ? 'Play the mascots' : 'Park unicorns';
    control.setAttribute('aria-pressed', String(allParked));
    control.hidden = reducedMotion.matches;
  };

  const syncPlayback = () => {
    const now = performance.now();
    const paused = document.hidden || reducedMotion.matches || unicorns.every((bot) => bot.parked);
    for (const bot of unicorns) bot.el.toggleAttribute('data-paused', document.hidden || reducedMotion.matches);
    if (paused) {
      if (pausedAt === null) pausedAt = now;
      cancelAnimationFrame(frame);
      frame = 0;
      trail?.replaceChildren();
    } else if (!frame) {
      const elapsed = pausedAt === null ? 0 : now - pausedAt;
      for (const bot of unicorns) {
        if (bot.flight) bot.flight.start += elapsed;
        bot.nextHop += elapsed;
      }
      pausedAt = null;
      frame = requestAnimationFrame(tick);
    }
    syncControl();
  };

  const setParked = (bot: Unicorn, parked: boolean) => {
    bot.parked = parked;
    bot.el.toggleAttribute('data-parked', parked);
    try {
      sessionStorage.setItem(bot.key, parked ? '1' : '0');
    } catch {
      /* parking still works in memory */
    }
    if (!parked) {
      bot.flight = null;
      bot.perch = null;
    }
    trail?.replaceChildren();
    syncPlayback();
    if (!parked) bot.nextHop = performance.now() + 300;
  };

  const say = (bot: Unicorn, text: string) => {
    bot.bubble.textContent = text;
    bot.bubble.dataset.show = '';
    const halfWidth = (bot.bubble.offsetWidth * scale()) / 2;
    const center = bot.pos.x + (W * scale()) / 2;
    bot.bubble.style.marginLeft = `${(clamp(center, halfWidth + 8, innerWidth - halfWidth - 8) - center) / scale()}px`;
    clearTimeout(bot.bubbleTimer);
    bot.bubbleTimer = window.setTimeout(() => delete bot.bubble.dataset.show, 1800);
  };

  for (const bot of unicorns) {
    bot.el.toggleAttribute('data-parked', bot.parked);
    bot.el.dataset.state = 'flying';
    bot.el.dataset.ready = '';
    render(bot);
    bot.el.addEventListener('click', () => {
      const lines = bot.flyer ? FLYER_LINES : HOPPER_LINES;
      say(bot, lines[Math.floor(Math.random() * lines.length)]);
      if (bot.perch) bot.nextHop = performance.now() + 1400;
    });
    bot.el.addEventListener('dblclick', () => {
      say(bot, 'off to the meadow!');
      clearTimeout(bot.parkTimer);
      bot.parkTimer = window.setTimeout(() => setParked(bot, true), 700);
    });
  }

  control.addEventListener('click', () => {
    const park = !unicorns.every((bot) => bot.parked);
    for (const bot of unicorns) {
      clearTimeout(bot.parkTimer);
      setParked(bot, park);
    }
  });
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', syncPlayback);
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(frame);
    frame = 0;
    pausedAt = performance.now();
    trail?.replaceChildren();
  });
  window.addEventListener('pageshow', syncPlayback);
  syncPlayback();
}
