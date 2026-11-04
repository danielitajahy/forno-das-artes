# Finalização para conferência em 04/11/2026

Continuação na branch **codex/frontend-feira-2026-11-03**, sem outro projeto, sem merge ou substituição do site publicado. Este documento registra o candidato para o prazo informado; os testes físicos de Windows/totens permanecem previstos para 06/11.

## Alterações implementadas

1. Seletores reais `#lista-sabores > .card .menu-ingredients`: verde `#203f32` e marrom `#56362d`, peso 650, tamanho responsivo 16–18px, entrelinha 1,6. Botões de quantidade com alvo mínimo 48px. Identidade, sabores e preços preservados.
2. `.staff-layout .card.debt-kpi`: **fundo terracota escuro `#713a30`**, título/valor creme claro `#fff6e8`, título 16px e valor responsivo. Não alterou cálculo, revisão ou valores, conforme comparação exata do estado antes/depois.
3. `INICIAR_WINDOWS.cmd` em ASCII/CRLF, caminhos entre aspas e troca segura de diretório, validação do pacote e de Python 3.10, mensagens e `pause`. Se Python não executar, usa o **servidor estático nativo PowerShell incluído**, sem instalar dependências ou baixar projeto/GitHub. Não mata processos existentes nem muda a origem operacional.
4. `iniciar.py`: verificação de pacote, diagnóstico de porta ocupada, abertura automática com orientação de URL alternativa e bloqueio de arquivos privados/listagens. Não lê banco e não muda IndexedDB.
5. `ABRIR_PREVIA_WINDOWS.cmd` e `--preview`/`-Previa`: modo de prévia isolado na porta **8870**, serve só a prévia e saúde técnica, bloqueando o aplicativo operacional. Não usa a porta operacional 8766 nem migra dados.
6. `PREVIA_VISUAL.html`: página autônoma fictícia, montada dos módulos do frontend, sem IndexedDB, credenciais reais, chamadas bancárias ou backend. Demonstra cardápio/Gestão e perfis fictícios somente na memória. Gerador `scripts/build-preview.py`; sem dependências externas para gerar/executar no navegador por HTTP local.
7. Cache/URLs de interface atualizados. `app/core.js`, `app/storage.js` e `app/seed.js` permanecem idênticos ao ZIP autorizado; sem alteração de regras financeiras, preços, banco ou PINs.

## Testes realizados e limites

| Verificação | Resultado real |
| --- | --- |
| Node: domínio, permissões, estoque, financeiro, backups e interface | **44 testes passaram**, zero falhas/skips na execução final |
| Python e integração do iniciador nativo | **16 testes passaram**, incluindo HTTP real, recursos, privacidade, porta ocupada, modo prévia, abertura automática via mock e pré-verificação |
| Regressão Chromium completa | **12 cenários passaram**, usando o servidor PowerShell em loopback e dados fictícios |
| Finalização Chromium | **8 cenários passaram**: visual desktop/mobile, estado preservado, painel entre abas, isolamento de oito contextos e prévia sem banco |
| Ingredientes Full HD 1920×1080 | Verde **8,86:1**, marrom **7,97:1**, 18px/peso 650 |
| Devedores | **8,34:1** em título e valor; fundo terracota, textos claros |
| Mobile 390×844 | Sem overflow horizontal nos cenários testados, capturas incluídas |
| Pedido | R$24, uma senha/pedido, reserva 2/livres 6; resposta perdida e recarga sem duplicar |
| Caixa/estoque/financeiro | Fictícios; pagamento manual simulado e estados preservados na recarga; não são homologação financeira real |
| Painel | Outra aba do mesmo contexto/perfil acompanha preparar/pronto/entregue sem recarga |
| Oito contextos independentes | Cada um possui banco próprio. Resultado comprova **ausência de sincronização**, não funcionamento de oito vendedores |
| Prévia HTML | Abre por HTTP local, troca perfis fictícios, sem requisição externa ou IndexedDB |
| Arquivo `file://` da prévia | Navegação bloqueada por política do Chromium gerenciado; não foi contornada. Usar o iniciador de prévia/HTTP local |
| Windows 10/11 real / PowerShell 5.1 / duplo clique CMD | **Não executados neste ambiente Linux**; testes reais no equipamento são obrigatórios |
| Starlink, oito celulares, segundo computador sincronizado, banco real/Pix/dinheiro real | Não executados/não homologados |

O script PowerShell foi efetivamente executado com **PowerShell 7.4.6 oficial em Linux**, não apenas inspecionado. O runtime foi obtido exclusivamente para teste e não é dependência distribuída: Windows usa o PowerShell nativo. O formato do CMD, aspas, CRLF, decisões de fallback e janela persistente foram verificados por teste estático; isso não equivale a executá-lo em Windows. Causa exata do iniciador antigo no notebook ainda não foi comprovada.

Falhas de ensaio foram corrigidas sem alterar dados/regras: o teste de duplicidade mantinha um nome antigo depois da sanitização dos exemplos; corrigido para o mesmo nome fictício em minúsculas. Uma espera do teste de painel dependia de um título em caixa diferente; substituída pela verificação da transição e saída da senha. O teste de arquivo local da prévia foi explicitamente marcado bloqueado por política e a prévia foi validada pelo HTTP permitido, sem desativar controles de segurança.

## Preservação e migração

Nenhum backup de produção, cadastro de estudante, PIN ou banco operacional foi lido/alterado. A responsável confirmou os dois pedidos de teste e informou a cópia privada já preparada **Forno_das_Artes_BASE_MIGRACAO_SEM_2_PEDIDOS_TESTE_2026-11-03.zip**, na pasta 02 do Drive. **Não houve nova exclusão** nem processamento dessa cópia. Não é necessário repeti-la.

O Drive não está conectado e a base privada não veio anexada; logo não foram conferidos seus totais reais, ficha técnica, observações, aportes, despesas ou estoque recuperados. Migração operacional permanece bloqueada até validação da responsável. Arquivos públicos não contêm esses dados ou IDs reais dos pedidos. Ensaios de navegador usam contextos temporários e dados expressamente fictícios. Ferramentas preliminares de exclusão de pedidos não foram incluídas no pacote final.

O estoque/financeiro existentes permanecem no navegador e origem originais. O pacote não os acompanha nem os unifica com P0/PIN4. Antes de atualização operacional: backup privado, inventário/totalização da cópia já preparada, mesma origem/perfil e aprovação expressa. R$12/fatia e R$49,90/inteira preservados; sem restauração automática de preço antigo.

## Cenários e pendências críticas

- **Conferência e contingência central:** candidato para notebook central; painel por HDMI/outra janela no mesmo perfil; pré-pedidos em papel para oito vendedores. Funcionamento local foi testado; impressão física, toque, escala e Windows ainda precisam do fornecedor.
- **Online completo:** depende do Supabase existente, políticas/perfis, funções transacionais e sincronização homologadas. Não se verificou a instalação real por falta de acesso/configuração. Não foi criado serviço pago ou aplicado SQL. Modelo existente não entrega ainda logins de oito vendedores online nem financeiro individual online equivalente ao local.
- **Segundo equipamento independente e celulares:** não concluídos. Roteador sozinho não compartilha IndexedDB. Não usar o resultado entre abas como prova de sincronização em dispositivos diferentes.
- **Pagamento:** Pix automático Mercado Pago não homologado; confirmação manual exige crédito real conferido. Dinheiro autorizado pela escola deve ser controlado separadamente; registro eletrônico como dinheiro não está implementado e não deve ser lançado como Pix.
- **Preview externa/Drive/PR:** a página fictícia pode ser distribuída sem banco. Publicação do site operacional continua proibida. Acesso externo de hospedagem/Drive/API GitHub depende das permissões disponíveis; registrar separadamente o que foi efetivamente enviado e o que continua bloqueado.

Veja [instalação dos totens](INSTALACAO-TOTENS-04-11-2026.md), [cenários online/offline](CENARIOS-ONLINE-OFFLINE.md) e [capturas](../evidencias/finalizacao-2026-11-04/COMPARATIVO.html).
