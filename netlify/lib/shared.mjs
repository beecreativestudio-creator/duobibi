// Funzioni condivise dalle funzioni Netlify di Bibi
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

export const store = () => getStore({ name: 'bibi-devices', consistency: 'strong' });

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const validId = (id) => typeof id === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(id);

let vapidReady = false;
export function setupVapid() {
  if (vapidReady) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:info@example.com';
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  vapidReady = true;
  return true;
}

// Invia una notifica; restituisce 'ok', 'gone' (iscrizione scaduta) o 'error'
export async function sendPush(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), { TTL: 60 * 60 });
    return 'ok';
  } catch (err) {
    if (err && (err.statusCode === 404 || err.statusCode === 410)) return 'gone';
    console.error('Errore push', err && err.statusCode, err && err.body);
    return 'error';
  }
}

// Data, ora e giorno della settimana nel fuso orario dell'utente
export function localNow(tz, now = new Date()) {
  let zone = tz;
  try { new Intl.DateTimeFormat('it-IT', { timeZone: zone }); } catch { zone = 'Europe/Rome'; }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short'
    }).formatToParts(now).map((p) => [p.type, p.value])
  );
  const hour = Number(parts.hour) % 24;
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: hour * 60 + Number(parts.minute), weekday };
}

// Attività previste oggi e non ancora fatte
export function pendingTasks(device, local) {
  const done = device.date === local.date ? new Set(device.done || []) : new Set();
  return (device.tasks || []).filter((t) => t.on && (t.days || []).includes(local.weekday) && !done.has(t.id));
}

export const listToText = (arr) =>
  arr.length <= 1 ? (arr[0] || '') : `${arr.slice(0, -1).join(', ')} e ${arr[arr.length - 1]}`;
