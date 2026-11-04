# Dois cenários para os totens — situação real

| Item | Plano B sem internet | Online compartilhado |
| --- | --- | --- |
| Fonte de verdade | IndexedDB do único notebook | Projeto Supabase existente, após auditoria/homologação |
| Totem touch | Mesmo notebook, navegador/perfil corretos | Cliente autenticado no backend comum |
| Senhas em outro equipamento | Apenas se for monitor/HDMI do mesmo notebook | Segundo computador depende de backend comum validado |
| Atualização | BroadcastChannel entre abas do mesmo perfil, testado | Adaptador existente usa consultas periódicas; não foi homologado como tempo real |
| Oito vendedores | Pré-pedidos em papel; registro central | Logins individuais/restrições de vendedor e concorrência ainda precisam de backend e teste físico |
| Administração/financeiro | Administração local e conta financeira individual; proteção contra uso casual | Auth/RLS/RPCs e papéis precisam ser revisados no projeto existente |
| Caixa/cozinha | Operação central e fila no notebook | Domínio prevê `cashier` e `kitchen`, mas contas reais/permissões online não foram provisionadas |
| Pix | Conferência manual de crédito real fora do site | Automação Mercado Pago requer TEST oficial/API/webhook, ainda não homologados |
| Dinheiro | Controle manual autorizado pela escola, separado do Pix | Registro eletrônico distinto não está implementado; nunca lançar dinheiro como Pix |
| Dados antigos | Preservar mesma origem/perfil, validar cópia privada antes de atualização | Nenhuma importação/unificação automática com IndexedDB ou PIN4/P0 |
| Queda da Starlink | Continua o registro local, com conferência financeira externa quando possível | Pausar novas vendas online e assumir um único plano; conciliar antes da volta |

## Aproveitar o projeto Supabase “Forno das Artes”

É viável em princípio reaproveitar o projeto, sem criar outro serviço pago, mas a estrutura atual não foi inspecionada: não há URL/configuração/autenticação prontas nem conexão disponível ao banco real. Não foi procurada credencial em arquivos privados nem aplicada proposta SQL.

O frontend contém `OnlineStore` para Auth/RPCs `fda_v2_state` e `fda_v2_command`. Isso não prova que essas funções ou RLS estejam instaladas/homologadas no projeto existente. A versão recebida permite login online de admin/caixa/cozinha; financeiro individual e vendedor restrito online ainda precisam ser implementados na persistência/autorizações adequadas. Não atribuir caixa/administrador ao vendedor para contornar essa falta.

Próximos passos técnicos, sujeitos à autorização: inventário somente leitura de tabelas/funções/políticas e perfis; conferir compatibilidade com histórico e base privada; homologar em isolamento transações/idempotência/estoque/fila; implementar papéis mínimos e sessões individuais; testar dois equipamentos e depois oito vendedores reais com a Starlink instalada; medir atraso, reconexão e cotas do Free. Só então avaliar implantação e dados, com backup e aprovação. Não executar os SQL antigos diretamente no operacional.

**Conclusão:** o candidato atual é utilizável para conferência visual e ensaio local central. Não é a solução online/multiaparelhos completa nem está autorizado para migração operacional.
