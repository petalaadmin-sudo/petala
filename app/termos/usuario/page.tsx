import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { PUBLIC_LEGAL_DOCUMENTS } from '@/lib/legal/public-documents'

const document = PUBLIC_LEGAL_DOCUMENTS['termos-usuario']

export default function LegalDocumentPage() {
  return (
    <LegalPageLayout
      title={document.title}
      description={document.description}
      version={document.version}
    >
      <p>Bem-vindo ao Pétala/Bloom.</p>

      <p>Estes Termos de Uso do Usuário explicam as regras para criar conta, acessar a plataforma, comprar e usar pétalas, interagir com criadoras, participar de mensagens, chamadas, presentes virtuais e demais funcionalidades disponíveis.</p>

      <p>Ao criar conta, acessar ou usar o Pétala/Bloom, você declara que leu, entendeu e aceita estes Termos e as políticas aplicáveis.</p>

      <h2>1. Plataforma 18+</h2>

      <p>O Pétala/Bloom é uma plataforma destinada exclusivamente a pessoas com 18 anos ou mais.</p>

      <p>Ao usar a plataforma, você declara que:</p>

      <ul>
        <li>tem 18 anos ou mais;</li>
        <li>possui capacidade legal para aceitar estes Termos;</li>
        <li>usará a plataforma de forma voluntária, segura e responsável;</li>
        <li>fornecerá informações verdadeiras quando solicitado;</li>
        <li>respeitará as regras de consentimento, segurança, conteúdo, pagamento e convivência.</li>
      </ul>

      <p>Menores de 18 anos não podem criar conta, acessar, usar, aparecer em conteúdo, participar de chamadas, enviar mensagens ou interagir na plataforma.</p>

      <p>Podemos solicitar verificações adicionais quando necessário para proteger usuários, criadoras, a plataforma e cumprir obrigações legais, contratuais ou de segurança.</p>

      <h2>2. O que é o Pétala/Bloom</h2>

      <p>O Pétala/Bloom é uma plataforma digital de interação entre adultos, com foco em experiências privadas, conteúdo, mensagens, chamadas, presentes virtuais e funcionalidades internas.</p>

      <p>A plataforma busca oferecer um ambiente discreto, seguro, premium e respeitoso, em que criadoras definem seus limites e usuários interagem conforme as regras.</p>

      <p>O Pétala/Bloom não garante que uma criadora responderá, aceitará uma chamada, realizará uma interação específica ou produzirá determinado conteúdo.</p>

      <p>Toda interação depende de disponibilidade, consentimento, regras da plataforma e limites de cada criadora.</p>

      <h2>3. Conta do usuário</h2>

      <p>Para usar determinadas funcionalidades, você pode precisar criar uma conta.</p>

      <p>Você é responsável por:</p>

      <ul>
        <li>manter seus dados atualizados;</li>
        <li>proteger sua senha e meios de acesso;</li>
        <li>não compartilhar sua conta com terceiros;</li>
        <li>não usar conta de outra pessoa;</li>
        <li>comunicar atividade suspeita quando perceber risco;</li>
        <li>usar a plataforma de acordo com estes Termos.</li>
      </ul>

      <p>Você não deve vender, emprestar, transferir, alugar ou permitir o uso da sua conta por outra pessoa.</p>

      <p>Se houver suspeita de fraude, uso indevido, violação de regras, menoridade, risco de segurança ou uso por terceiros, a plataforma poderá restringir, suspender ou encerrar sua conta.</p>

      <h2>4. Criadoras e limites</h2>

      <p>Criadoras participam da plataforma de forma voluntária e definem seus próprios limites dentro das regras do Pétala/Bloom.</p>

      <p>Você deve respeitar:</p>

      <ul>
        <li>o consentimento da criadora;</li>
        <li>os limites informados pela criadora;</li>
        <li>as regras de conteúdo;</li>
        <li>as regras de mensagens;</li>
        <li>as regras de chamadas;</li>
        <li>as regras de privacidade;</li>
        <li>as regras de pagamento e uso de pétalas.</li>
      </ul>

      <p>O pagamento, envio de pétalas, presente virtual, mensagem, chamada ou qualquer interação não dá ao usuário o direito de exigir ato específico, resposta obrigatória, disponibilidade permanente, conteúdo específico ou comportamento fora dos limites da criadora.</p>

      <p>Criadoras podem recusar, interromper ou deixar de aceitar interações quando não houver consentimento, disponibilidade ou segurança.</p>

      <h2>5. Consentimento</h2>

      <p>Consentimento é obrigatório em todas as interações.</p>

      <p>Você não pode pressionar, ameaçar, constranger, perseguir, chantagear, insistir de forma abusiva ou tentar forçar uma criadora a realizar qualquer ato, conteúdo, chamada, mensagem, resposta ou interação.</p>

      <p>Também é proibido tentar usar pagamento, presente, compra de pétalas ou qualquer vantagem como forma de pressão.</p>

      <p>Se uma criadora disser não, encerrar uma interação, bloquear contato, não responder ou definir limite, você deve respeitar.</p>

      <h2>6. Pétalas</h2>

      <p>Pétalas são créditos internos de uso fechado dentro do Pétala/Bloom.</p>

      <p>Pétalas:</p>

      <ul>
        <li>não são moeda;</li>
        <li>não são investimento;</li>
        <li>não são saldo bancário;</li>
        <li>não são depósito;</li>
        <li>não são conta de pagamento;</li>
        <li>não têm rendimento;</li>
        <li>não são transferíveis entre usuários;</li>
        <li>não são sacáveis pelo usuário;</li>
        <li>não podem ser usadas fora da plataforma;</li>
        <li>não garantem ato específico;</li>
        <li>não garantem resposta, chamada, conteúdo, presente, interação ou resultado.</li>
      </ul>

      <p>As pétalas podem ser usadas em funcionalidades disponíveis na plataforma, conforme estes Termos, as políticas aplicáveis, o saldo disponível, a disponibilidade da funcionalidade, as regras de segurança e o consentimento das pessoas envolvidas.</p>

      <h2>7. Compra de pétalas</h2>

      <p>Você pode comprar pacotes de pétalas pelos meios oficiais disponíveis na plataforma.</p>

      <p>Ao comprar pétalas, você deve conferir:</p>

      <ul>
        <li>pacote escolhido;</li>
        <li>valor;</li>
        <li>método de pagamento;</li>
        <li>informações exibidas no checkout;</li>
        <li>regras aplicáveis ao uso de pétalas.</li>
      </ul>

      <p>A confirmação de compra depende do processamento do pagamento e das verificações aplicáveis.</p>

      <p>O retorno de uma página de checkout, banco, cartão, Pix ou provedor de pagamento não significa, por si só, que o pagamento foi confirmado. O saldo e o histórico serão atualizados quando a confirmação for recebida e processada pela plataforma.</p>

      <p>Você não deve tentar manipular pacotes, preços, bônus, métodos de pagamento, identificadores de compra, saldo ou qualquer informação técnica do checkout.</p>

      <h2>8. Bônus, promoções e créditos gratuitos</h2>

      <p>A plataforma pode oferecer bônus, promoções, testes, campanhas ou créditos gratuitos.</p>

      <p>Esses créditos podem ter regras próprias, como:</p>

      <ul>
        <li>prazo de uso;</li>
        <li>restrições de funcionalidade;</li>
        <li>indisponibilidade para reembolso em dinheiro;</li>
        <li>cancelamento em caso de abuso;</li>
        <li>reversão em caso de fraude, erro ou violação de regras.</li>
      </ul>

      <p>Bônus, promoções, testes e créditos gratuitos não viram dinheiro, não geram saque e não garantem reembolso.</p>

      <h2>9. Uso e consumo de pétalas</h2>

      <p>Pétalas podem ser consumidas ao usar funcionalidades da plataforma, como mensagens, chamadas, presentes virtuais, conteúdo ou outros recursos disponíveis.</p>

      <p>Antes de usar uma funcionalidade que consuma pétalas, a plataforma poderá exibir informações sobre preço, regra de uso, confirmação ou consentimento.</p>

      <p>Ao confirmar uma funcionalidade paga, você autoriza o consumo das pétalas conforme as regras exibidas e estes Termos.</p>

      <p>Pétalas consumidas em funcionalidades, interações, chamadas, mensagens, presentes ou conteúdos não geram reembolso automático.</p>

      <p>Se houver falha técnica, cobrança indevida, duplicidade, indisponibilidade relevante, fraude comprovada, erro operacional ou outra situação aplicável, o caso poderá ser analisado pela plataforma.</p>

      <h2>10. Reembolso e direito de arrependimento</h2>

      <p>O Pétala/Bloom respeita os direitos legais aplicáveis.</p>

      <p>Pedidos de reembolso podem ser analisados conforme:</p>

      <ul>
        <li>prazo legal aplicável;</li>
        <li>método de pagamento;</li>
        <li>status da compra;</li>
        <li>confirmação do pagamento;</li>
        <li>uso ou consumo das pétalas;</li>
        <li>existência de bônus ou créditos gratuitos;</li>
        <li>suspeita de fraude;</li>
        <li>contestação de pagamento;</li>
        <li>falha técnica;</li>
        <li>cobrança indevida;</li>
        <li>duplicidade;</li>
        <li>regras destes Termos e políticas aplicáveis.</li>
      </ul>

      <p>Pétalas compradas e não consumidas podem ser analisadas para reembolso quando cabível.</p>

      <p>Pétalas já consumidas em chamadas, mensagens, presentes, conteúdos ou funcionalidades representam uso de serviço ou interação já disponibilizada e não geram reembolso automático.</p>

      <p>Quando aplicável, o reembolso poderá ser proporcional.</p>

      <p>Bônus, promoções, testes, cortesias e créditos gratuitos não são convertidos em dinheiro.</p>

      <h2>11. Contestação de pagamento e chargeback</h2>

      <p>Se você contestar uma compra, solicitar chargeback ou houver disputa de pagamento, a plataforma poderá realizar revisão financeira e de segurança.</p>

      <p>Durante a revisão, a plataforma poderá restringir temporariamente:</p>

      <ul>
        <li>saldo de pétalas;</li>
        <li>compras;</li>
        <li>funcionalidades;</li>
        <li>conta;</li>
        <li>presentes;</li>
        <li>interações;</li>
        <li>histórico relacionado;</li>
        <li>acesso a recursos sensíveis.</li>
      </ul>

      <p>Contestação abusiva, fraude, uso indevido de pagamento, tentativa de obter benefício sem pagar, manipulação de checkout, uso de conta de terceiros ou má-fé podem gerar:</p>

      <ul>
        <li>bloqueio de conta;</li>
        <li>reversão de créditos;</li>
        <li>suspensão de funcionalidades;</li>
        <li>banimento;</li>
        <li>revisão financeira;</li>
        <li>comunicação a provedores de pagamento;</li>
        <li>medidas cabíveis conforme a lei e os Termos.</li>
      </ul>

      <p>Contestar um pagamento não impede a plataforma de analisar o uso das pétalas, o histórico da conta, as interações realizadas e eventuais violações.</p>

      <h2>12. Chamadas</h2>

      <p>Chamadas podem estar disponíveis conforme regras da plataforma, disponibilidade das criadoras, consentimento e funcionalidades liberadas.</p>

      <p>Você deve respeitar:</p>

      <ul>
        <li>aceite prévio;</li>
        <li>preço ou regra exibida;</li>
        <li>tempo de chamada;</li>
        <li>limites da criadora;</li>
        <li>regras de conteúdo;</li>
        <li>regras de segurança;</li>
        <li>encerramento da chamada por qualquer parte.</li>
      </ul>

      <p>Nenhuma chamada pode ser iniciada ou mantida sem consentimento.</p>

      <p>É proibido gravar, capturar, transmitir, publicar ou compartilhar chamadas sem autorização expressa e válida.</p>

      <p>Também é proibido usar chamadas para ameaçar, chantagear, pressionar, combinar pagamento por fora, solicitar encontro presencial, pedir serviço presencial ou violar estes Termos.</p>

      <h2>13. Mensagens</h2>

      <p>Mensagens devem respeitar consentimento, limites, privacidade e segurança.</p>

      <p>É proibido usar mensagens para:</p>

      <ul>
        <li>ameaçar;</li>
        <li>assediar;</li>
        <li>chantagear;</li>
        <li>coagir;</li>
        <li>perseguir;</li>
        <li>enviar conteúdo ilegal;</li>
        <li>solicitar conteúdo envolvendo menores;</li>
        <li>solicitar terceiros não verificados;</li>
        <li>combinar pagamento por fora;</li>
        <li>pedir contato externo para burlar a plataforma;</li>
        <li>exigir ato específico em razão de pagamento;</li>
        <li>enviar dados de terceiros sem autorização;</li>
        <li>compartilhar conteúdo privado sem permissão.</li>
      </ul>

      <p>A plataforma pode revisar mensagens quando necessário para segurança, denúncia, moderação, suporte, prevenção de fraude ou cumprimento de regras aplicáveis.</p>

      <h2>14. Presentes virtuais</h2>

      <p>Presentes virtuais são funcionalidades internas da plataforma.</p>

      <p>Ao enviar um presente virtual, você reconhece que:</p>

      <ul>
        <li>o presente pode consumir pétalas;</li>
        <li>o envio não garante resposta;</li>
        <li>o envio não garante chamada;</li>
        <li>o envio não garante conteúdo específico;</li>
        <li>o envio não cria obrigação de ato específico pela criadora;</li>
        <li>regras de reembolso e contestação continuam aplicáveis.</li>
      </ul>

      <p>Presentes enviados em violação às regras podem ser revisados, revertidos ou considerados inelegíveis conforme o caso.</p>

      <h2>15. Conteúdo e condutas proibidas</h2>

      <p>Você não pode publicar, solicitar, enviar, comprar, vender, compartilhar, armazenar, transmitir ou incentivar conteúdo ou conduta proibida.</p>

      <p>São proibidos:</p>

      <ul>
        <li>menores de 18 anos;</li>
        <li>conteúdo envolvendo menores;</li>
        <li>tentativa de envolver menor em qualquer interação;</li>
        <li>terceiros não verificados em conteúdo, chamada ou interação sensível;</li>
        <li>conteúdo não consensual;</li>
        <li>ameaça;</li>
        <li>chantagem;</li>
        <li>coerção;</li>
        <li>assédio;</li>
        <li>perseguição;</li>
        <li>exploração;</li>
        <li>aliciamento;</li>
        <li>tráfico;</li>
        <li>violência;</li>
        <li>gravação não autorizada;</li>
        <li>captura não autorizada;</li>
        <li>compartilhamento externo não autorizado;</li>
        <li>vazamento de conteúdo privado;</li>
        <li>exposição de dados pessoais;</li>
        <li>fraude;</li>
        <li>uso de documentos falsos;</li>
        <li>uso de conta de terceiros;</li>
        <li>manipulação de pagamento;</li>
        <li>contestação abusiva;</li>
        <li>tentativa de burlar moderação, segurança ou pagamento.</li>
      </ul>

      <p>Violações podem gerar remoção de conteúdo, bloqueio, suspensão, banimento, revisão financeira e medidas cabíveis.</p>

      <h2>16. Contato externo e pagamento por fora</h2>

      <p>É proibido usar a plataforma para combinar contato externo com o objetivo de burlar regras, pagamentos, segurança, moderação ou proteção das partes.</p>

      <p>Também é proibido:</p>

      <ul>
        <li>pagar por fora;</li>
        <li>receber por fora;</li>
        <li>pedir Pix, conta bancária ou outro meio externo para burlar a plataforma;</li>
        <li>direcionar a interação para canais externos com finalidade de evitar cobrança, moderação ou segurança;</li>
        <li>negociar conteúdo, chamada, presente ou interação fora da plataforma.</li>
      </ul>

      <p>Essas condutas podem gerar bloqueio, banimento, revisão financeira e outras medidas cabíveis.</p>

      <h2>17. Encontro presencial e serviço presencial proibido</h2>

      <p>O Pétala/Bloom não é uma plataforma de encontros presenciais.</p>

      <p>É proibido usar a plataforma para:</p>

      <ul>
        <li>combinar encontro presencial;</li>
        <li>solicitar encontro presencial;</li>
        <li>oferecer encontro presencial;</li>
        <li>solicitar serviço presencial de natureza sexual;</li>
        <li>oferecer serviço presencial de natureza sexual;</li>
        <li>pressionar criadoras a encontrar usuários fora da plataforma.</li>
      </ul>

      <p>Qualquer tentativa de usar a plataforma para esse fim pode resultar em bloqueio, banimento e medidas cabíveis.</p>

      <h2>18. Denúncias</h2>

      <p>Você pode denunciar contas, mensagens, conteúdos, chamadas, comportamentos ou situações que violem estes Termos.</p>

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
        <li>uso indevido de conta;</li>
        <li>violação de privacidade.</li>
      </ul>

      <p>Ao receber denúncia, a plataforma poderá revisar informações relacionadas e tomar medidas conforme a gravidade, as evidências disponíveis, os Termos e a lei aplicável.</p>

      <p>Denúncias falsas, abusivas ou feitas de má-fé também podem gerar medidas contra quem as realizar.</p>

      <h2>19. Moderação, bloqueio e banimento</h2>

      <p>A plataforma pode moderar, restringir, suspender, bloquear ou encerrar contas, conteúdos, interações, funcionalidades, compras, presentes ou saldos internos quando houver violação destes Termos, risco de segurança, fraude, denúncia, contestação, exigência legal ou necessidade de proteção da plataforma e das pessoas envolvidas.</p>

      <p>Medidas podem incluir:</p>

      <ul>
        <li>aviso;</li>
        <li>remoção de conteúdo;</li>
        <li>restrição de funcionalidades;</li>
        <li>bloqueio temporário;</li>
        <li>suspensão de conta;</li>
        <li>banimento;</li>
        <li>revisão financeira;</li>
        <li>reversão de créditos;</li>
        <li>cancelamento de benefícios;</li>
        <li>comunicação a provedores ou autoridades quando aplicável.</li>
      </ul>

      <p>A aplicação de medidas pode considerar gravidade, reincidência, risco, evidências, impacto, urgência e obrigações legais.</p>

      <h2>20. Privacidade</h2>

      <p>O tratamento de dados pessoais ocorre conforme a Política de Privacidade aplicável.</p>

      <p>Podemos tratar dados para:</p>

      <ul>
        <li>criar e proteger contas;</li>
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

      <p>Você deve usar a plataforma respeitando a privacidade de outras pessoas.</p>

      <p>É proibido expor dados pessoais, documentos, contatos, imagens, conversas, gravações ou informações privadas sem autorização.</p>

      <h2>21. Propriedade intelectual e conteúdo privado</h2>

      <p>Marcas, layout, textos, interfaces, sistemas, nomes, elementos visuais e funcionalidades do Pétala/Bloom pertencem à plataforma ou a seus licenciadores.</p>

      <p>Você não pode copiar, modificar, reproduzir, distribuir, explorar, vender, sublicenciar, tentar extrair código, burlar proteção técnica ou usar elementos da plataforma sem autorização.</p>

      <p>Conteúdos privados de criadoras, mensagens, chamadas, fotos, vídeos e interações não podem ser gravados, copiados, compartilhados, publicados, revendidos, vazados ou usados fora da plataforma sem autorização.</p>

      <p>O acesso a um conteúdo ou interação dentro da plataforma não transfere propriedade, licença ampla ou autorização de uso externo.</p>

      <h2>22. Limitação de responsabilidade</h2>

      <p>Dentro dos limites permitidos pela lei, o Pétala/Bloom não será responsável por:</p>

      <ul>
        <li>uso indevido da plataforma por usuários;</li>
        <li>violação destes Termos por terceiros;</li>
        <li>informações falsas fornecidas por usuários;</li>
        <li>indisponibilidades temporárias;</li>
        <li>falhas de conexão, dispositivo, navegador ou serviço externo;</li>
        <li>perda decorrente de compartilhamento de senha;</li>
        <li>contato externo feito fora da plataforma;</li>
        <li>pagamentos por fora;</li>
        <li>gravações, vazamentos ou compartilhamentos não autorizados feitos por usuários;</li>
        <li>expectativas de resposta, atenção, conteúdo ou interação específica.</li>
      </ul>

      <p>Nada nestes Termos afasta direitos obrigatórios previstos em lei.</p>

      <h2>23. Indenização</h2>

      <p>Você poderá ser responsabilizado por danos, perdas, custos, despesas, reclamações, disputas, chargebacks, multas, condenações ou prejuízos causados ao Pétala/Bloom, a criadoras, a outros usuários ou a terceiros quando decorrerem de:</p>

      <ul>
        <li>fraude;</li>
        <li>violação destes Termos;</li>
        <li>conteúdo ilegal;</li>
        <li>uso de conta de terceiros;</li>
        <li>documento falso;</li>
        <li>pagamento por fora;</li>
        <li>contestação abusiva;</li>
        <li>vazamento de conteúdo;</li>
        <li>gravação não autorizada;</li>
        <li>violação de privacidade;</li>
        <li>violação de direitos de terceiros;</li>
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

      <p>Para usar a plataforma ou determinadas funcionalidades, você poderá precisar marcar aceites destacados, curtos e objetivos.</p>

      <p>Exemplos:</p>

      <ul>
        <li>"Declaro que tenho 18 anos ou mais.";</li>
        <li>"Li e aceito os Termos e políticas aplicáveis.";</li>
        <li>"Entendo que pétalas são créditos internos de uso fechado, conforme os Termos.";</li>
        <li>"Li e aceito as regras de conteúdo, consentimento, denúncia, bloqueio e banimento.";</li>
        <li>"Aceito as regras de compra, uso de pétalas, reembolso e revisão financeira."</li>
      </ul>

      <p>Os detalhes completos ficam no corpo destes Termos e das políticas aplicáveis.</p>

      <h2>27. Contato</h2>

      <p>Você pode entrar em contato com o Pétala/Bloom pelos canais oficiais de suporte disponibilizados na plataforma.</p>

      <p>Use os canais oficiais para:</p>

      <ul>
        <li>dúvidas sobre conta;</li>
        <li>problemas de acesso;</li>
        <li>dúvidas sobre pétalas;</li>
        <li>pedidos de suporte;</li>
        <li>denúncias;</li>
        <li>revisão de cobrança;</li>
        <li>questões de privacidade;</li>
        <li>segurança.</li>
      </ul>

      <p>Não use canais externos ou terceiros para tentar burlar pagamentos, moderação, regras de segurança ou suporte oficial.</p>

      <h2>28. Disposições finais</h2>

      <p>Se qualquer parte destes Termos for considerada inválida ou inaplicável, as demais disposições continuarão válidas na maior extensão permitida pela lei.</p>

      <p>A eventual tolerância da plataforma em relação a uma violação não significa renúncia de direitos.</p>

      <p>Estes Termos se aplicam em conjunto com políticas específicas, avisos exibidos na plataforma, regras de funcionalidades e aceites destacados aplicáveis.</p>

      <p>Ao usar o Pétala/Bloom, você reconhece que a plataforma deve ser usada com respeito, consentimento, segurança, boa-fé e responsabilidade.</p>
    </LegalPageLayout>
  )
}
