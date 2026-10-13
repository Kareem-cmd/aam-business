(() => {
 const section=document.querySelector('#numbers');if(!section)return;
 const cards=[...section.querySelectorAll('.number-card')],reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let stopped=false;const frames=new Set(),timers=[];
 function settle(){stopped=true;timers.forEach(clearTimeout);frames.forEach(cancelAnimationFrame);cards.forEach(card=>{const n=card.querySelector('[data-count]');if(n)n.textContent=n.dataset.count+(n.dataset.suffix||'');card.classList.remove('is-counting');card.classList.add('is-settled')});}
 if(reduced.matches||!('IntersectionObserver' in window))return;
 section.classList.add('numbers-animated');
 function count(card){if(stopped)return;card.classList.add('is-counting');const el=card.querySelector('[data-count]');if(!el){card.classList.replace('is-counting','is-settled');return}const target=Number(el.dataset.count);el.textContent='0';let start=null,frame;
 function tick(time){frames.delete(frame);if(stopped)return;if(start===null)start=time;const p=Math.min((time-start)/1900,1);el.textContent=String(Math.floor(target*(1-Math.pow(1-p,3))));if(p<1){frame=requestAnimationFrame(tick);frames.add(frame)}else{el.textContent=String(target)+(el.dataset.suffix||'');card.classList.replace('is-counting','is-settled')}}
 frame=requestAnimationFrame(tick);frames.add(frame);
 }
 const seen=new Set();const observer=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting||seen.has(e.target))continue;seen.add(e.target);observer.unobserve(e.target);const delay=innerWidth>560?cards.indexOf(e.target)*280:0;timers.push(setTimeout(()=>count(e.target),delay));}},{threshold:.3});cards.forEach(c=>observer.observe(c));
 reduced.addEventListener('change',e=>{if(e.matches){observer.disconnect();settle()}});
})();
