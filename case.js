/* Pagine "caso studio": lingua e tema chiaro/scuro, con le stesse scelte salvate della home */
(function(){
  'use strict';
  var root=document.documentElement;
  root.classList.add('js');
  function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}

  var lang=get('lang')||((navigator.language||'en').slice(0,2).toLowerCase()==='it'?'it':'en');
  function applyLang(l){
    root.lang=l;
    Array.prototype.forEach.call(document.querySelectorAll('#langBtn b'),function(b){b.classList.toggle('on',b.dataset.l===l)});
    Array.prototype.forEach.call(document.querySelectorAll('img[data-alt-en]'),function(img){
      if(!img.dataset.altIt) img.dataset.altIt=img.alt;
      img.alt=l==='en'?img.dataset.altEn:img.dataset.altIt;
    });
  }
  document.getElementById('langBtn').addEventListener('click',function(){lang=lang==='it'?'en':'it';applyLang(lang);set('lang',lang)});
  applyLang(lang);

  var btn=document.getElementById('themeBtn');
  function isDark(){return root.dataset.theme?root.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches}
  function label(){var d=isDark();btn.textContent=d?'☀︎':'☾';btn.setAttribute('aria-pressed',d);if(d)root.dataset.dark='';else delete root.dataset.dark}
  var th=get('theme'); if(th) root.dataset.theme=th;
  btn.addEventListener('click',function(){root.dataset.theme=isDark()?'light':'dark';set('theme',root.dataset.theme);label()});
  label();

  var yr=document.getElementById('yr'); if(yr) yr.textContent=new Date().getFullYear();
})();
