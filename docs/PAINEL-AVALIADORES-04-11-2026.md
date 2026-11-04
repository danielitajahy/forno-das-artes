# Painel dos Avaliadores — entrega de conferência de 04/11/2026

Continuação de `b3186659294f146e168a964204d8ee1f78fc38c7`, na branch `codex/frontend-feira-2026-11-03`. O módulo financeiro não foi recriado: o painel chama `financialResults`, as fichas técnicas e os cálculos existentes. Sem merge, publicação operacional, SQL, migração automática, alteração do Supabase ou operação bancária.

## O que está implementado

- Área **Painel dos Avaliadores**, com indicadores consolidados, “Ver cálculo”, fichas por sabor/modalidade e indicação **Dados locais**, data e revisão do retrato apresentado.
- Investimento inicial declarado; capital aportado e devoluções; despesas pagas/previstas; reembolsos; receitas, taxas comprovadas e estornos; caixa; resultados realizado/projetado; margens e previsão conservadora de doação.
- Modo pitch com oito indicadores principais, opção de mostrar todos e detalhes de produção, custos e margens. Identidade institucional preservada; contraste de título, detalhes e controles verificado no navegador.
- Relatório em nova janela, com cálculos abertos e opção de **Imprimir / Salvar como PDF**, sem serviço pago. O PDF salvo é independente da internet. Exemplo fictício de 12 páginas incluído em `evidencias/avaliadores-2026-11-04/PRESTACAO_CONTAS_EXEMPLO_FICTICIO.pdf`.
- Perfis locais ADMINISTRADOR, FINANCEIRO, APRESENTADOR, VENDEDOR e COZINHA. Cadastro, edição, concessões financeiras, bloqueio e redefinição seletiva em **Gestão → Gerenciar Acessos**. Contas novas ficam bloqueadas até marcar a liberação.
- APRESENTADOR consulta somente a projeção consolidada; não recebe o estado financeiro individual, credenciais, notas privadas, contatos, dados bancários ou o cadastro de pessoas. O relatório não usa descrições livres de despesas, nomes de contribuintes nem valores individuais.
- PINs novos com quatro dígitos sem zero inicial, verificados com PBKDF2-SHA256/210.000 iterações. Administração, Financeiro e Apresentador exigem também senha individual de 12–200 caracteres. Cinco falhas bloqueiam o acesso por PIN durante cinco minutos, com persistência local. Não há PIN financeiro usado como única proteção.
- Cada alteração de conta invalida suas sessões anteriores. O bloqueio é verificado novamente antes de consultar ou gravar, inclusive na mesma transação dos comandos. A identidade da sessão local não pode ser promovida por atribuição ao objeto público `actor`.
- Trilhas dos novos acessos por PIN e alterações administrativas registram responsável, conta, data e horário; não registram PIN ou senha. O financeiro novo inicia em consulta e só executa os comandos explicitamente concedidos.

## Campos reaproveitados e dados opcionais

| Origem existente | Utilização |
|---|---|
| orders.paidAt/status/total/lines e refunds | Vendas pagas válidas, bruto histórico, estornos e margens históricas |
| expenses.amount/paid/payerSource/reimbursedAt | Despesas previstas/pagas e reembolsos separados |
| contributions e returns | Aportes, capital devolvido e valores ainda devidos |
| stock e availability | Quantidades físicas, reservadas e disponíveis por modalidade |
| recipes, costSnapshot e paymentFees | Ingredientes, embalagens, custos históricos e taxas comprovadas |
| prices e preços individuais do menu | Preços atuais e futuras alterações |

`pitchSettings` é facultativo: investimento inicial declarado, custos fixos, taxa variável, outros custos variáveis por fatia/inteira e confirmação de abrangência da produção. `production` é uma trilha documental de lotes de pizzas de 35 cm. Esses campos só são criados ao salvar explicitamente; nenhum backup antigo é reescrito para preenchê-los.

**Estoque não é produção.** Um lote documental não adiciona estoque. O total produzido aparece “Não apurado” até confirmar que todos os lotes desde o início foram registrados. Fatias produzidas são uma equivalência de oito por pizza, não prova de corte físico.

As novas contas ficam em `access-v1` e as tentativas em `access-attempts`, separados do estado financeiro, sem mudar nome/versão do IndexedDB. O backup financeiro anterior continua sem credenciais; as novas contas também **não são migradas automaticamente por esse backup**. Preserve o navegador/perfil e a instalação onde foram cadastradas. Uma futura transferência segura das contas exige procedimento específico. As contas administrativas e financeiras anteriores permanecem com seus acessos e permissões anteriores. Nenhuma planilha privada dos estudantes foi importada, nenhum PIN real foi redefinido e não se afirma ter homologado os 37 cadastros privados nesta cópia fictícia.

## Fórmulas e interpretações

Os cálculos financeiros seguem `docs/PAINEL-FINANCEIRO-04-11-2026.md`. Aguardando Pix não é receita; aporte é capital; estorno efetivo e obrigação de estorno são separados. Compras entram no resultado por despesas e não se desconta novamente o custo de ingredientes nesse resultado. Margem por produto continua sendo receita válida menos o custo histórico do produto, sem descontar compras novamente.

- **Investimento inicial:** informado e conferido pela administração; não inferido de compras/aportes e não movimenta caixa.
- **Caixa disponível para devolver aportes:** menor entre capital ainda devido e caixa após taxas, reservando estornos pendentes, reembolsos e despesas previstas; piso zero.
- **Disponibilidade para futura doação:** máximo de zero ou menor entre resultado projetado e caixa após reservar as obrigações acima e todo o capital ainda devido. Não é doação realizada nem autorização de transferência.
- **Ponto de equilíbrio por sabor/modalidade:** teto de custos fixos ÷ contribuição unitária; contribuição = preço atual − custo unitário com embalagem − taxa variável − outros custos variáveis. Somente calculado com todas as premissas e contribuição positiva. É hipótese de venda exclusiva daquele produto/modalidade, sem somar os pontos entre sabores e sem presumir o mix de vendas.

Ausência de dados aparece **Não apurado**, inclusive custos históricos sem base e taxas não conferidas. Zero precisa de cadastro explícito. O equilíbrio usa valores unitários em centavos. As premissas de equilíbrio não criam despesas nem alteram preços. As fórmulas aparecem ao lado de cada indicador para explicação durante o pitch.

## Permissões e limites de segurança

| Perfil novo | Consulta | Gravação |
|---|---|---|
| ADMINISTRADOR | Gestão e financeiro completos | Administração, acessos e comandos existentes |
| FINANCEIRO | Financeiro e avaliadores | Somente comandos financeiros concedidos; nenhum por padrão |
| APRESENTADOR | Consolidados, cálculos e PDF | Nenhuma operação financeira, de vendas, produção ou administração |
| VENDEDOR | Cardápio, próprios pedidos e fila pública | Criar pedidos com autoria automática; não confirmar pagamento ou editar pedido |
| COZINHA | Pedidos pagos para preparação e registro de produção | Situação do pedido e lote documental; sem financeiro |

A camada LocalStore recusa as chamadas proibidas e retorna projeções conforme o perfil. O motor puro `reduce` também recusa comandos de APRESENTADOR, inclusive repetição de comandos já executados por administrador. Esconder botões não é a única checagem.

**Limite importante:** o armazenamento ainda é local. Quem controla o sistema operacional, DevTools, arquivos ou IndexedDB pode adulterar o aplicativo. A proteção local não equivale à autorização de um servidor. Para o pitch, use notebook supervisionado e perfil de sistema protegido, não distribua o banco individual a dispositivos dos avaliadores.

Os PINs novos, o painel online e os novos comandos não foram implantados/homologados no backend. O adaptador recusa os novos PINs e comandos de apresentação online antes de enviar chamada; o login online anterior continua exigindo função reconhecida pelo servidor. Não foi executada migração para criar permissões no Supabase. Essa integração segura no servidor permanece pendente e exige ambiente e aprovação específicos.

## Testes e evidências — não confundir testes antigos com novos

| Grupo | Resultado | Classificação |
|---|---|---|
| tests/evaluators.test.mjs | 13 testes aprovados | Novos: projeção, produção, equilíbrio, doação, privacidade, permissões, replay e bloqueios online |
| tests/test_evaluators_launcher.py | 4 testes aprovados | Novos: argumento/porta 8872, conflito sem troca de origem, rotas e seletor Windows |
| tests/evaluators-browser.cjs | 20 verificações aprovadas | Novas: cinco perfis, cadastro pela tela, 14 chamadas diretas proibidas, PIN/senha, reset, revogação, excesso de tentativas, atualizações, PDF, pitch, contraste e celular |
| Demais testes Node | 66 aprovados | Regressão do sistema anterior |
| Demais testes Python/PowerShell | 16 aprovados | Regressão dos inicializadores/servidores |
| Navegador operacional e financeiro anteriores | 12 + 14 verificações aprovadas | Regressão, com novos contextos e dados fictícios |

São **37 testes/verificações novos aprovados**, além de **108 de regressão**. Os números contam casos/verificações, não cada assert interno. Logs, JSON, capturas de notebook/celular e primeira página do PDF estão em `evidencias/avaliadores-2026-11-04`.

Os testes antigos de inspeção de dados usam leitura privilegiada do IndexedDB fictício no harness, pois a API pública agora retorna somente a projeção permitida. Isso não é acesso concedido a APRESENTADOR.

Foi corrigido durante os testes um conflito do campo oculto chamado `id` com a propriedade DOM do formulário, que impedia o envio do cadastro de acessos; o campo agora é `accountId`. Também foi corrigida a atualização da tela de configuração entre sessões locais e o contraste do cabeçalho do pitch.

O PDF foi gerado pelo Chromium e inspecionado por extração de texto e imagem; nenhum marcador de pessoa, PIN ou banco fictício privado vazou. A prévia HTTP foi validada, sem criar IndexedDB. A tentativa de abri-la diretamente por `file://` foi bloqueada pela política do navegador gerenciado (`ERR_BLOCKED_BY_ADMINISTRATOR`); esse caminho não foi considerado aprovado. Use a prévia pelo servidor local incluído.

PowerShell foi testado em Linux. Windows físico, impressora, telão e os equipamentos dos totens ainda precisam de conferência presencial. Não se afirma homologação nesses equipamentos, sincronização de celulares nem Pix automático Mercado Pago.

## Preservação e próximos passos

Os ZIPs anteriores de conferência dos totens e do painel financeiro, assim como PREVIA_VISUAL.html e PREVIA_FINANCEIRA.html, permanecem intactos. O painel novo usa PREVIA_AVALIADORES.html e iniciador 8872. Não foi lido/importado backup real nem repetida a exclusão dos pedidos de teste já tratados na cópia privada. Migração operacional permanece bloqueada até validação expressa.

Próxima conferência: abrir a prévia no notebook/telão, revisar as fórmulas com o financeiro, preencher premissas e produção apenas na base autorizada e testar os acessos individuais. Só depois considerar aprovação de transferência dos dados e implantação. Pix automático, autorização online dos novos perfis e sincronização entre dispositivos continuam pendentes.
