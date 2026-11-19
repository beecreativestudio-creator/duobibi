// GET /api/vapid → chiave pubblica per iscriversi alle notifiche
import { json } from '../lib/shared.mjs';

export default async () => json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });

export const config = { path: '/api/vapid' };
