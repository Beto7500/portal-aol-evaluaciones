const $ = (s) => document.querySelector(s);
let portalData = null;
function normalizeEmail(v){return String(v||'').trim().toLowerCase()}
async function sha256Bytes(text){return new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalizeEmail(text))))}
async function sha256Hex(text){return [...await sha256Bytes(text)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function b64bytes(s){const bin=atob(s);return Uint8Array.from(bin,c=>c.charCodeAt(0))}
async function decryptRecord(payload,email){
  const key=await crypto.subtle.importKey('raw',await sha256Bytes(email),'AES-GCM',false,['decrypt']);
  const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64bytes(payload.iv)},key,b64bytes(payload.cipher));
  return JSON.parse(new TextDecoder().decode(clear));
}
function setStatus(msg,error=false){const s=$('#status');s.textContent=msg;s.classList.toggle('error',error)}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function showTeacher(period,user){const box=$('#result');box.innerHTML=`<h2>${escapeHtml(user.name)}</h2><p>Periodo ${escapeHtml(period)}</p><a class="buttonLink" href="${user.url}" target="_blank" rel="noopener">Abrir mis evaluaciones</a>`;box.classList.remove('hidden')}
function showAdmin(period,users){const box=$('#result');users.sort((a,b)=>a.name.localeCompare(b.name,'es'));box.innerHTML=`<h2>Acceso de administrador</h2><p>${users.length} docentes configurados en el periodo ${escapeHtml(period)}.</p><div class="adminGrid">${users.map(u=>`<div class="adminRow"><span>${escapeHtml(u.name)}</span><a href="${u.url}" target="_blank" rel="noopener">Abrir carpeta</a></div>`).join('')}</div>`;box.classList.remove('hidden')}
async function init(){
 try{
  const res=await fetch('data.json',{cache:'no-store'});if(!res.ok)throw new Error('No fue posible cargar la configuración.');portalData=await res.json();
  const periods=Object.keys(portalData.periods).sort().reverse();$('#period').innerHTML=periods.map(p=>`<option value="${p}">${escapeHtml(portalData.periods[p].label||p)}</option>`).join('');
  $('#lookupForm').addEventListener('submit',async e=>{
   e.preventDefault();$('#result').classList.add('hidden');const period=$('#period').value,email=normalizeEmail($('#email').value);if(!period||!email){setStatus('Captura periodo y correo institucional.',true);return}
   setStatus('Validando…');const hash=await sha256Hex(email);const pd=portalData.periods?.[period];
   try{
    if((portalData.adminHashes||[]).includes(hash)){const users=await decryptRecord(pd.adminBundle,email);setStatus('Acceso de administrador reconocido.');showAdmin(period,users);return}
    const payload=pd?.users?.[hash];if(!payload){setStatus('No encontré evaluaciones asociadas a ese correo para el periodo seleccionado.',true);return}
    const user=await decryptRecord(payload,email);setStatus('Evaluaciones localizadas. Microsoft 365 validará tu acceso al abrirlas.');showTeacher(period,user)
   }catch{setStatus('No fue posible validar la información del usuario.',true)}
  });
  if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
 }catch(err){setStatus(err.message||'No fue posible iniciar el portal.',true)}
}
init();