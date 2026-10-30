# lorenzo-birindelli-site

Sito personale / CV online di Lorenzo Birindelli (IT/EN). HTML statico, nessuna build.

## Metterlo online con GitHub Pages

1. Crea un repository pubblico su GitHub chiamato `<tuo-username>.github.io`
   (così il sito sarà su `https://<tuo-username>.github.io`).
2. Da questa cartella:
   ```bash
   git remote add origin https://github.com/<tuo-username>/<tuo-username>.github.io.git
   git push -u origin main
   ```
3. Su GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / root**.

In alternativa, senza terminale: sul repo appena creato usa **Add file → Upload files**
e trascina `index.html` e `lorenzo.jpg`.

## Modificare
- Testi: tutto in `index.html`; ogni testo ha la versione `data-it` e `data-en`.
- Foto: sostituisci `lorenzo.jpg` (quadrata, ~800px).
