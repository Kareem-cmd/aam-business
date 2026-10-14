(() => {
 const search=document.querySelector('#service-search');if(!search)return;
 const provider=document.querySelector('#service-provider');
 const articles=[...document.querySelectorAll('.catalog-service')];
 const categories=[...document.querySelectorAll('[data-category]')];
 const count=document.querySelector('#results-count'),visibleCount=document.querySelector('#visible-count'),more=document.querySelector('#load-more'),empty=document.querySelector('#catalog-empty'),reset=document.querySelector('#reset-filters');
 const normalize=s=>s.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[()،,]/g,' ').toLowerCase();
 const entries=articles.map(el=>({el,id:el.dataset.id,category:el.dataset.categoryId,provider:el.dataset.provider,title:el.querySelector('h3').textContent,text:normalize(el.querySelector('.platform-intro')?.textContent||el.textContent)}));
 const params=new URLSearchParams(location.search);let category=params.get('category')||'',group=(params.get('group')||'').split(',').filter(Boolean),limit=12,showAll=params.get('all')==='1';
 if(!categories.some(b=>b.dataset.category===category))category='';group=group.filter(id=>categories.some(b=>b.dataset.category===id));
 search.value=params.get('q')||'';if([...provider.options].some(o=>o.value===params.get('provider')))provider.value=params.get('provider');
 function apply(updateUrl=true){
   const words=normalize(search.value.trim()).split(/\s+/).filter(Boolean);
   const eligible=entries.filter(e=>(!category||e.category===category)&&(!group.length||group.includes(e.category))&&words.every(w=>e.text.includes(w)));
   const totals=new Map();eligible.forEach(e=>totals.set(e.provider,(totals.get(e.provider)||0)+1));
   const previous=provider.value;
   provider.replaceChildren(new Option(eligible.length?'جميع الجهات والمنصات ('+eligible.length+')':'لا توجد جهات تطابق البحث',''));
   totals.forEach((n,name)=>provider.add(new Option(name+' ('+n+')',name)));
   provider.value=totals.has(previous)?previous:'';
   provider.disabled=!eligible.length;
   const browsing=!!(showAll||category||group.length||provider.value||words.length);
   document.querySelector('#category-welcome').hidden=browsing;
   const found=eligible.filter(e=>browsing&&(!provider.value||e.provider===provider.value));
   const visible=new Set(found.slice(0,limit).map(e=>e.id));entries.forEach(e=>e.el.hidden=!visible.has(e.id));
   categories.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category&&!group.length)));
   const title=category?categories.find(b=>b.dataset.category===category).querySelector('span').textContent:group.length?'خدمات المسار المختار':browsing?'نتائج البحث':'اختر التصنيف للبدء';document.querySelector('#results-title').textContent=title;
   count.textContent=!browsing?'اختر مسارك من التصنيفات الثلاثة':`${found.length} خدمة ${words.length||category||group.length||provider.value?'تطابق اختيارك':'متاحة'}`;
   visibleCount.textContent=found.length?`عرض ${Math.min(limit,found.length)} من ${found.length} خدمة`:'';
   more.hidden=limit>=found.length;empty.hidden=!browsing||found.length>0;reset.hidden=!(search.value||provider.value||category||group.length);
   const groupNote=document.querySelector('#group-note');groupNote.hidden=!group.length;groupNote.textContent=group.length?'يعرض الدليل خدمات المسار الذي اخترته. اختر تصنيفًا أو امسح التصفية لتوسيع البحث.':'';
   if(updateUrl){const p=new URLSearchParams();if(showAll)p.set('all','1');if(category)p.set('category',category);if(group.length)p.set('group',group.join(','));if(provider.value)p.set('provider',provider.value);if(search.value.trim())p.set('q',search.value.trim());history.replaceState(null,'',location.pathname+(p.size?'?'+p.toString():''))}
 }
 function clear(){showAll=true;category='';group=[];provider.value='';search.value='';limit=12;apply();search.focus()}
 categories.forEach(b=>b.addEventListener('click',()=>{showAll=false;category=b.dataset.category;group=[];provider.value='';search.value='';limit=12;apply()}));
 search.addEventListener('input',()=>{limit=12;apply()});provider.addEventListener('change',()=>{showAll=true;limit=12;apply()});reset.addEventListener('click',clear);document.querySelector('#empty-reset').addEventListener('click',clear);
 more.addEventListener('click',()=>{const old=new Set(entries.filter(e=>!e.el.hidden).map(e=>e.id));limit+=12;apply();entries.find(e=>!e.el.hidden&&!old.has(e.id))?.el.querySelector('button').focus({preventScroll:true})});
 const dialog=document.querySelector('#service-dialog'),selected=new Set();
 try{sessionStorage.removeItem('aam-selected-services-v1')}catch{}
 const selectionList=document.querySelector('#selected-services'),copy=document.querySelector('#copy-service');
 function selectedEntries(){return [...selected].map(id=>entries.find(e=>e.id===id))}
 function syncSelection(){
 document.querySelector('#selection-bar').hidden=!selected.size;document.body.classList.toggle('has-selection',!!selected.size);document.querySelector('#selection-count').textContent=`الخدمات المختارة: ${selected.size}`;
 document.querySelectorAll('[data-service]').forEach(b=>{const chosen=selected.has(b.dataset.service);b.setAttribute('aria-pressed',String(chosen));b.firstChild.textContent=chosen?'تم الاختيار ✓ — إلغاء ':'اختر الخدمة ';b.closest('article').classList.toggle('service-selected',chosen)});
 selectionList.replaceChildren();selectedEntries().forEach(e=>{const li=document.createElement('li'),text=document.createElement('div'),title=document.createElement('strong'),providerText=document.createElement('span'),remove=document.createElement('button');title.textContent=e.title;providerText.textContent=e.provider==='خدمات أخرى'?'خدمات عامة ومتطلبات':e.provider;text.append(title,providerText);remove.textContent='إزالة';remove.className='text-link';remove.setAttribute('aria-label',`إزالة ${e.title} — ${e.provider}`);remove.addEventListener('click',()=>{selected.delete(e.id);syncSelection();document.querySelector('#change-service').focus()});li.append(text,remove);selectionList.append(li)});
 copy.disabled=!selected.size;document.querySelector('#prepare-request').disabled=!selected.size;document.querySelector('#clear-selection').hidden=!selected.size;document.querySelector('#selection-empty').hidden=!!selected.size;document.querySelector('#copy-status').textContent='';document.querySelector('#copy-fallback').hidden=true;
 }
 document.querySelectorAll('[data-service]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.service;selected.has(id)?selected.delete(id):selected.add(id);syncSelection()}));
 document.querySelector('#review-selection').addEventListener('click',()=>{syncSelection();dialog.showModal()});
 document.querySelector('#change-service').addEventListener('click',()=>dialog.close());
 document.querySelector('#clear-selection').addEventListener('click',()=>{selected.clear();syncSelection();document.querySelector('#change-service').focus()});
 copy.addEventListener('click',async()=>{if(!selected.size)return;const text='الخدمات المطلوبة — عام الأعمال\n\n'+selectedEntries().map((e,i)=>`${i+1}. ${e.title}\nالجهة أو المنصة: ${e.provider==='خدمات أخرى'?'خدمات عامة ومتطلبات':e.provider}`).join('\n\n');try{await navigator.clipboard.writeText(text);document.querySelector('#copy-status').textContent='تم نسخ ملخص جميع الخدمات المختارة.'}catch{const area=document.querySelector('#copy-fallback');area.value=text;area.hidden=false;area.focus();area.select();document.querySelector('#copy-status').textContent='حدّد الملخص وانسخه يدويًا.'}});
 syncSelection();
 let otherRequest=false;
 const requestDialog=document.querySelector('#request-dialog'),note=document.querySelector('#request-note'),requestStatus=document.querySelector('#request-status');
 requestDialog.addEventListener('close',()=>{if(!dialog.open&&selected.size)document.querySelector('#review-selection').focus()});
 const summaryText=()=>selectedEntries().map((e,i)=>`${i+1}. ${e.title}\nالجهة: ${e.provider==='خدمات أخرى'?'خدمات عامة ومتطلبات':e.provider}\nرمز الخدمة: ${e.id}`).join('\n\n');
 document.querySelector('#prepare-request').addEventListener('click',()=>{if(!selected.size)return;otherRequest=false;note.required=false;document.querySelector('#back-selection').textContent='العودة للاختيارات';dialog.close();document.querySelector('#request-summary').textContent=`عدد الخدمات المختارة: ${selected.size}. راجع تفاصيلها بالعودة للاختيارات.`;requestStatus.textContent='';requestDialog.showModal();updateWhatsapp()});
 document.querySelector('#back-selection').addEventListener('click',()=>{requestDialog.close();if(selected.size)dialog.showModal();else document.querySelector('#other-request').focus()});
 document.querySelector('#download-request').addEventListener('click',()=>{if(!selected.size&&!note.value.trim())return;const text='مسودة طلب خدمات — عام الأعمال\nلم يتم إرسال الطلب أو حجز الخدمة.\n\n'+summaryText()+'\n\nالملاحظات: '+(note.value.trim().slice(0,1000)||'لا توجد')+'\n\nالتكلفة: تُحدّد بعد مراجعة الاحتياج.\nالدفع الإلكتروني وتابي وتمارا غير مفعّلين حاليًا.\n';const url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='aam-business-request-draft.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);requestStatus.textContent='بدأ تنزيل مسودة الطلب على جهازك. لم تُرسل أي بيانات.';});

 const whatsapp=document.querySelector('#whatsapp-request');
 function requestText(){return 'طلب خدمات — عام الأعمال\n\n'+(summaryText()||'أخرى — طلب خدمة مخصص')+'\n\nالملاحظات: '+(note.value.trim().slice(0,1000)||'لا توجد')+'\n\nأرجو التواصل لتحديد النطاق والمتطلبات والتكلفة.'}
 function updateWhatsapp(){whatsapp.href='https://wa.me/966135129550?text='+encodeURIComponent(requestText());}
 note.addEventListener('input',()=>{note.setCustomValidity('');updateWhatsapp()});
 whatsapp.addEventListener('click',e=>{if(otherRequest&&!note.value.trim()){e.preventDefault();note.setCustomValidity('اكتب ملاحظتك حتى نعرف كيف نساعدك.');note.reportValidity();note.focus();return}updateWhatsapp();requestStatus.textContent='راجع الرسالة في واتساب واضغط إرسال. فتح واتساب لا يعني إرسال الطلب تلقائيًا.'});
 document.querySelector('#other-request').addEventListener('click',()=>{otherRequest=true;note.required=true;note.setCustomValidity('');document.querySelector('#request-summary').textContent=selected.size?'سنرفق ملاحظتك مع الخدمات المختارة.':'لم تجد خدمتك؟ صف احتياجك في الملاحظة أدناه.';document.querySelector('#back-selection').textContent=selected.size?'العودة للاختيارات':'العودة للخدمات';requestStatus.textContent='';requestDialog.showModal();updateWhatsapp();note.focus()});
 function newVisit(){selected.clear();otherRequest=false;note.required=false;note.setCustomValidity('');note.value='';requestStatus.textContent='';if(dialog.open)dialog.close();if(requestDialog.open)requestDialog.close();syncSelection()}
 addEventListener('pagehide',newVisit);addEventListener('pageshow',e=>{if(e.persisted)newVisit()});
 addEventListener('popstate',()=>location.reload());apply(false);
})();
(() => {
 const windowEl=document.querySelector('.marquee-window'),track=document.querySelector('.marquee-track');if(!track)return;
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(([entry])=>windowEl.classList.toggle('offscreen',!entry.isIntersecting));observer.observe(windowEl)}
})();
