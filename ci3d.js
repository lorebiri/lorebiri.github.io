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
import * as THREE from './3d/three.module.min.js';
import { buildCP1000 } from './cp1000.js?v=2';
import { buildAid } from './aid.js?v=1';

const box = document.querySelector('.ci3d');
if (box) init(box);

function init(box) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    start().catch(() => box.classList.add('ci3d-off'));
  }, { rootMargin: '400px 0px' });
  io.observe(box);

  async function start() {
    const canvas = document.createElement('canvas');
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
    catch (e) { box.classList.add('ci3d-off'); return; }
    const [man, buf] = await Promise.all([
      fetch('3d/ci-scene.json?v=2').then(r => r.json()),
      fetch('3d/ci-scene.bin?v=2').then(r => r.arrayBuffer())
    ]);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.5 : 1.75));
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
      colliculus: new THREE.MeshStandardMaterial({ color: 0xffcf4a, roughness: .4, emissive: 0xffb000, emissiveIntensity: 0 }),
      labyrinth: new THREE.MeshPhysicalMaterial({ color: 0xe4ecff, roughness: .25, clearcoat: .7, emissive: 0x3d63ff, emissiveIntensity: .22, transparent: true })
    };
    const use = { skin: 'skin', pinna: 'pinna', pinna_r: 'pinna', skull: 'skull', temporal: 'skull', cortex: 'cortex', white: 'white', cerebellum: 'cerebellum',
      stem: 'stem', colliculus: 'colliculus', labyrinth: 'labyrinth', labyrinth_r: 'labyrinth' };
    const root = new THREE.Group(); root.scale.x = -1; scene.add(root);
    for (const [name, m] of Object.entries(man.meshes)) {
      const p = new Int16Array(buf, m.pos, m.nv * 3), f = new Float32Array(m.nv * 3);
      for (let i = 0; i < m.nv; i++) for (let k = 0; k < 3; k++) f[i * 3 + k] = (p[i * 3 + k] + 32500) * man.q[k] + man.min[k];
      const idx = m.i32 ? new Uint32Array(buf, m.idx, m.nt * 3) : new Uint16Array(buf, m.idx, m.nt * 3);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(f, 3));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.computeVertexNormals();
      const mesh = new THREE.Mesh(g, mat[use[name]] || mat.skin);
      mesh.renderOrder = /skin|pinna/.test(name) ? 3 : /skull|temporal/.test(name) ? 2 : 0;
      root.add(mesh);
    }
    for (const k of ['skin', 'pinna', 'skull', 'cortex', 'white', 'cerebellum']) { mat[k].transparent = true; mat[k].side = THREE.DoubleSide; }

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
    const coilN = V(1, .42, -.1).normalize(), coilPos = V(67.5, 42, -42);   // appoggiata sulla pelle   // perpendicolare alla teca cranica in quel punto
    const tail = V(0, -1, .35); tail.addScaledVector(coilN, -tail.dot(coilN)).normalize();
    const cy = tail.clone().negate(), cx = new THREE.Vector3().crossVectors(cy, coilN);
    cp.coil.matrixAutoUpdate = false; cp.coil.matrix.makeBasis(cx, cy, coilN).setPosition(coilPos); impl.add(cp.coil);
    scene.updateMatrixWorld(true);
    const cableA = cp.anchors.cableStart.clone().applyMatrix4(cp.proc.matrixWorld);
    const plugD = cp.anchors.plugDir.clone().transformDirection(cp.proc.matrixWorld);
    const cableB = cp.anchors.coilCableStart.clone().applyMatrix4(cp.coil.matrixWorld);
    // una sola curva ampia, come nelle foto: esce dallo spinotto e risale verso la coda della bobina
    const coilCable = new THREE.CubicBezierCurve3(cableA, cableA.clone().addScaledVector(plugD, 9), cableB.clone().addScaledVector(tail, 9), cableB);
    impl.add(cp.cable(coilCable.getPoints(40)));
    const led = cp.led;

    /* ---------- impianto interno (schematico): ricevitore sull'osso, filo, elettrodi, MP1 ---------- */
    const ti = new THREE.MeshStandardMaterial({ color: 0xc9cdd4, metalness: .65, roughness: .3 });
    const silicone = new THREE.MeshPhysicalMaterial({ color: 0xe9ecef, roughness: .35, clearcoat: .5 });
    const recPos = V(59, 37, -41);
    const rec = new THREE.Group(); rec.position.copy(recPos); rec.quaternion.setFromUnitVectors(V(0, 1, 0), coilN); impl.add(rec);
    rec.add(new THREE.Mesh(new THREE.CylinderGeometry(11, 11.5, 3.6, 48), silicone));
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
    const hairG = new THREE.SphereGeometry(.26, 8, 6), hairs = [];
    for (const pts of [C.hair.map(M), C.hair.map(D)]) for (let i = 0; i < pts.length; i += 2) {
      const m = new THREE.MeshStandardMaterial({ color: 0x8a8f99, roughness: .6, emissive: 0x7fe0ff, emissiveIntensity: 0 });
      const h = new THREE.Mesh(hairG, m); h.position.copy(pts[i]); scene.add(h); hairs.push({ m, f: i / (pts.length - 1) });
    }
    /* ---------- protesi acustiche retroauricolari su entrambe le orecchie (aid.js, ricostruita dalla foto di una protesi
       dell'epoca, senza marchio). Compaiono "con le protesi" e spariscono a ~8 anni. ---------- */
    const aidSet = [];
    const aids = new THREE.Group(); scene.add(aids);
    for (const s of [1, -1]) {
      const a = buildAid(THREE); aidSet.push(a);
      // locale: x avanti, y su, z verso l'esterno; origine sulla cima del gancio, sopra il padiglione
      a.aid.matrixAutoUpdate = false;
      // ruotata di 30° (come la si porta: corpo che scende dietro il padiglione, chiocciola nella conca)
      a.aid.matrix.makeBasis(V(0, 0, .85), V(0, .85, 0), V(.85 * s, 0, 0)).setPosition(V(78 * s, 27, -11))
        .multiply(new THREE.Matrix4().makeRotationZ(30 * Math.PI / 180));
      aids.add(a.aid);
    }
    /* ---------- nervo acustico e via uditiva (incrocio all'oliva superiore) ---------- */
    const nerveM = new THREE.MeshStandardMaterial({ color: 0xf0cf55, roughness: .45, emissive: 0x6b5200, emissiveIntensity: .25 });
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
    const rf = [0, 1].map(() => { const m = ring(coilPos.clone().addScaledVector(coilN, -6), 6, 0x9fb6ff); m.quaternion.setFromUnitVectors(V(0, 0, 1), coilN); return m; });

    /* ---------- tratti del segnale ---------- */
    const procMic = V(0, 0, 0).applyMatrix4(cp.proc.matrixWorld).add(V(4, 18, 4));
    const seg = {
      mic: new THREE.LineCurve3(V(118, 6, 4), procMic), cable: coilCable,
      rf: new THREE.LineCurve3(coilPos, recPos), lead: leadCurve, array: arrCurve, nerve: nerveCurve, path: mainCurve
    };

    /* ---------- camera ---------- */
    const camera = new THREE.PerspectiveCamera(32, 1, 1, 3000);
    const shots = {
      pre: [V(-150, 40, 170), V(-30, -8, 0)],                  // di tre quarti: orecchio destro, protesi e le due coclee
      preR: [ccR.clone().add(V(-34, 26, 40)), ccR.clone()],
      back: [V(0, 150, -200), V(0, -4, -6)],                    // da dietro: le due protesi
      out: [V(330, 70, 150), V(60, 8, -6)],
      ear: [V(210, 60, 30), V(76, 14, -14)],
      in: [V(135, -6, 125), V(48, -2, 2)],
      coch: [ccL.clone().add(V(28, 30, 22)), ccL.clone()],
      brain: [V(150, 190, 250), V(0, 4, 8)]
    };
    // 0–2,4 fino a ~15 mesi · 2,4–5,2 con le protesi · 5,2–7,6 ~8 anni · poi l'impianto (passi 1–5)
    const T = 22.6;
    const tl = { mic: [8.0, 9.2], cable: [9.2, 10.5], rf: [10.5, 11.4], lead: [12.0, 14.2], array: [14.2, 16.2], nerve: [16.4, 17.8], path: [17.8, 19.4] };
    const camKeys = [[0, 'pre'], [2.4, 'pre'], [3.2, 'back'], [4.4, 'back'], [5.6, 'preR'], [6.8, 'preR'], [8.0, 'out'], [9.2, 'out'], [10.8, 'ear'], [12.8, 'in'], [14.4, 'coch'],
      [16.4, 'coch'], [18.0, 'brain'], [20.8, 'brain'], [22.6, 'pre']];
    const steps = [[0, 'pre1'], [2.4, 'pre2'], [5.2, 'pre3'], [7.8, 1], [9.2, 2], [10.5, 3], [12.0, 4], [16.4, 5], [20.8, 0]];
    const stepT = { 1: 8.6, 2: 9.8, 3: 11.0, 4: 15.2, 5: 19.0 };
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const lerp = (a, b, t) => a + (b - a) * t;
    const win = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
    const bump = (t, a, b) => win(t, a, a + .3) * (1 - win(t, b - .3, b));

    let yaw = 0, pitch = 0, drag = null, dbgCam = null;
    canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw, pitch }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => { if (!drag) return; yaw = drag.yaw - (e.clientX - drag.x) * .008; pitch = Math.max(-.9, Math.min(.9, drag.pitch + (e.clientY - drag.y) * .006)); kick(); });
    const endDrag = () => { drag = null; }; canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);

    const items = [...document.querySelectorAll('.ci-steps li')];
    const labels = [...box.querySelectorAll('.ci3d-lab')];
    const labelAt = { 1: procMic, 2: coilPos.clone().add(V(4, 10, 0)), 3: recPos.clone().add(V(2, 10, 6)), 4: ccL, 5: AC_R };
    let curStep = null;
    function setStep(n) {
      if (n === curStep) return; curStep = n;
      items.forEach((li, i) => li.classList.toggle('on', i + 1 === n));
      const pre = typeof n === 'string';
      labels.forEach(l => { const k = l.dataset.n;
        l.classList.toggle('on', k === String(n) || (pre && k === 'sch')); });
    }

    const playBtn = box.querySelector('.ci3d-play');
    let playing = !reduce, t0 = performance.now(), tPause = reduce ? stepT[4] : 0;
    const setPlaying = p => {
      if (!p && playing) tPause = clock();
      playing = p; playBtn.setAttribute('aria-pressed', String(!p)); playBtn.classList.toggle('paused', !p);
      if (p) t0 = performance.now() - tPause * 1000;
      kick();
    };
    playBtn.addEventListener('click', () => setPlaying(!playing));
    playBtn.classList.toggle('paused', !playing); playBtn.setAttribute('aria-pressed', String(!playing));
    const clock = () => playing ? ((performance.now() - t0) / 1000) % T : tPause;
    // i passi dell'elenco portano la scena a quel punto (anche da tastiera)
    items.forEach((li, i) => {
      li.tabIndex = 0; li.setAttribute('role', 'button');
      const go = () => { if (playing) setPlaying(false); tPause = stepT[i + 1]; kick(); };
      li.addEventListener('click', go); li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });

    function frame() {
      const t = clock();
      let i = 0; while (i < camKeys.length - 2 && t >= camKeys[i + 1][0]) i++;
      const [ta, sa] = camKeys[i], [tb, sb] = camKeys[i + 1], k = ease(win(t, ta, tb));
      const pos = shots[sa][0].clone().lerp(shots[sb][0], k), tgt = shots[sa][1].clone().lerp(shots[sb][1], k);
      if (!drag) { yaw *= .97; pitch *= .97; }
      if (dbgCam) { pos.copy(dbgCam[0]); tgt.copy(dbgCam[1]); }
      const off = pos.sub(tgt).multiplyScalar(Math.max(1, 1.2 / camera.aspect));   // riquadro quadrato (telefono): un po' più lontano
      const sph = new THREE.Spherical().setFromVector3(off);
      sph.theta += yaw; sph.phi = Math.max(.15, Math.min(Math.PI - .15, sph.phi - pitch));
      camera.position.copy(tgt).add(new THREE.Vector3().setFromSpherical(sph)); camera.lookAt(tgt);
      // trasparenze: nelle fasi iniziali (si vedono le coclee), poi dentro la testa, poi il cervello
      const pre = Math.max(1 - win(t, 7.0, 8.0), win(t, 22.0, 22.6));
      const inside = Math.max(pre, win(t, 11.8, 13.2) * (1 - win(t, 21.0, 22.2)));
      const close = Math.max(win(t, 4.8, 5.6) * (1 - win(t, 6.8, 7.6)), win(t, 13.6, 14.4) * (1 - win(t, 16.4, 17.2)));
      mat.skin.opacity = lerp(1, .1, inside); mat.skin.depthWrite = inside < .05;
      mat.pinna.opacity = mat.skin.opacity; mat.pinna.depthWrite = mat.skin.depthWrite;
      mat.skull.opacity = lerp(lerp(1, .18, inside), .06, close); mat.skull.depthWrite = inside < .05;
      const see = inside * (1 - win(t, 20.0, 21.0));
      mat.cortex.opacity = lerp(lerp(1, .3, see), .12, close); mat.cortex.depthWrite = see < .05;
      mat.white.opacity = lerp(1, 0, see); mat.white.visible = see < .98; mat.white.depthWrite = see < .05;
      mat.cerebellum.opacity = lerp(1, .45, see); mat.cerebellum.depthWrite = see < .05;
      pathMat.opacity = .7 * win(t, 17.2, 18.0) * (1 - win(t, 20.6, 21.4));
      pathMat.visible = pathMat.opacity > .005;
      impl.visible = t >= 7.4;
      // perché sono sordo (schema del caso più frequente): onde a entrambe le orecchie in tre momenti
      const phase = t < 2.4 ? 0 : t < 5.2 ? 1 : t < 7.6 ? 2 : 3, p0 = [0, 2.4, 5.2][phase] || 0;
      const amp = phase === 0 ? 1 : 1.6;                                   // con le protesi il suono arriva amplificato
      [waves, wavesR].forEach((ws, side) => ws.forEach((w, j) => {
        const q = phase < 3 ? win(t, p0 + .1 + j * .3, p0 + 1.3 + j * .3) : 0;
        w.material.opacity = q > 0 && q < 1 ? .8 * (1 - q) : 0; w.scale.setScalar((.4 + q * 1.4) * amp);
        w.position.x = (side ? -1 : 1) * lerp(128, 96, win(t, p0 + .1, p0 + 1.9));
      }));
      const alive = 1 - .75 * win(t, 2.6, 5.0) - .2 * win(t, 5.2, 6.4);      // quota di cellule ciliate che funzionano ancora
      const hit = phase < 3 ? bump(t, p0 + 1.0, p0 + 2.2) : 0;               // il suono arriva alla coclea
      hairs.forEach(h => {
        const on = h.f >= 1 - alive;
        h.m.color.setHex(on ? 0xbfe9ff : 0x6d717a); h.m.emissiveIntensity = on ? .25 + 1.2 * hit : 0;
      });
      const nerveSig = phase === 0 ? 1 : phase === 1 ? .5 * (alive + .2) : 0; // segnale che parte verso il nervo
      preP.forEach((s, j) => {
        const go = win(t, p0 + .4, p0 + 1.2), up = win(t, p0 + 1.2, p0 + 2.0);
        s.visible = phase < 3 && t > p0 + .4 && t < p0 + 2.2;
        if (!s.visible) return;
        const nc = j ? nervePts(-1) : nervePts(1);
        if (up <= 0 || nerveSig <= 0) { s.position.copy(preA[j]).lerp(preB[j], ease(go)); s.material.opacity = phase === 2 ? 1 - win(t, p0 + 1.2, p0 + 2.2) : 1;
          s.material.color.setHSL(.06, phase === 2 ? 1 - win(t, p0 + 1.2, p0 + 2) : 1, .55); s.scale.setScalar(phase === 2 ? 7 - 4 * win(t, p0 + 1.2, p0 + 2.2) : 7); }
        else { s.position.copy(nc[Math.min(5, Math.floor(up * 5))]).lerp(nc[Math.min(5, Math.floor(up * 5) + 1)], (up * 5) % 1); s.material.opacity = nerveSig; s.scale.setScalar(4 + 3 * nerveSig); s.material.color.setHSL(.06, 1, .55); }
      });
      const aidO = win(t, 2.4, 2.9) * (1 - win(t, 7.0, 7.6));
      aids.visible = aidO > .01; if (aids.visible) aidSet.forEach(x => x.setOpacity(aidO));
      // il segnale con l'impianto
      let p = null;
      for (const [name, [a, b]] of Object.entries(tl)) if (t >= a && t < b) p = seg[name].getPoint(win(t, a, b));
      pulse.visible = !!p; trail.forEach(s => s.visible = !!p);
      const near = t > 13.4 && t < 16.8 ? .45 : 1; pulse.scale.setScalar(9 * near); trail.forEach((s, j) => s.scale.setScalar((6 - j * 1.5) * near));
      if (p) { trail[2].position.copy(trail[1].position); trail[1].position.copy(trail[0].position); trail[0].position.copy(pulse.position); pulse.position.copy(p); }
      pulse2.visible = t >= tl.path[0] && t < tl.path[1]; if (pulse2.visible) pulse2.position.copy(ipsiCurve.getPoint(win(t, ...tl.path)));
      if (t > 7.6) waves.forEach((w, j) => { const q = win(t, 7.7 + j * .3, 8.9 + j * .3); w.material.opacity = q > 0 && q < 1 ? .8 * (1 - q) : 0; w.scale.setScalar(.4 + q * 1.4); w.position.x = lerp(128, 96, win(t, 7.8, 9.2)); });
      rf.forEach((r, j) => { const q = win(t, 10.5 + j * .3, 11.4 + j * .3); r.material.opacity = q > 0 && q < 1 ? .9 * (1 - q) : 0; r.scale.setScalar(.6 + q * 1.8); });
      if (led) led.material.color && led.material.color.setHex(playing && (t % 1.5) < .12 ? 0x0c3b1f : 0x2ecc71);
      contacts.forEach((m, j) => { const a = 14.2 + j * .08; m.emissiveIntensity = t >= a && t < 17.2 ? Math.max(0, 1.8 - (t - a) * .9) : 0; });
      const cIC = Math.max(0, 1 - Math.abs(t - 18.5) * 2);
      mat.colliculus.emissiveIntensity = cIC; icR.material.opacity = cIC; icL.material.opacity = .5 * cIC;
      const g = win(t, 19.0, 19.6) * (1 - win(t, 21.0, 22.0));
      acR.material.opacity = g * (.8 + .2 * Math.sin(t * 6)); acR.scale.setScalar(30 + 12 * g);
      acL.material.opacity = .22 * g; acL.scale.setScalar(16);   // il lato opposto all'impianto riceve di più
      let st = 0; for (const [a, n] of steps) if (t >= a) st = n; setStep(st);
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
    box.ci3dScene = scene;
    box.ci3dSeek = t => { playing = false; tPause = t; playBtn.setAttribute('aria-pressed', 'true'); frame(); };
    kick();
  }
}
