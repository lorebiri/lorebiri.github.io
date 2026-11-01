(function(){
  'use strict';
  var root=document.documentElement;
  root.classList.add('js');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function $(s,c){return (c||document).querySelector(s)}
  function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}
  function t(it,en){return root.lang==='en'?en:it}

  /* ---------- lingua ---------- */
  // lingua del sistema (italiano → IT, tutto il resto → EN); la scelta fatta col bottone resta salvata
  var lang=get('lang')||((navigator.language||'en').slice(0,2).toLowerCase()==='it'?'it':'en');
  function applyLang(l){
    root.lang=l;
    $$('#langBtn b').forEach(function(b){b.classList.toggle('on',b.dataset.l===l)});
    tick(); countPapers(); if(typeof applySeason==='function') applySeason();
    // testi alternativi e etichette per screen reader nella lingua scelta
    $$('img[data-alt-en]').forEach(function(img){
      if(!img.dataset.altIt) img.dataset.altIt=img.alt;
      img.alt=l==='en'?img.dataset.altEn:img.dataset.altIt;
    });
    $$('.copy').forEach(function(b){b.setAttribute('aria-label',t('Copia l\'indirizzo ','Copy the address ')+b.dataset.copy)});
    document.title=l==='en'?'Lorenzo Birindelli — lab, data, design & code':'Lorenzo Birindelli — laboratorio, dati, design e codice';
  }
  $('#langBtn').addEventListener('click',function(){lang=lang==='it'?'en':'it';applyLang(lang);set('lang',lang)});

  /* ---------- tema: luce / campo scuro ---------- */
  var themeBtn=$('#themeBtn');
  function isDark(){return root.dataset.theme?root.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches}
  function themeLabel(){var d=isDark();themeBtn.textContent=d?'☀︎':'☾';themeBtn.setAttribute('aria-pressed',d);if(d)root.dataset.dark='';else delete root.dataset.dark}
  var th=get('theme'); if(th) root.dataset.theme=th;
  themeBtn.addEventListener('click',function(){root.dataset.theme=isDark()?'light':'dark';set('theme',root.dataset.theme);themeLabel()});
  themeLabel();

  /* =========================================================
     TEMI STAGIONALI
     Calendario (data di Pisa, Europe/Rome), estremi inclusi.
     Priorità: prima le festività, poi le stagioni; fuori da tutto = standard.
       0. birthday    23 mar          (compleanno di Lorenzo: vince su tutto)
       1. halloween   24 ott → 2 nov
       2. christmas    1 dic → 6 gen   (attraversa il capodanno)
       3. spring      20 mar → 20 giu  (comprende Pasqua)
       4. summer      21 giu → 22 set
       5. autumn      23 set → 30 nov  (Halloween ha la precedenza)
       —  inverno     7 gen → 19 mar  = tema standard
     Il tema dipende solo dalla data: chi visita non lo sceglie.
     Per provare una data: ?date=2026-12-25 nell'indirizzo (non viene salvata).
     ========================================================= */
  var SEASONS=[
    {id:'birthday', from:[3,23], to:[3,23]},
    {id:'halloween',from:[10,24],to:[11,2]},
    {id:'christmas',from:[12,1], to:[1,6]},
    {id:'spring',   from:[3,20], to:[6,20]},
    {id:'summer',   from:[6,21], to:[9,22]},
    {id:'autumn',   from:[9,23], to:[11,30]}
  ];
  function md(d){ // [mese, giorno] a Pisa
    try{var p=d.toLocaleDateString('en-CA',{timeZone:'Europe/Rome'}).split('-');return [+p[1],+p[2]]}
    catch(e){return [d.getMonth()+1,d.getDate()]}
  }
  function inRange(m,d,a,b){
    var x=m*100+d, f=a[0]*100+a[1], t=b[0]*100+b[1];
    return f<=t ? (x>=f&&x<=t) : (x>=f||x<=t); // f>t = l'intervallo scavalca l'anno
  }
  function seasonFor(date){
    var p=md(date);
    for(var i=0;i<SEASONS.length;i++) if(inRange(p[0],p[1],SEASONS[i].from,SEASONS[i].to)) return SEASONS[i].id;
    return 'standard';
  }
  var testDate=(function(){var m=/[?&]date=(\d{4}-\d{2}-\d{2})/.exec(location.search);return m?new Date(m[1]+'T12:00:00'):null})();
  try{localStorage.removeItem('season')}catch(e){} // scelta manuale delle versioni precedenti: non serve più
  function currentSeason(){return seasonFor(testDate||new Date())}
  /* ---------- decorazioni stagionali (solo HTML/SVG decorativo, aria-hidden) ----------
     christmas = lucine a festoni · birthday = bandierine · halloween = zucche intagliate */
  var SVGNS='http://www.w3.org/2000/svg', decoFor='';
  function garland(box,kind){
    var w=box.clientWidth; if(!w) return;
    var d=document.createElement('div'); d.className='deco garland'; d.setAttribute('aria-hidden','true');
    var svg=document.createElementNS(SVGNS,'svg'), path=document.createElementNS(SVGNS,'path');
    var n=Math.max(2,Math.round(w/240)), seg=w/n, sag=22, top=4, dd='', cols=kind==='lights'?['#ff3b3b','#ffd166','#3ddc84','#4fc3ff','#ff8bd1']:['#ff3d8b','#c5f03c','#ffd447','#5bc0eb','#ff8a3d'], k=0;
    for(var i=0;i<n;i++){
      var x0=i*seg, x1=x0+seg;
      dd+='M'+x0+' '+top+' Q'+(x0+seg/2)+' '+(top+2*sag)+' '+x1+' '+top+' ';
      [.2,.4,.6,.8].forEach(function(tt){
        var x=x0+seg*tt, y=top+4*sag*tt*(1-tt), ang=Math.atan(4*sag*(1-2*tt)/seg)*57.3;
        var b=document.createElement('span'); b.className=kind==='lights'?'bulb':'flag';
        b.style.left=x+'px'; b.style.top=(y+(kind==='lights'?3:0))+'px';
        b.style.setProperty('--c',cols[k%cols.length]); b.style.setProperty('--r',ang.toFixed(1)+'deg');
        b.style.setProperty('--dl',(-Math.random()*2.4).toFixed(2)+'s'); b.style.setProperty('--d',(1.8+Math.random()*1.4).toFixed(2)+'s');
        d.appendChild(b); k++;
      });
    }
    path.setAttribute('d',dd); svg.appendChild(path); d.insertBefore(svg,d.firstChild); box.appendChild(d);
  }
  function pumpkin(size){
    var svg=document.createElementNS(SVGNS,'svg'); svg.setAttribute('viewBox','0 0 100 92'); svg.setAttribute('width',size); svg.setAttribute('height',size*.92);
    svg.innerHTML='<path class="p-stem" d="M46 14c1-6 4-11 10-13l3 4c-4 2-6 5-6 10z"/>'+
      '<ellipse class="p-body" cx="30" cy="54" rx="24" ry="33"/><ellipse class="p-body" cx="70" cy="54" rx="24" ry="33"/><ellipse class="p-body" cx="50" cy="54" rx="27" ry="37"/>'+
      '<path class="p-rib" d="M50 18c-9 10-9 62 0 72M50 18c9 10 9 62 0 72"/>'+
      '<path class="glow" d="M30 44l10-11 7 14zM70 44l-10-11-7 14zM46 55l4-7 4 7zM24 62q26 22 52 0l-6 3-4-5-5 6-5-6-5 6-5-6-5 6-4-5z"/>';
    return svg;
  }
  function pumpkins(box,sizes){
    var d=document.createElement('div'); d.className='deco pumpkins'; d.setAttribute('aria-hidden','true');
    sizes.forEach(function(sz){d.appendChild(pumpkin(sz))}); box.appendChild(d);
  }
  function decorate(sz,force){
    if(sz===decoFor&&!force) return; decoFor=sz;
    $$('.deco').forEach(function(e){e.remove()});
    var hero=$('.hero'), contact=$('#contact'); if(!hero) return;
    if(sz==='christmas'||sz==='birthday'){var k=sz==='christmas'?'lights':'flags'; garland(hero,k); if(contact) garland(contact,k)}
    if(sz==='halloween'){var sc=$('.hero .scope'); pumpkins(sc||hero,[88,60,44]); if(contact) pumpkins(contact,[54])}
  }
  if('ResizeObserver' in window){ // i festoni si ridisegnano se cambia la larghezza
    var decoW=0; new ResizeObserver(function(es){var w=Math.round(es[0].contentRect.width); if(w!==decoW){decoW=w; if(decoFor==='christmas'||decoFor==='birthday') decorate(decoFor,true)}}).observe(document.querySelector('.hero')||document.body);
  }
  function applySeason(){
    var sz=currentSeason();
    if(sz==='standard') delete document.body.dataset.season; else document.body.dataset.season=sz;
    decorate(sz);
    drawMeNav(); // l'avatar cambia accessorio con il periodo
  }
  // il 23 marzo, in automatico, un saluto discreto una volta al giorno
  function birthdayHello(){
    if(currentSeason()!=='birthday') return;
    var k='bday-'+(testDate||new Date()).getFullYear();
    if(get(k)) return; set(k,'1');
    setTimeout(function(){toast(t('🎂 Oggi è il compleanno di Lorenzo: le euglene festeggiano con lui.','🎂 It\'s Lorenzo\'s birthday today: the euglenas are celebrating with him.'))},1800);
  }
  applySeason();
  setInterval(applySeason,60000);   // se cambia il giorno, cambia il tema
  document.addEventListener('visibilitychange',function(){if(!document.hidden)applySeason()});
  window.seasonFor=seasonFor; // per verifiche dalla console

  /* ---------- orologio di Pisa ---------- */
  var clock=$('#clock');
  // stato "probabile": palestra lun/mer/ven presto e sabato mattina, in orario di lavoro
  // si alternano ufficio e vibe coding, altrimenti fuori servizio
  var flip=false, meKey='off';
  /* Avatar pixel art di Lorenzo per lo stato nella barra in alto.
     Griglia 22×28 (2 colonne di margine per lato, 4 righe sopra per i cappelli).
     draw(ctx, PX, stato, stagione, fotogramma)
     stato: office · code · gym · off      stagione: '' · halloween · christmas · birthday · spring · summer · autumn */
  var AVATAR=(function(){
    var BASE=[
    "....h.HhH.h.......",
    "...HhHHHhHHhH.....",
    "..HhHHHhHHHhHH....",
    "..HHHhHHHHhHHH....",
    "..HHKKKKKKKKKH....",
    "..HKKKKKKKKKKH....",
    "..HKgggKKgggKH....",
    "..HgLLgggLLgKK....",
    "..HKgggKKgggKKE...",
    "...KKKKkkKKKKK....",
    "...kKKKKKKKKKk....",
    "....kKKkkKKKk.....",
    ".....kKKKKKk......",
    "....SSSSSSSSSS....",
    "...SSSSSSSSSSSS...",
    "...SSSSSSSSSSSS...",
    "...SSSSSSSSSSSS...",
    "...sSSSSSSSSSSs...",
    "....PPPPPPPPPP....",
    "....PPPPPPPPPP....",
    "....PPPPP.PPPPP...",
    "....PPPP...PPPP...",
    "....PPPP...PPPP...",
    "....BBBB...BBBB..."];
    var PAL={H:'#22160f',h:'#4a3326',K:'#c98c63',k:'#a86f4c',g:'#b08a4a',L:'#cfe3f2',E:'#e7b93e',S:'#f2a28a',s:'#d98670',P:'#2f3a52',B:'#141412'};
    function px(c,P,x,y,col){c.fillStyle=col;c.fillRect((x+2)*P,(y+4)*P,P,P)}
    function rect(c,P,x,y,w,h,col){c.fillStyle=col;c.fillRect((x+2)*P,(y+4)*P,w*P,h*P)}
    function draw(c,P,state,season,f){
      c.clearRect(0,0,22*P,28*P);
      var coat=state==='office';
      // corpo
      BASE.forEach(function(row,y){for(var x=0;x<row.length;x++){var ch=row[x];if(ch==='.')continue;
        var col=PAL[ch];
        if(coat&&(ch==='S'))col='#f4f4ef'; if(coat&&ch==='s')col='#d7d7cf';
        if(state==='off'&&ch==='L')col='#3b2f22';            // occhi chiusi
        if(season==='summer'&&ch==='L')col='#141412';        // occhiali da sole
        px(c,P,x,y,col)}});
      if(coat){ rect(c,P,8,13,2,5,'#f2a28a'); px(c,P,5,15,'#9fb4ff'); px(c,P,5,16,'#9fb4ff'); } // maglia sotto il camice, penna nel taschino
      // braccia e oggetti
      var K=PAL.K;
      if(state==='office'){ // provetta che fa le bolle
        rect(c,P,2,14,1,4,'#f4f4ef'); px(c,P,2,18,K);
        rect(c,P,15,14,1,3,'#f4f4ef'); px(c,P,15,17,K);
        rect(c,P,16,13,1,1,'#cfe3f2'); rect(c,P,16,14,2,1,'#cfe3f2'); rect(c,P,16,15,2,2,'#7fd38a');
        px(c,P,f?17:16,f?11:12,'#7fd38a');
      } else if(state==='code'){ // portatile e mani che battono
        rect(c,P,3,15,12,5,'#8a8f98'); rect(c,P,2,20,14,1,'#5f646c'); px(c,P,8,17,'#c5f03c');
        px(c,P,f?4:5,f?19:20,K); px(c,P,f?13:12,f?20:19,K);
            } else if(state==='gym'){ // manubrio, un braccio alla volta
        var up=f?15:2, dn=f?2:15;
        rect(c,P,dn,14,1,4,K);
        rect(c,P,up,9,1,5,K);
        rect(c,P,up-1,8,3,1,'#3a3a34'); px(c,P,up-2,7,'#3a3a34');px(c,P,up-2,8,'#3a3a34');px(c,P,up-2,9,'#3a3a34');
        px(c,P,up+2,7,'#3a3a34');px(c,P,up+2,8,'#3a3a34');px(c,P,up+2,9,'#3a3a34');
      } else { // off: braccia giù e zzz
        rect(c,P,2,14,1,4,K); rect(c,P,15,14,1,4,K);
        var zy=f?-3:-2; c.fillStyle=PAL.H;
        [[14,zy],[15,zy],[16,zy],[15,zy+1],[14,zy+2],[15,zy+2],[16,zy+2]].forEach(function(p){px(c,P,p[0],p[1],'#6b6f8a')});
      }
      // stagione / festività
      if(season==='christmas'){ // cappello rosso con bordo bianco e pompon
        rect(c,P,3,-1,10,2,'#d62839'); rect(c,P,6,-3,6,2,'#d62839'); rect(c,P,10,-4,3,1,'#d62839');
        rect(c,P,2,1,12,1,'#ffffff'); rect(c,P,13,-4,2,2,'#ffffff');
      } else if(season==='birthday'){ // cappellino a cono e coriandolo
        rect(c,P,6,-1,5,1,'#ff3d8b'); rect(c,P,7,-2,3,1,'#ffd447'); rect(c,P,8,-3,1,1,'#ff3d8b'); px(c,P,8,-4,'#ffd447');
        px(c,P,f?0:1,f?3:4,'#5bc0eb'); px(c,P,f?17:16,f?5:4,'#ff3d8b');
      } else if(season==='halloween'){ // zucca ai piedi
        rect(c,P,0,21,3,2,'#ff9a3c'); px(c,P,1,20,'#5b7a2e'); px(c,P,0,21,f?'#ffd447':'#2a1505'); px(c,P,2,21,f?'#ffd447':'#2a1505');
      } else if(season==='spring'){ // fiore tra i capelli
        px(c,P,12,0,'#e85d9a');px(c,P,13,1,'#e85d9a');px(c,P,11,1,'#e85d9a');px(c,P,12,2,'#e85d9a');px(c,P,12,1,'#ffd447');
      } else if(season==='autumn'){ // sciarpa
        rect(c,P,5,12,8,2,'#9b2335'); rect(c,P,10,14,2,3,'#9b2335'); px(c,P,10,17,'#e8a33d');
      }
    }
    return {draw:draw,W:22,H:28};
  })();

  // avatar accanto all'orologio: stessa fase della giornata dello stato + accessorio del periodo
  var meNav=$('#meNav'), meF=0;
  function drawMeNav(){ if(meNav) AVATAR.draw(meNav.getContext('2d'),2,meKey,document.body.dataset.season||'',meF) }
  function status(wd,min){
    var gym=(['Mon','Wed','Fri'].indexOf(wd)>=0 && min>=390 && min<540) || (wd==='Sat' && min>=510 && min<750);
    if(gym){meKey='gym'; return t('probabilmente in palestra 🏋️','probably in the gym 🏋️')}
    var work=['Sat','Sun'].indexOf(wd)<0 && min>=540 && min<1020;
    if(work){meKey=flip?'code':'office'; return flip ? t('probabilmente in vibe coding 💻','probably vibe coding 💻') : t('in ufficio 🧪','in the office 🧪')}
    meKey='off'; return t('fuori servizio 🌙','off duty 🌙');
  }
  function tick(){
    if(!clock) return;
    var now=new Date(), hm, wd;
    try{
      hm=now.toLocaleTimeString('it-IT',{timeZone:'Europe/Rome',hour:'2-digit',minute:'2-digit',hour12:false});
      wd=now.toLocaleDateString('en-GB',{timeZone:'Europe/Rome',weekday:'short'});
    }catch(e){hm=now.toTimeString().slice(0,5);wd='Mon'}
    var min=parseInt(hm.slice(0,2),10)%24*60+parseInt(hm.slice(3,5),10);
    var txt=status(wd,min);
    if(clock.dataset.st!==txt){
      clock.dataset.st=txt;
      clock.textContent='Pisa '+hm;
      clock.appendChild(document.createElement('br'));
      var st=document.createElement('span'); st.className='st'; st.textContent=txt; clock.appendChild(st);
    } else clock.firstChild.textContent='Pisa '+hm;
    if(meNav){meNav.title='Pisa '+hm+' · '+txt; drawMeNav()}
  }
  setInterval(tick,30000);
  setInterval(function(){flip=!flip;tick()},4000);
  if(meNav&&!reduce) setInterval(function(){if(!document.hidden){meF=1-meF;drawMeNav()}},520); // due fotogrammi, animazione leggera

  $('#yr').textContent=new Date().getFullYear();

  /* ---------- progresso + sezione attiva ---------- */
  var bar=$('.progress'), ticking=false;
  function onScroll(){
    if(ticking) return; ticking=true;
    requestAnimationFrame(function(){
      var h=document.documentElement.scrollHeight-innerHeight;
      bar.style.transform='scaleX('+(h>0?scrollY/h:0)+')';
      ticking=false;
    });
  }
  addEventListener('scroll',onScroll,{passive:true}); onScroll();

  var navLinks=$$('.links a');
  var linksBox=$('.links');
  function linksEnd(){linksBox.classList.toggle('end',linksBox.scrollLeft+linksBox.clientWidth>=linksBox.scrollWidth-4)}
  linksBox.addEventListener('scroll',linksEnd,{passive:true}); addEventListener('resize',linksEnd); linksEnd();
  if('IntersectionObserver' in window){
    var so=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        navLinks.forEach(function(a){
          var on=a.getAttribute('href')==='#'+e.target.id;
          a.classList.toggle('on',on);
          if(on) a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current');
        });
      });
    },{rootMargin:'-45% 0px -50% 0px'});
    $$('main section[id], #top').forEach(function(s){so.observe(s)});

    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.08});
    $$('.rv').forEach(function(el){io.observe(el)});
  } else $$('.rv').forEach(function(el){el.classList.add('in')});

  /* ---------- filtri progetti ---------- */
  var works=$$('.work');
  $$('.filters .chip').forEach(function(c){
    var f=c.dataset.f;
    var n=f==='all'?works.length:works.filter(function(w){return (' '+w.dataset.cat+' ').indexOf(' '+f+' ')>=0}).length;
    var sup=document.createElement('sup'); sup.textContent=n; c.appendChild(sup);
    c.addEventListener('click',function(){
      $$('.filters .chip').forEach(function(x){x.setAttribute('aria-pressed',x===c)});
      works.forEach(function(w){w.classList.toggle('hide',f!=='all'&&(' '+w.dataset.cat+' ').indexOf(' '+f+' ')<0)});
    });
  });

  /* ---------- filtri paper ---------- */
  // con "tutti" si vedono i lavori in evidenza (.key); il bottone mostra il resto
  var papers=$$('.paper'), pcount=$('#pcount'), pmore=$('#pmore'), pf='all', expanded=false;
  function showPapers(){
    papers.forEach(function(p){
      p.classList.toggle('hide', pf!=='all' ? p.dataset.y!==pf : (!expanded && !p.classList.contains('key')));
    });
    if(pmore){
      pmore.hidden = pf!=='all';
      pmore.setAttribute('aria-expanded',expanded);
      pmore.textContent = expanded ? t('Mostra solo quelli in evidenza ↑','Show highlights only ↑') : t('Mostra tutti i '+papers.length+' lavori ↓','Show all '+papers.length+' papers ↓');
    }
    countPapers();
  }
  function countPapers(){
    if(!pcount) return;
    var vis=papers.filter(function(p){return !p.classList.contains('hide')}).length;
    pcount.textContent=t(vis+' di '+papers.length+' in archivio',vis+' of '+papers.length+' in the archive');
    if(pmore && pf==='all') pmore.textContent = expanded ? t('Mostra solo quelli in evidenza ↑','Show highlights only ↑') : t('Mostra tutti i '+papers.length+' lavori ↓','Show all '+papers.length+' papers ↓');
  }
  $$('.ptools .chip').forEach(function(c){
    c.addEventListener('click',function(){
      pf=c.dataset.f;
      $$('.ptools .chip').forEach(function(x){x.setAttribute('aria-pressed',x===c)});
      showPapers();
    });
  });
  if(pmore) pmore.addEventListener('click',function(){expanded=!expanded;showPapers()});
  showPapers();
  // un link a un paper nascosto (filtro anno o lista ridotta) prima lo rende visibile
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href^="#"]'); if(!a) return;
    var el=document.getElementById(a.getAttribute('href').slice(1));
    if(el&&el.classList.contains('paper')&&el.classList.contains('hide')){expanded=true;$('.ptools .chip[data-f="all"]').click()}
  });

  /* ---------- toast + copia email ---------- */
  var toastEl=$('.toast'), toastT;
  function toast(msg){
    toastEl.textContent=msg; toastEl.classList.add('on');
    clearTimeout(toastT); toastT=setTimeout(function(){toastEl.classList.remove('on')},2600);
  }
  $$('.copy').forEach(function(b){
    b.addEventListener('click',function(){
      var v=b.dataset.copy;
      function ok(){toast(t('📋 copiata: ','📋 copied: ')+v)}
      if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(ok,function(){location.href='mailto:'+v});
      else location.href='mailto:'+v;
    });
  });


  /* ---------- terminale "vibe coding" ---------- */
  (function(){
    var term=$('.vterm'); if(!term) return;
    var SCRIPT={
      it:[['serve un tool che trasformi gli spettri in grafici','acchiappaspettri/ online'],
          ['e le etichette CLP per i reagenti?','etichette/ online'],
          ['prepara gli standard per l\'ICP-OES','icp-tool/ online'],
          ['a che ora esco oggi?','calcolatore-orario/ online'],
          ['ordina una pizza per il laboratorio','🍕 margherita in forno… 4 minuti'],
          ['prossima idea…',null]],
      en:[['I need a tool that turns spectra into plots','acchiappaspettri/ online'],
          ['what about CLP labels for reagents?','etichette/ online'],
          ['prepare the ICP-OES standards','icp-tool/ online'],
          ['what time can I leave today?','calcolatore-orario/ online'],
          ['order a pizza for the lab','🍕 margherita in the oven… 4 minutes'],
          ['next idea…',null]]
    };
    var SPIN='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏', timer=null, visible=false, run=0;
    function el(cls,txt){var s=document.createElement('span');if(cls)s.className=cls;s.textContent=txt;return s}
    function staticView(){
      term.textContent='';
      var L=SCRIPT[root.lang==='en'?'en':'it'];
      L.forEach(function(r){
        term.appendChild(el('pr','$ vibe "'+r[0]+'"\n'));
        term.appendChild(r[1]?el('ok','✓ '+r[1]+'\n'):el('sp',t('⏳ compilando…','⏳ compiling…')));
      });
    }
    function play(){
      var my=++run, L=SCRIPT[root.lang==='en'?'en':'it'], i=0;
      term.textContent='';
      var cur=el('cur',' ');
      function wait(ms,fn){timer=setTimeout(function(){if(my===run)fn()},ms)}
      function line(){
        if(i>=L.length){return wait(800,play)}
        var r=L[i++], txt='$ vibe "'+r[0]+'"', k=0, pr=el('pr','');
        term.appendChild(pr); term.appendChild(cur);
        (function type(){
          if(k<=txt.length){pr.textContent=txt.slice(0,k++);return wait(28+Math.random()*40,type)}
          pr.textContent=txt+'\n';
          var sp=el('sp',''), n=0, dur=r[1]?900:4200;
          term.insertBefore(sp,cur);
          (function spin(){
            sp.textContent=SPIN[n++%SPIN.length]+' '+(r[1]?t('ci penso io…','on it…'):t('compilando la prossima idea…','compiling the next idea…'));
            if(n*90<dur) return wait(90,spin);
            if(r[1]){sp.className='ok';sp.textContent='✓ '+r[1]+'\n';return wait(500,line)}
            wait(400,line);
          })();
        })();
      }
      line();
    }
    function stop(){run++;clearTimeout(timer)}
    function refresh(){stop(); if(reduce) staticView(); else if(visible) play(); else staticView()}
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){visible=es[0].isIntersecting; if(reduce) return; visible?play():stop()}).observe(term);
    }
    new MutationObserver(refresh).observe(root,{attributes:true,attributeFilter:['lang']});
    staticView();
  })();

  applyLang(lang);
  birthdayHello();

  /* =========================================================
     COLTURA DI EUGLENE — fototassi
     le cellule nuotano verso la luce (il cursore);
     cliccane una e si divide (scissione binaria longitudinale)
     ========================================================= */
  var cv=$('#culture'); if(!cv||!cv.getContext) return;
  var ctx=cv.getContext('2d'), W=0, H=0, dpr=1, cells=[], light={x:0,y:0,on:false}, run=true, t0=0, raf;
  // colori presi dalle variabili CSS: cambiano con tema chiaro/scuro e con i temi stagionali
  var CHL, EYE, INK, GLOW, LIGHT, SEASON, motes=[];
  function palette(){
    var cs=getComputedStyle(document.body);
    function v(n,d){return cs.getPropertyValue(n).trim()||d}
    CHL=v('--cell-body','#c5f03c'); EYE=v('--cell-eye','#ff5a2c'); INK=v('--ink','#141412');
    GLOW=v('--cell-glow','transparent'); LIGHT=v('--cell-light','255,240,150');
    var sz=document.body.dataset.season||'';
    if(sz!==SEASON){SEASON=sz; seedMotes()}
  }
  /* particelle stagionali, solo nel canvas dell'hero (mai sopra i contenuti):
     halloween = lucine fluttuanti · christmas = neve · spring = petali
     summer = pulviscolo di luce · autumn = foglie */
  function seedMotes(){
    motes=[]; if(!SEASON||!W) return;
    var n=W<700?12:24;
    for(var i=0;i<n;i++) motes.push({x:Math.random()*W,y:Math.random()*H,r:2+Math.random()*3,v:.2+Math.random()*.45,ph:Math.random()*9,rot:Math.random()*6,dir:Math.random()<.5?-1:1});
  }
  function drawMotes(now,dt){
    for(var i=0;i<motes.length;i++){
      var m=motes[i], sway=Math.sin(now/1300+m.ph);
      var bat=SEASON==='halloween'&&i%4===0;
      if(bat){m.x+=m.dir*(.6+m.v)*dt; m.y+=sway*.4*dt; if(m.x<-30)m.x=W+30; if(m.x>W+30)m.x=-30}
      else if(SEASON==='summer'||SEASON==='halloween'){m.y-=m.v*.45*dt; m.x+=sway*.25*dt}
      else {m.y+=m.v*dt; m.x+=sway*.45*dt; m.rot+=.01*dt}
      if(m.y>H+10){m.y=-10;m.x=Math.random()*W} if(m.y<-10){m.y=H+10;m.x=Math.random()*W}
      ctx.save(); ctx.globalAlpha=inZone(m.x,m.y)?.2:.85; ctx.translate(m.x,m.y);
      if(SEASON==='christmas'){ctx.fillStyle='rgba(255,255,255,.95)';ctx.strokeStyle='rgba(15,27,45,.25)';ctx.beginPath();ctx.arc(0,0,m.r*.8,0,7);ctx.fill();ctx.stroke()}
      else if(bat){ // pipistrello: due ali che battono
        var f=Math.sin(now/110+m.ph)*6, s2=1+m.r/5; ctx.scale(m.dir*s2,s2); ctx.fillStyle=INK;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(-6,-8-f,-14,-2-f*.6); ctx.quadraticCurveTo(-9,-1,-7,3); ctx.quadraticCurveTo(-4,1,0,3);
        ctx.quadraticCurveTo(4,1,7,3); ctx.quadraticCurveTo(9,-1,14,-2-f*.6); ctx.quadraticCurveTo(6,-8-f,0,0); ctx.fill();
        ctx.beginPath(); ctx.arc(0,1,2.4,0,7); ctx.fill();
      }
      else if(SEASON==='halloween'){var a=.35+.35*Math.sin(now/500+m.ph);var g=ctx.createRadialGradient(0,0,0,0,0,m.r*3);g.addColorStop(0,'rgba(255,154,60,'+a+')');g.addColorStop(1,'rgba(255,154,60,0)');ctx.fillStyle=g;ctx.fillRect(-m.r*3,-m.r*3,m.r*6,m.r*6)}
      else if(SEASON==='spring'){ctx.rotate(m.rot);ctx.fillStyle='rgba(232,93,154,.55)';ctx.beginPath();ctx.ellipse(0,0,m.r*1.4,m.r*.7,0,0,7);ctx.fill()}
      else if(SEASON==='summer'){ctx.fillStyle='rgba(255,196,60,'+(.3+.3*Math.sin(now/700+m.ph))+')';ctx.beginPath();ctx.arc(0,0,m.r*.6,0,7);ctx.fill()}
      else if(SEASON==='birthday'){ctx.rotate(m.rot*2);ctx.fillStyle=['#ff3d8b','#c5f03c','#ffd447','#5bc0eb','#ff8a3d'][i%5];ctx.fillRect(-m.r,-m.r*.45,m.r*2,m.r*.9)}
      else if(SEASON==='autumn'){ctx.rotate(m.rot);ctx.fillStyle=i%2?'rgba(201,111,40,.7)':'rgba(155,35,53,.6)';ctx.beginPath();ctx.moveTo(0,-m.r*1.6);ctx.quadraticCurveTo(m.r*1.3,0,0,m.r*1.6);ctx.quadraticCurveTo(-m.r*1.3,0,0,-m.r*1.6);ctx.fill()}
      ctx.restore();
    }
  }
  // zone di testo dell'hero: lì le euglene passano "in trasparenza" per non coprire la lettura
  var zones=[];
  function measure(){
    var r=cv.getBoundingClientRect();
    zones=$$('.hero h1 .l1, .hero h1 .l2, .hero .role, .hero .pos, .hero .tagline, .hero .lead, .hero .cta, .hero .hint, .hero .hmeta').filter(function(e){return e.offsetParent!==null}).map(function(e){
      var b=e.getBoundingClientRect(); return [b.left-r.left-8,b.top-r.top-8,b.right-r.left+8,b.bottom-r.top+8];
    });
  }
  function inZone(x,y){for(var i=0;i<zones.length;i++){var z=zones[i];if(x>z[0]&&x<z[2]&&y>z[1]&&y<z[3])return true}return false}
  function size(){
    var r=cv.getBoundingClientRect(); dpr=Math.min(devicePixelRatio||1,2);
    W=r.width; H=r.height; cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function Cell(x,y,a){
    this.x=x; this.y=y; this.a=a==null?Math.random()*Math.PI*2:a;
    this.s=.5+Math.random()*.6; this.len=26+Math.random()*16; this.ph=Math.random()*9; this.born=performance.now();
  }
  function seed(n){for(var i=0;i<n;i++) cells.push(new Cell(Math.random()*W,Math.random()*H))}
  function draw(c,now){
    var L=c.len, w=L*.28, wob=Math.sin(now/260+c.ph)*.18, grow=Math.min(1,(now-c.born)/600);
    ctx.save(); ctx.globalAlpha=c.al; ctx.translate(c.x,c.y); ctx.rotate(c.a+wob*.4); ctx.scale(grow,grow);
    // alone stagionale (Halloween: creatura luminosa · Natale: luce dorata)
    if(GLOW!=='transparent'){var hg=ctx.createRadialGradient(0,0,0,0,0,L*.95);hg.addColorStop(0,GLOW);hg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=hg;ctx.fillRect(-L,-L,L*2,L*2)}
    // flagello
    ctx.beginPath(); ctx.moveTo(L*.5,0);
    for(var k=1;k<=10;k++){var px=L*.5+k*2.6;ctx.lineTo(px,Math.sin(now/90+c.ph+k*.8)*3.2*(k/10))}
    ctx.strokeStyle=INK; ctx.lineWidth=1.1; ctx.stroke();
    // corpo fusiforme (metabolia: si deforma un po')
    var sq=1+Math.sin(now/700+c.ph)*.12;
    ctx.beginPath(); ctx.moveTo(L*.5,0);
    ctx.bezierCurveTo(L*.25,-w*sq,-L*.3,-w*.9*sq,-L*.5,0);
    ctx.bezierCurveTo(-L*.3,w*.9*sq,L*.25,w*sq,L*.5,0);
    ctx.fillStyle=CHL; ctx.fill(); ctx.strokeStyle=INK; ctx.lineWidth=1.3; ctx.stroke();
    // cloroplasti
    ctx.fillStyle='rgba(20,60,10,.28)';
    for(var j=0;j<3;j++){ctx.beginPath();ctx.ellipse(-L*.22+j*L*.17,(j%2?1:-1)*w*.18,L*.06,w*.22,0,0,7);ctx.fill()}
    // macchia oculare
    ctx.beginPath(); ctx.arc(L*.3,-w*.28,2.4,0,7); ctx.fillStyle=EYE; ctx.fill();
    // compleanno: cappellino da festa sulla parte anteriore
    if(SEASON==='birthday'){
      ctx.beginPath(); ctx.moveTo(L*.12,-w*.62); ctx.lineTo(L*.42,-w*.62); ctx.lineTo(L*.27,-w*2.1); ctx.closePath();
      ctx.fillStyle='#ff3d8b'; ctx.fill(); ctx.strokeStyle=INK; ctx.lineWidth=1; ctx.stroke();
      ctx.beginPath(); ctx.arc(L*.27,-w*2.1,1.8,0,7); ctx.fillStyle='#ffd447'; ctx.fill();
    }
    ctx.restore();
  }
  function step(now){
    var dt=Math.min(40,now-(t0||now))/16.7; t0=now;
    ctx.clearRect(0,0,W,H);
    var lx=light.x, ly=light.y;
    if(!light.on){lx=W*(.5+.38*Math.sin(now/5200)); ly=H*(.5+.32*Math.sin(now/3900+1))}
    var chaos=now<chaosUntil, LC=chaos?'220,20,60':LIGHT, LR=chaos?210:170;
    // la "luce" che le euglene seguono (con "wanda" diventa magia del caos, rosso scarlatto)
    var g=ctx.createRadialGradient(lx,ly,0,lx,ly,LR);
    g.addColorStop(0,'rgba('+LC+','+(chaos?.42:.35)+')'); g.addColorStop(1,'rgba('+LC+',0)');
    ctx.fillStyle=g; ctx.fillRect(lx-LR,ly-LR,LR*2,LR*2);
    if(chaos) drawChaos(lx,ly,now);
    drawMotes(now,dt);
    for(var i=0;i<cells.length;i++){
      var c=cells[i], dx=lx-c.x, dy=ly-c.y, d=Math.hypot(dx,dy);
      var target=Math.atan2(dy,dx), diff=Math.atan2(Math.sin(target-c.a),Math.cos(target-c.a));
      var pull=d>60?.045:-.03; // troppo vicini alla luce → si allontanano (fotofobia)
      c.a+=(diff*pull+(Math.random()-.5)*.14)*dt;
      var sp=c.s*(light.on?1.5:1)*(chaos?1.8:1)*dt;
      c.x+=Math.cos(c.a)*sp; c.y+=Math.sin(c.a)*sp;
      if(c.x<-40)c.x=W+40; if(c.x>W+40)c.x=-40; if(c.y<-40)c.y=H+40; if(c.y>H+40)c.y=-40;
      var target2=inZone(c.x,c.y)?.18:1; c.al=(c.al==null?target2:c.al+(target2-c.al)*.12);
      if(chaos){ // scia scarlatta dietro ogni euglena
        (c.trail=c.trail||[]).push(c.x,c.y); if(c.trail.length>28) c.trail.splice(0,2);
        ctx.save(); ctx.globalAlpha=c.al*.8; ctx.strokeStyle='rgba(225,29,72,.75)'; ctx.lineWidth=3.5; ctx.lineCap='round'; ctx.shadowColor='rgba(225,29,72,.8)'; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.moveTo(c.trail[0],c.trail[1]); for(var q=2;q<c.trail.length;q+=2) ctx.lineTo(c.trail[q],c.trail[q+1]); ctx.stroke(); ctx.restore();
      } else if(c.trail) c.trail=null;
      draw(c,now);
    }
    if(run) raf=requestAnimationFrame(step);
  }
  // filamenti di magia attorno alla luce: archi rossi che ruotano
  var chaosUntil=0;
  function drawChaos(lx,ly,now){
    ctx.save(); ctx.lineCap='round'; ctx.shadowColor='rgba(225,29,72,.9)'; ctx.shadowBlur=12;
    for(var k=0;k<7;k++){
      var a=now/520+k*1.047, r1=24+8*Math.sin(now/300+k), r2=70+18*Math.sin(now/410+k*2);
      ctx.strokeStyle='rgba(225,29,72,'+(.6+.3*Math.sin(now/250+k))+')'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(lx+Math.cos(a)*r1,ly+Math.sin(a)*r1);
      ctx.quadraticCurveTo(lx+Math.cos(a+.9)*r2,ly+Math.sin(a+.9)*r2,lx+Math.cos(a+1.7)*(r2*.75),ly+Math.sin(a+1.7)*(r2*.75));
      ctx.stroke();
    }
    ctx.restore();
  }
  function start(){if(!run){run=true;t0=0;raf=requestAnimationFrame(step)}}
  function stop(){run=false;cancelAnimationFrame(raf)}

  size(); measure(); palette();
  addEventListener('load',measure);
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(measure);
  seed(W<700?9:18);
  if(reduce){run=false; step(performance.now())} else raf=requestAnimationFrame(step);

  function resized(){
    var r=cv.getBoundingClientRect();
    if(Math.abs(r.width-W)<1&&Math.abs(r.height-H)<1){measure();return} // stessa misura: niente reset del canvas
    var ow=W,oh=H; size(); measure(); seedMotes();
    if(ow&&oh) cells.forEach(function(c){c.x*=W/ow;c.y*=H/oh});
    if(!run) step(performance.now());
  }
  if('ResizeObserver' in window) new ResizeObserver(resized).observe(cv); else addEventListener('resize',resized);
  var hero=$('.hero');
  // mouse: la luce segue il cursore; touch: un tocco accende la luce per qualche secondo
  var lightOff;
  function setLight(e){var r=cv.getBoundingClientRect();light.x=e.clientX-r.left;light.y=e.clientY-r.top;light.on=true;clearTimeout(lightOff)}
  hero.addEventListener('pointermove',setLight);
  hero.addEventListener('pointerdown',setLight);
  hero.addEventListener('pointerleave',function(e){
    if(e.pointerType==='mouse') light.on=false;
    else lightOff=setTimeout(function(){light.on=false},4000);
  });
  // clic su una cellula → si divide
  hero.addEventListener('click',function(e){
    if(e.target.closest('a,button')) return;
    var r=cv.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top, hit=null, best=40;
    cells.forEach(function(c){var d=Math.hypot(c.x-x,c.y-y);if(d<best){best=d;hit=c}});
    if(hit&&cells.length<140){
      cells.push(new Cell(hit.x,hit.y,hit.a+.5)); hit.a-=.5;
      divisions++;
      if(divisions===1) toast(t('🦠 scissione binaria! Ora sono due.','🦠 binary fission! Now there are two.'));
      if(reduce) step(performance.now());
    }
  });
  var divisions=0, heroVis=true;
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){heroVis=es[0].isIntersecting;if(reduce)return;heroVis?start():stop()}).observe(hero);
  }
  document.addEventListener('visibilitychange',function(){if(reduce)return;(document.hidden||!heroVis)?stop():start()});
  new MutationObserver(function(){palette();measure();if(!run)step(performance.now())}).observe(root,{attributes:true,attributeFilter:['data-theme','data-dark','lang']});
  new MutationObserver(function(){palette();if(!run)step(performance.now())}).observe(document.body,{attributes:true,attributeFilter:['data-season']});
  matchMedia('(prefers-color-scheme: dark)').addEventListener&&matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){themeLabel();palette()});


  /* ---------- Lorenzo in pixel art, versione "stregone del caos" ----------
     compare in basso a destra con l'easter egg "wanda": mantello rosso, cerchietto con gemma,
     magia scarlatta dalle mani. Personaggio originale (nessun costume Marvel).
     Legenda: H/h capelli · K/k pelle · g occhiali · L lenti · Y cerchietto · R gemma · E orecchino
              S/s maglia · C/c mantello · P pantaloni · B scarpe */
  var SPRITE={"idle": ["....h.HhH.h.......", "...HhHHHhHHhH.....", "..HhHHHhHHHhHH....", "..HHHhHHHHhHHH....", "..HYYYYYRYYYYH....", "..HKKKKKKKKKKH....", "..HKgggKKgggKH....", "..HgLLgggLLgKK....", "..HKgggKKgggKKE...", "...KKKKkkKKKKK....", "...kKKKKKKKKKk....", "....kKKkkKKKk.....", ".....kKKKKKk......", "..CCCSSSSSSSSCCC..", ".CCSSSSSSSSSSSSCC.", ".CKSSSSSSSSSSSSKC.", "CCKSSSSSSSSSSSSKCC", "CcKsSSSSSSSSSSsKcC", "Cc.KPPPPPPPPPPK.cC", "Cc..PPPPPPPPPP..cC", "cc..PPPPP.PPPPP.cc", "cc..PPPP...PPPP.cc", "c...PPPP...PPPP..c", "....BBBB...BBBB..."], "cast": ["....h.HhH.h.......", "...HhHHHhHHhH.....", "..HhHHHhHHHhHH....", "..HHHhHHHHhHHH....", "..HYYYYYRYYYYH....", "..HKKKKKKKKKKH....", "..HKgggKKgggKH....", "..HgLLgggLLgKK....", "..HKgggKKgggKKE...", "K..KKKKkkKKKKK...K", "Kk.kKKKKKKKKKk..kK", ".K..kKKkkKKKk...K.", ".K...kKKKKKk....K.", ".K.CCSSSSSSSSCC.K.", ".KCCSSSSSSSSSSCCK.", "CKCSSSSSSSSSSSSCKC", "CCCSSSSSSSSSSSSCCC", "CcCsSSSSSSSSSSsCcC", "Cc.KPPPPPPPPPPK.cC", "Cc..PPPPPPPPPP..cC", "cc..PPPPP.PPPPP.cc", "cc..PPPP...PPPP.cc", "c...PPPP...PPPP..c", "....BBBB...BBBB..."], "idle2": ["....h.HhH.h.......", "...HhHHHhHHhH.....", "..HhHHHhHHHhHH....", "..HHHhHHHHhHHH....", "..HYYYYYRYYYYH....", "..HKKKKKKKKKKH....", "..HKgggKKgggKH....", "..HgLLgggLLgKK....", "..HKgggKKgggKKE...", "...KKKKkkKKKKK....", "...kKKKKKKKKKk....", "....kKKkkKKKk.....", ".....kKKKKKk......", "..CCCSSSSSSSSCCC..", ".CCSSSSSSSSSSSSCC.", ".CKSSSSSSSSSSSSKC.", "CCKSSSSSSSSSSSSKCC", "CcKsSSSSSSSSSSsKcC", "Cc.KPPPPPPPPPPK.cC", "Cc..PPPPPPPPPP..cC", "cc..PPPPP.PPPPP.cc", "cc..PPPP...PPPP..c", "....PPPP...PPPP...", "....BBBB...BBBB..."], "cast2": ["....h.HhH.h.......", "...HhHHHhHHhH.....", "..HhHHHhHHHhHH....", "..HHHhHHHHhHHH....", "..HYYYYYRYYYYH....", "..HKKKKKKKKKKH....", "..HKgggKKgggKH....", "..HgLLgggLLgKK....", "..HKgggKKgggKKE...", "K..KKKKkkKKKKK...K", "Kk.kKKKKKKKKKk..kK", ".K..kKKkkKKKk...K.", ".K...kKKKKKk....K.", ".K.CCSSSSSSSSCC.K.", ".KCCSSSSSSSSSSCCK.", "CKCSSSSSSSSSSSSCKC", "CCCSSSSSSSSSSSSCCC", "CcCsSSSSSSSSSSsCcC", "Cc.KPPPPPPPPPPK.cC", "Cc..PPPPPPPPPP..cC", "cc..PPPPP.PPPPP.cc", "cc..PPPP...PPPP..c", "....PPPP...PPPP...", "....BBBB...BBBB..."]};
  var SPAL={H:'#22160f',h:'#4a3326',K:'#c98c63',k:'#a86f4c',g:'#b08a4a',L:'#cfe3f2',Y:'#e7b93e',R:'#e11d48',E:'#e7b93e',S:'#f2a28a',s:'#d98670',C:'#b3122e',c:'#7a0c20',P:'#2f3a52',B:'#141412'};
  var meCv=null, meT=null, meRaf=null;
  function pixelMe(ms){
    var PX=5, W0=18*PX, H0=24*PX, M=34; // M = margine per l'alone della magia
    if(!meCv){
      meCv=document.createElement('canvas'); meCv.className='pixelme'; meCv.setAttribute('aria-hidden','true');
      meCv.width=(W0+M*2)*2; meCv.height=(H0+M)*2; meCv.style.width=(W0+M*2)+'px'; meCv.style.height=(H0+M)+'px';
      document.body.appendChild(meCv);
    }
    var x=meCv.getContext('2d'), t0=performance.now(), end=t0+ms;
    x.setTransform(2,0,0,2,0,0); x.imageSmoothingEnabled=false;
    function frame(now){
      var el=now-t0, casting=el>650, alt=Math.floor(el/320)%2;
      var g=casting?(alt?SPRITE.cast2:SPRITE.cast):(alt?SPRITE.idle2:SPRITE.idle);
      x.clearRect(0,0,W0+M*2,H0+M);
      if(casting){ // magia dalle mani
        [[1,9.5],[16.5,9.5]].forEach(function(h,i){
          var gx=M+h[0]*PX, gy=M+h[1]*PX, r=26+5*Math.sin(now/180+i*2);
          var gr=x.createRadialGradient(gx,gy,0,gx,gy,r); gr.addColorStop(0,'rgba(255,70,110,.95)'); gr.addColorStop(.45,'rgba(225,29,72,.5)'); gr.addColorStop(1,'rgba(225,29,72,0)');
          x.fillStyle=gr; x.fillRect(gx-r,gy-r,r*2,r*2);
          for(var k=0;k<3;k++){var a=now/300+k*2.1+i, rr=10+k*5; x.fillStyle='rgba(255,140,160,.9)'; x.fillRect(Math.round(gx+Math.cos(a)*rr),Math.round(gy+Math.sin(a)*rr),2,2)}
        });
      }
      g.forEach(function(row,yy){for(var xx=0;xx<row.length;xx++){var ch=row[xx];if(ch!=='.'){x.fillStyle=SPAL[ch];x.fillRect(M+xx*PX,M+yy*PX,PX,PX)}}});
      if(now<end&&!reduce) meRaf=requestAnimationFrame(frame);
    }
    cancelAnimationFrame(meRaf); clearTimeout(meT);
    meCv.classList.add('on');
    if(reduce){frame(t0+1000)} else meRaf=requestAnimationFrame(frame);
    meT=setTimeout(function(){meCv.classList.remove('on');cancelAnimationFrame(meRaf)},ms);
  }

  /* ---------- easter egg: scrivi "euglena" ---------- */
  var buf='';
  addEventListener('keydown',function(e){
    if(e.ctrlKey||e.metaKey||e.altKey) return;
    if(e.target.closest&&e.target.closest('input,textarea')) return;
    buf=(buf+(e.key||'')).slice(-12).toLowerCase();
    if(/euglena$/.test(buf)){
      buf='';
      for(var i=0;i<40&&cells.length<160;i++) cells.push(new Cell(Math.random()*W,Math.random()*H));
      toast(t('🌿 fioritura algale! Hai trovato l\'easter egg.','🌿 algal bloom! You found the easter egg.'));
      if(scrollY>innerHeight*.6) scrollTo({top:0,behavior:reduce?'auto':'smooth'});
      if(reduce) step(performance.now());
    }
    if(/wanda$/.test(buf)){
      buf=''; chaosUntil=performance.now()+9000; pixelMe(9000);
      toast(t('✨ magia del caos attivata: per qualche secondo le euglene obbediscono a Wanda.','✨ chaos magic activated: for a few seconds the euglenas obey Wanda.'));
      if(scrollY>innerHeight*.6) scrollTo({top:0,behavior:reduce?'auto':'smooth'});
      if(!run) step(performance.now());
    }
  });

  try{console.log('%c🦠 lorenzo.b','font:800 22px sans-serif;background:#c5f03c;color:#141412;padding:4px 8px','\nCiao, curioso/a! Scrivi "euglena" o "wanda" sulla pagina (non qui) per una sorpresa.\nCodice: https://github.com/lorebiri/lorebiri.github.io')}catch(e){}
})();
