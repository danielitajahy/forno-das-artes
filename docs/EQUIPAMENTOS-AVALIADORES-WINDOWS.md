# Responsável pelos equipamentos — cópia de conferência dos avaliadores

1. Preserve as pastas e ZIPs anteriores dos totens e do painel financeiro. Extraia **todo** o novo ZIP em outra pasta normal, fora do ZIP.
2. Execute `TESTAR_AVALIADORES_WINDOWS.cmd`. Ele usa PowerShell incluído no Windows e o servidor estático do pacote, sem instalar dependências pagas. Alternativa: `python iniciar.py --evaluators-test` com Python 3.10+.
3. A cópia usa `http://127.0.0.1:8872/index.html`. Não usa a origem operacional 8766 nem a financeira 8871. Não troque de porta nem limpe dados se houver conflito: feche conscientemente somente o teste anterior em 8872.
4. **Para olhar a demonstração já preenchida:** abra `http://127.0.0.1:8872/PREVIA_AVALIADORES.html`. Todos os valores são fictícios e ficam apenas em memória. Esta é a opção mais simples para ensaiar o pitch. Cadastro de usuários reais e restauração são bloqueados na prévia.
5. **Para testar cadastros:** no index da origem 8872, crie uma administração fictícia em Acesso. Em Gestão → Gerenciar Acessos, cadastre pessoas fictícias, perfil, PIN e senha adicional, e marque a liberação quando apropriado. Não use os PINs reais dos estudantes nos testes.
6. Na aplicação de teste vazia, o cardápio existe, mas não há custos nem lançamentos financeiros reais. Use somente dados fictícios. Não importe backup real nesta origem. A prévia é separada e não injeta sua demonstração no IndexedDB.
7. O notebook e o navegador autorizados são o centro do Plano B. Use HDMI para telão. Se abrir outra janela, mantenha o mesmo navegador/perfil e endereço. Outros celulares e totens não recebem estes dados automaticamente.
8. Confirme na máquina física: início do servidor, campos/contraste, projeção HDMI, bloqueio de perfil, impressão A4 e destino Salvar como PDF. Guarde o PDF para consulta offline. Sem internet o painel local funciona; comprovação bancária continua dependendo do acesso ao banco.
9. Fechar o servidor não apaga os dados. Não limpe armazenamento/cache do navegador para resolver problemas. Preserve backups privados e não os envie ao GitHub.

Os acessos novos são locais e separados do backup financeiro. Não se transfere automaticamente permissões/credenciais ao importar esse backup. Migração dos dados recuperados e dos estudantes ainda depende de revisão e autorização; nenhum procedimento deste guia a executa.

O ambiente de desenvolvimento validou Chromium e PowerShell em Linux. A abertura direta por arquivo foi bloqueada pela política do navegador de testes; por isso o caminho recomendado é a prévia HTTP acima. A entrega não afirma homologação em Windows físico, impressora, totens ou rede multicelular.
