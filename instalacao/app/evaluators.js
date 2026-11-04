// Projeção por lista permitida: não devolve pessoas, credenciais, pedidos ou textos livres financeiros.
import {financialResults,availability} from './core.js';
import {ingredientCents} from './finance-results.js';
const sum=(a,f)=>a.reduce((n,x)=>n+f(x),0);
export function evaluatorReport(s,at=new Date().toISOString()){
 const f=financialResults(s),p=s.pitchSettings||{},productionComplete=p.productionComplete===true;
 const productionRegistered=sum(s.production||[],x=>x.pizzas);
 const freeCash=f.cashAfterFees===null?null:Math.max(0,f.cashAfterFees-f.refundDue-f.reimbursementDue-f.plannedExpenses);
 const forCapital=freeCash===null?null:Math.min(f.contributionsDue,freeCash);
 const donation=freeCash===null||f.projected===null?null:Math.max(0,Math.min(f.projected,freeCash-f.contributionsDue));
 const metric=(id,label,value,formula,unit='money')=>({id,label,value,formula,unit});
 const metrics=[
 metric('investment','Investimento inicial declarado',p.initialInvestment??null,'Base declarada pela administração; não é inferida de aportes ou compras. Não é somada novamente ao caixa.'),
 metric('capital','Aportes dos alunos',f.contributions,'Soma dos aportes registrados. Capital recebido, separado de receitas.'),
 metric('paidExpenses','Despesas pagas',f.paidExpenses,'Soma de despesas com pagamento confirmado, incluindo as adiantadas por terceiros.'),
 metric('plannedExpenses','Despesas previstas',f.plannedExpenses,'Soma de despesas ainda não pagas.'),
 metric('capitalDue','Aportes ainda a devolver',f.contributionsDue,'Aportes menos devoluções de capital já registradas.'),
 metric('reimbursement','Reembolsos pendentes',f.reimbursementDue,'Compras pagas por pessoas, sem reembolso confirmado. Não são novos aportes.'),
 metric('production','Pizzas produzidas · 35 cm',productionComplete?productionRegistered:null,'Soma do registro explícito de produção; só representa o total quando a administração confirma a abrangência. Estoque não comprova produção.','count'),
 metric('slicesProduced','Fatias equivalentes produzidas',productionComplete?productionRegistered*8:null,'Pizzas produzidas × 8. Equivalência, não quantidade efetivamente cortada.','count'),
 metric('paidOrders','Pedidos pagos válidos',s.orders.filter(o=>o.paidAt&&o.status!=='cancelado').length,'Contagem de pedidos com pagamento confirmado, excluídos os cancelados.','count'),
 metric('gross','Recebimentos brutos',f.grossPaid,'Soma dos pedidos com paidAt. Recebimentos posteriormente devolvidos permanecem aqui e são deduzidos abaixo; aguardando Pix não conta.'),
 metric('validSales','Vendas pagas válidas',f.validPaidSales,'Soma dos pedidos pagos que não foram cancelados.'),
 metric('refunds','Estornos realizados',f.refunds,'Soma de devoluções efetivamente registradas após conferência.'),
 metric('fees','Taxas comprovadas',f.completeFees?f.knownFees:null,`Soma da última taxa conferida por recebimento; ${f.unknownFees} recebimento(s) sem taxa conferida. Zero não é presumido.`),
 metric('net','Recebimentos líquidos',f.netAfterFees,'Recebimentos brutos − estornos realizados − taxas comprovadas. Depende de conferir todos os recebimentos.'),
 metric('refundDue','Estornos ainda devidos',f.refundDue,'Total de pedidos pagos cancelados menos estornos já realizados.'),
 metric('cash','Saldo do caixa após taxas',f.cashAfterFees,'Recebimentos − estornos − despesas pagas pelo caixa − reembolsos pagos + aportes − devoluções de capital − taxas ainda não incluídas em despesas. Não é saldo bancário conciliado.'),
 metric('realized','Resultado operacional realizado',f.realized,'Recebimentos líquidos − estornos ainda devidos − despesas pagas + taxas já incluídas nas despesas (evita duplicação). Não deduz custo de produção novamente.'),
 metric('projected','Resultado operacional projetado',f.projected,'Resultado realizado − despesas previstas. Critério por despesas, distinto da margem por produto.'),
 metric('forCapital','Caixa disponível para devolver aportes',forCapital,'Menor entre aportes ainda devidos e máximo de zero ou caixa após taxas − estornos devidos − reembolsos pendentes − despesas previstas. Disponibilidade, não transferência realizada.'),
 metric('donation','Disponibilidade para futura doação',donation,'Máximo de zero ou menor entre resultado projetado e caixa após reservar estornos, reembolsos, despesas previstas e aportes a devolver. Previsão, não doação realizada.')];
 const rows=f.rows.map(r=>{
 const produced=sum((s.production||[]).filter(x=>x.productId===r.id),x=>x.pizzas);
 return {name:r.name,productionCents:r.productionCents,pizzasProduced:productionComplete?produced:null,slicesEquivalent:productionComplete?produced*8:null,
 ingredients:r.recipe?r.recipe.ingredients.map(i=>({name:i.name,quantityMilli:i.quantityMilli,unit:i.unit,priceUnit:i.priceUnit,unitCostCents:i.unitCostCents,costCents:ingredientCents(i)})):null,
 grossMargin:r.grossMarginCents,accumulated:r.accumulatedCents,
 modes:['slice','whole'].map(mode=>{const m=r.modes[mode],other=mode==='slice'?p.otherSlice:p.otherWhole;
 const contribution=m.cost.known&&other!=null&&p.feeBps!=null?m.price-m.unitCostCents-Math.round(m.price*p.feeBps/10000)-other:null;
 const breakEven=p.fixedCosts!=null&&contribution!==null&&contribution>0?Math.ceil(p.fixedCosts/contribution):null;
 return {mode,price:m.price,unitCost:m.unitCostCents,packaging:r.recipe?.packaging[mode]??null,legacyCost:m.cost.source==='legacy',sold:m.quantity,available:availability(s,r.id,mode),reserved:s.stock[r.id+':'+mode]?.reserved||0,unitMargin:m.unitMarginCents,marginPercent:m.marginPercent,revenue:m.revenue,grossMargin:m.grossMarginCents,accumulated:m.accumulatedCents,breakEven,contribution,fixedCosts:p.fixedCosts??null,feeBps:p.feeBps??null,otherVariable:other??null};})};});
 return {version:1,revision:s.revision,at,source:'Dados locais · este navegador e notebook; não sincroniza entre aparelhos',metrics,rows,productionRegistered,productionComplete};
}
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>n===null?'Não apurado':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n/100);
const number=n=>n===null?'Não apurado':new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3}).format(n);
const calc=(value,formula,unit='money')=>`<strong>${unit==='money'?money(value):number(value)}</strong><details class="calculation"><summary>Ver cálculo</summary><p>${esc(formula)}</p></details>`;
export function reportBody(r){return `<div class="pitch-heading"><p class="kick">Forno das Artes · prestação de contas</p><h2>Painel dos Avaliadores</h2>${r.demo?'<p class="pitch-note"><strong>EXEMPLO FICTÍCIO PARA CONFERÊNCIA — NÃO REPRESENTA OS DADOS REAIS DA FEIRA</strong></p>':''}<p>${esc(r.source)}</p><p>Retrato em ${esc(new Date(r.at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}))} · horário de Brasília · revisão ${r.revision}</p></div>
 <p class="pitch-note">Margem bruta, resultado operacional e saldo do caixa são indicadores diferentes. Custos ausentes não são zero. Valores consolidados; nenhuma movimentação bancária é realizada nesta tela.</p>
 <div class="pitch-metrics">${r.metrics.map(m=>`<article class="card pitch-metric" data-metric="${m.id}"><h3>${esc(m.label)}</h3>${calc(m.value,m.formula,m.unit)}</article>`).join('')}</div>
 <details class="pitch-cost-details" open><summary>Ver produção, fichas técnicas, custos e margens por sabor</summary><h3>Produção, estoque e margens por sabor</h3><p>Produção registrada: ${number(r.productionRegistered)} pizza(s). ${r.productionComplete?'Abrangência confirmada pela administração.':'Total da produção: Não apurado; os registros podem ser parciais.'} O lançamento de produção é documental e não altera o estoque.</p>
 ${r.rows.map(row=>`<article class="card pitch-flavor"><h3>${esc(row.name)}</h3><div class="pitch-metrics"><div><h4>Custo da pizza de 35 cm, sem embalagem</h4>${calc(row.productionCents,'Soma dos ingredientes: quantidade × custo por unidade, com conversão g/kg e ml/L. Não inclui embalagem, energia ou mão de obra ausentes.')}</div><div><h4>Pizzas produzidas</h4>${calc(row.pizzasProduced,'Registro explícito de produção por sabor, com abrangência confirmada.','count')}</div><div><h4>Fatias equivalentes produzidas</h4>${calc(row.slicesEquivalent,'Pizzas produzidas deste sabor × 8.','count')}</div></div>
 <div class="scroll"><table><thead><tr><th>Indicador</th><th>Fatia</th><th>Inteira/congelada</th></tr></thead><tbody>${[
 ['Preço atual','price','money','Preço individual do sabor; se vazio, preço geral. Somente novas vendas usam o preço atual.'],
 ['Custo unitário com embalagem','unitCost','money','Fatia = produção ÷ 8 + uma embalagem de fatia; inteira = produção + uma embalagem de inteira. Custo manual legado já é total e não recebe outra embalagem.'],
 ['Embalagem da modalidade','packaging','money','Custo explicitamente cadastrado por unidade vendida; não somado duas vezes. Ausente no custo legado: Não apurado.'],
 ['Quantidade vendida válida','sold','count','Soma das quantidades de pedidos pagos não cancelados, por modalidade.'],
 ['Quantidade disponível','available','count','Máximo de zero ou menor entre físico − reservas e limite − reservas. Sem limite usa somente físico − reservas.'],
 ['Quantidade reservada','reserved','count','Unidades em pedidos aguardando pagamento. Não são receita.'],
 ['Margem bruta unitária atual','unitMargin','money','Preço atual − custo unitário atual. Não inclui despesas e taxas; não representa lucro líquido.'],
 ['Receita histórica válida','revenue','money','Quantidade × preço registrado no pedido pago, excluídos cancelados.'],
 ['Margem bruta histórica','grossMargin','money','Receita histórica válida − custo histórico dos itens vendidos. Compras não são descontadas novamente neste indicador.'],
 ['Resultado acumulado por produto','accumulated','money','Margem bruta histórica menos perdas conhecidas dos cancelamentos sem retorno físico. Não é somado ao resultado operacional.'],
 ['Ponto de equilíbrio · unidades','breakEven','count','Teto de custos fixos ÷ (preço − custo unitário − taxa variável − demais custos variáveis). Hipótese de venda exclusiva desta modalidade/sabor, não soma entre sabores. Exige todas as premissas cadastradas e contribuição positiva.']
 ].map(([title,key,unit,formula])=>`<tr><th>${title}</th>${row.modes.map(m=>`<td>${calc(m[key],formula,unit)}${key==='breakEven'?`<small>Fixos: ${money(m.fixedCosts)}; taxa: ${m.feeBps===null?'Não apurada':number(m.feeBps/100)+'%'}; outros/un.: ${money(m.otherVariable)}; contribuição: ${money(m.contribution)}</small>`:''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <h4>Ficha técnica por pizza de 35 cm</h4>${row.ingredients?`<div class="scroll"><table><thead><tr><th>Ingrediente</th><th>Quantidade</th><th>Custo unitário</th><th>Custo na pizza</th></tr></thead><tbody>${row.ingredients.map(i=>`<tr><td>${esc(i.name)}</td><td>${number(i.quantityMilli/1000)} ${esc(i.unit)}</td><td>${money(i.unitCostCents)}/${esc(i.priceUnit)}</td><td>${calc(i.costCents,'Quantidade × custo unitário, convertidos para a mesma unidade; arredondamento por ingrediente ao centavo.')}</td></tr>`).join('')}</tbody></table></div>`:'<p>Não apurado — ficha ainda não cadastrada.</p>'}
 <details class="calculation"><summary>Ver cálculo da margem consolidada deste sabor</summary><p>Margem bruta histórica: ${money(row.grossMargin)}. Resultado acumulado: ${money(row.accumulated)}. Soma das modalidades, preservando os custos registrados nos pedidos. Não recusta vendas antigas pela ficha atual.</p></details></article>`).join('')}
 </details><p class="pitch-note">Demais custos são considerados quando cadastrados como despesas, taxas ou premissas de equilíbrio. Não se inventam mão de obra, energia, tributos ou perdas. A prestação não comprova saldo bancário, doação ou transferência realizada.</p>`;}
export function printDocument(r){return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Forno das Artes — prestação de contas</title><link rel="stylesheet" href="app/app.css"><style>body{background:white;color:#254D3A}main{max-width:1100px;margin:auto;padding:20px}.pitch-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}details>summary{display:none}details>p{display:block}table{font-size:11px}article{break-inside:auto}.print-action{padding:15px}@media print{.print-action{display:none}.scroll{overflow:visible}thead{display:table-header-group}.pitch-metric{break-inside:avoid}body{font-size:11px}}</style></head><body><div class="print-action"><button onclick="window.print()">Imprimir / Salvar como PDF</button><p>Escolha “Salvar como PDF” no destino de impressão. O arquivo salvo funciona sem internet.</p></div><main>${reportBody(r).replaceAll('<details ','<details open ')}</main></body></html>`;}
export function evaluatorPanel(r){return `<div class="pitch-toolbar"><button class="btn p" data-action="pitch-toggle">Modo pitch / sair</button><button class="btn s" data-action="pitch-all">Ver todos / principais indicadores</button><button class="btn s" data-action="pitch-print">Gerar PDF / imprimir prestação</button><button class="btn s" data-action="refresh">Atualizar dados locais</button><a class="btn s" href="#acesso">Acesso</a></div>${reportBody(r)}`;}
