# Database Baseline Runbook

## Contexto

O diretorio atual `supabase/migrations` e incremental sobre um schema/baseline pre-existente. Ele nao representa, hoje, um bootstrap completo de banco vazio.

Isso significa que um replay limpo, `db reset`, ou aplicacao linear das migrations atuais desde um banco totalmente vazio nao e suportado de forma confiavel neste momento. Algumas migrations antigas assumem objetos que ja existiam em producao, como tabelas base, funcoes, enums e objetos financeiros.

Producao continua usando o historico atual de migrations ja aplicado. Este runbook define o processo para criar um baseline consolidado formal pos-034 para staging e ambientes novos.

## Alerta Critico

**NUNCA aplique o baseline consolidado em uma producao existente.**

O baseline pos-034 deve ser usado somente para bancos novos, staging limpo, ambientes de teste, ou qualquer ambiente criado do zero depois do corte operacional.

Aplicar o baseline sobre producao existente pode tentar recriar objetos, alterar permissoes, sobrescrever definicoes ou causar divergencia operacional.

## Corte Operacional

Arquivo futuro do baseline:

```text
supabase/baselines/2026-05-29_post_034_schema.sql
```

Este baseline deve representar o schema de producao depois da migration:

```text
034_version_agencies_core_schema.sql
```

A partir desse corte:

1. Producao segue com o historico atual.
2. Ambientes novos usam o baseline pos-034.
3. Migrations futuras devem continuar a partir de `035+`.
4. Ambientes novos devem aplicar o baseline e depois somente migrations posteriores ao corte.

## O Que O Baseline Deve Conter

O baseline deve ser schema-only e conter:

- Extensions necessarias, por exemplo `uuid-ossp`, `pgcrypto` e `pg_cron` quando aplicavel.
- Schemas necessarios ao funcionamento do app.
- Enums e tipos customizados, incluindo tipos usados por sessoes, transacoes e RPCs.
- Tabelas.
- Colunas, defaults e nullability.
- Primary keys, foreign keys, unique constraints e check constraints.
- Indices.
- Triggers.
- Funcoes e RPCs.
- Views.
- Row Level Security.
- Policies.
- Grants e revokes.
- Comments.
- Cron jobs, quando aplicavel, especialmente jobs operacionais como expiracao de sessoes stale.

## O Que O Baseline Nao Pode Conter

O baseline nao pode conter dados reais.

Remover ou impedir qualquer conteudo como:

- Linhas reais de `users`.
- Emails.
- `pix_key`.
- Payouts reais.
- Mensagens reais.
- Chats reais.
- Gifts reais.
- Sessoes reais.
- Qualquer PII.
- Linhas de `auth.users`.
- Objetos do Storage.
- Segredos.
- Variaveis de ambiente.
- Tokens.
- Chaves Supabase, Agora, Stripe, Pix, R2 ou similares.
- Qualquer `INSERT`, `COPY` ou carga de dados reais.

## Processo Para Gerar O Dump Schema-Only

1. Confirmar que producao esta no corte aprovado, com migrations ate `034` aplicadas.
2. Gerar dump schema-only a partir de producao.
3. Preferir uma das abordagens abaixo, conforme acesso operacional disponivel:

```bash
pg_dump --schema-only --no-owner --file supabase/baselines/2026-05-29_post_034_schema.sql "$DATABASE_URL"
```

Ou equivalente via Supabase CLI, desde que seja schema-only e nao exporte dados.

4. Nao usar dump com dados.
5. Nao exportar Storage.
6. Nao exportar `auth.users`.
7. Manter grants/revokes para auditoria, mas revisar manualmente owners e permissoes.
8. Complementar manualmente o que o dump nao capturar de forma confiavel, especialmente `pg_cron` e jobs operacionais.

## Auditoria Manual Do SQL

Antes de versionar o baseline, revisar o arquivo completo.

Checklist minimo:

- Procurar por `INSERT`.
- Procurar por `COPY`.
- Procurar por emails.
- Procurar por `pix_key`.
- Procurar por nomes, telefones, whatsapp, telegram ou qualquer PII.
- Procurar por tokens e segredos.
- Procurar por `auth.users`.
- Procurar por payloads reais em `metadata`.
- Remover `OWNER TO` inadequado se aparecer.
- Validar que funcoes `SECURITY DEFINER` tenham `search_path` explicito quando aplicavel.
- Validar que funcoes financeiras sensiveis nao tenham `EXECUTE` para `public`, `anon` ou `authenticated`.
- Validar que RLS e policies estejam coerentes com producao.
- Validar que o baseline nao contenha dados de sequencias associados a dados reais, quando existirem.

## Processo Para Staging Novo

1. Criar projeto/banco vazio.
2. Configurar extensions necessarias no ambiente.
3. Aplicar o baseline:

```bash
psql "$STAGING_DATABASE_URL" -f supabase/baselines/2026-05-29_post_034_schema.sql
```

4. Marcar migrations ate `034` como aplicadas usando o mecanismo operacional definido para o projeto, por exemplo Supabase migration repair ou controle equivalente.
5. Aplicar somente migrations `035+`.
6. Rodar validacoes minimas.
7. Rodar smoke tests de produto em staging.

## Validacoes Minimas

Apos aplicar o baseline em staging limpo, validar:

- Tabelas base existem: `users`, `creators`, `transactions`, `petal_packages`, `chat_sessions`, `gifts`, `agencies`, `agency_users`.
- Tabelas operacionais existem: `chat_messages`, `chat_minute_charges`, `user_petal_lots`, `user_petal_ledger`, `creator_earnings`.
- Funcoes criticas existem: `credit_petals_with_lot`, `spend_petals_with_eligibility`, `charge_chat_text_due_minutes`, `charge_chat_video_due_minutes`, `record_creator_earning_from_session_minute`, `send_gift`, `claim_daily_bonus`.
- RLS esta habilitado nas tabelas esperadas.
- Policies conferem com producao.
- `anon` e `authenticated` nao executam funcoes financeiras sensiveis de payout.
- `service_role` executa RPCs administrativas necessarias.
- `pg_cron` e o job de sessoes stale existem e rodam, se o ambiente suportar `pg_cron`.
- Reconciliacao de saldo/lotes funciona para usuario de teste.
- Chat texto funciona em staging.
- Video pago funciona em staging.
- Gifts funcionam em staging.
- Daily bonus funciona em staging.
- Agora-token nega sessoes invalidas e libera apenas sessoes video ativas/pagas/autorizadas.

## Riscos E Mitigacoes

### Baseline aplicado por engano em producao

Mitigacao:

- Manter alerta no topo do runbook e do futuro arquivo SQL.
- Nao automatizar aplicacao do baseline contra producao.
- Usar nomes de arquivos e scripts explicitamente marcados como staging/bootstrap.

### Baseline com dados reais

Mitigacao:

- Usar apenas schema-only dump.
- Revisar manualmente o SQL.
- Procurar por `INSERT`, `COPY`, emails, pix, mensagens e metadata.

### Divergencia entre baseline e producao

Mitigacao:

- Gerar baseline somente apos confirmar corte pos-034.
- Comparar schema do baseline aplicado em staging contra producao.
- Apos congelar o corte, todas as alteracoes novas devem entrar como migrations `035+`.

### Grants inseguros

Mitigacao:

- Auditar grants/revokes no baseline.
- Confirmar que funcoes financeiras `SECURITY DEFINER` nao sao executaveis por `anon` ou `authenticated`.
- Preferir acesso operacional por server-side/service role ou RPCs auditadas.

### Objetos faltando

Mitigacao:

- Aplicar baseline em banco vazio antes de aprovar.
- Rodar smoke tests de dominio.
- Conferir tabelas, views, functions, triggers, policies e cron jobs.

### Extensions ausentes

Mitigacao:

- Listar extensions no baseline.
- Validar suporte do ambiente, especialmente `pg_cron`.
- Documentar alternativa operacional se alguma extension nao estiver disponivel.

## Sequencia Por Fases

### Fase 1: Runbook

Criar e revisar este documento.

### Fase 2: Schema-Only Dump

Gerar `supabase/baselines/2026-05-29_post_034_schema.sql` a partir de producao pos-034, sem dados.

### Fase 3: Auditoria Manual

Revisar o SQL completo, remover qualquer risco de dado real, validar grants/revokes e completar objetos operacionais que o dump nao capturar.

### Fase 4: Staging Limpo

Aplicar o baseline em banco vazio, marcar migrations ate `034` como aplicadas, aplicar `035+` e rodar validacoes.

### Fase 5: Congelar Corte

Declarar oficialmente o corte pos-034. A partir dele, ambientes novos usam baseline + migrations futuras, e producao continua com o historico atual.
