# Central Pix de Conferência — cópia isolada de testes, 04/11/2026

Continuação da branch `codex/frontend-feira-2026-11-03`, a partir da entrega `4113319914f59d0059319554b818a7863397a474`. Nenhuma publicação operacional, merge, alteração do Supabase, migração de dados reais ou integração bancária foi executada.

## Implementado

A Central tem três estados financeiros derivados, separados da situação de preparo do pedido:

1. **Aguardando pagamento**: pedido reservado, sem recebimento.
2. **Cliente informou que pagou — aguardando conferência**: declaração sinalizada pelo vendedor; continua reservado, sem receita e fora da cozinha.
3. **Pagamento confirmado no banco**: somente após ação de Financeiro/Caixa autorizado, atestando a conferência manual do crédito no extrato. Registra responsável, horário do sistema e identificadores informados; então converte reserva em venda e libera preparação.

Comprovante do cliente e notificação isolada não são critérios automáticos de confirmação. Não há consulta à API bancária, Mercado Pago, extrato automático ou validação automática de comprovantes nesta entrega.

Todos os pedidos usam **uma única configuração Pix**, pertencente à operação e administrada pela equipe; não existe chave por vendedor. A conta real deverá ser a de Bárbara, mas a sua chave real não foi fornecida/inserida nesta cópia. O simulador usa **CHAVE-FICTICIA-NAO-PAGAR**, com titular explicitamente fictício. Nenhum teste movimentou dinheiro.

A tela exclusiva **Central Pix** apresenta senha, valor, horário, vendedor e estado. Os cartões são compactos e abrem a conferência individual. A confirmação usa um comando após preencher/conferir os campos, sem executar transferência. A tela também permite sinalizar **valor divergente** ou **pagamento não localizado**; a divergência permanece no histórico e precisa ser resolvida para confirmar o crédito exato.

O vendedor só registra novos pedidos e informa a declaração do cliente em pedidos de sua autoria. Não confirma crédito, não altera preço/pagamento e não recebe o conteúdo financeiro dos outros vendedores. O nome do responsável pela venda é preservado no pedido, além de seu identificador, mesmo se o cadastro de acesso mudar depois.

## Banco compartilhado: o que foi e não foi validado

Foi implementado `server/pix-test-server.mjs`: servidor Node.js 24+, sem dependências externas, com **SQLite compartilhado** em arquivo separado de testes. Oito contextos de navegador, com cookies e armazenamento independentes, enviaram pedidos para esse mesmo banco. Esse teste não usa BroadcastChannel ou IndexedDB como sincronização entre clientes.

O servidor de demonstração escuta **somente 127.0.0.1**. A atualização entre sessões consulta o servidor aproximadamente a cada 1,5 segundo enquanto a aba está visível. Uma falha de rede não cria banco local, não muda automaticamente para Plano B e não autoriza vender paralelamente em outra base.

**Ainda não está operacional para oito celulares físicos.** Roteador, acesso LAN, HTTPS, dispositivos reais, contingência e instalação no notebook precisam de configuração e homologação específicas. Não foi aberto servidor na rede local ou internet e não foi implantado esse backend no Supabase operacional. A interface informa esse limite continuamente. A versão local do Plano B também mostra: “Dados locais — NÃO recebe pedidos de oito celulares”.

O adaptador Supabase anterior continua separado; a Central não é anunciada como homologada nele. O modo compartilhado é ativado somente no servidor experimental e por `?central-pix=teste`, sem ler o IndexedDB anterior.

## Regras de segurança e concorrência

- Autenticação por PIN no servidor. Contas financeiras, de caixa, administração e apresentação também exigem senha adicional. PIN/senha dos registros de demonstração são armazenados como verificadores PBKDF2-SHA256 com 210.000 iterações. As credenciais públicas do guia são exclusivamente fictícias e não servem para produção.
- Cookies de sessão HttpOnly e SameSite=Strict, verificação de origem/Host, CSRF nas gravações, limite de corpo JSON e bloqueio após cinco tentativas inválidas. O bloqueio de tentativas persiste no SQLite. Sessões expiram, são invalidadas pelo bloqueio do usuário e não sobrevivem ao reinício do processo.
- O servidor determina identidade e perfil pela sessão; ignora a tentativa de promover o papel pelo corpo da requisição. Autorização é verificada em cada comando. Vendedor só sinaliza pagamento do próprio pedido. APRESENTADOR e COZINHA não confirmam Pix.
- FINANCEIRO só confirma ou sinaliza divergências quando tiver as concessões individuais correspondentes. A conta financeira anterior não ganha autorização de pagamento silenciosamente. No modo local, a administração concede as novas permissões em Gerenciar Acessos; no simulador compartilhado, somente contas fictícias previamente definidas estão disponíveis.
- Revisão do estado e transação SQLite serializam reservas/confirmações. A disputa pela última unidade aceita somente um pedido. Recibos de `requestId` e identidade do pedido impedem duplicação após resposta perdida ou repetição, inclusive após reiniciar o servidor. A autorização continua sendo verificada antes do replay.
- O carrinho compartilhado envia o total que o vendedor conferiu; se o preço tiver mudado durante um conflito de revisão, a criação é rejeitada para nova conferência, sem reservar estoque silenciosamente pelo preço alterado.
- Não há endpoint para importar backup real. Um SQLite existente sem a identificação específica da demonstração é recusado sem ser modificado. Arquivos SQLite, backups, pasta privada e código do servidor não são servidos pelo HTTP.

Este é um servidor de testes supervisionado e restrito ao próprio computador. Não se deve expô-lo em rede nem reaproveitar suas contas fictícias para operação real. Antes de qualquer implantação será necessário revisar autenticação, transporte HTTPS, usuários reais autorizados, contingência e conciliação da base preservada.

## Identificação e duplicidade do crédito

A Central exige **referência/identificador do banco**, quando disponível, ou **identificação manual estável e única da linha do extrato**, quando não houver referência bancária. Referência e identificação manual são guardadas separadamente. Normalização de espaços, caixa e caracteres equivalentes evita reutilização textual disfarçada.

O mesmo identificador já associado a outro pedido é rejeitado, inclusive se o pedido anterior foi cancelado ou estornado. Confirmar duas vezes o mesmo pedido também é rejeitado; repetir a mesma requisição idempotente não cria novo recebimento, reserva ou movimento de estoque.

**Limite humano inevitável:** sem leitura bancária automática, o sistema não pode descobrir que duas descrições diferentes representam o mesmo crédito. Valor e horário parecidos, isoladamente, não identificam uma transação. A equipe precisa usar sempre a mesma identificação do lançamento e conferir que o crédito é exclusivo daquele pedido. Se não houver identificação estável, não confirmar pela Central. O procedimento precisa ser definido pela responsável pelo extrato antes da feira.

Pagamentos antigos sem identificador foram preservados; não receberam referências inventadas. Não foi executada migração dos históricos. A compatibilidade do motor com comandos legados foi mantida, mas o servidor novo recusa confirmação fora do contrato da Central (`central:true`, valor exato e identificação). O botão anterior de Caixa da nova interface também segue o fluxo reforçado.

## Campos e cálculos reaproveitados

`orders`, reservas/estoque, preço e custo imutáveis do pedido, caixa, `paidAt`, `paidBy`, `paidAmount`, `paymentReference`, cancelamentos e estornos continuam sendo a base existente. O faturamento e os painéis financeiros permanecem baseados em pagamentos confirmados, nunca em `paymentReportedAt`.

Os campos novos de declaração, identificação do extrato, revisões de conferência e autoria nominal são opcionais. Backups antigos não são reescritos pela leitura. Despesas, aportes, reembolsos, margens, receitas, relatórios e fichas técnicas anteriores foram preservados. A declaração do cliente não movimenta caixa nem receita; cancelamento e estorno continuam sendo operações separadas e auditadas.

## Testes desta implementação

| Grupo | Resultado | O que comprova |
|---|---|---|
| Central — motor | 15 testes novos | Estados, autoria, permissões, referência/linha, duplicidade, divergência, preço, histórico e compatibilidade |
| Central — API/SQLite | 16 testes novos | Oito vendedores concorrentes, autorização real no servidor, CSRF/origem, replay, persistência, revogação, última unidade e arquivos privados |
| Central — Chromium | 17 verificações novas | Oito contextos independentes, declaração/confirmacão/divergência por telas, cozinha/fila, dados compartilhados, privacidade, celular, prévia e falha sem fallback |
| Regressão Node | 79 aprovados | Motor, financeiro, avaliadores, perfis e interface anteriores |
| Regressão Python/PowerShell | 20 aprovados | Servidores estáticos e iniciadores anteriores |
| Regressão navegador | 12 + 14 + 20 aprovadas | Operação, painel financeiro e avaliadores/PDF anteriores |

Total: **48 testes/verificações novos aprovados**, além de **145 de regressão**. Não são testes bancários oficiais nem prova de homologação em aparelhos físicos. As evidências estão em `evidencias/central-pix-2026-11-04`.

A regressão financeira passou a usar referências fictícias diferentes por transação; reutilizar o mesmo texto em dois créditos agora é corretamente bloqueado. As evidências novas foram guardadas separadamente das entregas anteriores.

## Pendências para utilização real

1. Definir com Bárbara como identificar cada linha do extrato e quem está autorizado a conferir e resolver divergências.
2. Preparar e homologar servidor compartilhado, rede dos equipamentos, HTTPS, sessões, usuários individuais e contingência, com autorização específica. O simulador em loopback não atende celulares reais.
3. Validar a cópia privada preservada e o procedimento de migração/conciliação sem executar resets ou exclusões. Os pedidos de teste já tratados não foram excluídos novamente.
4. Conferir Windows físico, oito celulares, cozinha e fluxo durante o movimento da feira antes de habilitar a operação.

Integração bancária automática está fora do escopo desta etapa, conforme solicitado. Site publicado, Supabase real, PINs reais e bancos operacionais não foram alterados.
