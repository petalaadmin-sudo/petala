export const LEGAL_INDEX_ROUTE = '/termos' as const

export type LegalDocumentSlug =
  | 'termos-usuario'
  | 'termos-criadora'
  | 'termos-agencia'
  | 'privacidade'
  | 'conteudo-seguranca'
  | 'petalas-reembolso'

export type LegalDocumentMeta = {
  slug: LegalDocumentSlug
  title: string
  route: string
  source: string
  version: string
  audience: string
  description: string
  published: false
}

export const PUBLIC_LEGAL_DOCUMENTS = {
  'termos-usuario': {
    slug: 'termos-usuario',
    title: 'Termos de Uso do Usuário',
    route: '/termos/usuario',
    source: 'docs/publico-termos-usuario-v1.md',
    version: 'v1',
    audience: 'Usuários',
    description: 'Regras públicas-base para usuários do Pétala/Bloom.',
    published: false,
  },
  'termos-criadora': {
    slug: 'termos-criadora',
    title: 'Termos da Criadora',
    route: '/termos/criadora',
    source: 'docs/publico-termos-criadora-v1.md',
    version: 'v1',
    audience: 'Criadoras',
    description: 'Regras públicas-base para criadoras do Pétala/Bloom.',
    published: false,
  },
  'termos-agencia': {
    slug: 'termos-agencia',
    title: 'Termos da Agência',
    route: '/termos/agencia',
    source: 'docs/publico-termos-agencia-v1.md',
    version: 'v1',
    audience: 'Agências',
    description: 'Regras públicas-base para agências e representantes autorizados.',
    published: false,
  },
  privacidade: {
    slug: 'privacidade',
    title: 'Política de Privacidade',
    route: '/privacidade',
    source: 'docs/publico-politica-privacidade-v1.md',
    version: 'v1',
    audience: 'Todos',
    description: 'Política pública-base sobre privacidade e tratamento de dados.',
    published: false,
  },
  'conteudo-seguranca': {
    slug: 'conteudo-seguranca',
    title: 'Política de Conteúdo e Segurança 18+',
    route: '/politicas/conteudo',
    source: 'docs/publico-politica-conteudo-seguranca-v1.md',
    version: 'v1',
    audience: 'Todos',
    description: 'Política pública-base sobre conteúdo, consentimento, segurança e moderação.',
    published: false,
  },
  'petalas-reembolso': {
    slug: 'petalas-reembolso',
    title: 'Política de Pétalas, Reembolso e Contestação',
    route: '/politicas/petalas-reembolso',
    source: 'docs/publico-politica-petalas-reembolso-v1.md',
    version: 'v1',
    audience: 'Todos',
    description: 'Política pública-base sobre pétalas, reembolso, contestação e revisão financeira.',
    published: false,
  },
} as const satisfies Record<LegalDocumentSlug, LegalDocumentMeta>

export const PUBLIC_LEGAL_ROUTES = [
  LEGAL_INDEX_ROUTE,
  '/termos/usuario',
  '/termos/criadora',
  '/termos/agencia',
  '/privacidade',
  '/politicas/conteudo',
  '/politicas/petalas-reembolso',
] as const

export function getPublicLegalDocument(slug: LegalDocumentSlug) {
  return PUBLIC_LEGAL_DOCUMENTS[slug]
}
