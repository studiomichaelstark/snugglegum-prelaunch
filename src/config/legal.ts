import { resolvePlaceholders, type Env } from './placeholders';

/**
 * Legal and contact values from the environment (see placeholders.ts and .env).
 * Read at build time on the server, never in browser code. `process.env` covers values set in a
 * host dashboard, `import.meta.env` covers `.env` files.
 */
const env = { ...process.env, ...import.meta.env } as Env;

export const legal = resolvePlaceholders(env);
