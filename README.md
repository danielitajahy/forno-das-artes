# Forno das Artes — candidato frontend para revisão

Branch de revisão, sem implantação. Fonte: ZIP frontend de 03/11/2026. Veja [relatório e testes](docs/REVISAO-FRONTEND-2026-11-03.md), [operação sem internet](docs/FEIRA-SEM-INTERNET.md) e [evidências](evidencias/revisao-2026-11-03/COMPARATIVO.html).

## Executar uma cópia de testes

Python 3 e navegador moderno, sem serviços pagos. No Windows abra `INICIAR_WINDOWS.cmd`; no Linux/macOS use `sh INICIAR_MAC_LINUX.sh`. O launcher utiliza **127.0.0.1:8766** e só atende o próprio notebook.

**Não inicie esta cópia na origem operacional antes de backup privado e aprovação de atualização.** Para testes use outro perfil/pasta de navegador, sem dados reais. Os testes automatizados usam portas 8820/8821 e contextos efêmeros. O histórico não acompanha o ZIP ou o repositório.

IndexedDB mantém nome `forno-artes-v2-desenvolvimento`, versão 1, store `data`. `app/storage.js` é idêntico ao ZIP recebido. Não há migração, exclusão ou restauração automática. Mesma origem exige protocolo/host/porta e mesmo navegador/perfil; GitHub Pages e celulares não compartilham o banco do notebook. Cache de interface é separado dos dados.

Sessões locais encerram na recarga. Carrinho não registrado é temporário. Uma tentativa enviada sem confirmação permanece por aba, sem senha/PIN/chave Pix, e deve ser consultada com a mesma operadora. Não registre outro pedido para substituir uma tentativa pendente.

## Operação e limitações

- Um notebook central registra vendas; TV por HDMI, oito vendedores com pré-pedidos em papel e caixa/cozinha no notebook. **Wi-Fi multiusuário não implementado.**
- Pix é confirmado manualmente após crédito real conferido. Automação bancária Mercado Pago não homologada e não incluída no frontend.
- Isabela tem conta financeira individual configurada pela administração local. Bárbara Cristina transfere fora do site; Isabela só registra após comprovação externa. Não há transferência bancária pelo sistema.
- Dinheiro autorizado pela escola deve ser controlado separadamente no protocolo manual; o fluxo eletrônico recebido permanece Pix e não deve ser usado para registrar dinheiro como se fosse Pix.
- PINs, contas e banco privado PIN4/P0 não foram incluídos ou modificados. Não há sincronização com eles.
- O controle local evita uso casual da interface, mas quem controla o notebook/DevTools pode acessar IndexedDB; não é autenticação de servidor nem segurança multiusuário online.

## Testes

`node --test --test-isolation=none tests/*.test.mjs`

Para navegador, com Playwright e Chromium disponíveis, sirva a pasta por HTTP em uma origem isolada, defina `FDA_TEST_BASE` e execute `node tests/frontend-browser.cjs`. O teste usa dados explicitamente fictícios. Não use a origem operacional. O relatório discrimina os resultados reais, limitações e dependências; versões de protocolos antigas em `docs/` são referência histórica.

A proposta do Plano A/Supabase não foi aplicada; requer revisão e autorização próprias. Nada nesta branch publica ou mescla automaticamente. Aguarde revisão do PR antes de qualquer atualização do site/notebook.
