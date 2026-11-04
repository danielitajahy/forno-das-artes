// Somente apresentação: classes, títulos e agrupamento de nós existentes.
// Não lê/grava armazenamento nem calcula valores ou muda eventos de negócio.
const paths={
  sales:'M3 7h18v14H3z M7 7V3h10v4 M3 12h18 M10 16h4',
  costs:'M6 3h12v18l-3-2-3 2-3-2-3 2z M9 7h6 M9 11h6 M9 15h3',
  stock:'M3 7l9-4 9 4-9 4z M3 7v10l9 4 9-4V7 M12 11v10',
  contributions:'M4 7h16v14H4z M2 7h20 M12 7v14 M12 7C4 7 4 1 8 2c3 0 4 5 4 5s1-5 4-5c4-1 4 5-4 5',
  menu:'M4 3h16v18H4z M8 7h8 M8 11h8 M8 15h5',
  orders:'M4 13h16 M5 13a7 7 0 0 1 14 0 M12 6V3 M3 17h18 M6 21h12',
  reports:'M4 3v18h17 M8 16v-4 M13 16V8 M18 16V5',
  wait:'M8 19h8 M10 22h4 M5 16h14l-2-3V9a5 5 0 0 0-10 0v4z'
};
export const CATEGORIES={
  sales:{name:'Vendas e caixa',icon:paths.sales},
  costs:{name:'Despesas e custos',icon:paths.costs},
  stock:{name:'Estoque e disponibilidade',icon:paths.stock},
  contributions:{name:'Aportes e devoluções',icon:paths.contributions},
  menu:{name:'Cardápio e preços',icon:paths.menu},
  orders:{name:'Pedidos e cozinha',icon:paths.orders},
  reports:{name:'Relatórios financeiros',icon:paths.reports},
  wait:{name:'Lista de espera e reposições',icon:paths.wait}
};
const icon=key=>`<svg class="category-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${CATEGORIES[key].icon}"/></svg>`;
function theme(el,key){if(!el)return;el.classList.add('category','category-'+key);el.dataset.category=key;}
function heading(el,key){
  if(!el||el.querySelector('.category-icon'))return;
  const label=el.textContent;el.replaceChildren();el.insertAdjacentHTML('afterbegin',icon(key));
  const span=document.createElement('span');span.className='category-label';span.textContent=label;el.append(span);
}
function panel(root,title,key){
  const summary=Array.from(root.querySelectorAll('summary')).find(s=>s.textContent===title);
  if(summary){theme(summary.parentElement,key);heading(summary,key);}return summary?.parentElement;
}
function group(id,key,title){
  const el=document.createElement('section');el.id=id;theme(el,key);
  const h=document.createElement('h3');h.textContent=title;heading(h,key);el.append(h);return el;
}
function splitFinances(root){
  const expense=root.querySelector('#expense-form'),contribution=root.querySelector('#contribution-form');
  if(!expense||!contribution||root.querySelector('#gestao-financas'))return;
  const old=expense.closest('details'),wrap=document.createElement('div');wrap.id='gestao-financas';wrap.className='finance-sections';
  const costs=document.createElement('details'),funds=document.createElement('details');
  costs.innerHTML='<summary>Despesas e custos</summary>';funds.innerHTML='<summary>Aportes e devoluções aos alunos</summary>';
  const children=Array.from(old.children),start=children.indexOf(contribution);
  let expensesHeading=children.findIndex((x,i)=>i>start&&x.tagName==='H3'&&x.textContent==='Despesas cadastradas');
  if(expensesHeading<0)expensesHeading=children.length;
  costs.append(expense);funds.append(contribution);
  children.slice(start+1,expensesHeading).forEach(el=>funds.append(el));
  children.slice(expensesHeading).forEach(el=>costs.append(el));
  wrap.append(costs,funds);old.replaceWith(wrap);
}
export function styleManagement(){
  const root=document.getElementById('v-gestao');if(!root?.querySelector('#product-form'))return;
  root.classList.add('staff-layout');
  const h=root.querySelector('h2');h.classList.add('management-heading');
  if(!root.querySelector('.category-guide')){
    const guide=document.createElement('div');guide.className='category-guide';guide.setAttribute('aria-label','Identificação das categorias da Gestão');
    Object.entries(CATEGORIES).forEach(([key,info])=>{const chip=document.createElement('span');theme(chip,key);chip.innerHTML=icon(key);chip.append(document.createTextNode(info.name));guide.append(chip);});
    const hint=document.createElement('p');hint.className='management-hint';hint.textContent='Selecione uma seção para abrir. Campos de fundo claro são editáveis. Os títulos e ícones identificam cada assunto, além das cores.';
    h.after(guide,hint);
  }
  const map={
    'Recebimentos Pix':'sales','Pix devolvido':'sales','Devoluções pendentes':'sales','Receita líquida':'sales','Saldo total':'sales',
    'Gastos pagos':'costs','Gastos previstos + pagos':'costs','Aportes a devolver':'contributions','Reembolsos de compras pendentes':'costs','Obrigações com pessoas':'contributions',
    'Resultado projetado':'reports','Potencial para doação após obrigações':'reports'
  };
  root.querySelectorAll('.card > .tag').forEach(tag=>{const key=map[tag.textContent];if(!key)return;theme(tag.parentElement,key);heading(tag,key);});
  splitFinances(root);
  panel(root,'Gerenciamento de Cardápio','menu');
  panel(root,'Preços gerais e configuração Pix','menu');
  panel(root,'Estoque de fatias e pizzas inteiras/congeladas','stock');
  panel(root,'Lista de espera e avisos de reposição','wait');
  panel(root,'Despesas e custos','costs');
  panel(root,'Aportes e devoluções aos alunos','contributions');
  panel(root,'Fechamentos, relatórios e trilha de auditoria','reports');
  panel(root,'Gráficos e vendas por sabor','reports');
  const price=root.querySelector('#prices-form'),pix=root.querySelector('#pix-form');
  theme(price,'menu');theme(pix,'sales');
  if(!price.querySelector('.category-form-heading')){const title=document.createElement('h3');title.className='category-form-heading';title.textContent='Preços gerais';heading(title,'menu');price.prepend(title);}
  if(!pix.querySelector('.category-form-heading')){const title=document.createElement('h3');title.className='category-form-heading';title.textContent='Recebimento por Pix';heading(title,'sales');pix.prepend(title);}
  root.querySelectorAll('.stock-form').forEach(f=>theme(f,'stock'));
  root.querySelectorAll('input[name^="cost-"]').forEach(i=>{i.closest('label').classList.add('cost-field');});
  const graphMap={'Unidades por sabor (modalidades somadas)':'menu','Despesas por item':'costs','Receita, gastos e aportes':'reports','Unidades confirmadas por hora':'orders'};
  root.querySelectorAll('.card h3').forEach(h=>{const key=graphMap[h.textContent];if(key){theme(h.parentElement,key);heading(h,key);}});
}
export function styleOperations(){
  const root=document.getElementById('v-caixa');if(!root?.querySelector('[data-action]'))return;
  root.classList.add('staff-layout');
  const h=root.querySelector('h2');
  if(!root.querySelector('#cash-overview')){
    const box=group('cash-overview','sales','Vendas e caixa');
    const nodes=[];let node=h.nextElementSibling;
    while(node&&node.tagName!=='ARTICLE'&&node.tagName!=='DETAILS'){nodes.push(node);node=node.nextElementSibling;}
    nodes.forEach(n=>box.append(n));h.after(box);
  }
  root.querySelectorAll('article.card').forEach(card=>{theme(card,'orders');heading(card.querySelector('h3'),'orders');
    card.querySelectorAll('.msg').forEach(pix=>theme(pix,'sales'));
  });
  panel(root,'Histórico e devoluções Pix','sales');
}
export function styleAccess(){
  const root=document.getElementById('v-acesso');root?.classList.add('staff-layout');
  if(root)panel(root,'Backups e recuperação','reports');
  const kit=root?.querySelector('a[href="plano-c/KIT_PLANO_C_LOTE_01.pdf"]');
  if(kit){kit.href='plano-c/KIT_PLANO_C_DEFINITIVO_300_COMANDAS.pdf';kit.textContent='abrir kit definitivo para impressão';}
}
export function styleWait(){
  const form=document.getElementById('wait-form');
  if(form){theme(form,'wait');heading(form.querySelector('h3'),'wait');}
}
