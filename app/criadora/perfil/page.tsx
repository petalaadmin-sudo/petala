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
      subtitle="Visualize seu perfil público e organize os próximos ajustes de apresentação."
      creator={creator}
    >
      <div className="flex flex-col gap-4">
        <section className="overflow-hidden rounded-3xl border border-white/8 bg-[#111]">
          {profilePhotoSrc ? (
            <img src={profilePhotoSrc} alt="" className="h-48 w-full object-cover" />
          ) : (
            <div className="flex h-48 items-center justify-center bg-[#0d0d0d] text-sm text-white/30">
              Foto de perfil não configurada
            </div>
          )}
          <div className="p-5">
            <h2 className="text-xl font-semibold">{creator.name || 'Perfil sem nome'}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              {creator.bio || 'Bio ainda não preenchida.'}
            </p>
            <Link
              href={`/criadora/${creator.id}`}
              className="mt-5 block rounded-2xl bg-[#ff4d7d] px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Ver perfil público
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/8 bg-[#111] p-4">
          <h2 className="text-sm font-semibold">Edição de perfil</h2>
          <p className="mt-2 text-xs leading-relaxed text-white/40">
            A edição completa de nome, bio, mídia e preferências será liberada em uma próxima etapa. Por enquanto, esta tela centraliza a visualização e os pontos de revisão.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-3">
          {[
            ['Aparência pública', 'Foto, nome, bio e texto de apresentação.'],
            ['Conteúdo', 'Álbum e publicações continuam nesta área por enquanto.'],
            ['Verificação', 'Status de aprovação e documentos ficam na área de verificação.'],
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
