// Adaptador da cópia experimental. Sem IndexedDB, Supabase, fallback ou conexão bancária.
export class SharedPixStore{
 mode='shared-test';#actor=null;#csrf=null;
 get actor(){return this.#actor?structuredClone(this.#actor):null;}
 async init(){const r=await fetch('/_central_pix_health',{cache:'no-store'}),h=await r.json();if(!r.ok||h.application!=='fda-central-pix-isolated-test-v1'||h.testOnly!==true)throw Error('Servidor compartilhado de testes não identificado. Não houve troca para o banco local.');await this.state();return this;}
 async configured(){return true;}
 async #call(route,payload){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),15000);try{
  const r=await fetch('/api/central-pix/'+route,{method:payload===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:payload===undefined?{}:{'Content-Type':'application/json',...(this.#csrf?{'X-CSRF-Token':this.#csrf}:{})},...(payload===undefined?{}:{body:JSON.stringify(payload)}),signal:ctl.signal});
  const data=await r.json();if(!r.ok){if(r.status===401){this.#actor=null;this.#csrf=null;}const e=Error(data.error||'Falha do servidor de testes.');e.status=r.status;e.revision=data.revision;throw e;}return data;
 }finally{clearTimeout(timer);}}
 #accept(data){this.#actor=data.actor;this.#csrf=data.csrf;return data.state;}
 async state(){return this.#accept(await this.#call('state'));}
 async loginPin(pin,password=''){this.#accept(await this.#call('login',{pin,password}));}
 async logout(){try{await this.#call('logout',{});}finally{this.#actor=null;this.#csrf=null;}}
 async command(command){let c=structuredClone(command);for(let i=0;i<16;i++)try{return this.#accept(await this.#call('command',{command:c}));}catch(e){
  if(e.status===409&&Number.isSafeInteger(e.revision)&&['order.create','order.reportPayment','order.pay','payment.issue','payment.issue.resolve'].includes(c.type)){c.expectedRevision=e.revision;continue;}throw e;
 }throw Error('Muitas alterações simultâneas. Confira e consulte a mesma operação antes de tentar outra.');}
 async evaluatorState(){return this.#call('evaluators');}
}
