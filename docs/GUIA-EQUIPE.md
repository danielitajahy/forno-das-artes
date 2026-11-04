# Guia da equipe — Forno das Artes

Use este guia na cópia de desenvolvimento e nos ensaios. A versão online não foi implantada no Supabase real. Antes do uso no evento, a responsável deve aprovar a configuração operacional e conferir o relatório de testes. Não publique o site, não execute SQL e não importe dados reais seguindo este guia.

## Preparar o notebook do Plano B

1. Abra a aplicação pelo servidor local conforme `../README.md`. Mantenha o terminal aberto e use sempre o mesmo endereço e perfil do navegador. Não use aba anônima.
2. Entre em **Acesso → Acesso e backups**. A faixa deve indicar **MODO OFFLINE · PLANO B · um notebook central**. No primeiro acesso escolha **Criar acesso local do notebook**, informe nome da operadora e senha com pelo menos dez caracteres e clique **Preparar acesso local**. Guarde a senha em local seguro; não anote na tela pública.
3. As vendas começam pausadas e os estoques começam sem quantidades. Entre em **Gestão**. Não altere nada no modo online durante esta preparação.
4. Confira os quatro sabores, nomes artísticos, ingredientes, imagens e fichas existentes. Os valores nutricionais são estimados e devem ser conferidos se a receita mudar. Novos sabores não recebem valores inventados.
5. Em **Preços gerais e configuração Pix**, confira fatia R$ 12,00 e inteira/congelada R$ 49,90, ou os valores autorizados para o evento. Salve e confira a mensagem de confirmação. Depois cadastre chave Pix e recebedor reais fornecidos pela administradora; se houver QR real fornecido pelo banco, carregue a imagem. Não há QR fictício, geração de cobrança ou confirmação automática.
6. Em **Estoque de fatias e pizzas inteiras/congeladas**, selecione cada sabor/modalidade, registre a entrada contada, limite de venda quando necessário e motivo. Use unidades de fatia e de inteira separadamente. Não conte a mesma pizza como inteira e fatias simultaneamente.
7. Abra **Caixa e cozinha** e escolha **Abrir caixa**. Em **Gestão**, use **Ativar vendas neste modo** somente depois de a coordenação confirmar que os outros planos não aceitam novas vendas. A existência do botão não desativa outro computador.
8. Faça um ensaio fictício, exporte backup, reinicie a aplicação e teste sem rede. Instalação/configuração real para a feira deve ser feita em ambiente separado dos movimentos fictícios; não apague dados operacionais para “limpar testes”.

A senha local fecha o acesso casual pela tela, mas alguém que controla o notebook pode ler IndexedDB pelas ferramentas do navegador. Use bloqueio do sistema operacional e mantenha o notebook com a equipe. O cadastro local não é uma conta Supabase.

## Cardápio e preços

Em **Gestão → Gerenciamento de Cardápio**, selecione um sabor para editar ou use o formulário de novo sabor. É possível ajustar nomes, descrição, ingredientes, imagem, modalidades, custo e ordem de exibição. A ordem é numérica; menor número aparece primeiro. **Ativo no cardápio** permite oferta; **Arquivado** retira da oferta e preserva histórico. Para reativar, desmarque arquivado e marque ativo.

O preço individual pode ficar vazio para herdar o preço geral da modalidade. Ao preencher um valor, ele prevalece para aquele sabor. Alterar preço geral não remove um preço individual já definido. Confira as duas modalidades antes de salvar. Pedidos existentes mantêm os itens e valores registrados.

As imagens aceitas são PNG, JPEG ou WebP, até 500 KB. Para remover, marque **Remover imagem** e salve. Não cole endereços externos, dados financeiros ou documentos de alunos no cadastro.

A nutrição usa oito valores fornecidos, separados por ponto e vírgula: kcal; carboidratos g; proteínas g; gorduras totais g; saturadas g; fibras g; sódio mg; porção g. Deixe vazio quando a informação não estiver disponível. A ficha é por fatia. Se mudar receita/ingredientes, confira também alergênicos com a responsável; o sistema não calcula nem certifica nutrição.

**Excluir sem histórico** pede confirmação e recusa produtos com vendas, lista de espera ou saldo de estoque. Nesses casos, arquive. Não zere estoque real apenas para conseguir excluir um cadastro.

## Atendimento e confirmação de Pix

1. O cliente consulta os sabores. A equipe autorizada registra o pedido pelo carrinho. Atualmente, visitante anônimo não envia pedidos ou contatos diretamente ao banco; deve procurar o caixa.
2. Escolha fatia ou inteira/congelada e quantidades. A tela mostra disponibilidade. Em **Ver pedido**, clique **Registrar pedido aguardando Pix**. O sistema reserva unidades e exibe senha e valor final. Anote/entregue a senha ao cliente.
3. Mostre a chave/QR real e o valor exato. Peça que o cliente confira recebedor e valor no banco. O QR cadastrado pode não ter valor embutido: nesse caso, o cliente deve digitar o total mostrado.
4. Em **Caixa e cozinha**, localize a senha. Abra a conta bancária autorizada e confira o crédito e valor. Print de comprovante não é prova suficiente. Não libere a cozinha sem verificar o banco. Sem internet no aplicativo bancário, aguarde; o fato de o sistema funcionar offline não confirma Pix.
5. Só depois clique **Conferi o crédito Pix na conta** e confirme a pergunta. A operação registra responsável, valor e horário e muda para **Preparando**. Informe a referência bancária conferida quando solicitada. O campo é opcional na interface, mas preenchê-lo facilita evitar dupla associação e conciliar com a folha privada de caixa. Não copie extratos completos ou dados desnecessários do pagador.
6. Cozinha escolhe **Marcar pronto** após concluir. Retirada confere senha/itens e usa **Marcar entregue**. Não prepare pedido ainda aguardando pagamento.

Os nomes/valores atuais do sabor não alteram o histórico daquele pedido. Uma demora de rede não justifica novo pedido ou novo Pix: confira o resultado antes de repetir.

## Cozinha e painel de senhas

Use **Fila de retirada** para preparar/pronto. Para monitor externo, abra outra janela do mesmo navegador, perfil e origem e acrescente `#tv` ao endereço, depois mova a janela para o monitor. Isso é outra tela do notebook central; não é sincronização offline entre aparelhos. Evite mostrar a tela de Gestão/caixa na TV.

No Plano A, enquanto a aba está visível, a consulta é periódica a cada 15 segundos. “Pronto” pode demorar até a próxima atualização para aparecer no outro aparelho. Não confunda janela aberta com conexão saudável. Na falta de rede, os dados online podem estar desatualizados e não ocorre conversão automática para B.

## Estoque, perdas e reposição

O estoque mostra físico, reservado e vendido. Registrar pedido reserva; confirmar Pix baixa a unidade física; cancelamento não pago libera a reserva. A equipe deve conferir saldo e limite de venda. Entrada de produção, perda ou ajuste requer quantidade inteira e motivo. Ajustes negativos não podem comprometer reservas existentes.

No campo de entrada, quantidade positiva aumenta físico; negativa registra redução. O campo **Limite adicional restante de venda** é uma restrição comercial, além do estoque; vazio permite vender apenas o físico livre. Não é um novo estoque produzido. Conferir reservas e vendas pendentes antes de alterar esse limite.

Quando a inteira esgota, não aceite pedido além do saldo. Use a lista de espera. A disponibilidade da tela não substitui a contagem física em uma transição entre planos.

## Lista de espera e aviso manual

Em sabor inteiro esgotado, a equipe pode usar **Avise-me quando estiver disponível**; a administradora também vê **Gestão → Lista de espera e avisos de reposição**. Registre somente WhatsApp com país e DDD e consentimento expresso. Explique que o interesse não reserva unidade, não cria pedido e não cobra.

Ao registrar reposição, Gestão destaca disponibilidade. Confira o estoque livre e siga a ordem dos cadastros. **Avisar pelo WhatsApp** apenas abre uma conversa com texto pronto; a equipe precisa enviar. Use **Confirmar envio manual** somente depois do envio efetivo. O sistema impede nova confirmação para o mesmo registro naquela reposição. Outra produção pode permitir novo aviso; verifique se ainda faz sentido e respeite cancelamentos.

Sem internet ou WhatsApp disponível, aguarde. Nunca marque enviado por apenas abrir a conversa. **Cancelar interesse e remover contato** interrompe o cadastro e remove o contato do registro ativo. Cópias antigas do backup continuam podendo conter o contato: a administradora deve aplicar sua política de retenção e descarte em arquivos privados.

Não há Web Push automático implantado nem API paga de WhatsApp. Uma solução gratuita universal de notificações não foi validada nos aparelhos da feira; a alternativa operacional é o envio manual consentido.

## Cancelar, devolver e registrar despesas/aportes

**Cancelar e documentar** exige motivo e pergunta se o produto pode retornar ao estoque. Confirme retorno apenas se a unidade estiver fisicamente utilizável; preparado/perdido não volta automaticamente. Pedido não pago libera reserva. Pedido pago cancelado continua exigindo devolução do dinheiro em separado.

Em **Histórico e devoluções Pix**, registre **Pix devolvido** somente depois de realizar e conferir a transferência no banco, informando valor e motivo/referência. O sistema não transfere dinheiro. Não repita lançamento de devolução: confira histórico e total já devolvido.

Em **Gestão → Despesas, aportes e devolução aos alunos**, registre despesas com situação paga ou prevista e cada aporte individual com valor efetivamente recebido. **Registrar devolução realizada** é para aporte já devolvido ao aluno, não para devolução de pedido. Para uma despesa prevista que já foi quitada, use **Registrar pagamento realizado** na própria despesa e confirme somente após conferir a saída. Não crie outra despesa paga para “corrigir” uma prevista: isso duplica gastos. Retificações de valor/descrição precisam preservar o histórico e de orientação da responsável.

## Fechamento e backups

Antes de fechar o caixa, confira Pix recebidos e devoluções daquele caixa no banco. **Conferir e fechar caixa** pede o saldo líquido desse movimento (recebido menos devolvido), não o saldo inteiro da conta com aportes de outros períodos. Anote justificativa se houver diferença. Pendências de pedidos precisam continuar identificadas; fechar o caixa não entrega nem cancela pedidos automaticamente.

Os indicadores de Gestão não são uma autorização de doação. Compare receita válida, despesas pagas e previstas, aportes ainda a devolver e devoluções de clientes pendentes. Só a responsável decide o saldo livre depois da conciliação. Saldos de abertura e recebimentos transferidos entre planos não são novas receitas.

Em **Acesso e backups**, entre como administradora e **Exportar backup JSON** e **Exportar relatório CSV**. Faça cópias antes de troca de plano e ao encerrar cada período. Guarde em pasta privada fora do repositório e uma cópia externa ao navegador/notebook. CSV tem valores monetários em centavos; divida por 100 ao interpretar valores em reais. O arquivo não inclui senha, mas contém contatos e informações financeiras.

Restauração só é oferecida no Plano B para instalação vazia, sem movimentos. Use um perfil separado para testar, crie o acesso local e selecione **Validar e restaurar em instalação vazia**. Não apagar ou zerar a instalação ativa. A restauração não mescla registros e deixa vendas pausadas. Confira pedidos, pagamentos, estoque, reservas e finanças antes de ativar.

## Erros e encerramento

- **Conflito de edição:** não force salvamento. Use **Atualizar dados**, compare e refaça apenas a alteração necessária; atualizar pode descartar o formulário ainda não salvo.
- **Resultado não confirmado / Verificar operação pendente:** não registre outro pedido, não cobre novamente e não troque de modo. Use a verificação da operação conservada e confira o estado depois que a rede voltar.
- **Banco indisponível:** dados online podem estar atrasados. A coordenação decide a troca de plano segundo `OPERACAO-TRANSICAO.md`; o botão de trocar modo não faz conciliação.
- **Sem acesso:** confirme nome/senha local ou conta Supabase autorizada conforme o modo. Nunca use chave secreta ou senha de banco na configuração pública.
- **Encerrar sessão:** use o botão em Acesso e confira a tela de entrada. No notebook, também bloqueie a sessão do sistema operacional. A senha local não criptografa arquivos ou armazenamento.

Para Plano C, abra `../plano-c/KIT_PLANO_C_LOTE_01.pdf` antes da feira e imprima A4, escala 100%, frente. Use uma só fonte de novas vendas. O procedimento completo de corte e retorno está em [OPERACAO-TRANSICAO.md](OPERACAO-TRANSICAO.md). Nenhum retorno ao banco real ou publicação está autorizado por este manual.
