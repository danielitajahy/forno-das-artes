import test from 'node:test';
import assert from 'node:assert/strict';
import {initial, reduce, totals, validateState, uid} from '../app/core.js';
import {readFileSync} from 'node:fs';

const actor={id:'ADMINISTRADORA_TESTE',role:'admin'};
function fixture(){
  let s=initial();
  const send=(type,payload={},expected=s.revision)=>{s=reduce(s,{type,payload,expectedRevision:expected,requestId:uid()},actor);validateState(s);return s;};
  return {send,get state(){return s;}};
}
const purchase=(updates={})=>({description:'Uber materiais',product:'Uber',purchaseDate:'2026-11-01',unit:'un',unitPrice:25000,qtyMilli:1000,amount:25000,paid:true,payerSource:'person',payerName:'PESSOA FICTICIA',destination:'Transporte de materiais',...updates});

test('compra de R$250 paga por pessoa é despesa, não aporte e não saída de caixa até reembolso',()=>{
 const h=fixture();h.send('expense.add',purchase());const t=totals(h.state);
 assert.equal(t.expensesAll,25000);assert.equal(t.expensesPaidCash,0);assert.equal(t.reimbursementDue,25000);assert.equal(t.contributions,0);assert.equal(t.balance,0);
 const e=h.state.expenses[0];assert.equal(e.payerName,'PESSOA FICTICIA');assert.equal(e.destination,'Transporte de materiais');
 h.send('expense.reimburse',{id:e.id,verified:true,reference:'Transferência fictícia'});
 const t2=totals(h.state);assert.equal(t2.reimbursementDue,0);assert.equal(t2.reimbursed,25000);assert.equal(t2.balance,-25000);
 assert.ok(h.state.expenses[0].reimbursedAt);assert.equal(h.state.expenses[0].reimbursedBy,actor.id);
 assert.throws(()=>h.send('expense.reimburse',{id:e.id,verified:true}),/sem reembolso pendente/);
});
test('compra por quilo usa valor unitário e peso para calcular total em centavos',()=>{
 const h=fixture();h.send('expense.add',purchase({product:'Muçarela',description:'Muçarela',unit:'kg',unitPrice:2990,qtyMilli:750,amount:2243,payerSource:'cash',payerName:'',destination:'Recheio'}));
 assert.equal(h.state.expenses[0].amount,2243);assert.equal(totals(h.state).expensesPaidCash,2243);
 assert.throws(()=>h.send('expense.add',purchase({unit:'kg',unitPrice:2990,qtyMilli:750,amount:2242})),/Total divergente/);
 assert.throws(()=>h.send('expense.add',purchase({unit:'un',qtyMilli:500,amount:12500})),/inteira/);
});
test('reembolso exige confirmação e fica ligado a uma compra paga por pessoa',()=>{
 const h=fixture();h.send('expense.add',purchase());const id=h.state.expenses[0].id;
 assert.throws(()=>h.send('expense.reimburse',{id,verified:false}),/confira|conferir|devolução/i);
 assert.equal(h.state.expenses[0].reimbursedAt,undefined);
});
test('aportes de alunos e compras adiantadas são obrigações separadas sem duplicidade',()=>{
 const h=fixture();h.send('expense.add',purchase({payerName:'ADMINISTRACAO FICTICIA'}));h.send('contribution.add',{name:'ALUNA TESTE',amount:5000});
 let t=totals(h.state);assert.equal(t.reimbursementDue,25000);assert.equal(t.contributionsDue,5000);
 const id=h.state.contributions[0].id;h.send('return.add',{contributionId:id,amount:2000});t=totals(h.state);
 assert.equal(t.reimbursementDue+t.contributionsDue,28000);
});
test('legado sem dados de pagador permanece válido e não é reclassificado',()=>{
 const h=fixture();h.send('expense.add',{description:'Despesa legada',amount:850,paid:true});
 assert.equal(h.state.expenses[0].payerSource,undefined);assert.equal(totals(h.state).expensesPaidCash,850);
 assert.equal(validateState(h.state),true);
});
test('compras previstas somente viram obrigação após pagamento por pessoa',()=>{
 const h=fixture();h.send('expense.add',purchase({paid:false,payerSource:'pending',payerName:''}));
 assert.equal(totals(h.state).reimbursementDue,0);let id=h.state.expenses[0].id;
 h.send('expense.pay',{id,verified:true,payerSource:'person',payerName:'PESSOA FICTICIA'});
 assert.equal(totals(h.state).reimbursementDue,25000);
});
test('campos e relatório detalhado existem na interface, sem expor registros automaticamente',()=>{
 const ui=readFileSync(new URL('../app/ui.js',import.meta.url),'utf8');
 for(const label of ['Data da compra','Produto ou serviço','Valor unitário','Quantidade/peso','Total calculado','Quem pagou','Confirmar devolução (OK)','Exportar pendências e reembolsos CSV'])assert.ok(ui.includes(label),label);
 assert.ok(ui.includes('store.mode===\'offline\''));
});
