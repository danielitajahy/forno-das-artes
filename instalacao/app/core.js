import {validateRecipe,recipeFor,catalogCost,roundEighth,validateCostSnapshot,calculateResults} from './finance-results.js';
// Regras compartilhadas do Plano B. Valores monetários em centavos inteiros.
export const clone = value => structuredClone(value);
export const uid = () => crypto.randomUUID();
export function assert(test, message) { if (!test) throw Error(message); }
export function integer(n, min = 0, max = 1e10) { return Number.isSafeInteger(n) && n >= min && n <= max; }
export function text(t, max = 500) { return typeof t === 'string' && t.length <= max; }
export function safeImage(s) {
  return text(s, 700000) && (!s || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s));
}
export function initial(menu = []) {
  return {version: 2, revision: 0, operationId: uid(), sequence: 0, paused: true,
    menu: clone(menu), prices: {slice: 1200, whole: 4990}, stock: {}, orders: [],
    waitlist: [], expenses: [], contributions: [], returns: [], refunds: [], audit: [], people: [], debts: [],
    cashSessions: [], pix: {key: '', recipient: '', qr: ''}};
}
export function availability(s, id, mode) {
  const x = s.stock[id + ':' + mode];
  return x ? Math.max(0, Math.min(x.onHand - x.reserved, x.limit === null ? Infinity : x.limit - x.reserved)) : 0;
}
export function priceOf(s, p, mode) { return p.price[mode] ?? s.prices[mode]; }
const permissions = {
  admin: '*', presenter: [], seller: ['order.create'], finance: ['expense.add','expense.pay','expense.reimburse','contribution.add','return.add','person.save','recipe.save','payment.fee.set'], cashier: ['order.create','order.pay','order.cancel','refund.record','wait.add','wait.notify','wait.cancel','cash.open','cash.close'],
  kitchen: ['order.status','production.record']
};
export function validateProduct(p) {
  assert(p && /^[a-zA-Z0-9_-]{1,64}$/.test(p.id), 'Identificador de sabor inválido.');
  for (const k of ['name','artistic','description','ingredients']) assert(text(p[k], k === 'description' || k === 'ingredients' ? 3000 : 120) && (k !== 'name' || p[k].trim()), 'Texto de produto inválido: ' + k);
  assert(safeImage(p.image), 'Use imagem PNG, JPEG ou WebP local de até 500 KB.');
  assert(p.modes && ['slice','whole'].every(m => typeof p.modes[m] === 'boolean'), 'Modalidades inválidas.');
  assert(p.price && p.cost && ['slice','whole'].every(m => (p.price[m] === null || integer(p.price[m],1,1000000)) && integer(p.cost[m],0,1000000)), 'Preço/custo inválido.');
  assert(['active','archived'].every(k => typeof p[k] === 'boolean') && integer(p.position,0,10000), 'Situação/ordem inválida.');
  assert(p.nut === null || (Array.isArray(p.nut) && p.nut.length === 8 && p.nut.every(x => Number.isFinite(x) && x >= 0 && x <= 100000)), 'Informe oito valores nutricionais fornecidos ou deixe em branco.');
}
export function totals(s) {
  const paid = s.orders.filter(o => o.paidAt);
  const receipts = paid.reduce((n,o) => n + o.total, 0);
  const refunded = s.refunds.reduce((n,r) => n + r.amount, 0);
  const expensesPaid = s.expenses.filter(e => e.paid).reduce((n,e) => n+e.amount,0);
  const expensesAll = s.expenses.reduce((n,e) => n+e.amount,0);
  // Despesa paga por terceiro entra no resultado quando comprada, mas no caixa apenas após reembolso.
  // Lançamentos antigos, sem origem registrada, mantêm a classificação histórica de caixa.
  const expensesPaidCash = s.expenses.filter(e=>e.paid && e.payerSource!=='person').reduce((n,e)=>n+e.amount,0);
  const reimbursed = s.expenses.filter(e=>e.payerSource==='person'&&e.reimbursedAt).reduce((n,e)=>n+e.amount,0);
  const reimbursementDue = s.expenses.filter(e=>e.payerSource==='person'&&!e.reimbursedAt).reduce((n,e)=>n+e.amount,0);
  // Créditos a cobrar são controle de pendência. NÃO são somados a caixa, receita ou aporte:
  // a origem do crédito deve ser conciliada antes de reconhecer o recebimento financeiro.
  const debtsAll=(s.debts||[]).reduce((n,e)=>n+e.amount,0);
  const debtsReceived=(s.debts||[]).reduce((n,e)=>n+(e.receipts||[]).reduce((v,r)=>v+r.amount,0),0);
  const debtsDue=debtsAll-debtsReceived;
  const contributions = s.contributions.reduce((n,e) => n+e.amount,0);
  const returned = s.returns.reduce((n,e) => n+e.amount,0);
  const refundDue = paid.filter(o=>o.status==='cancelado').reduce((n,o)=>n+o.total,0)-refunded;
  return {receipts, refunded, net:receipts-refunded, expensesPaid, expensesAll,
    expensesPaidCash, reimbursed, reimbursementDue, debtsAll, debtsReceived, debtsDue, contributions, returned,
    balance:receipts-refunded-expensesPaidCash-reimbursed+contributions-returned,
    result:receipts-refunded-expensesAll,
    refundDue, donation:Math.max(0,receipts-refunded-expensesAll-refundDue),
    contributionsDue:contributions-returned};
}
export function reduce(state, command, actor) {
  assert(actor?.id && permissions[actor.role], 'Entre com um operador autorizado.');
  assert(command && /^[0-9a-f-]{36}$/i.test(command.requestId || ''), 'Identificador da operação inválido.');
  assert(permissions[actor.role] === '*' || permissions[actor.role].includes(command.type), 'Permissão insuficiente.');
  assert(!actor.allowedCommands || actor.allowedCommands.includes(command.type), 'Operação não concedida a esta conta.');
  const replay = state.audit.find(a => a.requestId === command.requestId);
  if (replay) {
    assert(replay.command ? replay.command === JSON.stringify(command) : replay.type === command.type && replay.actor === actor.id, 'Identificador reutilizado para outra operação.');
    return state;
  }
  assert(permissions[actor.role] === '*' || permissions[actor.role].includes(command.type), 'Permissão insuficiente.');
  // Repetir o mesmo pedido é seguro, inclusive após timeout e revisão alterada.
  if (command.type === 'order.create') {
    const old=state.orders.find(o=>o.idempotencyKey===command.payload?.idempotencyKey);
    if(old){assert(JSON.stringify(old.requestLines)===JSON.stringify(command.payload.lines),'Código reutilizado com itens diferentes.');return state;}
  }
  assert(command.expectedRevision === state.revision, 'Conflito de edição: atualize os dados e confira antes de tentar novamente.');
  const s = clone(state), p = command.payload || {}, now = new Date().toISOString();
  const stock = (id,mode) => s.stock[id+':'+mode] ??= {onHand:0,reserved:0,sold:0,limit:null,epoch:0};
  const order = () => {const o=s.orders.find(x=>x.id===p.id);assert(o,'Pedido não encontrado.');return o;};
  const money = n => assert(integer(n,1,100000000),'Informe um valor positivo em centavos.');
  const reason = () => assert(text(p.reason,500)&&p.reason.trim(),'Informe o motivo.');
  const event = x => ({...x,id:uid(),createdAt:now,actor:actor.id});
  switch(command.type) {
    case 'pitch.settings': {
      for(const k of ['initialInvestment','fixedCosts','otherSlice','otherWhole'])assert(p[k]===null||integer(p[k],0,100000000),'Valor de apresentação inválido.');
      assert(p.feeBps===null||integer(p.feeBps,0,10000),'Percentual variável inválido.');
      assert(typeof p.productionComplete==='boolean','Confirme a abrangência da produção.');
      s.pitchSettings={initialInvestment:p.initialInvestment,fixedCosts:p.fixedCosts,otherSlice:p.otherSlice,otherWhole:p.otherWhole,feeBps:p.feeBps,productionComplete:p.productionComplete,updatedAt:now,updatedBy:actor.id};break;
    }
    case 'production.record': {
      assert(s.menu.some(x=>x.id===p.productId)&&integer(p.pizzas,1,100000),'Informe sabor e número inteiro de pizzas de 35 cm.');reason();
      s.production??=[];s.production.push(event({productId:p.productId,pizzas:p.pizzas,reason:p.reason}));break;
    }
    case 'recipe.save': {
      assert(s.menu.some(x=>x.id===p.productId),'Sabor da ficha não encontrado.');validateRecipe(p.recipe);
      const r={...clone(p.recipe),productId:p.productId,revision:uid(),updatedAt:now,updatedBy:actor.id};
      s.recipes??={};Object.defineProperty(s.recipes,p.productId,{value:r,writable:true,enumerable:true,configurable:true});break;
    }
    case 'payment.fee.set': {
      const o=s.orders.find(x=>x.id===p.orderId);
      assert(o?.paidAt&&integer(p.amount,0,o.total)&&p.verified===true,'Confira a taxa efetiva do pedido pago; zero só se confirmado.');
      assert(text(p.reason,300)&&p.reason.trim().length>=3,'Informe a referência/motivo da conferência.');
      const expenseId=p.expenseId||null;
      if(expenseId){const e=s.expenses.find(x=>x.id===expenseId);assert(e?.paid&&e.payerSource!=='person','Vincule somente despesa paga pelo caixa.');const latest=new Map((s.paymentFees||[]).map(f=>[f.orderId,f]));latest.set(o.id,{amount:p.amount,expenseId});assert([...latest.values()].filter(f=>f.expenseId===expenseId).reduce((n,f)=>n+f.amount,0)<=e.amount,'Taxas vinculadas excedem a despesa.');}
      s.paymentFees??=[];s.paymentFees.push(event({orderId:o.id,amount:p.amount,reason:p.reason,expenseId}));break;
    }
    case 'menu.save': {
      validateProduct(p);
      assert(s.menu.length < 100 || s.menu.some(x=>x.id===p.id),'Limite de 100 sabores.');
      const i=s.menu.findIndex(x=>x.id===p.id);if(i<0)s.menu.push(clone(p));else s.menu[i]=clone(p);break;
    }
    case 'menu.delete': {
      assert(!(s.production||[]).some(x=>x.productId===p.id),'Há produção: arquive o sabor.');
      assert(!recipeFor(s,p.id),'Há ficha técnica: arquive o sabor em vez de excluir.');
      assert(!s.orders.some(o=>o.lines.some(l=>l.productId===p.id)), 'Há histórico: arquive o sabor em vez de excluir.');
      assert(!s.waitlist.some(w=>w.productId===p.id),'Há lista de espera: arquive o sabor.');
      assert(!['slice','whole'].some(m=>{const x=s.stock[p.id+':'+m];return x&&(x.onHand||x.reserved||x.sold);}), 'Zere por ajuste documentado o estoque antes de excluir.');
      s.menu=s.menu.filter(x=>x.id!==p.id);break;
    }
    case 'prices.set': money(p.slice);money(p.whole);assert(p.slice<=1000000&&p.whole<=1000000,'Preço acima do limite.');s.prices={slice:p.slice,whole:p.whole};break;
    case 'pix.set':
      assert(text(p.key,140)&&text(p.recipient,140)&&safeImage(p.qr||''),'Configuração Pix inválida.');
      s.pix={key:p.key.trim(),recipient:p.recipient.trim(),qr:p.qr||''};break;
    case 'stock.adjust': {
      assert(s.menu.some(x=>x.id===p.productId)&&['slice','whole'].includes(p.mode),'Produto/modalidade inválido.');
      assert(integer(p.delta,-100000,100000),'Quantidade inteira obrigatória.');reason();const x=stock(p.productId,p.mode);
      assert(x.onHand+p.delta>=x.reserved,'Ajuste excede o estoque livre ou compromete reservas.');
      x.onHand+=p.delta;
      if(p.limit!==undefined){assert(p.limit===null||integer(p.limit,x.reserved,100000),'Limite não pode comprometer reservas.');x.limit=p.limit;}
      if(p.delta>0)x.epoch=(x.epoch||0)+1;break;
    }
    case 'operation.pause': s.paused=true;break;
    case 'operation.resume': s.paused=false;break;
    case 'order.create': {
      assert(!s.paused,'Vendas pausadas. A administradora deve ativar o modo responsável pelas novas vendas.');
      assert(s.cashSessions.some(c=>!c.closedAt),'Abra o caixa antes de vender.');
      assert(s.pix.key,'Cadastre a chave Pix real antes de vender.');
      assert(/^[0-9a-f-]{36}$/i.test(p.idempotencyKey||''),'Identificador único de pedido inválido.');
      assert(Array.isArray(p.lines)&&p.lines.length>0&&p.lines.length<=100,'Carrinho inválido.');
      const seen=new Set();const lines=p.lines.map(l=>{
        const product=s.menu.find(x=>x.id===l.productId), k=l.productId+':'+l.mode;
        assert(product&&product.active&&!product.archived&&product.modes[l.mode]&&['slice','whole'].includes(l.mode),'Produto indisponível.');
        assert(!seen.has(k)&&integer(l.qty,1,99),'Quantidade inválida ou item duplicado.');seen.add(k);
        assert(availability(s,l.productId,l.mode)>=l.qty,'Estoque insuficiente: '+product.artistic);
        const x=stock(l.productId,l.mode);x.reserved+=l.qty;
        const costSnapshot=catalogCost(s,product,l.mode);
        return {productId:product.id,mode:l.mode,qty:l.qty,name:product.artistic||product.name,unitPrice:priceOf(s,product,l.mode),unitCost:costSnapshot.known?roundEighth(costSnapshot.eighthCents):product.cost[l.mode],costSnapshot};
      });
      s.sequence++;const o={id:'B-'+s.operationId.slice(0,8).toUpperCase()+'-'+String(s.sequence).padStart(4,'0'),idempotencyKey:p.idempotencyKey,requestLines:clone(p.lines),lines,total:lines.reduce((n,l)=>n+l.qty*l.unitPrice,0),payment:'PIX',status:'aguardando',createdAt:now,createdBy:actor.id,cashSessionId:s.cashSessions.find(c=>!c.closedAt).id};
      s.orders.push(o);break;
    }
    case 'order.pay': {
      const o=order();assert(o.status==='aguardando'&&!o.paidAt,'Pagamento já confirmado ou pedido cancelado.');
      assert(p.verified===true,'Confira o crédito na conta bancária; print não comprova recebimento.');
      const c=s.cashSessions.find(x=>!x.closedAt);assert(c,'Abra o caixa para confirmar o recebimento.');
      for(const l of o.lines){const x=stock(l.productId,l.mode);assert(x.reserved>=l.qty&&x.onHand>=l.qty,'Reserva inconsistente.');x.reserved-=l.qty;x.onHand-=l.qty;x.sold+=l.qty;if(x.limit!==null)x.limit=Math.max(0,x.limit-l.qty);}
      assert(text(p.reference||'',200),'Referência bancária longa.');
      Object.assign(o,{status:'preparando',paidAt:now,paidBy:actor.id,paidAmount:o.total,paymentReference:p.reference||'',paymentSessionId:c.id});break;
    }
    case 'order.status': {
      const o=order();assert(o.paidAt&&((o.status==='preparando'&&p.status==='pronto')||(o.status==='pronto'&&p.status==='entregue')),'Transição inválida: pagamento deve ser confirmado primeiro.');o.status=p.status;o.updatedAt=now;o.updatedBy=actor.id;break;
    }
    case 'order.cancel': {
      const o=order();reason();assert(['aguardando','preparando','pronto','entregue'].includes(o.status),'Não é possível cancelar este pedido.');
      assert(typeof p.returnStock==='boolean','Informe se o produto retorna ao estoque.');
      for(const l of o.lines){const x=stock(l.productId,l.mode);if(!o.paidAt)x.reserved-=l.qty;else if(p.returnStock){x.onHand+=l.qty;x.sold-=l.qty;if(x.limit!==null)x.limit+=l.qty;x.epoch=(x.epoch||0)+1;}}
      Object.assign(o,{status:'cancelado',cancelledAt:now,cancelledBy:actor.id,cancelReason:p.reason,returnedToStock:p.returnStock});break;
    }
    case 'refund.record': {
      const o=s.orders.find(x=>x.id===p.orderId);money(p.amount);reason();
      assert(o?.paidAt&&o.status==='cancelado','Devolução exige pedido pago cancelado.');
      assert(p.verified===true,'Confirme a transferência de devolução na conta.');
      assert(s.cashSessions.some(c=>!c.closedAt),'Abra o caixa para registrar a devolução.');
      assert(s.refunds.filter(r=>r.orderId===o.id).reduce((n,r)=>n+r.amount,0)+p.amount<=o.total,'Devolução acima do valor recebido.');
      s.refunds.push(event({orderId:o.id,amount:p.amount,reason:p.reason,cashSessionId:s.cashSessions.find(c=>!c.closedAt).id}));break;
    }
    case 'wait.add': {
      assert(s.menu.some(x=>x.id===p.productId&&x.active&&!x.archived&&x.modes.whole),'Sabor indisponível para lista.');
      assert(availability(s,p.productId,'whole')===0,'Produto já disponível: faça um pedido.');
      assert(p.consent===true&&typeof p.contact==='string'&&/^\d{10,15}$/.test(p.contact),'Informe WhatsApp com DDD e consentimento.');
      assert(!s.waitlist.some(w=>!w.cancelledAt&&w.productId===p.productId&&w.contact===p.contact),'Este contato já está na lista deste sabor.');
      s.waitlist.push(event({productId:p.productId,contact:p.contact,consentAt:now,notifiedEpoch:null}));break;
    }
    case 'wait.notify': {
      const w=s.waitlist.find(x=>x.id===p.id);assert(w&&!w.cancelledAt,'Interesse não encontrado.');
      assert(availability(s,w.productId,'whole')>0,'Sem estoque: não avise disponibilidade.');
      assert(s.menu.some(p=>p.id===w.productId&&p.active&&!p.archived&&p.modes.whole),'Sabor não está à venda.');
      const epoch=stock(w.productId,'whole').epoch||0;
      assert(w.notifiedEpoch!==epoch,'Contato já marcado como avisado nesta reposição.');
      assert(p.confirmed===true,'Confirme o envio manual pelo WhatsApp antes de marcar.');
      w.notifiedEpoch=epoch;w.notifiedAt=now;w.notifiedBy=actor.id;break;
    }
    case 'wait.cancel': {
      const w=s.waitlist.find(x=>x.id===p.id);assert(w,'Interesse não encontrado.');
      w.cancelledAt=now;w.contact='';break;
    }
    case 'expense.add': {
      money(p.amount);assert(text(p.description,500)&&p.description.trim()&&typeof p.paid==='boolean','Despesa inválida.');
      const detail=p.product!==undefined;
      let fields={};
      if(detail){
        assert(text(p.product,140)&&p.product.trim(),'Informe o produto ou serviço.');
        assert(/^\d{4}-\d{2}-\d{2}$/.test(p.purchaseDate||'')&&!Number.isNaN(Date.parse(p.purchaseDate))&&new Date(p.purchaseDate+'T00:00:00Z').toISOString().slice(0,10)===p.purchaseDate,'Data da compra inválida.');
        assert(['kg','un','L'].includes(p.unit),'Selecione quilo, unidade ou litro.');
        assert(integer(p.unitPrice,1,100000000)&&integer(p.qtyMilli,1,10000000),'Preço unitário ou quantidade inválida.');
        if(p.unit==='un')assert(p.qtyMilli%1000===0,'A quantidade de unidades deve ser inteira.');
        assert(Math.round(p.unitPrice*p.qtyMilli/1000)===p.amount,'Total divergente: confira preço e quantidade.');
        assert(['cash','person','pending'].includes(p.payerSource),'Informe quem pagou.');
        assert(p.paid===(p.payerSource!=='pending'),'Origem do pagamento inconsistente.');
        assert(text(p.payerName||'',140)&&text(p.destination||'',400),'Dados de responsável ou finalidade muito longos.');
        assert(p.payerSource!=='person'||String(p.payerName||'').trim(),'Identifique a pessoa que deve receber o reembolso.');
        assert(p.payerSource==='person'||!String(p.payerName||'').trim(),'Nome da pessoa deve ser preenchido somente quando ela pagou.');
        fields={product:p.product.trim(),purchaseDate:p.purchaseDate,unit:p.unit,unitPrice:p.unitPrice,qtyMilli:p.qtyMilli,
          payerSource:p.payerSource,payerName:String(p.payerName||'').trim(),destination:String(p.destination||'').trim()};
      }
      s.expenses.push(event({description:p.description,amount:p.amount,paid:p.paid,...fields}));break;
    }
    case 'expense.pay': {
      const x=s.expenses.find(x=>x.id===p.id);assert(x&&!x.paid,'Despesa inexistente ou já paga.');
      assert(p.verified===true,'Confirme que a despesa foi paga.');
      if(x.product!==undefined){
        assert(['cash','person'].includes(p.payerSource),'Informe a origem do pagamento.');
        assert(p.payerSource!=='person'||text(p.payerName,140)&&p.payerName.trim(),'Identifique a pessoa que pagou.');
        x.payerSource=p.payerSource;x.payerName=p.payerSource==='person'?p.payerName.trim():'';
      }
      x.paid=true;x.paidAt=now;x.paidBy=actor.id;break;
    }
    case 'expense.reimburse': {
      const x=s.expenses.find(x=>x.id===p.id);
      assert(x&&x.paid&&x.payerSource==='person'&&!x.reimbursedAt,'Despesa sem reembolso pendente.');
      assert(p.verified===true,'Marque OK somente após realizar e conferir a devolução.');
      assert(text(p.reference||'',200),'Observação de devolução muito longa.');
      x.reimbursedAt=now;x.reimbursedBy=actor.id;x.reimbursementReference=p.reference||'';break;
    }
    case 'person.save': {
      assert(text(p.name,140)&&p.name.trim()&&text(p.pixKey||'',140),'Nome ou chave Pix inválidos.');
      s.people??=[];
      assert(s.people.length<1000 || s.people.some(x=>x.id===p.id),'Limite de 1.000 pessoas.');
      const clean=p.name.trim(),key=clean.toLocaleLowerCase('pt-BR');
      assert(!s.people.some(x=>x.id!==p.id&&x.name.toLocaleLowerCase('pt-BR')===key),'Pessoa já cadastrada. Edite o cadastro existente.');
      const existing=s.people.find(x=>x.id===p.id);
      if(existing){existing.name=clean;existing.pixKey=String(p.pixKey||'').trim();existing.updatedAt=now;existing.updatedBy=actor.id;}
      else{s.people.push({id:uid(),name:clean,pixKey:String(p.pixKey||'').trim(),createdAt:now,createdBy:actor.id});}
      break;
    }
    case 'debt.add': {
      money(p.amount);
      assert(text(p.personName,140)&&p.personName.trim()&&text(p.reason,400)&&p.reason.trim(),'Identifique o devedor e o motivo da cobrança.');
      assert(/^\d{4}-\d{2}-\d{2}$/.test(p.date||'')&&!Number.isNaN(Date.parse(p.date+'T00:00:00Z'))&&new Date(p.date+'T00:00:00Z').toISOString().slice(0,10)===p.date,'Data inválida.');
      assert(text(p.dueDate||'',10)&&(!p.dueDate||/^\d{4}-\d{2}-\d{2}$/.test(p.dueDate)&&!Number.isNaN(Date.parse(p.dueDate+'T00:00:00Z'))&&new Date(p.dueDate+'T00:00:00Z').toISOString().slice(0,10)===p.dueDate),'Vencimento inválido.');
      s.debts??=[];
      assert(s.debts.length<10000,'Limite de 10.000 pendências.');
      s.debts.push(event({personName:p.personName.trim(),reason:p.reason.trim(),amount:p.amount,date:p.date,dueDate:p.dueDate||'',receipts:[]}));break;
    }
    case 'debt.receive': {
      const d=(s.debts||[]).find(x=>x.id===p.id);assert(d,'Devedor não encontrado.');money(p.amount);
      const remaining=d.amount-(d.receipts||[]).reduce((n,x)=>n+x.amount,0);
      assert(p.amount<=remaining,'Valor recebido supera o saldo pendente.');
      assert(p.verified===true,'Confirme o recebimento real antes de marcar OK.');
      assert(text(p.reference||'',200),'Referência muito longa.');
      d.receipts??=[];d.receipts.push(event({amount:p.amount,reference:p.reference||''}));break;
    }
    case 'contribution.add':
      money(p.amount);assert(text(p.name,140)&&p.name.trim(),'Identifique o aluno.');
      s.contributions.push(event({name:p.name,amount:p.amount}));break;
    case 'return.add': {
      const c=s.contributions.find(x=>x.id===p.contributionId);money(p.amount);assert(c,'Aporte não encontrado.');
      assert(s.returns.filter(r=>r.contributionId===c.id).reduce((n,r)=>n+r.amount,0)+p.amount<=c.amount,'Devolução superior ao aporte.');
      s.returns.push(event({contributionId:c.id,amount:p.amount}));break;
    }
    case 'cash.open':
      assert(!s.cashSessions.some(c=>!c.closedAt),'Já existe caixa aberto.');
      assert(text(p.note||'',500),'Observação longa.');
      s.cashSessions.push({id:uid(),openedAt:now,openedBy:actor.id,note:p.note||''});break;
    case 'cash.close': {
      const c=s.cashSessions.find(x=>x.id===p.id&&!x.closedAt);assert(c,'Caixa já fechado ou inexistente.');
      assert(integer(p.counted,0,1e10)&&text(p.note||'',500),'Fechamento inválido.');
      const received=s.orders.filter(o=>o.paymentSessionId===c.id&&o.paidAt).reduce((n,o)=>n+o.total,0);
      const refunds=s.refunds.filter(r=>r.cashSessionId===c.id).reduce((n,r)=>n+r.amount,0);
      Object.assign(c,{closedAt:now,closedBy:actor.id,received,refunded:refunds,expected:received-refunds,counted:p.counted,difference:p.counted-(received-refunds),closeNote:p.note||''});break;
    }
    default: throw Error('Operação não reconhecida.');
  }
  s.revision++;
  // Não duplicar contatos nem informação bancária no log técnico.
  const detail=['wait.add','pix.set','person.save'].includes(command.type)?{type:command.type}:clone(p);
  s.audit.push({id:uid(),requestId:command.requestId,command:['wait.add','pix.set','person.save'].includes(command.type)?undefined:JSON.stringify(command),type:command.type,detail,actor:actor.id,role:actor.role,createdAt:now,revision:s.revision});
  return s;
}

export function validateState(s) {
  assert(s?.version===2 && integer(s.revision) && integer(s.sequence) && /^[0-9a-f-]{36}$/i.test(s.operationId||''),'Backup incompatível.');
  assert(typeof s.paused==='boolean' && integer(s.prices?.slice,1,1000000)&&integer(s.prices?.whole,1,1000000),'Preços/situação inválidos.');
  for(const k of ['menu','orders','waitlist','expenses','contributions','returns','refunds','audit','cashSessions'])assert(Array.isArray(s[k])&&s[k].length<=100000,'Coleção inválida: '+k);
  s.menu.forEach(validateProduct);assert(new Set(s.menu.map(p=>p.id)).size===s.menu.length,'Sabores duplicados.');
  assert(s.pix&&text(s.pix.key,140)&&text(s.pix.recipient,140)&&safeImage(s.pix.qr),'Pix inválido.');
  for(const [k,x] of Object.entries(s.stock))assert(/^[a-zA-Z0-9_-]+:(slice|whole)$/.test(k)&&integer(x.onHand,0,1e7)&&integer(x.reserved,0,x.onHand)&&integer(x.sold,0,1e7)&&(x.limit===null||integer(x.limit,x.reserved,100000)),'Estoque inválido.');
  const reserved={};
  for(const o of s.orders){
    assert(text(o.id,100)&&text(o.idempotencyKey,100)&&['aguardando','preparando','pronto','entregue','cancelado'].includes(o.status)&&o.payment==='PIX'&&Array.isArray(o.lines)&&o.lines.length>0,'Pedido inválido.');
    let total=0;for(const l of o.lines){assert(s.menu.some(p=>p.id===l.productId)&&['slice','whole'].includes(l.mode)&&integer(l.qty,1,99)&&integer(l.unitPrice,1,1000000)&&integer(l.unitCost,0,1000000)&&text(l.name,120),'Item inválido.');if(l.costSnapshot!==undefined)validateCostSnapshot(l.costSnapshot,l.mode);assert(!l.costSnapshot?.known||l.unitCost===roundEighth(l.costSnapshot.eighthCents),'Custo compatível divergente.');total+=l.qty*l.unitPrice;if(o.status==='aguardando')reserved[l.productId+':'+l.mode]=(reserved[l.productId+':'+l.mode]||0)+l.qty;}
    assert(total===o.total,'Total de pedido inconsistente.');assert(!['preparando','pronto','entregue'].includes(o.status)||!!o.paidAt,'Pedido de cozinha sem pagamento.');
  }
  assert(new Set(s.orders.map(o=>o.id)).size===s.orders.length && new Set(s.orders.map(o=>o.idempotencyKey)).size===s.orders.length,'Pedidos duplicados.');
  for(const [k,x] of Object.entries(s.stock))assert(x.reserved===(reserved[k]||0),'Reservas divergentes.');
  for(const [k,v] of Object.entries(reserved))assert(s.stock[k]?.reserved===v,'Reserva ausente.');
  for(const w of s.waitlist)assert(text(w.id,100)&&s.menu.some(p=>p.id===w.productId)&&((w.cancelledAt&&w.contact==='')||/^\d{10,15}$/.test(w.contact))&&!!w.consentAt,'Lista de espera inválida.');
  for(const k of ['expenses','contributions','returns','refunds'])for(const x of s[k])assert(integer(x.amount,1,100000000),'Lançamento financeiro inválido.');
  for(const e of s.expenses){
    if(e.product===undefined)continue; // backup antigo, preservado sem inventar pagador ou pesos
    assert(text(e.product,140)&&!!e.product.trim()&&/^\d{4}-\d{2}-\d{2}$/.test(e.purchaseDate||'')&&
      !Number.isNaN(Date.parse(e.purchaseDate))&&new Date(e.purchaseDate+'T00:00:00Z').toISOString().slice(0,10)===e.purchaseDate,
      'Compra detalhada com data/produto inválidos.');
    assert(['kg','un','L'].includes(e.unit)&&integer(e.unitPrice,1,100000000)&&integer(e.qtyMilli,1,10000000)&&
      (e.unit!=='un'||e.qtyMilli%1000===0)&&Math.round(e.unitPrice*e.qtyMilli/1000)===e.amount,
      'Quantidade, preço ou total de compra inconsistentes.');
    assert(['cash','person','pending'].includes(e.payerSource)&&typeof e.paid==='boolean'&&
      (e.paid||e.payerSource==='pending')&&(e.payerSource!=='person'||e.paid&&text(e.payerName,140)&&!!e.payerName.trim())&&
      text(e.destination||'',400),'Origem do pagamento inválida.');
    assert(!e.reimbursedAt||e.payerSource==='person'&&e.paid&&text(e.reimbursedBy,140),'Reembolso inconsistente.');
  }
  // Coleções facultativas para compatibilidade com backups anteriores sem cadastro de pessoas ou devedores.
  assert(s.people===undefined||Array.isArray(s.people)&&s.people.length<=1000,'Pessoas inválidas.');
  assert(s.debts===undefined||Array.isArray(s.debts)&&s.debts.length<=10000,'Cobranças inválidas.');
  for(const person of s.people||[]){
    assert(/^[0-9a-f-]{36}$/i.test(person.id)&&text(person.name,140)&&!!person.name.trim()&&text(person.pixKey||'',140),'Cadastro de Pix inválido.');
  }
  for(const debt of s.debts||[]){
    assert(text(debt.personName,140)&&!!debt.personName.trim()&&text(debt.reason,400)&&!!debt.reason.trim()&&integer(debt.amount,1,100000000)&&Array.isArray(debt.receipts),'Pendência de cobrança inválida.');
    const total=debt.receipts.reduce((n,r)=>{assert(integer(r.amount,1,100000000),'Recebimento de cobrança inválido.');return n+r.amount;},0);
    assert(total<=debt.amount,'Recebimento excede a cobrança.');
  }
  for(const c of s.contributions)assert(s.returns.filter(r=>r.contributionId===c.id).reduce((n,r)=>n+r.amount,0)<=c.amount,'Retorno superior ao aporte.');
  for(const r of s.returns)assert(s.contributions.some(c=>c.id===r.contributionId),'Retorno sem aporte.');
  for(const o of s.orders)assert(s.refunds.filter(r=>r.orderId===o.id).reduce((n,r)=>n+r.amount,0)<=(o.paidAt?o.total:0),'Estorno superior ao recebido.');
  for(const r of s.refunds)assert(s.orders.some(o=>o.id===r.orderId&&o.status==='cancelado'&&o.paidAt),'Estorno sem cancelamento pago.');
  assert(s.cashSessions.filter(c=>!c.closedAt).length<=1,'Dois caixas abertos.');
  if(s.pitchSettings!==undefined){const p=s.pitchSettings;for(const k of ['initialInvestment','fixedCosts','otherSlice','otherWhole'])assert(p[k]===null||integer(p[k],0,100000000),'Base de cálculo inválida.');assert((p.feeBps===null||integer(p.feeBps,0,10000))&&typeof p.productionComplete==='boolean','Premissas inválidas.');}
  if(s.production!==undefined){assert(Array.isArray(s.production)&&s.production.length<=100000,'Produção inválida.');for(const p of s.production)assert(s.menu.some(x=>x.id===p.productId)&&integer(p.pizzas,1,100000)&&text(p.reason,500)&&!!p.reason.trim()&&text(p.actor,140)&&!!p.createdAt,'Produção sem origem.');}
  if(s.recipes!==undefined){assert(s.recipes&&typeof s.recipes==='object'&&!Array.isArray(s.recipes)&&Object.keys(s.recipes).length<=100,'Fichas inválidas.');for(const [id,r] of Object.entries(s.recipes)){assert(s.menu.some(p=>p.id===id)&&r.productId===id&&/^[0-9a-f-]{36}$/i.test(r.revision)&&text(r.updatedBy,140)&&!!r.updatedAt,'Ficha sem identidade válida.');validateRecipe(r);}}
  assert(s.paymentFees===undefined||Array.isArray(s.paymentFees)&&s.paymentFees.length<=100000,'Taxas inválidas.');
  for(const f of s.paymentFees||[]){const o=s.orders.find(x=>x.id===f.orderId);assert(o?.paidAt&&integer(f.amount,0,o.total)&&text(f.reason,300)&&f.reason.trim().length>=3&&text(f.actor,140)&&!!f.createdAt&&/^[0-9a-f-]{36}$/i.test(f.id),'Taxa sem conferência válida.');if(f.expenseId){const e=s.expenses.find(x=>x.id===f.expenseId);assert(e?.paid&&e.payerSource!=='person','Taxa vinculada sem despesa paga pelo caixa.');}}
  const latestFees=new Map((s.paymentFees||[]).map(f=>[f.orderId,f]));for(const e of s.expenses)assert([...latestFees.values()].filter(f=>f.expenseId===e.id).reduce((n,f)=>n+f.amount,0)<=e.amount,'Taxas vinculadas excedem a despesa.');
  return true;
}
export function financialResults(s){return calculateResults(s,totals(s));}
