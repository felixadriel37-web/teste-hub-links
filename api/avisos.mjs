import { createHash } from 'node:crypto';
import { store, json, isAdmin, clip, AV_TIPOS, hojeISO } from './_lib.mjs';

export const config = { path: '/api/avisos' };

const safeUrl = (u) => { u = clip(u, 500); return /^(https?:\/\/|\/|#)/.test(u) ? u : ''; };
const isoDate = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '');
const vigente = (a, hoje) => a.ativo !== false && (!a.inicio || hoje >= a.inicio) && (!a.fim || hoje <= a.fim);

export default async (req) => {
  const s = store();

  if (req.method === 'GET') {
    const all = new URL(req.url).searchParams.get('all') === '1';
    const data = (await s.get('avisos', { type: 'json' })) || { atualizadoEm: '', avisos: [] };
    if (all) return isAdmin(req) ? json(data) : json({ error: 'Senha incorreta' }, 401);
    const hoje = hojeISO();
    return json(
      { atualizadoEm: data.atualizadoEm, avisos: (data.avisos || []).filter((a) => vigente(a, hoje)) },
      200,
      { 'cache-control': 'public, max-age=60' }
    );
  }

  if (req.method === 'PUT') {
    if (!isAdmin(req)) return json({ error: 'Senha incorreta' }, 401);
    let b;
    try { b = await req.json(); } catch { return json({ error: 'JSON inválido' }, 400); }
    const avisos = (Array.isArray(b.avisos) ? b.avisos : []).slice(0, 30).map((a) => {
      const o = {
        id: clip(a.id, 40) || crypto.randomUUID().slice(0, 8),
        tipo: AV_TIPOS.includes(a.tipo) ? a.tipo : 'info',
        texto: clip(a.texto, 240),
        link: safeUrl(a.link),
        rotulo: clip(a.rotulo, 40),
        inicio: isoDate(a.inicio),
        fim: isoDate(a.fim),
        fechado: !!a.fechado,
        ativo: a.ativo !== false
      };
      o.v = createHash('sha1').update(o.texto + o.link).digest('hex').slice(0, 8);
      return o;
    }).filter((a) => a.texto);
    const data = { atualizadoEm: new Date().toISOString(), avisos };
    await s.setJSON('avisos', data);
    return json(data);
  }
  return json({ error: 'Método não permitido' }, 405);
};
