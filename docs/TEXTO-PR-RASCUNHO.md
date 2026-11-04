Atualiza a versão antiga de arquivo único com o frontend de testes fornecido em 03/11, preservando o contrato IndexedDB e o financeiro restrito da Isabela. Cancela corretamente a abertura de caixa quando o diálogo é dispensado e permite consultar a mesma tentativa de pedido após resposta perdida/recarga, sem duplicar pedido ou reserva. Mantém contraste, conteúdo, códigos operacionais e protocolo de notebook central/HDMI/papel.

Validação: 44 testes Node e 12 cenários Chromium, somente dados fictícios. Pedido de R$24 com estoque 8 resulta em um pedido aguardando Pix, reserva 2 e 6 livres. Sem chave Pix é bloqueado com mensagem. A causa específica no notebook real continua sem confirmação; não se declara o relato resolvido por alteração visual.

`app/storage.js` e `app/core.js` são idênticos ao ZIP recebido. Sem migração/reset, PINs, credenciais ou dados reais. Sem deploy ou merge. Wi-Fi com múltiplos celulares e Pix automático bancário não implementados/homologados. Dinheiro deve permanecer separado do fluxo eletrônico Pix.

Revisar `docs/REVISAO-FRONTEND-2026-11-03.md` e `evidencias/revisao-2026-11-03/COMPARATIVO.html`. Aguardar aprovação expressa antes de atualizar site/notebook.
