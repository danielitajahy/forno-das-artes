# Revisão do frontend — 03/11/2026

Candidato de testes, sem publicação. Fonte obrigatória: ZIP `Forno_das_Artes_FRONTEND_PARA_CODEX_GITHUB_2026-11-03 (1).zip`, SHA-256 `1e6d2f460d940917255009f50cfd393b904e7c01d5c1e3a5ebfc61d790de03d2`. Instruções de atualização recebidas e lidas integralmente. A pasta 13 do Drive não está conectada; os anexos foram a fonte autorizada. Os outros três documentos originais da pasta citados nas instruções não vieram anexados; protocolo presente no frontend foi preservado e complementado com guia próprio, sem inventar conteúdo desses documentos.

## Comparação e escopo

A main remota consultada é `645a5ba85ac9fe1fc1057328125e98179395fee6`, com apenas `index.html`. A branch local `codex/frontend-feira-2026-11-03`, em worktree separado, recebe a arquitetura modular do ZIP. O HTML público anterior permanece recuperável no histórico Git; nenhum recurso foi descartado para simplificar a implementação. Catálogo, imagens, nutrição, conteúdo artístico, preços de referência 1200/4990, gestão, financeiro e contingência foram mantidos a partir da fonte atual.

Adicionados módulos estáticos do ZIP, módulo pequeno de intenção de pedido por aba, testes, evidências fictícias, manuais e impressos de referência preservados da entrega anterior. Não incluídos backend P0, SQL de implantação, planilha, PINs, banco de estudantes, backups financeiros ou credenciais. Não há workflow novo de deploy.

## Constatações, ajustes e evidências

| Constatação | Causa/evidência | Ajuste | Resultado |
| --- | --- | --- | --- |
| Pedido de 2 calabresas com estoque 8 | Na fonte recebida, já funciona quando há chave Pix configurada | Preservada regra; mensagem recebe foco/rolagem em erro | 1 pedido R$24, aguardando; reserva 2, livres 6, sem receita |
| Sem chave Pix | A própria fonte recebida impede o comando e já contém aviso local | Erro global traz foco e contexto; não se elimina validação | Zero pedidos/reservas; teste negativo passou |
| Relato de botão inoperante no notebook | Configuração efetiva/histórico do notebook não foram acessados | Não atribuir causa definitiva ao notebook com base na reprodução | Homologação física continua pendente |
| Cancelar abertura abria caixa | `prompt(...) || ''` convertia Cancelar em observação vazia e executava abertura | `null` cancela antes de qualquer comando | Antes 1 caixa indevido; depois 0. OK abre 1 |
| Resultado de pedido perdido e recarga | Identificadores só estavam na memória da aba | Intenção mínima por aba, UUIDs estáveis, hash da operadora e modo; consulta explícita após relogin | Commit seguido de TypeError simulado, reload e consulta: continua 1 pedido e reserva 2 |
| Consulta após relogin fora da tela de pedido | Operadora entrava pela tela de acesso | Retorno ao pedido ao consultar tentativa concluída | Senha recuperada e visível |
| Histórico e credenciais do banco | Origem/banco operacional precisam permanecer | `app/storage.js` e `app/core.js` idênticos ao ZIP | Mesmo nome/versão/store; teste compara estado antes/depois de recarga |
| Financeiro Isabela / Bárbara Cristina | Recursos presentes na fonte | Mantidos perfil restrito e dados Pix; texto da confirmação reforça comprovação externa | Devolução parcial fictícia registra R$20 de aporte R$50; sem transferência pelo site |
| Ingredientes / Devedores | Correções já presentes no ZIP | CSS e appearance preservados byte a byte | Quatro ingredientes >=4,5:1; Devedores com cor corrigida, capturas desktop/celular |
| Códigos internos | IDs históricos devem permanecer | Mapeamento só de apresentação: brasa C, batuque F, cerrado A, banana B; FAT/INT | Pedido/caixa/CSV com códigos, nomes e quantidades; sem migrar IDs |
| Recarga local | Sessão em memória é intencional | Explicação de relogin/carrinho temporário; tentativa enviada pode ser consultada | Sem auto-login ou repetição automática |
| Cache offline | Novo módulo precisa acompanhar o cache | Versão de cache e URLs atualizadas; módulo incluído nos assets | Recarga com rede desligada funciona e mantém dados |
| LAN com oito celulares | Não existe servidor/sincronização no pacote | Limitação explícita na tela e nos guias | Não implementada e não anunciada como concluída |

A hipótese de Pix explica o bloqueio reproduzido **sem chave**; não é prova da causa original no notebook. Não se declara o erro histórico corrigido somente por mudança visual: foram executados o cenário positivo completo, o negativo e a recuperação após resultado incerto, com preservação do domínio recebido.

## Banco e privacidade

IndexedDB `forno-artes-v2-desenvolvimento`, versão 1, store `data`; leitura/escrita, validações e autenticação local idênticas à fonte. Sem migrações, `deleteDatabase`, limpeza de storage, reset ou restauração automática. Não se abriu a origem operacional 8766 em testes. GitHub Pages é outra origem e não recebe automaticamente esses dados. Antes de atualizar notebook real, exportar backup privado e preservar instalação anterior, aguardando aprovação.

A intenção por aba armazena somente composição/quantidades, identidade técnica da tentativa, modo e hash da operadora; não armazena senha, PIN, chave Pix ou histórico. O botão de consulta não executa transferência ou confirmação de pagamento. Ao trocar operadora/modo, a tentativa exige conciliação com a origem correta. Não foi alterada política de PIN nem importada planilha real.

Limitação preexistente do Plano B: autorização é controle local contra uso casual, não proteção de servidor contra quem controla o notebook/DevTools. Credenciais financeiras são individuais, mas dados continuam no IndexedDB local. Não expor o servidor a rede como se fosse solução multiusuária segura.

## Testes executados

- **44 testes Node aprovados**, zero falhas/skips. São 39 regressões anteriores incorporadas (expectativas de CSS/cache/senha atualizadas ao contrato novo) e 5 novos testes de financeiro, restrições, preservação do contrato IndexedDB e intenção por aba. Os “44 testes” citados no manifesto externo não vieram com código no ZIP; este número é da suíte realmente executada aqui.
- **12 cenários Chromium aprovados**, desktop e celular: Pix ausente, pedido de R$24, clique repetido, estoque, ausência na cozinha enquanto pendente, recarga/relogin, transições fictícias, cancelamento/abertura do caixa, resposta perdida/recarga/reconsulta, Isabela/devolução parcial, contraste/mobile, contingência e cache offline; ausência de exceções próprias do app.
- Reprodução anterior ao patch guardada em `repro-before.json` e capturas: pedido com Pix já funcionava, e cancelar caixa abria indevidamente.
- Os primeiros testes estáticos reaproveitados apontaram arquivos auxiliares ausentes no ZIP reduzido; restaurados launcher e demonstração de fila da entrega anterior. Expectativas de CSS/cache/terceiro campo de senha foram atualizadas, mantendo regressões do domínio. Na automação de recuperação foi necessário corrigir a navegação para mostrar a senha após relogin; não houve duplicação de banco.
- Nenhum teste bancário, Supabase real, hardware da feira, impressora física ou oito celulares foi executado. Não houve SQL de implantação. A etapa online de teste da preparação anterior ficou sem PGlite; não é parte do resultado desta suíte frontend.

Comandos: `node --test --test-isolation=none tests/*.test.mjs`; `node tests/frontend-browser.cjs` contra servidor loopback 8821, com Playwright/Chromium. Ver [evidências](../evidencias/revisao-2026-11-03/COMPARATIVO.html).

## Arquivos alterados frente ao ZIP

- `index.html`: versão de recursos estáticos; estrutura/identidade da fonte preservadas.
- `app/ui.js`: foco de erro, pedido/consulta com identidade estável, cancelamento do caixa, explicações e códigos de apresentação.
- `sw.js`: cache versionado e novo módulo.
- Novo `app/order-intent.js`; documentação, launchers, testes e evidências.
- **Idênticos ao ZIP:** `app/storage.js`, `app/core.js`, `app/seed.js`, `app/app.css`, `app/appearance.js`, `manifest.webmanifest`. Hashes de origem em `ORIGEM-FRONTEND-2026-11-03.json`.

## Pendências e validação simples

1. Antes de qualquer atualização física: backup JSON privado, mesma origem/perfil, cópia anterior preservada. Não restaurar sobre dados existentes. Obter aprovação da responsável.
2. Em perfil de teste: cadastrar chave Pix fictícia, 8 fatias, abrir caixa, habilitar vendas, pedir 2 fatias. Conferir R$24, senha única, aguardando, reserva 2/livres 6. Sem chave, conferir aviso e zero gravações.
3. Cancelar abertura: não deve abrir caixa. Recarga exige relogin; pedidos gravados ficam. Uma tentativa incerta pede consulta pela mesma operadora; não cobrar novamente.
4. Conferir Isabela, dados Pix mascarados, despesas/aportes/beneficiários e devolução somente após confirmação externa de Bárbara. Não inserir dados reais em demonstração pública.
5. Ensaiar no notebook, sem rede, com TV HDMI e impressos. Uma única fonte registra novas vendas. LAN com celulares é uma etapa separada e não foi implementada.
6. Dinheiro autorizado pela escola é controle manual separado: o domínio eletrônico recebido é exclusivamente Pix. Não lançar dinheiro como Pix. Registro eletrônico de dinheiro requer decisão/implementação separada, sem reclassificar o histórico.
7. Pix automático Mercado Pago continua não homologado. Tarifas/CPF/credenciais TEST, HTTPS, backend, API/webhook oficial e produção estão fora desta atualização frontend e dependem de validação/autorização.
8. PR em rascunho e cópia no Drive dependem dos acessos externos. Não houve merge, push na main ou substituição do site publicado. Estado final da tentativa de envio é registrado no relatório de entrega fora do código, quando necessário.
