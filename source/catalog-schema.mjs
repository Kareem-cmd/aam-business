import assert from 'node:assert/strict';
export const categoryIds=['investors','general','marketing'];
export function validateCatalog(input){
 assert.ok(input&&Array.isArray(input.categories)&&Array.isArray(input.services),'Expected categories and services arrays');
 assert.ok(input.services.length>0&&input.services.length<=5000,'Catalog must have 1–5000 services');
 const text=(v,label,max=240)=>{assert.ok(typeof v==='string'&&v.trim().length>0&&v.length<=max&&!/[<>\u0000-\u001f]/.test(v),`Invalid ${label}`);return v.trim()};
 const ids=new Set();const categories=input.categories.map(c=>{assert.ok(categoryIds.includes(c.id)&&!ids.has(c.id),'Invalid or duplicate category id');ids.add(c.id);return {...c,name:text(c.name,'category name',80),description:text(c.description,'category description',600),count:0}});
 assert.equal(ids.size,categoryIds.length,'Keep all three supported categories');
 const serviceIds=new Set();const services=input.services.map(s=>{assert.ok(typeof s.id==='string'&&/^[a-z0-9][a-z0-9-]{1,63}$/.test(s.id)&&!serviceIds.has(s.id),'Invalid or duplicate service id');serviceIds.add(s.id);assert.ok(typeof s.image==='string'&&/^[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp|svg)$/.test(s.image),'Invalid service image filename');assert.ok(ids.has(s.category),'Unknown service category');assert.ok(s.active===undefined||typeof s.active==='boolean','active must be boolean');assert.ok(s.priceSAR==null||(Number.isFinite(s.priceSAR)&&s.priceSAR>0&&Number.isInteger(Math.round(s.priceSAR*100))&&Math.abs(s.priceSAR*100-Math.round(s.priceSAR*100))<1e-7),'Price must be null or a positive SAR amount with at most two decimals');assert.ok(Array.isArray(s.details)&&s.details.length>0&&s.details.length<=100,'Service details required');return {...s,description:text(s.description,'description',600),details:s.details.map(v=>text(v,'detail',300)),title:text(s.title,'service title'),provider:text(s.provider,'provider',100),type:text(s.type||'أساسية','type',50)}});
 categories.forEach(c=>c.count=services.filter(s=>s.category===c.id&&s.active!==false).length);
 assert.ok(services.some(s=>s.active!==false),'At least one active service required');return {categories,services};
}
