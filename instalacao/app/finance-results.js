// Cálculos puros. Custos não cadastrados são null, não zero presumido.
const requireValue=(v,m)=>{if(!v)throw Error(m);};
const int=(n,min=0,max=1000000)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const units={g:{kind:'mass',factor:1},kg:{kind:'mass',factor:1000},ml:{kind:'volume',factor:1},L:{kind:'volume',factor:1000},un:{kind:'count',factor:1}};
export const recipeFor=(s,id)=>s.recipes&&Object.hasOwn(s.recipes,id)?s.recipes[id]:null;
const divRound=(n,d)=>Number((n+d/2n)/d);
export function roundEighth(n){requireValue(Number.isSafeInteger(n),'Custo acumulado acima do limite.');return Math.sign(n)*divRound(BigInt(Math.abs(n)),8n);}
export function ingredientCents(row){
 if(row.unitCostCents===null)return null;
 const n=BigInt(row.quantityMilli)*BigInt(row.unitCostCents)*BigInt(units[row.unit].factor),d=1000n*BigInt(units[row.priceUnit].factor);
 const amount=divRound(n,d);requireValue(int(amount),'Custo do ingrediente acima do limite.');return amount;
}
export function validateRecipe(r){
 requireValue(r&&r.diameterCm===35&&r.slices===8&&Array.isArray(r.ingredients)&&r.ingredients.length>0&&r.ingredients.length<=100,'Ficha exige pizza 35 cm, oito fatias e 1–100 ingredientes.');
 requireValue(typeof r.notes==='string'&&r.notes.length<=1500,'Observações da ficha inválidas.');
 for(const i of r.ingredients){
  requireValue(typeof i.name==='string'&&i.name.trim().length>0&&i.name.length<=140&&!/[\x00-\x1f]/.test(i.name),'Identifique cada ingrediente.');
  requireValue(int(i.quantityMilli,1,1000000000)&&units[i.unit]&&units[i.priceUnit]&&units[i.unit].kind===units[i.priceUnit].kind,'Quantidade/unidades incompatíveis.');
  requireValue(i.unitCostCents===null||int(i.unitCostCents),'Custo unitário inválido.');ingredientCents(i);
 }
 for(const mode of ['slice','whole'])requireValue(r.packaging&&Object.hasOwn(r.packaging,mode)&&(r.packaging[mode]===null||int(r.packaging[mode])),'Embalagem inválida.');
 const costs=recipeCosts(r);if(costs.productionCents!==null){requireValue(int(costs.productionCents),'Custo de produção acima do limite.');for(const mode of ['slice','whole'])if(costs[mode]!==null)requireValue(roundEighth(costs[mode])<=1000000,'Custo da modalidade acima do limite.');}
 return true;
}
export function recipeCosts(r){
 const values=r.ingredients.map(ingredientCents),production=values.every(x=>x!==null)?values.reduce((a,b)=>a+b,0):null;
 return {ingredientLines:values,productionCents:production,ingredientSliceEighthCents:production,
  slice:production!==null&&r.packaging.slice!==null?production+r.packaging.slice*8:null,
  whole:production!==null&&r.packaging.whole!==null?(production+r.packaging.whole)*8:null};
}
export function catalogCost(s,p,mode){
 const r=recipeFor(s,p.id);
 if(r){const c=recipeCosts(r),n=c[mode];return {version:1,known:n!==null,eighthCents:n,source:'recipe',recipeRevision:r.revision,ingredientPizzaCents:c.productionCents,packagingCents:r.packaging[mode]};}
 const legacy=p.cost?.[mode];return {version:1,known:Number.isSafeInteger(legacy)&&legacy>0,eighthCents:Number.isSafeInteger(legacy)&&legacy>0?legacy*8:null,source:'legacy',recipeRevision:null,ingredientPizzaCents:null,packagingCents:null};
}
export function validateCostSnapshot(c,mode){
 requireValue(c&&c.version===1&&typeof c.known==='boolean'&&['recipe','legacy'].includes(c.source)&&(c.known?int(c.eighthCents,0,8000000):c.eighthCents===null),'Custo histórico inconsistente.');
 requireValue(c.recipeRevision===null||typeof c.recipeRevision==='string'&&/^[0-9a-f-]{36}$/i.test(c.recipeRevision),'Versão de ficha inconsistente.');
 for(const k of ['ingredientPizzaCents','packagingCents'])requireValue(c[k]===null||int(c[k]),'Componente histórico inválido.');
 if(c.source==='recipe'){requireValue(['slice','whole'].includes(mode)&&c.recipeRevision!==null&&c.known===(c.ingredientPizzaCents!==null&&c.packagingCents!==null),'Composição histórica incompleta.');if(c.known)requireValue(c.eighthCents===(mode==='slice'?c.ingredientPizzaCents:c.ingredientPizzaCents*8)+c.packagingCents*8,'Composição histórica divergente.');}
 else requireValue(c.recipeRevision===null&&c.ingredientPizzaCents===null&&c.packagingCents===null&&(!c.known||c.eighthCents%8===0),'Custo legado inconsistente.');return true;
}
function lineCost(l){if(l.costSnapshot)return l.costSnapshot.known?l.costSnapshot.eighthCents:null;return Number.isSafeInteger(l.unitCost)&&l.unitCost>0?l.unitCost*8:null;}
export function calculateResults(s,t){
 const paid=s.orders.filter(o=>o.paidAt),fees=new Map();for(const f of s.paymentFees||[])fees.set(f.orderId,f);
 const unknownFees=paid.filter(o=>!fees.has(o.id)).length,knownFees=paid.reduce((n,o)=>n+(fees.get(o.id)?.amount||0),0),completeFees=unknownFees===0;
 const feesInExpenses=paid.reduce((n,o)=>n+(fees.get(o.id)?.expenseId?fees.get(o.id).amount:0),0);
 const feeAdjusted=t.net-knownFees,eligibleNet=feeAdjusted-t.refundDue;
 const paidExpenses=s.expenses.filter(e=>e.paid).reduce((n,e)=>n+e.amount,0),plannedExpenses=s.expenses.filter(e=>!e.paid).reduce((n,e)=>n+e.amount,0);
 const reimbursementDue=s.expenses.filter(e=>e.paid&&e.payerSource==='person'&&!e.reimbursedAt).reduce((n,e)=>n+e.amount,0);
 const rows=s.menu.map(p=>{const recipe=recipeFor(s,p.id),costs=recipe?recipeCosts(recipe):null;return {id:p.id,name:p.artistic||p.name,archived:p.archived,recipe,productionCents:costs?.productionCents??null,ingredientSliceCents:costs?.productionCents===null||!costs?null:roundEighth(costs.productionCents),modes:Object.fromEntries(['slice','whole'].map(mode=>{const price=p.price[mode]??s.prices[mode],cost=catalogCost(s,p,mode),margin=cost.known?price*8-cost.eighthCents:null;return [mode,{price,cost,unitCostCents:cost.known?roundEighth(cost.eighthCents):null,unitMarginCents:margin===null?null:roundEighth(margin),marginPercent:margin===null?null:margin/(price*8)*100,quantity:0,cancelledQuantity:0,revenue:0,costEighth:0,unknownCostUnits:0,lossEighth:0,unknownLossUnits:0}];}))};});
 const byId=new Map(rows.map(r=>[r.id,r]));
 for(const o of paid)for(const l of o.lines){const row=byId.get(l.productId)?.modes[l.mode];if(!row)continue;const cost=lineCost(l);
  if(o.status!=='cancelado'){row.quantity+=l.qty;row.revenue+=l.qty*l.unitPrice;if(cost===null)row.unknownCostUnits+=l.qty;else row.costEighth+=cost*l.qty;}
  else{row.cancelledQuantity+=l.qty;if(o.returnedToStock!==true){if(cost===null||o.returnedToStock===undefined)row.unknownLossUnits+=l.qty;else row.lossEighth+=cost*l.qty;}else if(l.costSnapshot?.source!=='recipe'||l.costSnapshot.packagingCents!==0){row.unknownLossUnits+=l.qty;}}
 }
 for(const row of rows){
  for(const m of Object.values(row.modes)){m.totalCostCents=m.unknownCostUnits?null:roundEighth(m.costEighth);m.grossMarginCents=m.unknownCostUnits?null:roundEighth(m.revenue*8-m.costEighth);m.lossCostCents=m.unknownLossUnits?null:roundEighth(m.lossEighth);m.accumulatedCents=m.unknownCostUnits||m.unknownLossUnits?null:roundEighth(m.revenue*8-m.costEighth-m.lossEighth);}
  const modes=Object.values(row.modes);row.revenue=modes.reduce((n,m)=>n+m.revenue,0);row.grossMarginCents=modes.some(m=>m.unknownCostUnits)?null:roundEighth(row.revenue*8-modes.reduce((n,m)=>n+m.costEighth,0));row.accumulatedCents=modes.some(m=>m.unknownCostUnits||m.unknownLossUnits)?null:roundEighth(row.revenue*8-modes.reduce((n,m)=>n+m.costEighth+m.lossEighth,0));
 }
 return {grossPaid:t.receipts,validPaidSales:paid.filter(o=>o.status!=='cancelado').reduce((n,o)=>n+o.total,0),refunds:t.refunded,refundDue:t.refundDue,netOfRefunds:t.net,knownFees,feesInExpenses,unknownFees,completeFees,netAfterFees:completeFees?feeAdjusted:null,paidExpenses,plannedExpenses,reimbursementDue,contributions:t.contributions,contributionsReturned:t.returned,contributionsDue:t.contributionsDue,cashBeforeFees:t.balance,cashKnownFees:t.balance-knownFees+feesInExpenses,cashAfterFees:completeFees?t.balance-knownFees+feesInExpenses:null,
  realizedBeforeUnconfirmedFees:eligibleNet-paidExpenses+feesInExpenses,projectedBeforeUnconfirmedFees:eligibleNet-paidExpenses+feesInExpenses-plannedExpenses,
  realized:completeFees?eligibleNet-paidExpenses+feesInExpenses:null,projected:completeFees?eligibleNet-paidExpenses+feesInExpenses-plannedExpenses:null,
  quantityValid:rows.reduce((n,r)=>n+r.modes.slice.quantity+r.modes.whole.quantity,0),rows};
}
