// Local audit launcher: never imports production environment files itself.
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
const product = 'D:/Claude/Q-Atelier';
const local = Object.fromEntries(readFileSync(`${product}/.env.development.local`, 'utf8')
  .split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => {
    const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1).replace(/^["']|["']$/g, '')];
  }));
const database = new URL(local.NEXT_PUBLIC_SUPABASE_URL);
if (!['127.0.0.1', 'localhost'].includes(database.hostname) || database.port !== '54321') throw new Error('Existing local audit database required');
if (!local.NEXT_PUBLIC_SUPABASE_ANON_KEY || !local.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Local keys missing');
// Explicit empty values prevent Next dotenv fallback from loading outbound secrets.
const outboundNames = [
  'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY',
  'AI_GATEWAY_API_KEY', 'VERCEL_OIDC_TOKEN', 'RESEND_API_KEY', 'FCM_SERVICE_ACCOUNT_JSON',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'MFDS_DATA_API_KEY', 'OPENFDA_API_KEY',
  'AI_INGEST_SECRET_EVAL', 'AI_INGEST_SECRET_LOGIN', 'AI_INGEST_SECRET_QMAISON', 'FAMILY_LINK_SECRET',
  'CRON_SECRET', 'SENTRY_AUTH_TOKEN', 'NEXT_PUBLIC_SENTRY_DSN', 'SENTRY_DSN',
];
const env = { ...process.env, ...Object.fromEntries(outboundNames.map(name => [name, ''])),
  ...local, NODE_ENV: 'development', QD_AUDIT: '1', NEXT_PUBLIC_APP_URL: 'http://localhost:3600' };
console.log(JSON.stringify({ audit: 'atelier', port: 3600, database: database.origin,
  distDir: '.next-qdesign-audit', outboundKeysDisabled: outboundNames.length }));
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3600'],
  { cwd: product, env, stdio: 'inherit', windowsHide: true });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
