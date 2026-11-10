# Modelli 3D dell'impianto cocleare

Usati da `ci3d.js` (sezione "chi sono"). `ci-scene.bin` contiene le mesh semplificate (posizioni int16 quantizzate + indici), `ci-scene.json` dove trovarle.
Le rigenera lo script di preparazione fuori dal sito (BodyParts3D + NIH + Artec → semplificazione per raggruppamento dei vertici).

| Parte | Fonte | Licenza |
|---|---|---|
| Pelle della testa, cranio, ossa temporali, cervello, cervelletto, tronco encefalico, collicoli | BodyParts3D, © The Database Center for Life Science (https://dbarchive.biosciencedbc.jp/en/bodyparts3d/) | CC BY-SA 2.1 Japan (come indicato nei file) |
| Labirinto osseo (coclea, vestibolo, canali semicircolari) | NIH 3D, "Cochlea" 3DPX-001794, chris@printhuman.org (https://3d.nih.gov/entries/3DPX-001794) | CC BY 4.0 |
| Padiglione auricolare | "Ear by Artec 3D" (https://www.artec3d.com/3d-models/ear) | CC BY 3.0 |

Le mesh derivate da BodyParts3D in `ci-scene.bin` sono ridistribuite con la stessa licenza CC BY-SA 2.1 Japan.
Processore Nucleus 7 CP1000 e bobina: `cp1000.js`, ricostruiti dalle foto del processore di Lorenzo (le foto non sono nel sito). Impianto interno, elettrodi, cellule ciliate, nervo e via uditiva: `ci3d.js`, schematici, posizioni riviste con un otologo. Nessun marchio. L'impianto è a sinistra: i dati sono costruiti sul lato destro e specchiati nella scena.
`three.module.min.js` e `three.core.js`: three.js 0.187.0, licenza MIT (`LICENSE-three.txt`).
Protesi acustiche retroauricolari (fase "con le protesi"): `aid.js`, ricostruite da una foto di una protesi dell'epoca, senza marchio (la foto non è nel sito).
