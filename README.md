# Bibi – messa online su Netlify

App PWA installabile, con notifiche push prima di mezzanotte.

## Cosa c'è nel pacchetto

```
bibi-netlify/
├── public/                     ← il sito
│   ├── index.html              ← l'app
│   ├── sw.js                   ← service worker (offline + notifiche)
│   ├── manifest.webmanifest    ← installazione sulla schermata Home
│   ├── privacy.html            ← informativa privacy (DA COMPLETARE)
│   └── icons/                  ← icone di Bibi
├── netlify/
│   ├── functions/
│   │   ├── vapid.mjs           ← GET  /api/vapid        chiave pubblica
│   │   ├── sync.mjs            ← POST /api/sync         salva iscrizione e progressi del giorno
│   │   ├── unsubscribe.mjs     ← POST /api/unsubscribe  cancella i dati del dispositivo
│   │   ├── test.mjs            ← POST /api/test         notifica di prova
│   │   └── send-reminders.mjs  ← funzione programmata, ogni 5 minuti
│   └── lib/shared.mjs
├── scripts/genera-chiavi-vapid.mjs
├── netlify.toml
└── package.json
```

## Passaggi

### 1. Completa l'informativa privacy
Apri `public/privacy.html` e sostituisci i campi evidenziati tra parentesi quadre: titolare, indirizzo, email e data.

### 2. Genera le chiavi VAPID
Serve Node.js 18 o successivo sul tuo computer. Dalla cartella del progetto lancia:

```bash
node scripts/genera-chiavi-vapid.mjs
```

Tieni da parte le tre righe che stampa. La chiave privata è segreta.

### 3. Pubblica su Netlify
Le funzioni vanno compilate, quindi **il trascinamento della cartella su Netlify Drop non basta**. Scegli una di queste due strade.

**A. Con GitHub (consigliata)**
1. Crea un repository su GitHub e caricaci il contenuto di questa cartella.
2. Su Netlify: **Add new project → Import an existing project → GitHub**, poi scegli il repository.
3. Lascia le impostazioni proposte: le legge da `netlify.toml`.

**B. Con Netlify CLI**
```bash
npm install
npm install -g netlify-cli
netlify login
netlify init        # crea il sito
netlify deploy --prod
```

### 4. Inserisci le variabili d'ambiente
Su Netlify vai in **Project configuration → Environment variables** e aggiungi:

| Variabile | Valore |
|---|---|
| `VAPID_PUBLIC_KEY` | dalla chiave generata al passo 2 |
| `VAPID_PRIVATE_KEY` | dalla chiave generata al passo 2 |
| `VAPID_SUBJECT` | `mailto:` seguito dalla tua email |

Poi fai un nuovo deploy (**Deploys → Trigger deploy**), così le funzioni leggono le chiavi.

### 5. Collega il dominio (facoltativo)
In **Domain management** puoi aggiungere un dominio tuo, per esempio `bibi.tuodominio.it`. Il certificato HTTPS è automatico, e le notifiche push funzionano solo in HTTPS.

### 6. Prova sul telefono
- **Android (Chrome)**: apri il sito e vai in **Profilo → Installa**. Poi tocca **Notifiche push → Attiva** e infine **Prova**.
- **iPhone (iOS 16.4 o successivo)**: apri il sito con **Safari**, tocca **Condividi → Aggiungi alla schermata Home** e apri Bibi dall'icona. Poi vai in **Profilo → Notifiche push → Attiva** e infine **Prova**.
  Su iPhone le notifiche **non funzionano** se l'app non è aggiunta alla schermata Home.

## Come funzionano i promemoria
- Ogni volta che spunti un'attività o cambi un'impostazione, l'app invia al server lo stato della giornata.
- Ogni 5 minuti la funzione `send-reminders` controlla, nel fuso orario di ogni dispositivo, se ci sono attività ancora da fare. Se sì, manda due avvisi:
  - uno all'orario scelto nel Profilo (predefinito 21:30);
  - un'**ultima chiamata alle 23:00**, se l'opzione è attiva.
- Ogni avviso parte una sola volta al giorno. Se completi tutto, non arriva nulla.
- La notifica può arrivare fino a circa 5 minuti dopo l'orario scelto.
- Se un giorno non apri l'app, Bibi considera da fare tutte le attività previste per quel giorno e ti avvisa comunque.

## Controlli e problemi comuni
- **Log delle funzioni**: su Netlify vai in **Logs → Functions → send-reminders**. A ogni esecuzione vedi quanti promemoria sono stati inviati.
- **"Chiave VAPID mancante"**: mancano le variabili d'ambiente oppure non hai rifatto il deploy dopo averle inserite.
- **Il test funziona ma il promemoria serale non arriva**: controlla che l'orario nel Profilo sia passato e che ci siano attività non spuntate. Le funzioni programmate girano solo sul deploy di produzione.
- **Hai cambiato le chiavi VAPID**: tutti devono disattivare e riattivare le notifiche dal Profilo.
- **I progressi** (punti, segnalibro, diario) restano salvati sul telefono. Sul server va solo il minimo necessario per i promemoria: vedi `privacy.html`.

## Costi
Il piano gratuito di Netlify basta per uso personale o per un gruppo piccolo. La funzione programmata gira circa 8.600 volte al mese.

## Note
- Bibi è un'app **non ufficiale**: evita di usare il logo di jw.org o "JW" nel nome dell'app.
- Le API non hanno autenticazione: ogni dispositivo è identificato da un ID casuale. Se vuoi aprire l'app a molte persone, conviene aggiungere un limite al numero di richieste.
