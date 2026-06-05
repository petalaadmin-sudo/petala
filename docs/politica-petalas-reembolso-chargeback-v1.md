# Item 7E - Politica de Petalas, Reembolso, Chargeback e Bloqueio Financeiro - Petala/Bloom

Status: documento interno v1.  
Uso: referencia interna para produto, financeiro, suporte, compliance e engenharia.  
Publicacao: nao publicado no site.  
Revisao futura: este documento nao substitui revisao juridica, contabil, tributaria, regulatoria ou de compliance.

## 1. Objetivo

Esta politica define diretrizes internas para compra, uso, consumo, reembolso, contestacao, bloqueio e auditoria de petalas no Petala/Bloom.

O objetivo e manter um fluxo financeiro seguro, auditavel, idempotente e coerente com a natureza das petalas como credito interno de uso fechado, evitando promessa enganosa, risco regulatorio, saldo divergente, fraude, chargeback abusivo e remuneracao indevida.

## 2. Natureza das petalas

Petalas sao creditos internos de uso fechado dentro do Petala/Bloom.

Petalas:

- nao sao moeda;
- nao sao investimento;
- nao sao deposito bancario;
- nao sao conta de pagamento;
- nao sao saldo sacavel pelo usuario;
- nao sao transferiveis entre usuarios;
- nao tem rendimento;
- nao garantem ato especifico;
- nao representam direito absoluto a reembolso automatico;
- nao representam obrigacao de qualquer criadora realizar conteudo, chamada, mensagem, interacao ou ato especifico.

Petalas permitem acessar funcionalidades, interacoes, conteudos, presentes virtuais ou recursos internos da plataforma, conforme disponibilidade, regras aplicaveis, consentimento das partes e termos vigentes.

## 3. Circuito fechado

As petalas operam em circuito fechado.

Isso significa que:

- o uso ocorre apenas dentro do Petala/Bloom;
- o usuario nao pode sacar petalas;
- o usuario nao pode transferir petalas para outro usuario;
- petalas nao formam carteira digital aberta;
- petalas nao podem ser vendidas, cedidas, emprestadas, alugadas ou negociadas fora da plataforma;
- qualquer uso de petalas depende das regras internas, termos, elegibilidade, disponibilidade da funcionalidade e verificacoes de seguranca.

A plataforma deve evitar qualquer comunicacao publica que sugira conta bancaria, saldo financeiro aberto, moeda, investimento, rendimento ou saque para usuario.

## 4. Origem das petalas

As petalas podem ter diferentes origens internas.

Exemplos:

- compra paga;
- bonus;
- credito gratuito;
- teste;
- ajuste administrativo;
- legado;
- compensacao;
- campanha;
- reembolso interno;
- correcao operacional.

Cada origem deve ser registrada de forma auditavel sempre que possivel, com lote, ledger, metadata, status e idempotencia.

## 5. Petalas pagas e nao pagas

A plataforma deve diferenciar petalas pagas e petalas nao pagas.

Petalas pagas sao aquelas originadas de compra confirmada por fluxo oficial, com pagamento aprovado, gateway valido, transaction, lote e ledger.

Petalas nao pagas incluem, entre outras:

- bonus;
- promocao;
- credito gratuito;
- teste;
- cortesia;
- campanha;
- ajuste sem pagamento;
- compensacao sem desembolso financeiro;
- legado sem origem financeira confirmada.

Petalas nao pagas:

- nao geram reembolso em dinheiro;
- nao geram saque;
- podem expirar;
- podem ser canceladas;
- podem ser revertidas;
- podem ser inelegiveis para payout;
- podem ter uso limitado por regra de produto, antifraude, compliance ou elegibilidade.

## 6. Elegibilidade para remuneracao

Nem toda petala consumida gera remuneracao para criadora, agencia ou parceiro.

A elegibilidade para remuneracao depende de criterios como:

- origem das petalas;
- tipo de lote;
- status do pagamento;
- risco de chargeback;
- antifraude;
- KYC da criadora;
- KYB da agencia;
- regras de payout;
- ledger;
- politica de conteudo;
- denuncia;
- revisao de compliance;
- gateway;
- status da sessao, interacao, presente, conteudo ou funcionalidade;
- bloqueios internos;
- reversoes;
- disputas;
- cancelamentos;
- regras contratuais aplicaveis.

Petalas de bonus, promocao, credito gratuito, teste, campanha, legado sem origem financeira confirmada, valor em disputa, chargeback, fraude, violacao de regra ou pagamento ainda nao confirmado podem ser inelegiveis para remuneracao.

## 7. Compra de petalas

A compra de petalas deve ocorrer apenas por fluxo oficial, backend seguro, idempotente e auditavel.

Toda compra deve registrar, quando aplicavel:

- usuario;
- pacote;
- petalas pagas;
- bonus;
- valor;
- moeda;
- metodo;
- gateway;
- idempotency key;
- transaction;
- lote;
- ledger;
- metadata;
- status;
- data e hora.

O frontend nao deve ser fonte de verdade para preco, quantidade de petalas, bonus, elegibilidade ou credito final.

Preco, quantidade, bonus e elegibilidade devem vir de fonte canonica server-side.

## 8. Status de compra

Compras podem passar por estados diferentes.

Status recomendados:

- pending;
- completed;
- failed;
- cancelled;
- refunded;
- disputed;
- chargeback;
- blocked;
- available;
- paid;
- reversed;
- expired.

Nenhuma interface deve afirmar que uma compra foi confirmada, que petalas foram adicionadas ou que saldo foi atualizado antes de confirmacao canonica pelo backend, gateway, webhook, transaction, lote e ledger.

## 9. Consumo de petalas

O consumo de petalas deve ser registrado em ledger.

Cada consumo deve conter, quando aplicavel:

- usuario;
- origem do consumo;
- tipo de interacao ou funcionalidade;
- quantidade consumida;
- lotes consumidos;
- elegibilidade;
- idempotency key;
- metadata;
- status;
- data e hora;
- referencia a sessao, mensagem, presente, conteudo ou evento relacionado.

Nenhum debito deve ocorrer por ajuste direto em saldo sem lote, ledger, motivo, idempotencia e trilha de auditoria.

## 10. Ordem de consumo

A plataforma deve adotar ordem de consumo previsivel e auditavel, preferencialmente FIFO quando aplicavel.

A ordem de consumo deve considerar:

- lotes mais antigos;
- expiracao;
- elegibilidade;
- origem paga ou nao paga;
- restricoes de bonus;
- bloqueios;
- chargeback;
- reversao;
- regras de payout;
- compliance.

Quando houver lotes inelegiveis ou bloqueados, o consumo deve respeitar a regra definida no backend financeiro canonico.

## 11. Direito de arrependimento e reembolso

A plataforma deve respeitar direitos legais aplicaveis.

Pedidos de reembolso podem considerar:

- prazo legal aplicavel;
- metodo de pagamento;
- gateway;
- status da compra;
- consumo total ou parcial;
- bonus;
- fraude;
- chargeback;
- disputa;
- termos aceitos;
- falha tecnica;
- duplicidade;
- erro operacional;
- denuncia;
- obrigacao legal;
- compliance.

Petalas compradas e nao consumidas podem ser analisadas para reembolso conforme prazo legal, metodo de pagamento, gateway, antifraude e termos vigentes.

Petalas ja consumidas em chamadas, mensagens, presentes, conteudos ou funcionalidades representam interacao, funcionalidade ou servico interno ja prestado e nao geram reembolso automatico.

Essa regra nao impede analise por falha tecnica, cobranca indevida, duplicidade, fraude comprovada, erro operacional, denuncia, obrigacao legal ou compliance.

## 12. Reembolso proporcional

Quando aplicavel, o reembolso pode ser proporcional.

A analise proporcional deve considerar:

- quantidade comprada;
- quantidade consumida;
- quantidade remanescente;
- petalas pagas;
- petalas de bonus;
- lotes afetados;
- status do pagamento;
- taxas ou regras do gateway quando aplicavel;
- chargeback;
- fraude;
- denuncia;
- bloqueio;
- reversao;
- obrigacao legal;
- termos vigentes.

Bonus, promocoes, testes, creditos gratuitos e cortesias nao viram dinheiro e nao devem compor reembolso em dinheiro.

## 13. Bonus, promocoes e creditos gratuitos

Bonus, promocoes e creditos gratuitos:

- nao viram dinheiro;
- nao geram saque;
- nao geram reembolso;
- podem expirar;
- podem ser cancelados;
- podem ser revertidos;
- podem ser inelegiveis para payout;
- podem ter uso restrito;
- podem ser bloqueados por fraude, abuso, chargeback, violacao de regra ou compliance.

A comunicacao publica deve deixar claro, de forma simples e discreta, que bonus e creditos gratuitos seguem regras proprias.

## 14. Chargeback e contestacao de pagamento

Chargeback e contestacao de pagamento devem ser tratados como eventos financeiros sensiveis.

Quando houver chargeback, disputa, contestacao ou risco relevante, a plataforma pode:

- marcar a compra como disputed ou chargeback;
- bloquear petalas relacionadas;
- bloquear funcionalidades;
- bloquear presentes ou consumos futuros;
- bloquear ganhos relacionados;
- bloquear comissoes relacionadas;
- suspender payout;
- revisar sessoes, interacoes, denuncias, logs e evidencias;
- reverter valores, ganhos, comissoes ou elegibilidades quando aplicavel;
- solicitar informacoes adicionais;
- aplicar medidas antifraude;
- encerrar conta em caso de abuso ou fraude.

Toda medida deve ter motivo interno registrado.

## 15. Contestacao abusiva

Contestacao abusiva ocorre quando ha indicios de uso do servico seguido de tentativa indevida de reversao, fraude, falsidade, ma-fe, abuso do gateway ou comportamento incompativel com boa-fe.

Exemplos de sinais de risco:

- consumo expressivo seguido de chargeback;
- multiplas contestacoes sem fundamento;
- criacao de contas sucessivas;
- uso de metodos de pagamento de terceiros;
- divergencia de identidade;
- tentativa de obter beneficio gratuito;
- ameaca de chargeback para pressionar criadora, suporte ou plataforma;
- burlar regras de pagamento;
- combinar pagamento por fora;
- usar disputa para obter conteudo, chamada, presente ou interacao sem pagar.

Contestacao abusiva pode gerar bloqueio, revisao financeira, banimento, perda de acesso a funcionalidades e comunicacao a gateway, parceiro financeiro ou autoridade competente quando aplicavel.

## 16. Impacto de chargeback em criadoras e agencias

Chargeback pode impactar elegibilidade de ganhos e comissoes.

Criadoras e agencias nao devem receber automaticamente valores relacionados a pagamento:

- nao confirmado;
- em disputa;
- bloqueado;
- fraudulento;
- revertido;
- cancelado;
- denunciado;
- inelegivel;
- sujeito a chargeback;
- fora do ledger oficial.

Ganhos e comissoes podem ficar pending, blocked, reversed ou cancelled conforme regras de payout, antifraude, gateway, compliance e termos aplicaveis.

## 17. Bloqueio financeiro

A plataforma pode aplicar bloqueio financeiro quando houver risco, disputa, fraude, denuncia, violacao de regra, exigencia de compliance, problema de gateway, inconsistencia tecnica ou obrigacao legal.

O bloqueio financeiro pode abranger:

- saldo interno;
- petalas;
- creditos;
- compras;
- presentes;
- funcionalidades;
- ganhos;
- comissoes;
- payout.

Bloqueio financeiro nao deve ser arbitrario.

Todo bloqueio deve ter motivo interno registrado, data/hora, ator ou sistema responsavel, metadata e, quando aplicavel, referencia a denuncia, transacao, lote, ledger, gateway, usuario, criadora, agencia, sessao ou evento.

## 18. Bloqueio de usuario

O usuario pode ter uso de petalas ou compras restringido em casos como:

- fraude;
- chargeback;
- contestacao abusiva;
- menoridade;
- identidade falsa;
- uso de conta de terceiros;
- violacao de conteudo;
- coercao;
- ameaca;
- vazamento;
- gravacao nao autorizada;
- contato externo proibido;
- pagamento por fora;
- tentativa de burlar plataforma;
- decisao de compliance;
- obrigacao legal.

O bloqueio pode ser temporario ou definitivo, conforme gravidade, reincidencia, risco e decisao interna.

## 19. Bloqueio de criadora

Ganhos de criadora podem ser bloqueados quando houver:

- KYC pendente ou reprovado;
- denuncia;
- violacao de regra;
- conteudo proibido;
- terceiros nao verificados;
- suspeita de menoridade;
- fraude;
- chargeback;
- pagamento por fora;
- contato externo proibido;
- encontro presencial;
- servico sexual presencial;
- violacao de privacidade;
- disputa relevante;
- decisao de compliance;
- obrigacao legal.

O bloqueio de ganhos nao deve ser usado como punicao arbitraria, mas como medida de protecao, revisao, compliance, antifraude ou cumprimento legal.

## 20. Bloqueio de agencia

Comissoes de agencia podem ser bloqueadas quando houver:

- KYB pendente ou reprovado;
- vinculo irregular;
- coacao;
- exploracao;
- retencao de documentos;
- controle abusivo;
- fraude de indicacao;
- promessa falsa;
- cadastro de menor;
- pagamento por fora;
- contato externo proibido;
- chargeback;
- denuncia;
- descumprimento contratual;
- decisao de compliance;
- obrigacao legal.

Comissoes devem depender de elegibilidade, ledger oficial, status do vinculo, antifraude e regras contratuais.

## 21. Ajustes administrativos

Ajustes administrativos devem ser raros, auditaveis e justificados.

Todo ajuste deve registrar:

- usuario afetado;
- quantidade;
- tipo;
- motivo;
- ator/admin;
- timestamp;
- metadata;
- idempotency key;
- ledger;
- lote afetado;
- impacto em elegibilidade;
- justificativa.

Ajustes administrativos nao devem ocorrer por update direto em saldo.

Ajustes devem respeitar fluxo financeiro proprio, com lote, ledger, idempotencia, auditoria e reconciliacao.

## 22. Expiracao de petalas

Petalas podem ter regras de expiracao conforme termos, campanha, origem, lote, promocao, credito gratuito, teste, bloqueio, inatividade, decisao de compliance ou exigencia legal.

Expiracao deve ser comunicada conforme aplicavel e registrada em ledger.

Petalas expiradas nao devem gerar reembolso automatico, salvo obrigacao legal, erro operacional, regra especifica de campanha ou decisao de compliance.

## 23. Falhas tecnicas e cobranca indevida

Falhas tecnicas e cobrancas indevidas devem ser tratadas com prioridade.

Exemplos:

- compra duplicada;
- debito duplicado;
- debito sem entrega de funcionalidade;
- erro de gateway;
- webhook duplicado sem idempotencia;
- saldo divergente;
- lote divergente;
- ledger divergente;
- falha de acesso a conteudo gratuito;
- cobranca por funcionalidade indisponivel;
- consumo sem consentimento exigido;
- erro operacional.

Quando confirmada falha tecnica ou cobranca indevida, a plataforma pode corrigir saldo interno, lote, ledger, desbloqueio, reembolso ou reversao conforme fluxo auditavel.

## 24. Logs e evidencias

Fluxos financeiros devem preservar logs e evidencias suficientes para auditoria.

Evidencias recomendadas:

- user_id;
- creator_id quando aplicavel;
- agency_id quando aplicavel;
- transaction_id;
- gateway id;
- idempotency key;
- lote;
- ledger;
- metadata;
- status;
- metodo;
- valor;
- moeda;
- IP quando permitido;
- user agent quando disponivel;
- data/hora;
- evento de webhook;
- erro seguro;
- decisao de suporte ou compliance;
- motivo interno;
- referencias a denuncias, sessoes, mensagens, presentes ou conteudos.

Logs nao devem expor tokens, chaves secretas, dados sensiveis desnecessarios, documento completo ou credenciais.

## 25. Relacao com payout

Payout de criadoras e agencias deve depender de ledger oficial, elegibilidade, status financeiro e regras de compliance.

Nao deve haver payout automatico sobre:

- petalas nao pagas;
- bonus;
- promocoes;
- creditos gratuitos;
- testes;
- pagamentos nao confirmados;
- chargeback;
- fraude;
- valores bloqueados;
- valores revertidos;
- valores cancelados;
- valores inelegiveis;
- valores fora do ledger oficial.

Qualquer payout deve considerar KYC/KYB, antifraude, gateway, denuncia, bloqueio, status do vinculo, status da sessao/interacao e regras contratuais.

## 26. Relacao com suporte

O suporte deve tratar petalas, reembolsos, chargebacks e bloqueios financeiros com linguagem cuidadosa.

O suporte nao deve prometer:

- reembolso sempre;
- ausencia absoluta de reembolso;
- ganho garantido;
- saque de usuario;
- liberacao de ganho sem revisao;
- desbloqueio financeiro sem analise;
- reversao impossivel;
- confirmacao de pagamento sem fonte canonica.

O suporte deve usar frases como:

- "vamos revisar o caso";
- "a analise depende do status do pagamento e do consumo";
- "quando aplicavel";
- "conforme os Termos";
- "sujeito a revisao financeira";
- "apos confirmacao do pagamento";
- "apos verificacao do gateway";
- "com motivo interno registrado".

## 27. Comunicacao publica

A comunicacao publica nao deve usar expressoes que confundam petalas com dinheiro, banco ou investimento.

Evitar:

- "saldo bancario";
- "saque para usuario";
- "investimento";
- "rendimento";
- "moeda";
- "cashback em dinheiro";
- "garantia de reembolso sempre";
- "sem reembolso nunca";
- "ganho garantido";
- "dinheiro parado";
- "carteira digital";
- "conta de pagamento";
- "deposito";
- "rentabilidade".

Usar:

- "creditos internos";
- "uso dentro da plataforma";
- "sujeito as regras aplicaveis";
- "revisao financeira";
- "quando aplicavel";
- "conforme os Termos";
- "confirmacao do pagamento";
- "historico interno";
- "saldo de petalas";
- "funcionalidades da plataforma".

## 28. Aceites destacados financeiros

Aceites destacados devem ser curtos, neutros e discretos.

Exemplos recomendados:

- "Li e aceito as regras de compra, uso de petalas, reembolso, contestacao de pagamento, revisao financeira e bloqueio de conta."
- "Entendo que petalas sao creditos internos de uso fechado, conforme os Termos."
- "Entendo que bonus, promocoes e creditos gratuitos seguem regras proprias e nao viram dinheiro."
- "Aceito que reembolsos e contestacoes serao analisados conforme os Termos e regras aplicaveis."

O checkbox nao deve ensinar fraude, abuso, chargeback oportunista ou forma de burlar regras.

Detalhes completos devem ficar no corpo dos Termos e politicas aplicaveis.

## 29. Registro tecnico de aceite financeiro

Aceites financeiros devem ser registrados tecnicamente quando aplicavel.

O registro deve conter:

- user_id;
- creator_id ou agency_id quando aplicavel;
- versao;
- hash do texto aceito;
- data/hora;
- IP quando permitido;
- user agent quando disponivel;
- origem do aceite;
- checkboxes destacados aceitos;
- idioma/localidade;
- referencia ao texto exibido;
- contexto do aceite;
- metodo usado;
- metadata.

Reaceite deve ser exigido quando houver mudanca material em compra, uso de petalas, reembolso, chargeback, bloqueio financeiro, payout, elegibilidade ou regras sensiveis.

## 30. Resolucao de disputas

Disputas relacionadas a petalas, reembolso, chargeback, bloqueio financeiro, payout ou comissao devem seguir os Termos aplicaveis.

A plataforma pode prever:

- tentativa amigavel;
- revisao interna;
- analise de suporte;
- analise de compliance;
- analise financeira;
- mediacao quando aplicavel;
- arbitragem quando legalmente aplicavel;
- preservacao de direitos obrigatorios;
- medidas judiciais urgentes quando necessarias;
- comunicacao a gateways, parceiros financeiros ou autoridades quando aplicavel.

Nada nesta politica deve ser interpretado como renuncia absoluta de direitos legais, exclusao total de responsabilidade ou blindagem contra medidas judiciais obrigatorias.

## 31. Status interno

Esta politica e um documento interno v1.

Ela serve como base para:

- desenho de produto;
- revisao juridica;
- revisao contabil;
- revisao regulatoria;
- engenharia financeira;
- suporte;
- compliance;
- antifraude;
- moderacao;
- termos publicos futuros;
- aceites destacados;
- treinamento operacional.

Antes de publicacao externa, esta politica deve passar por revisao juridica, contabil, regulatoria, tributaria, gateway, compliance, privacidade e operacao.
