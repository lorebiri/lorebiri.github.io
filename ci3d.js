/* Impianto cocleare in 3D (sezione "chi sono").
   Anatomia vera: testa, cranio, cervello, cervelletto e tronco encefalico da BodyParts3D (CC BY-SA 2.1 JP),
   labirinto osseo da NIH 3D 3DPX-001794 (chris@printhuman.org, CC BY 4.0), padiglione da "Ear by Artec 3D" (CC BY);
   tutti modificati (semplificati e posizionati). Il processore Nucleus 7 CP1000 viene da cp1000.js (ricostruito dalle
   foto di Lorenzo). Impianto interno, elettrodi, nervo e via uditiva sono schematici, con posizioni riviste da un otologo.
   L'impianto è a SINISTRA: i dati anatomici sono costruiti sul lato destro e specchiati (gruppo "root", scala x = -1);
   tutto il resto è in coordinate finali (x positivo = sinistra del paziente, y in alto, z verso il viso, in mm).
   Racconto di 22,6 s. Prima la storia (ipoacusia neurosensoriale bilaterale progressiva, esordio ipotizzato a ~15 mesi,
   causa non nota; schema del caso più frequente): cellule ciliate che funzionano, che si spengono con le protesi,
   poi a ~8 anni l'impianto a sinistra. Poi i passi 1-5 dell'elenco accanto.
   Si carica solo quando la sezione si avvicina; senza WebGL resta l'illustrazione statica. */
// three.js e i modelli si scaricano solo quando la sezione si avvicina (vedi start)
let THREE, buildCP1000, buildAid;

const box = document.querySelector('.ci3d');
if (box) init(box);

function init(box) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // telefono: meno pixel e niente antialias (scena più leggera)
  const small = innerWidth < 700 || matchMedia('(pointer: coarse)').matches;
  // telefono o movimento ridotto: three.js e i modelli (~2,5 MB) si scaricano solo se si tocca «Guarda in 3D» o un passo;
  // prima si vede il fotogramma statico (poster). Su desktop si carica vicino alla sezione e parte da solo.
  const gated = small || reduce;
  box.classList.toggle('ci3d-gated', gated);
  let loading = null, api = null, pendingStep = null;
  const load = play => loading || (loading = (box.classList.add('ci3d-loading'), start(play))
    .catch(() => box.classList.add('ci3d-off')).finally(() => box.classList.remove('ci3d-loading')));
  if (!gated) {
    const io = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; io.disconnect(); load(true); }, { rootMargin: '400px 0px' });
    io.observe(box);
  }
  const startBtn = box.querySelector('.ci3d-start');
  if (startBtn) startBtn.addEventListener('click', () => load(!reduce));
  // telefono: sopra la scena resta una sola didascalia (fase o passo); l'orientamento va sotto, fuori dal riquadro
  if (small) {
    const below = document.createElement('div'); below.className = 'ci3d-below';
    box.querySelector('.ci3d-stage').after(below);
    box.querySelectorAll('.ci3d-lab[data-n^="o"]').forEach(l => below.append(l));
  }
  // i passi dell'elenco portano la scena a quel punto (pulsanti .ci-go; se mancano, il <li> stesso), anche prima del caricamento
  const stepItems = [...document.querySelectorAll('.ci-steps:not(.ci-full) li')];
  const itemN = li => [...li.parentElement.children].indexOf(li) + 1;   // passo dentro il proprio elenco (italiano / inglese)
  stepItems.forEach(li => {
    const b = li.querySelector('.ci-go'), go = () => { const n = itemN(li); if (api) api.go(n); else { pendingStep = n; load(false); } };
    if (b) { b.addEventListener('click', go); return; }
    li.tabIndex = 0; li.setAttribute('role', 'button');
    li.addEventListener('click', go); li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  box.ci3dLoad = () => load(false);                                      // per le prove

  async function start(autoplay) {
    [THREE, { buildCP1000 }, { buildAid }] = await Promise.all([
      import('./3d/three.module.min.js'), import('./cp1000.js?v=3'), import('./aid.js?v=5')]);
    const canvas = document.createElement('canvas');
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: true, powerPreference: 'low-power' }); }
    catch (e) { box.classList.add('ci3d-off'); return; }
    const [man, buf] = await Promise.all([
      fetch('3d/ci-scene.json?v=3').then(r => r.json()),
      fetch('3d/ci-scene.bin?v=3').then(r => r.arrayBuffer())
    ]);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.25 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    box.querySelector('.ci3d-stage').prepend(canvas);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff4ec, 0x3a2a30, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(200, 260, 180); scene.add(key);
    const rim = new THREE.DirectionalLight(0x8fb4ff, 1.6); rim.position.set(-160, 80, -220); scene.add(rim);
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const M = a => V(-a[0], a[1], a[2]);            // dal lato dei dati (destro) al lato dell'impianto (sinistro)
    const D = a => V(a[0], a[1], a[2]);             // lato opposto (orecchio destro, senza impianto)

    /* ---------- anatomia ---------- */
    const mat = {
      skin: new THREE.MeshPhysicalMaterial({ color: 0xe2ad95, roughness: .62, sheen: .4, sheenColor: 0xffd6c8 }),
      // il padiglione (scansione) ha un'altra densità di triangoli: colore e lucentezza tarati per uguagliare la pelle della testa
      pinna: new THREE.MeshPhysicalMaterial({ color: 0xd49a82, roughness: .66, sheen: .25, sheenColor: 0xffd6c8 }),
      skull: new THREE.MeshStandardMaterial({ color: 0xf1e7d4, roughness: .8 }),
      cortex: new THREE.MeshPhysicalMaterial({ color: 0xe7a1a4, roughness: .42, clearcoat: .35, clearcoatRoughness: .5 }),
      white: new THREE.MeshStandardMaterial({ color: 0xf2d9cf, roughness: .6 }),
      cerebellum: new THREE.MeshStandardMaterial({ color: 0xd88a91, roughness: .5 }),
      stem: new THREE.MeshStandardMaterial({ color: 0xe2a3a3, roughness: .5 }),
      colliculus: new THREE.MeshStandardMaterial({ color: 0xe2a3a3, roughness: .4, emissive: 0xffb000, emissiveIntensity: 0 }),
      labyrinth: new THREE.MeshPhysicalMaterial({ color: 0xa9d8ff, roughness: .25, clearcoat: .7, emissive: 0x1f7dff, emissiveIntensity: .22, transparent: true })
    };
    const stemC = new THREE.Color(0xe2a3a3), icC = new THREE.Color(0xffcf4a);
    const use = { skin: 'skin', pinna: 'pinna', skull: 'skull', temporal: 'skull', cortex: 'cortex', white: 'white', cerebellum: 'cerebellum',
      stem: 'stem', colliculus: 'colliculus', labyrinth: 'labyrinth' };
    // il padiglione è una scansione aperta: il bordo (attacco alla testa, sotto il lobo, un buco in cima all'elica) è
    // seghettato. Lo ammorbidisco spostando ogni vertice del bordo verso la media dei suoi due vicini sul bordo.
    function smoothBorder(f, idx, iters) {
      const E = new Map(), key = (a, b) => a < b ? a * 1e6 + b : b * 1e6 + a;
      for (let t = 0; t < idx.length; t += 3) for (let k = 0; k < 3; k++) { const e = key(idx[t + k], idx[t + (k + 1) % 3]); E.set(e, (E.get(e) || 0) + 1); }
      const nb = new Map();
      for (const [e, n] of E) if (n === 1) { const a = Math.floor(e / 1e6), b = e % 1e6;
        (nb.get(a) || nb.set(a, []).get(a)).push(b); (nb.get(b) || nb.set(b, []).get(b)).push(a); }
      const vs = [...nb].filter(([, l]) => l.length === 2);
      for (let it = 0; it < iters; it++) {
        const nw = vs.map(([v, [a, b]]) => [0, 1, 2].map(k => .5 * f[v * 3 + k] + .25 * (f[a * 3 + k] + f[b * 3 + k])));
        vs.forEach(([v], i) => { for (let k = 0; k < 3; k++) f[v * 3 + k] = nw[i][k]; });
      }
    }
    const root = new THREE.Group(); root.scale.x = -1; scene.add(root);
    for (const [name, m] of Object.entries(man.meshes)) {
      const p = new Int16Array(buf, m.pos, m.nv * 3), f = new Float32Array(m.nv * 3);
      for (let i = 0; i < m.nv; i++) for (let k = 0; k < 3; k++) f[i * 3 + k] = (p[i * 3 + k] + 32500) * man.q[k] + man.min[k];
      const idx = m.i32 ? new Uint32Array(buf, m.idx, m.nt * 3) : new Uint16Array(buf, m.idx, m.nt * 3);
      if (/pinna|skin/.test(name)) smoothBorder(f, idx, /pinna/.test(name) ? 8 : 4);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(f, 3));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.computeVertexNormals();
      const mesh = new THREE.Mesh(g, mat[use[name]] || mat.skin);
      mesh.renderOrder = /skin|pinna/.test(name) ? 3 : /skull|temporal/.test(name) ? 2 : 0;
      root.add(mesh);
      // orecchio destro: padiglione e labirinto sono gli stessi del sinistro, specchiati (non duplicati nel .bin)
      if (name === 'pinna' || name === 'labyrinth') { const r = new THREE.Mesh(g, mesh.material); r.renderOrder = mesh.renderOrder; r.scale.x = -1; root.add(r); }
    }
    for (const k of ['skin', 'pinna', 'skull', 'cortex', 'white', 'cerebellum']) { mat[k].transparent = true; mat[k].side = THREE.DoubleSide; }
    mat.stem.transparent = true;

    const C = man.cochlea;
    const ccL = M(C.center), ccR = D(C.center), rwL = M(C.rw);
    const tube = (pts, r, m, seg = 80) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, 10), m);

    /* ---------- processore CP1000 e bobina (ricostruiti dalle foto, cp1000.js) ---------- */
    const cp = buildCP1000(THREE);
    cp.proc.traverse(o => { if (o.material && o.material.transmission) { o.material.transmission = 0; o.material.opacity = Math.max(o.material.opacity, .75); } });   // leggero sui telefoni
    // locale del processore: x → avanti, y → su, z → verso la testa (lato sinistro)
    const impl = new THREE.Group(); scene.add(impl);              // tutto l'impianto: compare a ~8 anni nel racconto
    const procWrap = new THREE.Group(); impl.add(procWrap);
    cp.proc.matrixAutoUpdate = false; cp.proc.matrix.makeBasis(V(0, 0, 1), V(0, 1, 0), V(-1, 0, 0));
    // gancio sopra il padiglione, corpo nel solco dietro l'orecchio, batteria in giù dietro il lobo
    procWrap.add(cp.proc); procWrap.position.set(79, 5, -17); procWrap.rotation.x = 25 * Math.PI / 180;
    // bobina sulla pelle, sopra il ricevitore: davanti (+z locale) verso l'esterno, coda verso il processore
    // la bobina si appoggia alla pelle e la calamita la tiene sopra il ricevitore: normale misurata sulla superficie della testa
    // (piano locale della pelle in (65.5, 42, -42), normale (0.89, 0.09, -0.46)); il retro della bobina tocca la pelle
    const coilN = V(.89, .09, -.46).normalize(), coilPos = V(65.5, 42, -42).addScaledVector(coilN, 3.5);
    const tail = V(0, -1, .35); tail.addScaledVector(coilN, -tail.dot(coilN)).normalize();
    const cy = tail.clone().negate(), cx = new THREE.Vector3().crossVectors(cy, coilN);
    cp.coil.matrixAutoUpdate = false; cp.coil.matrix.makeBasis(cx, cy, coilN).setPosition(coilPos); impl.add(cp.coil);
    scene.updateMatrixWorld(true);
    const cableA = cp.anchors.cableStart.clone().applyMatrix4(cp.proc.matrixWorld);
    const plugD = cp.anchors.plugDir.clone().transformDirection(cp.proc.matrixWorld);
    const cableB = cp.anchors.coilCableStart.clone().applyMatrix4(cp.coil.matrixWorld);
    // una sola curva ampia, come nelle foto: esce dallo spinotto e risale verso la coda della bobina
    const coilCable = new THREE.CubicBezierCurve3(cableA, cableA.clone().addScaledVector(plugD, 9), cableB.clone().addScaledVector(tail, 9), cableB);
    const cableMesh = cp.cable(coilCable.getPoints(40)); impl.add(cableMesh);
    const led = cp.led;
    // microfoni del CP1000 (anelli nel dorso, da cp1000.js): posizione e normale verso fuori, nel mondo
    const mics = [];
    cp.proc.traverse(o => { if (o.geometry && o.geometry.type === 'TorusGeometry' && Math.abs(o.geometry.parameters.radius - .82) < .01) {
      const m = o.matrixWorld; mics.push({ p: V(0, 0, 0).applyMatrix4(m), n: new THREE.Vector3().setFromMatrixColumn(m, 2).normalize() }); } });
    const micMid = mics[0].p.clone().lerp(mics[1].p, .5), micN = mics[0].n.clone().add(mics[1].n).normalize();
    const procC = V(0, 0, 0).applyMatrix4(cp.proc.matrixWorld);

    /* ---------- impianto interno (schematico): ricevitore sull'osso, filo, elettrodi, MP1 ---------- */
    const ti = new THREE.MeshStandardMaterial({ color: 0xc9cdd4, metalness: .65, roughness: .3 });
    const silicone = new THREE.MeshPhysicalMaterial({ color: 0xe9ecef, roughness: .35, clearcoat: .5 });
    const recPos = V(65.5, 42, -42).addScaledVector(coilN, -6.3);           // ricevitore sull'osso, sotto la bobina (pelle ~5–6 mm)
    const rec = new THREE.Group(); rec.position.copy(recPos); rec.quaternion.setFromUnitVectors(V(0, 1, 0), coilN); impl.add(rec);
    const recM = silicone.clone(); recM.color.setHex(0xf4f6f8); recM.metalness = .3; recM.emissive = new THREE.Color(0x6f9bff); recM.emissiveIntensity = 0;   // si accende quando riceve segnale ed energia
    rec.add(new THREE.Mesh(new THREE.CylinderGeometry(11, 11.5, 3.6, 48), recM));
    const recBox = new THREE.Mesh(new THREE.BoxGeometry(13, 4.2, 12), ti); recBox.position.set(0, -.2, 13.5); rec.add(recBox);
    scene.updateMatrixWorld(true);
    const leadStart = V(0, -.2, 19).applyMatrix4(rec.matrixWorld);
    const toRw = rwL.clone().sub(ccL).normalize();
    // mastoide → antro → recesso del faciale (timpanotomia posteriore) → finestra rotonda → scala timpanica
    const leadCurve = new THREE.CatmullRomCurve3([leadStart, V(58, 18, -24), V(55, 5, -15), V(49, -11, -1), rwL.clone().addScaledVector(toRw, 3), rwL]);
    impl.add(new THREE.Mesh(new THREE.TubeGeometry(leadCurve, 90, .7, 8), silicone));
    const arrPts = [rwL, ...C.array.map(M)];
    const arrCurve = new THREE.CatmullRomCurve3(arrPts);
    impl.add(new THREE.Mesh(new THREE.TubeGeometry(arrCurve, 160, .42, 8), silicone));
    const contacts = [];
    for (let i = 0; i < 22; i++) {                                 // n.1 alla base (acuti), n.22 verso l'apice (gravi)
      const m = new THREE.MeshStandardMaterial({ color: 0xd9d9de, metalness: .9, roughness: .2, emissive: 0xffc23a, emissiveIntensity: 0 });
      const s = new THREE.Mesh(new THREE.SphereGeometry(.38, 10, 8), m);
      s.position.copy(arrCurve.getPoint(.1 + i * .04)); impl.add(s); contacts.push(m);
    }
    impl.add(tube([V(0, -.2, -11).applyMatrix4(rec.matrixWorld), V(63, 50, -26), V(60, 54, -14)], .45, silicone, 30));   // MP1 sotto il temporale
    const mp1 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 10), ti); mp1.position.set(60, 54, -14); impl.add(mp1);

    /* ---------- cellule ciliate (schema del caso più frequente): spente in entrambe le coclee ---------- */
    // f = posizione lungo la spirale (0 base = acuti, 1 apice = gravi): nello schema si spengono prima quelle della base
    // i punti dei dati stanno sulla parete esterna della scala: li porto 0,5 mm verso l'asse del modiolo, così le sferette
    // restano dentro il contorno della coclea anche in primo piano
    const inward = (p, c, ax) => { const r = p.clone().sub(c), a = r.dot(ax), rad = r.clone().addScaledVector(ax, -a), l = rad.length();
      return l > .6 ? c.clone().addScaledVector(ax, a).add(rad.multiplyScalar((l - .5) / l)) : p; };
    const hairG = new THREE.SphereGeometry(.22, 8, 6), hairs = [];
    for (const pts of [C.hair.map(p => inward(M(p), ccL, M(C.axis).normalize())), C.hair.map(p => inward(D(p), ccR, D(C.axis).normalize()))]) for (let i = 0; i < pts.length; i += 2) {
      const m = new THREE.MeshStandardMaterial({ color: 0x8a8f99, roughness: .6, emissive: 0x7fe0ff, emissiveIntensity: 0 });
      const h = new THREE.Mesh(hairG, m); h.position.copy(pts[i]); scene.add(h); hairs.push({ m, f: i / (pts.length - 1) });
    }
    /* ---------- protesi acustiche retroauricolari su entrambe le orecchie (aid.js, ricostruita dalla foto di una protesi
       dell'epoca, senza marchio). Compaiono "con le protesi" e spariscono a ~8 anni. ---------- */
    const aidSet = [];
    const aids = new THREE.Group(); scene.add(aids);
    // posa (revisione otologica + verifica sulle superfici del modello): cima del gancio sopra l'attacco superiore del
    // padiglione, corpo che scende nel solco dietro il padiglione appoggiato alla testa (come il CP1000), chiocciola nella
    // conca con la punta ~4 mm dentro il condotto uditivo; il tubicino (aid.js, fit) collega gancio e chiocciola.
    // Rotazioni nel riferimento della protesi: beccheggio attorno a z (coda in giù), imbardata attorno a y, rollio attorno a x.
    const aidPose = { pit: 34, yaw: 6, rol: 0, hook: [83.6, 24.6, -7], tip: [64, -17, 15], moldTilt: [0, 0, -15], moldScale: .88 };   // chiocciola un po' più piccola: sta tutta nella conca
    function placeAid(a, s, P) {
      const D = Math.PI / 180, base = new THREE.Matrix4().makeBasis(V(0, 0, 1), V(0, 1, 0), V(s, 0, 0));
      const rot = new THREE.Matrix4().makeRotationX(P.rol * D).multiply(new THREE.Matrix4().makeRotationY(P.yaw * D)).multiply(new THREE.Matrix4().makeRotationZ(P.pit * D));
      a.aid.matrixAutoUpdate = false;
      a.aid.matrix.makeTranslation(P.hook[0] * s, P.hook[1], P.hook[2]).multiply(base).multiply(rot);
      // chiocciola: orientata come nel modello (piano del profilo parallelo alla testa), con la punta nel condotto
      const mr = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(P.moldTilt[0] * D, P.moldTilt[1] * D, P.moldTilt[2] * D));
      const mw = base.clone().multiply(mr).multiply(new THREE.Matrix4().makeScale(P.moldScale ?? 1, P.moldScale ?? 1, P.moldScale ?? 1)), tipW = a.anchors.moldTip.clone().applyMatrix4(mw);
      mw.premultiply(new THREE.Matrix4().makeTranslation(P.tip[0] * s - tipW.x, P.tip[1] - tipW.y, P.tip[2] - tipW.z));
      a.fit(a.aid.matrix.clone().invert().multiply(mw), P.bulge ?? 5);
      a.aid.matrixWorldNeedsUpdate = true;
    }
    for (const s of [1, -1]) { const a = buildAid(THREE); a.side = s; aidSet.push(a); placeAid(a, s, aidPose); aids.add(a.aid); }
    // le parti trasparenti fuori dalla testa (gancio, tubicino, chiocciola, gancio del CP1000) vanno disegnate dopo pelle e
    // padiglione (renderOrder 3), altrimenti la pelle che sta dietro le ricopre: non scrivono la profondità
    for (const g of [aids, cp.proc]) g.traverse(o => { if (o.isMesh && o.material.transparent && !o.material.depthWrite) o.renderOrder = 4; });
    box.ci3dAid = P => { Object.assign(aidPose, P); aidSet.forEach(a => placeAid(a, a.side, aidPose)); };   // per le prove
    /* ---------- nervo acustico e via uditiva (incrocio all'oliva superiore) ---------- */
    const nerveM = new THREE.MeshStandardMaterial({ color: 0xffd21f, roughness: .45, emissive: 0x6b5200, emissiveIntensity: .25 });
    // dalla base del modiolo lungo il condotto uditivo interno fino al tronco (revisione otologica)
    const nervePts = s => [s === 1 ? ccL : ccR, V(41.5 * s, -13.3, 4.2), V(36 * s, -14.5, 3.5), V(30 * s, -17, 4), V(24 * s, -22, 6), V(19 * s, -26, 8)];
    const nerveCurve = new THREE.CatmullRomCurve3(nervePts(1));
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(nerveCurve, 60, .8, 10), nerveM));
    scene.add(tube(nervePts(-1), .8, nerveM, 60));
    const AC_R = V(-40, 18, 22), AC_L = V(40, 18, 22)   // giro di Heschl, in profondità nella scissura di Silvio
   , IC_R = V(-5, 2, 11), IC_L = V(5, 2, 11);
    const mainCurve = new THREE.CatmullRomCurve3([V(19, -26, 8), V(8, -25, 10), V(0, -23, 10), V(-8, -21, 10), V(-10, -10, 10), IC_R, V(-14, 8, 18), V(-30, 14, 21), AC_R]);
    const ipsiCurve = new THREE.CatmullRomCurve3([V(19, -26, 8), V(9, -24, 10), V(10, -10, 10), IC_L, V(14, 8, 18), V(30, 14, 21), AC_L]);
    const pathMat = new THREE.MeshBasicMaterial({ color: 0xff7a59, transparent: true, opacity: 0, depthWrite: false });   // invisibile non deve nascondere ciò che sta dietro
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(mainCurve, 90, .5, 6), pathMat));
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(ipsiCurve, 70, .3, 6), pathMat));

    /* ---------- luci del segnale ---------- */
    const glowTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
      const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,170,120,.9)'); g.addColorStop(1, 'rgba(255,80,40,0)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    const sprite = (size, color = 0xffffff) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true }));
      s.scale.setScalar(size); s.renderOrder = 10; scene.add(s); return s;
    };
    const pulse = sprite(9), trail = [sprite(6), sprite(4.5), sprite(3)], pulse2 = sprite(5);
    const acR = sprite(36, 0x6f8dff); acR.position.copy(AC_R);
    const acL = sprite(26, 0x6f8dff); acL.position.copy(AC_L);
    const icR = sprite(10, 0xffd04a); icR.position.copy(IC_R);
    const icL = sprite(7, 0xffd04a); icL.position.copy(IC_L);
    const preP = [sprite(7), sprite(7)];                            // il suono che arriva alle due coclee e si spegne
    const preA = [V(96, -1, 4), V(-96, -1, 4)], preB = [ccL, ccR];
    const ring = (pos, r, color) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(r, .35, 6, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }));
      m.position.copy(pos); m.rotation.y = Math.PI / 2; scene.add(m); return m;
    };
    const waves = [0, 1, 2].map(() => ring(V(118, 0, 4), 10, 0xff8a6a));
    const wavesR = [0, 1, 2].map(() => ring(V(-118, 0, 4), 10, 0xff8a6a));
    /* ---------- passi 1-3: suono nei microfoni, elaborazione, cavo, radio attraverso la pelle ---------- */
    const fxRing = (color, r = 1, tubeR = .07) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, tubeR, 6, 64),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, depthTest: false })); m.renderOrder = 11; m.visible = false; scene.add(m); return m; };
    // onde sonore: archi concentrici che arrivano da fuori (di lato e davanti alla testa) e si stringono su ciascun foro.
    // Stanno nel piano rivolto alla camera del passo 1, aperti verso il lato da cui arriva il suono.
    const micView = micN.clone().add(V(.3, .4, -.4)).normalize();          // da dove guarda la camera del passo 1
    const srcDir = V(-.2, 1, -.6);   // da sopra e da dietro: gli archi non attraversano il padiglione srcDir.addScaledVector(micView, -srcDir.dot(micView)).normalize();
    const ARC = 2.1, arcQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(srcDir, new THREE.Vector3().crossVectors(micView, srcDir), micView))
      .multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), -ARC / 2));
    const micArcs = mics.map(() => [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, .036, 6, 40, ARC),
      new THREE.MeshBasicMaterial({ color: 0xffa070, transparent: true, opacity: 0, depthWrite: false, depthTest: false })); m.renderOrder = 11; m.visible = false; m.quaternion.copy(arcQ); scene.add(m); return m; }));
    const micGlow = mics.map(mc => { const s = sprite(4); s.position.copy(mc.p); s.visible = false; return s; });
    // elaborazione: impulsi luminosi che scorrono dentro il processore, dai microfoni allo spinotto (il colore del corpo non cambia)
    const bodyPath = new THREE.CatmullRomCurve3([mics[0].p, mics[1].p, procC.clone().lerp(mics[1].p, .3), cableA]);
    const bodyPulses = [0, 1, 2, 3, 4].map(() => { const s = sprite(3.2, 0x9fc0ff); s.visible = false; return s; });
    const cableGlowM = new THREE.MeshBasicMaterial({ color: 0xffa060, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const cableGlow = new THREE.Mesh(new THREE.TubeGeometry(coilCable, 120, 1.25, 10), cableGlowM); cableGlow.renderOrder = 11; cableGlow.visible = false; scene.add(cableGlow);
    const coilGlow = sprite(16, 0xffb080); coilGlow.position.copy(coilPos); coilGlow.visible = false;
    const recTop = recPos.clone().addScaledVector(coilN, 1.8);
    const rf = [0, 1, 2].map(() => { const m = fxRing(0x9fc0ff, 1, .09); m.quaternion.setFromUnitVectors(V(0, 0, 1), coilN); return m; });
    const recGlow = sprite(15, 0x9fb6ff); recGlow.position.copy(recPos); recGlow.visible = false;
    // passo 3: "tassello" in sezione sotto la bobina, dall'esterno: pelle (0–4.5 mm) → ricevitore (4.5–8.1) → osso (da 6.9, incavo ~1 mm)
    // (revisione otologica: il ricevitore poggia sull'osso, ≤ 6 mm di tessuto tra bobina e ricevitore, calamite sullo stesso asse)
    const skin0 = V(65.5, 42, -42), layers = new THREE.Group(); layers.visible = false; scene.add(layers);
    const layerM = [new THREE.MeshStandardMaterial({ color: 0xe0705e, roughness: .7, transparent: true, opacity: 0, depthWrite: false }),
      new THREE.MeshStandardMaterial({ color: 0xcdb27a, roughness: .95, transparent: true, opacity: 0, depthWrite: false }),
      new THREE.MeshBasicMaterial({ color: 0x4a2c28, transparent: true, opacity: 0, depthWrite: false })];
    for (const [d0, d1, m] of [[0, 4.5, layerM[0]], [6.9, 14, layerM[1]]]) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(17, 17, d1 - d0, 56), m); b.renderOrder = 4;   // tassello rotondo
      b.position.copy(skin0).addScaledVector(coilN, -(d0 + d1) / 2); b.quaternion.setFromUnitVectors(V(0, 1, 0), coilN); layers.add(b);
      for (const d of [d0, d1]) {                                         // bordo sottile scuro sul contorno di ogni strato
        const e = new THREE.Mesh(new THREE.TorusGeometry(17, .22, 6, 72), layerM[2]); e.renderOrder = 5;
        e.position.copy(skin0).addScaledVector(coilN, -d); e.quaternion.setFromUnitVectors(V(0, 0, 1), coilN); layers.add(e);
      }
    }

    /* ---------- tratti del segnale ---------- */
    const seg = {
      lead: leadCurve, array: arrCurve, nerve: nerveCurve, path: mainCurve
    };

    /* ---------- camera ---------- */
    const camera = new THREE.PerspectiveCamera(32, 1, 1, 3000);
    const sideC = cx.z < 0 ? cx.clone() : cx.clone().negate();      // lungo la pelle, dal lato della nuca
    const shots = {
      f0: [V(250, 45, -95), V(72, 4, -12)],                     // oggi, da fuori: la testa e il CP1000 dietro l'orecchio sinistro
      back1: [V(45, 120, -235), V(0, -8, -4)],                  // da dietro: le due coclee
      back: [V(0, 140, -240), V(0, -6, -6)],                    // da dietro: le due protesi, intere nel riquadro
      coch3: [ccL.clone().add(V(36, 10, 30)), ccL.clone()],     // orecchio interno sinistro da vicino, con gli elettrodi (il filo resta dietro)
      // passo 1: da vicino sul dorso del processore, dove ci sono i due microfoni
      // da dietro e un po' dall'alto: si vede il retro liscio del padiglione, non il bordo aperto della scansione
      mic: [micMid.clone().lerp(procC, .3).addScaledVector(micView, 100), micMid.clone().lerp(procC, .3)],
      mic2: [micMid.clone().lerp(procC, .45).addScaledVector(micN.clone().add(V(.35, .5, -.25)).normalize(), 96), micMid.clone().lerp(procC, .45)],
      // passo 2: la camera segue il cavo dallo spinotto alla bobina
      // un'unica inquadratura con spinotto e bobina insieme: la camera scivola appena dal processore verso la bobina
      cab0: [cableA.clone().lerp(coilPos, .4).add(V(1, .25, -.3).normalize().multiplyScalar(165)), cableA.clone().lerp(coilPos, .4)],
      cab1: [cableA.clone().lerp(coilPos, .62).add(V(1, .25, -.25).normalize().multiplyScalar(150)), cableA.clone().lerp(coilPos, .62)],
      // passo 3: bobina e ricevitore di sbieco, con la pelle trasparente in mezzo
      // quasi di taglio, lungo la pelle: sopra la bobina, sotto (attraverso la pelle trasparente) il ricevitore
      coil: [coilPos.clone().lerp(recPos, .5).add(sideC.clone().multiplyScalar(1).addScaledVector(coilN, .3).add(V(0, .12, 0)).normalize().multiplyScalar(95)), coilPos.clone().lerp(recPos, .5)],
      coil2: [coilPos.clone().lerp(recPos, .5).add(sideC.clone().multiplyScalar(1).addScaledVector(coilN, .25).add(V(0, .08, 0)).normalize().multiplyScalar(88)), coilPos.clone().lerp(recPos, .5)],
      in: [V(135, -6, 125), V(48, -2, 2)],
      coch: [ccL.clone().add(V(28, 30, 22)), ccL.clone()],
      brain: [V(150, 190, 250), V(0, 4, 8)]
    };
    // F0 (0–2,5 s) oggi, da fuori · poi, in tempo di racconto u = t − F0: 0–2,4 fino a ~15 mesi · 2,4–5,2 con le protesi ·
    // 5,2–7,6 ~8 anni · poi l'impianto (passi 1–5)
    // I passi 1-3 (microfoni → processore → cavo → bobina → pelle → ricevitore) durano 3 s in più: nel tempo del racconto ts
    // occupano 7,8–14,8; da 14,8 in poi tutto è come prima spostato di DX (in frame: t = tempo "vecchio" per il resto della scena)
    const DX = 3, F0 = 2.5, T = 22.6 + DX + F0;
    const tl = { lead: [12.0, 14.2], array: [14.2, 16.2], nerve: [16.4, 17.8], path: [17.8, 19.4] };
    const camKeys = [[-F0, 'f0'], [-.9, 'f0'], [0, 'back1'], [2.4, 'back1'], [3.2, 'back'], [4.4, 'back'], [5.6, 'coch3'], [6.8, 'coch3'],
      [8.2, 'mic'], [10.5, 'mic2'], [11.3, 'cab0'], [12.7, 'cab1'], [13.4, 'coil'], [14.8, 'coil2'], [15.8, 'in'], [17.4, 'coch'],
      [19.4, 'coch'], [21.0, 'brain'], [23.8, 'brain'], [25.6, 'f0']].map(([a, b]) => [a + F0, b]);
    const steps = [[-F0, 'f0'], [0, 'f1'], [2.4, 'f2'], [5.2, 'f3'], [7.8, 1], [10.9, 2], [14.35, 3], [15.0, 4], [19.4, 5], [23.8, 0]];
    const stepT = { 1: 9.0 + F0, 2: 12.0 + F0, 3: 14.5 + F0, 4: 18.2 + F0, 5: 22.0 + F0 };
    // etichette piccole che accompagnano il segnale (tempo ts)
    const tags = { m1: [8.3, 9.9], m2: [9.8, 10.95], m3: [11.05, 13.05], m4: [13.4, 14.95], sk: [13.5, 15.2], bo: [13.5, 15.2] };
    const withLab = { f0: ['f0'], f1: ['f1', 'o12'], f2: ['f2', 'o12'], f3: ['f3', 'o3'] };   // didascalia della fase e orientamento
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const lerp = (a, b, t) => a + (b - a) * t;
    const win = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
    const bump = (t, a, b) => win(t, a, a + .3) * (1 - win(t, b - .3, b));

    let yaw = 0, pitch = 0, drag = null, dbgCam = null;
    canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw, pitch }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => { if (!drag) return; yaw = drag.yaw - (e.clientX - drag.x) * .008; pitch = Math.max(-.9, Math.min(.9, drag.pitch + (e.clientY - drag.y) * .006)); kick(); });
    const endDrag = () => { drag = null; }; canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);

    const items = stepItems;
    const labels = [...box.querySelectorAll('.ci3d-lab')];
    const labelAt = { 1: procC.clone().addScaledVector(micN, -6).add(V(0, -16, 0)), 2: coilPos.clone().addScaledVector(cy, 21).addScaledVector(coilN, 3), 3: recPos.clone(), 4: ccL, 5: AC_R,
      m1: micMid.clone().addScaledVector(micN, 4), m2: micMid.clone().addScaledVector(micN, 4), m3: coilCable.getPoint(0), m4: coilPos.clone().addScaledVector(cy, 16).addScaledVector(coilN, 4),
      sk: V(65.5, 42, -42).addScaledVector(coilN, -2.2).addScaledVector(cy, -17), bo: V(65.5, 42, -42).addScaledVector(coilN, -11).addScaledVector(cy, -17) };   // sotto il tassello, sfalsate   // sopra la bobina; l'impianto ha l'etichetta sotto
    let curStep = null;
    function setStep(n) {
      if (n === curStep) return; curStep = n;
      items.forEach(li => li.classList.toggle('on', itemN(li) === n));
      const on = withLab[n] || [String(n)];
      labels.forEach(l => { if (!tags[l.dataset.n]) l.classList.toggle('on', on.includes(l.dataset.n)); });
    }

    const playBtn = box.querySelector('.ci3d-play');
    let playing = false, t0 = performance.now(), tPause = reduce ? stepT[4] : 0;
    // il pulsante cambia scritta e icona («❚❚ pausa» / «▶ riproduci»): niente aria-pressed, che con un'etichetta che cambia confonde
    playBtn.removeAttribute('aria-pressed');
    const showPlay = () => playBtn.classList.toggle('paused', !playing);
    const setPlaying = p => {
      if (!p && playing) tPause = clock();
      playing = p; showPlay();
      if (p) t0 = performance.now() - tPause * 1000 / SPEED;
      kick();
    };
    playBtn.addEventListener('click', () => setPlaying(!playing));
    showPlay();
    const SPEED = .65;                                                 // racconto rallentato: un giro dura ~39 s
    const clock = () => playing ? ((performance.now() - t0) / 1000 * SPEED) % T : tPause;
    // i passi dell'elenco portano la scena a quel punto (anche da tastiera)
    const goStep = n => { if (playing) setPlaying(false); tPause = stepT[n]; kick(); };

    function frame() {
      const tt = clock(), ts = tt - F0;                             // ts: tempo del racconto, negativo in F0
      const t = ts < 11.8 ? ts : ts < 11.8 + DX ? 11.8 : ts - DX;   // t: tempo "di prima" per tutto ciò che non riguarda i passi 1-3
      let i = 0; while (i < camKeys.length - 2 && tt >= camKeys[i + 1][0]) i++;
      const [ta, sa] = camKeys[i], [tb, sb] = camKeys[i + 1], k = ease(win(tt, ta, tb));
      const pos = shots[sa][0].clone().lerp(shots[sb][0], k), tgt = shots[sa][1].clone().lerp(shots[sb][1], k);
      if (!drag) { yaw *= .97; pitch *= .97; }
      if (dbgCam) { pos.copy(dbgCam[0]); tgt.copy(dbgCam[1]); }
      // riquadro stretto (telefono): nelle inquadrature del dispositivo il centro si sposta verso processore e bobina, così non escono dal bordo
      const devW = (/^(out|ear|f0)$/.test(sa) ? 1 - k : 0) + (/^(out|ear|f0)$/.test(sb) ? k : 0);
      if (camera.aspect < 1.25) tgt.lerp(V(78, 18, -26), devW * Math.min(1, (1.25 - camera.aspect) * 2.2));
      // passi 1-2 (microfoni, cavo) nel riquadro quadrato: il processore è lungo e la bobina sta di lato, quindi
      // centro tra processore e bobina e camera più lontana, così il dispositivo resta intero (sul desktop non cambia nulla)
      const closeW = (/^(mic|mic2|cab0|cab1)$/.test(sa) ? 1 - k : 0) + (/^(mic|mic2|cab0|cab1)$/.test(sb) ? k : 0);
      const sq = camera.aspect < 1.25 ? closeW * Math.min(1, (1.25 - camera.aspect) * 4) : 0;
      if (sq) tgt.lerp(procC.clone().lerp(coilPos, .45), sq);
      const off = pos.sub(tgt).multiplyScalar(Math.max(1, 1.3 / camera.aspect) * (1 + .4 * sq));   // riquadro quadrato (telefono): un po' più lontano
      const sph = new THREE.Spherical().setFromVector3(off);
      sph.theta += yaw; sph.phi = Math.max(.15, Math.min(Math.PI - .15, sph.phi - pitch));
      camera.position.copy(tgt).add(new THREE.Vector3().setFromSpherical(sph)); camera.lookAt(tgt);
      camera.updateMatrixWorld();   // subito: le etichette si proiettano prima del render (senza, dopo un salto restano al posto vecchio)
      // trasparenze: nelle fasi iniziali (si vedono le coclee), poi dentro la testa, poi il cervello
      // F0: testa opaca vista da fuori; poi le fasi del racconto a testa trasparente; alla fine si torna opachi
      const pre = win(t, -.9, -.1) * (1 - win(t, 7.0, 8.0));
      const inside = Math.max(pre, win(t, 11.8, 13.2) * (1 - win(t, 21.0, 22.2)));
      const close = Math.max(win(t, 4.8, 5.6) * (1 - win(t, 6.8, 7.6)), win(t, 13.6, 14.4) * (1 - win(t, 16.4, 17.2)));
      mat.skin.opacity = lerp(lerp(1, .1, inside), .07, pre); mat.skin.depthWrite = inside < .3;   // quasi opaca: scrive la profondità, niente buchi da ordinamento
      // passo 3: la pelle si fa trasparente (la camera è vicina alla bobina) e sotto si vede il ricevitore
      mat.skull.opacity = lerp(lerp(lerp(1, .18, inside), .1, pre), .06, close); mat.skull.depthWrite = inside < .3;
      const skinWin = ts > 13.0 && ts < 16.2 ? win(ts, 13.0, 13.6) : 0;
      if (skinWin > 0) { mat.skin.opacity = Math.min(mat.skin.opacity, lerp(1, .25, skinWin)); mat.skin.depthWrite = skinWin < .3 && mat.skin.depthWrite;
        mat.skull.opacity = Math.min(mat.skull.opacity, lerp(1, .12, skinWin)); mat.skull.depthWrite = skinWin < .3 && mat.skull.depthWrite; }
      mat.pinna.opacity = mat.skin.opacity; mat.pinna.depthWrite = mat.skin.depthWrite;
      const see = inside * (1 - win(t, 20.0, 21.0));
      const hideBrain = skinWin * (1 - win(ts, 15.0, 15.8));             // passo 3: niente cervello rosa dietro il tassello
      // nelle fasi iniziali cervello più trasparente: coclee e nervi devono staccarsi dal rosa
      mat.cortex.opacity = lerp(lerp(lerp(lerp(1, .3, see), .13, pre), .1, close), .03, hideBrain); mat.cortex.depthWrite = see < .3 && hideBrain < .05;
      mat.white.opacity = lerp(1, 0, see) * (1 - hideBrain); mat.white.visible = see < .98 && hideBrain < .95; mat.white.depthWrite = see < .05 && hideBrain < .05;
      mat.cerebellum.opacity = lerp(lerp(1, .45, see), .2, pre); mat.cerebellum.depthWrite = see < .3;
      pathMat.opacity = .7 * win(t, 17.2, 18.0) * (1 - win(t, 20.6, 21.4));
      pathMat.visible = pathMat.opacity > .005;
      impl.visible = t < 0 || t >= 5.2;                                  // oggi (F0) e da ~8 anni: stessi istanti delle didascalie
      mat.labyrinth.emissiveIntensity = lerp(.22, .55, Math.max(pre, close));   // resta azzurra anche da vicino
      // da vicino la coclea si fa un po' trasparente: dentro si vedono elettrodi e cellule ciliate
      mat.labyrinth.opacity = lerp(1, .55, close); mat.labyrinth.depthWrite = close < .05;
      mat.stem.opacity = lerp(1, .6, pre); mat.stem.depthWrite = pre < .05;   // tronco meno dominante nelle fasi iniziali
      nerveM.emissiveIntensity = lerp(.25, .6, pre);
      // perché sono sordo (schema del caso più frequente): onde a entrambe le orecchie in tre momenti
      const phase = t < 0 ? -1 : t < 2.4 ? 0 : t < 5.2 ? 1 : t < 7.6 ? 2 : 3, p0 = [0, 2.4, 5.2][phase] || 0;
      const amp = phase === 0 ? 1 : 1.6;                                   // con le protesi il suono arriva amplificato
      [waves, wavesR].forEach((ws, side) => ws.forEach((w, j) => {
        const q = phase >= 0 && phase < 3 ? win(t, p0 + .1 + j * .3, p0 + 1.3 + j * .3) : 0;
        w.material.opacity = q > 0 && q < 1 ? .8 * (1 - q) : 0; w.scale.setScalar((.4 + q * 1.4) * amp);
        w.position.x = (side ? -1 : 1) * lerp(128, 96, win(t, p0 + .1, p0 + 1.9));
      }));
      const alive = 1 - .75 * win(t, 2.6, 5.0) - .2 * win(t, 5.2, 6.4);      // quota di cellule ciliate che funzionano ancora
      const hit = phase >= 0 && phase < 3 ? bump(t, p0 + 1.0, p0 + 2.2) : 0;               // il suono arriva alla coclea
      hairs.forEach(h => {
        const on = h.f >= 1 - alive;
        h.m.color.setHex(on ? 0xbfe9ff : 0x6d717a); h.m.emissiveIntensity = on ? .25 + 1.2 * hit : 0;
      });
      const nerveSig = phase === 0 ? 1 : phase === 1 ? .5 * (alive + .2) : 0; // segnale che parte verso il nervo
      preP.forEach((s, j) => {
        const go = win(t, p0 + .4, p0 + 1.2), up = win(t, p0 + 1.2, p0 + 2.0);
        s.visible = phase >= 0 && phase < 3 && t > p0 + .4 && t < p0 + 2.2;
        if (!s.visible) return;
        const nc = j ? nervePts(-1) : nervePts(1);
        if (up <= 0 || nerveSig <= 0) { s.position.copy(preA[j]).lerp(preB[j], ease(go)); s.material.opacity = phase === 2 ? 1 - win(t, p0 + 1.2, p0 + 2.2) : 1;
          s.material.color.setHSL(.06, phase === 2 ? 1 - win(t, p0 + 1.2, p0 + 2) : 1, .55); s.scale.setScalar(phase === 2 ? (7 - 4 * win(t, p0 + 1.2, p0 + 2.2)) * .4 : 7); }   // in F3 la camera è vicina: luce piccola
        else { s.position.copy(nc[Math.min(5, Math.floor(up * 5))]).lerp(nc[Math.min(5, Math.floor(up * 5) + 1)], (up * 5) % 1); s.material.opacity = nerveSig; s.scale.setScalar(4 + 3 * nerveSig); s.material.color.setHSL(.06, 1, .55); }
      });
      const aidO = win(t, 2.4, 2.9) * (1 - win(t, 5.0, 5.2));             // protesi solo durante la didascalia F2
      aids.visible = aidO > .01; if (aids.visible) aidSet.forEach(x => x.setOpacity(aidO));
      if (box.ci3dShowAids) { aids.visible = true; aidSet.forEach(x => x.setOpacity(box.ci3dShowAids)); impl.visible = false; }   // per le prove
      // il segnale con l'impianto
      let p = null;
      for (const [name, [a, b]] of Object.entries(tl)) if (t >= a && t < b) p = seg[name].getPoint(win(t, a, b));
      pulse.visible = !!p; trail.forEach(s => s.visible = !!p);
      const near = t > 13.4 && t < 16.8 ? .3 : 1;   // da vicino la luce non deve coprire la coclea
      pulse.scale.setScalar(9 * near); trail.forEach((s, j) => s.scale.setScalar((6 - j * 1.5) * near));
      if (p) { trail[2].position.copy(trail[1].position); trail[1].position.copy(trail[0].position); trail[0].position.copy(pulse.position); pulse.position.copy(p); }
      pulse2.visible = t >= tl.path[0] && t < tl.path[1]; if (pulse2.visible) pulse2.position.copy(ipsiCurve.getPoint(win(t, ...tl.path)));
      // passo 1: onde che si stringono ed entrano nei due fori dei microfoni, i fori si accendono, poi il processore "lavora"
      micArcs.forEach((rs, i) => rs.forEach((r, j) => {
        const a = 8.2 + j * .35 + i * .1, q = win(ts, a, a + 1.1);
        r.visible = q > 0 && q < 1; if (!r.visible) return;
        r.position.copy(mics[i].p); r.scale.setScalar(lerp(20, 1.2, q));                      // da lontano fino al foro
        r.material.opacity = (.6 + .35 * q) * Math.min(1, q * 4) * (1 - win(q, .85, 1));   // più nitide vicino al foro
      }));
      micGlow.forEach((s, i) => { const b = bump(ts, 8.9 + i * .15, 10.2); s.visible = b > 0; s.material.opacity = .9 * b; s.scale.setScalar(3.5 + 1.5 * Math.sin(ts * 12) ** 2); });
      bodyPulses.forEach((s, j) => { const q = win(ts, 9.7 + j * .22, 10.5 + j * .22);
        s.visible = q > 0 && q < 1; if (!s.visible) return;
        s.position.copy(bodyPath.getPoint(q)); s.material.opacity = .9 * Math.sin(Math.PI * q); s.material.color.setHex(q > .8 ? 0xffb080 : 0x9fc0ff); });
      // passo 2: il cavo si accende dallo spinotto alla coda della bobina
      const fc = win(ts, 11.1, 12.7), cOn = ts > 11.05 && ts < 13.5;
      cableGlow.visible = cOn; if (cOn) { cableGlowM.opacity = .9 * (1 - win(ts, 13.0, 13.5)); cableGlow.geometry.setDrawRange(0, Math.ceil(fc * 120) * 60); }
      labelAt.m3.copy(coilCable.getPoint(fc));
      if (ts > 11.05 && ts < 12.75) { pulse.visible = true; pulse.position.copy(coilCable.getPoint(fc)); pulse.scale.setScalar(6); }
      const cg = bump(ts, 12.6, 13.6); coilGlow.visible = cg > 0; coilGlow.material.opacity = .8 * cg;
      // passo 3: anelli radio dalla bobina, attraverso la pelle, fino al ricevitore, che si accende
      rf.forEach((r, j) => { const a = 13.5 + j * .4, q = win(ts, a, a + .9);
        r.visible = q > 0 && q < 1; if (!r.visible) return;
        r.position.copy(coilPos).lerp(recTop, q); r.scale.setScalar(lerp(5, 9, q)); r.material.opacity = .95 * Math.min(1, q * 5) * (1 - .5 * q); });
      const rg = bump(ts, 14.3, 15.1); recGlow.visible = rg > 0; recGlow.material.opacity = .85 * rg;
      recM.emissiveIntensity = 1.4 * rg * (.7 + .3 * Math.sin(ts * 20));   // il ricevitore riceve segnale ed energia: lampeggia
      const lw = skinWin * (1 - win(ts, 15.0, 15.6));
      layers.visible = lw > .01; layerM[0].opacity = .6 * lw; layerM[1].opacity = .95 * lw; layerM[2].opacity = .8 * lw;   // strati ben distinti; il ricevitore sta in mezzo
      if (led) led.material.color && led.material.color.setHex(playing && (tt % 1.5) < .12 ? 0x0c3b1f : 0x2ecc71);
      contacts.forEach((m, j) => { const a = 14.2 + j * .08; m.emissiveIntensity = t >= a && t < 17.2 ? Math.max(0, 1.8 - (t - a) * .9) : 0; });
      const cIC = Math.max(0, 1 - Math.abs(t - 18.5) * 2);
      mat.colliculus.emissiveIntensity = cIC; mat.colliculus.color.lerpColors(stemC, icC, cIC);
      icR.material.opacity = cIC; icL.material.opacity = .5 * cIC;   // il collicolo è giallo solo quando il segnale ci passa
      const g = win(t, 19.0, 19.6) * (1 - win(t, 21.0, 22.0));
      acR.material.opacity = g * (.8 + .2 * Math.sin(t * 6)); acR.scale.setScalar(30 + 12 * g);
      acL.material.opacity = .22 * g; acL.scale.setScalar(16);   // il lato opposto all'impianto riceve di più
      let st = 0; for (const [a, n] of steps) if (ts >= a) st = n; setStep(st);
      labels.forEach(l => { const w = tags[l.dataset.n]; if (w) l.classList.toggle('on', ts >= w[0] && ts < w[1]); });
      labels.forEach(l => {
        const w = labelAt[l.dataset.n]; if (!w) return;
        const s = w.clone().project(camera);
        // l'etichetta resta sempre dentro il riquadro (sui telefoni lo spazio è poco)
        const wl = l.offsetWidth, flip = false;
        let x = (s.x * .5 + .5) * cw + (flip ? -wl - 12 : 12), y = (-s.y * .5 + .5) * ch - 30;
        x = Math.max(6, Math.min(cw - wl - 6, x)); y = Math.max(6, Math.min(ch - l.offsetHeight - 6, y));
        l.style.transform = `translate(${x}px,${y}px)`;
        l.hidden = s.z > 1;
      });
      renderer.render(scene, camera);
    }

    let cw = 0, ch = 0;
    function size() {
      const r = box.querySelector('.ci3d-stage').getBoundingClientRect(); cw = r.width; ch = r.height;
      renderer.setSize(cw, ch, false); camera.aspect = cw / ch; camera.updateProjectionMatrix();
    }
    new ResizeObserver(() => { size(); kick(); }).observe(box.querySelector('.ci3d-stage'));
    size();

    let visible = true, raf = 0;
    function loop() { raf = 0; frame(); if (visible && !document.hidden && (playing || drag || Math.abs(yaw) + Math.abs(pitch) > .002)) raf = requestAnimationFrame(loop); }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(box);
    document.addEventListener('visibilitychange', kick);
    box.classList.add('ci3d-on');
    // per le prove: istante preciso e camera libera
    box.ci3dCam = (p, q) => { dbgCam = p ? [V(...p), V(...q)] : null; frame(); };
    box.ci3dScene = scene; box.ci3dPts = { micMid, micN, procC, coilPos, cableA };
    box.ci3dSeek = t => { playing = false; tPause = t; showPlay(); frame(); };
    api = { go: goStep };
    if (pendingStep) goStep(pendingStep); else if (autoplay) setPlaying(true);
    kick();
  }
}
