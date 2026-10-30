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
Scrivi `euglena` sulla tastiera. 🦠

## Dopo ogni modifica a CSS/JS
In `index.html` aumenta il numero in `styles.css?v=N` / `main.js?v=N`, così i browser non usano la versione vecchia in cache.
