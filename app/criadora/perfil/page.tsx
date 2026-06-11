import Link from 'next/link'
import { CreatorAreaShell } from '@/components/criadora/CreatorAreaShell'
import { requireCreatorAreaPage } from '@/lib/auth/require-creator-area'

export default async function CreatorProfilePage() {
  const { creator } = await requireCreatorAreaPage()
  const profilePhotoSrc = creator.photo_url
    ? `/api/fotos/perfil-url?creator_id=${encodeURIComponent(creator.id)}`
    : null

  return (
    <CreatorAreaShell
      section="perfil"
      title="Perfil"
      subtitle="Visualize seu perfil publico e organize os proximos ajustes de apresentacao."
      creator={creator}
    >
      <div className="flex flex-col gap-4">
        <section className="overflow-hidden rounded-3xl border border-white/8 bg-[#111]">
          {profilePhotoSrc ? (
            <img src={profilePhotoSrc} alt="" className="h-48 w-full object-cover" />
          ) : (
            <div className="flex h-48 items-center justify-center bg-[#0d0d0d] text-sm text-white/30">
              Foto de perfil nao configurada
            </div>
          )}
          <div className="p-5">
            <h2 className="text-xl font-semibold">{creator.name || 'Perfil sem nome'}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              {creator.bio || 'Bio ainda nao preenchida.'}
            </p>
            <Link
              href={`/criadora/${creator.id}`}
              className="mt-5 block rounded-2xl bg-[#ff4d7d] px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Ver perfil publico
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/8 bg-[#111] p-4">
          <h2 className="text-sm font-semibold">Edicao de perfil</h2>
          <p className="mt-2 text-xs leading-relaxed text-white/40">
            A edicao completa de nome, bio, midia e preferencias sera conectada em bloco futuro. Por enquanto, esta tela centraliza a visualizacao e os pontos de revisao.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-3">
          {[
            ['Aparencia publica', 'Foto, nome, bio e texto de apresentacao.'],
            ['Conteudo', 'Album e publicacoes continuam no hub da creator por enquanto.'],
            ['Verificacao', 'Status de aprovacao e documentos ficam na area de verificacao.'],
          ].map(([label, body]) => (
            <div key={label} className="rounded-2xl border border-white/8 bg-[#111] p-4">
              <h3 className="text-sm font-semibold text-white">{label}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/40">{body}</p>
            </div>
          ))}
        </section>
      </div>
    </CreatorAreaShell>
  )
}
