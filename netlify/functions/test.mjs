// POST /api/test → invia subito una notifica di prova
import { store, json, validId, setupVapid, sendPush, localNow, pendingTasks } from '../lib/shared.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Metodo non consentito' }, 405);
  if (!setupVapid()) return json({ error: 'Chiavi VAPID non configurate su Netlify' }, 500);
  let body;
  try { body = await req.json(); } catch { return json({ error: 'JSON non valido' }, 400); }
  if (!validId(body.id)) return json({ error: 'ID non valido' }, 400);

  const s = store();
  const device = await s.get(body.id, { type: 'json' });
  if (!device || !device.subscription) return json({ error: 'Dispositivo non iscritto' }, 404);

  const left = pendingTasks(device, localNow(device.tz)).length;
  const result = await sendPush(device.subscription, {
    title: 'Ciao, sono Bibi! 🐰',
    body: left ? `Le notifiche funzionano. Oggi ti mancano ancora ${left} attività.` : 'Le notifiche funzionano. Oggi hai già completato tutto!',
    tag: 'bibi-test'
  });
  if (result === 'gone') { await s.delete(body.id); return json({ error: 'Iscrizione scaduta: riattiva le notifiche' }, 410); }
  if (result !== 'ok') return json({ error: 'Invio non riuscito' }, 502);
  return json({ ok: true });
};

export const config = { path: '/api/test' };
