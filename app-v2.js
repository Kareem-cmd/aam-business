(() => {
  const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const ready=()=>root.classList.add('ready'),hero=document.querySelector('.hero-image');
  Promise.allSettled([document.fonts.ready,hero?.decode?.()]).then(ready);setTimeout(ready,2200);
  const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
  function closeMenu(focus=false){menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','فتح القائمة');nav?.classList.remove('open');if(focus)menu?.focus()}
  menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'إغلاق القائمة':'فتح القائمة');nav.classList.toggle('open',open)});
  nav?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true')closeMenu(true)});
  document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu()});matchMedia('(min-width:651px)').addEventListener('change',e=>{if(e.matches)closeMenu()});
  const header=document.querySelector('.site-header');let queued=false;
  function updateScroll(){header?.classList.toggle('scrolled',scrollY>110);queued=false}
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateScroll)}},{passive:true});updateScroll();
  if('IntersectionObserver' in window&&!reduced.matches){root.classList.add('motion');const reveals=[...document.querySelectorAll('.reveal')];const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('waiting');observer.unobserve(e.target)}})},{threshold:.08,rootMargin:'0px 0px -25px 0px'});reveals.forEach(el=>{if(el.getBoundingClientRect().top>innerHeight){el.classList.add('waiting');observer.observe(el)}});reduced.addEventListener('change',e=>{if(e.matches){reveals.forEach(x=>x.classList.remove('waiting'));observer.disconnect()}})}
  if('IntersectionObserver' in window){const o=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)nav?.querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id))})},{rootMargin:'-20% 0px -55% 0px'});document.querySelectorAll('main>section[id]').forEach(s=>o.observe(s))}
  const contactDialog=document.querySelector('#contact-dialog');document.querySelectorAll('[data-contact]').forEach(b=>b.addEventListener('click',()=>contactDialog.showModal()));
  document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.dialog-close')?.addEventListener('click',()=>d.close());d.querySelector('.dialog-dismiss')?.addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}})});
  const projectDialog=document.querySelector('#project-dialog');document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{const card=button.closest('article');projectDialog.querySelector('.dialog-image').src=card.querySelector('img').src;projectDialog.querySelector('#project-sector').textContent=card.querySelector('.work-content>span').textContent;projectDialog.querySelector('#project-title').textContent=card.querySelector('h3').textContent;projectDialog.querySelector('#project-description').textContent=card.querySelector('.work-content>p').textContent;projectDialog.showModal()}));projectDialog?.querySelector('a').addEventListener('click',()=>projectDialog.close());
  document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target||a.hasAttribute('download'))return;const url=new URL(a.href,location.href);if(url.origin!==location.origin||url.pathname===location.pathname||url.pathname==='/'&&location.pathname==='/index.html'||reduced.matches)return;if(document.startViewTransition)return;e.preventDefault();root.classList.add('page-leaving');setTimeout(()=>location.assign(a.href),260)});
  addEventListener('pageshow',()=>{root.classList.remove('page-leaving');ready()});
})();

 document.querySelectorAll('a[href="#payment-info"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();document.querySelector('#payment-info').showModal()}));
