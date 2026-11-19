// Funzione programmata: ogni 5 minuti controlla chi ha attività in sospeso
// e manda il promemoria all'orario scelto e (se attivo) l'ultima chiamata alle 23:00.
import { store, setupVapid, sendPush, localNow, pendingTasks, listToText } from '../lib/shared.mjs';

const LAST_CALL = 23 * 60;

export default async () => {
  if (!setupVapid()) { console.error('Chiavi VAPID non configurate'); return; }
  const s = store();
  const { blobs } = await s.list();
  let sent = 0, removed = 0;

  for (const { key } of blobs) {
    const device = await s.get(key, { type: 'json' });
    if (!device || !device.subscription) continue;

    const local = localNow(device.tz);
    const pending = pendingTasks(device, local);
    if (!pending.length) continue;

    const [rh, rm] = (device.rem || '21:30').split(':').map(Number);
    const notified = device.notified && device.notified.date === local.date ? device.notified : { date: local.date };
    let payload = null, slot = null;

    if (device.remLast !== false && local.minutes >= LAST_CALL && !notified.last) {
      slot = 'last';
      const st = device.date === local.date ? device.streak : 0;
      payload = {
        title: 'Ultima chiamata! ⏰',
        body: st > 0
          ? `Manca meno di un'ora a mezzanotte: non perdere la tua serie di ${st} ${st === 1 ? 'giorno' : 'giorni'}.`
          : `Manca meno di un'ora a mezzanotte. Ti manca: ${listToText(pending.map((t) => t.title.toLowerCase()))}.`,
        tag: 'bibi-last'
      };
    } else if (local.minutes >= rh * 60 + rm && local.minutes < LAST_CALL + 60 && !notified.main) {
      slot = 'main';
      payload = {
        title: 'Bibi ti aspetta! 🐰',
        body: `Prima di mezzanotte ti manca: ${listToText(pending.map((t) => t.title.toLowerCase()))}.`,
        tag: 'bibi-main'
      };
    }
    if (!payload) continue;

    const result = await sendPush(device.subscription, payload);
    if (result === 'gone') { await s.delete(key); removed++; continue; }
    if (result === 'ok') {
      notified[slot] = true;
      if (slot === 'last') notified.main = true; // evita un doppio avviso se l'orario scelto è dopo le 23
      device.notified = notified;
      await s.setJSON(key, device);
      sent++;
    }
  }
  console.log(`Promemoria inviati: ${sent}, iscrizioni rimosse: ${removed}, dispositivi: ${blobs.length}`);
};

export const config = { schedule: '*/5 * * * *' };
