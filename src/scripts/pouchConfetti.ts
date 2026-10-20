/**
 * Confetti burst for the version cards: when the pointer enters a pouch image, a big blast of
 * confetti shoots out from the exact point where it entered, across the whole screen, and fades.
 *
 * Drawn on ONE full-screen canvas (not one element per piece), so several hundred pieces stay
 * smooth. Colors come from the palette tokens in colors.css (read at runtime, so no color literal
 * lives here). Fine pointers only, never under reduced motion. The canvas removes itself when the
 * last piece has faded.
 */

// One big blast right away, then two follow-up waves that keep it raining for a moment.
const WAVES = [
  { pieces: 320, delay: 0 },
  { pieces: 220, delay: 90 },
  { pieces: 160, delay: 200 },
] as const;
const COOLDOWN_MS = 700;
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
      });
    }
  }
  return pieces;
}

function burst(originX: number, originY: number, colors: readonly string[]): void {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  canvas.dataset.confetti = '';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60';
  document.body.append(canvas);

  const context = canvas.getContext('2d');
  if (!context) {
    canvas.remove();
    return;
  }
  context.scale(dpr, dpr);

  const pieces = makePieces(originX, originY, colors);
  // Safety net: remove the canvas even if animation frames stop (hidden window, throttled tab).
  window.setTimeout(() => canvas.remove(), 3000);
  canvas.dataset.pieces = String(pieces.length);
  const start = performance.now();

  const frame = (now: number) => {
    const elapsed = (now - start) / 1000;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let alive = 0;

    for (const piece of pieces) {
      const t = elapsed - piece.delay;
      if (t < 0) {
        alive++;
        continue;
      }
      if (t > piece.life) continue;
      alive++;

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

    if (alive > 0) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

export function initPouchConfetti(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const style = getComputedStyle(document.documentElement);
  const colors = PALETTE_TOKENS.map((token) => style.getPropertyValue(token).trim()).filter(Boolean);
  if (!colors.length) return;

  document.querySelectorAll<HTMLElement>('#lines [data-pouch]').forEach((pouch) => {
    let last = Number.NEGATIVE_INFINITY;
    pouch.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      const now = performance.now();
      if (now - last < COOLDOWN_MS) return;
      last = now;
      burst(event.clientX, event.clientY, colors);
    });
  });
}
