/**
 * Keeps the circular "Illustration…" note around the hero gummy at the body caption size (16 px)
 * on every screen. The SVG scales with the image, so the font size in its user units is
 * 16 × viewBox width / rendered width. Set through the CSSOM, which the strict CSP allows.
 */

const TARGET_PX = 16;

export function initHeroNote(): void {
  const svg = document.querySelector<SVGSVGElement>('#hero [data-hero-note]');
  const text = svg?.querySelector<SVGTextElement>('text');
  if (!svg || !text) return;
  const viewBoxWidth = svg.viewBox.baseVal.width;

  const fit = () => {
    const rendered = svg.getBoundingClientRect().width;
    if (rendered > 0) text.style.fontSize = `${((TARGET_PX * viewBoxWidth) / rendered).toFixed(2)}px`;
  };

  fit();
  new ResizeObserver(fit).observe(svg);
}
