# Backend do Plano A: proposta aditiva e testes isolados

**Nenhum SQL desta entrega foi executado no Supabase existente. Nenhum dado real foi importado. Não reaplicar os scripts antigos de instalação ou importação.** O arquivo `sql/001_v2_homologacao.sql` é uma proposta de evolução que depende de revisão e autorização específica antes de qualquer aplicação no projeto existente. Não cria outro projeto Supabase e não exige assinatura, cartão ou serviço pago.

## O que está implementado e verificado

O SQL foi executado em **PostgreSQL PGlite efêmero local**, com `auth.users`, `auth.uid()` e a tabela legada de administradores simuladas, exclusivamente com dados fictícios. O teste `sql/test-local.mjs` não aceita uma conexão externa. Ele cria uma instância em memória e não lê credenciais. Os testes não comprovam configuração do Supabase real, JWT de produção, PostgREST, limites do plano Free, entrega de WhatsApp ou sincronização entre aparelhos reais.

A proposta cria apenas três tabelas novas: `fda_v2_store`, `fda_v2_roles` e `fda_v2_receipts`. As sete tabelas anteriores permanecem intactas. O script **não é instalador idempotente**: uma aplicação repetida falha por nomes já existentes, em transação. Isso é deliberado para impedir substituição silenciosa. As alterações financeiras e de estoque são transações com bloqueio da linha de estado, revisão otimista e `requestId` UUID. Comandos rejeitados não gravam parcialmente.

O estado inicial é vazio e pausado. Não representa nem substitui o histórico existente; preços iniciais 1200/4990 são centavos, sem estoque inventado, sem conta Pix, sem contatos ou alunos. A equipe precisa cadastrar/revisar o cardápio, informar estoque e Pix reais e conciliar os registros legados antes da ativação. **Não ativar a versão vazia junto à operação antiga.**

## Contrato de API

- `POST /rest/v1/rpc/fda_v2_state`, corpo `{}`: leitura de estado filtrada pelo perfil. Corpo opcional `{"p_revision":123}` retorna somente `{unchanged:true,revision,role}` se nada mudou, reduzindo tráfego. O cache do cliente deve ser descartado ao trocar sessão/perfil e nunca compartilhado entre usuários.
- `POST /rest/v1/rpc/fda_v2_command`, corpo `{"p_command":{"type":"...","expectedRevision":0,"requestId":"UUID","payload":{}}}`: comando autenticado; retorna o novo estado filtrado. URL e chave pública Supabase vão no cliente; nenhuma chave `service_role` ou senha de banco vai no HTML.
- Repetir exatamente a mesma requisição com o mesmo `requestId` não repete o efeito. Reutilizar esse UUID com outro conteúdo é erro. A revisão pode variar na repetição idêntica.
- `order.create` também exige `idempotencyKey` UUID, global entre pedidos. O token curto antigo não é utilizado. Pedido inicial `A-000001`; após 999 continua sem truncamento. O limite é o inteiro seguro do JavaScript.
- Valores monetários são inteiros em **centavos**, quantidades inteiras. O servidor não aceita total/preço vindo do carrinho como autoridade: consulta cardápio e preços atuais e grava nome, preço e custo no pedido. Editar cardápio não altera snapshots anteriores.
- Primeiro login: administrador autorizado na tabela legada `fda_admins` tem perfil `admin`. Perfis opcionais `cashier`/`kitchen` são atribuídos por administração privilegiada da nova tabela, após autorização; o navegador não pode atribuir permissões a si mesmo. Não há endpoint público para inserir administradores.

### Papéis e dados

- Público: cardápio ativo sem custos, preço, configuração Pix pública, disponibilidade e senhas em preparo/prontas. Sem itens detalhados, contatos, despesas, aportes ou auditoria.
- `kitchen`: pedidos pagos em preparo/prontos e operação de pronto/entregue; nenhuma confirmação de pagamento ou alteração de preço.
- `cashier`: pedidos, confirmação manual, cancelamento, devoluções, caixa e lista de espera; sem edição de cardápio ou preços e sem dados de aportes/despesas.
- `admin`: operações completas e auditoria. O encerramento da sessão é responsabilidade do adaptador Auth, incluindo revogação/logout; esconder a tela não encerra uma sessão.

As tabelas usam RLS e não concedem acesso direto a `anon` ou `authenticated`. Funções com `SECURITY DEFINER` têm `search_path` vazio e verificam papel no servidor. Só a RPC de leitura sanitizada é pública. É necessário conferir essas permissões na implantação autorizada, incluindo as funções legadas: o backend v2 não remove endpoints legados existentes.

### Estoque e pagamento

Cada chave `produto:slice` ou `produto:whole` guarda `onHand` físico ainda disponível/reservado, `reserved`, `sold`, `limit` (limite **adicional restante** de vendas, nulo para usar todo físico) e `epoch` de reposição.

- Disponível: `max(0,min(onHand-reserved,limit-reserved))` quando há limite.
- Criar pedido reserva estoque na mesma transação; requer operação ativa, caixa aberto e chave Pix configurada.
- Confirmar Pix exige ação explícita `verified:true`, registra UUID do operador, horário do servidor, valor e caixa de recebimento; somente então move para `preparando` e converte reserva em venda. Não consulta banco bancário e não interpreta prints.
- Cancelar aguardando libera reserva. Cancelar pago exige motivo e decisão explícita de retorno do produto ao estoque; devolução financeira é outro evento, com confirmação e limite do valor efetivamente recebido. Produto consumido/perdido não retorna automaticamente.
- Ajustes exigem motivo e nunca deixam físico menor que as reservas. Valores negativos, frações, estoque insuficiente e limite menor que reservas são rejeitados.
- Fechar caixa preserva recebimentos Pix e devoluções daquele turno, valor conferido e diferença. Despesas/aportes são módulos separados; o fechamento de recebimentos não equivale ao saldo total da conta bancária.

Reservas não expiram automaticamente nesta versão: caixa precisa cancelar pedidos abandonados para liberar disponibilidade. Uma política automática futura requer definição da equipe e relógio do servidor; não foi simulada.

### Lista de espera e avisos

Cadastro exige consentimento explícito, produto inteiro esgotado e contato. Não cria pedido, pagamento ou reserva. Reposição avança `epoch`; confirmação de aviso somente com estoque disponível, `confirmed:true` e sem confirmação duplicada para a mesma reposição. O botão WhatsApp é manual: abrir uma conversa não comprova envio. `wait.notify` registra declaração da equipe; não comprova entrega. Cancelar remove o contato do estado operacional e mantém registro mínimo da solicitação/auditoria. Backups/exportações antigos continuam exigindo política de retenção e proteção.

## Limitação segura: compra pública ainda bloqueada

**O Plano A não habilita pedidos anônimos nem gravação pública de contatos.** Ambos exigem equipe autenticada, que pode atender o cliente no balcão. Não há promessa de CAPTCHA ou antifraude invisível. A equipe mantém os pedidos públicos antigos desativados no futuro corte; apenas adotar v2 não revoga funções legadas.

Web Push depende de serviço worker, inscrições, VAPID, envio do servidor e compatibilidade/consentimento por navegador. O GitHub Pages é estático, não executa o remetente. Não foi adotado um provedor externo sem prova de gratuidade sustentável. A alternativa funcional gratuita entregue é lista com aviso de reposição e WhatsApp manual, sem API paga nem disparo automático.

Para abrir compra pública com segurança será necessário um gateway validado que confira desafio antiabuso, aplique limites e só então execute criação transacional. Restrição de origem/CORS sozinha não impede chamadas diretas. Essa implantação depende de aprovação e verificação de cotas/compatibilidade; não faz parte do SQL desta entrega. O balcão autenticado funciona sem novo serviço.

## Capacidade, tráfego e plano gratuito

A implementação transacional centraliza o estado para simplificar consistência na feira. Isso serializa gravações: é apropriado como base pequena, não garantia de volume ilimitado. Cada mutação tem limite de 10 MB no estado, imagens limitadas a 500 KB por produto e até 100 sabores. Evite imagens grandes; há limites reais de armazenamento/tráfego/CPU do Supabase Free e pausa por inatividade possíveis, que precisam ser conferidos no painel antes da feira. Não há contratação automática nem migração de plano.

Polling deve ocorrer somente com página visível, com intervalo moderado, tratamento de 429/backoff e sem baixar estado administrativo em telas públicas. A auditoria guarda horário do servidor, revisão, responsável e detalhes controlados de preços, ajustes e status. Recibos de repetição guardam somente hash SHA-256 do comando, sem duplicar contato ou configuração Pix. A revisão pode provocar conflitos com vários operadores; a UI deve atualizar e solicitar nova tentativa, preservando o carrinho. A linha de estado não oferece consulta analítica paginada. Se a carga medida exceder os limites, use um notebook central no Plano B e o Plano C, não prometa escala inexistente.

O limite de 10 MB e o teste funcional local **não substituem teste de carga nem medição de cotas reais**. O histórico de recibos e a auditoria não são apagados automaticamente. Uma política de arquivamento deve ser aprovada; nunca zerar histórico para contornar limites.

## Implantação futura, somente após aprovação

1. Fazer inventário somente de estrutura, funções e permissões atuais; exportar backup privado atualizado e conferir restauração isolada. Não colocar backup em Git.
2. Revisar o SQL e diferenças contra o esquema existente, dependência `fda_admins`/Auth, permissões e conflitos de nomes. Nunca usar scripts antigos de reinstalação. O arquivo separado `sql/002_corte_apis_legadas_REVISAO.sql` propõe revogar endpoints legados de escrita e leitura privada na janela de corte aprovada. **A migração aditiva 001 sozinha não fecha `fda_create_order` antigo**: manter esse endpoint anônimo aberto preservaria risco de abuso e registros fora do estado v2. O 002 não apaga nem modifica registros e não foi executado no Supabase. Leituras públicas antigas continuam mostrando dados legados, portanto o link antigo deixa de ser anunciado após a virada.
3. Definir a conciliação do histórico e uma janela de corte com apenas um modo registrando novas vendas. Não há importador automático do legado: sua ausência evita duplicar receita, reservas ou pedidos.
4. Após autorização específica, aplicar a migração aditiva no mesmo projeto Free, cadastrar apenas URL/chave pública na configuração local de implantação e testar com equipe e dados autorizados. Nenhuma dessas ações ocorreu nesta entrega.
5. Confirmar perfis, logout, Pix real, estoque, painel em dois aparelhos, erros/repetições, concorrência, quotas e recuperação. Pedidos públicos devem permanecer bloqueados até proteção real validada.
6. Publicar somente com autorização expressa separada, preservando o HTML atual e backups fora do repositório público.

## Reprodução dos testes isolados

Instale `@electric-sql/pglite` em uma pasta temporária, sem alterar o projeto. Exemplo de comando usado no ambiente de desenvolvimento:

```sh
npm install --prefix /tmp/fda-pgtest --no-audit --no-fund --ignore-scripts @electric-sql/pglite@0.5.14
node desenvolvimento/sql/test-local.mjs
```

Por padrão o teste importa o pacote em `/tmp/fda-pgtest/node_modules/@electric-sql/pglite`. `FDA_PGLITE_MODULE` pode selecionar outro caminho local instalado. Ele cria somente banco efêmero; não fornece opção DSN e não executa o script no Supabase.
