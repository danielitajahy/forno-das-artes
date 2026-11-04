# Conferir a prévia fictícia

**Prévia web proposta (não é o site operacional):**

https://raw.githack.com/danielitajahy/forno-das-artes/6ec4a9ec10baf1c54d287bdd1e2c478ad5cc2f3e/PREVIA_VISUAL.html

É uma página estática pública da branch de revisão, servida por CDN gratuito, sem banco ou dados reais. O HTML foi testado funcionalmente por HTTP local. **A abertura pelo CDN não pôde ser verificada daqui:** o proxy do ambiente rejeitou acesso a `raw.githack.com` com 403. Não se afirma que o link externo foi homologado. Se não abrir no seu navegador, use o método local abaixo; não informe credenciais ou dados reais na prévia.

## Método local testado

Extraia todo o ZIP e abra `ABRIR_PREVIA_WINDOWS.cmd`. Ele abre `http://127.0.0.1:8870/PREVIA_VISUAL.html`. O método HTTP/local foi testado; o duplo clique CMD/Windows físico ainda precisa ser conferido no equipamento. A página da prévia não usa IndexedDB e funciona só com dados fictícios na memória. O modo de servidor de prévia não serve `index.html` ou os módulos operacionais.

O arquivo `PREVIA_VISUAL.html` acompanha o pacote e também pode ser aberto pelo servidor local. A tentativa de abrir por `file://` no navegador gerenciado foi bloqueada por política; não é o método homologado aqui.

O site principal GitHub Pages permanece inalterado. Não há merge, implantação ou migração operacional.
