# Item 8A - Estrutura Publica dos Documentos Legais do Site - Petala/Bloom

Status: documento interno v1.  
Uso: preparacao interna para futura publicacao dos documentos legais do site.  
Publicacao: nao publicado no site.  
Escopo: estrutura, linguagem e ordem futura dos documentos publicos; nao cria paginas, nao publica termos, nao altera produto, codigo, banco, APIs, pagamentos ou aceite real.

## 1. Objetivo

Este documento define a estrutura publica futura dos documentos legais do site Petala/Bloom.

O objetivo e orientar a criacao de documentos publicos claros, discretos, premium e honestos, sem expor linguagem interna tecnica ou operacional, e sem publicar nada antes da revisao profissional e da decisao operacional de lancamento.

Este documento tambem separa o que deve ficar em documentos publicos do que deve permanecer em documentos internos de compliance, produto, financeiro, engenharia, suporte e operacao.

## 2. Principio central

Publico e interno devem ter funcoes diferentes.

Publico:

- claro;
- discreto;
- premium;
- honesto;
- compreensivel para usuarios, criadoras e agencias;
- juridicamente cuidadoso;
- sem excesso de linguagem tecnica;
- sem promessa financeira falsa;
- sem linguagem vulgar;
- sem expor estrategia interna, risco de gateway, detalhes de antifraude ou implementacao.

Interno:

- tecnico;
- juridico;
- financeiro;
- operacional;
- detalhado;
- orientado a compliance;
- orientado a auditoria;
- orientado a suporte, engenharia e risco;
- adequado para discussoes de gateway, KYC/KYB, payout, chargeback, moderacao, denuncia e bloqueio.

A comunicacao publica deve transmitir confianca, seguranca e limites claros, sem parecer improvisada, defensiva ou excessivamente tecnica.

## 3. Paginas publicas futuras recomendadas

As paginas publicas futuras recomendadas sao:

- `/termos`;
- `/termos/usuario`;
- `/termos/criadora`;
- `/termos/agencia`;
- `/privacidade`;
- `/politicas/conteudo`;
- `/politicas/petalas-reembolso`;
- `/politicas/denuncias`;
- `/politicas/seguranca`.

Essas paginas devem ser publicadas apenas quando houver revisao final e decisao operacional.

Antes disso, os textos devem ser preparados em `docs/` como documentos publicos-base.

## 4. Diretriz de documento publico-base quase final

Os documentos publicos-base dos proximos itens devem ser escritos como versoes quase finais para publicacao futura.

Diretrizes obrigatorias:

- escrever como se fosse publicar;
- salvar primeiro em `docs/`;
- nao publicar ainda;
- nao usar linguagem interna;
- nao deixar texto provisorio visivel;
- nao usar observacoes como "ajustar depois", "TODO", "rascunho cru" ou linguagem de bastidor;
- manter versao pronta para aprovacao externa;
- manter tom publico de site;
- manter linguagem discreta, premium e honesta;
- preservar clareza juridica;
- preservar protecao de compliance;
- ajustar depois somente se o usuario, advogado, contador, gateway, revisao de privacidade, decisao operacional ou mudanca regulatoria exigirem.

O documento publico-base nao deve ser um documento interno copiado para o usuario final.

Ele deve nascer com linguagem de publicacao, mesmo permanecendo guardado em `docs/` ate aprovacao.

## 5. Pagina /termos

A pagina `/termos` deve funcionar como porta principal dos termos legais.

Objetivo:

- apresentar visao geral;
- explicar que existem termos especificos para usuario, criadora e agencia;
- indicar politicas complementares;
- apontar para privacidade, conteudo, petalas/reembolso, denuncias e seguranca;
- informar que o uso da plataforma depende de aceitar os termos aplicaveis;
- manter linguagem simples e profissional.

Conteudo recomendado:

- introducao curta;
- aplicacao dos termos;
- estrutura dos documentos;
- links para termos especificos;
- links para politicas;
- informacao de atualizacao e vigencia;
- contato ou canal de suporte quando aplicavel.

O texto nao deve prometer funcionalidades ainda nao disponiveis.

## 6. Pagina /termos/usuario

A pagina `/termos/usuario` deve apresentar os termos publicos para usuarios.

Objetivo:

- explicar requisitos de uso;
- reforcar maioridade 18+;
- explicar petalas como creditos internos;
- explicar limites de interacao;
- explicar consentimento;
- explicar pagamentos, reembolso e contestacao de forma cuidadosa;
- explicar condutas proibidas;
- explicar denuncia, moderacao, bloqueio e banimento;
- explicar que pagamento nao garante ato especifico.

Pontos essenciais:

- usuario deve ter 18 anos ou mais;
- usuario deve respeitar limites das criadoras;
- usuario nao pode exigir ato especifico porque pagou;
- contato externo para burlar regras e pagamento e proibido;
- encontro presencial e servico sexual presencial sao proibidos;
- gravacao, captura e compartilhamento sem autorizacao sao proibidos;
- petalas sao creditos internos de uso fechado;
- reembolsos e contestacoes seguem regras aplicaveis;
- violacoes podem gerar bloqueio, banimento e revisao financeira.

## 7. Pagina /termos/criadora

A pagina `/termos/criadora` deve apresentar os termos publicos para criadoras.

Objetivo:

- explicar requisitos para atuar como criadora;
- reforcar maioridade 18+;
- explicar verificacao de identidade;
- explicar participacao voluntaria;
- explicar consentimento e limites;
- deixar claro que a criadora nao e obrigada a produzir conteudo adulto;
- explicar regras de conteudo, mensagens, chamadas e presentes;
- explicar elegibilidade de ganhos e payout sem promessa falsa;
- explicar bloqueios, chargeback, revisao financeira e compliance;
- explicar proibicoes relacionadas a contato externo, pagamento por fora e encontro presencial.

Pontos essenciais:

- criadora deve ter 18 anos ou mais;
- KYC pode ser exigido;
- participacao e voluntaria;
- a plataforma, usuarios, agentes ou agencias nao podem obrigar conteudo adulto;
- ganhos dependem de elegibilidade, ledger, KYC, antifraude, gateway, revisao financeira e regras aplicaveis;
- a comunicacao publica nao deve prometer renda garantida.

## 8. Pagina /termos/agencia

A pagina `/termos/agencia` deve apresentar os termos publicos para agencias e parceiros operacionais.

Objetivo:

- explicar papel da agencia;
- deixar claro que agencia nao e dona/controladora da criadora;
- explicar KYB/verificacao;
- explicar atuacao permitida;
- explicar autonomia da criadora;
- explicar regras de comissao e elegibilidade;
- proibir coacao, exploracao, retencao de documentos/senha/celular/Pix/conta bancaria;
- proibir promessa falsa de ganhos;
- proibir cadastro de menor;
- proibir pagamento por fora, encontro presencial e servico sexual presencial;
- explicar bloqueio, reversao, encerramento e banimento.

Pontos essenciais:

- agencia e parceira operacional;
- criadora mantem autonomia;
- comissao depende de contrato, elegibilidade, ledger, antifraude, KYB, compliance, gateway e status do vinculo;
- violacoes graves podem gerar encerramento, perda de comissao e banimento.

## 9. Pagina /privacidade

A pagina `/privacidade` deve apresentar a politica publica de privacidade.

Objetivo:

- explicar quais dados sao coletados;
- explicar por que os dados sao coletados;
- explicar bases legais quando aplicavel;
- explicar uso de dados de conta, autenticacao, pagamentos, KYC/KYB, suporte, seguranca, moderacao, denuncias e antifraude;
- explicar compartilhamentos com provedores;
- explicar retencao;
- explicar direitos dos titulares;
- explicar contato para privacidade.

Pontos sensiveis:

- dados de identidade e verificacao;
- logs de acesso;
- dados de pagamento processados por gateways;
- dados de suporte;
- denuncias e moderacao;
- registros de aceite;
- seguranca e antifraude.

A politica publica deve ser clara e completa, mas nao deve expor segredo, arquitetura interna ou detalhes que facilitem abuso.

## 10. Pagina /politicas/conteudo

A pagina `/politicas/conteudo` deve apresentar a politica publica de conteudo.

Objetivo:

- explicar que a plataforma e 18+;
- explicar regras de consentimento;
- explicar conteudos permitidos e proibidos;
- explicar limites de mensagens, chamadas, fotos e interacoes;
- explicar proibicao de menores e terceiros nao verificados;
- explicar proibicao de conteudo nao consensual;
- explicar denuncia, revisao, bloqueio e banimento;
- manter linguagem discreta e nao vulgar.

Tom recomendado:

- firme;
- claro;
- protetivo;
- premium;
- sem sensacionalismo;
- sem linguagem explicita desnecessaria.

## 11. Pagina /politicas/petalas-reembolso

A pagina `/politicas/petalas-reembolso` deve apresentar a politica publica sobre petalas, reembolso e contestacao.

Objetivo:

- explicar petalas como creditos internos de uso fechado;
- explicar que petalas nao sao moeda, investimento, deposito bancario, conta de pagamento, saldo sacavel ou transferivel;
- explicar compra, uso, consumo, bonus e creditos gratuitos;
- explicar reembolso e direito de arrependimento de forma cuidadosa;
- explicar que petalas consumidas nao geram reembolso automatico;
- explicar contestacao de pagamento e revisao financeira;
- explicar bloqueios financeiros com linguagem publica adequada.

Essa pagina deve evitar linguagem absoluta como:

- "sem reembolso nunca";
- "reembolso garantido sempre";
- "saldo bancario";
- "saque";
- "rendimento";
- "moeda".

## 12. Pagina /politicas/denuncias

A pagina `/politicas/denuncias` deve apresentar o funcionamento publico de denuncias.

Objetivo:

- explicar como denunciar;
- explicar quais condutas podem ser denunciadas;
- explicar que denuncias podem gerar revisao;
- explicar que a plataforma pode bloquear conteudo, conta, funcionalidades, ganhos ou comissoes quando aplicavel;
- explicar que denuncias falsas ou abusivas tambem podem ter consequencias;
- explicar prioridade para menores, coercao, exploracao, ameaca, vazamento, gravacao nao autorizada, contato externo proibido, pagamento por fora e violacoes graves.

Essa pagina deve transmitir seguranca e confianca sem prometer resultado automatico para todo caso.

## 13. Pagina /politicas/seguranca

A pagina `/politicas/seguranca` deve apresentar diretrizes publicas de seguranca.

Objetivo:

- orientar usuarios e criadoras sobre protecao de conta;
- reforcar que senha, documentos, Pix, celular e conta bancaria nao devem ser entregues a terceiros;
- explicar riscos de contato externo;
- explicar que pagamentos devem ocorrer apenas pela plataforma;
- explicar protecao contra gravacao, compartilhamento e vazamento;
- explicar canais de suporte e denuncia;
- explicar que a plataforma pode agir contra abuso, fraude, exploracao e burla.

A pagina deve ser pratica, clara e discreta.

## 14. Linguagem publica recomendada

Usar linguagem como:

- "plataforma 18+";
- "ambiente discreto";
- "interacoes com consentimento";
- "creditos internos";
- "uso dentro da plataforma";
- "sujeito as regras aplicaveis";
- "revisao financeira";
- "quando aplicavel";
- "conforme os Termos";
- "denuncias sao analisadas";
- "medidas de seguranca";
- "verificacao de identidade";
- "participacao voluntaria";
- "limites devem ser respeitados".

A linguagem deve ser profissional, direta e humana.

## 15. Linguagem publica a evitar

Evitar:

- linguagem vulgar;
- linguagem que rotule criadoras publicamente como adultas;
- "ganho garantido";
- "renda garantida";
- "saldo bancario";
- "investimento";
- "rendimento";
- "moeda";
- "saque para usuario";
- "sem reembolso nunca";
- "reembolso sempre garantido";
- "a plataforma nunca tem responsabilidade";
- "voce nunca pode processar";
- "adult/high-risk" em texto publico final;
- detalhes internos de gateway, antifraude, KYC/KYB ou auditoria;
- termos crus de engenharia;
- promessas de funcionalidades ainda nao liberadas.

## 16. Como falar de 18+

A comunicacao publica deve dizer que a plataforma e 18+ de forma clara e discreta.

Diretrizes:

- afirmar que o uso e permitido apenas para maiores de 18 anos;
- explicar que verificacoes podem ser exigidas;
- explicar que menores sao proibidos;
- explicar que conteudo envolvendo menores e proibido;
- manter linguagem sobria;
- nao usar tom sensacionalista;
- nao transformar a marca publica em comunicacao vulgar.

Exemplo de direcao de linguagem:

"O Petala e uma plataforma para adultos. Para usar a plataforma, voce deve ter 18 anos ou mais e respeitar as regras de consentimento, seguranca e conteudo."

## 17. Como falar de criadoras

A comunicacao publica deve respeitar a autonomia e a dignidade das criadoras.

Diretrizes:

- usar "criadoras";
- evitar rotulos publicos desnecessarios;
- reforcar voluntariedade;
- reforcar limites;
- reforcar consentimento;
- nao prometer ganho garantido;
- nao sugerir obrigacao de conteudo adulto;
- nao permitir linguagem que normalize coacao, controle ou exploracao.

Exemplo de direcao de linguagem:

"Criadoras definem seus limites e participam de forma voluntaria, conforme as regras da plataforma."

## 18. Como falar de petalas

A comunicacao publica deve explicar petalas como creditos internos.

Diretrizes:

- dizer "creditos internos";
- dizer "uso dentro da plataforma";
- evitar "moeda";
- evitar "investimento";
- evitar "saldo bancario";
- evitar "rendimento";
- evitar "saque para usuario";
- explicar que bonus e creditos gratuitos seguem regras proprias;
- explicar que petalas nao garantem ato especifico.

Exemplo de direcao de linguagem:

"Petalas sao creditos internos usados em funcionalidades da plataforma, conforme os Termos aplicaveis."

## 19. Como falar de reembolso e contestacao

A comunicacao publica deve ser equilibrada.

Diretrizes:

- respeitar direitos legais aplicaveis;
- evitar promessa de reembolso sempre;
- evitar negativa absoluta de reembolso;
- explicar que consumo, status do pagamento, bonus, fraude, chargeback e regras aplicaveis podem influenciar a analise;
- explicar que contestacoes podem gerar revisao financeira;
- explicar que contestacao abusiva pode gerar bloqueio e medidas cabiveis;
- manter linguagem clara e nao tecnica.

Exemplo de direcao de linguagem:

"Pedidos de reembolso e contestacoes sao analisados conforme o metodo de pagamento, o status da compra, o uso dos creditos, as regras aplicaveis e os direitos previstos em lei."

## 20. Como falar de denuncias e moderacao

A comunicacao publica deve transmitir seguranca e responsabilidade.

Diretrizes:

- explicar como denunciar;
- explicar que denuncias sao analisadas;
- explicar que medidas podem incluir remocao de conteudo, bloqueio, suspensao, banimento e revisao financeira quando aplicavel;
- priorizar seguranca de pessoas, consentimento e maioridade;
- nao prometer resultado automatico;
- nao expor detalhes internos de investigacao.

Exemplo de direcao de linguagem:

"Denuncias ajudam a manter a plataforma segura. Ao receber uma denuncia, podemos revisar contas, conteudos, interacoes e tomar medidas conforme a gravidade e as regras aplicaveis."

## 21. Checkboxes publicos

Checkboxes publicos devem ser curtos, neutros e discretos.

Diretrizes:

- checkbox deve ser claro;
- checkbox deve remeter ao termo completo;
- detalhes especificos ficam no corpo do termo;
- nao usar checkbox que explique passo a passo fraude ou abuso;
- nao esconder clausula sensivel;
- usar multiplos checkboxes detalhados somente quando estritamente necessario.

Exemplos:

- "Declaro que tenho 18 anos ou mais.";
- "Li e aceito os Termos e Politicas aplicaveis.";
- "Entendo que petalas sao creditos internos de uso fechado, conforme os Termos.";
- "Li e aceito as regras de conteudo, consentimento, denuncia, bloqueio e banimento.";
- "Aceito as regras de compra, uso de petalas, reembolso e revisao financeira."

## 22. Relacao com modo pre-lancamento

Enquanto o site estiver em modo pre-lancamento:

- documentos publicos nao devem ser publicados automaticamente;
- textos publicos-base devem ficar em `docs/`;
- o app real nao deve ficar navegavel para publico geral;
- termos internos nao devem aparecer como pagina publica;
- pagamentos reais em escala e funcionalidades sensiveis devem permanecer bloqueados ate validacao;
- qualquer publicacao deve ser decisao explicita.

O modo pre-lancamento protege produto, marca, compliance e operacao enquanto a estrutura legal e financeira amadurece.

## 23. Ordem futura de publicacao

Ordem futura recomendada:

1. Finalizar documentos internos.
2. Escrever documentos publicos-base quase finais em `docs/`.
3. Revisar linguagem publica para tom premium, discreto e honesto.
4. Submeter a advogado, contador, privacidade, gateway e compliance quando aplicavel.
5. Ajustar conforme revisao profissional e decisao operacional.
6. Implementar paginas publicas.
7. Implementar aceite versionado.
8. Validar bloqueios por falta de aceite.
9. Testar em pre-lancamento.
10. Publicar apenas quando houver autorizacao.

## 24. O que este documento nao faz

Este documento nao:

- cria pagina publica;
- publica termos;
- altera app;
- altera rotas;
- altera middleware;
- altera APIs;
- altera banco;
- implementa migrations;
- implementa aceite real;
- altera financeiro;
- altera Stripe;
- altera Pix;
- altera Paggue;
- altera saldo, lotes ou ledger;
- libera pagamento real;
- libera payout;
- libera fotos pagas;
- substitui revisao profissional.

## 25. Status interno

Este documento e interno e esta em versao v1.

Ele serve como guia de estrutura e linguagem para futuros documentos publicos do Petala/Bloom.

Os documentos publicos-base dos proximos itens devem ser escritos como quase finais para publicacao futura, mas devem permanecer em `docs/` ate aprovacao final.

Este documento nao altera produto, codigo, banco, termos publicos, aceite real, pagamentos, payout ou operacao.
