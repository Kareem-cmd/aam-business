(() => {
 const dialog=document.querySelector('#platform-request-review');if(!dialog)return;
 const text=document.querySelector('#platform-request-text'),link=document.querySelector('#platform-whatsapp'),status=document.querySelector('#platform-request-status');let active=null;
 const digit=s=>s.replace(/[٠-٩۰-۹]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.includes(c)?'٠١٢٣٤٥٦٧٨٩'.indexOf(c):'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)));
 document.querySelectorAll('.platform-form').forEach(form=>{
  form.addEventListener('input',e=>e.target.setCustomValidity?.(''));
  form.addEventListener('submit',e=>{e.preventDefault();const f=form.elements;const name=f.fullName.value.trim();if(name.length<2){f.fullName.setCustomValidity('اكتب الاسم الكامل.');f.fullName.reportValidity();return}
   const [region,code]=f.country.value.split('|');let number=digit(f.phone.value).replace(/[\s()-]/g,'');
   if(number.startsWith('+')){if(!number.startsWith('+'+code)){f.phone.setCustomValidity('اختر مفتاح الدولة المطابق لرقم الجوال.');f.phone.reportValidity();return}number=number.slice(code.length+1)}else if(number.startsWith('00'+code))number=number.slice(code.length+2);
   number=number.replace(/^0+/,'');if(!/^\d{6,14}$/.test(number)||(code+number).length>15){f.phone.setCustomValidity('أدخل رقم جوال صحيحًا بدون مفتاح الدولة المكرر.');f.phone.reportValidity();return}
   const country=f.country.options[f.country.selectedIndex].text;
   text.textContent=`طلب خدمة — عام الأعمال\n\nالمنصة / الجهة: ${form.dataset.platform}\nنوع الخدمة: ${f.service.value}\nالاسم الكامل: ${name}\nرقم الجوال: +${code}${number}\nالدولة: ${country}\nالبريد الإلكتروني: ${f.email.value.trim()}\nالملاحظات: ${f.note.value.trim()||'لا توجد'}\n\nأرجو تأكيد المتطلبات والتكلفة قبل التنفيذ.`;
   link.href='https://wa.me/966135129550?text='+encodeURIComponent(text.textContent);active=form;status.textContent='';dialog.showModal();
  });
 });
 link.addEventListener('click',()=>{status.textContent='راجع الرسالة داخل واتساب واضغط إرسال. فتح واتساب وحده لا يرسل الطلب.'});
 dialog.addEventListener('close',()=>active?.querySelector('[type="submit"]').focus());
 document.querySelector('#platform-edit').addEventListener('click',()=>dialog.close());
 function clear(){document.querySelectorAll('.platform-form').forEach(f=>{f.reset();[...f.elements].forEach(e=>e.setCustomValidity?.(''))});text.textContent='';link.href='https://wa.me/966135129550';if(dialog.open)dialog.close();active=null;}
 addEventListener('pagehide',clear);addEventListener('pageshow',e=>{if(e.persisted)clear()});
})();
