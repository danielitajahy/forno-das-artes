# Entrega para conferência — Windows 10/11 e totens

**Prazo de referência: 04/11/2026. Entrega ao fornecedor em 05/11 e testes físicos em 06/11.** Este pacote é candidato de conferência. A operação com dados recuperados só pode ser atualizada após validar a base privada e obter aprovação.

## Conferir o visual sem tocar no banco

1. Extraia **todo o ZIP** para uma pasta normal, mantendo as pastas anteriores. Não execute arquivos de dentro da janela do ZIP.
2. Abra `ABRIR_PREVIA_WINDOWS.cmd` por duplo clique. Usa o PowerShell nativo do Windows, não precisa baixar o projeto, Python ou dependências.
3. O navegador deve abrir `http://127.0.0.1:8870/PREVIA_VISUAL.html`. Se não abrir automaticamente, digite esse endereço. Mantenha a janela do iniciador aberta.
4. O aviso vermelho identifica **PRÉVIA FICTÍCIA**. Use os atalhos Cardápio/Gestão e o seletor de perfis. Nenhum estoque, nome, Pix ou saldo mostrado é real. Não informe dados reais. Essa prévia não lê IndexedDB nem conecta banco/internet; dados são somente em memória.
5. A porta **8870 é exclusiva da prévia**, não uma nova origem operacional. Não importe backups nela. O servidor nesse modo bloqueia o frontend operacional, servindo apenas a prévia e saúde técnica.
6. Fechar a janela encerra a prévia. Não limpa dados do navegador ou o servidor operacional 8766.

Se a política da escola bloquear scripts PowerShell, não altere políticas do computador nem peça execução como administrador sem o responsável técnico. Use o Python já aprovado pela equipe com `python iniciar.py --preview` ou solicite ao técnico autorização do script local. O pacote não muda a política permanente do Windows.

## Testar o aplicativo completo em base fictícia

`INICIAR_WINDOWS.cmd` verifica pacote e Python 3.10+. Tenta `py -3`, depois `python`; se não estiverem disponíveis, usa o servidor nativo `INICIAR_WINDOWS.ps1`. Não baixa projeto ou pacotes. As janelas exibem erros e ficam abertas com `pause`.

**Não use esse iniciador no perfil operacional antes de aprovação.** Para conferir funcionalidades completas, o fornecedor deve usar um perfil Windows/navegador separado e dados fictícios, em máquina de ensaio. A origem operacional continua `http://127.0.0.1:8766/index.html`; a prévia não é migração.

O navegador abre automaticamente. Se falhar, digite o endereço exibido. Se a porta estiver ocupada, o programa não mata outro servidor, não muda a porta e não apaga banco: preserve o trabalho e peça ao responsável encerrar o servidor correto. Não feche um servidor operacional sem backup e conciliação. Se aparecer “Pacote incompleto”, extraia todo o ZIP novamente em outra pasta, sem sobrescrever a operação antiga.

A correção trata falhas prováveis do iniciador anterior: procura de Python sem verificar execução/versão, ausência de alternativa quando Python não existe, recursos não extraídos e mensagens insuficientes. A causa exata no Windows anterior não foi confirmada; não há logs daquele equipamento.

## Teste de aceitação do fornecedor em 05/11 e 06/11

- Tela touch Full HD 1920×1080; confirmar leitura em 15 polegadas. Usar zoom do navegador de pelo menos 100%; conferir escala Windows 125%/150% se necessário. Ingredientes em 16–18px e botões do cardápio com área mínima de 48×48px.
- Ingredientes: verde escuro nos cartões verdes e marrom escuro nos rosé. Card Devedores: fundo terracota escuro, título e valor claros.
- Perfil de ensaio: Pix **fictício**, caixa aberto, vendas habilitadas e 8 fatias. Registrar 2 fatias: R$24, senha única, aguardando, reserva 2/livres 6. Cliques repetidos e reabertura não duplicam pedido. Não fazer Pix real no teste.
- Cancelar abertura não abre caixa. Reabrir navegador exige login; pedidos gravados ficam. Consultar tentativa pendente com a mesma operadora, sem cobrar novamente.
- Confirmar pagamento **somente fictício**, concluir preparo/pronto/entregue e conferir fila.
- Aportes/despesas/beneficiários e devoluções fictícios; Isabela registra somente depois da comprovação externa de Bárbara Cristina. O sistema não transfere dinheiro.
- Testar desligamento/reinício, falta de internet e impressão de prova. Documentar versão, navegador, perfil e origem usados. Sem limpar dados ou importar sobre uma instalação com movimentos.

## Equipamento de senhas e vendedores

**Disponível no Plano B:** uma segunda janela do mesmo navegador/perfil acompanha as senhas; pode ser exibida por HDMI em TV/monitor. É o mesmo computador e o mesmo IndexedDB.

**Não disponível:** segundo computador/totem independente e oito celulares compartilhando os pedidos offline. Wi-Fi/roteador sozinho não fornece isso. Oito vendedores podem operar com pré-pedidos em papel, e só o notebook central registra vendas. Não fornecer a senha administrativa aos estudantes como alternativa.

O painel e os testes locais não comprovam internet Starlink, sincronização real entre equipamentos, autenticação de oito vendedores ou operação bancária. Esses itens continuam bloqueadores do cenário online completo; veja `CENARIOS-ONLINE-OFFLINE.md`.

## Dados recuperados

A cópia privada preparada sem os dois pedidos de teste deve ser preservada como já foi entregue; **não excluir novamente**. A validação dela não foi executada aqui porque o Drive não está conectado. Backup original, banco operacional, PINs, ficha técnica e histórico não foram acessados ou modificados.

Antes da atualização real: backup privado, identificação da base correta e conferência de estoque/modalidades, custos/ficha técnica, aportes, despesas, devoluções, beneficiários e todos os totais, preservando preços de R$12/R$49,90. Nenhuma restauração ou migração automática é feita pelo pacote. Instalações existentes com movimentos não devem ser sobrescritas.
