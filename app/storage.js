import {initial, reduce, validateState, assert, clone, uid} from './core.js';
import {evaluatorReport} from './evaluators.js';
import {SEED} from './seed.js';
const DB_NAME='forno-artes-v2-desenvolvimento';
const request = r => new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});
const done = tx => new Promise((ok,no)=>{tx.oncomplete=ok;tx.onerror=()=>no(tx.error);tx.onabort=()=>no(tx.error||Error('Transação interrompida.'));});
export async function sha(s) {return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
async function passwordHash(password,salt) {
  const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const b=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:210000},k,256);
  return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
export const FINANCE_COMMANDS=['expense.add','expense.pay','expense.reimburse','contribution.add','return.add','person.save','recipe.save','payment.fee.set','order.pay','payment.issue','payment.issue.resolve'];
const PIN_ROLES=['admin','finance','presenter','seller','kitchen'];
const needsPassword=role=>['admin','finance','presenter'].includes(role);
function publicState(s){return {version:2,revision:s.revision,role:'public',paused:s.paused,prices:clone(s.prices),pix:clone(s.pix),
 menu:s.menu.filter(p=>p.active&&!p.archived).map(p=>{const x=clone(p);delete x.cost;return x;}),
 stock:Object.fromEntries(s.menu.flatMap(p=>['slice','whole'].map(m=>{const x=s.stock[p.id+':'+m];return [p.id+':'+m,{available:x?Math.max(0,Math.min(x.onHand-x.reserved,x.limit===null?Infinity:x.limit-x.reserved)):0}];}))),
 orders:s.orders.filter(o=>['preparando','pronto'].includes(o.status)).map(o=>({id:o.id,status:o.status,createdAt:o.createdAt}))};}
export function project(s,actor,identities={}){
 if(['admin','finance'].includes(actor?.role)){const v=clone(s);v.orders=v.orders.map(o=>({...o,sellerName:o.createdByName||identities[o.createdBy]||o.createdBy}));return v;}
 const view=publicState(s);if(!actor)return view;view.role=actor.role;
 if(actor.role==='presenter'){view.pix={key:'',recipient:'',qr:''};view.evaluatorReport=evaluatorReport(s);}
 if(['seller','kitchen','cashier'].includes(actor.role)){
  view.publicQueue=clone(view.orders);
  const orders=actor.role==='cashier'?s.orders:actor.role==='seller'?s.orders.filter(o=>o.createdBy===actor.id):s.orders.filter(o=>o.paidAt&&['preparando','pronto'].includes(o.status));
  view.orders=orders.map(o=>({id:o.id,status:o.status,createdAt:o.createdAt,paidAt:o.paidAt,createdBy:o.createdBy,...(['seller','cashier'].includes(actor.role)?{total:o.total,idempotencyKey:o.idempotencyKey,paymentReportedAt:o.paymentReportedAt,paymentIssue:(o.paymentReviews||[]).filter(x=>!x.resolvedAt).at(-1)?.kind}:{}),...(actor.role==='cashier'?{sellerName:o.createdByName||identities[o.createdBy]||o.createdBy,paymentReviews:clone(o.paymentReviews||[]),paymentReference:o.paymentReference,paymentStatementEntry:o.paymentStatementEntry,paidBy:o.paidBy,paidByName:o.paidByName,bankCheckSource:o.bankCheckSource}:{}),lines:o.lines.map(l=>({productId:l.productId,name:l.name,mode:l.mode,qty:l.qty,...(['seller','cashier'].includes(actor.role)?{unitPrice:l.unitPrice}:{})}))}));view.cashSessions=actor.role==='cashier'?s.cashSessions.filter(c=>!c.closedAt).map(c=>({id:c.id,openedAt:c.openedAt,openedBy:c.openedBy})):[];
 }
 return view;
}
export class LocalStore {
 mode='offline'; #session=null; #authBusy=false;
 get actor(){return this.#session?clone(this.#session.actor):null;}
 async init(){
  const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>r.result.createObjectStore('data');this.db=await request(r);
  const tx=this.db.transaction('data','readwrite'),ended=done(tx),os=tx.objectStore('data');
  if(!await request(os.get('state')))os.put(initial(SEED.menu),'state');await ended;
  this.channel=typeof BroadcastChannel==='function'?new BroadcastChannel(DB_NAME):null;
  this.channel?.addEventListener('message',()=>this.onchange?.());return this;
 }
 async #read(key){return request(this.db.transaction('data').objectStore('data').get(key));}
 async #resolve(os=null){
  if(!this.#session)return null;
  const get=key=>os?request(os.get(key)):this.#read(key),session=this.#session;
  if(session.accountId){const vault=await get('access-v1'),u=vault?.users.find(u=>u.id===session.accountId);
   if(!u?.enabled||u.version!==session.version){this.#session=null;return null;}
   return {id:u.id,name:u.name,role:u.role,...(u.role==='finance'?{allowedCommands:[...u.permissions]}:{})};
  }
  const c=await get(session.legacyKey);if(c?.hash!==session.hash){this.#session=null;return null;}return clone(session.actor);
 }
 async #projection(s,actor){const v=await this.#read('access-v1');return project(s,actor,Object.fromEntries((v?.users||[]).map(u=>[u.id,u.name])));}
 async state(){const actor=await this.#resolve();return this.#projection(await this.#read('state'),actor);}
 async configured(){return !!await this.#read('credentials');}
 async setup(name,password){
  assert(typeof name==='string'&&name.trim()&&name.length<=100&&typeof password==='string'&&password.length>=10,'Informe nome e senha local com pelo menos 10 caracteres.');
  const salt=uid(),hash=await passwordHash(password,salt);
  const tx=this.db.transaction('data','readwrite'),ended=done(tx),os=tx.objectStore('data');
  if(await request(os.get('credentials'))){tx.abort();await ended.catch(()=>{});throw Error('Já existe administrador local.');}
  os.put({name,salt,hash},'credentials');await ended;this.#session={actor:{id:name,role:'admin'},legacyKey:'credentials',hash};this.channel?.postMessage('updated');
 }
 async setFinanceAccess(name,password){
  assert((await this.#resolve())?.role==='admin','Somente a administração pode configurar a conta financeira.');
  assert(typeof name==='string'&&name.trim()&&name.length<=100&&typeof password==='string'&&password.length>=12,'Informe nome e senha individual de pelo menos 12 caracteres.');
  const salt=uid(),hash=await passwordHash(password,salt);
  const tx=this.db.transaction('data','readwrite'),ended=done(tx),os=tx.objectStore('data');
  try{assert((await this.#resolve(os))?.role==='admin','Sessão revogada.');os.put({name:name.trim(),salt,hash},'finance-credentials');await ended;this.channel?.postMessage('updated');}catch(e){try{tx.abort();}catch{}await ended.catch(()=>{});throw e;}
 }
 async login(name,password){
  this.#session=null;
  for(const [key,role] of [['credentials','admin'],['finance-credentials','finance']]){const c=await this.#read(key);
   if(c?.name===name&&c.hash===await passwordHash(password,c.salt)){this.#session={actor:{id:c.name,role},legacyKey:key,hash:c.hash};return;}}
  throw Error('Nome ou senha local incorretos.');
 }
 async logout(){this.#session=null;}
 async accessList(){
  assert((await this.#resolve())?.role==='admin','Acesso administrativo necessário.');const v=await this.#read('access-v1');
  return {users:(v?.users||[]).map(({id,name,role,enabled,permissions,updatedAt})=>({id,name,role,enabled,permissions,updatedAt})),audit:clone(v?.audit||[])};
 }
 async saveAccess(p){
  const actor=await this.#resolve();assert(actor?.role==='admin','Acesso administrativo necessário.');
  assert(p&&typeof p.name==='string'&&p.name.trim()&&p.name.length<=100&&PIN_ROLES.includes(p.role)&&typeof p.enabled==='boolean','Pessoa, perfil ou situação inválidos.');
  assert(Array.isArray(p.permissions)&&p.permissions.every(x=>FINANCE_COMMANDS.includes(x)),'Permissões inválidas.');
  assert(!p.pin||/^[1-9][0-9]{3}$/.test(p.pin),'PIN deve ter quatro dígitos, sem zero inicial.');
  const previous=await this.#read('access-v1'),existing=previous?.users.find(u=>u.id===p.id);
  assert(!p.id||existing,'Acesso não encontrado; não altera cadastros anteriores.');
  assert(existing||p.pin,'Informe o PIN individual.');
  assert(!p.password||typeof p.password==='string'&&p.password.length>=12&&p.password.length<=200,'Senha adicional deve ter 12–200 caracteres.');
  assert(!needsPassword(p.role)||p.password||existing?.passwordHash,'Administração, Financeiro e Apresentador exigem senha adicional.');
  const salt=previous?.salt||uid(),pinHash=p.pin?await passwordHash(p.pin,salt):existing.pinHash,passSalt=p.password?uid():existing?.passSalt||null;
  const passHash=p.password?await passwordHash(p.password,passSalt):existing?.passwordHash||null;
  const tx=this.db.transaction('data','readwrite'),ended=done(tx),os=tx.objectStore('data');
  try{assert((await this.#resolve(os))?.role==='admin','Sessão revogada.');const v=await request(os.get('access-v1'))||{salt,users:[],audit:[]};
   assert((previous?.revision||0)===(v.revision||0),'Acessos alterados em outra aba; atualize.');assert(v.users.length<100||existing,'Limite de acessos atingido.');
   assert(!v.users.some(u=>u.id!==p.id&&u.pinHash===pinHash),'PIN já atribuído; preserve o existente e escolha outro para esta nova conta.');
   const now=new Date().toISOString(),u={id:existing?.id||uid(),name:p.name.trim(),role:p.role,enabled:p.enabled,permissions:p.role==='finance'?[...new Set(p.permissions)]:[],pinHash,passSalt,passwordHash:passHash,version:uid(),updatedAt:now};
   const i=v.users.findIndex(x=>x.id===u.id);if(i<0)v.users.push(u);else v.users[i]=u;
   v.revision=(v.revision||0)+1;v.audit.push({type:existing?'access.updated':'access.created',actor:actor.id,subject:u.id,at:now,role:u.role,enabled:u.enabled,pinChanged:!!p.pin,passwordChanged:!!p.password});os.put(v,'access-v1');await ended;this.channel?.postMessage('updated');return u.id;
  }catch(e){try{tx.abort();}catch{}await ended.catch(()=>{});throw e;}
 }
 async loginPin(pin,password=''){
  assert(!this.#authBusy,'Aguarde a autenticação anterior.');this.#authBusy=true;this.#session=null;
  try{
   const attempts=await this.#read('access-attempts');assert(!attempts?.lockedUntil||Date.now()>=attempts.lockedUntil,'Tentativas excedidas. Aguarde cinco minutos; não limpe dados.');
   const v=await this.#read('access-v1');const hash=v&&/^[1-9][0-9]{3}$/.test(pin)?await passwordHash(pin,v.salt):null;
   const u=v?.users.find(x=>x.pinHash===hash),valid=u?.enabled&&(!needsPassword(u.role)||typeof password==='string'&&password.length>=12&&u.passwordHash===await passwordHash(password,u.passSalt));
   const tx=this.db.transaction('data','readwrite'),ended=done(tx),os=tx.objectStore('data');
   let accepted=false;
   try{const a=await request(os.get('access-attempts'))||{failures:0,lockedUntil:0},current=await request(os.get('access-v1'));
    if(a.lockedUntil&&Date.now()<a.lockedUntil)throw Error('Tentativas excedidas. Aguarde cinco minutos; não limpe dados.');
    const record=current?.users.find(x=>x.id===u?.id);accepted=!!(valid&&record?.enabled&&record.version===u.version);
    if(accepted){os.put({failures:0,lockedUntil:0},'access-attempts');current.audit.push({type:'access.login',actor:u.id,subject:u.id,at:new Date().toISOString()});}
    else{const failures=a.lockedUntil&&Date.now()>=a.lockedUntil?1:a.failures+1;os.put({failures,lockedUntil:failures>=5?Date.now()+300000:0},'access-attempts');if(current)current.audit.push({type:'access.denied',actor:'não autenticado',at:new Date().toISOString()});}
    if(current)os.put(current,'access-v1');await ended;
   }catch(e){try{tx.abort();}catch{}await ended.catch(()=>{});throw e;}
   assert(accepted,'Acesso não autorizado. Confira PIN, senha adicional e liberação com a administração.');
   this.#session={accountId:u.id,version:u.version,actor:{id:u.id,role:u.role,...(u.role==='finance'?{allowedCommands:[...u.permissions]}:{})}};
  }finally{this.#authBusy=false;}
 }
 async command(command){
  const tx=this.db.transaction('data','readwrite'),ended=done(tx),os=tx.objectStore('data');
  try{const actor=await this.#resolve(os);const s=reduce(await request(os.get('state')),command,actor);os.put(s,'state');await ended;this.channel?.postMessage('updated');return this.#projection(s,actor);}
  catch(e){try{tx.abort();}catch{}await ended.catch(()=>{});throw e;}
 }
 async evaluatorState(){assert(['admin','finance','presenter'].includes((await this.#resolve())?.role),'Consulta não autorizada.');return evaluatorReport(await this.#read('state'));}
 async export(){assert((await this.#resolve())?.role==='admin','Acesso administrativo necessário.');const state=await this.#read('state'),data=JSON.stringify(state);return {format:'FDA-BACKUP-2',createdAt:new Date().toISOString(),checksum:await sha(data),state};}
 async restore(backup){
  assert((await this.#resolve())?.role==='admin','Acesso administrativo necessário.');
  assert(backup?.format==='FDA-BACKUP-2'&&backup.checksum===await sha(JSON.stringify(backup.state)),'Arquivo incompatível ou checksum divergente.');validateState(backup.state);
  const tx=this.db.transaction('data','readwrite'),ended=done(tx),os=tx.objectStore('data');
  try{assert((await this.#resolve(os))?.role==='admin','Sessão revogada.');const current=await request(os.get('state'));
   assert(current.revision===0&&!current.orders.length&&!current.audit.length,'Restauração permitida somente em instalação local vazia. Não substituímos registros existentes.');
   const restored=clone(backup.state);restored.paused=true;os.put(restored,'state');await ended;this.channel?.postMessage('updated');return restored;
  }catch(e){try{tx.abort();}catch{}await ended.catch(()=>{});throw e;}
 }
}

export class OnlineStore {
  mode='online'; actor=null; token=''; refreshToken=''; expires=0;
  constructor(config){
    assert(/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url),'URL Supabase inválida.');
    assert(config.key?.length>20&&!config.key.startsWith('sb_secret_'),'Use somente chave pública publishable/anon.');
    if(config.key.split('.').length===3){try{const p=JSON.parse(atob(config.key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));assert(p.role==='anon','Chave JWT deve ser anon; nunca service_role.');}catch{throw Error('Chave JWT inválida ou privada.');}}
    else assert(config.key.startsWith('sb_publishable_'),'Use chave publishable ou JWT anon.');
    this.config=config;
  }
  async init(){return this;}
  async call(path,payload,token=this.token){
    const headers={'apikey':this.config.key,'Content-Type':'application/json'};
    // Publishable keys modernas não são JWT e não devem ir no Bearer.
    if(token)headers.Authorization='Bearer '+token;
    else if(this.config.key.split('.').length===3)headers.Authorization='Bearer '+this.config.key;
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),15000);
    try{const r=await fetch(this.config.url+path,{method:'POST',headers,body:JSON.stringify(payload),signal:ctl.signal,cache:'no-store'});const d=await r.json().catch(()=>null);
      if(!r.ok){if(r.status===401){this.actor=null;this.token='';this.refreshToken='';this.cached=null;}throw Error(d?.message||d?.error_description||'Falha de comunicação com o banco.');}return d;
    }finally{clearTimeout(timer);}
  }
  async refresh(){if(this.token&&Date.now()>this.expires-60000){try{const d=await this.call('/auth/v1/token?grant_type=refresh_token',{refresh_token:this.refreshToken},'');this.session(d);}catch(e){this.token='';this.refreshToken='';this.actor=null;throw e;}}}
  session(d){this.token=d.access_token;this.refreshToken=d.refresh_token;this.expires=Date.now()+(d.expires_in||3600)*1000;}
  async login(email,password){this.cached=null;const d=await this.call('/auth/v1/token?grant_type=password',{email,password},'');this.session(d);try{const s=await this.state();assert(['admin','cashier','kitchen'].includes(s.role),'Conta sem função autorizada.');this.actor={id:d.user.id,role:s.role};return s;}catch(e){await this.logout();throw e;}}
  async logout(){try{if(this.token)await this.call('/auth/v1/logout',{},this.token);}finally{this.token='';this.refreshToken='';this.expires=0;this.actor=null;this.cached=null;}}
  async state(){
    await this.refresh();let d=await this.call('/rest/v1/rpc/fda_v2_state',this.cached?{p_revision:this.cached.revision}:{});
    if(d.unchanged){assert(this.cached,'Cache ausente.');if(d.role===this.cached.role)return clone(this.cached);this.cached=null;d=await this.call('/rest/v1/rpc/fda_v2_state',{});}
    if(this.actor){if(['admin','cashier','kitchen'].includes(d.role))this.actor.role=d.role;else this.actor=null;}
    this.cached=clone(d);return d;
  }
  async loginPin(){throw Error('PINs online indisponíveis: dependem de autenticação e autorização no servidor homologadas.');}
  async evaluatorState(){throw Error('Painel online não homologado. Use a cópia local autorizada.');}
  async command(command){assert(!['pitch.settings','production.record'].includes(command?.type),'Novo comando ainda não homologado no servidor; nenhuma chamada foi enviada.');assert(['admin','cashier','kitchen'].includes(this.actor?.role),'Entre com uma conta autorizada pelo servidor.');await this.refresh();const d=await this.call('/rest/v1/rpc/fda_v2_command',{p_command:command});this.cached=clone(d);return d;}
  async export(){assert(this.actor?.role==='admin','Acesso administrativo necessário.');const state=await this.state();delete state.role;return {format:'FDA-BACKUP-2',createdAt:new Date().toISOString(),checksum:await sha(JSON.stringify(state)),state};}
}

// Neutralização de fórmulas de planilha, inclusive após espaços iniciais.
export function csv(rows){return '\ufeff'+rows.map(row=>row.map(v=>{let t=String(v??'');if(/^\s*[=+\-@\t\r]/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"';}).join(';')).join('\r\n');}
