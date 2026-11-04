const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const src=p=>esc(String(p).replace(/^\/+/,""));
const load=async u=>{const r=await fetch(u,{cache:"no-cache"});if(!r.ok)throw new Error(u);return r.json()};
const $=s=>document.querySelector(s);
const PAGES=[["index.html","Accueil"],["association.html","L’association"],["logements.html","Logements"],["contact.html","Contact"]];
const here=location.pathname.split("/").pop()||"index.html";
document.body.insertAdjacentHTML("afterbegin",`<header class="top"><div class="wrap bar"><a class="brand" href="index.html">Hébergements Jeunes <span>Challans</span></a><nav>${PAGES.map(([h,t])=>`<a href="${h}"${h===here?' aria-current="page"':""}>${t}</a>`).join("")}</nav></div></header>`);
function contact(a){
  const t=a.telephone?`<a class="btn" href="tel:${esc(a.telephone.replace(/\s/g,""))}">Appeler ${esc(a.telephone)}</a>`:"";
  const m=a.email?`<a class="btn alt" href="mailto:${esc(a.email)}?subject=${encodeURIComponent("Annonce : "+(a.titre||""))}">Écrire un email</a>`:"";
  if(!t&&!m)return SITE_CONTACT?`<div class="ctc">${SITE_CONTACT}</div>`:"";
  return `<div class="ctc">${a.contact_nom?`<div class="who">Contact : ${esc(a.contact_nom)}</div>`:""}${t}${m}</div>`}
let SITE_CONTACT="";
function ad(a,i,k){
  const ph=(a.photos||[]).filter(Boolean),off=a.disponible===false,id=k+i;
  const img=ph.length?`<img class="main-img" id="m${id}" src="${src(ph[0])}" alt="${esc(a.titre)}">`:`<div class="noimg">Photos bientôt disponibles</div>`;
  const th=ph.length>1?`<div class="thumbs">${ph.map((p,n)=>`<button class="th" data-i="${id}" data-s="${src(p)}" aria-label="Photo ${n+1}"${n?"":' aria-current="true"'}><img src="${src(p)}" alt="" loading="lazy"></button>`).join("")}</div>`:"";
  const f=[a.type,a.surface?a.surface+" m²":"",a.quartier].filter(Boolean).map(x=>`<li>${esc(x)}</li>`).join("");
  return `<article class="ad${off?" off":""}"><div>${img}${th}</div><div><span class="tag${off?" off":""}">${off?"Loué":"Disponible"}</span><h3>${esc(a.titre)}</h3>${a.loyer?`<div class="price">${esc(a.loyer)} €<small> /mois</small></div>`:""}<ul class="facts">${f}</ul><p class="desc">${esc(a.description)}</p>${off?"":contact(a)}</div></article>`}
document.addEventListener("click",e=>{const b=e.target.closest(".th");if(!b)return;
  document.getElementById("m"+b.dataset.i).src=b.dataset.s;
  b.parentNode.querySelectorAll(".th").forEach(x=>x.removeAttribute("aria-current"));b.setAttribute("aria-current","true")});
(async()=>{
  let s={};try{s=await load("data/site.json")}catch(e){}
  document.querySelectorAll("[data-intro]").forEach(n=>n.textContent=s.intro||"");
  const tel=s.telephone?`<a class="btn" href="tel:${esc(s.telephone.replace(/\s/g,""))}">Appeler ${esc(s.telephone)}</a>`:"";
  const mail=s.email?`<a class="btn alt" href="mailto:${esc(s.email)}">Écrire un email</a>`:"";
  document.querySelectorAll("[data-contact]").forEach(n=>n.innerHTML=tel+mail);SITE_CONTACT=tel+mail;
  document.body.insertAdjacentHTML("beforeend",`<footer><div class="wrap">Association « Allo Hébergement Jeunes » · Challans, Vendée${s.telephone?` · ${esc(s.telephone)}`:""}${s.email?` · <a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`:""}</div></footer>`);

  const cf=$("#cf");
  if(cf){
    if(!s.cle_formulaire){$("#cf-off").hidden=false}else{
      cf.hidden=false;
      try{const d=await load("data/annonces.json");const sel=$("#cf-log");
        (d.annonces||[]).filter(a=>a.disponible!==false).forEach(a=>{const o=document.createElement("option");o.textContent=a.titre;sel.appendChild(o)})}catch(e){}
      cf.addEventListener("submit",async e=>{
        e.preventDefault();const m=$("#cf-msg"),b=cf.querySelector("button");
        b.disabled=true;m.textContent="Envoi en cours…";
        const data=Object.fromEntries(new FormData(cf));
        data.access_key=s.cle_formulaire;data.from_name="Site Hébergements Jeunes";
        data.subject="Demande de logement : "+(data.name||"");
        try{const r=await fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(data)});
          const j=await r.json();
          if(j.success){cf.reset();m.textContent="Merci, votre demande a bien été envoyée. Nous vous répondrons rapidement."}
          else throw new Error(j.message)}
        catch(err){m.textContent="L’envoi a échoué. Réessayez, ou appelez-nous directement."}
        b.disabled=false})}}
  const list=$("#list"),latest=$("#latest"),assoc=$("#assoc");
  if(list||latest){try{
    const d=await load("data/annonces.json");
    const all=(d.annonces||[]).slice().sort((a,b)=>(a.disponible===false)-(b.disponible===false));
    const n=all.filter(a=>a.disponible!==false).length;
    if(list){$("#count").textContent=n?`${n} logement${n>1?"s":""} disponible${n>1?"s":""}`:"";
      list.innerHTML=all.length?all.map((a,i)=>ad(a,i,"l")).join(""):`<p class="empty">Aucun logement pour le moment. Contactez-nous pour être prévenu.</p>`}
    if(latest){const t=all.filter(a=>a.disponible!==false).slice(0,2);
      latest.innerHTML=t.length?t.map((a,i)=>ad(a,i,"h")).join(""):`<p class="empty">Aucun logement affiché pour le moment.</p>`}
  }catch(e){(list||latest).innerHTML=`<p class="empty">Impossible de charger les annonces. Réessayez plus tard.</p>`}}
  if(assoc){try{const a=await load("data/association.json");
    $("#assoc-title").textContent=a.titre||"L’association";
    assoc.innerHTML=String(a.texte||"").split(/\n\s*\n/).filter(Boolean).map(p=>`<p>${esc(p.trim())}</p>`).join("")}catch(e){}}
})();
