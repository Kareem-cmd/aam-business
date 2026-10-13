import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {validateCatalog} from './catalog-schema.mjs';
const source=JSON.parse(readFileSync('services-data.json','utf8'));const clean=validateCatalog(source);
assert.equal(clean.services.length,source.services.length);
for(const mutate of [d=>d.services.push({...d.services[0]}),d=>d.services[0].title='<img src=x onerror=alert(1)>',d=>d.services[0].category='missing',d=>d.services[0].priceSAR=-1,d=>d.services[0].priceSAR=1.234,d=>d.services[0].active='yes']){const d=structuredClone(source);mutate(d);assert.throws(()=>validateCatalog(d));}
const edited=structuredClone(source);edited.services[0].active=false;edited.categories[1].count=999;edited.services[1].priceSAR=125.50;const updated=validateCatalog(edited);assert.equal(updated.categories[1].count,edited.services.filter(s=>s.category===updated.categories[1].id&&s.active!==false).length);assert.equal(updated.services[1].priceSAR,125.5);
for(const file of readdirSync('..').filter(n=>n.endsWith('.html'))){const html=readFileSync('../'+file,'utf8');assert.ok(html.includes('Content-Security-Policy'));assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html));assert.ok(!/\son\w+\s*=/i.test(html));assert.ok(!/javascript:/i.test(html));assert.ok(html.includes('boot.js?v='));}
for(const file of readdirSync('../assets').filter(n=>n.endsWith('.svg'))){const svg=readFileSync('../assets/'+file,'utf8');assert.ok(!/<script|<foreignObject|\son\w+=|javascript:/i.test(svg),file+' active SVG content');}
const js=readFileSync('../catalog.js','utf8');assert.ok(!/sessionStorage\.(setItem|getItem)|localStorage|innerHTML|eval\(/.test(js));assert.ok(js.includes("addEventListener('pagehide'"));assert.ok(js.includes("if(e.persisted)newVisit()"));
console.log('PASS: validation rejects malformed updates, counts recomputed, CSP/external scripts/versioning present, SVGs passive, selection is not persisted.');
