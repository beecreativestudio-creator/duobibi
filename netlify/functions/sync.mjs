// POST /api/sync → salva iscrizione push, impostazioni e attività fatte oggi
import { store, json, validId } from '../lib/shared.mjs';

const clampStr = (s, n) => (typeof s === 'string' ? s.slice(0, n) : '');

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Metodo non consentito' }, 405);
  const raw = await req.text();
  if (raw.length > 20000) return json({ error: 'Richiesta troppo grande' }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: 'JSON non valido' }, 400); }
  if (!validId(body.id)) return json({ error: 'ID non valido' }, 400);

  const s = store();
  const prev = (await s.get(body.id, { type: 'json' })) || {};

  let subscription = prev.subscription || null;
  if (body.subscription) {
    const sub = body.subscription;
    if (typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
      return json({ error: 'Iscrizione non valida' }, 400);
    }
    subscription = { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } };
  }
  if (!subscription) return json({ error: 'Nessuna iscrizione: attiva prima le notifiche' }, 400);

  const tasks = Array.isArray(body.tasks)
    ? body.tasks.slice(0, 20).map((t) => ({
        id: clampStr(t.id, 30),
        title: clampStr(t.title, 60),
        on: !!t.on,
        days: Array.isArray(t.days) ? t.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : []
      }))
    : prev.tasks || [];

  const device = {
    subscription,
    tz: clampStr(body.tz, 60) || prev.tz || 'Europe/Rome',
    rem: /^\d{2}:\d{2}$/.test(body.rem) ? body.rem : prev.rem || '21:30',
    remLast: body.remLast !== undefined ? !!body.remLast : prev.remLast !== false,
    date: /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : prev.date,
    done: Array.isArray(body.done) ? body.done.slice(0, 20).map((x) => clampStr(x, 30)) : prev.done || [],
    streak: Number.isInteger(body.streak) ? body.streak : prev.streak || 0,
    tasks,
    notified: prev.notified || {},
    updatedAt: new Date().toISOString()
  };
  await s.setJSON(body.id, device);
  return json({ ok: true });
};

export const config = { path: '/api/sync' };
