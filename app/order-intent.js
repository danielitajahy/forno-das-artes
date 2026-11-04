// Somente intenção de pedido por aba; nunca credenciais, PINs, Pix ou histórico.
export const INTENT_KEY='fda-pedido-pendente-v1';
export function readIntent(storage){
 const raw=storage.getItem(INTENT_KEY);if(!raw)return null;
 if(raw.length>30000)throw Error('Tentativa local inválida. Preserve esta aba e solicite suporte.');
 let p;try{p=JSON.parse(raw);}catch{throw Error('Tentativa local ilegível. Preserve esta aba e solicite suporte.');}
 const c=p?.command,l=c?.payload?.lines,uuid=x=>typeof x==='string'&&/^[0-9a-f-]{36}$/i.test(x);
 if(!['offline','online'].includes(p.mode)||!/^\w{64}$/.test(p.owner||'')||c?.type!=='order.create'||!uuid(c.requestId)||!uuid(c.payload?.idempotencyKey)||!Number.isSafeInteger(c.expectedRevision)||c.expectedRevision<0||!Array.isArray(l)||!l.length||l.length>100||!l.every(x=>/^[a-zA-Z0-9_-]{1,64}$/.test(x.productId)&&['slice','whole'].includes(x.mode)&&Number.isSafeInteger(x.qty)&&x.qty>0&&x.qty<=99))throw Error('Tentativa local inválida. Preserve esta aba e solicite suporte.');
 return p;
}
export function saveIntent(storage,intent){storage.setItem(INTENT_KEY,JSON.stringify(intent));}
export function clearIntent(storage){storage.removeItem(INTENT_KEY);}
