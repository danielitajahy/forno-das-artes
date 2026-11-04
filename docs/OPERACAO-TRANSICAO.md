# Forno das Artes — operação e transição entre planos

Feira: **7 de novembro de 2026**. Este procedimento não executa nenhuma migração, não altera o Supabase e não autoriza implantação. Deve ser ensaiado pela equipe em dados fictícios antes do evento. As funções digitais efetivamente disponíveis devem ser conferidas no relatório de testes da entrega; uma instrução operacional não prova que uma integração foi implantada.

## Uma única fonte de novas vendas

A coordenação mantém uma placa no caixa: **PLANO ATIVO: A / B / C**, horário do último corte e responsável. Só o plano indicado pode aceitar novos pedidos. Outros aparelhos podem exibir dados, mas não devem registrar vendas, reservas, pagamentos ou alterações enquanto não forem a fonte ativa. Desligar a internet de um cliente não desativa o servidor: no Plano A a aceitação de pedidos deve ser suspensa no servidor por mecanismo revisado antes de liberar B/C. Se isso não puder ser garantido, a equipe não pode declarar que a troca elimina vendas online concorrentes; isole estoque e mantenha o Plano A indisponível ao público até a coordenação resolver.

Não transforme automaticamente um pedido A em um novo pedido B ou C. Preserve a senha, origem, identificador, token de repetição e preço histórico. Identifique novas vendas offline por prefixo próprio do notebook e novas vendas em papel por **C-20261107-número**. Pedido já pago não recebe nova cobrança, nova confirmação de Pix ou segunda baixa de estoque ao trocar de plano.

## Antes da feira

1. Nomear coordenação, caixa, cozinha, retirada, estoque e responsável pela conciliação. Uma pessoa pode exercer mais de um papel, mas deve registrar quem confirmou cada evento.
2. Conferir dados Pix reais com a administradora. Não usar QR fictício. Acesso ao crédito bancário é indispensável para confirmar pagamentos mesmo quando a aplicação está offline. Print não comprova recebimento. Sem acesso ao banco, aguardar confirmação; não liberar cozinha.
3. Instalar e abrir o Plano B no notebook, testar sem rede e reiniciar navegador/notebook. Usar perfil normal, armazenamento persistente e origem/endereço estáveis; não usar aba anônima. Não limpar dados do navegador. Testar recuperação em perfil separado com arquivo fictício. Backup em arquivo externo ao navegador é necessário: persistência local não substitui backup.
4. Baixar todos os recursos antes da feira. Não depender de Chart.js, fontes externas ou qualquer CDN no modo offline. O monitor externo usa a mesma máquina e somente o painel de senhas, nunca contatos ou dados financeiros.
5. Imprimir o PDF do Plano C, conferir lote, reservar canetas e uma pasta privada. O lote 01 contém comandas C-20261107-000001 a C-20261107-000024. Imprimir mais lotes com números ainda não usados. Não reiniciar numeração e não distribuir reimpressões duplicadas.
6. Conferir estoque físico utilizável por sabor e modalidade, preços vigentes, limites de venda e responsáveis. Todos os saldos iniciais devem ser reais e assinados, nunca estimados a partir de valores do kit.
7. Deixar o telefone/conta bancária do caixa e o notebook com energia e meios de recarga disponíveis. Este procedimento não contrata serviços ou exige assinatura paga.

## Rotina de venda em qualquer plano

1. Atendimento verifica disponibilidade livre e limite de venda, registra os itens e seus preços vigentes, reserva unidades e informa o total exato. Fatias e inteiras são unidades distintas; não converter sem registrar produção/desmembramento.
2. Cliente faz o Pix na conta autorizada. Caixa verifica crédito, valor e referência bancária. Associa uma transação a uma confirmação, identifica responsável e horário. Divergência exige decisão da coordenação; não tratar diferença como pago.
3. Somente a confirmação permite enviar à cozinha. Cozinha registra preparando → pronto; retirada verifica senha e itens e registra entregue. Painel público mostra somente senhas/status, sem contato ou valor.
4. Cancelar não apaga o histórico. Se pago, registrar devolução pendente e só concluir depois de conferir débito bancário. Estoque retorna apenas se o produto estiver utilizável e não tiver sido consumido/preparado; caso contrário registrar perda. Não confundir cancelamento com reembolso já feito.
5. Solicitação de reposição não reserva, não cobra e não cria pedido. Pedir consentimento e somente o contato necessário. Conferir estoque livre antes de avisar. Abrir WhatsApp não significa envio: marcar somente após envio manual. No offline/papel, avisar depois que a comunicação voltar. Cancelar interesse interrompe avisos.

## A → B

1. A coordenação anuncia interrupção temporária e bloqueia novas vendas online pelo mecanismo do servidor preparado e validado para isso. Fecha sessões operacionais paralelas e confirma o horário do corte. Não basta abrir B ou fechar uma aba A.
2. Se A estiver acessível, exportar seu estado completo por ferramenta administrativa autorizada: pedidos, itens com preços, pagamentos e referências, estados da cozinha, últimas senhas/identificadores, estoque e reservas por modalidade, despesas, aportes/devoluções e lista de espera/avisos. Guardar arquivo datado fora do navegador; não publicar. Conferir contagens e totais. Não copiar chave secreta ou sessão no backup.
3. Se o acesso falhou antes do corte, usar a última cópia íntegra disponível e registrar exatamente sua hora. Reconciliar a diferença com cozinha, caixa e banco. **Se não houver estado confiável, não restaurar cópia antiga por cima de pedidos recentes nem assumir estoque livre.** Tratar pendências conhecidas em papel, isolar reservas possivelmente ocupadas e vender apenas unidades fisicamente conferidas e separadas para B.
4. Transferir o estado apenas por formato compatível e procedimento de restauração já testado. Se não houver importador A→B validado, manter os pedidos A em uma folha de pendências com suas senhas originais e usar B somente para novas vendas sobre estoque separado. Esse é o procedimento seguro disponível; não afirmar sincronização automática.
5. Conferir amostra de pedidos pagos/aguardando, totais financeiros e estoque/reservas. A coordenação registra o corte na folha do kit, anota o prefixo/último número B, declara B único escritor e libera novas vendas. A permanece bloqueado.

## B → C

1. Pause B e feche formulários de criação. Faça exportação JSON datada e CSV quando disponível; guarde uma cópia fora do notebook, em meio privado. Não apagar IndexedDB ou restaurar arquivo no mesmo perfil durante a contingência.
2. Anote última senha B e o lote C. Liste pendências por identificador original, itens, preço, situação do pagamento, referência, cozinha e reserva. A equipe recebe esses pedidos sem renumerar ou cobrar novamente.
3. Conte estoque físico utilizável; separe reservas existentes; assine saldos livres por modalidade. Transcreva lista de espera pendente e avisos já enviados sem coletar novamente os contatos. Anote despesas, aportes/devoluções e pendências financeiras.
4. Coordenação assina a folha de corte e libera C. Novas comandas usam apenas números C nunca distribuídos. Comanda anulada permanece arquivada com motivo; nunca reutilizar seu número.
5. Se o notebook parar antes de exportar, isole-o sem limpar os dados. Continue em C com o mesmo princípio de estoque livre separado e reconciliação documentada; não invente o conteúdo que não foi recuperado.

## B/C → A: conciliar antes de retomar

1. A continua impedido de criar novas vendas. Pause a fonte de novas vendas B/C no horário combinado. Preserve backups e formulários originais. Faça cópia de trabalho, nunca edite o único backup.
2. Crie mapa de conciliação: origem + ID original + tipo de evento + referência bancária + ação de destino. Identifique registros que A já contém. Compare conteúdo, não apenas número ou valor. Não misture a mesma senha de duas origens.
3. Pedidos devem manter itens, modalidade, preço histórico e situação real. Confirmação/estorno só entram uma vez. Ajuste de estoque deve preservar livre, reservado, vendido, perdido e limite. Não aplicar duas vezes vendas incluídas num saldo transferido.
4. Individualize despesas, aportes e devoluções sem somar novamente saldos de abertura. Compare recebimentos/devoluções com o banco. Contatos da lista de espera continuam privados e conservam consentimento, ordem, cancelamento e identificação de avisos já enviados.
5. **Não existe autorização nesta entrega para importar dados reais.** Uma futura aplicação em A exige autorização expressa, backup atual, conferência do esquema instalado e ensaio em cópia isolada. Sem importador de conciliação revisado, mantenha o mapa manual e peça aprovação técnica; não execute os scripts originais de instalação/importação nem substitua tabelas.
6. A coordenação e o caixa assinam contagens, estoque e fechamento. Só depois de resolver divergências, testar autenticação e conferir o painel, A volta a ser único escritor. Mantenha B/C fechados para novas vendas. Arquive documentação da transição de forma privada.

## Fechamento e doação

Confira saldo inicial + aportes recebidos + Pix de vendas − despesas pagas − devoluções a clientes − aportes devolvidos − doações já transferidas. Compare com o saldo bancário destinado à operação. Investigue diferenças; não as esconda em ajuste sem motivo. Receita de vendas válidas difere de dinheiro recebido quando há cancelamentos com devolução pendente.

O resultado do evento considera receita válida e despesas totais (pagas e previstas). Doação só pode ser definida depois de reservar obrigações com clientes, fornecedores e alunos e conciliar saldo real. Nunca calcular doação apenas pelo lucro projetado. Use as folhas do kit e a revisão da responsável.

## Proteção e recuperação

Backups JSON, CSV e folhas com contatos/dados financeiros ficam em pasta privada; não entram em GitHub público ou no HTML do site. Reduza dados coletados. A administradora define prazo de guarda e descarte seguro dos contatos quando a finalidade terminar. A aplicação local não protege informações contra pessoas com acesso ao notebook: bloqueie o sistema operacional e restrinja sua guarda.

Teste de restauração deve ocorrer em perfil/cópia isolada, verificando a integridade e todas as coleções. A restauração não deve apagar silenciosamente dados correntes; se a ferramenta oferecida substitui estado, exigir backup anterior e confirmação explícita e só usá-la em máquina limpa após revisão. Depois compare contagens, identificadores, itens, pagamentos, reservas e saldos. Uma cópia de arquivo sem teste não prova recuperação.
