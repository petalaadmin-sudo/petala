import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { PUBLIC_LEGAL_DOCUMENTS } from '@/lib/legal/public-documents'

const document = PUBLIC_LEGAL_DOCUMENTS['termos-agencia']

export default function LegalDocumentPage() {
  return (
    <LegalPageLayout
      title={document.title}
      description={document.description}
      version={document.version}
    >
      <p>Bem-vindo ao Pétala/Bloom.</p>

      <p>Estes Termos da Agência explicam as regras para cadastro, verificação, atuação, relacionamento com criadoras, comissões elegíveis, pagamentos, segurança, denúncias e uso da plataforma por agências, agentes, representantes e parceiros operacionais.</p>

      <p>Ao cadastrar uma agência, aceitar convite, acessar a área da agência ou usar funcionalidades relacionadas, você declara que leu, entendeu e aceita estes Termos e as políticas aplicáveis.</p>

      <h2>1. Plataforma 18+</h2>

      <p>O Pétala/Bloom é uma plataforma destinada exclusivamente a pessoas com 18 anos ou mais.</p>

      <p>A agência, seus representantes, agentes, colaboradores e pessoas indicadas devem respeitar essa regra.</p>

      <p>É proibido:</p>

      <ul>
        <li>cadastrar menor de 18 anos;</li>
        <li>ocultar menoridade;</li>
        <li>usar documento falso;</li>
        <li>usar documento de terceiro;</li>
        <li>permitir que menor apareça em conteúdo, chamada, mensagem, perfil ou interação;</li>
        <li>orientar qualquer pessoa a burlar verificação de idade ou identidade.</li>
      </ul>

      <p>Qualquer suspeita de menoridade, documento falso ou identidade de terceiro poderá gerar revisão, bloqueio, encerramento de vínculo, perda de elegibilidade e medidas cabíveis.</p>

      <h2>2. Papel da agência</h2>

      <p>A agência atua como parceira operacional da plataforma, quando aceita e autorizada.</p>

      <p>A agência pode apoiar atividades como:</p>

      <ul>
        <li>indicação de criadoras;</li>
        <li>apoio ao cadastro;</li>
        <li>suporte operacional;</li>
        <li>orientação sobre uso da plataforma;</li>
        <li>acompanhamento de vínculo;</li>
        <li>comunicação com a plataforma;</li>
        <li>recebimento de comissão elegível quando aplicável.</li>
      </ul>

      <p>A agência não é dona da criadora, não controla a criadora e não pode substituir a vontade da criadora.</p>

      <p>A criadora mantém autonomia sobre sua participação, seus limites, seus documentos, sua conta, seu acesso, seu Pix, sua conta bancária, sua presença online, suas respostas, suas chamadas e seu conteúdo.</p>

      <h2>3. Cadastro e verificação da agência</h2>

      <p>Para atuar como agência, podem ser solicitadas informações de cadastro, identificação, representação, dados de contato, documentos, informações fiscais, dados de pagamento e outros dados necessários para segurança, verificação, suporte, prevenção de fraude e cumprimento das regras aplicáveis.</p>

      <p>A agência deve fornecer informações verdadeiras, atuais e verificáveis.</p>

      <p>É proibido:</p>

      <ul>
        <li>usar informação falsa;</li>
        <li>ocultar representante real;</li>
        <li>esconder vínculo real;</li>
        <li>usar empresa, documento ou conta de terceiro sem autorização válida;</li>
        <li>manipular informações cadastrais;</li>
        <li>criar perfil falso;</li>
        <li>fraudar indicação;</li>
        <li>burlar verificações;</li>
        <li>operar de forma incompatível com estes Termos.</li>
      </ul>

      <p>A plataforma pode recusar, suspender ou encerrar cadastro de agência quando houver inconsistência, risco, fraude, violação de regras, denúncia ou necessidade de revisão.</p>

      <h2>4. Relação com criadoras</h2>

      <p>A relação entre agência e criadora deve ser transparente, voluntária, respeitosa e compatível com estes Termos.</p>

      <p>A agência deve garantir que a criadora:</p>

      <ul>
        <li>tenha 18 anos ou mais;</li>
        <li>participe voluntariamente;</li>
        <li>entenda as regras aplicáveis;</li>
        <li>mantenha controle sobre sua conta;</li>
        <li>mantenha controle sobre seus documentos;</li>
        <li>mantenha controle sobre sua senha;</li>
        <li>mantenha controle sobre seu celular;</li>
        <li>mantenha controle sobre seu Pix;</li>
        <li>mantenha controle sobre sua conta bancária;</li>
        <li>possa denunciar abusos;</li>
        <li>possa encerrar ou revisar o vínculo quando aplicável.</li>
      </ul>

      <p>A agência não pode impedir a criadora de acessar suporte, denunciar abuso, sair de uma relação indevida ou definir seus limites.</p>

      <h2>5. Autonomia da criadora</h2>

      <p>A criadora mantém autonomia.</p>

      <p>A agência, seus agentes ou representantes não podem:</p>

      <ul>
        <li>coagir;</li>
        <li>ameaçar;</li>
        <li>chantagear;</li>
        <li>explorar;</li>
        <li>aliciar;</li>
        <li>traficar pessoas;</li>
        <li>obrigar conteúdo adulto;</li>
        <li>pressionar por conteúdo adulto;</li>
        <li>obrigar chamada;</li>
        <li>obrigar resposta a usuário;</li>
        <li>obrigar presença online;</li>
        <li>obrigar produção de conteúdo;</li>
        <li>impedir denúncia;</li>
        <li>impedir saída;</li>
        <li>controlar a conta da criadora sem autorização válida;</li>
        <li>controlar a vida financeira da criadora;</li>
        <li>reter documentos;</li>
        <li>reter senha;</li>
        <li>controlar celular;</li>
        <li>controlar Pix;</li>
        <li>controlar conta bancária.</li>
      </ul>

      <p>Qualquer conduta de controle abusivo, exploração, coação ou ameaça poderá gerar medidas contra a agência, seus representantes e contas relacionadas.</p>

      <h2>6. Atuação permitida</h2>

      <p>A agência pode atuar, quando autorizada, em atividades operacionais compatíveis com a plataforma.</p>

      <p>Exemplos de atuação permitida:</p>

      <ul>
        <li>apresentar a plataforma a potenciais criadoras maiores de 18 anos;</li>
        <li>orientar sobre cadastro;</li>
        <li>apoiar uso básico da área da criadora;</li>
        <li>explicar regras de segurança;</li>
        <li>apoiar organização operacional;</li>
        <li>orientar sobre denúncia e suporte;</li>
        <li>acompanhar status de vínculo;</li>
        <li>receber comissão elegível quando aplicável.</li>
      </ul>

      <p>A atuação da agência deve sempre respeitar a autonomia da criadora, os limites da plataforma, a lei aplicável e estes Termos.</p>

      <h2>7. Proibições absolutas</h2>

      <p>Agência, agente, representante, colaborador ou terceiro relacionado não pode:</p>

      <ul>
        <li>cadastrar menor;</li>
        <li>ocultar menoridade;</li>
        <li>usar documento falso;</li>
        <li>usar documento de terceiro;</li>
        <li>coagir;</li>
        <li>ameaçar;</li>
        <li>chantagear;</li>
        <li>explorar;</li>
        <li>aliciar;</li>
        <li>traficar pessoas;</li>
        <li>obrigar conteúdo adulto;</li>
        <li>pressionar por conteúdo adulto;</li>
        <li>obrigar chamada;</li>
        <li>obrigar resposta a usuário;</li>
        <li>reter documentos;</li>
        <li>reter senha;</li>
        <li>controlar celular;</li>
        <li>controlar Pix;</li>
        <li>controlar conta bancária;</li>
        <li>impedir denúncia;</li>
        <li>impedir saída;</li>
        <li>operar conta de criadora sem autorização válida;</li>
        <li>prometer ganhos falsos;</li>
        <li>manipular informações;</li>
        <li>fraudar indicação;</li>
        <li>criar perfil falso;</li>
        <li>esconder vínculo real;</li>
        <li>combinar pagamento por fora;</li>
        <li>solicitar Pix direto;</li>
        <li>negociar encontro presencial;</li>
        <li>negociar serviço presencial de natureza sexual;</li>
        <li>orientar burla de pagamento, verificação, moderação ou segurança;</li>
        <li>burlar regras de conteúdo;</li>
        <li>burlar regras de pagamento;</li>
        <li>burlar regras de comissão;</li>
        <li>usar a plataforma para exploração, fraude ou abuso.</li>
      </ul>

      <p>Violações podem gerar bloqueio, encerramento de vínculo, perda de comissão elegível, banimento, revisão financeira e medidas cabíveis.</p>

      <h2>8. Conteúdo, chamadas e limites</h2>

      <p>A agência deve respeitar os limites da criadora e as regras da plataforma sobre conteúdo, mensagens, chamadas e interações.</p>

      <p>A agência não pode obrigar a criadora a:</p>

      <ul>
        <li>produzir conteúdo adulto;</li>
        <li>aceitar chamadas;</li>
        <li>responder usuários;</li>
        <li>permanecer online;</li>
        <li>publicar fotos;</li>
        <li>enviar mensagens;</li>
        <li>aceitar presentes;</li>
        <li>manter interação;</li>
        <li>ultrapassar seus limites.</li>
      </ul>

      <p>Também é proibido orientar ou incentivar conteúdo envolvendo menores, terceiros não verificados, conteúdo não consensual, ameaça, coerção, exploração, pagamento por fora, contato externo proibido, encontro presencial ou serviço presencial de natureza sexual.</p>

      <h2>9. Comissão e ganhos elegíveis da agência</h2>

      <p>A agência pode ter direito a comissão elegível quando houver vínculo válido, regras aplicáveis e funcionalidade disponível.</p>

      <p>Comissão elegível depende de critérios como:</p>

      <ul>
        <li>vínculo válido com a criadora;</li>
        <li>verificação da agência;</li>
        <li>verificação da criadora;</li>
        <li>contrato ou regra aplicável;</li>
        <li>atividade dentro da plataforma;</li>
        <li>fechamento do período;</li>
        <li>revisão financeira;</li>
        <li>método de pagamento;</li>
        <li>antifraude;</li>
        <li>contestação de pagamento;</li>
        <li>chargeback;</li>
        <li>denúncias;</li>
        <li>bloqueios;</li>
        <li>ausência de violação de regras;</li>
        <li>disponibilidade operacional.</li>
      </ul>

      <p>Comissão não é garantida, não é pagamento imediato, não é saque automático e não é promessa de resultado.</p>

      <p>A plataforma pode exibir informações específicas sobre comissões, períodos, elegibilidade, métodos de pagamento e valores quando a funcionalidade estiver disponível.</p>

      <h2>10. Valores que não geram comissão</h2>

      <p>Não geram comissão, salvo regra expressa em sentido diferente:</p>

      <ul>
        <li>bônus;</li>
        <li>promoções;</li>
        <li>créditos gratuitos;</li>
        <li>testes;</li>
        <li>cortesias;</li>
        <li>pagamentos não confirmados;</li>
        <li>pagamentos contestados;</li>
        <li>chargebacks;</li>
        <li>fraude;</li>
        <li>valores bloqueados;</li>
        <li>valores revertidos;</li>
        <li>valores cancelados;</li>
        <li>valores inelegíveis;</li>
        <li>interações denunciadas;</li>
        <li>interações que violem regras;</li>
        <li>vínculo irregular;</li>
        <li>operação fora da plataforma;</li>
        <li>pagamentos por fora;</li>
        <li>conteúdo proibido;</li>
        <li>chamadas ou interações sem consentimento;</li>
        <li>atividade associada a menoridade, documento falso, exploração ou coação.</li>
      </ul>

      <p>A agência não deve prometer a si mesma, a representantes ou a criadoras qualquer comissão garantida sobre valores inelegíveis.</p>

      <h2>11. Payout e pagamento da agência</h2>

      <p>Pagamentos à agência, quando disponíveis, dependem de requisitos aplicáveis.</p>

      <p>Podem ser exigidos:</p>

      <ul>
        <li>cadastro aprovado;</li>
        <li>verificação da agência;</li>
        <li>dados de pagamento válidos;</li>
        <li>titularidade compatível;</li>
        <li>informações fiscais quando aplicável;</li>
        <li>vínculo válido;</li>
        <li>valor mínimo;</li>
        <li>fechamento de período;</li>
        <li>aprovação de revisão financeira;</li>
        <li>ausência de bloqueios relevantes;</li>
        <li>ausência de fraude;</li>
        <li>ausência de denúncia impeditiva;</li>
        <li>regras de método de pagamento;</li>
        <li>regras de câmbio quando aplicável.</li>
      </ul>

      <p>O pagamento pode ser adiado, revisado, bloqueado, revertido ou cancelado quando houver suspeita de fraude, chargeback, contestação, violação de regras, denúncia, erro operacional, exigência legal ou necessidade de segurança.</p>

      <p>A plataforma não garante pagamento imediato, saque automático, comissão garantida ou disponibilidade contínua de todos os métodos de pagamento.</p>

      <h2>12. Chargeback, contestação e revisão financeira</h2>

      <p>Compras, presentes, chamadas, mensagens, conteúdos, interações ou vínculos podem ser impactados por contestação de pagamento, chargeback, fraude, erro operacional, denúncia ou revisão financeira.</p>

      <p>Nesses casos, a plataforma poderá revisar:</p>

      <ul>
        <li>vínculo entre agência e criadora;</li>
        <li>status da interação;</li>
        <li>origem dos valores;</li>
        <li>elegibilidade de comissão;</li>
        <li>histórico relacionado;</li>
        <li>denúncias;</li>
        <li>informações de segurança;</li>
        <li>dados de pagamento quando aplicável;</li>
        <li>conduta da agência, representantes e contas relacionadas.</li>
      </ul>

      <p>Durante a revisão, comissões ou pagamentos podem ficar pendentes, bloqueados, revertidos, cancelados ou ajustados conforme as regras aplicáveis.</p>

      <p>Contestação abusiva, fraude, manipulação, pagamento por fora ou violação de regras podem afetar a agência, seus representantes, a criadora, usuários ou terceiros envolvidos.</p>

      <h2>13. Pagamento por fora</h2>

      <p>É proibido usar a plataforma para combinar pagamento por fora ou burlar regras de pagamento, comissão, segurança, moderação ou proteção das partes.</p>

      <p>Também é proibido:</p>

      <ul>
        <li>pedir Pix direto;</li>
        <li>receber Pix direto para burlar a plataforma;</li>
        <li>orientar criadora a receber por fora;</li>
        <li>orientar usuário a pagar por fora;</li>
        <li>negociar conteúdo fora da plataforma;</li>
        <li>negociar chamada fora da plataforma;</li>
        <li>negociar presente fora da plataforma;</li>
        <li>usar contato externo para evitar cobrança, moderação ou segurança;</li>
        <li>prometer benefícios fora da plataforma em troca de pagamento externo.</li>
      </ul>

      <p>Essas condutas podem gerar bloqueio, banimento, revisão financeira, perda de elegibilidade, encerramento de vínculo e outras medidas cabíveis.</p>

      <h2>14. Encontro presencial e serviço presencial proibido</h2>

      <p>O Pétala/Bloom não é uma plataforma de encontros presenciais.</p>

      <p>É proibido usar a plataforma para:</p>

      <ul>
        <li>combinar encontro presencial;</li>
        <li>solicitar encontro presencial;</li>
        <li>oferecer encontro presencial;</li>
        <li>negociar encontro presencial;</li>
        <li>intermediar encontro presencial;</li>
        <li>solicitar serviço presencial de natureza sexual;</li>
        <li>oferecer serviço presencial de natureza sexual;</li>
        <li>intermediar serviço presencial de natureza sexual;</li>
        <li>orientar criadora ou usuário a realizar qualquer serviço presencial.</li>
      </ul>

      <p>Qualquer tentativa de usar a plataforma para esse fim pode resultar em bloqueio, banimento, revisão financeira, perda de elegibilidade e medidas cabíveis.</p>

      <h2>15. Denúncias</h2>

      <p>Agências, criadoras, usuários, representantes ou terceiros podem denunciar situações que violem estes Termos.</p>

      <p>Denúncias podem envolver, por exemplo:</p>

      <ul>
        <li>menoridade;</li>
        <li>documento falso;</li>
        <li>coação;</li>
        <li>ameaça;</li>
        <li>chantagem;</li>
        <li>exploração;</li>
        <li>aliciamento;</li>
        <li>controle abusivo;</li>
        <li>retenção de documentos;</li>
        <li>retenção de senha;</li>
        <li>controle de celular;</li>
        <li>controle de Pix;</li>
        <li>controle de conta bancária;</li>
        <li>pagamento por fora;</li>
        <li>tentativa de encontro presencial;</li>
        <li>serviço presencial de natureza sexual;</li>
        <li>fraude;</li>
        <li>violação de privacidade;</li>
        <li>manipulação de vínculo;</li>
        <li>promessa falsa de ganhos.</li>
      </ul>

      <p>Ao receber denúncia, a plataforma poderá revisar informações relacionadas e tomar medidas conforme a gravidade, as evidências disponíveis, os Termos e a lei aplicável.</p>

      <p>Denúncias falsas, abusivas ou feitas de má-fé também podem gerar medidas contra quem as realizar.</p>

      <h2>16. Moderação, bloqueio e banimento</h2>

      <p>A plataforma pode moderar, restringir, suspender, bloquear ou encerrar contas, vínculos, funcionalidades, comissões, pagamentos, acessos ou operações quando houver violação destes Termos, risco de segurança, fraude, denúncia, contestação, exigência legal ou necessidade de proteção da plataforma e das pessoas envolvidas.</p>

      <p>Medidas podem incluir:</p>

      <ul>
        <li>aviso;</li>
        <li>restrição de funcionalidades;</li>
        <li>bloqueio temporário;</li>
        <li>suspensão de conta;</li>
        <li>encerramento de vínculo;</li>
        <li>perda de elegibilidade;</li>
        <li>bloqueio de comissão;</li>
        <li>reversão de valores;</li>
        <li>cancelamento de benefícios;</li>
        <li>banimento;</li>
        <li>comunicação a provedores ou autoridades quando aplicável.</li>
      </ul>

      <p>A aplicação de medidas pode considerar gravidade, reincidência, risco, evidências, impacto, urgência e obrigações legais.</p>

      <h2>17. Privacidade e confidencialidade</h2>

      <p>A agência deve proteger dados pessoais, documentos, contatos, informações de criadoras, informações de usuários, informações comerciais, regras de operação, dados de pagamento e qualquer informação confidencial obtida em razão da relação com a plataforma.</p>

      <p>É proibido:</p>

      <ul>
        <li>expor dados pessoais;</li>
        <li>compartilhar documentos sem autorização;</li>
        <li>divulgar dados de criadoras;</li>
        <li>divulgar dados de usuários;</li>
        <li>vender dados;</li>
        <li>usar informações para finalidade externa;</li>
        <li>reter documentos indevidamente;</li>
        <li>usar dados para coação, ameaça ou exploração;</li>
        <li>compartilhar acesso sem autorização;</li>
        <li>divulgar informações internas ou confidenciais.</li>
      </ul>

      <p>O tratamento de dados pessoais ocorre conforme a Política de Privacidade aplicável.</p>

      <h2>18. Segurança da conta e dos acessos</h2>

      <p>A agência é responsável por proteger sua conta e seus acessos.</p>

      <p>A agência não deve:</p>

      <ul>
        <li>compartilhar senha;</li>
        <li>permitir acesso não autorizado;</li>
        <li>usar conta de outra agência;</li>
        <li>permitir que representante não autorizado atue;</li>
        <li>ignorar alertas de segurança;</li>
        <li>burlar controles de acesso;</li>
        <li>acessar conta de criadora sem autorização válida;</li>
        <li>operar conta de criadora de forma abusiva;</li>
        <li>armazenar senhas de criadoras;</li>
        <li>controlar indevidamente celular, Pix, conta bancária ou documentos.</li>
      </ul>

      <p>Se houver suspeita de acesso indevido, fraude, controle abusivo ou risco, a agência deve procurar o suporte.</p>

      <h2>19. Responsabilidade por representantes</h2>

      <p>A agência é responsável pela atuação de seus representantes, agentes, colaboradores, operadores, prepostos e terceiros envolvidos na sua operação.</p>

      <p>A agência deve orientar essas pessoas a cumprir estes Termos, as políticas aplicáveis e as regras da plataforma.</p>

      <p>Violações cometidas por representantes podem gerar medidas contra a agência, inclusive bloqueio, perda de elegibilidade, encerramento de vínculo, reversão de comissões e banimento.</p>

      <p>A agência não pode alegar desconhecimento quando a violação decorrer de pessoa que atua em seu nome, sob sua orientação ou em benefício da sua operação.</p>

      <h2>20. Limitação de responsabilidade</h2>

      <p>Dentro dos limites permitidos pela lei, o Pétala/Bloom não será responsável por:</p>

      <ul>
        <li>uso indevido da plataforma por agências, representantes, criadoras, usuários ou terceiros;</li>
        <li>violação destes Termos por terceiros;</li>
        <li>informações falsas fornecidas por agência, representante, criadora ou usuário;</li>
        <li>indisponibilidades temporárias;</li>
        <li>falhas de conexão, dispositivo, navegador ou serviço externo;</li>
        <li>perda decorrente de compartilhamento de senha;</li>
        <li>contato externo feito fora da plataforma;</li>
        <li>pagamentos por fora;</li>
        <li>promessas feitas pela agência sem autorização da plataforma;</li>
        <li>gravações, vazamentos ou compartilhamentos não autorizados feitos por terceiros;</li>
        <li>expectativas de comissão, ganho, payout, resposta, conteúdo, chamada ou resultado específico.</li>
      </ul>

      <p>Nada nestes Termos afasta direitos obrigatórios previstos em lei.</p>

      <h2>21. Indenização</h2>

      <p>A agência poderá ser responsabilizada por danos, perdas, custos, despesas, reclamações, disputas, chargebacks, multas, condenações ou prejuízos causados ao Pétala/Bloom, a criadoras, a usuários, a terceiros ou a parceiros quando decorrerem de:</p>

      <ul>
        <li>fraude;</li>
        <li>violação destes Termos;</li>
        <li>documento falso;</li>
        <li>identidade de terceiro;</li>
        <li>cadastro de menor;</li>
        <li>ocultação de menoridade;</li>
        <li>coação;</li>
        <li>ameaça;</li>
        <li>chantagem;</li>
        <li>exploração;</li>
        <li>aliciamento;</li>
        <li>tráfico de pessoas;</li>
        <li>retenção de documentos;</li>
        <li>retenção de senha;</li>
        <li>controle abusivo;</li>
        <li>pagamento por fora;</li>
        <li>contato externo proibido;</li>
        <li>encontro presencial;</li>
        <li>serviço presencial de natureza sexual;</li>
        <li>promessa falsa de ganhos;</li>
        <li>fraude de indicação;</li>
        <li>criação de perfil falso;</li>
        <li>manipulação de informações;</li>
        <li>vazamento de dados;</li>
        <li>violação de privacidade;</li>
        <li>violação de direitos de terceiros;</li>
        <li>tentativa de burlar segurança, moderação, verificação ou pagamento;</li>
        <li>conduta proibida de representantes ou terceiros relacionados.</li>
      </ul>

      <p>Essa responsabilidade será aplicada conforme a lei e os procedimentos cabíveis.</p>

      <h2>22. Alterações dos Termos</h2>

      <p>O Pétala/Bloom pode atualizar estes Termos para refletir mudanças de produto, segurança, operação, pagamento, legislação, decisão judicial, exigência de parceiros ou melhoria de clareza.</p>

      <p>Quando uma alteração relevante exigir novo aceite, a plataforma poderá solicitar que a agência leia e aceite a versão atualizada para continuar usando determinadas funcionalidades.</p>

      <p>O uso da plataforma após a atualização pode depender da aceitação dos Termos vigentes.</p>

      <h2>23. Resolução de disputas</h2>

      <p>Em caso de dúvida, reclamação ou disputa, a agência deve procurar os canais de suporte disponíveis na plataforma.</p>

      <p>Sempre que possível, buscaremos uma solução amigável e uma revisão adequada do caso.</p>

      <p>Quando legalmente aplicável, disputas poderão seguir mecanismos de mediação, arbitragem ou outros meios previstos nos Termos e na lei.</p>

      <p>Nada nestes Termos impede o exercício de direitos obrigatórios, a atuação de autoridades competentes ou medidas urgentes previstas em lei.</p>

      <h2>24. Aceites destacados</h2>

      <p>Para atuar como agência ou usar determinadas funcionalidades, poderá ser necessário marcar aceites destacados, curtos e objetivos.</p>

      <p>Exemplos:</p>

      <ul>
        <li>"Li e aceito as regras de atuação, indicação, suporte e responsabilidade da agência.";</li>
        <li>"Li e aceito as regras contra coação, exploração, retenção de documentos, controle abusivo e violação de autonomia da criadora.";</li>
        <li>"Li e aceito as regras de comissão elegível, contestação, revisão financeira e bloqueio.";</li>
        <li>"Aceito as regras de denúncia, auditoria, banimento e encerramento de vínculo.";</li>
        <li>"Aceito as regras de resolução de disputas, quando legalmente aplicáveis."</li>
      </ul>

      <p>Os detalhes completos ficam no corpo destes Termos e das políticas aplicáveis.</p>

      <h2>25. Contato</h2>

      <p>A agência pode entrar em contato com o Pétala/Bloom pelos canais oficiais de suporte disponibilizados na plataforma.</p>

      <p>Use os canais oficiais para:</p>

      <ul>
        <li>dúvidas sobre cadastro;</li>
        <li>problemas de acesso;</li>
        <li>verificação;</li>
        <li>vínculo com criadoras;</li>
        <li>dúvidas sobre comissão elegível;</li>
        <li>dúvidas sobre pagamento;</li>
        <li>denúncias;</li>
        <li>revisão financeira;</li>
        <li>questões de privacidade;</li>
        <li>segurança;</li>
        <li>suporte operacional.</li>
      </ul>

      <p>Não use canais externos ou terceiros para tentar burlar pagamentos, moderação, regras de segurança ou suporte oficial.</p>

      <h2>26. Disposições finais</h2>

      <p>Se qualquer parte destes Termos for considerada inválida ou inaplicável, as demais disposições continuarão válidas na maior extensão permitida pela lei.</p>

      <p>A eventual tolerância da plataforma em relação a uma violação não significa renúncia de direitos.</p>

      <p>Estes Termos se aplicam em conjunto com políticas específicas, avisos exibidos na plataforma, regras de funcionalidades, contratos aplicáveis e aceites destacados.</p>

      <p>Ao usar o Pétala/Bloom como agência, você reconhece que a plataforma deve ser usada com respeito, consentimento, segurança, boa-fé, transparência, responsabilidade e preservação da autonomia das criadoras.</p>
    </LegalPageLayout>
  )
}
