import {initial, reduce, validateState, assert, clone, uid} from './core.js';
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
export class LocalStore {
  mode='offline'; actor=null;
  async init(){
    const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>r.result.createObjectStore('data');this.db=await request(r);
    const tx=this.db.transaction('data','readwrite'), ended=done(tx), os=tx.objectStore('data');
    if(!await request(os.get('state')))os.put(initial(SEED.menu),'state');await ended;
    this.channel=typeof BroadcastChannel==='function'?new BroadcastChannel(DB_NAME):null;
    this.channel?.addEventListener('message',()=>this.onchange?.());return this;
  }
  async read(key){const tx=this.db.transaction('data');return request(tx.objectStore('data').get(key));}
  async state(){return clone(await this.read('state'));}
  async configured(){return !!await this.read('credentials');}
  async setup(name,password){
    assert(name.trim()&&name.length<=100&&password.length>=10,'Informe nome e senha local com pelo menos 10 caracteres.');
    const salt=uid(),hash=await passwordHash(password,salt);
    const tx=this.db.transaction('data','readwrite'),ended=done(tx),os=tx.objectStore('data');
    if(await request(os.get('credentials'))){tx.abort();await ended.catch(()=>{});throw Error('Já existe administrador local.');}
    os.put({name,salt,hash},'credentials');await ended;this.actor={id:name,role:'admin'};
  }
  async setFinanceAccess(name,password){
    assert(this.actor?.role==='admin','Somente a administração pode configurar a conta financeira.');
    assert(typeof name==='string'&&name.trim()&&name.length<=100&&typeof password==='string'&&password.length>=12,'Informe nome e senha individual de pelo menos 12 caracteres.');
    const salt=uid(),hash=await passwordHash(password,salt);
    const tx=this.db.transaction('data','readwrite'),ended=done(tx);
    tx.objectStore('data').put({name:name.trim(),salt,hash},'finance-credentials');
    await ended;this.channel?.postMessage('updated');
  }
  async login(name,password){
    const admin=await this.read('credentials'),finance=await this.read('finance-credentials');
    if(admin?.name===name&&admin.hash===await passwordHash(password,admin.salt)){this.actor={id:admin.name,role:'admin'};return;}
    if(finance?.name===name&&finance.hash===await passwordHash(password,finance.salt)){this.actor={id:finance.name,role:'finance'};return;}
    throw Error('Nome ou senha local incorretos.');
  }
  async logout(){this.actor=null;}
  async command(command){
    const tx=this.db.transaction('data','readwrite'),ended=done(tx),os=tx.objectStore('data');
    try{const s=reduce(await request(os.get('state')),command,this.actor);os.put(s,'state');await ended;this.channel?.postMessage('updated');return clone(s);}
    catch(e){try{tx.abort();}catch{}await ended.catch(()=>{});throw e;}
  }
  async export(){assert(this.actor?.role==='admin','Acesso administrativo necessário.');const state=await this.state(),data=JSON.stringify(state);return {format:'FDA-BACKUP-2',createdAt:new Date().toISOString(),checksum:await sha(data),state};}
  async restore(backup){
    assert(this.actor?.role==='admin','Acesso administrativo necessário.');
    assert(backup?.format==='FDA-BACKUP-2'&&backup.checksum===await sha(JSON.stringify(backup.state)),'Arquivo incompatível ou checksum divergente.');
    validateState(backup.state);
    const tx=this.db.transaction('data','readwrite'),ended=done(tx),os=tx.objectStore('data');
    const current=await request(os.get('state'));
    if(current.revision!==0||current.orders.length||current.audit.length){tx.abort();await ended.catch(()=>{});throw Error('Restauração permitida somente em instalação local vazia. Não substituímos registros existentes.');}
    const restored=clone(backup.state);restored.paused=true;os.put(restored,'state');await ended;this.channel?.postMessage('updated');return restored;
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
  async command(command){assert(this.actor,'Entre com uma conta autorizada.');await this.refresh();const d=await this.call('/rest/v1/rpc/fda_v2_command',{p_command:command});this.cached=clone(d);return d;}
  async export(){assert(this.actor?.role==='admin','Acesso administrativo necessário.');const state=await this.state();delete state.role;return {format:'FDA-BACKUP-2',createdAt:new Date().toISOString(),checksum:await sha(JSON.stringify(state)),state};}
}

// Neutralização de fórmulas de planilha, inclusive após espaços iniciais.
export function csv(rows){return '\ufeff'+rows.map(row=>row.map(v=>{let t=String(v??'');if(/^\s*[=+\-@\t\r]/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"';}).join(';')).join('\r\n');}
