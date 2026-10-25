// Lista archivos de imagen de las categorías de crochet en Commons (recursivo, 2 niveles).
import fs from "node:fs";
const API="https://commons.wikimedia.org/w/api.php";
const UA={"User-Agent":"LunaBrillanteApp/1.0 (educational crochet app)"};
const dormir=ms=>new Promise(r=>setTimeout(r,ms));
const get=async p=>{for(let i=0;i<8;i++){await dormir(700);const r=await fetch(`${API}?${new URLSearchParams({format:"json",...p})}`,{headers:UA});const t=await r.text();try{return JSON.parse(t)}catch{await dormir(5000*(i+1))}}throw new Error("api")};
async function miembros(cat,tipo){let out=[],cont;do{const r=await get({action:"query",list:"categorymembers",cmtitle:cat,cmtype:tipo,cmlimit:"500",...(cont?{cmcontinue:cont}:{})});out.push(...r.query.categorymembers.map(x=>x.title));cont=r.continue?.cmcontinue}while(cont);return out}
const raiz=["Category:Crochet stitches","Category:Close-up photographs of crochet","Category:Crochet lace","Category:Filet crochet","Category:Tunisian crochet","Category:Crochet patterns","Category:Crochet techniques","Category:Crocheted objects","Category:Crochet tutorials","Category:Crocheted flowers","Category:Granny squares"];
const vistas=new Set(),archivos=new Map();
async function rec(cat,prof){if(vistas.has(cat))return;vistas.add(cat);for(const f of await miembros(cat,"file"))archivos.set(f,cat);if(prof>0)for(const s of await miembros(cat,"subcat"))await rec(s,prof-1)}
for(const c of raiz)await rec(c,2);
fs.writeFileSync("scripts/commons-archivos.json",JSON.stringify([...archivos].map(([t,c])=>({t,c})),null,0));
console.log(archivos.size,"archivos en",vistas.size,"categorías");
