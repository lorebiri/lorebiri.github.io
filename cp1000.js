/* Ricostruzione 3D del processore Nucleus 7 (CP1000) nero e della sua bobina, dalle foto del processore di Lorenzo.
   Unità: millimetri. Contorni misurati sulla foto dall'alto (bobina ≈ 31 mm di diametro come scala, ≈ 11,8 px/mm
   sull'originale a 1800 px); spessore 9,0 mm del dato tecnico ufficiale; modulo batteria largo ≈ 17,5 mm nel piano.
   Riferimento locale del processore: appoggiato su una faccia, piano della "C" = piano xy, z = spessore.
   Orientamento come nella foto dall'alto: gancio in alto a destra, dorso a sinistra, batteria in basso a destra.
     - corpo a corno: stretto (≈ 5,5 mm) alla punta col raccordo, si allarga scendendo e si fonde nella batteria;
       spessore 6,2 mm in punta, 8,6 mm in basso; spigoli molto arrotondati
     - modulo batteria: blocco 27 × 17,5 × 9 mm con angoli tondi, giunzione appena incisa
     - dorso (lato esterno): spia vicino alla punta, microfono, pulsante grigio a pillola, microfono, spinotto del cavo
     - riga argentata su entrambe le facce, lungo il dorso, dal raccordo fino alla batteria
     - gancio trasparente che si assottiglia; raccordo grigio traslucido
   Bobina: disco Ø 31 mm con lobo di coda raccordato; davanti nero lucido con calotta, tre tacche radiali e una
   piccola tacca a pentagono; dietro opaco con corona di forellini e calamita incassata. Nessun marchio. */

export function buildCP1000(THREE) {
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const black = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0d, roughness: .28, clearcoat: 1, clearcoatRoughness: .06 });
  const matte = new THREE.MeshStandardMaterial({ color: 0x333336, roughness: .9 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xe8e3d4, metalness: .6, roughness: .25 });
  const grey = new THREE.MeshStandardMaterial({ color: 0x8e9196, metalness: .55, roughness: .3 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x26272b, roughness: .35 });
  const hole = new THREE.MeshBasicMaterial({ color: 0x040404 });
  const clear = new THREE.MeshPhysicalMaterial({ color: 0xf4f7ff, roughness: .05, clearcoat: 1, transparent: true, opacity: .5, depthWrite: false });

  const smooth = (pts, n) => new THREE.CatmullRomCurve3(pts.map(([x, y]) => V(x, y)), false, 'centripetal').getSpacedPoints(n).map(p => V2(p.x, p.y));
  // tubo che si assottiglia lungo la curva: rad(t) raggio, sz schiacciamento in z
  const taper = (curve, n, m, rad, sz = 1) => {
    const g = new THREE.TubeGeometry(curve, n, 1, m), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const t = Math.floor(i / (m + 1)) / n, c = curve.getPointAt(t), k = rad(t);
      p.setXYZ(i, c.x + (p.getX(i) - c.x) * k, c.y + (p.getY(i) - c.y) * k, c.z + (p.getZ(i) - c.z) * k * sz); }
    g.computeVertexNormals(); return g;
  };
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ---------- processore ---------- */
  const proc = new THREE.Group();
  // modulo batteria: asse U (verso la sua estremità), N attraverso la larghezza (verso il dorso)
  const B0 = V2(5.2, 0), U = V2(.806, -.592), Nn = V2(-.592, -.806), BW = 17.4, BL = 27.3;
  const bp = (u, n) => V2(B0.x + U.x * u + Nn.x * n, B0.y + U.y * u + Nn.y * n);
  // contorno del corpo (dalla foto dall'alto), in senso antiorario a partire dall'angolo esterno della punta
  const dorsoPts = [[8.7, 27.6], [7.2, 27.55], [5.2, 26.75], [3.6, 25.5], [1.1, 23.7], [-1, 22], [-3, 20.3], [-4.6, 18.6], [-6.1, 16.9], [-7.3, 15.2],
    [-8.3, 13.6], [-9.1, 11.9], [-9.9, 10.2], [-10.6, 8.5], [-11.2, 6.8], [-11.75, 5.1], [-12.1, 3.4], [-12.4, 1.7], [-12.6, 0], [-12.65, -2.5], [-12.4, -5], [-11.7, -7.5]];
  // corpo come superficie "a sezioni": ogni sezione unisce un punto del dorso a uno del bordo interno (stessa frazione
  // di lunghezza), sezione superellittica che si fa più squadrata verso la batteria; prosegue di 1,2 mm dentro la batteria
  const curve = pts => new THREE.CatmullRomCurve3(pts.map(p => Array.isArray(p) ? V(p[0], p[1]) : V(p.x, p.y)), false, 'centripetal');
  const Lc = curve([...dorsoPts, [-10.5, -9.8], [-8.8, -11.8], [-6.9, -13.2], [-5.1, -14], bp(1.2, BW - .6)]);
  const Rc = curve([[9.3, 22.6], [9.05, 21.6], [8.5, 20.3], [7.5, 18.6], [6.2, 16.9], [5.0, 15.3], [3.7, 13.6], [2.9, 11.9], [2.3, 10.2], [2.0, 8.5],
    [2.0, 6.8], [2.3, 5.1], [2.8, 3.4], [3.9, 1.7], [5.15, .1], bp(1.2, .6)]);
  const PB = 3.2;                                    // esponente della sezione alla batteria (quasi uno stadio)
  // superficie a sezioni: sec(i) → { m: centro, hv: semivettore nel piano verso il bordo interno, h: metà spessore, p }
  const sweep = (N, M, sec, capStart, capEnd) => {
    const pos = [], idx = [], mids = [];
    for (let i = 0; i <= N; i++) {
      const { m, hv, h, p } = sec(i / N), e = 2 / p; mids.push(m);
      for (let j = 0; j < M; j++) {
        const f = j / M * Math.PI * 2, c = Math.cos(f), sn = Math.sin(f), v = Math.sign(c) * Math.abs(c) ** e, w = Math.sign(sn) * Math.abs(sn) ** e;
        pos.push(m.x + hv.x * v, m.y + hv.y * v, h * w);
      }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * M + j, b = i * M + (j + 1) % M; idx.push(a, b, a + M, b, b + M, a + M); }
    for (const [i, flip, on] of [[0, 1, capStart], [N, 0, capEnd]]) if (on) {
      const c = pos.length / 3; pos.push(mids[i].x, mids[i].y, 0);
      for (let j = 0; j < M; j++) { const a = i * M + j, b = i * M + (j + 1) % M; flip ? idx.push(c, b, a) : idx.push(c, a, b); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  };
  const bodyH = my => 4.5 - 1.5 * sstep(4, 27, my);  // metà spessore: 3,0 in punta, 4,5 in basso come la batteria
  const body = new THREE.Mesh(sweep(150, 56, s => {
    const l = Lc.getPointAt(s), r = Rc.getPointAt(s), m = l.clone().add(r).multiplyScalar(.5);
    return { m, hv: r.clone().sub(l).multiplyScalar(.5), h: bodyH(m.y), p: 2.5 + (PB - 2.5) * sstep(.62, 1, s) };
  }, true, true), black);
  proc.add(body);
  // modulo batteria: stesse sezioni, angoli nel piano tondi (3 e 4,6 mm) e testa arrotondata
  const rT = 3, rB = 4.6, re = 3.6, u0 = -.4;
  const batt = new THREE.Mesh(sweep(150, 56, t => {
    const u = u0 + (BL - u0) * (1 - (1 - t) ** 1.6);
    const nLo = u > BL - rT ? rT - Math.sqrt(Math.max(0, rT * rT - (u - BL + rT) ** 2)) : 0;
    const nHi = u > BL - rB ? BW - rB + Math.sqrt(Math.max(0, rB * rB - (u - BL + rB) ** 2)) : BW;
    const k = u > BL - re ? (1 - ((u - BL + re) / re) ** 3) ** (1 / 3) : 1;
    const a = bp(u, nLo), b = bp(u, nHi), m = a.clone().add(b).multiplyScalar(.5);
    return { m, hv: a.clone().sub(b).multiplyScalar(.5), h: 4.5 * Math.max(k, .001), p: PB };
  }, true, false), black);
  proc.add(batt);
  // riga della giunzione corpo-batteria
  { const pts = []; for (let j = 0; j < 64; j++) { const f = j / 64 * Math.PI * 2, c = Math.cos(f), sn = Math.sin(f), e = 2 / PB;
      const v = Math.sign(c) * Math.abs(c) ** e, w = Math.sign(sn) * Math.abs(sn) ** e, q = bp(0, BW / 2 - v * BW / 2 * 1.003); pts.push(V(q.x, q.y, 4.5 * 1.006 * w)); }
    proc.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 128, .1, 6, true), new THREE.MeshStandardMaterial({ color: 0x020202, roughness: .8 }))); }
  body.updateMatrixWorld();

  // dorso: curva del lato esterno, con normale verso fuori nel piano
  const dorso = new THREE.CatmullRomCurve3(dorsoPts.map(([x, y]) => V(x, y)), false, 'centripetal');
  const dLen = dorso.getLength();
  const onDorso = (arc, out = 0) => { const t = Math.min(1, arc / dLen), p = dorso.getPointAt(t), tg = dorso.getTangentAt(t), n = V(tg.y, -tg.x, 0); return { p: p.addScaledVector(n, out), t: tg, n }; };
  const place = (mesh, arc, out = 0) => {           // x attraverso lo spessore, y lungo il dorso, z verso fuori
    const { p, t, n } = onDorso(arc, out); mesh.matrix.makeBasis(V(0, 0, 1), t.clone().negate(), n).setPosition(p); mesh.matrixAutoUpdate = false; proc.add(mesh); return mesh;
  };
  const led = place(new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.35, .5), new THREE.MeshStandardMaterial({ color: 0xc4bba3, roughness: .35, metalness: .2 })), 6.2);
  const ledDot = new THREE.Mesh(new THREE.CircleGeometry(.32, 16), hole); ledDot.position.z = .26; led.add(ledDot);
  for (const arc of [14.6, 29.4]) {                  // microfoni: anello e foro con griglia
    place(new THREE.Mesh(new THREE.TorusGeometry(.82, .2, 8, 28), dark), arc);
    place(new THREE.Mesh(new THREE.CircleGeometry(.75, 24), new THREE.MeshStandardMaterial({ color: 0x101012, roughness: .6 })), arc, .03);
  }
  const pill = place(new THREE.Mesh(new THREE.CapsuleGeometry(1.08, 2.7, 6, 18), grey), 22.2);
  pill.matrix.multiply(new THREE.Matrix4().makeScale(1, 1, .42));
  const slit = place(new THREE.Mesh(new THREE.BoxGeometry(.28, 1.7, .2), new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: .5 })), 22.2, .44);

  // riga argentata sulle due facce: segue la superficie (raggio verticale sul corpo)
  const stripeXY = [[8.25, 27.0], [7.0, 26.55], [5.6, 25.4], [3.4, 23.5], [0, 20.0], [-3.2, 16.0], [-5.6, 11.6], [-7.3, 6.8], [-8.2, 2.0], [-8.4, -2.0], [-8.3, -6.0], [-7.6, -9.4], [-6.6, -11.4]];
  const ray = new THREE.Raycaster();
  for (const zs of [1, -1]) {
    const pts = smooth(stripeXY, 80).map(q => {
      ray.set(V(q.x, q.y, zs * 20), V(0, 0, -zs)); const h = ray.intersectObject(body)[0];
      return V(q.x, q.y, h ? h.point.z - zs * .12 : zs * 4);
    });
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, .5, 8);
    proc.add(new THREE.Mesh(g, silver));
  }

  // spinotto del cavo: "stivaletto" che esce dal dorso sopra la giunzione e piega verso la batteria
  const pd = onDorso(38), plugDir = pd.t.clone().addScaledVector(pd.n, .15).normalize();
  const plugHead = onDorso(37.6, 1.9).p;
  const plugCurve = new THREE.CatmullRomCurve3([onDorso(36.8, -1.0).p, plugHead, plugHead.clone().addScaledVector(pd.t, 3.4).addScaledVector(pd.n, .2),
    plugHead.clone().addScaledVector(pd.t, 7.2).addScaledVector(pd.n, .6), plugHead.clone().addScaledVector(pd.t, 11.5).addScaledVector(pd.n, 1.3)]);
  proc.add(new THREE.Mesh(taper(plugCurve, 60, 18, t => t < .3 ? 2.35 : 2.35 - 1.35 * sstep(.3, 1, t), 1.22), black));
  const plugCap = new THREE.Mesh(new THREE.SphereGeometry(2.35, 20, 14), black); plugCap.position.copy(plugCurve.getPoint(0)); plugCap.scale.z = 1.22; proc.add(plugCap);
  const cableStart = plugCurve.getPointAt(.93);

  // raccordo grigio traslucido in punta e gancio trasparente che si assottiglia
  const tip = V(8.9, 25.1, 0), tipDir = V(.98, .2, 0).normalize();
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.75, 3.4, 28), new THREE.MeshPhysicalMaterial({ color: 0x7d8086, roughness: .25, metalness: .4, transparent: true, opacity: .92 }));
  collar.position.copy(tip).addScaledVector(tipDir, 1.6); collar.quaternion.setFromUnitVectors(V(0, -1, 0), tipDir); collar.scale.set(1, 1, 1.05); proc.add(collar);
  const hookCurve = new THREE.CatmullRomCurve3([V(11.9, 25.75), V(14.2, 26.5), V(16.9, 26.75), V(21.6, 25.9), V(25.6, 23.4), V(27.9, 20.6), V(28.9, 18.0)]);
  proc.add(new THREE.Mesh(taper(hookCurve, 70, 16, t => 2.2 * (1 - .3 * t), .82), clear));
  const hookEnd = hookCurve.getPoint(1);
  const capH = new THREE.Mesh(new THREE.SphereGeometry(1.54, 16, 10), clear); capH.position.copy(hookEnd); capH.scale.z = .82; proc.add(capH);

  /* ---------- bobina ---------- */
  const coil = new THREE.Group();
  const R = 15.5, lr = 8.2, lc = 11.8, f = 5, tailY = -(lc + lr);   // disco + lobo di coda raccordato
  const fy = ((lr + f) ** 2 - (R + f) ** 2 - lc * lc) / (2 * lc), fx = Math.sqrt((R + f) ** 2 - fy * fy);
  const drop = new THREE.Shape();
  const aA = Math.atan2(fy, fx);
  drop.absarc(0, 0, R, aA, Math.PI - aA, false);
  drop.absarc(-fx, fy, f, Math.atan2(-fy, fx), Math.atan2(-lc - fy, fx), true);
  drop.absarc(0, -lc, lr, Math.atan2(fy + lc, -fx), Math.atan2(fy + lc, fx) + Math.PI * 2, false);
  drop.absarc(fx, fy, f, Math.atan2(-lc - fy, -fx), Math.atan2(-fy, -fx), true);
  const dropPts = drop.getSpacedPoints(480);
  const rho = phi => {                               // distanza del bordo dal centro lungo il raggio phi
    const dx = Math.cos(phi), dy = Math.sin(phi); let best = 0;
    for (let i = 0; i < dropPts.length - 1; i++) {
      const p = dropPts[i], q = dropPts[i + 1], ex = q.x - p.x, ey = q.y - p.y, den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue;
      const t = (p.x * ey - p.y * ex) / den, u = (p.x * dy - p.y * dx) / den; if (t > 0 && u >= 0 && u <= 1) best = Math.max(best, t);
    }
    return best;
  };
  const NP = 240, rhos = Array.from({ length: NP }, (_, i) => rho(i / NP * Math.PI * 2));
  const CH = 2.2, rs = 1.7, rz = 1.5;                // metà spessore della bobina e raggi del bordo arrotondato
  // superficie polare: rows = funzioni (rho) => [r, z] dal bordo verso il centro
  const polar = (rows, front) => {
    const pos = [], idx = [];
    for (const row of rows) for (let i = 0; i < NP; i++) { const ph = i / NP * Math.PI * 2, [r, z] = row(rhos[i]); pos.push(r * Math.cos(ph), r * Math.sin(ph), z); }
    for (let k = 0; k < rows.length - 1; k++) for (let i = 0; i < NP; i++) {
      const a = k * NP + i, b = k * NP + (i + 1) % NP, c = a + NP, d = b + NP; front ? idx.push(a, b, c, b, d, c) : idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  };
  const edge = sg => { const o = [ro => [ro, 0]]; for (let j = 0; j <= 8; j++) { const th = j / 8 * Math.PI / 2; o.push(ro => [ro - rs + rs * Math.cos(th), sg * (CH - rz + rz * Math.sin(th))]); } return o; };
  // davanti: nero lucido, leggermente bombato verso la calotta; calotta incassata dentro un bordino rialzato
  const fRows = edge(1);
  for (let j = 1; j <= 10; j++) { const u = j / 10; fRows.push(ro => { const r = ro - rs + (7.7 - ro + rs) * u; return [r, CH + .8 * (.5 - .5 * Math.cos(Math.PI * u))]; }); }
  for (const [r, z] of [[7.5, CH + .78], [7.25, CH + .6], [7.05, CH + .2], [6.85, CH + .2], [6.7, CH + .42], [6.5, CH + .48], [4, CH + .48], [0, CH + .48]]) fRows.push(() => [r, z]);
  coil.add(new THREE.Mesh(polar(fRows, true), black));
  // dietro: opaco, piatto; foro per la calamita
  const bRows = edge(-1);
  for (let j = 1; j <= 6; j++) { const u = j / 6; bRows.push(ro => [ro - rs + (7.35 - ro + rs) * u, -CH]); }
  coil.add(new THREE.Mesh(polar(bRows, false), matte));
  const tickM = new THREE.MeshPhysicalMaterial({ color: 0x0a0a0c, roughness: .2, clearcoat: 1 });
  for (const deg of [96, 216, 332]) {                // tre tacche radiali sulla calotta
    const a = deg * Math.PI / 180, tk = new THREE.Mesh(new THREE.CapsuleGeometry(.32, 2.0, 4, 10), tickM);
    tk.position.set(Math.cos(a) * 3.85, Math.sin(a) * 3.85, CH + .5); tk.rotation.z = a - Math.PI / 2; tk.scale.z = .55; coil.add(tk);
  }
  const na = 274 * Math.PI / 180, notch = new THREE.Mesh(new THREE.RingGeometry(.5, .78, 5, 1), new THREE.MeshStandardMaterial({ color: 0x55565c, roughness: .35 }));
  notch.position.set(Math.cos(na) * 5.7, Math.sin(na) * 5.7, CH + .5); notch.rotation.z = na; coil.add(notch);
  const dotG = new THREE.CircleGeometry(.33, 10), nDots = 78;
  const dots = new THREE.InstancedMesh(dotG, hole, nDots), m4 = new THREE.Matrix4(), flip = new THREE.Matrix4().makeRotationY(Math.PI);
  for (let i = 0; i < nDots; i++) { const a = i / nDots * Math.PI * 2; dots.setMatrixAt(i, m4.makeTranslation(Math.cos(a) * 13.9, Math.sin(a) * 13.9, -CH - .03).multiply(flip)); }
  coil.add(dots);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(7.15, .36, 10, 96), black); ringB.position.z = -CH; ringB.scale.z = .7; coil.add(ringB);
  const magnet = new THREE.Mesh(new THREE.CircleGeometry(6.9, 72), new THREE.MeshPhysicalMaterial({ color: 0x2b2b30, roughness: .3, clearcoat: .8 }));
  magnet.position.z = -CH + .12; magnet.rotation.y = Math.PI; coil.add(magnet);
  const magC = new THREE.Mesh(new THREE.RingGeometry(3.3, 3.6, 64), new THREE.MeshStandardMaterial({ color: 0x121214, roughness: .5 }));
  magC.position.z = -CH + .1; magC.rotation.y = Math.PI; coil.add(magC);
  // pressacavo sulla coda
  const coilRelief = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.0, 6.5, 18), black);
  coilRelief.position.set(0, tailY - 2.4, 0); coilRelief.scale.z = .85; coil.add(coilRelief);
  const coilCableStart = V(0, tailY - 5, 0);

  /* ---------- cavo tra i due, in coordinate del mondo ---------- */
  function cable(points) {
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 120, .85, 10), black);
  }
  return { proc, coil, cable, led, anchors: { cableStart, coilCableStart, plugDir, tip, hookEnd } };
}
