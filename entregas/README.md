# Download do pacote de conferência para Windows

O ZIP desta pasta é exatamente o pacote testado, com iniciadores, prévia fictícia, instruções e evidências. Não contém banco operacional, planilha, PINs ou backup financeiro real.

**Para baixar pelo GitHub:** abra `Forno_das_Artes_WINDOWS_CONFERENCIA_2026-11-04_v2.zip` e clique em **Download raw file** (ícone de baixar).

Depois, extraia todo o ZIP e abra `ABRIR_PREVIA_WINDOWS.cmd` para conferir o visual sem acessar o banco operacional. Não iniciar a atualização operacional antes de backup privado, validação da base preparada e aprovação.

SHA-256: `272b351eab90b470be9950ada1ad423418adfc86475deaeded88c4844d0e4114`.

Este envio disponibiliza um artefato na branch de revisão. Não é merge, publicação do site principal ou migração de dados.

## Painel dos Avaliadores — cópia de testes

Baixe `Forno_das_Artes_AVALIADORES_WINDOWS_TESTES_2026-11-04.zip` e execute `TESTAR_AVALIADORES_WINDOWS.cmd` em outra pasta. Origem isolada 8872; prévia fictícia, PDF de exemplo, guias e evidências incluídos. 37 testes/verificações novos e 108 de regressão aprovados. Novos perfis online, sincronização entre aparelhos e Pix automático continuam pendentes.

SHA-256: `fcf6f6a4540efcfb3781d51f7710424383ba3a96593732d3542dc362fc96d80b`. Código-fonte: `f9880213eb5b65a6150182c6820cd2374c816f61`. Os pacotes anteriores continuam intactos.

## Central Pix de Conferência — testes isolados

Baixe `Forno_das_Artes_CENTRAL_PIX_CONFERENCIA_TESTES_2026-11-04.zip`. Novo iniciador: `TESTAR_CENTRAL_PIX_COMPARTILHADA_WINDOWS.cmd`, com Node.js 24+ gratuito. SQLite compartilhado de demonstração, somente loopback 8874. Oito contextos independentes foram testados; oito celulares físicos e a rede ainda NÃO estão homologados. Conferência manual, sem integração bancária. Leia LEIA_PRIMEIRO_CENTRAL_PIX.txt.

48 testes/verificações novos e 145 de regressão aprovados; nenhum dado real ou SQLite incluído. SHA-256: `a1e5daa3bffdb1972f2b416f0c8754c7af9a44580de677b1623628b9e7384075`. Código: `63363e31207a976a464377f97514f53b07c26c25`. Pacotes anteriores intactos.
