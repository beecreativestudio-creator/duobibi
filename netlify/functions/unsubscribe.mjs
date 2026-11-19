// POST /api/unsubscribe → cancella tutti i dati del dispositivo
import { store, json, validId } from '../lib/shared.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Metodo non consentito' }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: 'JSON non valido' }, 400); }
  if (!validId(body.id)) return json({ error: 'ID non valido' }, 400);
  await store().delete(body.id);
  return json({ ok: true });
};

export const config = { path: '/api/unsubscribe' };
