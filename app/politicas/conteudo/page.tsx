import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { PUBLIC_LEGAL_DOCUMENTS } from '@/lib/legal/public-documents'

const document = PUBLIC_LEGAL_DOCUMENTS['conteudo-seguranca']

export default function LegalDocumentPage() {
  return (
    <LegalPageLayout
      title={document.title}
      description={document.description}
      version={document.version}
    >
      <p>Esta Política explica as regras de conteúdo, interação, segurança, consentimento, privacidade, denúncias e moderação do Pétala/Bloom.</p>

      <p>O Pétala/Bloom é uma plataforma 18+ discreta, premium e honesta. O uso da plataforma é permitido apenas para pessoas maiores de 18 anos.</p>

      <p>Ao criar conta, acessar, publicar, enviar mensagem, participar de chamada, enviar presente, interagir com criadoras, usuários, agências ou usar qualquer funcionalidade, você declara que leu, entendeu e aceita esta Política, os Termos aplicáveis e as regras exibidas na plataforma.</p>

      <h2>1. Plataforma 18+</h2>

      <p>O Pétala/Bloom é destinado exclusivamente a pessoas maiores de 18 anos.</p>

      <p>Menores de idade não podem:</p>

      <ul>
        <li>criar conta;</li>
        <li>acessar a plataforma;</li>
        <li>participar de mensagens;</li>
        <li>participar de chamadas;</li>
        <li>aparecer em perfil, foto, vídeo, chamada, mensagem ou conteúdo;</li>
        <li>ser mencionados, representados, exibidos ou envolvidos em qualquer interação;</li>
        <li>usar conta de terceiro;</li>
        <li>ter conta criada por usuário, criadora, agência, agente, responsável ou qualquer outra pessoa.</li>
      </ul>

      <p>Conteúdo envolvendo menores de idade é proibido em qualquer circunstância.</p>

      <p>Se a plataforma identificar menoridade, suspeita de menoridade, documento falso, uso de conta por menor ou conteúdo envolvendo menor, poderá tomar medidas imediatas de segurança, incluindo bloqueio, remoção, preservação de registros, denúncia interna, revisão financeira e comunicação a autoridades ou provedores quando aplicável.</p>

      <h2>2. Consentimento</h2>

      <p>Consentimento é obrigatório em todas as interações.</p>

      <p>Pagamento, pétalas, presentes, promessas de benefício, elogios, tempo de conversa ou relacionamento prévio não compram consentimento.</p>

      <p>Ninguém é obrigado a:</p>

      <ul>
        <li>responder;</li>
        <li>continuar conversa;</li>
        <li>aceitar chamada;</li>
        <li>enviar foto;</li>
        <li>enviar vídeo;</li>
        <li>produzir conteúdo;</li>
        <li>realizar ato específico;</li>
        <li>manter contato;</li>
        <li>continuar uma interação;</li>
        <li>ultrapassar limites pessoais.</li>
      </ul>

      <p>Qualquer pessoa pode recusar, pausar, encerrar, bloquear ou denunciar uma interação.</p>

      <p>A ausência de resposta, a recusa, o encerramento de chamada ou o bloqueio devem ser respeitados.</p>

      <h2>3. Limites das criadoras</h2>

      <p>Criadoras mantêm autonomia sobre seus limites, disponibilidade, conteúdo, mensagens, chamadas, perfil e interações.</p>

      <p>Criadoras podem:</p>

      <ul>
        <li>definir limites;</li>
        <li>recusar pedidos;</li>
        <li>encerrar conversas;</li>
        <li>encerrar chamadas;</li>
        <li>bloquear usuários;</li>
        <li>denunciar condutas;</li>
        <li>decidir não produzir determinado conteúdo;</li>
        <li>decidir não participar de determinada interação.</li>
      </ul>

      <p>Criadoras não são obrigadas pela plataforma, usuários, agências, agentes ou terceiros a produzir conteúdo adulto, aceitar chamadas, responder mensagens, manter contato, realizar ato específico ou ultrapassar seus limites.</p>

      <p>A marca pública do Pétala/Bloom não rotula criadoras como adultas. A plataforma trata segurança, consentimento e maioridade com seriedade, sem vulgaridade e sem comunicação explícita desnecessária.</p>

      <h2>4. Conteúdos permitidos</h2>

      <p>Conteúdos e interações podem incluir apresentação pessoal, fotos, conversas, chamadas, presentes, perfis, interesses, mensagens e outras funcionalidades permitidas pela plataforma.</p>

      <p>Todo conteúdo deve respeitar:</p>

      <ul>
        <li>maioridade 18+;</li>
        <li>consentimento;</li>
        <li>privacidade;</li>
        <li>limites pessoais;</li>
        <li>direitos de terceiros;</li>
        <li>regras da plataforma;</li>
        <li>leis aplicáveis;</li>
        <li>segurança das pessoas envolvidas.</li>
      </ul>

      <p>A plataforma pode limitar, revisar, remover ou restringir conteúdos quando houver risco, denúncia, violação de regras, obrigação legal ou necessidade de proteger usuários, criadoras, agências, terceiros ou a própria plataforma.</p>

      <h2>5. Conteúdos e condutas proibidas</h2>

      <p>São proibidos, em qualquer área da plataforma:</p>

      <ul>
        <li>menores de idade;</li>
        <li>conteúdo envolvendo menores;</li>
        <li>tentativa de cadastrar menor;</li>
        <li>ocultação de menoridade;</li>
        <li>uso de documento falso;</li>
        <li>uso de documento de terceiro;</li>
        <li>terceiros não verificados em conteúdo, mensagens ou chamadas;</li>
        <li>conteúdo não consensual;</li>
        <li>ameaça;</li>
        <li>chantagem;</li>
        <li>coerção;</li>
        <li>assédio;</li>
        <li>perseguição;</li>
        <li>intimidação;</li>
        <li>exploração;</li>
        <li>aliciamento;</li>
        <li>tráfico de pessoas;</li>
        <li>fraude;</li>
        <li>manipulação de pagamento;</li>
        <li>contestação abusiva;</li>
        <li>burla de moderação;</li>
        <li>burla de segurança;</li>
        <li>burla de verificação;</li>
        <li>burla de pagamento;</li>
        <li>pagamento por fora;</li>
        <li>contato externo para burlar a plataforma;</li>
        <li>encontro presencial negociado pela plataforma;</li>
        <li>serviço presencial de natureza sexual;</li>
        <li>exposição de dados pessoais;</li>
        <li>identidade falsa;</li>
        <li>violação de privacidade;</li>
        <li>violação de direitos de terceiros;</li>
        <li>uso de conteúdo sem autorização;</li>
        <li>gravação, captura, retransmissão, vazamento ou compartilhamento sem autorização;</li>
        <li>tentativa de obrigar ato específico por ter pago, enviado pétalas ou enviado presente.</li>
      </ul>

      <p>A lista acima não limita outras medidas quando uma conduta colocar pessoas, contas, pagamentos, dados, reputação, segurança ou a plataforma em risco.</p>

      <h2>6. Menores de idade</h2>

      <p>Menores de idade não podem usar, acessar, aparecer, participar ou ser envolvidos na plataforma.</p>

      <p>É proibido:</p>

      <ul>
        <li>criar conta para menor;</li>
        <li>permitir que menor use conta de adulto;</li>
        <li>usar documento falso para ocultar menoridade;</li>
        <li>publicar foto, vídeo, áudio, mensagem ou referência envolvendo menor;</li>
        <li>envolver menor em chamada, conversa, presente, perfil, conteúdo ou interação;</li>
        <li>sugerir, solicitar, oferecer, simular ou promover qualquer conteúdo envolvendo menor.</li>
      </ul>

      <p>Qualquer suspeita relacionada a menoridade poderá gerar revisão imediata, bloqueio, preservação de registros e medidas cabíveis.</p>

      <h2>7. Terceiros não verificados</h2>

      <p>Conteúdos, chamadas e mensagens devem envolver apenas pessoas autorizadas e, quando exigido, verificadas pela plataforma.</p>

      <p>É proibido incluir terceiros não verificados em:</p>

      <ul>
        <li>fotos;</li>
        <li>vídeos;</li>
        <li>chamadas;</li>
        <li>mensagens;</li>
        <li>transmissão;</li>
        <li>conteúdo de perfil;</li>
        <li>conteúdo privado;</li>
        <li>qualquer interação que exija verificação, consentimento ou autorização.</li>
      </ul>

      <p>Também é proibido usar imagem, voz, nome, documento, dados pessoais, conteúdo ou identidade de terceiros sem autorização.</p>

      <h2>8. Conteúdo não consensual</h2>

      <p>Conteúdo não consensual é proibido.</p>

      <p>Isso inclui:</p>

      <ul>
        <li>publicar imagem, áudio, vídeo, captura ou mensagem sem autorização;</li>
        <li>pressionar alguém a produzir conteúdo;</li>
        <li>ameaçar divulgar conteúdo;</li>
        <li>usar conteúdo íntimo para chantagem;</li>
        <li>vazar conversas;</li>
        <li>compartilhar conteúdo privado fora da plataforma;</li>
        <li>gravar chamada sem autorização;</li>
        <li>capturar tela sem autorização;</li>
        <li>retransmitir interação sem autorização;</li>
        <li>criar, editar ou manipular conteúdo para simular consentimento.</li>
      </ul>

      <p>Consentimento deve ser livre, informado e respeitado. Ele pode ser retirado, e limites devem ser observados.</p>

      <h2>9. Gravação, captura e compartilhamento</h2>

      <p>É proibido gravar, capturar, retransmitir, copiar, vender, expor, vazar ou compartilhar conteúdo, mensagens, chamadas, perfis, fotos, vídeos, áudios ou dados de outra pessoa sem autorização.</p>

      <p>Essa regra se aplica dentro e fora da plataforma.</p>

      <p>Também é proibido publicar conteúdo privado do Pétala/Bloom em redes sociais, grupos, sites, aplicativos, arquivos compartilhados, ferramentas de inteligência artificial, bancos de dados ou qualquer canal externo sem permissão.</p>

      <p>Violações podem gerar remoção, bloqueio, banimento, revisão financeira, preservação de registros e medidas cabíveis.</p>

      <h2>10. Dados pessoais e exposição indevida</h2>

      <p>É proibido expor, solicitar, pressionar, coletar, vender ou compartilhar dados pessoais indevidamente.</p>

      <p>Exemplos de dados protegidos:</p>

      <ul>
        <li>documento;</li>
        <li>endereço;</li>
        <li>telefone;</li>
        <li>e-mail;</li>
        <li>chave Pix;</li>
        <li>dados bancários;</li>
        <li>redes sociais;</li>
        <li>local de trabalho;</li>
        <li>escola;</li>
        <li>localização;</li>
        <li>placa;</li>
        <li>dados familiares;</li>
        <li>imagem de terceiros;</li>
        <li>informações privadas.</li>
      </ul>

      <p>A plataforma pode remover conteúdo, restringir contato e adotar medidas quando houver exposição indevida de dados pessoais.</p>

      <h2>11. Pagamento por fora</h2>

      <p>Pagamentos devem ocorrer apenas pelos canais oficiais da plataforma.</p>

      <p>É proibido:</p>

      <ul>
        <li>pedir Pix direto;</li>
        <li>enviar Pix direto;</li>
        <li>combinar pagamento externo;</li>
        <li>usar conta bancária externa;</li>
        <li>usar carteira, link, código, assinatura ou checkout externo para burlar regras;</li>
        <li>oferecer desconto por fora;</li>
        <li>trocar contato externo para pagamento;</li>
        <li>prometer conteúdo ou interação fora da plataforma em troca de pagamento;</li>
        <li>orientar usuário ou criadora a evitar taxas, segurança, verificação ou regras do Pétala/Bloom.</li>
      </ul>

      <p>Pagamentos por fora podem colocar usuários e criadoras em risco e podem gerar bloqueio, banimento, revisão financeira e outras medidas cabíveis.</p>

      <h2>12. Contato externo para burlar regras</h2>

      <p>É proibido usar mensagens, chamadas, presentes, perfil, legenda, imagem, áudio ou qualquer recurso da plataforma para direcionar pessoas a contato externo com objetivo de burlar regras.</p>

      <p>Isso inclui tentativa de levar interações para:</p>

      <ul>
        <li>aplicativos de mensagem;</li>
        <li>redes sociais;</li>
        <li>sites externos;</li>
        <li>grupos privados;</li>
        <li>pagamentos externos;</li>
        <li>encontros presenciais;</li>
        <li>serviços presenciais;</li>
        <li>canais sem moderação ou sem proteção da plataforma.</li>
      </ul>

      <p>A plataforma pode revisar e restringir contas que tentem deslocar a interação para fora dos canais oficiais de forma abusiva, insegura ou contrária aos Termos.</p>

      <h2>13. Encontro presencial e serviço presencial proibido</h2>

      <p>O Pétala/Bloom não é uma plataforma de encontros presenciais, acompanhantes, agenciamento presencial ou serviços presenciais de natureza sexual.</p>

      <p>É proibido:</p>

      <ul>
        <li>negociar encontro presencial pela plataforma;</li>
        <li>oferecer encontro presencial;</li>
        <li>solicitar encontro presencial;</li>
        <li>prometer serviço presencial;</li>
        <li>cobrar por encontro presencial;</li>
        <li>combinar deslocamento para encontro;</li>
        <li>usar a plataforma para aliciamento, exploração ou intermediação presencial.</li>
      </ul>

      <p>Interações devem respeitar os limites da plataforma, a segurança das pessoas envolvidas e as leis aplicáveis.</p>

      <h2>14. Agências, agentes e terceiros</h2>

      <p>Agências, agentes, representantes e terceiros devem respeitar a autonomia das criadoras e as regras da plataforma.</p>

      <p>É proibido a agências, agentes e terceiros:</p>

      <ul>
        <li>coagir;</li>
        <li>ameaçar;</li>
        <li>chantagear;</li>
        <li>explorar;</li>
        <li>aliciar;</li>
        <li>traficar pessoas;</li>
        <li>cadastrar menor;</li>
        <li>ocultar menoridade;</li>
        <li>usar documento falso;</li>
        <li>usar documento de terceiro;</li>
        <li>reter documento;</li>
        <li>reter senha;</li>
        <li>controlar celular;</li>
        <li>controlar Pix;</li>
        <li>controlar conta bancária;</li>
        <li>impedir denúncia;</li>
        <li>impedir saída;</li>
        <li>obrigar conteúdo adulto;</li>
        <li>pressionar por conteúdo adulto;</li>
        <li>obrigar chamada;</li>
        <li>obrigar resposta a usuário;</li>
        <li>operar conta sem autorização válida;</li>
        <li>prometer ganhos falsos;</li>
        <li>manipular informações;</li>
        <li>fraudar indicação;</li>
        <li>criar perfil falso;</li>
        <li>esconder vínculo real;</li>
        <li>combinar pagamento por fora;</li>
        <li>solicitar Pix direto;</li>
        <li>negociar encontro presencial;</li>
        <li>negociar serviço presencial de natureza sexual;</li>
        <li>orientar burla de pagamento, verificação, moderação ou segurança.</li>
      </ul>

      <p>A agência atua como parceira operacional quando autorizada, nunca como dona da criadora, controladora da criadora ou substituta de seu consentimento.</p>

      <h2>15. Mensagens</h2>

      <p>Mensagens devem respeitar consentimento, privacidade, limites pessoais e regras da plataforma.</p>

      <p>É proibido usar mensagens para:</p>

      <ul>
        <li>ameaçar;</li>
        <li>chantagear;</li>
        <li>assediar;</li>
        <li>perseguir;</li>
        <li>pressionar;</li>
        <li>exigir ato específico;</li>
        <li>expor dados;</li>
        <li>compartilhar conteúdo não autorizado;</li>
        <li>solicitar pagamento por fora;</li>
        <li>combinar encontro presencial;</li>
        <li>negociar serviço presencial;</li>
        <li>burlar moderação;</li>
        <li>enviar conteúdo proibido;</li>
        <li>insistir após recusa, bloqueio ou silêncio.</li>
      </ul>

      <p>A plataforma pode limitar, bloquear, revisar ou moderar mensagens quando houver risco, denúncia, violação de regras ou necessidade de segurança.</p>

      <h2>16. Chamadas</h2>

      <p>Chamadas devem respeitar consentimento, maioridade, privacidade, limites e regras da plataforma.</p>

      <p>Qualquer pessoa pode encerrar uma chamada.</p>

      <p>É proibido em chamadas:</p>

      <ul>
        <li>incluir menor;</li>
        <li>incluir terceiro não verificado;</li>
        <li>gravar sem autorização;</li>
        <li>capturar tela sem autorização;</li>
        <li>retransmitir;</li>
        <li>exigir ato específico;</li>
        <li>ameaçar;</li>
        <li>chantagear;</li>
        <li>coagir;</li>
        <li>pressionar;</li>
        <li>expor dados;</li>
        <li>combinar pagamento por fora;</li>
        <li>combinar encontro presencial;</li>
        <li>negociar serviço presencial;</li>
        <li>praticar conduta proibida pelos Termos.</li>
      </ul>

      <p>Pagamento, pétalas ou presentes não obrigam criadora, usuário ou qualquer pessoa a continuar uma chamada ou realizar ato específico.</p>

      <h2>17. Presentes virtuais</h2>

      <p>Presentes virtuais são formas de interação dentro da plataforma.</p>

      <p>Presentes não compram:</p>

      <ul>
        <li>consentimento;</li>
        <li>resposta;</li>
        <li>chamada;</li>
        <li>conteúdo;</li>
        <li>ato específico;</li>
        <li>contato externo;</li>
        <li>relacionamento;</li>
        <li>disponibilidade futura;</li>
        <li>resultado específico.</li>
      </ul>

      <p>É proibido usar presentes como forma de pressão, cobrança, ameaça, chantagem, coerção ou tentativa de obrigar alguém a fazer algo.</p>

      <p>Presentes podem estar sujeitos a revisão financeira, de segurança ou de moderação quando houver fraude, denúncia, chargeback, abuso, violação de regras ou risco.</p>

      <h2>18. Denúncias</h2>

      <p>A plataforma pode disponibilizar canais para denunciar contas, conteúdos, mensagens, chamadas, presentes, perfis, agências, agentes, usuários, criadoras ou situações.</p>

      <p>Você pode denunciar, por exemplo:</p>

      <ul>
        <li>menoridade;</li>
        <li>suspeita de menoridade;</li>
        <li>conteúdo proibido;</li>
        <li>conteúdo não consensual;</li>
        <li>exposição de dados;</li>
        <li>ameaça;</li>
        <li>chantagem;</li>
        <li>coerção;</li>
        <li>assédio;</li>
        <li>exploração;</li>
        <li>aliciamento;</li>
        <li>fraude;</li>
        <li>pagamento por fora;</li>
        <li>contato externo para burlar regras;</li>
        <li>encontro presencial;</li>
        <li>serviço presencial;</li>
        <li>documento falso;</li>
        <li>agência abusiva;</li>
        <li>uso indevido de imagem;</li>
        <li>violação de privacidade.</li>
      </ul>

      <p>Denúncias devem ser feitas de boa-fé.</p>

      <p>Denúncias falsas, abusivas, fraudulentas ou feitas para prejudicar outra pessoa também podem gerar medidas.</p>

      <h2>19. Moderação</h2>

      <p>A plataforma pode moderar, revisar, remover, limitar, ocultar, bloquear ou restringir conteúdos, contas e funcionalidades para proteger pessoas e cumprir regras.</p>

      <p>A moderação pode ocorrer por:</p>

      <ul>
        <li>denúncia;</li>
        <li>revisão automática;</li>
        <li>revisão manual;</li>
        <li>suspeita de violação;</li>
        <li>exigência legal;</li>
        <li>segurança;</li>
        <li>fraude;</li>
        <li>risco financeiro;</li>
        <li>risco de privacidade;</li>
        <li>risco a menores;</li>
        <li>necessidade de proteger usuários, criadoras, agências ou a plataforma.</li>
      </ul>

      <p>A ausência de remoção imediata não significa aprovação do conteúdo ou renúncia ao direito de agir depois.</p>

      <h2>20. Medidas possíveis</h2>

      <p>Violações desta Política ou dos Termos podem gerar medidas proporcionais ao risco, gravidade, reincidência, evidência e contexto.</p>

      <p>As medidas podem incluir:</p>

      <ul>
        <li>aviso;</li>
        <li>orientação;</li>
        <li>remoção de conteúdo;</li>
        <li>ocultação de perfil;</li>
        <li>restrição de funcionalidade;</li>
        <li>bloqueio de mensagem;</li>
        <li>bloqueio de chamada;</li>
        <li>suspensão temporária;</li>
        <li>bloqueio de conta;</li>
        <li>banimento;</li>
        <li>revisão financeira;</li>
        <li>bloqueio de pétalas;</li>
        <li>bloqueio de presentes;</li>
        <li>bloqueio de ganhos;</li>
        <li>bloqueio de comissões;</li>
        <li>cancelamento de bônus;</li>
        <li>reversão de valores internos;</li>
        <li>preservação de registros;</li>
        <li>comunicação a provedores;</li>
        <li>comunicação a autoridades quando aplicável;</li>
        <li>medidas cabíveis conforme a lei e os Termos.</li>
      </ul>

      <p>A plataforma pode agir rapidamente quando houver risco a segurança, menoridade, fraude, consentimento, privacidade ou integridade da operação.</p>

      <h2>21. Privacidade e dados pessoais</h2>

      <p>A plataforma trata dados pessoais conforme a Política de Privacidade e as regras aplicáveis.</p>

      <p>Você deve respeitar a privacidade de outras pessoas e não deve coletar, armazenar, compartilhar, vender, expor ou usar dados pessoais de forma indevida.</p>

      <p>Também é proibido usar a plataforma para perseguir, localizar, identificar, intimidar ou expor alguém.</p>

      <p>Dados de verificação, documentos, informações de segurança e registros de moderação podem ser tratados para proteger a plataforma e as pessoas envolvidas, conforme regras aplicáveis.</p>

      <h2>22. Segurança da conta</h2>

      <p>Cada pessoa é responsável por proteger sua própria conta.</p>

      <p>Você não deve:</p>

      <ul>
        <li>compartilhar senha;</li>
        <li>vender conta;</li>
        <li>emprestar conta;</li>
        <li>usar conta de terceiro;</li>
        <li>permitir acesso de menor;</li>
        <li>permitir uso por pessoa não autorizada;</li>
        <li>criar conta falsa;</li>
        <li>manipular verificação;</li>
        <li>tentar acessar conta alheia;</li>
        <li>usar automação abusiva;</li>
        <li>burlar restrições.</li>
      </ul>

      <p>Se houver suspeita de acesso indevido, a plataforma pode restringir a conta e solicitar verificações adicionais.</p>

      <h2>23. Revisão financeira relacionada a conteúdo</h2>

      <p>Violações de conteúdo, segurança, consentimento, pagamento, menoridade, denúncia, fraude ou regras da plataforma podem afetar pétalas, presentes, compras, ganhos, comissões, pagamentos, bônus, créditos, funcionalidades e contas.</p>

      <p>Exemplos de situações que podem gerar revisão financeira:</p>

      <ul>
        <li>conteúdo proibido;</li>
        <li>denúncia grave;</li>
        <li>menoridade;</li>
        <li>documento falso;</li>
        <li>terceiro não verificado;</li>
        <li>falta de consentimento;</li>
        <li>pagamento por fora;</li>
        <li>fraude;</li>
        <li>chargeback;</li>
        <li>contestação abusiva;</li>
        <li>exploração;</li>
        <li>violação de privacidade;</li>
        <li>chamada ou mensagem em desacordo com regras.</li>
      </ul>

      <p>Valores, créditos, bônus, ganhos, comissões ou pagamentos associados a violações podem ser bloqueados, revisados, revertidos, cancelados ou considerados inelegíveis conforme os Termos.</p>

      <h2>24. Canais oficiais</h2>

      <p>Use apenas canais oficiais da plataforma para:</p>

      <ul>
        <li>criar conta;</li>
        <li>verificar identidade;</li>
        <li>enviar mensagem;</li>
        <li>participar de chamada;</li>
        <li>comprar pétalas;</li>
        <li>enviar presentes;</li>
        <li>pedir suporte;</li>
        <li>denunciar;</li>
        <li>receber orientações;</li>
        <li>resolver questões de conta;</li>
        <li>tratar pagamentos ou revisões.</li>
      </ul>

      <p>Não use canais externos para burlar pagamento, verificação, moderação, segurança, denúncia ou regras da plataforma.</p>

      <h2>25. Alterações da Política</h2>

      <p>O Pétala/Bloom pode atualizar esta Política para refletir mudanças de produto, segurança, moderação, operação, tecnologia, legislação, decisão judicial, exigência de parceiros ou melhoria de clareza.</p>

      <p>Quando uma alteração relevante exigir novo aceite, a plataforma poderá solicitar que você leia e aceite a versão atualizada para continuar usando determinadas funcionalidades.</p>

      <p>O uso da plataforma após atualização pode depender da aceitação da Política vigente.</p>

      <h2>26. Relação com outros termos</h2>

      <p>Esta Política se aplica em conjunto com:</p>

      <ul>
        <li>Termos de Uso do Usuário;</li>
        <li>Termos da Criadora;</li>
        <li>Termos da Agência;</li>
        <li>Política de Privacidade;</li>
        <li>Política de Pétalas, Reembolso e Contestação;</li>
        <li>Política de Denúncias;</li>
        <li>avisos exibidos na plataforma;</li>
        <li>regras específicas de funcionalidades;</li>
        <li>aceites destacados aplicáveis.</li>
      </ul>

      <p>Em caso de conflito entre documentos, a interpretação será feita conforme o contexto, a regra mais específica, os direitos legais aplicáveis e a finalidade de proteger pessoas, privacidade, consentimento, segurança e integridade da plataforma.</p>

      <h2>27. Aceites destacados</h2>

      <p>Para usar a plataforma ou determinadas funcionalidades, você poderá precisar marcar aceites destacados, curtos e objetivos.</p>

      <p>Exemplos:</p>

      <ul>
        <li>"Declaro que tenho 18 anos ou mais.";</li>
        <li>"Li e aceito as regras de conteúdo, consentimento, limites, denúncia, bloqueio e banimento.";</li>
        <li>"Entendo que pagamento, pétalas e presentes não compram consentimento ou ato específico.";</li>
        <li>"Aceito que violações podem gerar moderação, bloqueio e revisão financeira."</li>
      </ul>

      <p>Os detalhes completos ficam no corpo desta Política e dos Termos aplicáveis.</p>

      <h2>28. Disposições finais</h2>

      <p>Esta Política deve ser interpretada de forma compatível com boa-fé, segurança, consentimento, privacidade, direitos legais aplicáveis e proteção de usuários, criadoras, agências, terceiros e da plataforma.</p>

      <p>Se qualquer parte desta Política for considerada inválida ou inaplicável, as demais disposições continuarão válidas na maior extensão permitida pela lei.</p>

      <p>A eventual tolerância da plataforma em relação a uma violação não significa renúncia de direitos.</p>

      <p>Ao usar o Pétala/Bloom, você reconhece que esta plataforma é destinada a maiores de 18 anos e que todas as interações dependem de consentimento, limites e respeito às regras aplicáveis.</p>
    </LegalPageLayout>
  )
}
