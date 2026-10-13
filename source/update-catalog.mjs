import {readFileSync,writeFileSync,renameSync,copyFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {validateCatalog} from './catalog-schema.mjs';
const [mode,input]=process.argv.slice(2);
if(!['--check','--apply'].includes(mode)||!input){console.error('Usage: node update-catalog.mjs --check|--apply candidate.json');process.exit(1)}
const candidate=validateCatalog(JSON.parse(readFileSync(resolve(input),'utf8').replace(/^\uFEFF/,'')));
const target=new URL('./services-data.json',import.meta.url);
console.log(`Validated ${candidate.services.length} services (${candidate.services.filter(s=>s.active!==false).length} active).`);
if(mode==='--apply'){
 const pending=new URL('./services-data.pending.json',import.meta.url),backup=new URL('./services-data.backup.json',import.meta.url);
 writeFileSync(pending,JSON.stringify(candidate,null,2)+'\n','utf8');if(existsSync(target))copyFileSync(target,backup);renameSync(pending,target);console.log('Catalog updated locally. Rebuild, verify and deploy to publish. No public admin endpoint exists.');
}
