# lorebiri.github.io

Sito personale di Lorenzo Birindelli (IT/EN). HTML/CSS/JS statici, nessuna build: online su https://lorebiri.github.io

## File
- `index.html` — tutti i contenuti. Ogni testo ha la versione `data-it` e `data-en`.
- `styles.css` — stile. Colori in cima (`:root`): `--chl` verde clorofilla, `--eye` rosso macchia oculare.
- `main.js` — lingua, tema, filtri, copia email e le euglene dell'hero (fototassi + scissione al clic).
- `img/` — anteprime dei progetti (JPEG ~960px).

## Aggiungere un progetto
In `index.html`, sezione `#projects`: copia un `<article class="work">` e cambia testi, immagine e link.
- `data-cat`: una o più tra `tools event graphics media` (i filtri si contano da soli).
- larghezza su desktop: `feat` (riga intera), `wide`, `slim`, `third` o nessuna classe (metà).

## Aggiungere un paper
Sezione `#pubs`: copia un `<li class="paper">`, aggiorna `data-y` (anno, o `pre` per i preprint), numero `P.xx`, testi e DOI.
Se è un anno nuovo, aggiungi anche il bottone `<button class="chip" data-f="ANNO">`.

## Easter egg
Scrivi `euglena` (fioritura algale) o `wanda` (magia del caos) sulla tastiera. 🦠

## Dopo ogni modifica a CSS/JS
Aumenta il numero in `nomefile?v=N` in **tutte** le pagine che usano quel file (`index.html`, `dsctm-2026.html`, `404.html`), con lo stesso N ovunque, così i browser non usano la versione vecchia in cache.

## Font
Sono nella cartella `fonts/` (licenza SIL OFL, dettagli in `fonts/README.md`); le regole `@font-face` sono in cima a `styles.css`. Il sito non usa più Google Fonts.

## Lingua
Ogni pagina ha in `<head>` un piccolo script che sceglie subito lingua e tema (niente lampo della versione sbagliata).
`?lang=it` o `?lang=en` nell'indirizzo forza la lingua per quella visita, senza salvarla: è l'indirizzo che usano i motori di ricerca (`hreflang`).

## Pagina 404
`404.html`, con percorsi assoluti (`/styles.css`) perché GitHub Pages la mostra per qualsiasi indirizzo sbagliato.

## Temi stagionali
Automatici in base alla data (Pisa); il 23 marzo tema compleanno. Chi visita non può cambiarli.
Calendario e priorità in `main.js` (cerca "TEMI STAGIONALI"); palette in `seasons.css`.
Per provare una data: `https://lorebiri.github.io/?date=2026-12-25`.

## Immagini
I link a un file immagine si aprono in una finestrella dentro il sito (`lightbox.js`, stile in fondo a `styles.css`). Quelli dentro `.gallery`, `.cs-pages` e `.cs-demo` si sfogliano con le frecce.

## Pagine caso studio
`dsctm-2026.html` (stile in `case.css`, lingua/tema in `case.js`). Le pagine di esempio del programma sono `img/dsctm-*.jpg` (estratte dal PDF ufficiale).
