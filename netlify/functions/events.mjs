import { store, json, isAdmin, clip } from './_lib.mjs';

export const config = { path: '/api/events' };
const today = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);

export default async (req) => {
  const s = store();

  // Painel (admin): estatísticas + mensagens
  if (req.method === 'GET') {
    if (!isAdmin(req)) return json({ error: 'Não autorizado' }, 401);
    return json({
      stats: (await s.get('stats', { type: 'json' })) || {},
      misses: (await s.get('misses', { type: 'json' })) || {},
      feedback: (await s.get('feedback', { type: 'json' })) || []
    });
  }
  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return json({ error: 'Não autorizado' }, 401);
    const id = new URL(req.url).searchParams.get('id');
    const list = ((await s.get('feedback', { type: 'json' })) || []).filter((f) => f.id !== id);
    await s.setJSON('feedback', list);
    return json({ ok: true });
  }

  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);
  let b;
  try { b = await req.json(); } catch { return json({ error: 'JSON inválido' }, 400); }

  if (b.type === 'hit') {
    const id = clip(b.id, 80);
    if (!id) return json({ error: 'id obrigatório' }, 400);
    const stats = (await s.get('stats', { type: 'json' })) || {};
    const d = today();
    stats[d] = stats[d] || {};
    stats[d][id] = (stats[d][id] || 0) + 1;
    for (const k of Object.keys(stats).sort().slice(0, -60)) delete stats[k]; // guarda 60 dias
    await s.setJSON('stats', stats);
    return json({ ok: true });
  }

  if (b.type === 'miss') { // busca sem resultado: ajuda a descobrir o que falta no hub
    const q = clip(b.q, 40).toLowerCase();
    if (q.length < 3) return json({ ok: true });
    const m = (await s.get('misses', { type: 'json' })) || {};
    m[q] = (m[q] || 0) + 1;
    const top = Object.entries(m).sort((a, c) => c[1] - a[1]).slice(0, 300);
    await s.setJSON('misses', Object.fromEntries(top));
    return json({ ok: true });
  }

  if (b.type === 'feedback') {
    if (b.website) return json({ ok: true }); // honeypot
    const message = clip(b.message, 1000);
    if (message.length < 5) return json({ error: 'Mensagem muito curta' }, 400);
    const list = (await s.get('feedback', { type: 'json' })) || [];
    list.unshift({
      id: crypto.randomUUID().slice(0, 8),
      at: new Date().toISOString(),
      kind: ['Sugestão', 'Problema', 'Elogio'].includes(b.kind) ? b.kind : 'Sugestão',
      message,
      contact: clip(b.contact, 120)
    });
    await s.setJSON('feedback', list.slice(0, 200));
    return json({ ok: true });
  }
  return json({ error: 'Tipo inválido' }, 400);
};
