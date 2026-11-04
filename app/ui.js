import {financialPanel,ingredientRow,recipeDraft,updateRecipePreview,resultsCsvRows} from './finance-ui.js';
import {styleManagement, styleOperations, styleAccess, styleWait} from './appearance.js';
import {uid, clone, availability, priceOf, totals, assert} from './core.js';
import {readIntent,saveIntent,clearIntent} from './order-intent.js';
import {LocalStore, OnlineStore, csv, sha} from './storage.js';
import {SEED} from './seed.js';
const $=id=>document.getElementById(id), esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((n||0)/100);
const date=d=>d?new Date(d).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'—';
const amount=v=>{const t=String(v).trim().replace(',','.');assert(/^\d+(\.\d{1,2})?$/.test(t),'Valor inválido; use até duas casas decimais.');return Math.round(Number(t)*100);};
const decimal=n=>(n/100).toFixed(2);
const purchaseDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const qtyMilli=v=>{const t=String(v).trim().replace(',','.');assert(/^\d+(\.\d{1,3})?$/.test(t),'Quantidade inválida; use até três casas decimais.');const n=Math.round(Number(t)*1000);assert(n>0&&n<=10000000,'Quantidade fora do limite.');return n;};
const qtyStr=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3}).format(n/1000);
const pixFor=name=>(state.people||[]).find(p=>p.name.trim().toLocaleLowerCase('pt-BR')===String(name||'').trim().toLocaleLowerCase('pt-BR'))?.pixKey||'';
const maskedPix=key=>key?((key.length<=8)?'••••':(key.slice(0,2)+'••••'+key.slice(-3))):'Não cadastrada';
const outstanding=d=>d.amount-(d.receipts||[]).reduce((n,r)=>n+r.amount,0);
const expenseStatus=e=>e.payerSource==='person'?(e.reimbursedAt?'REEMBOLSADO · OK':'REEMBOLSO PENDENTE'):!e.paid?'PAGAMENTO PENDENTE':e.payerSource==='cash'?'PAGO PELO CAIXA':'PAGO · origem não informada (registro antigo)';
function pendingRows(){
 const expenses=state.expenses.filter(e=>e.payerSource==='person').map(e=>({kind:'Reembolso de compra',description:e.product||e.description,person:e.payerName,
   original:e.amount,due:e.reimbursedAt?0:e.amount,paid:!!e.reimbursedAt,when:e.purchaseDate||e.createdAt.slice(0,10),ref:e.id}));
 const contributions=state.contributions.map(c=>{const back=state.returns.filter(r=>r.contributionId===c.id).reduce((n,r)=>n+r.amount,0);
   return {kind:'Devolução de aporte',description:'Aporte inicial',person:c.name,original:c.amount,due:c.amount-back,paid:back===c.amount,when:c.createdAt.slice(0,10),ref:c.id};});
 return [...expenses,...contributions];
}
function pendingTable(){
 const rows=pendingRows(),due=rows.reduce((n,x)=>n+x.due,0);
 const byPerson=new Map();for(const r of rows){if(!r.due)continue;const name=r.person.trim(),key=name.toLocaleLowerCase('pt-BR');const item=byPerson.get(key)||{name,amount:0};item.amount+=r.due;byPerson.set(key,item);}
 return `<p><strong>Obrigações ainda a devolver: ${money(due)}</strong> · Aportes e compras adiantadas são categorias diferentes. Valores pagos por terceiros já são despesas, não novos aportes.</p>
 <p><strong>Total a devolver por pessoa:</strong> ${[...byPerson.values()].map(x=>`${esc(x.name)} — ${money(x.amount)}`).join(' · ')||'Nenhuma pendência'}</p>
 <div class="scroll"><table class="pending-table"><thead><tr><th>Data</th><th>Tipo</th><th>Motivo/produto</th><th>Devolver para</th><th>Pix de devolução</th><th>Valor original</th><th>Falta devolver</th><th>Situação</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.when)}</td><td>${esc(x.kind)}</td><td>${esc(x.description)}</td><td>${esc(x.person)}</td><td>${esc(maskedPix(pixFor(x.person)))}</td><td>${money(x.original)}</td><td>${money(x.due)}</td><td>${x.paid?'OK · devolvido':'PENDENTE'}</td></tr>`).join('')||'<tr><td colspan="7">Nenhuma obrigação cadastrada.</td></tr>'}</tbody></table></div>
 <h3>A receber de devedores (não descontar de reembolsos)</h3>
 <p><strong>Saldo a cobrar: ${money(totals(state).debtsDue)}</strong></p>
 <div class="scroll"><table><thead><tr><th>Devedor</th><th>Motivo</th><th>Valor original</th><th>Falta receber</th><th>Situação</th></tr></thead><tbody>${(state.debts||[]).map(d=>`<tr><td>${esc(d.personName)}</td><td>${esc(d.reason)}</td><td>${money(d.amount)}</td><td>${money(outstanding(d))}</td><td>${outstanding(d)===0?'OK':'PENDENTE'}</td></tr>`).join('')||'<tr><td colspan="5">Nenhuma dívida a receber registrada.</td></tr>'}</tbody></table></div>`;
}

const label=m=>m==='slice'?'Fatia':'Inteira/congelada';
const operationalLine=l=>`${({brasa:'C',batuque:'F',cerrado:'A',banana:'B'})[l.productId]||l.productId}-${l.mode==='slice'?'FAT':'INT'} ${l.qty} · ${l.name} (${label(l.mode)})`;
const status=s=>({aguardando:'Aguardando pagamento',preparando:'Preparando',pronto:'Pronto',entregue:'Entregue',cancelado:'Cancelado'}[s]||s);
const button=(action,title,data='',cls='s')=>`<button type="button" class="btn ${cls}" data-action="${action}" ${data}>${esc(title)}</button>`;
const eyeVisible=`<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const eyeHidden=`<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m3 3 18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17.3 17.3 0 0 1-3 3.8"/><path d="M6.6 6.6C3.7 8.5 2 12 2 12s3.6 7 10 7a10.7 10.7 0 0 0 4.1-.8"/></svg>`;
const input=(name,title,value='',type='text',extra='')=>{
  const field=`<input name="${name}" type="${type}" value="${esc(value)}" ${extra}>`;
  if(type!=='password')return `<label>${esc(title)}${field}</label>`;
  return `<label class="password-label">${esc(title)}<span class="password-entry">${field}<button type="button" class="password-toggle" data-action="toggle-password" aria-label="Mostrar senha" aria-pressed="false" title="Mostrar senha">${eyeVisible}<span class="password-toggle-text">Mostrar</span></button></span></label>`;
};
const check=(name,title,checked=false)=>`<label><input type="checkbox" name="${name}" ${checked?'checked':''}>${esc(title)}</label>`;
const submit=(title)=>`<button class="btn p" type="submit">${esc(title)}</button>`;
let store, state, cart=[], last=null, editId=null, busy=false, retryCommand=null, localConfigured=false;
let incoming=null, dirty=false, onlineConfig=null;
let financialProductId=null;
let orderIntent=null;
try{orderIntent=readIntent(sessionStorage);}catch(e){queueMicrotask(()=>feedback(e.message,true));}
try{onlineConfig=JSON.parse(localStorage.getItem('fda-v2-public-config')||'null');}catch{}
function feedback(message,error=false){$('feedback').hidden=false;$('feedback').classList.toggle('error',error);$('feedback').textContent=message;if(error){$('feedback').setAttribute('tabindex','-1');$('feedback').focus({preventScroll:true});$('feedback').scrollIntoView({block:'center'});}}
const admin=()=>store?.actor?.role==='admin';
const finance=()=>store?.actor?.role==='finance';
const staff=()=>!!store?.actor;
const cash=()=>['admin','cashier'].includes(store?.actor?.role);
const kitchen=()=>['admin','kitchen'].includes(store?.actor?.role);
function route(){const h=(location.hash||'#inicio').slice(1),view=h==='tv'?'fila':h;document.body.classList.toggle('tv',h==='tv');document.querySelectorAll('.view').forEach(e=>e.classList.toggle('on',e.id==='v-'+view));document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.hash==='#'+view));document.querySelector('.fab').hidden=['sabores','pedido','fila','contingencia','gestao','caixa','acesso','tv'].includes(h);}
function available(id,m){
  if(state.role==='public')return state.stock?.[id+':'+m]?.available??0;
  return availability(state,id,m);
}
function nutr(p){
  if(!p.nut)return '<p class="ing">Informação nutricional não fornecida para este sabor.</p>';
  const n=p.nut, rows=[['Valor energético',n[0]+' kcal',n[0]/2000],['Carboidratos',n[1]+' g',n[1]/300],['Proteínas',n[2]+' g',n[2]/75],['Gorduras totais',n[3]+' g',n[3]/55],['Gorduras saturadas',n[4]+' g',n[4]/22],['Fibra alimentar',n[5]+' g',n[5]/25],['Sódio',n[6]+' mg',n[6]/2000]];
  return `<table class="nut"><caption>Informação nutricional (estimada)<br>Porção: 1 fatia (cerca de ${esc(n[7])} g)</caption><thead><tr><th>Nutriente</th><th>Quantidade</th><th>%VD*</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td>${esc(r[1])}</td><td>${Math.round(r[2]*100)}%</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="3">*Dieta de 2.000 kcal. Contém trigo (glúten) e leite. Valores estimados da ficha fornecida; conferir ingredientes e alergênicos ao alterar a receita.</td></tr></tfoot></table>`;
}
function renderMenu(){
  $('lista-sabores').innerHTML=state.menu.filter(p=>p.active&&!p.archived).sort((a,b)=>a.position-b.position).map(p=>`<article class="card">${p.image?`<img class="ph" src="${esc(p.image)}" alt="${esc(p.artistic)}">`:''}<span class="tag">${esc(p.name)}</span><h3>${esc(p.artistic)}</h3><p>${esc(p.description)}</p><p class="ing menu-ingredients">${esc(p.ingredients)}</p>${nutr(p)}${['slice','whole'].filter(m=>p.modes[m]).map(m=>{
    const n=available(p.id,m),q=cart.find(l=>l.productId===p.id&&l.mode===m)?.qty||0;
    return `<div><strong>${label(m)} · ${money(priceOf(state,p,m))}</strong><p>${n===1?'1 disponível':`${n} disponíveis`}${n<5?' · estoque baixo':''}</p><div class="qty">${button('cart-minus','−',`data-id="${esc(p.id)}" data-mode="${m}"`)}<strong>${q}</strong><button class="btn p" data-action="cart-plus" data-id="${esc(p.id)}" data-mode="${m}" ${n<=q?'disabled':''}>+</button></div>${n===0&&m==='whole'?`<p>Este sabor está temporariamente esgotado. Quer receber um aviso quando tivermos novas pizzas disponíveis?</p>${button('wait-open','Avise-me quando estiver disponível',`data-id="${esc(p.id)}"`)}`:''}</div>`;
  }).join('')}</article>`).join('')||'<p>Cardápio ainda não configurado. Solicite atendimento à equipe.</p>';
  const total=cart.reduce((n,l)=>{const p=state.menu.find(p=>p.id===l.productId);return n+(p?priceOf(state,p,l.mode)*l.qty:0);},0);
  $('cart-s').innerHTML=`<span>${cart.reduce((n,l)=>n+l.qty,0)} item(ns) · ${money(total)}</span><a class="btn p" href="#pedido">Ver pedido</a>`;
  $('nucleos').innerHTML=SEED.nuclei.map(n=>`<article class="card"><h3>${esc(n[0])}</h3><p>${esc(n[1])}</p></article>`).join('');
  document.querySelectorAll('[data-preco-fatia]').forEach(e=>e.textContent=money(state.prices.slice));document.querySelectorAll('[data-preco-congelada]').forEach(e=>e.textContent=money(state.prices.whole));
}
function pix(o){return `<div class="msg"><h3>Pagamento somente por Pix</h3><p>Total exato: <strong class="order-total">${money(o.total)}</strong></p><p>Chave Pix: <strong>${esc(state.pix?.key||'Não cadastrada — procure a equipe.')}</strong></p><p>Recebedor: ${esc(state.pix?.recipient||'Conferir com a equipe')}</p>${state.pix?.qr?`<img class="qr" src="${esc(state.pix.qr)}" alt="QR Pix fornecido pela administradora">`:''}<p>Confira recebedor e valor no aplicativo do banco. Se o QR configurado não trouxer valor, digite o total exato acima. O caixa deve conferir o crédito na conta; print de comprovante não confirma pagamento. Não pague duas vezes.</p></div>`;}
function renderPedido(){
  if(last){const current=(state.orders||[]).find(o=>o.id===last.id)||last;$('v-pedido').innerHTML=`<h2>Pedido</h2><div class="senha">${esc(current.id)}</div><p>${status(current.status)}</p><p>${current.lines.map(l=>esc(operationalLine(l))).join(' · ')}</p>${pix(current)}${button('new-order','Novo pedido')}`;return;}
  $('v-pedido').innerHTML=`<h2>Seu pedido</h2>${cart.length?cart.map(l=>{const p=state.menu.find(x=>x.id===l.productId);return `<p>${l.qty} × ${esc(p?.artistic||l.productId)} · ${label(l.mode)} · ${money(p?priceOf(state,p,l.mode)*l.qty:0)}</p>`;}).join(''):'<p>Carrinho vazio.</p>'}<p>Pagamento exclusivamente por Pix. O valor final é confirmado ao registrar o pedido.</p>${cash()&&!state.pix?.key?'<p class="msg" role="alert">Antes de registrar o pedido, a administração precisa cadastrar a chave Pix em Gestão → Preços gerais e configuração Pix. Nenhum pedido foi gravado.</p>':''}${cart.length?(cash()?button('create-order','Registrar pedido aguardando Pix','','p'):'<p class="msg">Leve esta composição ao caixa. Novos pedidos são registrados pela equipe autorizada; ainda não há pedidos públicos online habilitados.</p>'):''}<a href="#sabores" class="btn s">Voltar ao cardápio</a>`;
}
function renderFila(){
  const orders=state.orders||[];
  $('v-fila').innerHTML=`<h2>Fila de retirada</h2><div class="fila">${['preparando','pronto'].map(st=>`<div><h3>${status(st).toUpperCase()}</h3><div class="chips">${orders.filter(o=>o.status===st).map(o=>`<span class="chip ${st==='pronto'?'pronto':''}">${esc(o.id)}</span>`).join('')||'—'}</div></div>`).join('')}</div><p class="ing">O painel público mostra apenas senhas e situação. ${store.mode==='offline'?'TV: abra #tv no mesmo navegador e origem do notebook.':'Atualização a cada 15 segundos enquanto a aba estiver visível.'}</p>`;
}
function renderCaixa(){
  if(finance()){$('v-caixa').innerHTML='<h2>Caixa e cozinha</h2><p>O perfil Financeiro não opera vendas ou preparação.</p>';return;}
  if(!staff()){$('v-caixa').innerHTML='<h2>Caixa e cozinha</h2><p>Entre em Acesso para operar.</p>';return;}
  const session=(state.cashSessions||[]).find(c=>!c.closedAt);
  $('v-caixa').innerHTML=`<h2>Caixa e cozinha</h2><p>${session?'Caixa aberto por '+esc(session.openedBy)+' em '+date(session.openedAt):'Caixa fechado'}</p>${cash()?`<div class="actions">${!session?button('cash-open','Abrir caixa'):button('cash-close','Conferir e fechar caixa',`data-id="${esc(session.id)}"`)}<a class="btn p" href="#sabores">Registrar venda</a></div>`:''}<p>Confirme pagamento somente após ver o crédito na conta. Produtos aguardando pagamento estão reservados e não entram na cozinha.</p>${(state.orders||[]).filter(o=>!['entregue','cancelado'].includes(o.status)).map(o=>`<article class="card"><h3>${esc(o.id)} · ${status(o.status)}</h3><p>${(o.lines||[]).map(l=>esc(operationalLine(l))).join(' · ')}</p>${cash()?`<strong>${money(o.total)}</strong>`:''}${o.status==='aguardando'&&cash()?pix(o):`<p>Pagamento conferido · ${date(o.paidAt)}</p>`}<div class="actions">${cash()&&o.status==='aguardando'?button('pay','Conferi o crédito Pix na conta',`data-id="${esc(o.id)}"`,'p'):''}${kitchen()&&o.status==='preparando'?button('status','Marcar pronto',`data-id="${esc(o.id)}" data-status="pronto"`,'p'):''}${kitchen()&&o.status==='pronto'?button('status','Marcar entregue',`data-id="${esc(o.id)}" data-status="entregue"`):''}${cash()?button('cancel','Cancelar e documentar',`data-id="${esc(o.id)}"`):''}</div></article>`).join('')||'<p>Nenhum pedido em andamento.</p>'}<details><summary>Histórico e devoluções Pix</summary>${(state.orders||[]).map(o=>`<div class="row"><span>${esc(o.id)} · ${status(o.status)} · ${cash()?money(o.total):''} · ${date(o.createdAt)}</span>${cash()&&o.status==='entregue'?button('cancel','Documentar cancelamento após entrega',`data-id="${esc(o.id)}"`):''}${cash()&&o.status==='cancelado'&&o.paidAt?button('refund','Registrar Pix devolvido',`data-id="${esc(o.id)}"`):''}</div>`).join('')}</details>`;
  styleOperations();
}
function menuForm(){
  const p=state.menu.find(p=>p.id===editId)||{id:uid(),name:'',artistic:'',description:'',ingredients:'',image:'',nut:null,modes:{slice:true,whole:true},price:{slice:null,whole:null},cost:{slice:0,whole:0},active:true,archived:false,position:state.menu.length};
  return `<form id="product-form" data-product-id="${esc(p.id)}"><h3>${editId?'Editar sabor':'Adicionar sabor'}</h3>${input('name','Nome (ex.: Calabresa)',p.name,'text','required maxlength="120"')}${input('artistic','Nome artístico',p.artistic,'text','required maxlength="120"')}<label>Descrição<textarea name="description" maxlength="3000">${esc(p.description)}</textarea></label><label>Ingredientes<textarea name="ingredients" maxlength="3000">${esc(p.ingredients)}</textarea></label>${p.image?`<img src="${esc(p.image)}" alt="Imagem atual" style="max-width:160px">`:''}<label>Adicionar/substituir imagem (PNG, JPEG ou WebP; até 500 KB)<input type="file" name="image" accept="image/png,image/jpeg,image/webp"></label>${check('removeImage','Remover imagem')}${check('slice','Vender em fatias',p.modes.slice)}${check('whole','Vender inteira/congelada',p.modes.whole)}${['slice','whole'].map(m=>input('price-'+m,'Preço individual '+label(m)+' (vazio = preço geral)',p.price[m]===null?'':decimal(p.price[m]),'number','min="0.01" step="0.01"')+input('cost-'+m,'Custo de produção '+label(m),decimal(p.cost[m]),'number','min="0" step="0.01" required')).join('')}${input('position','Ordem de exibição',p.position,'number','min="0" max="10000" required')}${check('active','Ativo no cardápio',p.active)}${check('archived','Arquivado (preserva histórico)',p.archived)}<label>Nutrição fornecida: kcal; carboidratos g; proteínas g; gorduras totais g; saturadas g; fibras g; sódio mg; porção g. Vazio = não fornecida.<textarea name="nut" placeholder="Não invente valores">${p.nut?p.nut.join('; '):''}</textarea></label><p class="ing">A ficha preservada é por fatia. Para nova receita, confira também os alergênicos. Nenhuma edição altera itens de pedidos anteriores.</p>${submit('Salvar sabor')}${button('product-new','Limpar formulário / novo sabor')}</form>`;
}
function charts(){
  const paid=state.orders.filter(o=>o.paidAt&&o.status!=='cancelado'),hour={};
  const flavors=state.menu.map(p=>[p.artistic,paid.reduce((n,o)=>n+o.lines.filter(l=>l.productId===p.id).reduce((x,l)=>x+l.qty,0),0)]);
  const expense=state.expenses.map(x=>[x.description,x.amount]);
  const t=totals(state);
  paid.forEach(o=>{const h=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit'}).format(new Date(o.paidAt));hour[h]=(hour[h]||0)+o.lines.reduce((n,l)=>n+l.qty,0);});
  const bar=(title,rows,financial=false)=>{const max=Math.max(1,...rows.map(r=>r[1]));return `<div class="card"><h3>${title}</h3>${rows.length?rows.map(([k,v])=>`<div><span>${esc(k)} · ${financial?money(v):v}</span><div class="pbar" role="img" aria-label="${esc(k)}: ${financial?money(v):v}"><i style="width:${Math.min(100,Math.max(0,v/max*100))}%"></i></div></div>`).join(''):'<p>Sem dados.</p>'}</div>`;};
  return `<details><summary>Gráficos e vendas por sabor</summary><div class="grid">${bar('Unidades por sabor (modalidades somadas)',flavors)}${bar('Despesas por item',expense,true)}${bar('Receita, gastos e aportes',[['Recebimentos menos devoluções (legado)',t.net],['Gastos totais',t.expensesAll],['Aportes',t.contributions]],true)}${bar('Unidades confirmadas por hora',Object.entries(hour))}</div><p class="ing">Gráficos locais sem biblioteca externa. Cancelamentos não contam como vendas válidas. Itens e valores originais continuam no histórico e CSV.</p></details>`;
}

function renderFinanceiroIsabela(){
  // Mesmo IndexedDB, mesma origem e mesmos comandos já existentes; sem migração de dados.
  // O perfil financeiro não recebe edição de preços, estoque, vendedores ou gestão administrativa.
  const t=totals(state);
  $('v-gestao').innerHTML=`<h2>Financeiro · Isabela</h2>${financialPanel(state,store.mode,financialProductId)}
   <p class="msg"><strong>Responsabilidades:</strong> Isabela registra aportes, despesas, beneficiários e chaves Pix; comunica a Bárbara Cristina quem deve receber. Bárbara Cristina faz a transferência no banco. Somente depois da confirmação Isabela registra a devolução realizada. O site não transfere dinheiro.</p>
   <p class="msg"><strong>Plano B offline:</strong> este acesso funciona somente no notebook e na origem onde está o banco anterior. Celulares de outros aparelhos ainda NÃO compartilham os dados. Não tente importar ou mesclar bancos.</p>
   <div class="grid"><div class="card"><span class="tag">Aportes a devolver</span><div class="kpi">${money(t.contributionsDue)}</div></div><div class="card"><span class="tag">Reembolsos pendentes</span><div class="kpi">${money(t.reimbursementDue)}</div></div><div class="card"><span class="tag">Despesas registradas</span><div class="kpi">${money(t.expensesAll)}</div></div></div>
   <details open><summary>1 · Registrar despesa ou compra</summary>
   <form id="expense-form"><p>Registrar gastos não significa que o dinheiro já saiu do banco.</p>
    ${input('purchaseDate','Data da compra',purchaseDate(),'date','required')}
    ${input('product','Produto ou serviço','','text','required maxlength="140"')}
    ${input('unitPrice','Preço por unidade/kg/litro (R$)','','number','required min="0.01" step="0.01"')}
    <label>Unidade<select name="unit"><option value="kg">kg</option><option value="un">Unidade</option><option value="L">Litro</option></select></label>
    ${input('qty','Quantidade','','number','required min="0.001" step="0.001"')}
    <div class="expense-total" role="status" aria-live="polite">Total calculado: <strong id="expense-total-preview">R$ 0,00</strong></div>
    <label>Quem pagou<select name="payerSource"><option value="cash">Caixa do projeto</option><option value="person">Pessoa — reembolso pendente</option><option value="pending">Ainda não pago</option></select></label>
    ${input('payerName','Nome da pessoa que pagou','','text','maxlength="140"')}
    ${input('destination','Finalidade do gasto','','text','maxlength="400"')}
    ${submit('Salvar despesa')}
   </form></details>
   <details open><summary>2 · Aportes dos alunos</summary>
     <form id="contribution-form">${input('name','Nome do aluno','','text','required maxlength="140"')}${input('amount','Valor contribuído (R$)','','number','required min="0.01" step="0.01"')}${submit('Registrar aporte')}</form>
     ${state.contributions.map(c=>{const returned=state.returns.filter(r=>r.contributionId===c.id).reduce((n,r)=>n+r.amount,0);return `<div class="row"><span>${esc(c.name)} · aporte ${money(c.amount)} · devolvido ${money(returned)} · restante ${money(c.amount-returned)}</span>${returned<c.amount?button('return','Registrar Pix já realizado',`data-id="${esc(c.id)}"`):'<strong>Concluído</strong>'}</div>`;}).join('')||'<p>Ainda não há aportes cadastrados.</p>'}
   </details>
   <details open><summary>3 · Beneficiários e chaves Pix</summary>
     <p class="msg">Confira nome e chave com o beneficiário antes de informar à Bárbara Cristina. As chaves são dados pessoais e devem ficar restritas a este acesso e à administração.</p>
     <form id="person-form"><input type="hidden" name="personId" value="">${input('name','Nome do beneficiário','','text','maxlength="140" required')}${input('pixKey','Chave Pix (opcional até conferir)','','text','maxlength="140" autocomplete="off"')}${submit('Salvar beneficiário')}</form>
     <div class="scroll"><table><thead><tr><th>Beneficiário</th><th>Chave mascarada</th><th>Ação</th></tr></thead><tbody>${(state.people||[]).map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(maskedPix(p.pixKey))}</td><td>${button('person-edit','Editar',`data-id="${esc(p.id)}"`)}${p.pixKey?button('person-copy-pix','Copiar Pix',`data-id="${esc(p.id)}"`):''}</td></tr>`).join('')}</tbody></table></div>
   </details>
   <details open><summary>4 · Pendências e devoluções</summary><p>Informe Bárbara Cristina separadamente. A lista abaixo só distingue valores pendentes e efetivamente pagos; ainda não existe status persistente “Informado à Bárbara”.</p>${pendingTable()}</details>
   <details><summary>5 · Compras já cadastradas</summary>${state.expenses.slice().reverse().map(e=>`<div class="row"><span>${esc(e.product||e.description)} · ${money(e.amount)} · ${esc(expenseStatus(e))}</span>${e.payerSource==='person'&&e.paid&&!e.reimbursedAt?button('expense-reimburse','Confirmar Pix já realizado',`data-id="${esc(e.id)}"`):''}</div>`).join('')||'<p>Nenhuma despesa cadastrada.</p>'}</details>`;
  updateExpenseTotal();updateRecipePreview();
}

function renderGestao(){
  if(finance()){renderFinanceiroIsabela();return;}
  if(!admin()){$('v-gestao').innerHTML='<h2>Central de Gestão</h2><p>Acesso reservado à administradora. Entre em Acesso.</p>';return;}
  const t=totals(state);
  $('v-gestao').innerHTML=`<h2>Central de Gestão</h2>${financialPanel(state,store.mode,financialProductId)}<p>Revisão ${state.revision} · ${state.paused?'VENDAS PAUSADAS':'Este modo está autorizado a registrar novas vendas'}</p><div class="actions">${button(state.paused?'resume':'pause',state.paused?'Ativar vendas neste modo':'Pausar novas vendas')}${button('refresh','Atualizar dados')}</div><div class="grid">${[['Recebimentos Pix',t.receipts],['Pix devolvido',t.refunded],['Devoluções pendentes',t.refundDue],['Recebimentos menos devoluções (legado)',t.net],['Gastos pagos',t.expensesPaid],['Gastos previstos + pagos',t.expensesAll],['Resultado projetado (critério legado)',t.result],['Aportes a devolver',t.contributionsDue],['Reembolsos de compras pendentes',t.reimbursementDue],['Devedores — a receber (controle)',t.debtsDue],['Obrigações com pessoas',t.contributionsDue+t.reimbursementDue],['Saldo antes de taxas separadas (legado)',t.balance],['Projeção anterior de doação (antes de taxas separadas)',t.donation]].map(([k,v])=>`<div class="card ${k.startsWith('Devedores —')?'debt-kpi':''}"><span class="tag">${k}</span><div class="kpi">${money(v)}</div></div>`).join('')}</div><p class="ing">Indicadores legados preservados para conferência: não deduzem taxas separadas. Use o Painel de Resultados acima para a apuração atual. Resultado legado = recebimentos menos devoluções − despesas previstas e pagas; não é saldo bancário. Doação só após conciliação, devoluções e obrigações. Saldos não substituem conferência do banco.</p>
  ${charts()}<details><summary>Gerenciamento de Cardápio</summary>${state.menu.length===0?button('seed-menu','Cadastrar os quatro sabores originais (somente dados públicos)'):''}<div class="actions">${state.menu.map(p=>button('product-edit',(p.archived?'[Arquivado] ':!p.active?'[Inativo] ':'')+p.artistic,`data-id="${esc(p.id)}"`)+button('product-delete','Excluir sem histórico',`data-id="${esc(p.id)}"`)).join('')}</div>${menuForm()}</details>
  <details><summary>Preços gerais e configuração Pix</summary><form id="prices-form">${input('slice','Fatia — preço geral',decimal(state.prices.slice),'number','min="0.01" step="0.01" required')}${input('whole','Inteira/congelada — preço geral',decimal(state.prices.whole),'number','min="0.01" step="0.01" required')}${submit('Salvar preços para novas vendas')}</form><form id="pix-form">${input('key','Chave Pix real da administradora (não cadastrada nesta entrega)',state.pix.key,'text','maxlength="140" required')}${input('recipient','Nome do recebedor',state.pix.recipient,'text','maxlength="140" required')}<label>QR Pix fornecido pelo banco (opcional; não geramos QR fictício)<input name="qr" type="file" accept="image/png,image/jpeg,image/webp"></label>${check('removeQr','Remover QR cadastrado')}${submit('Salvar configuração Pix')}</form></details>
  <details><summary>Estoque de fatias e pizzas inteiras/congeladas</summary><p>Disponível = físico − reservado, limitado ao saldo adicional de venda configurado. Cada modalidade tem estoque separado. Ajustes não podem comprometer reservas.</p><div class="grid">${state.menu.filter(p=>!p.archived).map(p=>['slice','whole'].map(m=>{const x=state.stock[p.id+':'+m]||{onHand:0,reserved:0,sold:0,limit:null};return `<form class="card stock-form" data-id="${esc(p.id)}" data-mode="${m}"><h3>${esc(p.artistic)} · ${label(m)}</h3><p>Físico: ${x.onHand} · Reservado: ${x.reserved} · Vendido líquido de retornos: ${x.sold}</p><strong>${available(p.id,m)} disponível(is) ${available(p.id,m)<5?'· ALERTA DE ESTOQUE':''}</strong>${input('delta','Entrada (+) / perda ou ajuste (−)',0,'number','step="1" required')}${input('limit','Limite adicional restante de venda (vazio = estoque livre)',x.limit??'','number','min="0" step="1"')}${input('reason','Motivo obrigatório','','text','required maxlength="500"')}${submit('Registrar movimento')}</form>`;}).join('')).join('')}</div></details>
  <details><summary>Lista de espera e avisos de reposição</summary><p>WhatsApp manual e gratuito. Abrir a conversa não envia mensagem. Marque como avisado somente depois de enviar. Cadastro não reserva unidade. Em falta de internet, comunique depois.</p>${waitForm()}${state.menu.map(p=>{const list=state.waitlist.filter(w=>w.productId===p.id&&!w.cancelledAt);if(!list.length)return '';return `<h3>${esc(p.artistic)} · ${list.length} interessado(s)</h3>${available(p.id,'whole')>0?'<p class="wait-warning">Reposição disponível: confira os contatos pendentes abaixo.</p>':''}${list.map(w=>{const epoch=state.stock[p.id+':whole']?.epoch||0,notified=w.notifiedEpoch===epoch;return `<div class="row"><span>${esc(w.contact)} · ${date(w.createdAt)} · ${notified?'Avisado nesta reposição':'Aguardando aviso'}</span><div class="actions">${available(p.id,'whole')>0&&!notified?button('whatsapp','Avisar pelo WhatsApp',`data-id="${esc(w.id)}"`)+button('wait-notify','Confirmar envio manual',`data-id="${esc(w.id)}"`):''}${button('wait-cancel','Cancelar interesse e remover contato',`data-id="${esc(w.id)}"`)}</div></div>`;}).join('')}`;}).join('')}</details>
  <details><summary>Despesas, aportes e devolução aos alunos</summary><p class="msg"><strong>Fluxo financeiro:</strong> Isabela cadastra aportes, beneficiários, valores e chaves Pix; avisa Bárbara Cristina. Bárbara Cristina executa os Pix pelo banco. Isabela só marca a devolução após confirmação real. Aportes não são vendas.</p>
  <form id="expense-form"><h3>Compra ou despesa detalhada</h3>
    <p class="ing">Preço × quantidade/peso = total calculado. Para reembolsar quem adiantou dinheiro, escolha "Pessoa"; não lance esse gasto novamente como aporte.</p>
    ${input('purchaseDate','Data da compra',purchaseDate(),'date','required')}
    ${input('product','Produto ou serviço (ex.: muçarela, Uber)','','text','required maxlength="140"')}
    ${input('unitPrice','Valor unitário (R$ por kg, unidade ou litro)','','number','required min="0.01" step="0.01"')}
    <label>Unidade de referência<select name="unit"><option value="kg">Quilo (kg) — R$/kg</option><option value="un">Unidade — R$/un</option><option value="L">Litro (L) — R$/L</option></select></label>
    ${input('qty','Quantidade/peso (ex.: 0,500 kg ou 2 un)','','number','required min="0.001" step="0.001"')}
    <div class="expense-total" role="status" aria-live="polite">Total calculado: <strong id="expense-total-preview">R$ 0,00</strong></div>
    <label>Quem pagou<select name="payerSource"><option value="cash">Caixa do Forno das Artes</option><option value="person">Uma pessoa — precisa ser reembolsada</option><option value="pending">Ainda não pago — previsto</option></select></label>
    ${input('payerName','Nome de quem pagou / a quem devolver','','text','maxlength="140"')}
    ${input('destination','Finalidade / destino do gasto (ex.: Uber para transporte)','','text','maxlength="400"')}
    ${submit('Salvar compra e despesa')}
  </form>
  <form id="contribution-form"><h3>Aporte inicial individual</h3><p>Aporte é dinheiro entregue para financiar o projeto, não compra feita por terceiros.</p>${input('name','Identificação do aluno','','text','required maxlength="140"')}${input('amount','Valor R$','','number','required min="0.01" step="0.01"')}${submit('Registrar aporte')}</form>
  <h3>Aportes cadastrados</h3>${state.contributions.map(c=>{const returned=state.returns.filter(r=>r.contributionId===c.id).reduce((n,r)=>n+r.amount,0);return `<div class="row"><span>${esc(c.name)} · aporte ${money(c.amount)} · devolvido ${money(returned)} · ${returned===c.amount?'OK':'PENDENTE '+money(c.amount-returned)}</span>${returned<c.amount?button('return','Registrar devolução realizada',`data-id="${esc(c.id)}"`):''}</div>`;}).join('')||'<p>Sem aportes registrados.</p>'}
  <h3>Despesas cadastradas</h3>
  ${state.expenses.slice().reverse().map(e=>`<div class="row expense-line"><span>${e.purchaseDate?esc(e.purchaseDate):date(e.createdAt)} · <strong>${esc(e.product||e.description)}</strong> · ${e.unitPrice?`${money(e.unitPrice)}/${esc(e.unit)} × ${qtyStr(e.qtyMilli)} ${esc(e.unit)} · `:''}<strong>Total ${money(e.amount)}</strong> · ${esc(e.payerSource==='person'?`Pago por ${e.payerName}`:e.payerSource==='cash'?'Pago pelo caixa':e.payerSource==='pending'?'Ainda não pago':'Pagador não registrado')} · ${esc(expenseStatus(e))}${e.destination?' · '+esc(e.destination):''}</span><div class="actions">${!e.paid?button('expense-pay','Registrar pagamento realizado',`data-id="${esc(e.id)}"`):''}${e.payerSource==='person'&&!e.reimbursedAt?button('expense-reimburse','Confirmar devolução (OK)',`data-id="${esc(e.id)}"`):''}</div></div>`).join('')||'<p>Nenhuma despesa registrada.</p>'}
  <p class="ing">Registros anteriores permanecem inalterados. Se o pagador não foi registrado no lançamento antigo, a origem é desconhecida. Marcar OK só após efetuar e conferir o reembolso real.</p></details>
  <details><summary>Pessoas e chaves Pix para devoluções — uso interno</summary>
   <p class="ing">Cadastre os dados dos alunos e de qualquer pessoa que precise receber valores. As chaves Pix são dados pessoais: ficam apenas na Gestão e no backup privado, nunca na Fila ou no cardápio. A chave de RECEBIMENTO das vendas continua no campo específico acima.</p>
   ${store.mode!=='offline'?'<p class="wait-warning">Cadastro individual disponível somente no Plano B. O banco online ainda não foi atualizado para estas funções.</p>':`<form id="person-form">
     <input type="hidden" name="personId" value="">
     ${input('name','Nome da pessoa','','text','maxlength="140" required')}
     ${input('pixKey','Chave Pix para receber devoluções (opcional)','','text','maxlength="140" autocomplete="off"')}
     ${submit('Salvar pessoa / chave Pix')}
   </form>`}
   <div class="scroll"><table><thead><tr><th>Pessoa</th><th>Chave Pix (oculta)</th><th>Ações</th></tr></thead><tbody>${(state.people||[]).map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(maskedPix(p.pixKey))}</td><td><div class="actions">${button('person-edit','Editar',`data-id="${esc(p.id)}"`)}${p.pixKey?button('person-copy-pix','Copiar chave Pix',`data-id="${esc(p.id)}"`):''}</div></td></tr>`).join('')||'<tr><td colspan="3">Ninguém cadastrado.</td></tr>'}</tbody></table></div>
  </details>
  <details><summary>Devedores — valores a receber</summary>
    <p class="ing">Use para valores que alguém deve ao projeto. Não duplique pedidos ou aportes já contabilizados. Este é um controle de cobrança: marcar recebido não altera automaticamente receitas, aportes ou saldo bancário; concilie a origem antes de lançar no caixa.</p>
    ${store.mode!=='offline'?'<p class="wait-warning">Controle de devedores disponível somente no Plano B.</p>':`<form id="debt-form">
      ${input('date','Data do registro',purchaseDate(),'date','required')}
      ${input('personName','Quem deve ao Forno das Artes','','text','maxlength="140" required list="people-names"')}
      <datalist id="people-names">${(state.people||[]).map(p=>`<option value="${esc(p.name)}"></option>`).join('')}</datalist>
      ${input('reason','Motivo do valor devido','','text','maxlength="400" required')}
      ${input('amount','Valor a receber (R$)','','number','step="0.01" min="0.01" required')}
      ${input('dueDate','Vencimento (opcional)','','date')}
      ${submit('Registrar devedor')}
    </form>`}
    <p><strong>Saldo pendente de cobrança: ${money(t.debtsDue)}</strong></p>
    <div class="scroll"><table><thead><tr><th>Data</th><th>Devedor</th><th>Motivo</th><th>Total</th><th>Falta receber</th><th>Situação</th><th>Ação</th></tr></thead><tbody>${(state.debts||[]).slice().reverse().map(d=>`<tr><td>${esc(d.date||d.createdAt?.slice(0,10))}</td><td>${esc(d.personName)}</td><td>${esc(d.reason)}</td><td>${money(d.amount)}</td><td>${money(outstanding(d))}</td><td>${outstanding(d)===0?'OK — RECEBIDO':'PENDENTE'}</td><td>${outstanding(d)>0?button('debt-receive','Confirmar recebimento',`data-id="${esc(d.id)}"`):'—'}</td></tr>`).join('')||'<tr><td colspan="7">Nenhum devedor cadastrado.</td></tr>'}</tbody></table></div>
  </details>
  <details><summary>Fechamentos, relatórios e trilha de auditoria</summary>${button('csv','Exportar relatório completo CSV')}${button('pending-csv','Exportar pendências e reembolsos CSV')}${pendingTable()}${state.cashSessions.map(c=>`<p>${esc(c.id)} · ${date(c.openedAt)} · ${c.closedAt?'Fechado '+date(c.closedAt)+' · esperado '+money(c.expected)+' · conferido '+money(c.counted)+' · diferença '+money(c.difference):'Aberto'}</p>`).join('')}<div class="scroll"><table><thead><tr><th>Revisão</th><th>Horário</th><th>Responsável</th><th>Ação</th></tr></thead><tbody>${state.audit.slice(-100).reverse().map(a=>`<tr><td>${a.revision}</td><td>${date(a.createdAt)}</td><td>${esc(a.actor)}</td><td>${esc(a.type)}</td></tr>`).join('')}</tbody></table></div></details>`;
  styleManagement();styleWait();updateRecipePreview();updateExpenseTotal();
}
function waitForm(id=''){
  return `<form id="wait-form"><h3>Avise-me quando estiver disponível</h3><label>Sabor<select name="productId">${state.menu.filter(p=>p.active&&!p.archived&&p.modes.whole).map(p=>`<option value="${esc(p.id)}" ${p.id===id?'selected':''}>${esc(p.artistic)}</option>`).join('')}</select></label>${input('contact','WhatsApp com país e DDD (somente números)','','tel','required pattern="[0-9]{10,15}" maxlength="15"')}${check('consent','Autorizo contato somente para aviso deste sabor. Posso pedir cancelamento à equipe. Não há reserva nem cobrança.')}${submit('Registrar interesse com a equipe')}<p class="ing">Contato privado, acessível apenas à equipe autorizada. Ao cancelar, o contato é removido da lista ativa e do registro operacional. Excluir backups antigos conforme política de retenção.</p></form>`;
}
function renderAcesso(){
  $('v-acesso').innerHTML=`<h2>Acesso e backups</h2><p>Sessões não são restauradas automaticamente após recarga. Carrinhos ainda não registrados são temporários; pedidos gravados permanecem no banco. Uma tentativa enviada e sem confirmação deve ser consultada após entrar novamente.</p><p>${store.mode==='offline'?'MODO OFFLINE: um notebook central, neste navegador e endereço. IndexedDB não é um banco compartilhado entre aparelhos.':'PLANO A: Supabase. Nenhuma transação é convertida automaticamente em offline.'}</p>${staff()?`<p>Operador ${esc(store.actor.id)} · função ${esc(store.actor.role)}</p>${button('logout','Encerrar sessão')}${admin()&&store.mode==='offline'?`<details><summary>Cadastrar ou atualizar acesso financeiro de Isabela</summary><p>Conta separada da administração; não substitui senha de administradora e não migra o banco. Acesso restrito às operações financeiras no notebook.</p><form id="finance-access-form">${input('name','Identificação da responsável','Isabela','text','required maxlength="100"')}${input('password','Senha individual (mínimo 12 caracteres)','','password','required minlength="12" autocomplete="new-password"')}${submit('Salvar acesso financeiro')}</form></details>`:''}`:store.mode==='offline'&&!localConfigured?`<form id="setup-form"><h3>Criar acesso local do notebook</h3>${input('name','Nome da operadora','','text','required maxlength="100"')}${input('password','Senha local (mínimo 10 caracteres)','','password','required minlength="10" autocomplete="new-password"')}${submit('Preparar acesso local')}</form>`:`<form id="login-form">${input('name',store.mode==='online'?'E-mail Supabase':'Nome local','','text','required autocomplete="username"')}${input('password','Senha','','password','required autocomplete="current-password"')}${submit('Entrar')}</form>`}<p class="ing">No offline, a senha evita uso casual da interface. Quem controla o notebook ou as ferramentas do navegador pode acessar o armazenamento. Use conta de sistema protegida, bloqueio de tela e backups privados.</p><details><summary>Plano A — configurar conexão futura</summary><p>Esta tela não instala SQL. Requer revisão e autorização separada para implantação no Supabase existente. Somente chave pública; jamais service_role, chave secret ou senha de banco. A conexão só é usada ao selecionar o modo online.</p><form id="online-config-form">${input('url','URL HTTPS do projeto Supabase',onlineConfig?.url||'','url','required')}${input('key','Chave publishable ou anon',onlineConfig?.key||'','text','required')}${submit('Guardar configuração pública neste navegador')}</form>${button('online','Usar Plano A online')}</details>${button('offline','Usar Plano B offline')}<details><summary>Backups e recuperação</summary><p>Os arquivos podem conter dados financeiros e contatos. Guarde-os em pasta privada, nunca no repositório público. Exportação não inclui senhas. O checksum detecta alteração acidental; não autentica o arquivo.</p>${admin()?button('backup','Exportar backup JSON')+button('csv','Exportar relatório CSV'):'<p>Entre como administradora para exportar.</p>'}${store.mode==='offline'&&admin()?'<form id="restore-form"><label>Restaurar somente em instalação local vazia<input name="backup" type="file" accept="application/json" required></label><p>Instalação com qualquer movimento não será substituída. Após restaurar, as vendas ficam pausadas até a conciliação.</p>'+submit('Validar e restaurar em instalação vazia')+'</form>':''}<p>Para transição entre planos, consulte docs/OPERACAO-TRANSICAO.md. Somente um modo registra novas vendas. Não há fusão automática de bancos.</p></details><p>Plano C: <a href="plano-c/KIT_PLANO_C_LOTE_01.pdf">abrir kit para impressão</a>. Nenhum dado real foi incluído nesta entrega.</p>`;
  styleAccess();
}
function render(){if(!state)return;renderMenu();renderPedido();renderFila();renderCaixa();renderGestao();renderAcesso();$('mode-banner').textContent=(store.mode==='offline'?'MODO OFFLINE · PLANO B · um notebook central · celulares NÃO sincronizam':'PLANO A · ONLINE · atendimento pela equipe')+(location.port==='8871'?' · BASE FICTÍCIA DE TESTE FINANCEIRO — NÃO IMPORTAR DADOS REAIS':'')+(state.paused?' · NOVAS VENDAS PAUSADAS':'')+(staff()?' · '+store.actor.role:' · consulta pública');route();dirty=false;}
function publicView(s){return {version:2,revision:s.revision,role:'public',paused:s.paused,prices:s.prices,pix:s.pix,
  menu:s.menu.filter(p=>p.active&&!p.archived).map(p=>{const x=clone(p);delete x.cost;return x;}),
  stock:Object.fromEntries(s.menu.flatMap(p=>['slice','whole'].map(m=>[p.id+':'+m,{available:available(p.id,m)}]))),
  orders:(s.orders||[]).filter(o=>['preparando','pronto'].includes(o.status)).map(o=>({id:o.id,status:o.status,createdAt:o.createdAt}))};}
async function refresh(force=false){const next=await store.state();if(!force&&dirty&&next.role===state.role&&next.revision!==state.revision){incoming=next;feedback('Há alterações de outro operador. Seu formulário foi preservado. Atualize e confira antes de salvar.',true);return;}if(force||next.revision!==state?.revision||next.role!==state?.role){state=next;incoming=null;render();}}
function showRetry(message){feedback(message,true);const b=document.createElement('button');b.type='button';b.className='btn p';b.textContent='Verificar operação pendente';b.dataset.action='retry';$('feedback').append(document.createTextNode(' '),b);}
async function execute(type,payload={},command=null){
  assert(!busy,'Aguarde a operação anterior.');assert(!retryCommand||command===retryCommand,'Verifique a operação pendente antes de registrar outra.');busy=true;feedback('Salvando operação… aguarde a confirmação.');
  const c=command||{type,payload,expectedRevision:state.revision,requestId:uid()};
  try{state=await store.command(c);retryCommand=null;incoming=null;render();feedback('Operação confirmada e salva.');return state;}
  catch(e){
    // Falha pode ocorrer depois de commit; manter a mesma identidade também no local. Conservar UUID e revisão para consultar/repetir sem duplicar.
    if(e.name==='AbortError'||e instanceof TypeError||e.name==='UnknownError'){
      retryCommand=c;showRetry('Resultado não confirmado. Não cobre nem refaça o pedido; consulte a operação pendente.');
    }else{
      if(c.type==='order.create'){clearIntent(sessionStorage);orderIntent=null;retryCommand=null;}
      feedback(e.message,true);
    }
    throw e;
  }finally{busy=false;}
}
function download(name,type,text){const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function report(){
  assert(admin(),'Acesso administrativo necessário.');const rows=[['tipo','id','data','responsavel','descricao','quantidade','valor_centavos','status','produto','unidade','quantidade_compra','preco_unitario_centavos','pagador','finalidade','reembolsado_em','chave_pix_mascarada']];
  for(const o of state.orders){for(const l of o.lines)rows.push(['item',o.id,o.createdAt,o.createdBy,operationalLine(l),l.qty,l.unitPrice,o.status]);rows.push(['pedido',o.id,o.paidAt||o.createdAt,o.paidBy||o.createdBy,'PIX',1,o.total,o.status]);}
  for(const k of ['expenses','contributions','returns','refunds'])for(const x of state[k])rows.push([k,x.id,x.purchaseDate||x.createdAt,x.actor||x.createdBy,x.description||x.name||x.reason||x.contributionId,1,x.amount,k==='expenses'?expenseStatus(x):'registrado',x.product||'',x.unit||'',x.qtyMilli?qtyStr(x.qtyMilli):'',x.unitPrice||'',x.payerSource==='person'?x.payerName:x.payerSource==='cash'?'Caixa':x.payerSource==='pending'?'Não pago':'',x.destination||'',x.reimbursedAt||'',x.payerName?maskedPix(pixFor(x.payerName)):x.name?maskedPix(pixFor(x.name)):'']);
  for(const d of state.debts||[])rows.push(['cobranca',d.id,d.date,d.actor,d.reason,1,d.amount,outstanding(d)?'PENDENTE':'OK',d.personName,'','','','','', '',maskedPix(pixFor(d.personName))]);
  for(const [id,x] of Object.entries(state.stock))rows.push(['estoque',id,'','',`físico=${x.onHand}; reservado=${x.reserved}; vendido=${x.sold}`,availability(state,...id.split(':')),'','']);
  for(const c of state.cashSessions)rows.push(['fechamento',c.id,c.closedAt,c.closedBy,c.closeNote||'',1,c.counted??'',c.closedAt?'fechado':'aberto']);
  rows.slice(1).forEach(row=>{while(row.length<rows[0].length)row.push('');});
  download('forno-relatorio-'+new Date().toISOString().slice(0,10)+'.csv','text/csv;charset=utf-8',csv(rows));
}
function pendingCsv(){
 assert(admin(),'Acesso administrativo necessário.');
 const rows=[['tipo','data','produto_ou_motivo','pessoa','valor_original_centavos','valor_pendente_centavos','situacao','pix_destinatario_mascarada']];
 pendingRows().forEach(x=>rows.push([x.kind,x.when,x.description,x.person,x.original,x.due,x.paid?'OK':'PENDENTE',maskedPix(pixFor(x.person))]));
  (state.debts||[]).forEach(d=>rows.push(['Devedor — a receber',d.date,d.reason,d.personName,d.amount,outstanding(d),outstanding(d)===0?'OK':'PENDENTE',maskedPix(pixFor(d.personName))]));
 // Inclui compras em aberto a fornecedores, sem duplicar aportes/reembolsos.
 state.expenses.filter(e=>!e.paid).forEach(e=>rows.push(['Fornecedor a pagar',e.purchaseDate||e.createdAt,e.product||e.description,'',e.amount,e.amount,'PENDENTE']));
 rows.slice(1).forEach(row=>{while(row.length<rows[0].length)row.push('');});
 download('forno-pendencias-reembolsos-'+new Date().toISOString().slice(0,10)+'.csv','text/csv;charset=utf-8',csv(rows));
}
async function image(file){assert(file.size<=500000&&['image/png','image/jpeg','image/webp'].includes(file.type),'Imagem deve ser PNG, JPEG ou WebP de até 500 KB.');return new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(file);});}
async function switchMode(mode){
  assert(!busy&&!retryCommand&&!orderIntent,'Resolva primeiro a operação pendente.');
  assert(confirm('Somente um modo pode registrar novas vendas. A mudança NÃO transfere pedidos nem estoque. Confirme que a equipe foi avisada e a conciliação será feita.'),'Mudança cancelada.');
  const next=mode==='online'?new OnlineStore(onlineConfig||{}):new LocalStore();await next.init();
  let nextState;try{nextState=await next.state();}catch(e){next.channel?.close();next.db?.close();throw e;}
  try{await store.logout();}catch(e){feedback('A sessão local foi encerrada; a revogação remota não foi confirmada.',true);}
  store.channel?.close();store.db?.close();
  store=next;state=nextState;localConfigured=store.mode==='offline'?await store.configured():true;cart=[];last=null;incoming=null;editId=null;render();
  store.onchange=()=>refresh().catch(e=>feedback(e.message,true));
}
function updateExpenseTotal(){
 const form=$('expense-form');if(!form)return;
 const price=form.elements.namedItem('unitPrice')?.value,qty=form.elements.namedItem('qty')?.value;
 const show=$('expense-total-preview');
 try{show.textContent=price&&qty?money(Math.round(amount(price)*qtyMilli(qty)/1000)):'R$ 0,00';}
 catch{show.textContent='Confira preço e quantidade';}
 const payer=form.elements.namedItem('payerSource')?.value;
 const name=form.elements.namedItem('payerName');if(name){name.closest('label').hidden=payer!=='person';name.required=payer==='person';}
}
document.addEventListener('input',e=>{if(e.target.closest('form'))dirty=true;if(e.target.closest('#expense-form'))updateExpenseTotal();});
document.addEventListener('change',e=>{if(e.target.closest('#expense-form'))updateExpenseTotal();});
document.addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target,d=new FormData(f);try{
    switch(f.id){
      case 'recipe-form':assert((admin()||finance())&&store.mode==='offline','Ficha disponível somente na Gestão/Financeiro local.');await execute('recipe.save',{productId:f.dataset.productId,recipe:recipeDraft(f)});break;
      case 'sale-fee-form':assert((admin()||finance())&&store.mode==='offline','Taxas disponíveis somente no painel local.');await execute('payment.fee.set',{orderId:d.get('orderId'),amount:amount(d.get('amount')),verified:d.has('verified'),reason:d.get('reason'),expenseId:d.get('expenseId')||null});break;
      case 'setup-form':await store.setup(d.get('name'),d.get('password'));localConfigured=true;render();feedback('Acesso local criado. Configure Pix, estoque e abra o caixa antes de ativar vendas.');break;
      case 'finance-access-form':assert(admin()&&store.mode==='offline','Somente a administração pode criar o acesso financeiro local.');assert(confirm('Salvar ou substituir o acesso financeiro de Isabela? O acesso administrativo não será alterado.'),'Operação cancelada.');await store.setFinanceAccess(d.get('name'),d.get('password'));feedback('Acesso financeiro salvo. O banco de dados anterior foi preservado.');break;
      case 'login-form':await store.login(d.get('name'),d.get('password'));state=await store.state();render();feedback('Sessão iniciada.');if(orderIntent){assert(orderIntent.mode===store.mode&&orderIntent.owner===await sha(store.actor.id),'Existe uma tentativa pendente de outra operadora/modo; preserve esta aba e solicite conciliação.');retryCommand=orderIntent.command;showRetry('Pedido pendente de consulta após recarga. Não registre outro para substituir.');}break;
      case 'online-config-form':{const c={url:d.get('url').replace(/\/$/,''),key:d.get('key').trim()};new OnlineStore(c);localStorage.setItem('fda-v2-public-config',JSON.stringify(c));onlineConfig=c;feedback('Configuração pública guardada. Nenhuma conexão nem alteração do banco foi feita.');break;}
      case 'prices-form':assert(confirm('Aplicar preços somente a novas vendas?'),'Alteração cancelada.');await execute('prices.set',{slice:amount(d.get('slice')),whole:amount(d.get('whole'))});break;
      case 'pix-form':{const file=d.get('qr');await execute('pix.set',{key:d.get('key'),recipient:d.get('recipient'),qr:d.has('removeQr')?'':file?.size?await image(file):state.pix.qr});break;}
      case 'product-form':{
        const old=state.menu.find(p=>p.id===f.dataset.productId),file=d.get('image'),nut=d.get('nut').trim();
        const p={id:f.dataset.productId,name:d.get('name').trim(),artistic:d.get('artistic').trim(),description:d.get('description'),ingredients:d.get('ingredients'),image:d.has('removeImage')?'':file?.size?await image(file):old?.image||'',nut:nut?nut.split(';').map(x=>Number(x.trim().replace(',','.'))):null,modes:{slice:d.has('slice'),whole:d.has('whole')},price:{slice:d.get('price-slice')?amount(d.get('price-slice')):null,whole:d.get('price-whole')?amount(d.get('price-whole')):null},cost:{slice:amount(d.get('cost-slice')),whole:amount(d.get('cost-whole'))},active:d.has('active'),archived:d.has('archived'),position:Number(d.get('position'))};editId=p.id;await execute('menu.save',p);break;
      }
      case 'expense-form':{
        assert(store.mode==='offline','Lançamento detalhado disponível no Plano B. O Plano A exige migração aditiva aprovada antes do uso.');
        const unit=d.get('unit'), unitPrice=amount(d.get('unitPrice')), qty=qtyMilli(d.get('qty'));
        assert(unit!=='un'||qty%1000===0,'Para unidade (un), informe uma quantidade inteira.');
        const total=Math.round(unitPrice*qty/1000);
        assert(total>=1&&total<=100000000,'Total calculado fora do limite.');
        const payerSource=d.get('payerSource'), payerName=String(d.get('payerName')||'').trim();
        assert(payerSource!=='person'||payerName,'Informe o nome de quem pagou.');
        await execute('expense.add',{description:d.get('product').trim(),product:d.get('product'),purchaseDate:d.get('purchaseDate'),unit,unitPrice,qtyMilli:qty,amount:total,paid:payerSource!=='pending',payerSource,payerName:payerSource==='person'?payerName:'',destination:d.get('destination')});break;
      }
      case 'person-form':{
        assert((admin()||finance())&&store.mode==='offline','Cadastro disponível somente para Financeiro ou Administração no Plano B.');
        const id=String(d.get('personId')||'');await execute('person.save',{id,name:String(d.get('name')||'').trim(),pixKey:String(d.get('pixKey')||'').trim()});break;
      }
      case 'debt-form':{
        assert(admin()&&store.mode==='offline','Cobranças disponíveis somente na Gestão offline.');
        await execute('debt.add',{date:d.get('date'),personName:String(d.get('personName')||'').trim(),reason:String(d.get('reason')||'').trim(),amount:amount(d.get('amount')),dueDate:d.get('dueDate')||''});break;
      }
      case 'contribution-form':await execute('contribution.add',{name:d.get('name'),amount:amount(d.get('amount'))});break;
      case 'wait-form':assert(cash(),'Solicite à equipe o cadastro de interesse. Nenhum contato foi enviado.');await execute('wait.add',{productId:d.get('productId'),contact:d.get('contact'),consent:d.has('consent')});break;
      case 'restore-form':{const file=d.get('backup');assert(file?.size&&file.size<30e6,'Arquivo ausente ou acima de 30 MB.');const b=JSON.parse(await file.text());assert(confirm('Restaurar o arquivo validado em instalação vazia? As vendas ficarão pausadas.'),'Restauração cancelada.');state=await store.restore(b);render();feedback('Backup restaurado; vendas pausadas. Confira contagens e concilie antes de ativar.');break;}
      default:if(f.classList.contains('stock-form'))await execute('stock.adjust',{productId:f.dataset.id,mode:f.dataset.mode,delta:Number(d.get('delta')),limit:d.get('limit')===''?null:Number(d.get('limit')),reason:d.get('reason')});
    }
  }catch(err){if(!retryCommand)feedback(err.message,true);}
});
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;try{
    switch(a){
      case 'recipe-load':assert((admin()||finance())&&store.mode==='offline','Acesso reservado.');assert(!dirty||confirm('Descartar campos ainda não salvos e carregar outra ficha?'),'Edição preservada.');financialProductId=$('financial-recipe-choice').value;render();$('recipe-editor').open=true;break;
      case 'recipe-add':assert((admin()||finance())&&store.mode==='offline','Acesso reservado.');assert(document.querySelectorAll('.recipe-row').length<100,'Limite de 100 ingredientes.');$('recipe-rows').insertAdjacentHTML('beforeend',ingredientRow());dirty=true;updateRecipePreview();break;
      case 'recipe-remove':assert((admin()||finance())&&store.mode==='offline','Acesso reservado.');assert(document.querySelectorAll('.recipe-row').length>1,'Mantenha pelo menos um ingrediente.');b.closest('.recipe-row').remove();dirty=true;updateRecipePreview();break;
      case 'results-csv':assert((admin()||finance())&&store.mode==='offline','Acesso reservado ao painel local.');download('forno-resultados-'+new Date().toISOString().slice(0,10)+'.csv','text/csv;charset=utf-8',csv(resultsCsvRows(state)));break;
      case 'toggle-password':{
        const field=b.closest('.password-entry')?.querySelector('input');
        if(!field)break;
        const show=field.type==='password';
        field.type=show?'text':'password';
        b.innerHTML=(show?eyeHidden:eyeVisible)+`<span class="password-toggle-text">${show?'Ocultar':'Mostrar'}</span>`;
        b.setAttribute('aria-pressed',String(show));
        b.setAttribute('aria-label',show?'Ocultar senha':'Mostrar senha');
        b.title=show?'Ocultar senha':'Mostrar senha';
        field.focus({preventScroll:true});
        break;
      }
      case 'cart-plus':case 'cart-minus':{const mode=b.dataset.mode;let l=cart.find(l=>l.productId===id&&l.mode===mode);if(!l){l={productId:id,mode,qty:0};cart.push(l);}l.qty=Math.max(0,Math.min(99,available(id,mode),l.qty+(a==='cart-plus'?1:-1)));cart=cart.filter(l=>l.qty);last=null;renderMenu();renderPedido();break;}
      case 'create-order':{
        if(busy)break;
        assert(cash(),'Entre com uma operadora autorizada.');
        assert(state.pix?.key,'Configure a chave Pix em Gestão antes de registrar o pedido. Nenhum pedido foi criado.');
        const owner=await sha(store.actor.id);
        if(!orderIntent){const payload={lines:clone(cart),idempotencyKey:uid()};orderIntent={mode:store.mode,owner,command:{type:'order.create',payload,expectedRevision:state.revision,requestId:uid()}};saveIntent(sessionStorage,orderIntent);}
        assert(orderIntent.mode===store.mode&&orderIntent.owner===owner,'Entre com a operadora original e consulte a tentativa pendente.');
        const c=orderIntent.command;await execute(c.type,c.payload,c);last=state.orders.find(o=>o.idempotencyKey===c.payload.idempotencyKey);clearIntent(sessionStorage);orderIntent=null;cart=[];location.hash='#pedido';render();break;
      }
      case 'retry':{
        assert(retryCommand,'Nenhuma operação pendente.');
        if(orderIntent)assert(orderIntent.mode===store.mode&&orderIntent.owner===await sha(store.actor?.id||''),'Entre com a operadora original para consultar a tentativa.');
        const c=retryCommand;await execute(c.type,c.payload,c);if(c.type==='order.create'){last=state.orders.find(o=>o.idempotencyKey===c.payload.idempotencyKey);clearIntent(sessionStorage);orderIntent=null;cart=[];location.hash='#pedido';render();}break;
      }
      case 'new-order':last=null;cart=[];location.hash='#sabores';render();break;
      case 'pay':assert(confirm('Você conferiu o crédito do valor exato na CONTA BANCÁRIA? Print de comprovante não basta.'),'Confirmação cancelada.');await execute('order.pay',{id,verified:true,reference:prompt('Referência da transação bancária conferida (opcional):')||''});break;
      case 'status':await execute('order.status',{id,status:b.dataset.status});break;
      case 'cancel':{const reason=prompt('Motivo do cancelamento:');assert(reason,'Cancelamento não realizado.');const returnStock=confirm('O produto pago pode retornar ao estoque de venda? OK = sim; Cancelar = não (perda). Reserva ainda não paga sempre é liberada.');await execute('order.cancel',{id,reason,returnStock});feedback('Cancelamento registrado. Se houve Pix recebido, registre a devolução separadamente após realizá-la.');break;}
      case 'refund':{const value=prompt('Valor do Pix já devolvido (R$):');assert(value,'Nenhuma devolução registrada.');const reason=prompt('Motivo e referência da devolução:');assert(reason&&confirm('A transferência de devolução foi conferida no banco?'),'Confirme somente uma devolução efetivamente realizada.');await execute('refund.record',{orderId:id,amount:amount(value),reason,verified:true});break;}
      case 'seed-menu':assert(admin()&&state.menu.length===0,'Cardápio já possui cadastros.');assert(confirm('Cadastrar os quatro sabores originais, com imagens e nutrição, sem estoque nem dados financeiros?'),'Cadastro cancelado.');for(const p of SEED.menu)await execute('menu.save',clone(p));feedback('Quatro sabores cadastrados; estoque permanece zero.');break;
      case 'product-edit':editId=id;renderGestao();$('product-form').closest('details').open=true;break;
      case 'product-new':editId=null;renderGestao();$('product-form').closest('details').open=true;break;
      case 'product-delete':assert(confirm('Excluir este cadastro? Produtos com histórico devem ser arquivados e não serão excluídos.'),'Exclusão cancelada.');await execute('menu.delete',{id});break;
      case 'pause':await execute('operation.pause');break;
      case 'resume':assert(confirm('Confirme que somente ESTE modo registra novas vendas. Outros modos devem estar pausados e os saldos conciliados.'),'Ativação cancelada.');await execute('operation.resume');break;
      case 'refresh':assert(!dirty||confirm('Atualizar descarta alterações ainda não salvas do formulário. Continuar?'),'Atualização cancelada.');await refresh(true);feedback('Dados atualizados.');break;
      case 'wait-open':if(!cash()){feedback('A equipe registra seu interesse com consentimento. Procure o caixa; não há cadastro público online habilitado.');break;}location.hash='#gestao';$('v-gestao').innerHTML='<h2>Lista de espera</h2>'+waitForm(id);styleWait();break;
      case 'whatsapp':{assert(navigator.onLine,'Sem internet. Registre o contato e avise quando a conexão voltar.');const w=state.waitlist.find(w=>w.id===id);assert(w&&available(w.productId,'whole')>0,'Produto ainda indisponível.');const p=state.menu.find(p=>p.id===w.productId);const url='https://wa.me/'+w.contact+'?text='+encodeURIComponent('Olá! Você pediu aviso do Forno das Artes: '+p.artistic+' está disponível novamente. A disponibilidade pode mudar. Este aviso não reserva unidade. Para cancelar os avisos, responda cancelar.');window.open(url,'_blank','noopener,noreferrer');feedback('Conversa aberta. Envie a mensagem manualmente e depois confirme o envio no sistema.');break;}
      case 'wait-notify':assert(confirm('Você enviou a mensagem manualmente pelo WhatsApp? Abrir a conversa não envia.'),'Envio não confirmado.');await execute('wait.notify',{id,confirmed:true});break;
      case 'wait-cancel':assert(confirm('Cancelar interesse e remover este contato?'),'Cancelamento não realizado.');await execute('wait.cancel',{id});break;
      case 'return':{const v=prompt('Valor já devolvido ao aluno (R$):');assert(v&&confirm('Bárbara Cristina realizou a transferência e Isabela conferiu a confirmação externa? O site apenas registra a devolução já realizada.'),'Nenhuma devolução registrada.');await execute('return.add',{contributionId:id,amount:amount(v)});break;}
      case 'person-edit':{
        assert((admin()||finance())&&store.mode==='offline','Acesso ao Financeiro offline obrigatório.');
        const person=(state.people||[]).find(p=>p.id===id);assert(person,'Pessoa não encontrada.');
        const form=$('person-form');assert(form,'Formulário não encontrado.');
        form.querySelector('[name=personId]').value=person.id;
        form.querySelector('[name=name]').value=person.name;
        form.querySelector('[name=pixKey]').value=person.pixKey||'';
        form.closest('details').open=true;
        form.scrollIntoView({behavior:'smooth',block:'center'});
        feedback('Cadastro carregado para edição. Salve para confirmar alterações.');break;
      }
      case 'person-copy-pix':{
        assert((admin()||finance())&&store.mode==='offline','Acesso ao Financeiro offline obrigatório.');
        const person=(state.people||[]).find(p=>p.id===id);assert(person?.pixKey,'Chave Pix não cadastrada.');
        assert(navigator.clipboard?.writeText,'Copiar não é permitido neste navegador. Selecione Editar para consultar.');
        await navigator.clipboard.writeText(person.pixKey);
        feedback('Chave Pix copiada para transferência. Evite compartilhar dados pessoais.');break;
      }
      case 'debt-receive':{
        assert((admin()||finance())&&store.mode==='offline','Acesso ao Financeiro offline obrigatório.');
        const debtor=(state.debts||[]).find(d=>d.id===id);assert(debtor,'Devedor não encontrado.');
        const v=prompt('Quanto foi efetivamente recebido de '+debtor.personName+'? (R$) Saldo '+money(outstanding(debtor)));
        assert(v!==null,'Operação cancelada.');const value=amount(v);
        assert(value<=outstanding(debtor),'Valor superior ao saldo devedor.');
        assert(confirm('Conferiu o recebimento real de '+money(value)+'? ATENÇÃO: para evitar duplicidade, esta marcação NÃO adiciona receita ao caixa ou aporte.'),'Recebimento não confirmado.');
        const reference=prompt('Referência ou observação (opcional):');assert(reference!==null,'Operação cancelada.');
        await execute('debt.receive',{id,amount:value,verified:true,reference});break;
      }
      case 'expense-pay':{
        const x=state.expenses.find(e=>e.id===id);assert(x&&!x.paid,'Despesa não encontrada ou já paga.');
        assert(confirm('Essa compra já foi efetivamente paga?'),'Pagamento não confirmado.');
        let payerSource='cash',payerName='';
        if(x.product!==undefined){
          const who=prompt('Quem pagou? Digite CAIXA, ou o nome completo de quem adiantou o dinheiro.');
          assert(who&&who.trim(),'Informação de pagador obrigatória.');
          payerSource=who.trim().toLowerCase()==='caixa'?'cash':'person';payerName=payerSource==='person'?who.trim():'';
        }
        await execute('expense.pay',{id,verified:true,payerSource,payerName});break;
      }
      case 'expense-reimburse':{
        const x=state.expenses.find(e=>e.id===id);assert(x&&x.payerSource==='person'&&!x.reimbursedAt,'Reembolso não encontrado ou já concluído.');
        assert(confirm('Foi realizado e conferido o reembolso de '+money(x.amount)+' para '+x.payerName+'? Marcar OK somente após a transferência real.'),'Reembolso não registrado.');
        const reference=prompt('Observação/referência da devolução (opcional, sem dados bancários sensíveis):');
        assert(reference!==null,'Registro cancelado.');
        await execute('expense.reimburse',{id,verified:true,reference});break;
      }
      case 'pending-csv':pendingCsv();feedback('Relatório de pendências exportado.');break;
      case 'cash-open':{const note=prompt('Observação de abertura (opcional). OK abre o caixa; Cancelar não abre:');assert(note!==null,'Abertura cancelada. Nenhum caixa foi aberto.');await execute('cash.open',{note});break;}
      case 'cash-close':{const v=prompt('Saldo líquido de Pix recebido menos devolvido neste caixa, conferido no banco (R$):');assert(v!==null,'Fechamento cancelado.');await execute('cash.close',{id,counted:amount(v),note:prompt('Observação / justificativa de diferença:')||''});break;}
      case 'backup':download('forno-backup-'+new Date().toISOString().replaceAll(':','-')+'.json','application/json',JSON.stringify(await store.export(),null,2));break;
      case 'csv':report();break;
      case 'logout':{
        const clean=publicView(state);let remoteError=null;
        try{await store.logout();}catch(e){remoteError=e;}
        finally{store.actor=null;editId=null;last=null;cart=[];incoming=null;state=clean;render();}
        feedback(remoteError?'Sessão encerrada neste aparelho. A revogação remota não foi confirmada; verifique a conexão.':'Sessão encerrada; credenciais removidas da memória.',!!remoteError);break;
      }
      case 'online':await switchMode('online');break;
      case 'offline':await switchMode('offline');break;
    }
  }catch(err){if(!retryCommand)feedback(err.message,true);}
});
window.addEventListener('hashchange',route);
window.addEventListener('offline',()=>feedback(store.mode==='online'?'Internet indisponível. Não registre o mesmo pedido em outro modo sem confirmar o resultado e conciliar.':'Sem internet. O registro local continua; Pix e WhatsApp dependem de conexão bancária/telefone.',store.mode==='online'));
window.addEventListener('beforeunload',e=>{if(dirty||retryCommand){e.preventDefault();e.returnValue='';}});
async function boot(){
  store=await new LocalStore().init();localConfigured=await store.configured();state=await store.state();render();
  store.onchange=()=>refresh().catch(e=>feedback(e.message,true));
  setInterval(()=>{if(store.mode==='online'&&!document.hidden&&!busy)refresh().catch(e=>{if(!store.actor&&state.role!=='public'){state=publicView(state);render();}feedback('Banco indisponível: '+e.message,true);});},15000);
  if('serviceWorker' in navigator){try{await navigator.serviceWorker.register('./sw.js');await navigator.storage?.persist?.();}catch(e){feedback('Instalação offline incompleta: '+e.message,true);}}
}
boot().catch(e=>feedback('Não foi possível abrir o armazenamento. Não opere vendas: '+e.message,true));

document.addEventListener('input',e=>{if(e.target.closest('#recipe-form'))updateRecipePreview();});
