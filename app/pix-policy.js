// Não existe consulta bancária neste módulo: estados dependem de declaração/conferência humana.
export const paymentState=o=>o.paidAt?'confirmed':o.paymentReportedAt?'reported':'waiting';
export const paymentLabel=o=>({confirmed:'Pagamento confirmado no banco',reported:'Cliente informou que pagou — aguardando conferência',waiting:'Aguardando pagamento'}[paymentState(o)]);
export const normalizedReference=value=>String(value||'').normalize('NFKC').replace(/\s+/g,'').toUpperCase();
export const activePaymentIssue=o=>(o.paymentReviews||[]).filter(x=>!x.resolvedAt).at(-1)||null;
export const pixCommands=['order.pay','payment.issue','payment.issue.resolve'];
export const canReviewPix=a=>['admin','cashier','finance'].includes(a?.role);
export const canConfirmPix=a=>['admin','cashier'].includes(a?.role)||(a?.role==='finance'&&!!a.allowedCommands?.includes('order.pay'));
