import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { PUBLIC_LEGAL_DOCUMENTS } from '@/lib/legal/public-documents'

const document = PUBLIC_LEGAL_DOCUMENTS['privacidade']

export default function LegalDocumentPage() {
  return (
    <LegalPageLayout
      title={document.title}
      description={document.description}
      version={document.version}
    >
      <p>Esta Política de Privacidade explica como o Pétala/Bloom pode coletar, usar, armazenar, proteger, compartilhar e revisar dados pessoais relacionados ao uso da plataforma.</p>

      <p>O Pétala/Bloom é uma plataforma 18+ discreta, premium e honesta. O uso da plataforma é permitido apenas para pessoas maiores de 18 anos.</p>

      <p>Ao criar conta, acessar ou usar o Pétala/Bloom, você declara que leu, entendeu e aceita esta Política, os Termos aplicáveis e as regras exibidas na plataforma.</p>

      <h2>1. Quem somos</h2>

      <p>O Pétala/Bloom é uma plataforma digital que conecta usuários, criadoras, agências e representantes autorizados em experiências, interações, conteúdos e funcionalidades disponíveis dentro do ambiente da plataforma.</p>

      <p>Esta Política se aplica ao tratamento de dados pessoais realizado no contexto do Pétala/Bloom, incluindo cadastro, autenticação, verificação, uso da plataforma, compras, pétalas, mensagens, chamadas, conteúdos, presentes, denúncias, suporte, segurança, moderação e demais funcionalidades oferecidas.</p>

      <h2>2. Aplicação desta Política</h2>

      <p>Esta Política se aplica a:</p>

      <ul>
        <li>usuários;</li>
        <li>criadoras;</li>
        <li>agências;</li>
        <li>representantes de agências;</li>
        <li>administradores e operadores autorizados;</li>
        <li>pessoas que acessam páginas, formulários, convites, comunicações ou funcionalidades do Pétala/Bloom;</li>
        <li>pessoas mencionadas em solicitações, denúncias, suporte, verificações ou comunicações relacionadas à plataforma.</li>
      </ul>

      <p>Algumas funcionalidades podem ter avisos adicionais de privacidade, termos específicos ou aceites destacados. Quando isso acontecer, esses avisos complementam esta Política.</p>

      <h2>3. Plataforma 18+</h2>

      <p>O Pétala/Bloom é destinado exclusivamente a pessoas maiores de 18 anos.</p>

      <p>Menores de idade não podem criar conta, acessar, usar, aparecer em conteúdo, participar de mensagens, participar de chamadas, enviar dados, interagir com contas ou usar qualquer funcionalidade da plataforma.</p>

      <p>Se houver indício de menoridade, uso indevido de conta, documento falso ou participação de menor em conteúdo ou interação, a plataforma poderá tratar dados necessários para revisar o caso, restringir a conta, preservar registros, proteger pessoas envolvidas e cumprir obrigações aplicáveis.</p>

      <h2>4. Dados que podemos coletar</h2>

      <p>Podemos coletar dados fornecidos diretamente por você, dados gerados pelo uso da plataforma, dados recebidos de parceiros de serviço e dados necessários para segurança, verificação, pagamento, suporte, moderação e cumprimento de regras.</p>

      <p>Os dados coletados podem variar conforme o tipo de conta, funcionalidade usada, etapa de cadastro, verificação, compra, interação, denúncia, suporte ou exigência de segurança.</p>

      <h2>5. Dados de cadastro e conta</h2>

      <p>Podemos coletar e tratar dados de cadastro e conta, como:</p>

      <ul>
        <li>nome;</li>
        <li>nome de exibição;</li>
        <li>e-mail;</li>
        <li>telefone, quando fornecido ou exigido;</li>
        <li>data de nascimento;</li>
        <li>senha em formato protegido;</li>
        <li>foto de perfil;</li>
        <li>preferências de conta;</li>
        <li>idioma e localidade;</li>
        <li>tipo de conta;</li>
        <li>status da conta;</li>
        <li>data de criação;</li>
        <li>data de último acesso;</li>
        <li>informações de autenticação;</li>
        <li>histórico de alterações relevantes;</li>
        <li>registros de login, recuperação de senha e confirmação de conta.</li>
      </ul>

      <p>Também podemos tratar dados necessários para proteger a conta contra acesso indevido, fraude, abuso, automação, spam, uso por terceiros ou violação de regras.</p>

      <h2>6. Dados de idade, identidade e verificação</h2>

      <p>Para proteger a plataforma e cumprir regras de maioridade, segurança e verificação, podemos solicitar ou tratar dados de idade e identidade.</p>

      <p>Esses dados podem incluir:</p>

      <ul>
        <li>data de nascimento;</li>
        <li>documento de identificação;</li>
        <li>CPF ou identificação equivalente;</li>
        <li>selfie;</li>
        <li>prova de vida;</li>
        <li>imagem facial;</li>
        <li>comparação entre documento e selfie;</li>
        <li>status de verificação;</li>
        <li>resultado de análise de identidade;</li>
        <li>dados de KYC ou KYB quando aplicável;</li>
        <li>informações de tentativa de verificação;</li>
        <li>motivo de reprovação ou revisão;</li>
        <li>registros de reenvio, aprovação, bloqueio ou expiração.</li>
      </ul>

      <p>Esses dados podem ser tratados por sistemas internos, operadores autorizados e provedores especializados em verificação de identidade, prevenção de fraude e segurança.</p>

      <h2>7. Dados de criadoras</h2>

      <p>Quando a conta for de criadora, também podemos tratar dados relacionados à atividade da criadora na plataforma, como:</p>

      <ul>
        <li>perfil público;</li>
        <li>descrição;</li>
        <li>fotos e conteúdos enviados;</li>
        <li>status de verificação;</li>
        <li>status de disponibilidade;</li>
        <li>configurações de perfil;</li>
        <li>limites e preferências;</li>
        <li>histórico de interações;</li>
        <li>mensagens e chamadas quando houver base aplicável para revisão;</li>
        <li>presentes recebidos;</li>
        <li>denúncias relacionadas;</li>
        <li>indicadores de segurança;</li>
        <li>registros necessários para ganhos, revisão financeira, elegibilidade, payout e suporte.</li>
      </ul>

      <p>Dados de criadoras podem ser usados para operar a conta, exibir perfil, proteger autonomia e consentimento, revisar denúncias, prevenir fraude, cumprir regras e administrar funcionalidades da plataforma.</p>

      <h2>8. Dados de agências e representantes</h2>

      <p>Quando houver agência, representante ou vínculo operacional autorizado, podemos tratar dados como:</p>

      <ul>
        <li>dados cadastrais da agência;</li>
        <li>dados de representantes;</li>
        <li>dados de verificação da agência;</li>
        <li>documentos de pessoa jurídica ou identificação equivalente;</li>
        <li>dados de autorização;</li>
        <li>vínculo com criadoras;</li>
        <li>status do vínculo;</li>
        <li>histórico de convites;</li>
        <li>registros de atuação;</li>
        <li>dados de comissão, quando aplicável;</li>
        <li>denúncias e revisões relacionadas;</li>
        <li>informações necessárias para KYB, antifraude, suporte, auditoria, segurança e cumprimento de regras.</li>
      </ul>

      <p>Agências e representantes devem respeitar a privacidade, autonomia, segurança e dados das criadoras, usuários e demais pessoas envolvidas.</p>

      <h2>9. Dados de pagamento e pétalas</h2>

      <p>Podemos tratar dados necessários para compras, pétalas, pacotes, presentes, reembolsos, contestações, revisão financeira, segurança, antifraude e suporte.</p>

      <p>Esses dados podem incluir:</p>

      <ul>
        <li>pacote escolhido;</li>
        <li>quantidade de pétalas;</li>
        <li>valor da compra;</li>
        <li>moeda;</li>
        <li>método de pagamento;</li>
        <li>status do pagamento;</li>
        <li>identificadores de transação;</li>
        <li>identificadores de checkout;</li>
        <li>comprovantes ou referências de pagamento;</li>
        <li>histórico de compras;</li>
        <li>histórico de consumo de pétalas;</li>
        <li>bônus, promoções ou créditos gratuitos;</li>
        <li>reembolsos;</li>
        <li>contestações;</li>
        <li>chargebacks;</li>
        <li>revisões financeiras;</li>
        <li>bloqueios, reversões ou ajustes relacionados.</li>
      </ul>

      <p>Provedores de pagamento podem processar dados sensíveis de pagamento conforme seus próprios termos e políticas. A plataforma pode receber, tratar e armazenar informações necessárias para confirmar, conciliar, revisar, proteger e registrar transações.</p>

      <p>O Pétala/Bloom não precisa receber todos os dados completos do cartão para operar o checkout, mas pode receber dados técnicos, status, identificadores, últimos dígitos, bandeira, método, comprovantes, mensagens de erro ou informações necessárias para segurança, conciliação, suporte e cumprimento de obrigações aplicáveis.</p>

      <h2>10. Dados de uso da plataforma</h2>

      <p>Podemos coletar dados sobre como a plataforma é usada, incluindo:</p>

      <ul>
        <li>páginas acessadas;</li>
        <li>funcionalidades usadas;</li>
        <li>horários de acesso;</li>
        <li>cliques e interações;</li>
        <li>filtros e preferências;</li>
        <li>favoritos;</li>
        <li>visualizações;</li>
        <li>solicitações;</li>
        <li>status online ou offline;</li>
        <li>convites;</li>
        <li>respostas;</li>
        <li>notificações;</li>
        <li>histórico de navegação dentro da plataforma;</li>
        <li>eventos de segurança e operação.</li>
      </ul>

      <p>Esses dados ajudam a operar o produto, melhorar a experiência, proteger contas, identificar abuso, prevenir fraude, resolver problemas técnicos e cumprir regras da plataforma.</p>

      <h2>11. Dados técnicos, logs e segurança</h2>

      <p>Podemos tratar dados técnicos e registros de segurança, como:</p>

      <ul>
        <li>endereço IP;</li>
        <li>data e hora de acesso;</li>
        <li>identificadores de dispositivo;</li>
        <li>navegador;</li>
        <li>sistema operacional;</li>
        <li>tipo de dispositivo;</li>
        <li>idioma;</li>
        <li>localização aproximada;</li>
        <li>páginas e rotas acessadas;</li>
        <li>logs de erro;</li>
        <li>eventos de autenticação;</li>
        <li>tentativas de login;</li>
        <li>alterações de senha;</li>
        <li>tokens técnicos;</li>
        <li>registros de sessão;</li>
        <li>sinais de automação, abuso, fraude ou risco.</li>
      </ul>

      <p>Esses dados são usados para segurança, prevenção de fraude, diagnóstico, estabilidade, proteção da conta, auditoria, cumprimento de regras e defesa de direitos.</p>

      <h2>12. Mensagens, chamadas, presentes e conteúdos</h2>

      <p>Mensagens, chamadas, presentes e conteúdos podem envolver dados pessoais e informações privadas.</p>

      <p>Podemos tratar dados relacionados a:</p>

      <ul>
        <li>mensagens enviadas e recebidas;</li>
        <li>solicitações de conversa;</li>
        <li>chamadas iniciadas, aceitas, recusadas ou encerradas;</li>
        <li>duração de chamadas;</li>
        <li>presentes virtuais;</li>
        <li>conteúdos enviados;</li>
        <li>fotos e mídias;</li>
        <li>denúncias relacionadas;</li>
        <li>registros de consentimento e confirmação;</li>
        <li>eventos de segurança;</li>
        <li>histórico necessário para suporte, revisão, moderação e operação.</li>
      </ul>

      <p>Mensagens, chamadas, conteúdos e presentes podem ser tratados ou revisados quando houver denúncia, suspeita de violação, risco de segurança, fraude, menoridade, conteúdo proibido, contestação, suporte, obrigação legal, proteção da plataforma ou necessidade de aplicar os Termos.</p>

      <p>Essa revisão pode ser manual, automatizada ou combinada, conforme a situação e a funcionalidade.</p>

      <h2>13. Denúncias, moderação e segurança</h2>

      <p>Quando uma denúncia é feita ou quando há suspeita de violação, podemos tratar dados necessários para analisar o caso.</p>

      <p>Esses dados podem incluir:</p>

      <ul>
        <li>identificação da conta denunciante;</li>
        <li>identificação da conta denunciada;</li>
        <li>conteúdo denunciado;</li>
        <li>mensagens relacionadas;</li>
        <li>chamadas relacionadas;</li>
        <li>presentes relacionados;</li>
        <li>registros técnicos;</li>
        <li>histórico de moderação;</li>
        <li>evidências enviadas;</li>
        <li>decisões tomadas;</li>
        <li>medidas aplicadas;</li>
        <li>comunicações de suporte;</li>
        <li>registros de reincidência.</li>
      </ul>

      <p>Podemos preservar registros quando necessário para segurança, investigação, cumprimento de obrigações, proteção de pessoas, revisão financeira, defesa de direitos ou comunicação a autoridades e provedores quando aplicável.</p>

      <h2>14. Dados de suporte e comunicação</h2>

      <p>Quando você entra em contato com o suporte ou responde comunicações da plataforma, podemos tratar:</p>

      <ul>
        <li>nome;</li>
        <li>e-mail;</li>
        <li>telefone, quando informado;</li>
        <li>conteúdo da solicitação;</li>
        <li>anexos;</li>
        <li>comprovantes;</li>
        <li>prints enviados por você;</li>
        <li>histórico de atendimento;</li>
        <li>decisões de suporte;</li>
        <li>comunicações anteriores;</li>
        <li>dados necessários para resolver a solicitação.</li>
      </ul>

      <p>Também podemos enviar comunicações relacionadas a conta, segurança, verificação, pagamento, suporte, alterações de termos, notificações operacionais e informações relevantes sobre a plataforma.</p>

      <h2>15. Registros de aceite</h2>

      <p>Podemos registrar aceites de Termos, políticas, regras, avisos e checkboxes destacados.</p>

      <p>Esses registros podem incluir:</p>

      <ul>
        <li>usuário ou conta relacionada;</li>
        <li>tipo de conta;</li>
        <li>documento aceito;</li>
        <li>versão;</li>
        <li>data e hora;</li>
        <li>origem do aceite;</li>
        <li>fluxo em que o aceite ocorreu;</li>
        <li>texto ou referência exibida;</li>
        <li>hash ou identificador do texto aceito;</li>
        <li>checkboxes marcados;</li>
        <li>IP quando permitido;</li>
        <li>user agent quando disponível;</li>
        <li>idioma e localidade;</li>
        <li>metadados necessários para auditoria, segurança e prova de aceite.</li>
      </ul>

      <p>Esses registros ajudam a demonstrar quais regras foram exibidas e aceitas em determinado momento.</p>

      <h2>16. Cookies e tecnologias similares</h2>

      <p>Podemos usar cookies, armazenamento local, identificadores, pixels, SDKs e tecnologias similares para:</p>

      <ul>
        <li>manter sessão;</li>
        <li>lembrar preferências;</li>
        <li>proteger a conta;</li>
        <li>autenticar acessos;</li>
        <li>evitar fraude;</li>
        <li>entender uso da plataforma;</li>
        <li>melhorar desempenho;</li>
        <li>medir funcionamento;</li>
        <li>personalizar experiência;</li>
        <li>cumprir requisitos técnicos.</li>
      </ul>

      <p>Você pode configurar seu navegador para bloquear ou apagar cookies, mas algumas funcionalidades podem deixar de funcionar corretamente.</p>

      <h2>17. Finalidades do tratamento</h2>

      <p>Tratamos dados pessoais para finalidades como:</p>

      <ul>
        <li>criar e administrar contas;</li>
        <li>confirmar maioridade;</li>
        <li>verificar identidade;</li>
        <li>operar a plataforma;</li>
        <li>exibir perfis e conteúdos;</li>
        <li>permitir mensagens, chamadas, presentes e interações;</li>
        <li>processar compras e pétalas;</li>
        <li>confirmar pagamentos;</li>
        <li>prevenir fraude;</li>
        <li>proteger usuários, criadoras e agências;</li>
        <li>moderar conteúdo;</li>
        <li>analisar denúncias;</li>
        <li>prestar suporte;</li>
        <li>enviar comunicações;</li>
        <li>cumprir obrigações legais;</li>
        <li>proteger direitos;</li>
        <li>melhorar produto, segurança e experiência;</li>
        <li>realizar auditoria, conciliação, investigação e revisão interna quando necessário.</li>
      </ul>

      <h2>18. Bases legais</h2>

      <p>O tratamento de dados pode ocorrer com base em diferentes fundamentos permitidos pela lei aplicável, conforme o contexto.</p>

      <p>Esses fundamentos podem incluir:</p>

      <ul>
        <li>execução de contrato ou procedimentos relacionados;</li>
        <li>cumprimento de obrigação legal ou regulatória;</li>
        <li>exercício regular de direitos;</li>
        <li>proteção da vida ou da segurança;</li>
        <li>legítimo interesse;</li>
        <li>prevenção à fraude;</li>
        <li>segurança da plataforma;</li>
        <li>consentimento quando exigido;</li>
        <li>proteção ao crédito quando aplicável;</li>
        <li>outras hipóteses permitidas por lei.</li>
      </ul>

      <p>Quando o tratamento depender de consentimento, você poderá ter direitos relacionados à revisão ou revogação, observados os limites legais e a necessidade de manter determinados registros.</p>

      <h2>19. Dados sensíveis</h2>

      <p>Em algumas situações, podemos tratar dados que exigem proteção adicional, como imagem facial, dados de verificação, prova de vida, dados relacionados a denúncia, segurança, moderação ou informações necessárias para confirmar identidade, maioridade e proteção das pessoas envolvidas.</p>

      <p>O tratamento desses dados busca respeitar a finalidade informada, a necessidade, a segurança e os direitos aplicáveis.</p>

      <p>Não solicitamos dados sensíveis desnecessários para o uso da plataforma. Quando uma funcionalidade exigir verificação ou revisão, serão tratados os dados necessários para aquela finalidade.</p>

      <h2>20. Compartilhamento de dados</h2>

      <p>Podemos compartilhar dados pessoais com terceiros quando necessário para operar, proteger ou melhorar a plataforma, cumprir obrigações ou exercer direitos.</p>

      <p>O compartilhamento pode ocorrer com:</p>

      <ul>
        <li>provedores de hospedagem;</li>
        <li>provedores de banco de dados;</li>
        <li>provedores de autenticação;</li>
        <li>provedores de pagamento;</li>
        <li>provedores de verificação de identidade;</li>
        <li>provedores antifraude;</li>
        <li>ferramentas de suporte;</li>
        <li>ferramentas de comunicação;</li>
        <li>ferramentas de segurança;</li>
        <li>prestadores técnicos;</li>
        <li>consultores, auditores e assessores;</li>
        <li>autoridades, quando aplicável;</li>
        <li>parceiros necessários para execução de funcionalidades.</li>
      </ul>

      <p>Compartilhamos apenas dados necessários para a finalidade aplicável, observando medidas de segurança e obrigações contratuais quando cabíveis.</p>

      <h2>21. Provedores de pagamento</h2>

      <p>Compras, pagamentos, reembolsos, contestações e chargebacks podem envolver provedores de pagamento.</p>

      <p>Esses provedores podem coletar e processar dados de pagamento diretamente, conforme suas próprias políticas e requisitos de segurança.</p>

      <p>A plataforma pode receber dados necessários para:</p>

      <ul>
        <li>criar checkout;</li>
        <li>confirmar pagamento;</li>
        <li>conciliar transações;</li>
        <li>atualizar histórico;</li>
        <li>analisar suporte;</li>
        <li>prevenir fraude;</li>
        <li>revisar contestação;</li>
        <li>processar reembolso;</li>
        <li>cumprir obrigações;</li>
        <li>proteger contas e funcionalidades.</li>
      </ul>

      <p>Não compartilhe dados de pagamento fora dos canais oficiais da plataforma.</p>

      <h2>22. Verificação de identidade e antifraude</h2>

      <p>Podemos usar provedores e processos de verificação de identidade, KYB, KYC e antifraude para confirmar maioridade, identidade, vínculo, segurança e elegibilidade.</p>

      <p>Isso pode envolver análise de documento, selfie, prova de vida, comparação facial, status de verificação, dados cadastrais, sinais técnicos, dados de dispositivo, registros de pagamento, histórico de conta e informações necessárias para prevenir fraude.</p>

      <p>Quando uma verificação não for concluída ou indicar risco, a plataforma poderá limitar funcionalidades, solicitar nova verificação, bloquear conta, revisar dados ou adotar medidas cabíveis.</p>

      <h2>23. Transferência internacional</h2>

      <p>Alguns dados podem ser tratados, armazenados ou acessados por provedores localizados em outros países.</p>

      <p>Quando houver transferência internacional, buscamos adotar medidas compatíveis com a lei aplicável e com a proteção adequada dos dados, considerando a natureza do serviço, o provedor, a finalidade e os requisitos de segurança.</p>

      <h2>24. Retenção de dados</h2>

      <p>Mantemos dados pessoais pelo tempo necessário para cumprir as finalidades desta Política, operar a plataforma, cumprir obrigações legais, proteger direitos, prevenir fraude, resolver disputas, revisar denúncias, tratar suporte, preservar segurança e manter registros necessários.</p>

      <p>O período de retenção pode variar conforme:</p>

      <ul>
        <li>tipo de dado;</li>
        <li>tipo de conta;</li>
        <li>exigência legal;</li>
        <li>status da conta;</li>
        <li>histórico de pagamento;</li>
        <li>denúncia;</li>
        <li>moderação;</li>
        <li>contestação;</li>
        <li>chargeback;</li>
        <li>risco de fraude;</li>
        <li>necessidade de auditoria;</li>
        <li>defesa de direitos;</li>
        <li>obrigação contratual;</li>
        <li>consentimento aplicável.</li>
      </ul>

      <p>Alguns dados podem ser anonimizados, bloqueados, eliminados ou mantidos de forma restrita quando não forem mais necessários para finalidades ativas.</p>

      <h2>25. Segurança dos dados</h2>

      <p>Adotamos medidas técnicas, administrativas e organizacionais para proteger dados pessoais contra acesso não autorizado, perda, alteração, divulgação indevida, uso indevido e outros riscos.</p>

      <p>Essas medidas podem incluir controles de acesso, autenticação, logs, restrições internas, criptografia quando aplicável, segregação de permissões, monitoramento, revisão de segurança e procedimentos operacionais.</p>

      <p>Nenhuma plataforma digital consegue prometer segurança absoluta. Por isso, também é importante que você proteja sua conta, use senha forte, não compartilhe acesso e comunique qualquer suspeita de uso indevido.</p>

      <h2>26. Direitos do titular</h2>

      <p>Você pode ter direitos sobre seus dados pessoais, conforme a lei aplicável.</p>

      <p>Esses direitos podem incluir:</p>

      <ul>
        <li>confirmação de tratamento;</li>
        <li>acesso aos dados;</li>
        <li>correção de dados incompletos, inexatos ou desatualizados;</li>
        <li>anonimização, bloqueio ou eliminação quando aplicável;</li>
        <li>portabilidade quando aplicável;</li>
        <li>informação sobre compartilhamento;</li>
        <li>revisão ou revogação de consentimento quando aplicável;</li>
        <li>oposição quando cabível;</li>
        <li>petição à autoridade competente quando aplicável.</li>
      </ul>

      <p>O exercício desses direitos pode depender de confirmação de identidade e análise do pedido.</p>

      <h2>27. Como exercer direitos</h2>

      <p>Para exercer direitos de privacidade, use os canais oficiais de contato de privacidade disponibilizados pela plataforma.</p>

      <p>Podemos solicitar informações adicionais para confirmar sua identidade, proteger sua conta e evitar que terceiros acessem ou alterem dados indevidamente.</p>

      <p>Alguns pedidos podem não ser atendidos integralmente quando houver necessidade de manter dados por lei, contrato, segurança, prevenção de fraude, defesa de direitos, auditoria, denúncia, chargeback, registros financeiros, moderação, proteção de terceiros ou outras hipóteses permitidas.</p>

      <p>Quando não for possível atender integralmente um pedido, poderemos explicar o motivo de forma compatível com segurança, privacidade, segredo comercial, prevenção de fraude e regras aplicáveis.</p>

      <h2>28. Comunicações</h2>

      <p>Podemos enviar comunicações relacionadas a:</p>

      <ul>
        <li>criação de conta;</li>
        <li>login;</li>
        <li>verificação;</li>
        <li>segurança;</li>
        <li>alterações de senha;</li>
        <li>compras;</li>
        <li>pagamentos;</li>
        <li>pétalas;</li>
        <li>suporte;</li>
        <li>denúncias;</li>
        <li>moderação;</li>
        <li>alterações de Termos;</li>
        <li>mudanças relevantes da plataforma;</li>
        <li>avisos operacionais;</li>
        <li>funcionalidades e preferências.</li>
      </ul>

      <p>Você pode ajustar preferências de comunicação quando a plataforma oferecer essa opção, sem prejuízo de mensagens essenciais para segurança, conta, pagamento, suporte ou obrigações aplicáveis.</p>

      <h2>29. Dados de terceiros</h2>

      <p>Você não deve enviar, publicar ou compartilhar dados pessoais de terceiros sem autorização ou base legítima.</p>

      <p>É proibido usar a plataforma para expor documentos, imagens, dados bancários, telefone, endereço, redes sociais, localização, conteúdo privado ou qualquer informação de outra pessoa de forma indevida.</p>

      <p>Se você enviar dados de terceiros em uma denúncia, suporte ou solicitação, use apenas o necessário para explicar o caso e proteger as pessoas envolvidas.</p>

      <h2>30. Privacidade de criadoras</h2>

      <p>Criadoras têm direito à privacidade, segurança, autonomia e respeito aos seus limites.</p>

      <p>É proibido expor, capturar, gravar, retransmitir, vender, compartilhar ou usar dados, imagem, perfil, conteúdo, mensagem ou chamada de criadora sem autorização.</p>

      <p>Também é proibido tentar localizar, perseguir, identificar dados pessoais, pressionar por contato externo ou divulgar informações privadas de criadoras.</p>

      <p>A plataforma pode revisar e restringir condutas que coloquem a privacidade ou segurança de criadoras em risco.</p>

      <h2>31. Privacidade de usuários</h2>

      <p>Usuários também têm direito à privacidade e proteção de dados.</p>

      <p>Criadoras, agências, representantes e terceiros não devem expor, vender, compartilhar, capturar ou usar dados de usuários fora das finalidades permitidas pela plataforma.</p>

      <p>Informações de pagamento, identidade, mensagens, presentes, chamadas, preferências e interações devem ser tratadas com cuidado e conforme as regras aplicáveis.</p>

      <h2>32. Privacidade de agências e representantes</h2>

      <p>Agências e representantes podem ter dados tratados para cadastro, verificação, autorização, vínculo, suporte, comissão, revisão, segurança, KYB, auditoria e cumprimento de regras.</p>

      <p>Representantes devem usar apenas dados necessários para atuação autorizada e não podem expor, vender, reter, controlar ou usar dados de criadoras e usuários de forma abusiva.</p>

      <h2>33. Incidentes de segurança</h2>

      <p>Se houver incidente de segurança envolvendo dados pessoais, a plataforma poderá investigar, conter, corrigir, registrar e comunicar o evento quando aplicável.</p>

      <p>As medidas podem variar conforme natureza do incidente, risco, dados envolvidos, pessoas afetadas, obrigações legais e recomendações de segurança.</p>

      <p>Usuários, criadoras, agências e representantes devem comunicar imediatamente qualquer suspeita de acesso indevido, vazamento, fraude, uso de conta por terceiro ou exposição de dados.</p>

      <h2>34. Alterações desta Política</h2>

      <p>O Pétala/Bloom pode atualizar esta Política para refletir mudanças de produto, tecnologia, segurança, operação, legislação, decisão judicial, exigência de parceiros ou melhoria de clareza.</p>

      <p>Quando uma alteração relevante exigir novo aceite, a plataforma poderá solicitar que você leia e aceite a versão atualizada para continuar usando determinadas funcionalidades.</p>

      <p>O uso da plataforma após atualização pode depender da aceitação da Política vigente.</p>

      <h2>35. Relação com outros termos</h2>

      <p>Esta Política se aplica em conjunto com:</p>

      <ul>
        <li>Termos de Uso do Usuário;</li>
        <li>Termos da Criadora;</li>
        <li>Termos da Agência;</li>
        <li>Política de Conteúdo e Segurança 18+;</li>
        <li>Política de Pétalas, Reembolso e Contestação;</li>
        <li>Política de Denúncias;</li>
        <li>avisos exibidos na plataforma;</li>
        <li>regras específicas de funcionalidades;</li>
        <li>aceites destacados aplicáveis.</li>
      </ul>

      <p>Em caso de conflito entre documentos, a interpretação será feita conforme o contexto, a regra mais específica, os direitos legais aplicáveis e a finalidade de proteger pessoas, privacidade, segurança, consentimento e integridade da plataforma.</p>

      <h2>36. Contato de privacidade</h2>

      <p>Para dúvidas, solicitações ou exercício de direitos relacionados à privacidade, use os canais oficiais de contato de privacidade disponibilizados pela plataforma.</p>

      <p>Não envie documentos, senhas, códigos, dados bancários completos ou informações sensíveis por canais não oficiais.</p>

      <h2>37. Disposições finais</h2>

      <p>Esta Política deve ser interpretada de forma compatível com boa-fé, transparência, segurança, privacidade, direitos legais aplicáveis e proteção de usuários, criadoras, agências, representantes, terceiros e da plataforma.</p>

      <p>Se qualquer parte desta Política for considerada inválida ou inaplicável, as demais disposições continuarão válidas na maior extensão permitida pela lei.</p>

      <p>A eventual tolerância da plataforma em relação a uma violação não significa renúncia de direitos.</p>

      <p>Ao usar o Pétala/Bloom, você reconhece que seus dados podem ser tratados conforme esta Política, os Termos aplicáveis e as regras exibidas na plataforma.</p>
    </LegalPageLayout>
  )
}
