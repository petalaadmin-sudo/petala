import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { PUBLIC_LEGAL_DOCUMENTS } from '@/lib/legal/public-documents'

const document = PUBLIC_LEGAL_DOCUMENTS['termos-criadora']

export default function LegalDocumentPage() {
  return (
    <LegalPageLayout
      title={document.title}
      description={document.description}
      version={document.version}
    >
      <p>Bem-vinda ao Pétala/Bloom.</p>

      <p>Estes Termos da Criadora explicam as regras para cadastro, verificação, perfil, conteúdo, mensagens, chamadas, presentes virtuais, ganhos elegíveis, pagamentos, segurança, denúncias e uso da plataforma por criadoras.</p>

      <p>Ao criar conta, concluir cadastro, acessar a área da criadora ou usar funcionalidades da plataforma, você declara que leu, entendeu e aceita estes Termos e as políticas aplicáveis.</p>

      <h2>1. Plataforma 18+</h2>

      <p>O Pétala/Bloom é uma plataforma destinada exclusivamente a pessoas com 18 anos ou mais.</p>

      <p>Para atuar como criadora, você declara que:</p>

      <ul>
        <li>tem 18 anos ou mais;</li>
        <li>possui capacidade legal para aceitar estes Termos;</li>
        <li>participa de forma voluntária;</li>
        <li>fornece informações verdadeiras;</li>
        <li>respeita as regras de conteúdo, consentimento, segurança, pagamentos e convivência;</li>
        <li>entende que verificações adicionais podem ser exigidas.</li>
      </ul>

      <p>Menores de 18 anos não podem criar conta, atuar como criadora, aparecer em conteúdo, participar de chamadas, receber mensagens, receber presentes ou interagir na plataforma.</p>

      <p>Conteúdo envolvendo menores é proibido em qualquer circunstância.</p>

      <h2>2. Cadastro e verificação</h2>

      <p>Para atuar como criadora, você pode precisar fornecer informações de cadastro, identidade, contato, dados de pagamento e outros dados necessários para segurança, verificação, suporte, prevenção de fraude e cumprimento das regras aplicáveis.</p>

      <p>A plataforma pode solicitar verificação de identidade antes de liberar determinadas funcionalidades, presença online, recebimento de ganhos, pagamento, conteúdo, chamadas ou interações sensíveis.</p>

      <p>Você deve fornecer informações verdadeiras, atuais e próprias.</p>

      <p>É proibido:</p>

      <ul>
        <li>usar documento falso;</li>
        <li>usar identidade de terceiros;</li>
        <li>cadastrar menor;</li>
        <li>ocultar menoridade;</li>
        <li>permitir que outra pessoa opere sua conta sem autorização válida;</li>
        <li>criar perfil falso;</li>
        <li>burlar etapas de verificação;</li>
        <li>fornecer dados bancários, Pix ou documentos que não sejam seus quando exigida titularidade.</li>
      </ul>

      <p>A plataforma pode recusar, suspender ou encerrar cadastro quando houver inconsistência, risco, fraude, violação de regras, denúncia ou necessidade de revisão.</p>

      <h2>3. Participação voluntária</h2>

      <p>Sua participação como criadora é voluntária.</p>

      <p>Você não é obrigada pela plataforma, por usuários, por agentes, por agências ou por terceiros a produzir conteúdo adulto, aceitar chamada, responder mensagem, enviar foto, manter interação, permanecer online ou realizar qualquer ato específico.</p>

      <p>Você pode definir limites dentro das regras da plataforma.</p>

      <p>Usuários, agentes, agências ou terceiros não podem obrigar, coagir, controlar, ameaçar, explorar, pressionar ou manipular sua participação.</p>

      <p>Se você se sentir pressionada, ameaçada, explorada ou controlada, use os canais de denúncia e suporte disponíveis.</p>

      <h2>4. Consentimento e limites</h2>

      <p>Consentimento é obrigatório em todas as interações.</p>

      <p>Você deve respeitar seus próprios limites, os limites de usuários, as regras da plataforma e a lei aplicável.</p>

      <p>Você pode recusar, encerrar ou deixar de aceitar interações quando não houver segurança, disponibilidade, interesse ou consentimento.</p>

      <p>Também deve respeitar que uma interação, presente, mensagem, chamada ou envio de pétalas não cria obrigação de ato específico.</p>

      <p>A plataforma pode agir quando houver ameaça, coação, assédio, chantagem, perseguição, exploração, tentativa de pagamento por fora, tentativa de contato externo proibido ou violação de regras.</p>

      <h2>5. Perfil da criadora</h2>

      <p>Seu perfil deve apresentar informações verdadeiras, respeitosas e compatíveis com as regras da plataforma.</p>

      <p>Você é responsável pelo conteúdo que publica em seu perfil, incluindo textos, imagens, informações, preferências, limites e materiais visuais.</p>

      <p>É proibido usar o perfil para:</p>

      <ul>
        <li>se passar por outra pessoa;</li>
        <li>divulgar dados pessoais sensíveis indevidamente;</li>
        <li>divulgar contato externo para burlar a plataforma;</li>
        <li>prometer interação fora das regras;</li>
        <li>oferecer encontro presencial;</li>
        <li>oferecer serviço presencial de natureza sexual;</li>
        <li>solicitar pagamento por fora;</li>
        <li>publicar conteúdo proibido;</li>
        <li>enganar usuários sobre disponibilidade, identidade ou regras.</li>
      </ul>

      <p>A plataforma pode revisar, restringir ou remover informações de perfil que violem estes Termos.</p>

      <h2>6. Conteúdos permitidos e proibidos</h2>

      <p>Você pode publicar conteúdos permitidos pelas funcionalidades disponíveis e pelas regras da plataforma.</p>

      <p>Todo conteúdo deve respeitar:</p>

      <ul>
        <li>maioridade;</li>
        <li>consentimento;</li>
        <li>privacidade;</li>
        <li>direitos de terceiros;</li>
        <li>regras de segurança;</li>
        <li>limites da plataforma;</li>
        <li>políticas aplicáveis.</li>
      </ul>

      <p>São proibidos:</p>

      <ul>
        <li>menores de 18 anos;</li>
        <li>conteúdo envolvendo menores;</li>
        <li>tentativa de envolver menor em qualquer interação;</li>
        <li>terceiros não verificados em conteúdo, chamada ou interação sensível;</li>
        <li>conteúdo não consensual;</li>
        <li>conteúdo obtido por ameaça, chantagem, fraude, coerção ou exploração;</li>
        <li>conteúdo que exponha dados pessoais sem autorização;</li>
        <li>conteúdo de terceiros sem direito de uso;</li>
        <li>conteúdo que viole direitos autorais, imagem, privacidade ou propriedade intelectual;</li>
        <li>conteúdo fraudulento, enganoso ou manipulado para burlar regras;</li>
        <li>conteúdo que incentive pagamento por fora, contato externo proibido, encontro presencial ou serviço presencial de natureza sexual.</li>
      </ul>

      <p>A plataforma pode remover, restringir, revisar ou bloquear conteúdo quando houver violação, denúncia, risco, fraude, obrigação legal ou necessidade de segurança.</p>

      <h2>7. Mensagens</h2>

      <p>Mensagens devem respeitar consentimento, limites, privacidade e segurança.</p>

      <p>Você pode usar mensagens para interagir com usuários conforme as funcionalidades disponíveis e as regras da plataforma.</p>

      <p>É proibido usar mensagens para:</p>

      <ul>
        <li>ameaçar;</li>
        <li>chantagear;</li>
        <li>coagir;</li>
        <li>assediar;</li>
        <li>perseguir;</li>
        <li>solicitar pagamento por fora;</li>
        <li>pedir ou enviar contato externo para burlar a plataforma;</li>
        <li>combinar encontro presencial;</li>
        <li>oferecer serviço presencial de natureza sexual;</li>
        <li>solicitar ou enviar conteúdo proibido;</li>
        <li>envolver menores;</li>
        <li>envolver terceiros não verificados;</li>
        <li>compartilhar dados pessoais indevidos;</li>
        <li>manipular usuários;</li>
        <li>fraudar a plataforma.</li>
      </ul>

      <p>A plataforma pode revisar mensagens quando necessário para segurança, denúncia, moderação, suporte, prevenção de fraude ou cumprimento das regras aplicáveis.</p>

      <h2>8. Chamadas</h2>

      <p>Chamadas podem estar disponíveis conforme funcionalidades da plataforma, regras exibidas, consentimento, disponibilidade e segurança.</p>

      <p>Você não é obrigada a aceitar chamadas.</p>

      <p>Ao participar de chamadas, você deve respeitar:</p>

      <ul>
        <li>consentimento;</li>
        <li>seus próprios limites;</li>
        <li>limites do usuário;</li>
        <li>regras de conteúdo;</li>
        <li>regras de segurança;</li>
        <li>proibição de gravação não autorizada;</li>
        <li>proibição de contato externo para burlar regras;</li>
        <li>proibição de pagamento por fora;</li>
        <li>proibição de encontro presencial;</li>
        <li>proibição de serviço presencial de natureza sexual.</li>
      </ul>

      <p>Você pode encerrar uma chamada quando desejar, especialmente diante de pressão, ameaça, abuso, violação de regras ou desconforto.</p>

      <p>É proibido gravar, capturar, retransmitir, publicar ou compartilhar chamadas sem autorização expressa e válida.</p>

      <h2>9. Presentes virtuais</h2>

      <p>Presentes virtuais são funcionalidades internas da plataforma.</p>

      <p>O envio de presente virtual por usuário não cria obrigação de resposta, chamada, conteúdo específico, ato específico ou interação futura.</p>

      <p>Presentes podem estar sujeitos a regras de elegibilidade, revisão financeira, denúncia, contestação, fraude, chargeback e políticas aplicáveis.</p>

      <p>Presentes enviados em violação às regras podem ser revisados, revertidos ou considerados inelegíveis conforme o caso.</p>

      <h2>10. Pétalas e ganhos elegíveis</h2>

      <p>Pétalas são créditos internos de uso fechado da plataforma.</p>

      <p>Para criadoras, determinadas interações podem gerar ganhos elegíveis, conforme regras da plataforma.</p>

      <p>Ganhos elegíveis dependem de critérios como:</p>

      <ul>
        <li>origem das pétalas;</li>
        <li>status da interação;</li>
        <li>verificação da criadora;</li>
        <li>regras da funcionalidade;</li>
        <li>fechamento do período;</li>
        <li>método de pagamento;</li>
        <li>revisão financeira;</li>
        <li>denúncias;</li>
        <li>chargeback;</li>
        <li>fraude;</li>
        <li>regras aplicáveis;</li>
        <li>disponibilidade operacional.</li>
      </ul>

      <p>Nem toda pétala, bônus, promoção, teste, crédito gratuito, presente, interação, chamada ou conteúdo gera ganho elegível.</p>

      <p>Ganhos não são renda garantida, saque automático, pagamento imediato ou promessa de remuneração.</p>

      <h2>11. Regra de remuneração</h2>

      <p>Quando a remuneração estiver disponível, a referência operacional poderá ser de US$ 1 a cada 850 pétalas elegíveis.</p>

      <p>Essa referência:</p>

      <ul>
        <li>não é ganho garantido;</li>
        <li>não é promessa de renda;</li>
        <li>não é saque automático;</li>
        <li>não é pagamento imediato;</li>
        <li>não se aplica a pétalas inelegíveis;</li>
        <li>depende das regras da plataforma;</li>
        <li>depende de verificação;</li>
        <li>depende de fechamento;</li>
        <li>depende de revisão financeira;</li>
        <li>depende de método de pagamento;</li>
        <li>depende de câmbio quando aplicável;</li>
        <li>depende de denúncias, chargeback, fraude e demais regras aplicáveis.</li>
      </ul>

      <p>A plataforma poderá exibir informações específicas sobre ganhos, períodos, elegibilidade, métodos de pagamento e valores quando a funcionalidade estiver disponível.</p>

      <h2>12. Payout e pagamento</h2>

      <p>Pagamentos à criadora, quando disponíveis, dependem de requisitos aplicáveis.</p>

      <p>Podem ser exigidos:</p>

      <ul>
        <li>conta verificada;</li>
        <li>identidade confirmada;</li>
        <li>dados de pagamento válidos;</li>
        <li>titularidade compatível;</li>
        <li>informações fiscais quando aplicável;</li>
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

      <p>A plataforma não garante pagamento imediato, saque automático ou disponibilidade contínua de todos os métodos de pagamento.</p>

      <h2>13. Chargeback, contestação e revisão financeira</h2>

      <p>Compras, presentes, chamadas, mensagens, conteúdos ou interações podem ser impactados por contestação de pagamento, chargeback, fraude, erro operacional, denúncia ou revisão financeira.</p>

      <p>Nesses casos, a plataforma poderá revisar:</p>

      <ul>
        <li>status da interação;</li>
        <li>origem das pétalas;</li>
        <li>elegibilidade de ganhos;</li>
        <li>presentes;</li>
        <li>funcionalidades usadas;</li>
        <li>histórico relacionado;</li>
        <li>denúncias;</li>
        <li>informações de segurança;</li>
        <li>dados de pagamento quando aplicável.</li>
      </ul>

      <p>Durante a revisão, ganhos ou pagamentos podem ficar pendentes, bloqueados, revertidos, cancelados ou ajustados conforme as regras aplicáveis.</p>

      <p>Contestação abusiva, fraude, manipulação, pagamento por fora ou violação de regras podem afetar a conta do usuário, da criadora, da agência ou de terceiros envolvidos.</p>

      <h2>14. Agências, agentes e terceiros</h2>

      <p>Agências, agentes ou terceiros podem apoiar processos de indicação, onboarding ou suporte operacional quando permitido pela plataforma.</p>

      <p>Esses terceiros não são donos da criadora e não podem controlar sua participação.</p>

      <p>Agências, agentes e terceiros não podem:</p>

      <ul>
        <li>coagir;</li>
        <li>ameaçar;</li>
        <li>chantagear;</li>
        <li>explorar;</li>
        <li>obrigar conteúdo adulto;</li>
        <li>reter documentos;</li>
        <li>reter senha;</li>
        <li>controlar celular;</li>
        <li>controlar Pix;</li>
        <li>controlar conta bancária;</li>
        <li>prometer ganhos falsos;</li>
        <li>cadastrar menor;</li>
        <li>ocultar menoridade;</li>
        <li>operar conta sem autorização válida;</li>
        <li>impedir denúncia;</li>
        <li>impedir saída;</li>
        <li>forçar presença online;</li>
        <li>forçar resposta a usuários;</li>
        <li>forçar chamadas;</li>
        <li>forçar conteúdo;</li>
        <li>combinar pagamento por fora;</li>
        <li>negociar encontro presencial;</li>
        <li>negociar serviço presencial de natureza sexual.</li>
      </ul>

      <p>Se você estiver sob pressão ou controle abusivo de agente, agência ou terceiro, procure o suporte ou use os canais de denúncia.</p>

      <h2>15. Contato externo e pagamento por fora</h2>

      <p>É proibido usar a plataforma para combinar contato externo com o objetivo de burlar regras, pagamentos, segurança, moderação ou proteção das partes.</p>

      <p>Também é proibido:</p>

      <ul>
        <li>pedir pagamento por fora;</li>
        <li>receber pagamento por fora;</li>
        <li>enviar Pix, conta bancária ou outro meio externo para burlar a plataforma;</li>
        <li>direcionar usuário para canal externo com finalidade de evitar cobrança, moderação ou segurança;</li>
        <li>negociar conteúdo, chamada, presente ou interação fora da plataforma;</li>
        <li>prometer benefícios fora da plataforma em troca de pagamento externo.</li>
      </ul>

      <p>Essas condutas podem gerar bloqueio, banimento, revisão financeira, perda de elegibilidade e outras medidas cabíveis.</p>

      <h2>16. Encontro presencial e serviço presencial proibido</h2>

      <p>O Pétala/Bloom não é uma plataforma de encontros presenciais.</p>

      <p>É proibido usar a plataforma para:</p>

      <ul>
        <li>combinar encontro presencial;</li>
        <li>solicitar encontro presencial;</li>
        <li>oferecer encontro presencial;</li>
        <li>negociar encontro presencial;</li>
        <li>solicitar serviço presencial de natureza sexual;</li>
        <li>oferecer serviço presencial de natureza sexual;</li>
        <li>usar a plataforma para intermediar qualquer serviço presencial.</li>
      </ul>

      <p>Qualquer tentativa de usar a plataforma para esse fim pode resultar em bloqueio, banimento, revisão financeira e medidas cabíveis.</p>

      <h2>17. Denúncias</h2>

      <p>Você pode denunciar usuários, agências, agentes, mensagens, conteúdos, chamadas, comportamentos ou situações que violem estes Termos.</p>

      <p>Denúncias podem envolver, por exemplo:</p>

      <ul>
        <li>menoridade;</li>
        <li>conteúdo proibido;</li>
        <li>ameaça;</li>
        <li>coerção;</li>
        <li>chantagem;</li>
        <li>exploração;</li>
        <li>assédio;</li>
        <li>gravação não autorizada;</li>
        <li>vazamento;</li>
        <li>pagamento por fora;</li>
        <li>tentativa de encontro presencial;</li>
        <li>fraude;</li>
        <li>controle abusivo por agência ou agente;</li>
        <li>retenção de documentos;</li>
        <li>violação de privacidade.</li>
      </ul>

      <p>Ao receber denúncia, a plataforma poderá revisar informações relacionadas e tomar medidas conforme a gravidade, as evidências disponíveis, os Termos e a lei aplicável.</p>

      <p>Denúncias falsas, abusivas ou feitas de má-fé também podem gerar medidas contra quem as realizar.</p>

      <h2>18. Moderação, bloqueio e banimento</h2>

      <p>A plataforma pode moderar, restringir, suspender, bloquear ou encerrar contas, conteúdos, interações, funcionalidades, ganhos, pagamentos, presentes ou saldos internos quando houver violação destes Termos, risco de segurança, fraude, denúncia, contestação, exigência legal ou necessidade de proteção da plataforma e das pessoas envolvidas.</p>

      <p>Medidas podem incluir:</p>

      <ul>
        <li>aviso;</li>
        <li>remoção de conteúdo;</li>
        <li>restrição de funcionalidades;</li>
        <li>bloqueio temporário;</li>
        <li>suspensão de conta;</li>
        <li>banimento;</li>
        <li>revisão financeira;</li>
        <li>bloqueio de ganhos;</li>
        <li>reversão de valores;</li>
        <li>cancelamento de benefícios;</li>
        <li>comunicação a provedores ou autoridades quando aplicável.</li>
      </ul>

      <p>A aplicação de medidas pode considerar gravidade, reincidência, risco, evidências, impacto, urgência e obrigações legais.</p>

      <h2>19. Privacidade</h2>

      <p>O tratamento de dados pessoais ocorre conforme a Política de Privacidade aplicável.</p>

      <p>Podemos tratar dados para:</p>

      <ul>
        <li>criar e proteger contas;</li>
        <li>verificar identidade;</li>
        <li>operar a plataforma;</li>
        <li>processar pagamentos;</li>
        <li>oferecer suporte;</li>
        <li>cumprir obrigações legais;</li>
        <li>prevenir fraude;</li>
        <li>moderar conteúdo;</li>
        <li>analisar denúncias;</li>
        <li>proteger usuários, criadoras e a plataforma;</li>
        <li>registrar aceites e eventos relevantes.</li>
      </ul>

      <p>Você deve proteger sua própria privacidade e respeitar a privacidade de outras pessoas.</p>

      <p>É proibido expor dados pessoais, documentos, contatos, imagens, conversas, gravações ou informações privadas sem autorização.</p>

      <h2>20. Propriedade intelectual, imagem e conteúdo</h2>

      <p>Você deve ter direitos ou autorização para publicar qualquer conteúdo enviado à plataforma.</p>

      <p>Ao publicar conteúdo, você declara que:</p>

      <ul>
        <li>possui direito de uso;</li>
        <li>tem autorização das pessoas envolvidas quando aplicável;</li>
        <li>o conteúdo respeita estes Termos;</li>
        <li>o conteúdo não viola direitos de terceiros;</li>
        <li>o conteúdo não envolve menores;</li>
        <li>o conteúdo não envolve terceiros não verificados em situações sensíveis.</li>
      </ul>

      <p>Você mantém seus direitos sobre conteúdos próprios, mas concede à plataforma as permissões necessárias para hospedar, exibir, processar, moderar, proteger, operar e disponibilizar o conteúdo dentro das funcionalidades da plataforma.</p>

      <p>Conteúdos privados não podem ser baixados, copiados, revendidos, vazados, gravados, compartilhados ou usados fora da plataforma sem autorização.</p>

      <p>A plataforma pode remover, restringir ou bloquear conteúdo quando houver violação de regras, denúncia, risco, fraude, obrigação legal ou necessidade de segurança.</p>

      <h2>21. Segurança da conta</h2>

      <p>Você é responsável por proteger sua conta.</p>

      <p>Você não deve:</p>

      <ul>
        <li>compartilhar senha;</li>
        <li>entregar acesso a terceiros;</li>
        <li>permitir que agência, agente ou terceiro controle sua conta sem autorização válida;</li>
        <li>entregar seu celular para controle abusivo;</li>
        <li>entregar documentos para retenção indevida;</li>
        <li>permitir controle indevido de Pix ou conta bancária;</li>
        <li>usar conta de outra pessoa;</li>
        <li>ignorar alertas de segurança.</li>
      </ul>

      <p>Se houver suspeita de acesso indevido, controle abusivo, fraude ou risco, procure o suporte.</p>

      <h2>22. Limitação de responsabilidade</h2>

      <p>Dentro dos limites permitidos pela lei, o Pétala/Bloom não será responsável por:</p>

      <ul>
        <li>uso indevido da plataforma por usuários, criadoras, agências, agentes ou terceiros;</li>
        <li>violação destes Termos por terceiros;</li>
        <li>informações falsas fornecidas por usuários ou criadoras;</li>
        <li>indisponibilidades temporárias;</li>
        <li>falhas de conexão, dispositivo, navegador ou serviço externo;</li>
        <li>perda decorrente de compartilhamento de senha;</li>
        <li>contato externo feito fora da plataforma;</li>
        <li>pagamentos por fora;</li>
        <li>gravações, vazamentos ou compartilhamentos não autorizados feitos por terceiros;</li>
        <li>expectativas de ganho, resposta, atenção, conteúdo, chamada ou interação específica.</li>
      </ul>

      <p>Nada nestes Termos afasta direitos obrigatórios previstos em lei.</p>

      <h2>23. Indenização</h2>

      <p>Você poderá ser responsabilizada por danos, perdas, custos, despesas, reclamações, disputas, chargebacks, multas, condenações ou prejuízos causados ao Pétala/Bloom, a usuários, a criadoras, a terceiros ou a parceiros quando decorrerem de:</p>

      <ul>
        <li>fraude;</li>
        <li>violação destes Termos;</li>
        <li>conteúdo ilegal;</li>
        <li>documento falso;</li>
        <li>identidade de terceiro;</li>
        <li>conteúdo não consensual;</li>
        <li>conteúdo envolvendo menor;</li>
        <li>uso indevido de imagem;</li>
        <li>violação de privacidade;</li>
        <li>violação de direitos de terceiros;</li>
        <li>pagamento por fora;</li>
        <li>contato externo proibido;</li>
        <li>encontro presencial;</li>
        <li>serviço presencial de natureza sexual;</li>
        <li>vazamento de conteúdo;</li>
        <li>gravação não autorizada;</li>
        <li>tentativa de burlar segurança, moderação ou pagamento;</li>
        <li>conduta proibida.</li>
      </ul>

      <p>Essa responsabilidade será aplicada conforme a lei e os procedimentos cabíveis.</p>

      <h2>24. Alterações dos Termos</h2>

      <p>O Pétala/Bloom pode atualizar estes Termos para refletir mudanças de produto, segurança, operação, pagamento, legislação, decisão judicial, exigência de parceiros ou melhoria de clareza.</p>

      <p>Quando uma alteração relevante exigir novo aceite, a plataforma poderá solicitar que você leia e aceite a versão atualizada para continuar usando determinadas funcionalidades.</p>

      <p>O uso da plataforma após a atualização pode depender da aceitação dos Termos vigentes.</p>

      <h2>25. Resolução de disputas</h2>

      <p>Em caso de dúvida, reclamação ou disputa, você deve procurar os canais de suporte disponíveis na plataforma.</p>

      <p>Sempre que possível, buscaremos uma solução amigável e uma revisão adequada do caso.</p>

      <p>Quando legalmente aplicável, disputas poderão seguir mecanismos de mediação, arbitragem ou outros meios previstos nos Termos e na lei.</p>

      <p>Nada nestes Termos impede o exercício de direitos obrigatórios, a atuação de autoridades competentes ou medidas urgentes previstas em lei.</p>

      <h2>26. Aceites destacados</h2>

      <p>Para atuar como criadora ou usar determinadas funcionalidades, você poderá precisar marcar aceites destacados, curtos e objetivos.</p>

      <p>Exemplos:</p>

      <ul>
        <li>"Declaro que tenho 18 anos ou mais e aceito verificação de identidade.";</li>
        <li>"Li e aceito as regras de conteúdo, consentimento, limites, denúncia, bloqueio e banimento.";</li>
        <li>"Li e aceito as regras de ganhos elegíveis, payout, contestação, revisão financeira e bloqueio.";</li>
        <li>"Declaro que minha participação é voluntária e que mantenho controle sobre meus documentos, conta, senha, Pix e acesso.";</li>
        <li>"Aceito as regras de resolução de disputas, quando legalmente aplicáveis."</li>
      </ul>

      <p>Os detalhes completos ficam no corpo destes Termos e das políticas aplicáveis.</p>

      <h2>27. Contato</h2>

      <p>Você pode entrar em contato com o Pétala/Bloom pelos canais oficiais de suporte disponibilizados na plataforma.</p>

      <p>Use os canais oficiais para:</p>

      <ul>
        <li>dúvidas sobre conta;</li>
        <li>problemas de acesso;</li>
        <li>verificação;</li>
        <li>dúvidas sobre ganhos elegíveis;</li>
        <li>dúvidas sobre payout;</li>
        <li>denúncias;</li>
        <li>revisão financeira;</li>
        <li>questões de privacidade;</li>
        <li>segurança;</li>
        <li>suporte operacional.</li>
      </ul>

      <p>Não use canais externos ou terceiros para tentar burlar pagamentos, moderação, regras de segurança ou suporte oficial.</p>

      <h2>28. Disposições finais</h2>

      <p>Se qualquer parte destes Termos for considerada inválida ou inaplicável, as demais disposições continuarão válidas na maior extensão permitida pela lei.</p>

      <p>A eventual tolerância da plataforma em relação a uma violação não significa renúncia de direitos.</p>

      <p>Estes Termos se aplicam em conjunto com políticas específicas, avisos exibidos na plataforma, regras de funcionalidades e aceites destacados aplicáveis.</p>

      <p>Ao usar o Pétala/Bloom como criadora, você reconhece que a plataforma deve ser usada com respeito, consentimento, segurança, boa-fé, autonomia e responsabilidade.</p>
    </LegalPageLayout>
  )
}
