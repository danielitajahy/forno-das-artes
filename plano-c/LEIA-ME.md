# Plano C — kit manual

## Edição definitiva desta revisão

`KIT_PLANO_C_DEFINITIVO_300_COMANDAS.pdf` reúne 166 páginas A4 e 300 comandas únicas em duas vias, com controles e continuação de 20 itens. A fonte editável é o HTML de mesmo nome. O PDF foi validado por `validar_definitivo.py`; páginas de comanda/continuação foram renderizadas e inspecionadas. Ainda é necessário fazer uma prova física.

Imprima seletivamente: instruções/livro nas páginas 1–4; comandas 1–24 nas páginas 5–16; comandas 25–300 nas páginas 17–154; controles nas páginas 155–165; continuação de itens na página 166. **As comandas 1–24 são as mesmas já entregues, não um novo lote**. Se já foram distribuídas/usadas, imprima somente o intervalo novo ainda livre. Folhas de controle/continuação em branco podem ter cópias; comandas não podem repetir identificadores.

O lote complementar 02, com arquivos próprios PDF/HTML, também foi preservado e tem apenas números 25–300. Não distribua simultaneamente cópias desse lote e do kit definitivo com os mesmos números. A capacidade de 300 não estima o movimento; para mais, gerar a partir de 301 ou do próximo número realmente livre. O gerador anterior e o lote original abaixo permanecem intactos.

**PDF pronto:** `KIT_PLANO_C_LOTE_01.pdf` — 26 páginas, incluindo 24 comandas numeradas, duas por página, com canhoto para cliente.

**Fonte editável:** `KIT_PLANO_C_LOTE_01.html` pode ser aberto sem internet. O conteúdo admite edição na própria página (`contenteditable`) e impressão. Para guardar uma edição permanentemente, use um editor de texto/HTML e salve uma cópia; mudanças digitadas apenas na aba não são persistidas automaticamente. O PDF entregue foi gerado pelo script Python; a paginação da impressão do HTML depende do navegador e deve ser conferida.

Inclui todos os controles pedidos: recebimentos Pix; fatias; inteiras/congeladas; perdas/ajustes; lista de espera; cozinha; painel público; despesas; aportes/devoluções individuais; fechamento; registro do corte e conciliação entre planos. Campos de estoque, contatos e alunos estão em branco. Os preços de referência são os informados pela responsável, não transações inventadas.

Imprimir em A4, escala 100%, somente frente. Folhas privadas ficam com a equipe; o painel manual é a única folha destinada à exposição pública. Separe a comanda da equipe do canhoto do cliente. Não coloque o canhoto com informações bancárias ou referência de extrato.

## Mais comandas

O gerador usa Python 3 + ReportLab e fontes DejaVu Sans, já disponíveis no ambiente de desenvolvimento. Não usa rede, dados reais ou Supabase:

```sh
cd desenvolvimento/plano-c
python3 gerar_kit.py --inicio 25 --quantidade 24 --lote 02
```

Antes de gerar outro lote, confira o livro de lotes e ajuste `--inicio` para o primeiro número nunca distribuído. O script bloqueia sobrescrita do mesmo nome de lote, mas não consegue saber quais folhas foram usadas: o controle de numeração é da coordenação. Não reimprima lotes já distribuídos como novas comandas. Preserve canceladas/anuladas.

## Validação executada

`python3 validar_kit.py` verifica o PDF entregue: 26 páginas A4, presença dos 11 tipos de material, 24 identificadores distintos, duas vias de cada comanda e limites de texto dentro da página. Três páginas representativas também foram renderizadas e inspecionadas visualmente. Isso valida a geração/leitura e o layout do artefato; ainda é necessário ensaio físico com a equipe e uma impressão de prova na impressora da feira.

Procedimento completo: `../docs/OPERACAO-TRANSICAO.md`. Somente um plano registra novas vendas por vez. Não fazer importação cega e não cobrar novamente pedidos migrados. Confirmar Pix apenas pelo crédito real na conta, mesmo no offline/papel.
