/* Ricostruzione 3D della protesi acustica retroauricolare (BTE, anni 2000) di Lorenzo, dalla sua foto. Nessun marchio.
   Unità: millimetri. Riferimento locale come per il CP1000: piano XY = profilo laterale, x in avanti (verso la punta
   del gancio), y in alto, z spessore (z+ = lato esterno). Origine sull'asse del gancio nel suo punto più alto.
   Proporzioni prese dalla foto (≈ 15 px/mm sul ritaglio 1320 px; corpo ≈ 41 mm lungo l'arco).
     - corpo a "banana" rosa-beige opaco, alto 9 mm davanti e 13,5 mm dietro, spesso 9,5 mm, coda arrotondata
     - linea di giunzione dei gusci lungo i fianchi; due tasti sul dorso; sportello della pila sotto, verso la coda;
       forellini (microfono, contatti) sul fianco vicino allo sportello
     - gancio trasparente con base zigrinata, anellino metallico, tubicino sottile a "S"
     - chiocciola su misura trasparente a forma di conca, col tubicino che vi entra e un foro di ventilazione
   Materiali senza 'transmission' (leggeri su telefono); tutti trasparenti con opacità regolabile: setOpacity(o). */

export function buildAid(THREE) {
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mats = [];
  const mat = (M, o) => { const m = new M({ ...o, transparent: true }); m.userData.base = o.opacity ?? 1; mats.push(m); return m; };
  const skin = mat(THREE.MeshStandardMaterial, { color: 0xcdb0a5, roughness: .62, metalness: 0 });
  const skinDark = mat(THREE.MeshStandardMaterial, { color: 0xb89a8f, roughness: .6 });
  const seamM = mat(THREE.MeshStandardMaterial, { color: 0x7d6a63, roughness: .8 });
  const holeM = mat(THREE.MeshBasicMaterial, { color: 0x2a2220 });
  const clearHook = mat(THREE.MeshPhysicalMaterial, { color: 0xd3c9a8, roughness: .12, clearcoat: 1, opacity: .3, depthWrite: false });
  const ribM = mat(THREE.MeshPhysicalMaterial, { color: 0xc9b47a, roughness: .3, clearcoat: .6, opacity: .7, depthWrite: false });
  const metal = mat(THREE.MeshStandardMaterial, { color: 0xb8bcc2, metalness: .9, roughness: .25 });
  const tubeM = mat(THREE.MeshPhysicalMaterial, { color: 0xdfe6e6, roughness: .1, clearcoat: 1, opacity: .42, depthWrite: false });
  const moldM = mat(THREE.MeshPhysicalMaterial, { color: 0xd5dadc, roughness: .4, clearcoat: .7, clearcoatRoughness: .2, opacity: .3, depthWrite: false, side: THREE.DoubleSide });
  const aid = new THREE.Group();

  /* ---------- corpo ---------- */
  // linea media del corpo dalla foto, dalla punta (davanti) alla coda
  const spine = new THREE.CatmullRomCurve3([V(-3.2, 1.47), V(-10, 0), V(-16.7, -3.3), V(-22, -8), V(-26.7, -13.3), V(-30.7, -18), V(-34.7, -22)], false, 'centripetal');
  const L = spine.getLength(), T = 4.75, P = 3, re = 4.5;
  const frame = s => { const c = spine.getPointAt(s), t = spine.getTangentAt(s); return { c, t, n: V(t.y, -t.x, 0) }; };   // n verso il dorso
  const dims = s => {                                  // metà altezza e metà spessore, coda arrotondata
    const u = s * L, k = u > L - re ? Math.pow(1 - Math.pow((u - L + re) / re, 2.4), 1 / 2.4) : 1;
    return { h: (4.6 + 2.2 * sstep(0, .75, s)) * (.3 + .7 * k), t: T * (.45 + .55 * k) };
  };
  const sec = (s, v) => { const { c, n } = frame(s), { h, t } = dims(s), e = 2 / P; return { p: c.clone().addScaledVector(n, h * v), z: t, e }; };
  {
    const N = 120, M = 48, pos = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N, { c, n } = frame(s), { h, t } = dims(s), e = 2 / P;
      for (let j = 0; j < M; j++) {
        const f = j / M * Math.PI * 2, cs = Math.cos(f), sn = Math.sin(f), v = Math.sign(cs) * Math.abs(cs) ** e, w = Math.sign(sn) * Math.abs(sn) ** e;
        pos.push(c.x + n.x * h * v, c.y + n.y * h * v, t * w);
      }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * M + j, b = i * M + (j + 1) % M; idx.push(a, a + M, b, b, a + M, b + M); }
    for (const [i, flip] of [[0, 1], [N, 0]]) {
      const c0 = pos.length / 3, cc = spine.getPointAt(i / N); pos.push(cc.x, cc.y, 0);
      for (let j = 0; j < M; j++) { const a = i * M + j, b = i * M + (j + 1) % M; flip ? idx.push(c0, a, b) : idx.push(c0, b, a); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    var body = new THREE.Mesh(g, skin); aid.add(body); body.updateMatrixWorld();
  }
  const surfZ = v => Math.pow(1 - Math.pow(Math.abs(v), P), 1 / P);   // quota della sezione nel punto v
  // linea di giunzione dei gusci: in alto davanti, scende verso la coda
  for (const zs of [1, -1]) {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const s = .02 + i / 60 * .93, v = .5 - 1.2 * sstep(.05, 1, s), { c, n } = frame(s), { h, t } = dims(s);
      pts.push(c.clone().addScaledVector(n, h * v).setZ(zs * t * surfZ(v) * 1.004 + zs * .02));
    }
    aid.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, .13, 6), seamM));
  }
  // due tasti sul dorso, verso la coda
  for (const [s, len] of [[.47, 3.4], [.68, 3.0]]) {
    const { c, t, n } = frame(s), { h } = dims(s), b = new THREE.Mesh(new THREE.CapsuleGeometry(.75, len - 1.5, 4, 12), skinDark);
    b.position.copy(c).addScaledVector(n, h - .15); b.quaternion.setFromUnitVectors(V(0, 1, 0), t); b.scale.set(1, 1, 2.6); aid.add(b);
  }
  // sportello della pila, sotto verso la coda, con la sua fessura
  {
    const s = .84, { c, t, n } = frame(s), { h } = dims(s);
    const door = new THREE.Mesh(new THREE.BoxGeometry(9, .7, 8.0), skin);
    door.position.copy(c).addScaledVector(n, -h + .2); door.quaternion.setFromUnitVectors(V(1, 0, 0), t); aid.add(door);
    const gap = new THREE.Mesh(new THREE.BoxGeometry(.25, 1.5, 8.6), seamM); gap.position.copy(door.position).addScaledVector(t, -4.5); gap.quaternion.copy(door.quaternion); aid.add(gap);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(1.6, .5, 3), skinDark); lip.position.copy(door.position).addScaledVector(t, 4.4).addScaledVector(n, -.4); lip.quaternion.copy(door.quaternion); aid.add(lip);
  }
  // forellini sul fianco esterno: microfono, contatti, indicatori
  const ray = new THREE.Raycaster();
  const onSide = (x, y) => { ray.set(V(x, y, 30), V(0, 0, -1)); const h = ray.intersectObject(body)[0]; return h ? h.point.z : 0; };
  for (const [x, y, w, hh] of [[-33.6, -12.6, .5, 0], [-24.7, -15.7, .45, 0], [-21.3, -16, .8, .8], [-23.3, -18.3, .7, .7]]) {
    const m = new THREE.Mesh(hh ? new THREE.PlaneGeometry(w, hh) : new THREE.CircleGeometry(w, 14), holeM);
    m.position.set(x, y, onSide(x, y) + .03); aid.add(m);
  }

  /* ---------- gancio, anellino, tubicino ---------- */
  const taper = (curve, n, m, rad) => {
    const g = new THREE.TubeGeometry(curve, n, 1, m), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const t = Math.floor(i / (m + 1)) / n, c = curve.getPointAt(t), k = rad(t);
      p.setXYZ(i, c.x + (p.getX(i) - c.x) * k, c.y + (p.getY(i) - c.y) * k, c.z + (p.getZ(i) - c.z) * k); }
    g.computeVertexNormals(); return g;
  };
  const hook = new THREE.CatmullRomCurve3([V(-3.6, -.1), V(-1.2, .05), V(1.5, -.2), V(4.2, -1.6), V(6.6, -3.7), V(8.4, -6.3), V(9.4, -8.6), V(9.7, -10.3)]);
  aid.add(new THREE.Mesh(taper(hook, 80, 16, t => 2.05 - .6 * t), clearHook));
  for (let i = 0; i < 14; i++) {                       // base zigrinata (a spirale) del gancio
    const t = .015 + i * .026, r = new THREE.Mesh(new THREE.TorusGeometry(2.05, .2, 6, 20), ribM);
    r.position.copy(hook.getPointAt(t)); r.quaternion.setFromUnitVectors(V(0, 0, 1), hook.getTangentAt(t)); r.rotateX(.12); aid.add(r);
  }
  const ringPos = V(9.75, -10.9);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, .42, 10, 24), metal); ring.position.copy(ringPos); ring.rotation.x = Math.PI / 2; aid.add(ring);
  const tubeCurve = new THREE.CatmullRomCurve3([V(9.75, -10.6, 0), V(10.1, -13, .3), V(10.3, -17.3, 1.4), V(10, -24, 4.6), V(9.6, -28.5, 6.4), V(8, -34, 6.9),
    V(4, -37.3, 6.9), V(.9, -40.7, 6.7), V(.1, -44.7, 6.5), V(2, -48, 5.8), V(4, -49.3, 3.6)]);
  aid.add(new THREE.Mesh(new THREE.TubeGeometry(tubeCurve, 160, 1.15, 12), tubeM));

  /* ---------- chiocciola ---------- */
  const out = [[5.3, -22], [9.3, -21.7], [12, -24.7], [13.3, -29.3], [13.3, -33.3], [11.3, -36.7], [10, -40], [10.7, -42.7], [14, -42], [19.3, -41], [23.3, -42],
    [25, -45.3], [24, -49.3], [21.3, -53.3], [18.7, -57.3], [15.3, -60.7], [10.7, -62.7], [6, -63], [0, -61.7], [-5.3, -59.3], [-9.3, -55.3], [-11.7, -50],
    [-11.7, -45.3], [-10, -40.7], [-6.7, -36.7], [-2.7, -35], [.7, -34], [2.7, -30.7], [3.3, -26.7], [4, -23.3]];
  const shape = new THREE.Shape(new THREE.CatmullRomCurve3(out.map(([x, y]) => V(x, y)), true, 'centripetal').getSpacedPoints(200).map(p => new THREE.Vector2(p.x, p.y)));
  const MH = 5.6, rs = 3.2, rz = 3.4;                 // metà spessore e raggi del bordo
  let mg = new THREE.ExtrudeGeometry(shape, { depth: 2 * (MH - rz), bevelEnabled: true, bevelThickness: rz, bevelSize: rs, bevelOffset: -rs, bevelSegments: 8, curveSegments: 1 });
  mg.translate(0, 0, -(MH - rz));
  { // conca: la parte centrale della faccia esterna è incavata, il braccio dell'elice resta pieno
    const p = mg.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (z > MH - .2) { const d = Math.hypot((x - 1) / 9, (y + 49) / 10); p.setZ(i, z - 1.6 * Math.max(0, 1 - d * d)); } }
    mg.deleteAttribute('uv'); mg.deleteAttribute('normal');
    const map = new Map(), pos = [], idx = [];             // saldatura per normali morbide
    for (let i = 0; i < p.count; i++) { const k = `${Math.round(p.getX(i) * 200)},${Math.round(p.getY(i) * 200)},${Math.round(p.getZ(i) * 200)}`;
      let j = map.get(k); if (j === undefined) { j = pos.length / 3; map.set(k, j); pos.push(p.getX(i), p.getY(i), p.getZ(i)); } idx.push(j); }
    mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); mg.setIndex(idx); mg.computeVertexNormals();
  }
  const mold = new THREE.Mesh(mg, moldM); aid.add(mold);
  // condotto verso il canale uditivo (dietro, verso la testa) e foro di ventilazione sul davanti
  const canal = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 4.2, 9, 24, 1), moldM);
  canal.position.set(15.5, -47, -MH - 3.2); canal.rotation.x = Math.PI / 2; canal.rotation.z = .25; aid.add(canal);
  const canalTip = new THREE.Mesh(new THREE.SphereGeometry(3.1, 20, 12), moldM); canalTip.position.set(15.5, -47.6, -MH - 7.6); canalTip.scale.z = .5; aid.add(canalTip);
  const vent = new THREE.Mesh(new THREE.CircleGeometry(.45, 14), holeM); aid.add(vent); mold.updateMatrixWorld(); ray.set(V(5, -57.2, 30), V(0, 0, -1)); vent.position.set(5, -57.2, (ray.intersectObject(mold)[0]?.point.z ?? MH) + .03);

  function setOpacity(o) {
    for (const m of mats) { m.opacity = m.userData.base * o; m.depthWrite = m.userData.base >= 1 && o >= .999; m.needsUpdate = true; }
  }
  setOpacity(1);
  return { aid, setOpacity, anchors: { hookTop: V(0, 0, 0), mold: V(7, -47, 0) } };
}
