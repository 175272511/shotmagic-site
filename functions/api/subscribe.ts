// POST /api/subscribe { email, source? } -> { ok, status }
// Stores email in D1 (binding name: DB). Idempotent on email (unique).

interface Env {
  DB: D1Database;
}

interface SubscribeBody {
  email?: string;
  source?: string;
}

// RFC-5322-lite: enough to reject typos and obvious garbage.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function hashIp(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let payload: SubscribeBody;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, status: 'bad_json' }, 400);
  }

  const email = (payload.email ?? '').trim().toLowerCase();
  const source = (payload.source ?? 'hero').slice(0, 32);

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ ok: false, status: 'invalid_email' }, 400);
  }

  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const ua = (request.headers.get('user-agent') ?? '').slice(0, 256);
  const ipHash = ip ? await hashIp(ip) : null;

  try {
    await env.DB
      .prepare(`INSERT INTO emails (email, source, ip_hash, user_agent) VALUES (?, ?, ?, ?)`)
      .bind(email, source, ipHash, ua)
      .run();
    return json({ ok: true, status: 'subscribed' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('UNIQUE') || msg.includes('constraint')) {
      return json({ ok: true, status: 'already_subscribed' });
    }
    console.error('subscribe_error', msg);
    return json({ ok: false, status: 'server_error' }, 500);
  }
};

export const onRequest: PagesFunction<Env> = async () =>
  json({ ok: false, status: 'method_not_allowed' }, 405);
