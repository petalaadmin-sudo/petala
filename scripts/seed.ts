// scripts/seed.ts
// Popula o banco com dados de teste para validar o produto antes do lançamento
// Execute: npx tsx scripts/seed.ts

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // service_role para bypass RLS
)

// ── Dados de seed ──────────────────────────────────────────
const CREATORS = [
  {
    name: 'Yasmin',
    bio: 'Oi amor 🌹 Adoro um papo gostoso e sem pressa. Aqui você encontra atenção de verdade e conteúdo exclusivo 😈',
    price_text_petals: 5,
    price_video_petals: 20,
    rating: 4.97,
    rating_count: 312,
    total_gifts: 892,
    rank_weekly: 1,
  },
  {
    name: 'Lua',
    bio: 'Primeira semana aqui e já apaixonei muita gente 🦋 Vem ver o que preparei pra você...',
    price_text_petals: 5,
    price_video_petals: 15,
    rating: 4.91,
    rating_count: 89,
    total_gifts: 412,
    rank_weekly: 2,
  },
  {
    name: 'Iris',
    bio: 'Experiente e sem frescura 🌙 Venha ter uma conversa diferente de tudo que já teve.',
    price_text_petals: 8,
    price_video_petals: 25,
    rating: 4.88,
    rating_count: 567,
    total_gifts: 1240,
    rank_weekly: 3,
  },
  {
    name: 'Mel',
    bio: 'Adoro papo gostoso sem pressa ⭐ Meu álbum tem coisas que vão te surpreender...',
    price_text_petals: 5,
    price_video_petals: 20,
    rating: 4.82,
    rating_count: 203,
    total_gifts: 621,
    rank_weekly: 4,
  },
  {
    name: 'Nina',
    bio: 'Sou tímida mas o álbum fala por mim 🌸 Desbloqueie e descubra o que guardei só pra você.',
    price_text_petals: 3,
    price_video_petals: 10,
    rating: 4.75,
    rating_count: 44,
    total_gifts: 198,
    rank_weekly: 5,
  },
]

const PACKAGES = [
  { name: 'Semente',  petals: 100,   bonus_petals: 0,    price_brl: 19.90, sort_order: 1 },
  { name: 'Buquê',   petals: 300,   bonus_petals: 150,  price_brl: 39.90, sort_order: 2 },
  { name: 'Jardim',  petals: 700,   bonus_petals: 350,  price_brl: 79.90, sort_order: 3 },
  { name: 'Paraíso', petals: 2000,  bonus_petals: 1000, price_brl: 199.90, sort_order: 4 },
]

async function seed() {
  console.log('🌱 Iniciando seed do banco...\n')

  // 1. Pacotes de pétalas
  console.log('📦 Criando pacotes de pétalas...')
  await supabase.from('petal_packages').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  const { error: pkgErr } = await supabase.from('petal_packages').insert(PACKAGES)
  if (pkgErr) console.error('  ❌ Pacotes:', pkgErr.message)
  else console.log(`  ✓ ${PACKAGES.length} pacotes criados`)

  // 2. Usuários de teste para as criadoras
  console.log('\n👩 Criando criadoras de teste...')
  for (const creator of CREATORS) {
    // Cria auth user
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email:    `${creator.name.toLowerCase()}@petala-test.com`,
      password: 'Teste@123',
      email_confirm: true,
    })

    if (authErr) {
      console.error(`  ❌ Auth user ${creator.name}:`, authErr.message)
      continue
    }

    const userId = authUser.user.id

    // Atualiza role
    await supabase.from('users').update({ role: 'creator', age_confirmed: true, balance_petals: 500 }).eq('id', userId)

    // Cria perfil de criadora
    const { data: creatorData, error: cErr } = await supabase.from('creators').insert({
      user_id:            userId,
      name:               creator.name,
      bio:                creator.bio,
      verified:           true,
      verified_at:        new Date().toISOString(),
      active:             true,
      price_text_petals:  creator.price_text_petals,
      price_video_petals: creator.price_video_petals,
      rating:             creator.rating,
      rating_count:       creator.rating_count,
      total_gifts:        creator.total_gifts,
      rank_weekly:        creator.rank_weekly,
    }).select().single()

    if (cErr) {
      console.error(`  ❌ Creator ${creator.name}:`, cErr.message)
      continue
    }

    // Adiciona presença
    await supabase.from('creator_presence').upsert({
      creator_id: creatorData.id,
      online:     Math.random() > 0.3,  // 70% chance de estar online
      in_session: false,
    })

    // Adiciona fotos mock (2 gratuitas + 4 pagas)
    const photos = [
      { is_free: true,  price_petals: 0,  r2_key: `creators/${creatorData.id}/foto1.jpg`, blur_hash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4', sort_order: 10 },
      { is_free: true,  price_petals: 0,  r2_key: `creators/${creatorData.id}/foto2.jpg`, blur_hash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4', sort_order: 9 },
      { is_free: false, price_petals: 50, r2_key: `creators/${creatorData.id}/foto3.jpg`, blur_hash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4', sort_order: 8 },
      { is_free: false, price_petals: 50, r2_key: `creators/${creatorData.id}/foto4.jpg`, blur_hash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4', sort_order: 7, unlock_count: 23 },
      { is_free: false, price_petals: 100, r2_key: `creators/${creatorData.id}/foto5.jpg`, blur_hash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4', sort_order: 6, unlock_count: 67 },
      { is_free: false, price_petals: 150, r2_key: `creators/${creatorData.id}/foto6.jpg`, blur_hash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4', sort_order: 5, unlock_count: 12 },
    ]

    await supabase.from('album_photos').insert(photos.map(p => ({ ...p, creator_id: creatorData.id })))

    console.log(`  ✓ ${creator.name} — ID: ${creatorData.id}`)
  }

  // 3. Usuário de teste (comprador)
  console.log('\n👤 Criando usuário de teste...')
  const { data: testUser } = await supabase.auth.admin.createUser({
    email: 'teste@petala-test.com',
    password: 'Teste@123',
    email_confirm: true,
  })

  if (testUser?.user) {
    await supabase.from('users').update({
      age_confirmed:  true,
      balance_petals: 500,
      role:           'user',
    }).eq('id', testUser.user.id)
    console.log(`  ✓ Usuário teste: teste@petala-test.com / Teste@123 (500 🌸)`)
  }

  // 4. Admin
  console.log('\n🔑 Criando usuário admin...')
  const { data: adminUser } = await supabase.auth.admin.createUser({
    email: 'admin@petala-test.com',
    password: 'Admin@123',
    email_confirm: true,
  })

  if (adminUser?.user) {
    await supabase.from('users').update({ role: 'admin', age_confirmed: true }).eq('id', adminUser.user.id)
    console.log(`  ✓ Admin: admin@petala-test.com / Admin@123`)
    console.log(`  → Acesse o painel em: /admin`)
  }

  console.log('\n✅ Seed concluído!\n')
  console.log('Contas de teste:')
  console.log('  👤 Usuário:  teste@petala-test.com / Teste@123')
  console.log('  👩 Criadora: yasmin@petala-test.com / Teste@123')
  console.log('  🔑 Admin:    admin@petala-test.com / Admin@123')
}

seed().catch(console.error)
