/**
 * Preflight for the sign-up function: does the MailerLite API key in .dev.vars work, and does the account
 * have everything /api/signup sends (the six groups and the custom fields)? Read-only: it only lists groups
 * and fields, it never creates or changes anything. The key is never printed.
 *
 *   pnpm check:mailerlite
 *
 * Exit code 1 when the key is missing or rejected (nothing can work), 2 when groups or fields are missing
 * (sign-ups would be refused by MailerLite), 0 when all is fine.
 */
import { existsSync, readFileSync } from 'node:fs';
import { GROUPS } from '../functions/api/signup.js';

const API = 'https://connect.mailerlite.com/api';
const REQUIRED_FIELDS = ['consent_at', 'consent_age_18', 'signup_source', 'flavor_suggestion', 'utm_source', 'utm_campaign'];

function readDevVars(path = '.dev.vars') {
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (match && !line.trim().startsWith('#')) vars[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
  return vars;
}

async function list(path, key) {
  const response = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, data: Array.isArray(body?.data) ? body.data : null };
}

const say = (message = '') => console.log(message);

export async function checkMailerLite() {
  const key = (process.env.MAILERLITE_API_KEY || readDevVars().MAILERLITE_API_KEY || '').trim();
  if (!existsSync('.dev.vars') && !process.env.MAILERLITE_API_KEY) {
    say('✘ There is no .dev.vars file.');
    say('  Copy .dev.vars.example to .dev.vars and put your MailerLite API key in it. Without a key every sign-up fails with');
    say('  "Something went wrong on our side".');
    return 1;
  }
  if (!key || /your-mailerlite-api-key|fake|example/i.test(key)) {
    say('✘ .dev.vars has no real MAILERLITE_API_KEY yet (empty or still the placeholder).');
    return 1;
  }

  let groups;
  let fields;
  try {
    groups = await list('/groups?limit=100', key);
    fields = await list('/fields?limit=100', key);
  } catch (error) {
    say(`✘ MailerLite could not be reached (${error?.name ?? 'network error'}). Check your internet connection.`);
    return 1;
  }

  if (groups.status === 401 || fields.status === 401) {
    say('✘ MailerLite rejected the API key (401). The key is wrong, expired or was copied with extra characters.');
    say('  Create a new API token in MailerLite (Integrations, MailerLite API) and replace it in .dev.vars.');
    return 1;
  }
  if (groups.status === 403 || fields.status === 403) {
    say('✘ MailerLite refused access (403). The key has no right to read groups or fields.');
    return 1;
  }
  if (!groups.data || !fields.data) {
    say(`✘ Unexpected answer from MailerLite (groups ${groups.status}, fields ${fields.status}). Try again later.`);
    return 1;
  }
  say('✔ MailerLite accepted the API key.');

  let exit = 0;
  const knownGroups = new Set(groups.data.map((group) => String(group.id)));
  const missingGroups = Object.entries(GROUPS).filter(([, id]) => !knownGroups.has(id));
  if (missingGroups.length) {
    exit = 2;
    say(`✘ ${missingGroups.length} group ID(s) in functions/api/signup.js do not exist in this MailerLite account:`);
    for (const [name, id] of missingGroups) say(`    ${name} (${id})`);
  } else {
    say(`✔ All ${Object.keys(GROUPS).length} groups exist.`);
  }

  const knownFields = new Set(fields.data.map((field) => String(field.key ?? field.name)));
  const missingFields = REQUIRED_FIELDS.filter((name) => !knownFields.has(name));
  if (missingFields.length) {
    exit = 2;
    say(`✘ ${missingFields.length} custom field(s) are missing in MailerLite. Until they exist, MailerLite refuses every sign-up:`);
    for (const name of missingFields) say(`    ${name}  (type: text)`);
    say('  Create them in MailerLite under Subscribers, Fields. The "field key" must be exactly the name above.');
  } else {
    say(`✔ All ${REQUIRED_FIELDS.length} custom fields exist.`);
  }
  return exit;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(await checkMailerLite());
