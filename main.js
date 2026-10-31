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
    tick(); countPapers();
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
  function themeLabel(){themeBtn.textContent=isDark()?'☀︎':'☾';themeBtn.setAttribute('aria-pressed',isDark())}
  var th=get('theme'); if(th) root.dataset.theme=th;
  themeBtn.addEventListener('click',function(){root.dataset.theme=isDark()?'light':'dark';set('theme',root.dataset.theme);themeLabel()});
  themeLabel();

  /* ---------- orologio di Pisa ---------- */
  var clock=$('#clock');
  // stato "probabile": palestra lun/mer/ven presto e sabato mattina, in orario di lavoro
  // si alternano ufficio e vibe coding, altrimenti fuori servizio
  var flip=false;
  function status(wd,min){
    var gym=(['Mon','Wed','Fri'].indexOf(wd)>=0 && min>=390 && min<540) || (wd==='Sat' && min>=510 && min<750);
    if(gym) return t('probabilmente in palestra 🏋️','probably in the gym 🏋️');
    var work=['Sat','Sun'].indexOf(wd)<0 && min>=540 && min<1020;
    if(work) return flip ? t('probabilmente in vibe coding 💻','probably vibe coding 💻') : t('in ufficio 🧪','in the office 🧪');
    return t('fuori servizio 🌙','off duty 🌙');
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
  }
  setInterval(tick,30000);
  setInterval(function(){flip=!flip;tick()},4000);

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
  var papers=$$('.paper'), pcount=$('#pcount');
  function countPapers(){
    if(!pcount) return;
    var vis=papers.filter(function(p){return !p.classList.contains('hide')}).length;
    pcount.textContent=t(vis+' di '+papers.length+' in archivio',vis+' of '+papers.length+' in the archive');
  }
  $$('.ptools .chip').forEach(function(c){
    c.addEventListener('click',function(){
      var f=c.dataset.f;
      $$('.ptools .chip').forEach(function(x){x.setAttribute('aria-pressed',x===c)});
      papers.forEach(function(p){p.classList.toggle('hide',f!=='all'&&p.dataset.y!==f)});
      countPapers();
    });
  });
  // un link a un paper nascosto dal filtro anno riporta prima il filtro su "tutti"
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href^="#"]'); if(!a) return;
    var el=document.getElementById(a.getAttribute('href').slice(1));
    if(el&&el.classList.contains('paper')&&el.classList.contains('hide')) $('.ptools .chip[data-f="all"]').click();
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
          ['prossima idea…',null]],
      en:[['I need a tool that turns spectra into plots','acchiappaspettri/ online'],
          ['what about CLP labels for reagents?','etichette/ online'],
          ['prepare the ICP-OES standards','icp-tool/ online'],
          ['what time can I leave today?','calcolatore-orario/ online'],
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

  /* =========================================================
     COLTURA DI EUGLENE — fototassi
     le cellule nuotano verso la luce (il cursore);
     cliccane una e si divide (scissione binaria longitudinale)
     ========================================================= */
  var cv=$('#culture'); if(!cv||!cv.getContext) return;
  var ctx=cv.getContext('2d'), W=0, H=0, dpr=1, cells=[], light={x:0,y:0,on:false}, run=true, t0=0, raf;
  var CHL='#c5f03c', EYE='#ff5a2c';
  function ink(){return getComputedStyle(root).getPropertyValue('--ink').trim()||'#141412'}
  var INK=ink();
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
    ctx.restore();
  }
  function step(now){
    var dt=Math.min(40,now-(t0||now))/16.7; t0=now;
    ctx.clearRect(0,0,W,H);
    var lx=light.x, ly=light.y;
    if(!light.on){lx=W*(.5+.38*Math.sin(now/5200)); ly=H*(.5+.32*Math.sin(now/3900+1))}
    // la "luce" che le euglene seguono
    var g=ctx.createRadialGradient(lx,ly,0,lx,ly,170);
    g.addColorStop(0,'rgba(255,240,150,.35)'); g.addColorStop(1,'rgba(255,240,150,0)');
    ctx.fillStyle=g; ctx.fillRect(lx-170,ly-170,340,340);
    for(var i=0;i<cells.length;i++){
      var c=cells[i], dx=lx-c.x, dy=ly-c.y, d=Math.hypot(dx,dy);
      var target=Math.atan2(dy,dx), diff=Math.atan2(Math.sin(target-c.a),Math.cos(target-c.a));
      var pull=d>60?.045:-.03; // troppo vicini alla luce → si allontanano (fotofobia)
      c.a+=(diff*pull+(Math.random()-.5)*.14)*dt;
      var sp=c.s*(light.on?1.5:1)*dt;
      c.x+=Math.cos(c.a)*sp; c.y+=Math.sin(c.a)*sp;
      if(c.x<-40)c.x=W+40; if(c.x>W+40)c.x=-40; if(c.y<-40)c.y=H+40; if(c.y>H+40)c.y=-40;
      var target2=inZone(c.x,c.y)?.18:1; c.al=(c.al==null?target2:c.al+(target2-c.al)*.12);
      draw(c,now);
    }
    if(run) raf=requestAnimationFrame(step);
  }
  function start(){if(!run){run=true;t0=0;raf=requestAnimationFrame(step)}}
  function stop(){run=false;cancelAnimationFrame(raf)}

  size(); measure();
  addEventListener('load',measure);
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(measure);
  seed(W<700?9:18);
  if(reduce){run=false; step(performance.now())} else raf=requestAnimationFrame(step);

  addEventListener('resize',function(){var ow=W,oh=H;size();measure();cells.forEach(function(c){c.x*=W/ow;c.y*=H/oh});if(!run)step(performance.now())});
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
  new MutationObserver(function(){INK=ink();measure()}).observe(root,{attributes:true,attributeFilter:['data-theme','lang']});
  matchMedia('(prefers-color-scheme: dark)').addEventListener&&matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){INK=ink();themeLabel()});

  /* ---------- easter egg: scrivi "euglena" ---------- */
  var buf='';
  addEventListener('keydown',function(e){
    if(e.target.closest&&e.target.closest('input,textarea')) return;
    buf=(buf+(e.key||'')).slice(-12).toLowerCase();
    if(/euglena$/.test(buf)){
      buf='';
      for(var i=0;i<40&&cells.length<160;i++) cells.push(new Cell(Math.random()*W,Math.random()*H));
      toast(t('🌿 fioritura algale! Hai trovato l\'easter egg.','🌿 algal bloom! You found the easter egg.'));
      if(scrollY>innerHeight*.6) scrollTo({top:0,behavior:reduce?'auto':'smooth'});
      if(reduce) step(performance.now());
    }
  });

  try{console.log('%c🦠 lorenzo.b','font:800 22px sans-serif;background:#c5f03c;color:#141412;padding:4px 8px','\nCiao, curioso/a! Scrivi "euglena" sulla pagina (non qui) per una sorpresa.\nCodice: https://github.com/lorebiri/lorebiri.github.io')}catch(e){}
})();
