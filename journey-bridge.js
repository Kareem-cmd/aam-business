(() => {
 const section=document.querySelector('#intro-journey'),frame=document.querySelector('#journey-frame');if(!frame)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');let queued=false,trackWidth=0;
 function sizeTrack(){if(innerWidth!==trackWidth){trackWidth=innerWidth;section.style.height=(innerHeight*14)+'px';}}sizeTrack();
 function send(){queued=false;const range=section.offsetHeight-innerHeight;const p=Math.max(0,Math.min(1,(scrollY-section.offsetTop)/range));frame.contentWindow?.postMessage({aamJourney:true,type:'progress',value:p},location.origin);const inside=scrollY<section.offsetTop+section.offsetHeight-80;document.body.classList.toggle('inside-journey',inside);const header=document.querySelector('.site-header');if(header)header.inert=inside;}
 addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(send)}},{passive:true});addEventListener('resize',()=>{sizeTrack();send()});frame.addEventListener('load',send);
 function skip(){scrollTo({top:section.offsetTop+section.offsetHeight,behavior:'instant'});document.querySelector('#hero-title')?.focus({preventScroll:true});}
 addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==frame.contentWindow||!e.data?.aamJourney)return;const {type,value}=e.data;if(type==='goto'&&Number.isFinite(value))scrollTo({top:section.offsetTop+Math.max(0,Math.min(1,value))*(section.offsetHeight-innerHeight),behavior:reduce.matches?'auto':'smooth'});if(type==='advance'&&Number.isFinite(value))scrollBy({top:Math.min(.01,Math.max(0,value))*(section.offsetHeight-innerHeight),behavior:'instant'});if(type==='scroll'&&Number.isFinite(value))scrollBy({top:Math.max(-innerHeight*2,Math.min(innerHeight*2,value)),behavior:'instant'});if(type==='skip')skip();if(type==='ready')send();if(type==='fallback')section.classList.add('journey-unavailable');});
 document.querySelector('#journey-skip').addEventListener('click',skip);send();
})();
