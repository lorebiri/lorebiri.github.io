/* Movimento e transizioni (home e caso studio).
   - titoli di sezione che si svelano, elementi che entrano in sequenza
   - cambio tema con un cerchio che si allarga dal bottone, cambio lingua e filtri in dissolvenza
     (i progetti scivolano al loro nuovo posto)
   - schede che si inclinano seguendo il mouse, bottoni "magnetici", numeri che contano
   Con "riduci movimento" attivo nel sistema non fa nulla: il sito resta com'era. */
(function(){
  'use strict';
  var root=document.documentElement;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}
  var fine=matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- entrate: titoli e sequenze ---------- */
  root.classList.add('mo');
  // dentro le griglie gli elementi entrano uno dopo l'altro (ritardo ciclico, così non si aspetta troppo)
  $$('.tlist,.works,.gallery,.cs-pages,.cs-demo,.nums,.arch,.xp').forEach(function(g){
    // i numeri del caso studio in ordine pieno, il resto con ritardo ciclico
    Array.prototype.forEach.call(g.children,function(c,i){c.style.setProperty('--i',g.classList.contains('nums')?i:i%4)});
  });
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting) return;
      e.target.classList.add('in'); io.unobserve(e.target);
      if(e.target.classList.contains('nums')) countUp(e.target);
    })},{threshold:.15,rootMargin:'0px 0px -6% 0px'});
    $$('.shead,.tlist,.nums,.cs-demo,.cs-pages').forEach(function(el){io.observe(el)});
  } else $$('.shead,.tlist,.nums').forEach(function(el){el.classList.add('in')});

  /* ---------- impianto cocleare: compare una volta, il segnale gira solo quando è nello schermo ---------- */
  var ci=document.querySelector('.ci-fig');
  if(ci&&'IntersectionObserver' in window){
    new IntersectionObserver(function(es){var on=es[0].isIntersecting; if(on) ci.classList.add('in'); ci.classList.toggle('play',on&&ci.classList.contains('in'))},{threshold:.35}).observe(ci);
  }

  /* ---------- numeri del caso studio che contano fino al valore ---------- */
  function countUp(box){
    $$('li b',box).forEach(function(b){
      var end=parseInt(b.textContent,10); if(!(end>1)) return;
      var t0=performance.now(), d=900+end*8;
      b.style.minWidth=b.offsetWidth+'px';
      (function step(t){var k=Math.min(1,(t-t0)/d); b.textContent=Math.round(end*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(step)})(t0);
    });
  }

  /* ---------- transizioni di stato (View Transitions, dove il browser le supporta) ---------- */
  // il clic viene fermato e rifatto dentro la transizione, così main.js/case.js restano invariati
  var replay=false;
  function viaTransition(sel,kind){
    document.addEventListener('click',function(e){
      var el=e.target.closest&&e.target.closest(sel);
      if(!el||replay||!document.startViewTransition||e.defaultPrevented) return;
      e.preventDefault(); e.stopImmediatePropagation();
      var named=kind==='works'?nameWorks():[];
      if(kind) root.classList.add('vt-'+kind);
      var vt=document.startViewTransition(function(){replay=true;el.click();replay=false});
      if(kind==='theme') vt.ready.then(function(){circle(el)});
      vt.finished.then(function(){root.classList.remove('vt-'+kind);named.forEach(function(w){w.style.viewTransitionName=''})});
    },true);
  }
  // ogni progetto visibile ha un nome: il browser lo fa scivolare dalla vecchia alla nuova posizione
  // (solo quelli nello schermo: gli altri non devono attraversare la barra in alto)
  function nameWorks(){
    return $$('.work').filter(function(w){var r=w.getBoundingClientRect();return w.offsetParent!==null&&r.bottom>0&&r.top<innerHeight})
      .map(function(w,i){w.style.viewTransitionName='work-'+i;return w});
  }
  function circle(btn){
    var r=btn.getBoundingClientRect(), x=r.left+r.width/2, y=r.top+r.height/2;
    var R=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
    root.animate({clipPath:['circle(0 at '+x+'px '+y+'px)','circle('+R+'px at '+x+'px '+y+'px)']},
      {duration:650,easing:'cubic-bezier(.65,0,.35,1)',pseudoElement:'::view-transition-new(root)'});
  }
  viaTransition('#themeBtn','theme');
  viaTransition('#langBtn','lang');
  viaTransition('.filters .chip,#worksAll','works');
  viaTransition('.ptools .chip,#pmore','list');
  // dopo "mostra tutti" la pagina va al primo progetto comparso
  var all=document.getElementById('worksAll');
  if(all) all.addEventListener('click',function(){setTimeout(function(){var w=document.querySelector('.work.minor');if(w)w.scrollIntoView({behavior:'smooth',block:'start'})},420)});

  /* ---------- la locandina vola tra home e caso studio solo se è nello schermo ---------- */
  function posterCheck(){
    var p=document.querySelector('.vt-poster'); if(!p) return;
    var r=p.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight||!r.height) p.style.viewTransitionName='none';
  }
  addEventListener('pageswap',posterCheck);
  addEventListener('pagereveal',posterCheck);

  /* ---------- schede che si inclinano verso il mouse ---------- */
  if(fine){
    // solo schede piccole: su quelle grandi l'inclinazione sposta troppo i bordi e sfoca il testo
    $$('.tl,.cs-pages a').forEach(function(card){
      var max=7, raf=0, ev=null;
      card.classList.add('tilt');
      card.addEventListener('pointermove',function(e){ev=e; if(!raf) raf=requestAnimationFrame(apply)});
      card.addEventListener('pointerleave',function(){cancelAnimationFrame(raf);raf=0;card.style.transform='';card.style.removeProperty('--gx')});
      function apply(){
        raf=0; var r=card.getBoundingClientRect(), px=(ev.clientX-r.left)/r.width, py=(ev.clientY-r.top)/r.height;
        card.style.transform='perspective(900px) rotateX('+((.5-py)*max).toFixed(2)+'deg) rotateY('+((px-.5)*max).toFixed(2)+'deg) translate(-3px,-3px)';
        card.style.setProperty('--gx',(px*100).toFixed(1)+'%'); card.style.setProperty('--gy',(py*100).toFixed(1)+'%');
      }
    });

    /* ---------- bottoni "magnetici" ---------- */
    $$('.btn').forEach(function(b){
      b.addEventListener('pointermove',function(e){
        var r=b.getBoundingClientRect(), dx=(e.clientX-r.left-r.width/2)/r.width, dy=(e.clientY-r.top-r.height/2)/r.height;
        b.style.translate=(dx*8).toFixed(1)+'px '+(dy*6).toFixed(1)+'px';
      });
      b.addEventListener('pointerleave',function(){b.style.translate=''});
    });
  }
})();
