# Instalação e ensaio no notebook da feira

Esta edição é gratuita e mantém o banco/contas online intocados. Não execute os arquivos SQL. O notebook da feira não está acessível neste ambiente: o teste executado foi em Chromium/Linux isolado; a conferência no hardware definitivo deve ser feita pela equipe.

## Preparar antes de desconectar

1. Baixe o novo ZIP e extraia a pasta `Forno_das_Artes`. Preserve o ZIP e a pasta da edição anterior. Não abra o programa diretamente dentro do ZIP.
2. É necessário Python 3 e navegador moderno já instalados. A aplicação não exige Node, Playwright, PGlite, ReportLab, fonte baixada, CDN, assinatura ou cartão. Essas bibliotecas são usadas somente para desenvolvimento/geração dos PDFs já entregues.
3. Windows: abra `INICIAR_WINDOWS.cmd`. macOS/Linux: execute `sh INICIAR_MAC_LINUX.sh`. Alternativa: `python iniciar.py` ou `python3 iniciar.py` dentro da pasta extraída. O servidor abre `127.0.0.1:8766/index.html`; mantenha sua janela aberta. Se a porta já estiver ocupada, confira o servidor anterior; não escolha outra porta aleatoriamente.
4. Use sempre o mesmo navegador, perfil e endereço. `localhost`, `127.0.0.1` e portas diferentes têm bancos locais diferentes. Não use janela anônima. Não limpe os dados do site. O aplicativo não deve ser aberto como `file://`.
5. Para ensaiar, use um **perfil separado do navegador**, com dados fictícios. A edição entregue inicia sem chave Pix, sem estoque e com vendas pausadas. Em **Acesso e backups**, crie o acesso local. Configure Pix de demonstração identificado como teste, estoque de teste, abra o caixa e ative novas vendas. Não gere QR bancário fictício nem efetue pagamento de teste sem procedimento aprovado pela responsável.
6. Abra todas as telas e aguarde a primeira carga. Todos os módulos, imagens, CSS e ícones são locais. O cache offline inclui o novo módulo visual. Os PDFs e fontes HTML do Plano C também estão na pasta, podendo ser abertos diretamente como documentos locais.

## Teste com o notebook desconectado

1. Desconecte Wi-Fi/cabo do notebook. Mantenha o servidor local aberto; ele funciona pela própria máquina, sem internet.
2. Recarregue o site e faça login local. Confira o aviso **MODO OFFLINE**.
3. No perfil de ensaio, altere preços e um sabor, registre produção/ajuste, uma despesa e um aporte fictícios. Confira as mensagens de confirmação.
4. Registre um pedido, confira valor/senha e reserva. Em **Caixa e cozinha**, declare o pagamento manual somente no cenário de teste; avance preparando → pronto → entregue.
5. Exporte JSON em **Acesso e backups** e CSV em **Gestão → Fechamentos, relatórios e trilha de auditoria**. Confira os arquivos na pasta de downloads e copie para meio privado externo ao navegador.
6. Abra outra janela do **mesmo perfil/endereço** em `#tv` para o monitor externo. Isso não compartilha dados com celulares ou outro computador.
7. Feche navegador e servidor e faça uma nova partida no notebook. Os dados IndexedDB devem continuar presentes; a sessão é encerrada e requer novo login. Faça uma impressão de prova do Plano C.

**Pix real:** o notebook pode operar sem internet, mas o caixa precisa conferir o crédito na conta usando um aparelho com acesso bancário. Se ninguém puder verificar o crédito, mantenha aguardando pagamento; não envie à cozinha. A aplicação não consulta banco, não reconhece comprovantes e não confirma Pix automaticamente.

## Atualização de uma instalação que já possui dados

Pause novas vendas e exporte o JSON pela versão anterior antes de trocar arquivos. Guarde o backup fora do repositório e preserve a pasta antiga. Encerre o servidor antigo antes de iniciar o novo na **mesma origem**. O nome e a versão do IndexedDB, o formato de backup, os dados e as regras não mudaram; esta revisão acrescenta apenas apresentação e materiais de impressão. A atualização do cache troca arquivos estáticos, não apaga IndexedDB.

Não importe um backup por cima de uma instalação com movimentos. A restauração continua permitida somente em instalação local vazia; use outro perfil para o ensaio. Não zere dados para conseguir restaurar. Dados financeiros/contatos e folhas preenchidas ficam em pasta privada, jamais no GitHub público.

## Impressão

O arquivo `plano-c/KIT_PLANO_C_DEFINITIVO_300_COMANDAS.pdf` contém 166 páginas A4, com 300 comandas numeradas em duas vias e os controles. **Não é necessário imprimir tudo.** A primeira página explica os intervalos. Páginas 5–16 repetem as 24 comandas já entregues: não distribuí-las novamente se o lote anterior já tiver sido usado.

Páginas 17–154 fornecem comandas 25–300. Controles em branco (155–165) e continuação de itens (166) podem ser impressos em mais cópias; comandas numeradas não podem ser duplicadas. Não há previsão confirmada do movimento da feira: 300 é capacidade preparada, não demanda estimada nem estoque. Mais números podem ser gerados a partir do próximo ainda livre.
