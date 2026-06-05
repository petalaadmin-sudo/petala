# Item 7F - Registro Tecnico de Aceite Versionado - Petala/Bloom

Status: documento interno v1.  
Uso: referencia interna para produto, juridico, compliance, engenharia, suporte, financeiro e operacao.  
Publicacao: nao publicado no site.  
Revisao futura: este documento nao substitui revisao juridica, regulatoria, de privacidade ou de compliance.

## 1. Objetivo

Este documento define diretrizes internas para registro tecnico de aceites versionados no Petala/Bloom.

O objetivo e permitir prova tecnica de:

- quem aceitou;
- qual documento foi aceito;
- qual versao foi aceita;
- qual texto ou hash foi aceito;
- quando o aceite ocorreu;
- de onde o aceite ocorreu;
- quais checkboxes foram marcados;
- qual fluxo gerou o aceite;
- se houve reaceite;
- qual contexto operacional, financeiro, de conteudo ou compliance estava relacionado.

O registro de aceite deve ser auditavel, versionado, seguro, reproduzivel e suficiente para suporte, compliance, revisao juridica e defesa tecnica da plataforma.

## 2. Principio central

O Petala/Bloom nao deve depender de uma coluna simples como `terms_accepted = true`.

Um booleano isolado nao prova:

- qual texto foi exibido;
- qual versao foi aceita;
- quais checkboxes foram marcados;
- quando o aceite ocorreu;
- qual IP ou dispositivo foi usado;
- qual fluxo gerou o aceite;
- se houve alteracao posterior do texto;
- se o usuario aceitou novamente apos mudanca material.

Aceites devem ser tratados como eventos juridicos e tecnicos versionados.

## 3. Escopo do registro de aceite

O registro tecnico deve cobrir aceites gerais, destacados, financeiros, operacionais, de conteudo, KYC/KYB, payout, chamadas, compras e reaceites.

O sistema deve permitir consultar historicamente:

- documentos vigentes;
- versoes anteriores;
- hashes dos textos aceitos;
- aceites por usuario, criadora, agencia, admin ou suporte;
- eventos de reaceite;
- bloqueios por falta de aceite;
- contexto de aceite sensivel.

## 4. Tipos de aceite

Tipos de aceite que podem exigir registro tecnico:

- Termos de Uso;
- Politica de Privacidade;
- Politica de Conteudo 18+;
- Termos do Usuario;
- Termos da Criadora;
- Termos da Agencia;
- aceite financeiro;
- compra de petalas;
- chamada paga;
- upload ou conteudo;
- payout;
- KYC;
- KYB;
- reaceite;
- admin;
- suporte;
- moderacao;
- compliance.

Cada tipo pode ter requisitos proprios de checkbox, metadata, bloqueio, reaceite e auditoria.

## 5. Documentos versionados

Documentos juridicos e politicas devem ser tratados como documentos versionados.

Cada documento deve ter, no minimo:

- `document_key`;
- titulo;
- versao;
- data de vigencia;
- status;
- idioma;
- hash;
- texto completo ou referencia imutavel.

O `document_key` deve ser estavel e identificar a familia do documento.

Exemplos:

- `terms_user`;
- `terms_creator`;
- `terms_agency`;
- `privacy_policy`;
- `content_policy_18`;
- `petals_refund_chargeback_policy`;
- `payout_policy`;
- `paid_call_acceptance`.

## 6. Versao do documento

Cada alteracao material deve gerar nova versao.

A versao deve permitir diferenciar textos aceitos em datas diferentes.

Exemplos de versao:

- `v1`;
- `v1.1`;
- `2026-06-terms-user-v1`;
- `terms_creator_v1_2026_06`.

A convencao final deve ser definida antes da implementacao, mas precisa ser estavel, auditavel e legivel.

## 7. Status do documento

Status recomendados para documentos:

- draft;
- active;
- archived;
- superseded;
- revoked.

Somente documentos `active` devem ser exibidos para novo aceite, salvo fluxo especifico de auditoria ou migracao.

Documentos antigos devem permanecer preservados para prova historica.

## 8. Hash do texto aceito

Todo aceite relevante deve registrar o hash do texto exato exibido.

O hash deve usar SHA-256 ou equivalente forte.

O hash deve ser calculado sobre:

- o texto completo exibido;
- a versao especifica;
- idioma/localidade;
- anexos ou referencias relevantes quando aplicavel;
- checkboxes destacados quando fizer sentido como parte do pacote de aceite.

O objetivo e permitir reproduzir tecnicamente que o texto aceito nao foi alterado silenciosamente.

## 9. Historico preservado

O historico deve ser preservado.

Nao se deve sobrescrever silenciosamente:

- texto aceito;
- versao aceita;
- hash aceito;
- data de aceite;
- checkboxes;
- metadata essencial;
- IP quando permitido;
- user agent quando disponivel.

Se houver erro operacional, a correcao deve ocorrer por novo evento ou registro administrativo auditavel.

## 10. Mudanca material

Mudanca material exige nova versao e, quando aplicavel, reaceite.

Exemplos de mudanca material:

- alteracao em reembolso;
- alteracao em chargeback;
- alteracao em bloqueio financeiro;
- alteracao em petalas;
- alteracao em remuneracao;
- alteracao em payout;
- alteracao em consentimento;
- alteracao em politica 18+;
- alteracao em dados pessoais;
- alteracao em arbitragem;
- alteracao em limitacao de responsabilidade;
- alteracao em proibicoes;
- alteracao em regras de agencias;
- alteracao em chamadas pagas.

Mudancas editoriais pequenas podem nao exigir reaceite, conforme revisao juridica futura.

## 11. Registro minimo de aceite

Cada aceite deve registrar, no minimo:

- `acceptance_id`;
- `user_id`;
- `account_type`;
- `document_key`;
- `document_version`;
- `document_hash`;
- `accepted_at`;
- `ip_address` quando permitido;
- `user_agent` quando disponivel;
- `locale`;
- `source`;
- `flow`;
- `checkboxes`;
- `metadata`;
- `created_at`.

Quando aplicavel, tambem pode registrar:

- `creator_id`;
- `agency_id`;
- `admin_id`;
- `support_agent_id`;
- `session_id`;
- `transaction_id`;
- `checkout_session_id`;
- `payout_id`;
- `content_id`;
- `call_id`;
- `gift_id`;
- `route`;
- `app_version`.

## 12. Account type

O campo `account_type` deve indicar o tipo operacional do aceite.

Valores recomendados:

- user;
- creator;
- agency;
- admin;
- support;
- system.

O `account_type` nao substitui verificacao real de permissao, role, KYC, KYB ou relacao com creator/agencia.

Ele serve para auditoria e interpretacao do aceite.

## 13. Source

O campo `source` deve indicar onde o aceite foi apresentado ou coletado.

Exemplos:

- signup;
- login;
- onboarding;
- age_confirmation;
- checkout;
- paid_call;
- gift;
- photo_upload;
- payout_setup;
- agency_invite;
- terms_reacceptance;
- admin_action.

O `source` ajuda a reconstruir o contexto de exibicao.

## 14. Flow

O campo `flow` deve indicar qual fluxo de produto gerou o aceite.

Exemplos:

- criacao de conta;
- confirmacao de idade;
- compra de petalas;
- chamada paga;
- envio de presente;
- upload de conteudo;
- configuracao de payout;
- convite de agencia;
- revisao de termos;
- acao administrativa.

O `flow` pode ser mais descritivo que `source`, desde que mantenha vocabulario controlado.

## 15. Checkboxes

Checkboxes destacados devem ser registrados com detalhe suficiente para auditoria.

Cada checkbox pode conter:

- `checkbox_key`;
- texto exibido;
- versao;
- obrigatorio ou opcional;
- marcado ou nao marcado;
- documento relacionado;
- contexto;
- ordem exibida;
- timestamp quando aplicavel.

Checkboxes devem ser curtos, neutros e discretos.

O checkbox nao deve ensinar fraude, abuso, exploracao, burla de pagamento, chargeback oportunista ou comportamento proibido.

Detalhes completos devem ficar no corpo dos Termos e politicas aplicaveis.

## 16. Checkbox key

O `checkbox_key` deve ser estavel.

Exemplos:

- `age_18_confirmation`;
- `content_rules_acceptance`;
- `petals_financial_rules`;
- `closed_credit_acknowledgement`;
- `dispute_resolution_acceptance`;
- `creator_voluntary_participation`;
- `creator_payout_rules`;
- `agency_autonomy_rules`;
- `paid_call_consent`;
- `photo_upload_rules`.

Mudanca material no texto ou no sentido do checkbox deve gerar nova versao.

## 17. Metadata

Metadata deve registrar contexto relevante, sem excesso.

Exemplos:

- pacote;
- valor;
- moeda;
- metodo;
- gateway;
- sessao;
- chamada;
- presente;
- conteudo;
- `creator_id`;
- `agency_id`;
- `payout_id`;
- `transaction_id`;
- `checkout_session_id`;
- `app_version`;
- rota;
- referrer;
- motivo de reaceite;
- campanha.

Metadata ajuda a explicar por que o aceite foi exigido e qual evento estava relacionado.

## 18. Dados proibidos em metadata

Metadata nao deve guardar:

- segredo;
- token;
- senha;
- chave privada;
- chave de API;
- documento completo;
- imagem de documento;
- dado sensivel desnecessario;
- credencial;
- codigo de autenticacao;
- dado de cartao;
- informacao que deveria estar criptografada ou isolada.

O registro deve seguir minimo necessario, privacidade, seguranca e finalidade.

## 19. Aceite financeiro

Aceites financeiros devem ser exigidos em fluxos sensiveis.

Exemplos:

- compra de petalas;
- uso de petalas;
- reembolso;
- chargeback;
- contestacao;
- bloqueio financeiro;
- payout;
- comissao;
- presente virtual;
- chamada paga;
- conteudo pago.

O aceite financeiro deve deixar claro, em linguagem curta e neutra, que o usuario leu e aceita as regras de compra, uso de petalas, reembolso, contestacao de pagamento, revisao financeira e bloqueio de conta.

O registro deve incluir document_key, versao, hash, checkboxes e metadata da transacao quando aplicavel.

## 20. Aceite de compra de petalas

Compra de petalas pode exigir aceite ou confirmacao destacada quando aplicavel.

O registro pode incluir:

- pacote;
- valor;
- moeda;
- metodo;
- gateway;
- `transaction_id`;
- `checkout_session_id`;
- petalas pagas;
- bonus;
- document_hash;
- checkboxes financeiros;
- data/hora.

O frontend nao deve simular aceite financeiro sem registro server-side quando o fluxo exigir prova tecnica.

## 21. Aceite de chamada paga

Chamada paga deve ter aceite claro antes de qualquer cobranca.

O registro pode incluir:

- usuario;
- criadora;
- tipo de chamada;
- regra de preco exibida;
- consentimento;
- timestamp;
- status;
- `call_id`;
- metadata da sessao;
- versao do texto;
- hash;
- checkboxes aplicaveis.

Sem aceite de chamada, nao deve iniciar cobranca.

## 22. Aceite da criadora

Aceite da criadora deve cobrir:

- maioridade;
- KYC;
- participacao voluntaria;
- regras de conteudo;
- consentimento;
- limites;
- denuncia;
- bloqueio;
- banimento;
- remuneracao;
- elegibilidade;
- payout;
- chargeback;
- revisao financeira;
- bloqueio de ganhos;
- autonomia sobre documentos, senha, Pix e acesso.

Sem aceite da criadora, a criadora nao deve ficar online, receber ganhos ou acessar funcionalidades sensiveis, conforme regra futura de produto e compliance.

## 23. Aceite da agencia

Aceite da agencia deve cobrir:

- atuacao;
- indicacao;
- suporte;
- responsabilidade;
- autonomia da criadora;
- proibicao de coacao;
- proibicao de exploracao;
- proibicao de retencao de documentos;
- controle abusivo;
- comissao;
- elegibilidade;
- chargeback;
- revisao financeira;
- bloqueio;
- auditoria;
- denuncia;
- banimento;
- encerramento de vinculo.

Sem aceite da agencia, a agencia nao deve receber comissao ou acessar funcionalidades sensiveis, conforme regra futura de produto e compliance.

## 24. Reaceite obrigatorio

Reaceite deve ser exigido quando houver mudanca material.

Exemplos:

- nova versao dos Termos de Uso;
- nova Politica de Privacidade;
- nova Politica de Conteudo 18+;
- alteracao em petalas;
- alteracao em reembolso;
- alteracao em chargeback;
- alteracao em payout;
- alteracao em remuneracao;
- alteracao em agencias;
- alteracao em chamadas pagas;
- alteracao em regras de bloqueio;
- alteracao exigida por gateway, compliance, lei ou parceiro.

O sistema deve registrar o motivo do reaceite.

## 25. Bloqueio por falta de aceite

Quando um aceite for obrigatorio, a falta dele deve bloquear o fluxo correspondente.

Regras recomendadas:

- sem aceite 18+: nao usar app;
- sem aceite financeiro: nao comprar petalas;
- sem aceite de chamada: nao iniciar cobranca;
- sem aceite de criadora: nao ficar online ou receber ganhos;
- sem aceite de payout: nao solicitar saque;
- sem aceite de agencia: nao receber comissao.

Bloqueios por falta de aceite devem ser claros para o usuario, sem expor detalhes tecnicos.

## 26. Auditoria

O sistema deve permitir auditoria de aceites.

Auditorias podem responder:

- qual versao estava vigente em determinada data;
- qual texto foi aceito;
- qual hash foi aceito;
- quais checkboxes foram marcados;
- qual fluxo gerou o aceite;
- se houve reaceite;
- se o usuario estava bloqueado por falta de aceite;
- qual admin ou sistema registrou correcao;
- quais eventos ocorreram antes ou depois do aceite.

Auditoria deve ser acessivel apenas a pessoas e sistemas autorizados.

## 27. Imutabilidade

Aceites nao devem ser editados silenciosamente.

Registros de aceite devem ser tratados como eventos historicos.

Se houver erro, a correcao deve ocorrer por:

- novo evento de aceite;
- evento de anulacao;
- registro administrativo auditavel;
- metadata de correcao;
- justificativa;
- ator responsavel;
- timestamp.

Nunca substituir um aceite antigo por novo valor sem trilha.

## 28. Correcoes administrativas

Correcoes administrativas devem ser raras e auditaveis.

Cada correcao deve registrar:

- quem corrigiu;
- quando corrigiu;
- o que foi corrigido;
- motivo;
- evidencia;
- documento relacionado;
- aceite relacionado;
- impacto operacional;
- metadata;
- aprovacao quando aplicavel.

Correcoes nao devem ser usadas para fabricar aceite inexistente.

## 29. Seguranca e privacidade

Registros de aceite devem seguir principios de seguranca e privacidade.

Diretrizes:

- restringir acesso;
- nao expor no frontend;
- nao registrar segredo;
- service role somente no backend;
- minimo necessario;
- logs seguros;
- controle de permissao;
- RLS quando aplicavel;
- auditoria de acesso;
- retencao conforme politica futura;
- criptografia quando aplicavel.

Dados sensiveis devem ser minimizados e protegidos.

## 30. Relacao com suporte

O suporte pode precisar consultar registros de aceite para responder disputas, reembolsos, bloqueios, denuncias e chargebacks.

A interface de suporte deve mostrar apenas o necessario.

Exemplos seguros:

- documento aceito;
- versao;
- data/hora;
- origem do aceite;
- checkboxes aceitos;
- status de reaceite.

O suporte nao deve acessar segredo, token, senha, chave privada ou dado sensivel desnecessario.

## 31. Relacao com admin

Admins podem precisar consultar historico de aceite para auditoria, compliance, disputa e investigacao.

Acoes admin devem ser registradas.

Admin nao deve poder:

- editar aceite silenciosamente;
- alterar hash;
- apagar registro sem trilha;
- forjar aceite;
- marcar aceite em nome de usuario sem evento auditavel e justificativa formal.

Qualquer acao administrativa deve ter motivo e trilha.

## 32. Modelo tecnico sugerido

Modelo tecnico futuro sugerido:

- `legal_documents`;
- `legal_document_versions`;
- `user_acceptances`;
- `acceptance_checkboxes`;
- `acceptance_events`;
- `terms_reacceptance_requirements`.

Esse modelo e apenas diretriz interna e nao implementa schema neste bloco.

## 33. legal_documents

Tabela conceitual para familias de documentos.

Campos possiveis:

- `id`;
- `document_key`;
- `title`;
- `category`;
- `status`;
- `created_at`;
- `updated_at`.

Exemplos de category:

- terms;
- privacy;
- content;
- financial;
- payout;
- agency;
- admin.

## 34. legal_document_versions

Tabela conceitual para versoes imutaveis dos documentos.

Campos possiveis:

- `id`;
- `document_id`;
- `document_key`;
- `version`;
- `title`;
- `locale`;
- `effective_at`;
- `status`;
- `body`;
- `body_hash`;
- `created_at`;
- `created_by`;
- `metadata`.

O campo `body_hash` deve permitir comprovar o texto exibido.

## 35. user_acceptances

Tabela conceitual para aceites principais.

Campos possiveis:

- `acceptance_id`;
- `user_id`;
- `account_type`;
- `document_key`;
- `document_version`;
- `document_hash`;
- `accepted_at`;
- `ip_address`;
- `user_agent`;
- `locale`;
- `source`;
- `flow`;
- `metadata`;
- `created_at`.

Quando aplicavel, pode incluir referencias a creator, agency, transaction, checkout, call, payout ou content.

## 36. acceptance_checkboxes

Tabela conceitual para checkboxes marcados em um aceite.

Campos possiveis:

- `id`;
- `acceptance_id`;
- `checkbox_key`;
- `checkbox_text`;
- `checkbox_version`;
- `required`;
- `checked`;
- `document_key`;
- `context`;
- `created_at`.

Checkboxes devem manter o texto exibido ou referencia imutavel ao texto exibido.

## 37. acceptance_events

Tabela conceitual para eventos relacionados a aceite.

Exemplos:

- created;
- reaccepted;
- revoked;
- corrected;
- blocked_by_missing_acceptance;
- admin_reviewed;
- exported_for_audit.

Campos possiveis:

- `id`;
- `acceptance_id`;
- `event_type`;
- `actor_type`;
- `actor_id`;
- `reason`;
- `metadata`;
- `created_at`.

## 38. terms_reacceptance_requirements

Tabela conceitual para exigir reaceite.

Campos possiveis:

- `id`;
- `document_key`;
- `required_version`;
- `account_type`;
- `required_from`;
- `reason`;
- `blocking`;
- `status`;
- `created_at`;
- `created_by`.

Essa estrutura permite bloquear fluxos ate que nova versao seja aceita.

## 39. Padrao de implementacao futura

Implementacao futura deve considerar:

- migrations versionadas;
- RLS;
- inserts server-side;
- service role somente em APIs server-side;
- idempotencia em aceite financeiro;
- hash reproduzivel;
- testes de reaceite;
- testes de bloqueio;
- logs seguros;
- validacao de locale;
- preservacao historica;
- acesso restrito para suporte/admin;
- documentacao operacional.

## 40. Idempotencia

Fluxos sensiveis podem exigir idempotencia.

Exemplos:

- aceite financeiro em checkout;
- aceite de chamada paga;
- aceite de payout;
- aceite em reaceite obrigatorio;
- aceite de agencia em convite;
- aceite de criadora em onboarding.

Idempotencia evita duplicidade de registros e ajuda a reconstruir eventos em retries.

## 41. Hash reproduzivel

O hash deve ser reproduzivel.

Para isso, a plataforma deve definir:

- fonte do texto;
- normalizacao;
- idioma;
- ordem de secoes;
- inclusao ou nao de checkboxes;
- formato de armazenamento;
- algoritmo;
- versao do algoritmo quando necessario.

Sem hash reproduzivel, a prova tecnica perde valor.

## 42. Testes futuros

Testes futuros devem validar:

- aceite cria registro correto;
- falta de aceite bloqueia fluxo;
- reaceite e exigido apos nova versao;
- hash corresponde ao texto exibido;
- checkbox obrigatorio precisa estar marcado;
- checkbox opcional e registrado corretamente;
- usuario comum nao acessa aceite de criadora;
- criadora sem aceite nao ativa funcionalidades sensiveis;
- agencia sem aceite nao recebe comissao;
- aceite financeiro nao duplica em retry;
- logs nao vazam segredo.

## 43. Logs seguros

Logs de aceite devem ajudar auditoria sem expor segredo.

Logs podem conter:

- acceptance_id;
- user_id;
- document_key;
- version;
- flow;
- source;
- status;
- erro seguro.

Logs nao devem conter:

- senha;
- token;
- segredo;
- chave privada;
- dado de cartao;
- documento completo;
- hash de segredo;
- dados sensiveis desnecessarios.

## 44. Nao escopo deste documento

Este documento nao implementa:

- migration;
- endpoint;
- UI;
- pagina publica;
- publicacao de termos;
- alteracao de banco;
- regra financeira;
- middleware;
- fluxo de pagamento;
- KYC/KYB;
- payout;
- chamada paga;
- upload de conteudo.

Este documento e apenas base interna aprovada para desenho tecnico e juridico futuro.

## 45. Status interno

Este documento e interno e esta em versao v1.

Ele deve orientar:

- arquitetura futura de aceites;
- especificacao juridica;
- especificacao de compliance;
- modelagem de banco;
- APIs server-side;
- UX de checkboxes;
- suporte;
- admin;
- auditoria;
- testes.

Antes de implementacao publica, deve passar por revisao juridica, regulatoria, privacidade, seguranca, compliance, produto e engenharia.
