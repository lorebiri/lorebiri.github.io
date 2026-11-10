/* Finestrella per le immagini: si aprono nel sito invece che in un'altra scheda.
   Vale per ogni link a un file immagine; senza JavaScript, o con ctrl/cmd + clic, il link funziona come prima.
   Immagini nello stesso gruppo (.gallery, .cs-pages, .cs-demo) si sfogliano con le frecce. */
(function(){
  'use strict';
  var IMG=/\.(jpe?g|png|gif|webp)(\?.*)?$/i, GROUP='.gallery,.cs-pages,.cs-demo';
  var root=document.documentElement, box, pic, stage, cap, count, prev, next, closeBtn, list=[], at=0;
  function en(){return root.lang==='en'}

  function build(){
    box=document.createElement('dialog'); box.className='lb';
    box.innerHTML='<button class="lb-x" type="button">✕</button><div class="lb-stage"><img alt=""></div>'+
      '<div class="lb-bar"><button class="lb-nav" type="button" data-d="-1">‹</button><div class="lb-text"><span class="lb-count"></span><div class="lb-cap"></div></div><button class="lb-nav" type="button" data-d="1">›</button></div>';
    document.body.appendChild(box);
    pic=box.querySelector('img'); stage=box.querySelector('.lb-stage'); cap=box.querySelector('.lb-cap'); count=box.querySelector('.lb-count');
    prev=box.querySelector('[data-d="-1"]'); next=box.querySelector('[data-d="1"]'); closeBtn=box.querySelector('.lb-x');
    closeBtn.addEventListener('click',shut);
    prev.addEventListener('click',function(){go(-1)}); next.addEventListener('click',function(){go(1)});
    // clic fuori dall'immagine: chiude; clic sull'immagine: dimensione reale, se è più grande dello schermo
    box.addEventListener('click',function(e){if(e.target===box||e.target===stage)shut()});
    pic.addEventListener('click',function(){
      if(!box.classList.contains('zoom')&&!canZoom()) return;
      box.classList.toggle('zoom'); stage.scrollTo(0,0);
    });
    pic.addEventListener('load',function(){pic.classList.toggle('can-zoom',canZoom())});
    box.addEventListener('keydown',function(e){
      if(e.key==='ArrowLeft'){e.preventDefault();go(-1)}
      else if(e.key==='ArrowRight'){e.preventDefault();go(1)}
    });
    // Esc chiude da solo e arriva qui, a volte in ritardo: se nel frattempo si è riaperta non va toccata
    box.addEventListener('close',function(){if(!box.open)tidy()});
  }
  function tidy(){root.classList.remove('lb-open');pic.removeAttribute('src')}
  function shut(){box.close();tidy()}
  function canZoom(){return pic.naturalWidth>pic.clientWidth+40||pic.naturalHeight>pic.clientHeight+40}
  function go(d){if(list.length>1)show((at+d+list.length)%list.length)}

  function show(i){
    at=i;
    var a=list[i], thumb=a.querySelector('img'), fig=a.closest('figure'), fc=fig&&fig.querySelector('figcaption');
    box.classList.remove('zoom'); pic.classList.remove('can-zoom');
    // con le animazioni ridotte una GIF resta l'immagine ferma scelta da <picture>
    pic.src=a.querySelector('picture')&&thumb.currentSrc?thumb.currentSrc:a.href;
    pic.alt=thumb?thumb.alt:'';
    cap.textContent='';
    if(fc) Array.prototype.forEach.call(fc.childNodes,function(n){cap.appendChild(n.cloneNode(true))});
    var many=list.length>1;
    count.textContent=many?(i+1)+' / '+list.length:'';
    prev.hidden=next.hidden=!many;
    box.querySelector('.lb-bar').hidden=!many&&!fc;
    prev.setAttribute('aria-label',en()?'Previous image':'Immagine precedente');
    next.setAttribute('aria-label',en()?'Next image':'Immagine successiva');
    closeBtn.setAttribute('aria-label',en()?'Close':'Chiudi');
    box.setAttribute('aria-label',en()?'Enlarged figure':'Figura ingrandita');
    stage.scrollTo(0,0);
  }

  document.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey) return;
    var a=e.target.closest&&e.target.closest('a[href]');
    if(!a||!IMG.test(a.getAttribute('href'))||(box&&box.contains(a))||typeof HTMLDialogElement==='undefined') return;
    e.preventDefault();
    if(!box) build();
    var g=a.closest(GROUP);
    list=g?Array.prototype.filter.call(g.querySelectorAll('a[href]'),function(x){return IMG.test(x.getAttribute('href'))}):[a];
    show(list.indexOf(a));
    root.classList.add('lb-open');
    box.showModal();
  });
})();
