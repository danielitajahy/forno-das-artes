"""Gera uma prévia HTML autônoma, fictícia e só em memória; não usa IndexedDB."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
def build():
    sources={name:(ROOT/'app'/name).read_text() for name in ('finance-results.js','core.js','seed.js','appearance.js','finance-ui.js')}
    sources['order-intent.js']='''let pending=null;export function readIntent(){return pending}export function saveIntent(_,p){pending=p}export function clearIntent(){pending=null}'''
    csv=(ROOT/'app/storage.js').read_text().split('// Neutralização de fórmulas')[1]
    csv='export function csv'+csv.split('export function csv',1)[1]
    sources['storage.js']='''import {initial,reduce,clone,uid} from './core.js';import {SEED} from './seed.js';
let memory=initial(SEED.menu);const fake={id:'OPERADORA_FICTICIA',role:'admin'};
function send(type,payload){memory=reduce(memory,{type,payload,expectedRevision:memory.revision,requestId:uid()},fake)}
send('pix.set',{key:'DEMONSTRACAO-NAO-PAGAR',recipient:'CENARIO FICTICIO',qr:''});
for(const p of SEED.menu)send('stock.adjust',{productId:p.id,mode:'slice',delta:8,reason:'ESTOQUE FICTICIO DE PREVIA'});
send('cash.open',{note:'CAIXA FICTICIO'});send('operation.resume',{});
send('contribution.add',{name:'BENEFICIARIO FICTICIO',amount:5000});
send('expense.add',{description:'DESPESA FICTICIA',amount:1500,paid:true});
send('debt.add',{personName:'PESSOA FICTICIA',reason:'EXEMPLO VISUAL',date:'2026-11-03',amount:3500});
send('recipe.save',{productId:'brasa',recipe:{diameterCm:35,slices:8,notes:'VALORES FICTICIOS DE DEMONSTRACAO',ingredients:[{name:'INSUMO FICTICIO - NAO E CUSTO REAL',quantityMilli:1000000,unit:'g',priceUnit:'kg',unitCostCents:2400}],packaging:{slice:50,whole:200}}});
send('order.create',{lines:[{productId:'brasa',mode:'slice',qty:2}],idempotencyKey:uid()});
const order=memory.orders.at(-1);send('order.pay',{id:order.id,verified:true});send('payment.fee.set',{orderId:order.id,amount:0,verified:true,reason:'TAXA ZERO EXPLICITAMENTE FICTICIA'});

export class LocalStore{
 mode='offline';actor={...fake};db={close(){}};channel={close(){}};
 async init(){return this}async state(){return clone(memory)}async configured(){return true}
 async login(){this.actor={...fake}}async logout(){this.actor=null}
 async setup(){throw Error('A prévia não cadastra usuários reais.')}async setFinanceAccess(){throw Error('Use somente o pacote de teste para configurar acesso; não coloque senhas reais aqui.')}
 async command(c){memory=reduce(memory,c,this.actor);return clone(memory)}
 async export(){throw Error('Prévia somente visual; não gera backup operacional.')}
 async restore(){throw Error('Restauração bloqueada na prévia.')}
}
export class OnlineStore{constructor(){throw Error('Prévia não conecta a Supabase, rede ou banco.')}}
export async function sha(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('')}
'''+csv
    ui=(ROOT/'app/ui.js').read_text()
    ui='\n'.join(line for line in ui.splitlines() if 'navigator.serviceWorker.register' not in line and "localStorage.getItem('fda-v2-public-config')" not in line)
    ui=ui.replace('MODO OFFLINE · PLANO B · um notebook central · celulares NÃO sincronizam','PRÉVIA FICTÍCIA · somente memória · não use dados reais')
    ui=ui.replace('Conferi o crédito Pix na conta','Simular pagamento fictício')
    ui+='''\nwindow.addEventListener('forno-preview-role',e=>{const roles=['admin','cashier','kitchen','finance'];if(!roles.includes(e.detail))return;store.actor={id:'OPERADOR_FICTICIO',role:e.detail};last=null;cart=[];state&&render();});'''
    sources['ui.js']=ui
    html=(ROOT/'index.html').read_text()
    html=re.sub(r'<script type="module" src="app/ui.js[^\"]*"></script>','',html)
    html=re.sub(r'<link rel="stylesheet" href="app/app.css[^\"]*">','<style>'+ (ROOT/'app/app.css').read_text().replace('\\','\\\\')+'</style>',html)
    html=re.sub(r'<link rel="manifest"[^>]+>','',html)
    banner='''<aside id="preview-notice" style="position:sticky;top:0;z-index:9999;background:#713a30;color:#fff6e8;padding:12px;text-align:center;font:700 16px system-ui">PRÉVIA FICTÍCIA · sem banco, sem Pix real e sem dados de estudantes. Não informe dados reais.<br><label>Conferir perfil <select id="preview-role"><option value="admin">Administração fictícia</option><option value="cashier">Caixa fictício</option><option value="kitchen">Cozinha fictícia</option><option value="finance">Financeiro fictício</option></select></label><a href="#sabores" style="color:#fff6e8;margin:8px">Cardápio</a><a href="#gestao" style="color:#fff6e8;margin:8px">Gestão</a></aside>'''
    html=html.replace('<body>','<body>'+banner)
    # Módulos Blob permitem abrir o arquivo localmente, sem servidor ou CDN.
    bootstrap='''const source=SOURCE,urls={};for(const name of ['finance-results.js','core.js','seed.js','appearance.js','order-intent.js','storage.js','finance-ui.js','ui.js']){const code=source[name].replace(/from ['"]\\.\\/([^'"]+)['"]/g,(_,dep)=>'from '+JSON.stringify(urls[dep]));urls[name]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));}await import(urls['ui.js']);document.getElementById('preview-role').addEventListener('change',e=>window.dispatchEvent(new CustomEvent('forno-preview-role',{detail:e.target.value})));'''.replace('SOURCE',json.dumps(sources,ensure_ascii=False).replace('</script','<\\/script'))
    html=html.replace('</body>','<script type="module">'+bootstrap+'</script></body>')
    (ROOT/'PREVIA_FINANCEIRA.html').write_text(html)
    return ROOT/'PREVIA_FINANCEIRA.html'
if __name__=='__main__':print(build())
