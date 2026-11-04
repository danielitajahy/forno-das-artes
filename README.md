# Candidato para conferência de 04/11/2026

**Comece pela prévia sem dados:** extraia todo o ZIP e abra `ABRIR_PREVIA_WINDOWS.cmd`. Ela abre em `http://127.0.0.1:8870/PREVIA_VISUAL.html`, somente fictícia e em memória. Não usa o banco operacional.

Leia [instalação para os totens](docs/INSTALACAO-TOTENS-04-11-2026.md), [relatório atual](docs/RELATORIO-FINALIZACAO-04-11-2026.md) e [capturas antes/depois](evidencias/finalizacao-2026-11-04/COMPARATIVO.html). O Windows real ainda precisa ser testado; o script PowerShell foi executado/testado em Linux. Não atualizar a operação antes de validar a base privada e obter aprovação.

Os dois pedidos de teste já foram removidos da cópia preparada pela responsável: não excluir novamente. A migração operacional não foi executada. **Segundo computador e oito celulares sincronizados não estão prontos**; ver [cenários](docs/CENARIOS-ONLINE-OFFLINE.md).

---

## Histórico da revisão anterior

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
