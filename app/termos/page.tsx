import Link from 'next/link'

import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { PUBLIC_LEGAL_DOCUMENTS } from '@/lib/legal/public-documents'

const documents = [
  PUBLIC_LEGAL_DOCUMENTS['termos-usuario'],
  PUBLIC_LEGAL_DOCUMENTS['termos-criadora'],
  PUBLIC_LEGAL_DOCUMENTS['termos-agencia'],
  PUBLIC_LEGAL_DOCUMENTS.privacidade,
  PUBLIC_LEGAL_DOCUMENTS['conteudo-seguranca'],
  PUBLIC_LEGAL_DOCUMENTS['petalas-reembolso'],
]

export default function LegalIndexPage() {
  return (
    <LegalPageLayout
      title="Termos e Políticas"
      description="Documentos legais públicos-base do Pétala/Bloom, reunidos para consulta clara, discreta e responsável."
      version="v1"
      showIndexLink={false}
    >
      <p>
        O Pétala/Bloom é uma plataforma 18+ destinada exclusivamente a pessoas maiores de 18 anos.
      </p>

      <p>
        Esta área reúne os termos e políticas públicas-base relacionados ao uso da plataforma, privacidade, conteúdo, segurança, pétalas, reembolso e contestação.
      </p>

      <ul>
        {documents.map((document) => (
          <li key={document.slug}>
            <Link href={document.route}>{document.title}</Link>
            <span className="block text-xs leading-6 text-white/45">
              {document.description}
            </span>
          </li>
        ))}
      </ul>
    </LegalPageLayout>
  )
}
