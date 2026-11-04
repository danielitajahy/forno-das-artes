# Painel de Resultados Financeiros — versão de conferência

Implementado em cópia de testes na branch `codex/frontend-feira-2026-11-03`. Sem merge, publicação do site, migração, alteração do Supabase, PINs ou operações bancárias. A entrega anterior dos totens e a sua prévia foram preservadas integralmente.

## Estrutura e campos reaproveitados

| Bloco | Campos existentes |
|---|---|
| Vendas pagas, estornos e obrigações | orders.paidAt, total, status, lines.productId/mode/qty/unitPrice/unitCost; refunds; returnedToStock |
| Caixa, despesas e capital | expenses.amount/paid/payerSource/reimbursedAt; contributions; returns; cashSessions; totals |
| Custos e margens por sabor | menu.id, preços gerais e individuais, menu.cost, linhas históricas |

Novos campos opcionais: recipes (35 cm, oito fatias, ingredientes, quantidade, unidade e custo unitário, embalagens por modalidade); paymentFees (conferência manual por pedido, histórico de correções e vínculo opcional a uma despesa); costSnapshot em novas linhas de pedidos. Nenhum campo é inserido automaticamente nos backups antigos. IndexedDB mantém o mesmo nome e versão. Alterações autorizadas são registradas no histórico existente.

## Fórmulas e critérios

- Recebimentos brutos: soma dos pedidos com paidAt, incluindo recebimentos posteriormente devolvidos; vendas válidas excluem os cancelados. Pedidos aguardando Pix ficam fora da receita.
- Líquido após devoluções: recebimentos menos estornos efetivos. Líquido após taxas exige conferir a taxa de cada recebimento, inclusive zero quando comprovado. Taxa desconhecida mantém o resultado estrito como não apurado; o subtotal parcial fica identificado.
- Caixa: recebimentos − estornos − despesas pagas pelo caixa − reembolsos pagos + aportes − devoluções de aportes − taxas conferidas ainda não incluídas em despesas. Não representa saldo bancário conciliado.
- Resultado operacional realizado, pelo critério explícito de despesas pagas: recebimentos − estornos − obrigações de estorno ainda pendentes − taxas − despesas pagas. Se uma taxa já integra uma despesa paga, o vínculo evita sua segunda subtração. Projetado: realizado menos despesas previstas. Aportes e devoluções de capital não entram nesses resultados. Despesa paga por pessoa entra como despesa uma vez; seu reembolso posterior afeta somente o caixa.
- Custo de produção de uma pizza: soma de quantidade × custo por unidade de cada ingrediente, com conversão g/kg e ml/L. Cada ingrediente é arredondado ao centavo. Fatia: produção ÷ 8 + embalagem da fatia. Inteira: produção + embalagem da inteira. Embalagem é aplicada uma única vez, por unidade vendida da modalidade.
- Margem bruta do produto: receita válida − custo histórico dos produtos vendidos. Não subtrai as compras de ingredientes novamente. Resultado acumulado do produto também desconta perdas conhecidas de cancelamentos sem retorno físico. Esta margem não se soma ao resultado operacional; são critérios distintos.
- Divisão em oito preserva frações de centavo internamente até o total; valores exibidos são arredondados. Preços atuais partem de R$12,00/R$49,90 e respeitam alterações futuras. Fotografia do custo/preço do pedido não muda ao editar uma ficha posteriormente.

## Dados ausentes e limites

Custo não cadastrado aparece como não apurado. Zero só é usado quando informado explicitamente; zero legado sem ficha não prova custo gratuito. Custo manual positivo anterior é tratado como total legado da modalidade, sem somar embalagem novamente. Uma ficha incompleta não recorre silenciosamente ao custo manual. Vendas históricas sem custo conhecido não são recalculadas com receitas atuais. Em cancelamento com retorno físico, a recuperação da embalagem não é presumida: havendo embalagem não comprovadamente zero, a perda fica não apurada.

A nova ficha considera os ingredientes e embalagens cadastrados. Energia, mão de obra, desperdícios e tributos não cadastrados não são inventados. Margem bruta não equivale a lucro líquido contábil. Vínculo de taxas a despesas deve ser conferido pelo financeiro para não duplicar um lançamento.

## Como conferir sem usar os dados da feira

1. Extraia o novo ZIP em outra pasta. Não sobrescreva a instalação dos totens.
2. No Windows, execute TESTAR_PAINEL_FINANCEIRO_WINDOWS.cmd. Ele usa http://127.0.0.1:8871, separado da origem operacional 8766. O Windows físico ainda requer conferência no notebook.
3. Alternativa com Python: python iniciar.py --financial-test. Não importe backup real nesta origem.
4. Para apenas olhar exemplos, abra PREVIA_FINANCEIRA.html: demonstração explicitamente fictícia, em memória. A prévia anterior PREVIA_VISUAL.html continua disponível.
5. Na aplicação de teste, configure acessos fictícios; entre em Gestão para fichas, resultados e conferência de taxas. Custos reais devem ser cadastrados e conferidos pela equipe posteriormente.
6. Confirme vendas somente com referências fictícias. Exporte resultados em CSV e backup privado pelo fluxo existente. Não envie backups para repositórios públicos.

## Atualização e permissões

Implementação funciona no Plano B do notebook, com IndexedDB e arquivos locais. Atualiza após comandos confirmados e entre abas da mesma origem/perfil do navegador, por BroadcastChannel. Outros celulares/notebooks não sincronizam. Os comandos novos ainda precisam de implementação, autorização e validação no backend online. Modo online mostra essa pendência explicitamente. Nenhuma sincronização Wi-Fi multicelular foi implementada.

Somente Gestão administrativa e perfil financeiro acessam o painel e editam fichas/taxas; visitantes e vendedores não recebem essas telas. A proteção offline é a do aplicativo local, não equivale a autorização segura em servidor contra alguém com acesso completo ao navegador/notebook. Pix automático Mercado Pago continua sem homologação oficial; os testes confirmaram pagamentos fictícios manualmente, sem contato bancário.

## Validação

66 testes Node passaram (44 anteriores e 22 financeiros); 16 testes Python/servidor/inicializador passaram. Playwright/Chromium executou 14 verificações financeiras e 12 verificações da regressão da operação anterior. Logs, JSON e capturas estão em evidencias/painel-financeiro-2026-11-04. Incluem preços futuros, receitas, taxas, despesas, aportes, cancelamento, estornos parcial/total, reembolso, perdas, persistência, atualização entre abas, restrições de perfil e layout móvel. São dados fictícios em contextos novos, sem tocar a origem operacional.

PowerShell foi verificado em runtime Linux; não se afirma teste em Windows físico, nos totens, sincronização online ou homologação bancária. A instalação anterior dos totens permanece como versão de conferência independente.
