# Plano Técnico para Publicação das Páginas Legais — Pétala/Bloom

Versão: v1

Status: documento técnico interno.

Este plano define como as páginas legais públicas do Pétala/Bloom deverão ser publicadas futuramente, com segurança, versionamento, controle de exposição e sem liberar funcionalidades sensíveis antes da validação adequada.

Este documento não é uma página pública, não deve ser publicado diretamente no site e não implementa rotas, componentes, banco, aceite versionado, hash, middleware, checkout, payout ou qualquer fluxo financeiro.

## 1. Objetivo do plano

O objetivo deste plano é orientar uma implementação futura das páginas legais públicas do Pétala/Bloom de forma profissional, segura e controlada.

O plano cobre:

- quais documentos públicos-base devem alimentar as páginas legais futuras;
- quais documentos internos não devem ser publicados diretamente;
- quais rotas públicas legais devem existir no futuro;
- como organizar a página índice de termos;
- como evitar exposição acidental de documentos internos;
- como manter o modo pré-lançamento ativo;
- como preservar proteções de áreas sensíveis;
- como preparar versionamento, hash e aceite versionado em blocos futuros separados;
- quais testes devem ser feitos antes de publicar qualquer página legal.

Publicar páginas legais não significa liberar a plataforma ao público, liberar checkout, liberar pagamentos reais, liberar payout, liberar fotos pagas adultas, abrir áreas internas ou remover o modo de pré-lançamento.

## 2. Escopo deste documento

Este documento é apenas um plano técnico interno.

Este documento não faz:

- criação de página pública;
- publicação no site;
- implementação de rotas;
- implementação de componentes;
- implementação de banco;
- implementação de aceite versionado;
- implementação de hash;
- alteração de middleware;
- alteração financeira;
- alteração de checkout;
- alteração de Pix;
- alteração de Stripe;
- alteração de Paggue;
- alteração de saldo;
- alteração de lotes;
- alteração de ledger;
- alteração de gifts;
- alteração de chat;
- alteração de vídeo;
- alteração de payout;
- alteração de comissão;
- alteração de creator_earnings;
- alteração de agency_earnings.

Qualquer implementação futura deve ser feita em blocos pequenos, revisáveis e com validação própria.

## 3. Documentos públicos-base já preparados

Os documentos públicos-base são versões quase finais para publicação futura. Eles têm linguagem pública de site, clara, discreta, premium e honesta.

Documentos públicos-base fonte:

- `docs/publico-termos-usuario-v1.md`
- `docs/publico-termos-criadora-v1.md`
- `docs/publico-termos-agencia-v1.md`
- `docs/publico-politica-petalas-reembolso-v1.md`
- `docs/publico-politica-conteudo-seguranca-v1.md`
- `docs/publico-politica-privacidade-v1.md`

Esses documentos devem ser a fonte inicial das páginas públicas futuras, sujeitos a aprovação final, revisão profissional, exigências de gateway e decisões operacionais antes da publicação.

## 4. Documentos internos que não devem ser publicados diretamente

Os documentos internos têm linguagem técnica, jurídica, financeira ou operacional. Eles servem como base de raciocínio e governança, mas não devem ser expostos diretamente ao público.

Documentos internos não publicáveis diretamente:

- `docs/termos-estrutura-mestre-v1.md`
- `docs/termos-usuario-base-v1.md`
- `docs/termos-criadora-base-v1.md`
- `docs/termos-agencia-base-v1.md`
- `docs/politica-petalas-reembolso-chargeback-v1.md`
- `docs/registro-tecnico-aceite-versionado-v1.md`
- `docs/compliance-legal-operacional-master-v1.md`
- `docs/estrutura-publica-documentos-legais-v1.md`
- `docs/plano-publicacao-paginas-legais-v1.md`

Esses arquivos podem orientar implementação futura, revisão jurídica, compliance, arquitetura de aceite e operações internas, mas não devem ser transformados em páginas públicas sem reescrita adequada.

## 5. Páginas legais futuras

Rotas futuras previstas:

- `/termos`
- `/termos/usuario`
- `/termos/criadora`
- `/termos/agencia`
- `/privacidade`
- `/politicas/conteudo`
- `/politicas/petalas-reembolso`
- `/politicas/denuncias`
- `/politicas/seguranca`

Essas rotas devem ser publicadas apenas quando houver decisão explícita de implementação, revisão do middleware, revisão do modo pré-lançamento e validação de que nenhuma área sensível foi aberta.

## 6. Mapeamento entre rotas e documentos

Mapeamento recomendado:

| Rota futura | Fonte principal | Observação |
| --- | --- | --- |
| `/termos` | Índice criado a partir das páginas legais públicas | Página de navegação e resumo, não substitui termos específicos |
| `/termos/usuario` | `docs/publico-termos-usuario-v1.md` | Termos públicos-base do usuário |
| `/termos/criadora` | `docs/publico-termos-criadora-v1.md` | Termos públicos-base da criadora |
| `/termos/agencia` | `docs/publico-termos-agencia-v1.md` | Termos públicos-base da agência |
| `/privacidade` | `docs/publico-politica-privacidade-v1.md` | Política pública-base de privacidade |
| `/politicas/conteudo` | `docs/publico-politica-conteudo-seguranca-v1.md` | Política pública-base de conteúdo e segurança 18+ |
| `/politicas/petalas-reembolso` | `docs/publico-politica-petalas-reembolso-v1.md` | Política pública-base de pétalas, reembolso e contestação |
| `/politicas/denuncias` | Documento público futuro específico | Criar em bloco próprio antes de publicar |
| `/politicas/seguranca` | Documento público futuro específico | Criar em bloco próprio antes de publicar |

As rotas sem documento público-base específico não devem ser publicadas com texto improvisado.

## 7. Página índice `/termos`

A página `/termos` deve funcionar como índice público dos documentos legais.

Ela deve conter:

- título claro;
- resumo curto;
- lista de documentos disponíveis;
- links para termos por tipo de conta;
- links para políticas públicas;
- versão ou data de vigência quando aplicável;
- aviso de que termos específicos podem se aplicar conforme o tipo de conta e funcionalidade;
- linguagem pública, discreta e profissional.

A página `/termos` não deve:

- substituir os termos específicos;
- misturar conteúdo interno;
- expor decisões estratégicas;
- dizer que a plataforma está liberada;
- afirmar que pagamentos, payout ou fotos pagas estão ativos;
- abrir áreas internas;
- remover o modo pré-lançamento.

## 8. Layout visual recomendado

As páginas legais devem ter aparência premium, legível e consistente com a marca.

Recomendações:

- layout limpo;
- leitura confortável em mobile;
- largura de texto controlada;
- índice lateral ou índice superior quando útil;
- títulos claros;
- espaçamento generoso;
- contraste adequado;
- versão visível;
- data de vigência quando definida;
- links internos bem organizados;
- navegação de retorno para a página índice;
- rodapé com links legais.

Evitar:

- markdown cru sem tratamento visual;
- texto colado em página sem hierarquia;
- largura excessiva de linha;
- contraste fraco;
- blocos jurídicos sem escaneabilidade;
- aparência improvisada;
- banners de marketing dentro de termos;
- promessas financeiras ou operacionais fora do texto aprovado.

## 9. Regra para não usar markdown cru de forma descuidada

Os documentos em `docs/` não devem ser simplesmente renderizados como markdown cru sem cuidado.

Implementação futura deve:

- converter o conteúdo para componentes de leitura controlados;
- preservar títulos e listas;
- aplicar estilos consistentes;
- validar links;
- exibir versão;
- impedir exposição de arquivos internos;
- evitar renderização automática de qualquer arquivo de `docs/`;
- revisar manualmente o conteúdo publicado.

Se for usado markdown como fonte, deve haver uma camada segura de seleção explícita dos documentos públicos permitidos.

## 10. Componentização futura

Uma implementação futura pode criar componentes como:

- `LegalPageLayout`;
- `LegalDocumentHeader`;
- `LegalSection`;
- `LegalIndex`;
- `LegalVersionBadge`;
- `LegalUpdatedAt`;
- `LegalFooterLinks`;
- `LegalTableOfContents`.

Esses componentes devem ser usados apenas para apresentação das páginas legais públicas, sem alterar regras financeiras, aceite, checkout, banco ou áreas internas.

## 11. Fonte dos textos

A fonte inicial dos textos públicos deve ser a lista de documentos públicos-base aprovada em `docs/`.

Não deve haver cópia manual improvisada diretamente em componentes sem controle de versão.

Opções futuras possíveis:

- importar conteúdo aprovado como string estática;
- converter markdown aprovado em dados estruturados;
- criar arquivos de conteúdo versionados em pasta específica;
- armazenar versões legais em banco somente quando o aceite versionado for implementado.

Qualquer escolha deve preservar:

- versionamento;
- rastreabilidade;
- revisão humana;
- controle de quais documentos são públicos;
- separação entre documento público e documento interno.

## 12. Metadados recomendados por documento

Cada documento público futuro deve ter metadados explícitos.

Metadados recomendados:

- `document_key`;
- título;
- versão;
- status;
- data de vigência;
- idioma;
- rota pública;
- fonte em `docs/`;
- hash futuro;
- data de última revisão;
- se exige reaceite;
- tipo de conta relacionado;
- funcionalidades relacionadas;
- observações de publicação.

Esses metadados devem preparar o caminho para aceite versionado futuro, sem implementar aceite neste bloco.

## 13. Versionamento dos textos

Cada página legal publicada deve exibir a versão do documento.

Regras recomendadas:

- versão semântica ou versão documental clara;
- não alterar texto publicado sem nova versão quando houver mudança material;
- preservar histórico de versões;
- registrar data de vigência;
- separar pequenas correções editoriais de mudanças materiais;
- exigir reaceite quando a mudança afetar direitos, deveres, riscos, pagamento, conteúdo, privacidade, payout, denúncia, moderação ou segurança.

## 14. Hash dos documentos futuro

Em bloco futuro, cada versão legal deve ter hash do texto aceito.

Recomendações:

- usar SHA-256 ou equivalente forte;
- calcular sobre o texto exato exibido;
- preservar hash por versão;
- não recalcular silenciosamente versão antiga;
- armazenar hash em tabela de versões legais;
- usar hash nos registros de aceite.

Este plano não implementa hash.

## 15. Aceite versionado futuro

O aceite versionado deve ser implementado em bloco próprio.

Ele deve registrar:

- usuário ou conta relacionada;
- tipo de conta;
- documento aceito;
- versão;
- hash;
- data e hora;
- origem;
- fluxo;
- checkboxes destacados;
- IP quando permitido;
- user agent quando disponível;
- idioma;
- metadados necessários.

O sistema futuro não deve depender de uma coluna simples como `terms_accepted = true`.

Este plano não implementa aceite versionado.

## 16. Reaceite obrigatório futuro

Mudanças materiais devem exigir reaceite quando aplicável.

Exemplos de mudanças que podem exigir reaceite:

- regras de conteúdo;
- política 18+;
- privacidade;
- compra de pétalas;
- reembolso;
- contestação;
- chamadas pagas;
- presentes;
- fotos pagas;
- payout;
- comissão;
- agência;
- KYC/KYB;
- moderação;
- denúncia;
- banimento;
- revisão financeira;
- resolução de disputas.

Funcionalidades sensíveis devem poder ser bloqueadas até o reaceite aplicável.

## 17. Checkboxes futuros

Checkboxes devem ser curtos, neutros e discretos.

Eles devem:

- remeter ao documento completo;
- destacar categorias sensíveis sem excesso de detalhe;
- evitar linguagem que ensine fraude, abuso ou burla;
- não esconder cláusula sensível;
- ser visíveis o suficiente para validade;
- ser discretos o suficiente para não incentivar conduta oportunista.

Detalhes fortes ficam no corpo dos Termos e Políticas.

Checkboxes longos e múltiplos só devem ser usados quando estritamente necessário por risco jurídico, compliance, gateway, KYC, arbitragem, maioridade ou financeiro sensível.

## 18. Rodapé do site

Quando as páginas legais forem publicadas, o rodapé do site deve incluir links coerentes para:

- Termos;
- Privacidade;
- Política de Conteúdo e Segurança 18+;
- Política de Pétalas, Reembolso e Contestação;
- Política de Denúncias, quando existir;
- Política de Segurança, quando existir.

Durante o pré-lançamento, o rodapé deve ser revisado cuidadosamente para não abrir o app real, checkout, áreas internas ou páginas que comuniquem disponibilidade pública indevida.

## 19. Relação com modo pré-lançamento

Publicar páginas legais não deve remover o modo pré-lançamento.

Durante pré-lançamento:

- o site real deve continuar protegido;
- áreas internas devem continuar protegidas;
- rotas sensíveis devem continuar bloqueadas;
- APIs de app devem continuar protegidas;
- checkout não deve ser liberado por causa das páginas legais;
- payout não deve ser liberado;
- fotos pagas adultas não devem ser liberadas;
- app, admin, criadora, agência, chat, vídeo e pagamento devem continuar seguindo suas próprias proteções.

A decisão de permitir acesso público às páginas legais deve ser separada da decisão de abrir a plataforma.

## 20. SEO e noindex durante pré-lançamento

Durante pré-lançamento, a postura deve continuar conservadora.

Recomendações:

- manter `noindex` enquanto a plataforma não estiver pronta para exposição pública;
- garantir que publicação de páginas legais não abra indexação geral sem decisão explícita;
- revisar `robots.ts`;
- revisar headers;
- revisar middleware;
- impedir indexação de áreas internas;
- impedir exposição de documentos internos.

Se páginas legais precisarem ser acessíveis em pré-lançamento, isso deve ser decidido explicitamente e testado com cuidado.

## 21. Segurança de rotas

A implementação futura deve revisar o middleware antes de publicar qualquer rota legal.

Cuidados:

- `/admin` deve continuar exigindo role admin;
- `/criadora` deve continuar protegida conforme regras da área;
- `/agencia` deve continuar protegida conforme regras da área;
- checkout deve continuar protegido por fluxo próprio;
- APIs comuns do app não devem ficar públicas por acidente;
- webhooks devem continuar com validação própria;
- assets necessários devem continuar funcionando;
- páginas legais públicas não devem criar bypass para áreas internas;
- documentos internos não devem ser servidos por rota dinâmica genérica.

Não deve existir rota que leia qualquer arquivo de `docs/` por parâmetro livre.

## 22. Nenhuma alteração financeira

A publicação das páginas legais não deve alterar:

- Pix;
- Stripe;
- Paggue;
- checkout;
- saldo;
- lotes;
- ledger;
- gifts;
- chat;
- vídeo;
- payout;
- comissão;
- creator_earnings;
- agency_earnings;
- regras de cobrança;
- regras de reembolso;
- regras de contestação;
- regras de desbloqueio pago;
- regras de foto paga.

Documentar regras não significa ativar fluxo financeiro.

## 23. Nenhuma liberação de payout

As páginas legais não devem liberar payout.

Payout deve continuar bloqueado ou limitado até haver:

- KYC/KYB adequado;
- elegibilidade;
- ledger confiável;
- antifraude;
- política financeira validada;
- gateway compatível;
- revisão contábil;
- revisão jurídica;
- testes completos;
- auditoria operacional.

## 24. Nenhuma publicação de documento interno

Documentos internos não devem ser expostos ao público.

Riscos de publicar documento interno:

- revelar estratégia operacional;
- revelar pendências;
- revelar arquitetura financeira;
- revelar riscos de compliance;
- criar comunicação inadequada para usuário final;
- confundir termos públicos com notas internas;
- comprometer confiança;
- criar risco jurídico ou comercial.

A implementação futura deve ter allowlist explícita de documentos públicos.

## 25. Ordem segura de implementação futura

Ordem recomendada para publicar páginas legais:

1. Confirmar que os documentos públicos-base estão aprovados.
2. Criar documentos públicos faltantes, como denúncias e segurança.
3. Definir metadados por documento.
4. Criar componente visual de página legal.
5. Criar página índice `/termos`.
6. Criar rotas legais públicas uma a uma.
7. Revisar middleware e modo pré-lançamento.
8. Garantir que nenhuma área sensível foi aberta.
9. Adicionar links no rodapé de forma controlada.
10. Validar mobile, legibilidade e links.
11. Validar `noindex` ou política de indexação.
12. Rodar build.
13. Revisar diff para confirmar ausência de alteração financeira.
14. Fazer teste manual.
15. Só então considerar commit.

## 26. Ordem segura de aceite versionado futuro

Ordem recomendada para aceite versionado:

1. Definir modelo de documentos legais versionados.
2. Criar migrations em bloco próprio.
3. Criar hash reproduzível dos textos.
4. Criar tabelas de versões legais.
5. Criar registros de aceite.
6. Criar registros de checkboxes.
7. Criar APIs server-side de aceite.
8. Criar bloqueios por falta de aceite.
9. Implementar aceite de usuário.
10. Implementar aceite de criadora.
11. Implementar aceite de agência.
12. Implementar aceite financeiro.
13. Implementar aceite de chamada paga.
14. Implementar aceite de payout.
15. Implementar reaceite obrigatório.
16. Criar auditoria admin.
17. Criar consulta limitada para suporte.
18. Testar bloqueios e reaceites.

Essa implementação não deve ser misturada com publicação visual de páginas legais.

## 27. Testes antes de publicar

Testes futuros devem incluir:

- páginas legais abrindo;
- links funcionando;
- mobile legível;
- versão visível;
- nenhum documento interno exposto;
- middleware sem abrir área sensível;
- `/admin` bloqueado para não-admin;
- `/criadora` protegida;
- `/agencia` protegida;
- checkout não liberado;
- payout bloqueado;
- modo pré-lançamento ativo;
- `noindex` mantido quando aplicável;
- build passando;
- diff sem alterações financeiras;
- diff sem alterações de backend sensível;
- git status limpo após commit e push.

Também devem ser testados links de rodapé, navegação entre documentos, responsividade, legibilidade e ausência de promessas financeiras indevidas.

## 28. Critérios de não aprovação

O bloco futuro de publicação das páginas legais deve ser bloqueado se:

- publicar documento interno diretamente;
- remover modo pré-lançamento sem decisão explícita;
- abrir `/admin`, `/criadora`, `/agencia` ou áreas internas;
- liberar checkout;
- liberar pagamento real;
- liberar payout;
- liberar fotos pagas adultas;
- alterar Pix, Stripe, Paggue, saldo, lotes ou ledger;
- alterar migrations sem escopo aprovado;
- criar aceite incompleto;
- criar hash não reproduzível;
- ocultar versão do documento;
- usar markdown cru com aparência improvisada;
- expor arquivos de `docs/` por rota dinâmica livre;
- criar SEO/indexação pública sem decisão explícita;
- misturar redesign global com compliance;
- misturar documento legal com marketing agressivo.

## 29. Arquivos que uma implementação futura pode alterar

Em bloco futuro específico, poderão ser avaliados arquivos como:

- rotas em `app/termos`;
- rotas em `app/politicas`;
- rota `app/privacidade`;
- componentes legais reutilizáveis;
- rodapé ou navegação pública;
- metadados de páginas;
- `robots.ts`;
- `middleware.ts`, apenas com revisão cuidadosa;
- arquivos de conteúdo público controlado.

Essa lista não autoriza alteração agora. Ela apenas orienta um bloco futuro.

## 30. Arquivos e áreas que não devem ser tocados por este plano

Este plano não autoriza mexer em:

- app público real;
- áreas internas;
- middleware atual;
- autenticação;
- admin;
- criadora;
- agência;
- checkout;
- Pix;
- Stripe;
- Paggue;
- saldo;
- lotes;
- ledger;
- migrations;
- RPCs;
- gifts;
- chat;
- vídeo;
- billing;
- payout;
- comissão;
- creator_earnings;
- agency_earnings;
- fotos pagas;
- desbloqueio pago;
- banco.

## 31. Status do plano

Este é o Plano Técnico para Publicação das Páginas Legais v1 do Pétala/Bloom.

Ele é um documento técnico interno, salvo em `docs/`, e não altera produto, código executável, rotas públicas, banco, middleware, financeiro, checkout, payout, aceite ou hash.

O plano deve ser usado como referência para blocos futuros pequenos, seguros e revisáveis.
