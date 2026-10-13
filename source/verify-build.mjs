import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('..');
const files=fs.readdirSync(root).filter(f=>f.endsWith('.html'));
let checked=0;
for(const file of files){const html=fs.readFileSync(path.join(root,file),'utf8');if((html.match(/<h1[ >]/g)||[]).length!==1)throw Error(file+': invalid h1 count');if(!html.includes('lang="ar" dir="rtl"'))throw Error(file+': missing Arabic direction');for(const match of html.matchAll(/(?:src|href)="((?:\/|\.\/)[^"#]*)(?:#[^"]*)?"/g)){const local=match[1]==='/'?'/index.html':match[1].split('?')[0];if(!fs.existsSync(path.join(root,local)))throw Error(file+': missing '+local);checked++}for(const match of html.matchAll(/href="#([^"]+)"/g)){if(!html.includes('id="'+match[1]+'"'))throw Error(file+': missing target '+match[1])}}
const images=fs.readdirSync(path.join(root,'assets')).filter(x=>x.endsWith('.webp')&&x!=='hero.webp');const bytes=images.reduce((n,f)=>n+fs.statSync(path.join(root,'assets',f)).size,0);
console.log(JSON.stringify({pages:files.length,localReferences:checked,generatedVisuals:images.length,generatedVisualBytes:bytes,passed:true}));

