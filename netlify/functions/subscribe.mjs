import { createHash } from 'node:crypto';
import { store, json, TOPICOS as TYPES } from './_lib.mjs';

export const config = { path: '/api/subscribe' };
const keyOf = (endpoint) => createHash('sha256').update(endpoint).digest('hex').slice(0, 40);

export default async (req) => {
  if (req.method === 'GET') return json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
  const s = store('subs');
  let b;
  try { b = await req.json(); } catch { return json({ error: 'JSON inválido' }, 400); }

  if (req.method === 'POST') {
    const sub = b.subscription;
    if (!sub?.endpoint?.startsWith('https://') || !sub?.keys?.p256dh || !sub?.keys?.auth) return json({ error: 'Inscrição inválida' }, 400);
    const topics = (Array.isArray(b.topics) ? b.topics : []).filter((t) => TYPES.includes(t));
    await s.setJSON(keyOf(sub.endpoint), { subscription: { endpoint: sub.endpoint, keys: sub.keys }, topics, created: new Date().toISOString() });
    return json({ ok: true });
  }
  if (req.method === 'DELETE') {
    if (b.endpoint) await s.delete(keyOf(b.endpoint));
    return json({ ok: true });
  }
  return json({ error: 'Método não permitido' }, 405);
};
