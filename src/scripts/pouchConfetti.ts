/**
 * Confetti burst for the version cards: when the pointer enters a pouch image, a big blast of
 * confetti shoots out from the exact point where it entered, across the whole screen, and fades.
 *
 * Drawn on ONE full-screen canvas (not one element per piece), so several hundred pieces stay
 * smooth. The canvas is created once and reused for every burst: a new full-screen canvas per burst
 * adds up in Safari, which frees them late and then refuses the next one. It is in the page only
 * while pieces are flying. Colors come from the palette tokens in colors.css (read at runtime, so no
 * color literal lives here). Mouse: hover (with confetti). Touch: a tap only enlarges the pouch smoothly for a
 * moment (data-popped), no confetti. Never under reduced motion.
 */

// One big blast right away, then two follow-up waves that keep it raining for a moment.
const WAVES = [
  { pieces: 320, delay: 0 },
  { pieces: 220, delay: 90 },
  { pieces: 160, delay: 200 },
] as const;
const COOLDOWN_MS = 700;
/** How long a tapped pouch stays big on touch screens. */
const POPPED_MS = 2600;
const GRAVITY = 1800; // px/s², pulls the pieces down after the blast
const PALETTE_TOKENS = [
  '--color-brand-pink',
  '--color-brand-lime',
  '--color-brand-green',
  '--color-accent-meadow',
  '--color-surface',
  '--color-accent-sport',
] as const;

interface Piece {
  x0: number;
  y0: number;
  /** Blast velocity in px/s. */
  vx: number;
  vy: number;
  width: number;
  height: number;
  round: boolean;
  color: string;
  rotation: number;
  spin: number; // rad/s
  delay: number; // s
  life: number; // s
  /** performance.now() in seconds when this piece was created: its time starts here, so bursts can overlap. */
  t0: number;
}

const random = (min: number, max: number) => min + Math.random() * (max - min);

function makePieces(originX: number, originY: number, colors: readonly string[]): Piece[] {
  const reach = Math.hypot(window.innerWidth, window.innerHeight);
  const pieces: Piece[] = [];
  for (const wave of WAVES) {
    for (let i = 0; i < wave.pieces; i++) {
      // Mostly big pieces, with a sprinkling of small ones in between.
      const size = Math.random() < 0.3 ? random(8, 14) : random(14, 32);
      const kind = Math.random();
      const angle = random(0, Math.PI * 2);
      // Fast enough to cross the screen in well under a second; drag (below) slows them down.
      const speed = random(0.5, 1.7) * reach * 2.4;
      pieces.push({
        x0: originX + random(-14, 14),
        y0: originY + random(-14, 14),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        width: kind < 0.4 ? size * 0.55 : size,
        height: kind < 0.4 ? size * 1.5 : size,
        round: kind > 0.75,
        color: colors[Math.floor(random(0, colors.length))] ?? colors[0] ?? 'white',
        rotation: random(0, Math.PI * 2),
        spin: random(-14, 14),
        delay: wave.delay / 1000,
        life: random(0.9, 1.6),
        t0: performance.now() / 1000,
      });
    }
  }
  return pieces;
}

/** One canvas for every burst, and the pieces still in the air. */
let canvas: HTMLCanvasElement | null = null;
let context: CanvasRenderingContext2D | null = null;
let flying: Piece[] = [];
let frame = 0;
let safetyTimer = 0;
/** Total pieces of the current run, kept on the canvas (data-pieces) for tests and debugging. */
let runTotal = 0;

const MAX_DPR = 1.5;

function getCanvas(): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } | null {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.dataset.confetti = '';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60';
    context = canvas.getContext('2d');
  }
  if (!context) {
    canvas = null;
    return null;
  }
  return { canvas, context };
}

/** Removes the canvas from the page and forgets any pieces (idle again). */
function stop(): void {
  window.clearTimeout(safetyTimer);
  cancelAnimationFrame(frame);
  frame = 0;
  flying = [];
  runTotal = 0;
  canvas?.remove();
}

function draw(): void {
  if (!canvas || !context) return;
  // The same clock the pieces were stamped with (not the animation-frame timestamp, which can run on another timeline).
  const seconds = performance.now() / 1000;
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);

  flying = flying.filter((piece) => seconds - piece.t0 - piece.delay <= piece.life);
  for (const piece of flying) {
    const t = seconds - piece.t0 - piece.delay;
    if (t < 0) continue;

    // Blast with exponential drag: position = v0 * (1 - e^(-k t)) / k, plus gravity.
    const drag = 5.2;
    const travel = (1 - Math.exp(-drag * t)) / drag;
    const x = piece.x0 + piece.vx * travel;
    const y = piece.y0 + piece.vy * travel + 0.5 * GRAVITY * t * t;
    const progress = t / piece.life;
    const alpha = progress < 0.6 ? 1 : 1 - (progress - 0.6) / 0.4;
    const scale = progress < 0.08 ? 0.4 + (progress / 0.08) * 0.6 : 1;

    context.save();
    context.globalAlpha = Math.max(0, alpha);
    context.translate(x, y);
    context.rotate(piece.rotation + piece.spin * t);
    context.scale(scale, scale);
    context.fillStyle = piece.color;
    if (piece.round) {
      context.beginPath();
      context.ellipse(0, 0, piece.width / 2, piece.height / 2, 0, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
    }
    context.restore();
  }

  if (flying.length > 0) frame = requestAnimationFrame(draw);
  else stop();
}

/** Confetti blast from a point in the viewport (CSS px). Does nothing under reduced motion. */
export function confettiAt(originX: number, originY: number): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const style = getComputedStyle(document.documentElement);
  const colors = PALETTE_TOKENS.map((token) => style.getPropertyValue(token).trim()).filter(Boolean);
  if (!colors.length) return;
  const surface = getCanvas();
  if (!surface) return;

  // Size to the viewport on every burst (cheap, and right after a resize), then put it in the page.
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  surface.canvas.width = Math.round(window.innerWidth * dpr);
  surface.canvas.height = Math.round(window.innerHeight * dpr);
  surface.context.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!surface.canvas.isConnected) document.body.append(surface.canvas);

  const pieces = makePieces(originX, originY, colors);
  flying.push(...pieces);
  runTotal += pieces.length;
  surface.canvas.dataset.pieces = String(runTotal);

  // Safety net: clear everything even if animation frames stop (hidden window, throttled tab).
  window.clearTimeout(safetyTimer);
  safetyTimer = window.setTimeout(stop, 3000);
  if (!frame) frame = requestAnimationFrame(draw);
}

export function initPouchConfetti(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const pouches = document.querySelectorAll<HTMLElement>('#lines [data-pouch]');

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    pouches.forEach((pouch) => {
      let last = Number.NEGATIVE_INFINITY;
      pouch.addEventListener('pointerenter', (event) => {
        if (event.pointerType !== 'mouse') return;
        const now = performance.now();
        if (now - last < COOLDOWN_MS) return;
        last = now;
        confettiAt(event.clientX, event.clientY);
      });
    });
    return;
  }

  // Touch screens: no hover, so a tap enlarges the pouch (big, tilted) and it settles back after a moment.
  // A tap elsewhere (or on another pouch) settles it right away.
  let timer = 0;
  const settle = () => {
    window.clearTimeout(timer);
    pouches.forEach((pouch) => pouch.removeAttribute('data-popped'));
  };
  pouches.forEach((pouch) => {
    pouch.addEventListener('click', (event) => {
      event.stopPropagation();
      settle();
      pouch.setAttribute('data-popped', '');
      timer = window.setTimeout(settle, POPPED_MS);
    });
  });
  document.addEventListener('click', settle);
}
