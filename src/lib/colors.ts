/**
 * Reads a color token out of colors.css, so places that cannot use CSS variables
 * (meta theme-color, the web manifest) still have a single source of truth.
 */
import colorsCss from '@/styles/colors.css?raw';

export function colorToken(name: `--color-${string}`): string {
  const match = colorsCss.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  const value = match?.[1]?.trim();
  if (!value || value.startsWith('var(')) {
    throw new Error(`Color token ${name} not found (or not a literal) in src/styles/colors.css`);
  }
  return value;
}
