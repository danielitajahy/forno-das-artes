// Servidor exclusivamente de testes fictícios. Não abre rede LAN nem banco operacional.
import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,randomUUID,pbkdf2,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {existsSync,mkdirSync,readFileSync,statSync} from 'node:fs';
import {dirname,resolve,extname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {initial,reduce,authorizeCommand,validateState,uid} from '../app/core.js';
import {project} from '../app/storage.js';
import {SEED} from '../app/seed.js';
import {evaluatorReport} from '../app/evaluators.js';
const pbkdf=promisify(pbkdf2),ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..'),APP='fda-central-pix-isolated-test-v1';
const digest=s=>createHash('sha256').update(s).digest('hex');
const hash=async(s,salt)=>(await pbkdf(s,salt,210000,32,'sha256')).toString('hex');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const passwordRoles=['admin','finance','cashier','presenter'];
export const DEMO_USERS=[
 ...Array.from({length:8},(_,i)=>({id:'seller-'+(i+1),name:'VENDEDOR FICTÍCIO '+(i+1),role:'seller',pin:String(8101+i),password:'',permissions:[]})),
 {id:'finance-test',name:'FINANCEIRO FICTÍCIO',role:'finance',pin:'8201',password:'FINANCEIRO-TESTE-2026',permissions:['order.pay','payment.issue','payment.issue.resolve']},
 {id:'cashier-test',name:'CAIXA FICTÍCIO',role:'cashier',pin:'8202',password:'CAIXA-TESTE-2026',permissions:null},
 {id:'admin-test',name:'ADMINISTRAÇÃO FICTÍCIA',role:'admin',pin:'8301',password:'ADMINISTRACAO-TESTE-2026',permissions:null},
 {id:'kitchen-test',name:'COZINHA FICTÍCIA',role:'kitchen',pin:'8401',password:'',permissions:null},
 {id:'presenter-test',name:'APRESENTADOR FICTÍCIO',role:'presenter',pin:'8501',password:'APRESENTADOR-TESTE-2026',permissions:[]}
];
function ensure(v,message,status=400){if(!v){const e=Error(message);e.status=status;throw e;}}
function audit(db,type,actor,subject=''){db.prepare('INSERT INTO access_events(id,event) VALUES(?,?)').run(randomUUID(),JSON.stringify({type,actor,subject,at:new Date().toISOString()}));}
async function openDemoDatabase(filename){
 ensure(filename!==':memory:','Escolha arquivo isolado de testes.');
 const path=resolve(filename);mkdirSync(dirname(path),{recursive:true,mode:0o700});
 if(existsSync(path)){
  const probe=new DatabaseSync(path,{readOnly:true});let valid=false;
  try{valid=probe.prepare('SELECT value FROM meta WHERE key=?').get('application')?.value===APP;}catch{}finally{probe.close();}
  ensure(valid,'Arquivo existente não pertence a este servidor fictício; não será alterado.');
 }
 const db=new DatabaseSync(path);db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 if(!db.prepare("SELECT name FROM sqlite_master WHERE name='meta'").get()){
  db.exec(`BEGIN IMMEDIATE;
   CREATE TABLE meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
   CREATE TABLE state(id INTEGER PRIMARY KEY CHECK(id=1),json TEXT NOT NULL);
   CREATE TABLE users(id TEXT PRIMARY KEY,name TEXT NOT NULL,role TEXT NOT NULL,pin_hash TEXT NOT NULL UNIQUE,pass_hash TEXT,pass_salt TEXT,permissions TEXT,enabled INTEGER NOT NULL,version TEXT NOT NULL);
   CREATE TABLE receipts(id TEXT PRIMARY KEY,actor TEXT NOT NULL,fingerprint TEXT NOT NULL);
   CREATE TABLE access_events(id TEXT PRIMARY KEY,event TEXT NOT NULL);
   CREATE TABLE attempts(scope TEXT PRIMARY KEY,failures INTEGER NOT NULL,locked_until INTEGER NOT NULL);
   COMMIT;`);
  const salt=randomBytes(32).toString('hex');db.prepare('INSERT INTO meta VALUES(?,?)').run('application',APP);db.prepare('INSERT INTO meta VALUES(?,?)').run('pin_salt',salt);
  let state=initial(SEED.menu);const admin={id:'admin-test',role:'admin'};
  const send=(type,payload={})=>state=reduce(state,{type,payload,requestId:uid(),expectedRevision:state.revision},admin);
  send('pix.set',{key:'CHAVE-FICTICIA-NAO-PAGAR',recipient:'BÁRBARA — DEMONSTRAÇÃO FICTÍCIA',qr:''});
  for(const p of SEED.menu){send('stock.adjust',{productId:p.id,mode:'slice',delta:80,reason:'ESTOQUE FICTÍCIO DE TESTES'});send('stock.adjust',{productId:p.id,mode:'whole',delta:10,reason:'ESTOQUE FICTÍCIO DE TESTES'});}
  send('cash.open',{note:'CAIXA FICTÍCIO'});send('operation.resume',{});
  // Não são lidos/importados arquivos privados, backups ou credenciais anteriores.
  for(const u of DEMO_USERS){const ps=u.password?randomBytes(32).toString('hex'):null;db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?)').run(u.id,u.name,u.role,await hash(u.pin,salt),u.password?await hash(u.password,ps):null,ps,JSON.stringify(u.permissions),1,randomUUID());}
  db.prepare('INSERT INTO state VALUES(1,?)').run(JSON.stringify(state));
 }
 ensure(db.prepare('SELECT json FROM state WHERE id=1').get(),'Inicialização incompleta; preserve o arquivo e solicite diagnóstico.');
 validateState(JSON.parse(db.prepare('SELECT json FROM state WHERE id=1').get().json));return db;
}
const identityMap=db=>Object.fromEntries(db.prepare('SELECT id,name FROM users').all().map(u=>[u.id,u.name]));
const actorOf=u=>({id:u.id,name:u.name,role:u.role,...(u.role==='finance'?{allowedCommands:JSON.parse(u.permissions)}:{})});
const json=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(data));};
async function body(req){ensure(req.headers['content-type']?.split(';')[0]==='application/json','Use JSON.',415);let text='';for await(const chunk of req){text+=chunk;ensure(Buffer.byteLength(text)<=65536,'Requisição acima do limite.',413);}try{return JSON.parse(text);}catch{throw Error('JSON inválido.');}}
export async function createPixTestServer({dbPath,demo=false}={}){
 ensure(demo===true,'Este servidor exige demo:true e aceita somente dados fictícios.');ensure(dbPath,'Informe arquivo SQLite isolado.');
 const db=await openDemoDatabase(dbPath),sessions=new Map();let closed=false;
 const read=()=>JSON.parse(db.prepare('SELECT json FROM state WHERE id=1').get().json);
 function session(req){const cookie=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('FDA_PIX_TEST='));const token=cookie?.slice(13);const key=token?digest(token):'';const s=sessions.get(key);if(!s)return null;
  const user=db.prepare('SELECT * FROM users WHERE id=?').get(s.userId);
  if(Date.now()>s.expires||!user?.enabled||user.version!==s.version){sessions.delete(key);return null;}return {...s,user,key};
 }
 function envelope(s){return {state:project(read(),s?actorOf(s.user):null,identityMap(db)),actor:s?actorOf(s.user):null,csrf:s?.csrf||null,testOnly:true};}
 const server=http.createServer(async(req,res)=>{
  try{
   const address=server.address(),hosts=['127.0.0.1:'+address.port,'localhost:'+address.port];ensure(hosts.includes(req.headers.host),'Host não autorizado.',403);
   const origin='http://'+req.headers.host,url=new URL(req.url,origin);
   if(url.pathname==='/_central_pix_health'){ensure(req.method==='GET','Método inválido.',405);return json(res,200,{application:APP,testOnly:true,sharedDatabase:true,network:'loopback-only',bankIntegration:false});}
   if(url.pathname.startsWith('/api/central-pix/')){
    const route=url.pathname.slice('/api/central-pix/'.length),s=session(req);
    if(req.method==='GET'){
     if(route==='state'||route==='session')return json(res,200,envelope(s));
     ensure(s,'Sessão ausente ou revogada.',401);
     if(route==='evaluators'){ensure(['admin','finance','presenter'].includes(s.user.role),'Consulta não autorizada.',403);return json(res,200,{...evaluatorReport(read()),demo:true});}
     throw Error('Rota desconhecida.');
    }
    ensure(req.method==='POST','Método inválido.',405);ensure(req.headers.origin===origin,'Origem não autorizada.',403);
    if(route!=='login'){ensure(s,'Sessão ausente ou revogada.',401);ensure(equal(req.headers['x-csrf-token'],s.csrf),'Conferência CSRF inválida.',403);}
    const data=await body(req);
    if(route==='login'){
     const scope=req.socket.remoteAddress||'loopback',attempt=db.prepare('SELECT * FROM attempts WHERE scope=?').get(scope);ensure(!attempt||Date.now()>=attempt.locked_until,'Tentativas excedidas. Aguarde cinco minutos.',429);
     const salt=db.prepare('SELECT value FROM meta WHERE key=?').get('pin_salt').value;
     const h=typeof data.pin==='string'&&/^[1-9][0-9]{3}$/.test(data.pin)?await hash(data.pin,salt):'';
     const u=db.prepare('SELECT * FROM users WHERE pin_hash=?').get(h);
     const valid=u?.enabled&&(!passwordRoles.includes(u.role)||typeof data.password==='string'&&data.password.length>=12&&data.password.length<=200&&equal(u.pass_hash,await hash(data.password,u.pass_salt)));
     if(!valid){const a=db.prepare('SELECT * FROM attempts WHERE scope=?').get(scope),failures=a?.locked_until&&Date.now()>=a.locked_until?1:(a?.failures||0)+1;db.prepare('INSERT OR REPLACE INTO attempts VALUES(?,?,?)').run(scope,failures,failures>=5?Date.now()+300000:0);audit(db,'login.denied','não autenticado');throw Object.assign(Error('PIN, senha adicional ou liberação inválidos.'),{status:401});}
     const current=db.prepare('SELECT * FROM users WHERE id=?').get(u.id);ensure(current?.enabled&&current.version===u.version,'Acesso revogado.',401);
     db.prepare('DELETE FROM attempts WHERE scope=?').run(scope);if(s)sessions.delete(s.key);
     const token=randomBytes(32).toString('hex'),ss={userId:u.id,version:u.version,csrf:randomBytes(32).toString('hex'),expires:Date.now()+8*3600000};sessions.set(digest(token),ss);audit(db,'login.ok',u.id);
     return json(res,200,envelope({...ss,user:current}),{'Set-Cookie':`FDA_PIX_TEST=${token}; HttpOnly; SameSite=Strict; Path=/api/central-pix/; Max-Age=28800`});
    }
    if(route==='logout'){sessions.delete(s.key);audit(db,'logout',s.user.id);return json(res,200,{ok:true},{'Set-Cookie':'FDA_PIX_TEST=; HttpOnly; SameSite=Strict; Path=/api/central-pix/; Max-Age=0'});}
    if(route==='users/block'){
     ensure(s.user.role==='admin','Somente administração.',403);ensure(typeof data.id==='string'&&typeof data.enabled==='boolean','Conta/situação inválida.');ensure(db.prepare('SELECT id FROM users WHERE id=?').get(data.id),'Conta inexistente.');db.prepare('UPDATE users SET enabled=?,version=? WHERE id=?').run(data.enabled?1:0,randomUUID(),data.id);audit(db,'user.status',s.user.id,data.id);return json(res,200,{ok:true});
    }
    if(route==='command'){
     const c=data.command,actor=actorOf(s.user);ensure(c&&typeof c.type==='string','Comando inválido.');authorizeCommand(actor,c.type);
     if(c.type==='order.pay')ensure(c.payload?.central===true,'Utilize a Central Pix com identificação do crédito e valor conferido.',422);
     const fingerprint=digest(JSON.stringify({type:c.type,payload:c.payload||{}}));
     db.exec('BEGIN IMMEDIATE');
     try{
      const receipt=db.prepare('SELECT * FROM receipts WHERE id=?').get(c.requestId);
      if(receipt){ensure(receipt.actor===actor.id&&receipt.fingerprint===fingerprint,'Identificador reutilizado por outra operação ou responsável.',409);db.exec('COMMIT');return json(res,200,envelope(s));}
      const old=read(),next=reduce(old,c,actor);validateState(next);
      db.prepare('UPDATE state SET json=? WHERE id=1').run(JSON.stringify(next));db.prepare('INSERT INTO receipts VALUES(?,?,?)').run(c.requestId,actor.id,fingerprint);db.exec('COMMIT');return json(res,200,envelope(s));
     }catch(e){db.exec('ROLLBACK');if(e.message.startsWith('Conflito de edição')){e.status=409;e.revision=read().revision;}throw e;}
    }
    throw Error('Rota desconhecida.');
   }
   ensure(req.method==='GET'||req.method==='HEAD','Método inválido.',405);
   const path=decodeURIComponent(url.pathname);ensure(!path.split('/').some(x=>x==='..'||x.startsWith('.'))&&!path.includes('\\'),'Arquivo indisponível.',404);
   if(path==='/'||path==='/index.html'){
    if(url.searchParams.get('central-pix')!=='teste'){res.writeHead(302,{Location:'/index.html?central-pix=teste'});return res.end();}
   }
   const allowed=['/','/index.html','/manifest.webmanifest','/sw.js','/PREVIA_CENTRAL_PIX.html'].includes(path)||/^\/app\/[^/]+\.(js|css)$/.test(path);
   ensure(allowed,'Arquivo indisponível.',404);const file=resolve(ROOT,path==='/'?'index.html':'.'+path);ensure(file.startsWith(ROOT+'/')&&existsSync(file)&&statSync(file).isFile(),'Arquivo inexistente.',404);
   const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webmanifest':'application/manifest+json'}[extname(file)];res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'});res.end(req.method==='HEAD'?undefined:readFileSync(file));
  }catch(e){if(!res.headersSent)json(res,e.status||(/[Pp]ermissão|autorização|não concedida|próprio pedido/.test(e.message)?403:422),{error:e.message,...(e.revision!==undefined?{revision:e.revision}:{})});else res.end();}
 });
 return {server,close:async()=>{if(closed)return;closed=true;await new Promise(ok=>server.close(ok));db.close();}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  ensure(process.versions.node.split('.')[0]>=24,'Node.js 24 ou superior necessário.');ensure(process.argv.includes('--demo'),'Use --demo: somente testes fictícios estão disponíveis.');
  const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1]},port=Number(arg('--port')||8874);ensure(Number.isInteger(port)&&port>=1024&&port<=65535,'Porta inválida.');
  const app=await createPixTestServer({dbPath:arg('--db')||resolve(ROOT,'.central-pix-testes/conferencia.sqlite'),demo:true});
  app.server.on('error',e=>{console.error('Não iniciado; preserve o arquivo de testes e a operação anterior:',e.message);process.exitCode=1;});
  app.server.listen(port,'127.0.0.1',()=>console.log(`CENTRAL PIX FICTÍCIA — http://127.0.0.1:${port}/index.html?central-pix=teste#acesso\nBanco compartilhado apenas em loopback; sem homologação em celulares físicos, sem integração bancária.`));
  for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>app.close().then(()=>process.exit()));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
