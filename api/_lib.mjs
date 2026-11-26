import { getStore } from '@netlify/blobs';
import { createHash, timingSafeEqual } from 'node:crypto';

export const store = (name = 'hub') => getStore(name);
export const AV_TIPOS = ['info', 'alerta', 'urgente', 'feriado', 'horario', 'sistema', 'tcc'];
export const TOPICOS = ['geral', 'feriado', 'horario', 'sistema', 'tcc'];   // categorias de notificação

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
  });

// Senha dos colaboradores = variável de ambiente ADMIN_TOKEN (nunca vai para o código do site)
export function isAdmin(req) {
  const sent = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const expected = process.env.ADMIN_TOKEN || '';
  if (!sent || !expected) return false;
  const h = (s) => createHash('sha256').update(s).digest();
  return timingSafeEqual(h(sent), h(expected));
}

export const clip = (v, n) => String(v ?? '').slice(0, n).trim();
export const hojeISO = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); // data em Campina Grande (UTC-3)
