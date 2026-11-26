import webpush from 'web-push';
import { store, json, isAdmin, TOPICOS as TYPES, clip } from './_lib.mjs';

export const config = { path: '/api/push' };

async function allSubs() {
  const s = store('subs'), keys = [];
  for await (const page of s.list({ paginate: true })) for (const b of page.blobs) keys.push(b.key);
  const out = [];
  for (let i = 0; i < keys.length; i += 25) {
    const rows = await Promise.all(keys.slice(i, i + 25).map(async (k) => ({ k, v: await s.get(k, { type: 'json' }) })));
    out.push(...rows.filter((r) => r.v));
  }
  return out;
}

export default async (req) => {
  if (!isAdmin(req)) return json({ error: 'Não autorizado' }, 401);

  if (req.method === 'GET') return json({ count: (await allSubs()).length });

  if (req.method === 'POST') {
    const { VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv } = process.env;
    if (!pub || !priv) return json({ error: 'Chaves VAPID não configuradas no Netlify.' }, 500);
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:biblioteca@unifacisa.edu.br', pub, priv);

    let b;
    try { b = await req.json(); } catch { return json({ error: 'JSON inválido' }, 400); }
    const title = clip(b.title, 80), body = clip(b.body, 240);
    if (!title) return json({ error: 'Informe um título.' }, 400);
    const topic = TYPES.includes(b.topic) ? b.topic : 'todos';
    const url = /^(https?:\/\/|\/)/.test(b.url || '') ? b.url : '/';
    const payload = JSON.stringify({ title, body, url, tag: 'hub-' + topic });

    const subs = (await allSubs()).filter((r) => topic === 'todos' || (r.v.topics || []).includes(topic));
    const s = store('subs');
    let sent = 0, failed = 0, removed = 0;
    for (let i = 0; i < subs.length; i += 20) {
      await Promise.all(subs.slice(i, i + 20).map(async (r) => {
        try { await webpush.sendNotification(r.v.subscription, payload, { TTL: 86400 }); sent++; }
        catch (e) {
          if (e.statusCode === 404 || e.statusCode === 410) { await s.delete(r.k); removed++; } else failed++;
        }
      }));
    }
    return json({ sent, failed, removed });
  }
  return json({ error: 'Método não permitido' }, 405);
};
