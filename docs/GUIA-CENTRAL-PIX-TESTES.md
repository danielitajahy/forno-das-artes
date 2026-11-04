# Como conferir a Central Pix sem dados reais

**Esta é uma demonstração com banco compartilhado de testes, não uma instalação operacional para oito celulares.** A conta/chave Pix são fictícias e não permitem pagamentos reais.

1. Preserve as pastas e ZIPs anteriores. Extraia o novo ZIP inteiro em outra pasta.
2. Para testar o banco compartilhado no Windows, instale gratuitamente **Node.js 24 LTS ou superior** pelo site oficial https://nodejs.org/ e execute `TESTAR_CENTRAL_PIX_COMPARTILHADA_WINDOWS.cmd`. O iniciador não instala nada automaticamente e não requer serviço pago.
3. Mantenha a janela aberta e abra `http://127.0.0.1:8874/index.html?central-pix=teste#acesso`.
4. A base fictícia fica em `.central-pix-testes/conferencia.sqlite`, separada do IndexedDB e das versões 8766/8871/8872. Ao reiniciar, os pedidos de teste permanecem. Não apague ou substitua esse arquivo para resolver problemas. Se houver erro ou porta ocupada, preserve o arquivo e solicite diagnóstico; não troque para outra operação sem conciliar.
5. Para representar usuários diferentes no mesmo computador, use perfis de navegador independentes ou outro navegador. Abas do mesmo perfil compartilham o cookie de sessão e não representam vendedores diferentes. Os testes automatizados usaram oito contextos independentes. Acesso físico por celulares não está habilitado.

## Contas exclusivamente fictícias

| Perfil | PIN de teste | Senha adicional de teste |
|---|---|---|
| Vendedor fictício 1 a 8 | 8101 a 8108 | Não exigida nesta demonstração |
| Financeiro fictício | 8201 | FINANCEIRO-TESTE-2026 |
| Caixa fictício | 8202 | CAIXA-TESTE-2026 |
| Administração fictícia | 8301 | ADMINISTRACAO-TESTE-2026 |
| Cozinha fictícia | 8401 | Não exigida nesta demonstração |
| Apresentador fictício | 8501 | APRESENTADOR-TESTE-2026 |

Não são contas dos estudantes ou da equipe real. Não use PINs reais nesta cópia. Estas credenciais públicas impedem que a demonstração seja tratada como produção. O simulador não oferece importação automática de contas ou de backups reais.

## Ensaio do fluxo

1. Entre como vendedor fictício, escolha uma ou duas fatias e registre o pedido. Uma senha única é gerada e o estoque fica reservado, sem receita.
2. Clique **Cliente informou que pagou — solicitar conferência**. É somente uma simulação: não pague e não consulte banco real para preencher a demonstração.
3. Em outro perfil do navegador, entre como Financeiro fictício e abra **Central Pix**. Confira senha, valor, horário, vendedor e estado.
4. Abra **Conferir crédito deste pedido no extrato**, informe uma referência explicitamente fictícia e única, como `TRANSACAO-FICTICIA-001`, e simule o crédito exato. A caixa de confirmação representa o procedimento que exigirá consulta ao extrato real somente na futura operação aprovada.
5. Clique em **Confirmar crédito conferido no banco**. O pedido deixa a lista de pendentes e passa a preparar. Registra responsável e horário. Vendedor não tem esse poder.
6. Tente usar a mesma referência fictícia em outro pedido: deverá ser bloqueado. Para simular banco sem referência, use uma identificação fictícia única da linha do extrato, como `EXTRATO-FICTICIO-2026-11-04-LINHA-002`.
7. Teste **Sinalizar divergência / pagamento não localizado**. Nenhuma sinalização libera cozinha ou receita. Confirmação posterior exige valor exato e resolução expressa.
8. Entre como Cozinha em um terceiro perfil e confira que somente pedidos pagos aparecem para preparar.

## Apenas olhar o visual, sem Node.js

O arquivo **PREVIA_CENTRAL_PIX.html** contém oito pedidos fictícios em memória e não se conecta ao SQLite. Pode ser servido pelo iniciador estático anterior: `TESTAR_AVALIADORES_WINDOWS.cmd`, seguido de `http://127.0.0.1:8872/PREVIA_CENTRAL_PIX.html`. Isso é só prévia visual local, sem sincronização entre usuários.

Não confunda a prévia/Plano B local com o servidor compartilhado de testes. O modo local informa explicitamente que não recebe pedidos de oito celulares. A abertura direta do HTML por arquivo pode depender da política do navegador; o endereço HTTP local é o caminho verificado.

O arquivo SQLite, seus arquivos `-wal`/`-shm` e quaisquer backups são privados: não publique, não envie ao GitHub. Não copie um SQLite em uso para tentar migrar uma operação; um procedimento de backup/restauração seguro para implantação ainda precisa ser definido e aprovado.
