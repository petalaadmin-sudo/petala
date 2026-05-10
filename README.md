# 🌸 Pétala — Setup completo

App de conteúdo sensual com criadoras brasileiras. PWA, Next.js 14, Supabase, Cloudflare R2.

## Pré-requisitos

- Node.js 18+
- Conta Supabase (supabase.com)
- Conta Cloudflare (para R2)
- Conta Paggue ou Zoop (gateway Pix)
- Conta Daily.co (vídeo)

---

## 1. Clonar e instalar

```bash
git clone https://github.com/seu-usuario/petala
cd petala
npm install
```

---

## 2. Configurar Supabase

### 2.1 Criar projeto
- Acesse app.supabase.com → New Project
- Anote: Project URL e anon key

### 2.2 Rodar o schema
```bash
# No SQL Editor do Supabase, cole e execute:
cat supabase/schema.sql
```

### 2.3 Configurar Auth providers

**Google:**
1. console.cloud.google.com → APIs → Credentials → OAuth 2.0
2. Authorized redirect URIs: `https://SEU_PROJETO.supabase.co/auth/v1/callback`
3. Cole Client ID e Secret no Supabase → Auth → Providers → Google

**Apple:**
1. developer.apple.com → Certificates → Sign In with Apple
2. Siga a documentação do Supabase: https://supabase.com/docs/guides/auth/social-login/auth-apple

---

## 3. Configurar Cloudflare R2

```bash
# 1. No dashboard Cloudflare → R2 → Create bucket
# Nome: petala-media
# Habilite CORS para seu domínio

# 2. API Tokens → Create Token com permissão R2
# Anote: Account ID, Access Key, Secret Key
```

**CORS do bucket R2** (cole no painel):
```json
[
  {
    "AllowedOrigins": ["https://petala.app", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 4. Variáveis de ambiente

```bash
cp .env.example .env.local
# Preencha todas as variáveis
```

---

## 5. Rodar em desenvolvimento

```bash
npm run dev
# http://localhost:3000
```

---

## 6. Deploy na Vercel

```bash
# Instala Vercel CLI
npm i -g vercel

# Deploy
vercel

# Adicione as env vars no dashboard da Vercel
# Settings → Environment Variables
```

---

## Estrutura do projeto

```
petala/
├── app/
│   ├── page.tsx              # Splash
│   ├── layout.tsx            # Root layout (PWA meta)
│   ├── feed/                 # Feed TikTok (próxima etapa)
│   ├── criadora/[id]/        # Perfil da criadora
│   ├── auth/
│   │   ├── login/page.tsx    # Login Google/Apple/Email
│   │   ├── idade/page.tsx    # Gate de confirmação de idade
│   │   └── bloqueado/page.tsx
│   └── api/
│       ├── auth/callback/    # OAuth callback
│       └── pix/              # Webhook Paggue (próxima etapa)
├── components/
│   └── ui/
│       └── PWAInstallBanner.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser client
│   │   └── server.ts         # Server + Admin client
│   └── hooks/
│       └── usePWA.ts         # Hook de instalação PWA
├── types/
│   └── database.ts           # Types do Supabase
├── supabase/
│   └── schema.sql            # Schema completo + RLS + funções
├── public/
│   └── manifest.json         # PWA manifest
├── middleware.ts              # Proteção de rotas + sessão
├── next.config.js             # PWA config
└── tailwind.config.ts
```

---

## Próximas etapas

- [ ] Integração Pix (Paggue webhook)
- [ ] Feed TikTok (Supabase Realtime)
- [ ] Upload de fotos (R2 + blur hash)
- [ ] Chat ao vivo (Daily.co WebRTC)
- [ ] Push notifications (OneSignal)
- [ ] Dashboard da criadora
- [ ] Ranking semanal

---

## Fluxo de pétalas (resumo técnico)

```
Compra Pix → webhook Paggue → credit_petals() → balance_petals++
Chat vídeo → timer → spend_petals() a cada minuto → balance_petals--
Presente   → send_gift() → spend 100% usuário → earn 70% criadora
Saque      → criadora solicita → payout manual via Pix (sexta-feira)
```

A função `spend_petals()` usa `FOR UPDATE` no PostgreSQL — sem race condition mesmo com múltiplas requisições simultâneas.
