// Genera la coppia di chiavi VAPID per le notifiche push (nessuna dipendenza esterna).
// Uso: node scripts/genera-chiavi-vapid.mjs
import { generateKeyPairSync } from 'node:crypto';

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const pub = publicKey.export({ format: 'jwk' });
const priv = privateKey.export({ format: 'jwk' });
const raw = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x, 'base64url'), Buffer.from(pub.y, 'base64url')]);

console.log('\nCopia queste variabili in Netlify → Site configuration → Environment variables:\n');
console.log(`VAPID_PUBLIC_KEY=${raw.toString('base64url')}`);
console.log(`VAPID_PRIVATE_KEY=${priv.d}`);
console.log('VAPID_SUBJECT=mailto:la-tua-email@esempio.it');
console.log('\nLa chiave privata è segreta: non pubblicarla e non metterla nel codice.\n');
