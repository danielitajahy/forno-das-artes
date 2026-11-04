import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initial,reduce,totals,validateState,uid} from '../app/core.js';
const admin={id:'GESTORA TESTE',role:'admin'};
function env(){let s=initial();return {send:(type,payload={})=>{s=reduce(s,{type,payload,requestId:uid(),expectedRevision:s.revision},admin);validateState(s);return s},state:()=>s};}
test('cadastro de Pix individual, edição e proteção contra duplicidade',()=>{
 const h=env();h.send('person.save',{name:'PESSOA FICTICIA',pixKey:'email.ficticio@example.invalid'});
 let p=h.state().people[0];assert.equal(p.name,'PESSOA FICTICIA');assert.equal(p.pixKey,'email.ficticio@example.invalid');
 h.send('person.save',{id:p.id,name:'PESSOA FICTICIA',pixKey:'chave-aleatoria-ficticia'});
 p=h.state().people[0];assert.equal(p.pixKey,'chave-aleatoria-ficticia');assert.equal(h.state().people.length,1);
 assert.throws(()=>h.send('person.save',{name:'pietra',pixKey:'outro'}),/já cadastrada/);
 const audit=h.state().audit.map(x=>JSON.stringify(x)).join(' ');
 assert.ok(!audit.includes('chave-aleatoria-ficticia'),'Pix não deve vazar no log de auditoria');
});
test('pendência de devedor soma saldo e aceita pagamentos parciais com confirmação',()=>{
 const h=env();h.send('debt.add',{date:'2026-11-01',personName:'DEVEDOR TESTE',reason:'Deve ao projeto',amount:25000,dueDate:'2026-11-06'});
 const d=h.state().debts[0];assert.equal(totals(h.state()).debtsDue,25000);assert.equal(totals(h.state()).balance,0);
 assert.throws(()=>h.send('debt.receive',{id:d.id,amount:8000,verified:false}),/Confirme o recebimento/);
 h.send('debt.receive',{id:d.id,amount:8000,verified:true,reference:'SIMULAÇÃO'});
 assert.equal(totals(h.state()).debtsDue,17000);assert.equal(totals(h.state()).balance,0);
 h.send('debt.receive',{id:d.id,amount:17000,verified:true,reference:'SIMULAÇÃO'});
 assert.equal(totals(h.state()).debtsDue,0);assert.equal(totals(h.state()).debtsReceived,25000);
 assert.throws(()=>h.send('debt.receive',{id:d.id,amount:100,verified:true}),/supera o saldo/);
});
test('dados financeiros e chaves Pix não podem ser alterados por caixa/cozinha',()=>{
 let s=initial();for(const role of ['cashier','kitchen']){
   assert.throws(()=>reduce(s,{type:'person.save',payload:{name:'X',pixKey:'email'},requestId:uid(),expectedRevision:0},{id:'OPERADOR',role}),/Permissão insuficiente/);
   assert.throws(()=>reduce(s,{type:'debt.add',payload:{personName:'X',reason:'Dívida',amount:100},requestId:uid(),expectedRevision:0},{id:'OPERADOR',role}),/Permissão insuficiente/);
 }
});
test('backup legado ainda é válido sem coleções opcionais',()=>{
 const h=env();const s=h.state();delete s.people;delete s.debts;assert.equal(validateState(s),true);
 h.send('person.save',{name:'ALUNO TESTE',pixKey:''});assert.equal(h.state().people.length,1);
});
test('interface contém cadastro, controle de cobrança e demonstração, mas não campos pessoais no publicView',()=>{
 const ui=readFileSync(new URL('../app/ui.js',import.meta.url),'utf8');
 const demo=readFileSync(new URL('../docs/DEMO-FILA.html',import.meta.url),'utf8');
 for(const x of ['Pessoas e chaves Pix','Devedores — valores a receber','Copiar chave Pix','Saldo pendente de cobrança','Marcar','debt.receive','person.save'])assert.ok(ui.includes(x),x);
 const pub=ui.split('function publicView(s)')[1].split('async function refresh')[0];
 assert.ok(!pub.includes('people:')&&!pub.includes('debts:'),'Dados pessoais não podem estar na projeção pública');
 for(const x of ['DEMONSTRAÇÃO INTERATIVA','PREPARANDO','PRONTO PARA RETIRAR','pix','deliver'])assert.ok(demo.toLowerCase().includes(x.toLowerCase()),x);
});
