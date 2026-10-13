import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root='..',data=JSON.parse(fs.readFileSync('services-data.json'));
const govt=data.services.filter(s=>s.category!=='marketing');
assert.equal(govt.length,15);assert.equal(govt.reduce((n,s)=>n+s.details.length,0),87);
assert.deepEqual(govt.map(s=>s.details.length),[8,7,9,10,5,6,5,4,6,4,4,4,5,4,6]);
const html=fs.readFileSync(root+'/services.html','utf8');
assert.equal((html.match(/class="platform-form"/g)||[]).length,data.services.length);
for(const s of data.services){assert.ok(html.includes(`id="type-${s.id}"`));for(const t of s.details)assert.ok(html.includes(t));}
const stats=JSON.parse(fs.readFileSync('business-stats.json'));assert.equal(stats.clientsServed,2000);assert.equal(stats.premiumResidenciesIssued,300);
const country=JSON.parse(fs.readFileSync('countries.json'));assert.equal(country.length,245);assert.ok(country.some(c=>c.code==='SA'&&c.dial==='966'));
let assets=0;for(const f of ['journey/index.html']){const text=fs.readFileSync(root+'/'+f,'utf8');for(const m of text.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^https?:/.test(m[1]))throw Error('External journey dependency');assert.ok(fs.existsSync(path.resolve(root,path.dirname(f),m[1])),m[1]);assets++;}}
for(const m of fs.readFileSync(root+'/journey/part-16.js','utf8').matchAll(/src: '([^']+)'/g))assert.ok(fs.existsSync(root+'/journey/'+m[1]));
const form=fs.readFileSync(root+'/platform-forms.js','utf8');assert.ok(form.includes('text.textContent='));assert.ok(!/innerHTML|localStorage|sessionStorage|fetch\(/.test(form));
const bridge=fs.readFileSync(root+'/journey-bridge.js','utf8');assert.ok(bridge.includes('e.origin!==location.origin'));assert.ok(bridge.includes('e.source!==frame.contentWindow'));
console.log(JSON.stringify({platforms:15,subservices:87,marketing:8,forms:23,countries:245,localJourneyAssets:assets,passed:true}));
