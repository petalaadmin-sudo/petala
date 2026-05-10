# 🚀 Checklist de Lançamento — Pétala

Use este checklist antes de abrir o app para usuários reais.
Marque cada item conforme for concluindo.

---

## 1. Infraestrutura

- [ ] Supabase projeto criado (não usar o free tier em produção — usar Pro)
- [ ] Todas as migrations executadas em ordem (001 → 005)
- [ ] Row Level Security habilitado em todas as tabelas
- [ ] Bucket `verificacoes` criado no Supabase Storage (privado)
- [ ] pg_cron habilitado para o job de ranking semanal
- [ ] Cloudflare R2 bucket `petala-media` criado com CORS configurado
- [ ] Vercel projeto criado e vinculado ao repositório
- [ ] Todas as variáveis de ambiente configuradas na Vercel

---

## 2. Autenticação e Segurança

- [ ] Google OAuth configurado no Supabase (redirect URL: supabase.co/auth/v1/callback)
- [ ] Apple OAuth configurado no Supabase
- [ ] Middleware de proteção de rotas testado
- [ ] Gate de idade funcionando (teste com usuário novo)
- [ ] Admin criado: `UPDATE users SET role = 'admin' WHERE email = 'seu@email.com'`

---

## 3. Pagamentos

- [ ] Conta Paggue ou Zoop criada e aprovada (conteúdo adulto)
- [ ] API Key e Webhook Secret configurados
- [ ] URL de webhook cadastrada no painel Paggue: `https://petala.app/api/pix/webhook`
- [ ] Teste de pagamento ponta a ponta com Pix real
- [ ] Idempotência do webhook testada (simule chamada dupla)

---

## 4. PWA

- [ ] Ícones gerados em todos os tamanhos (`npm run generate-icons`)
- [ ] Manifest.json validado no Lighthouse
- [ ] Service worker funcionando (teste em modo offline)
- [ ] Instalação no iOS testada (Safari → Compartilhar → Adicionar à Tela)
- [ ] Instalação no Android testada (Chrome → banner automático)
- [ ] Score PWA no Lighthouse: mínimo 90

---

## 5. Criadoras (antes de abrir para usuários)

- [ ] Mínimo 10 criadoras verificadas e com perfil ativo
- [ ] Cada criadora com pelo menos 2 fotos gratuitas + 2 pagas no álbum
- [ ] Presença online testada (heartbeat a cada 30s)
- [ ] Chat de texto testado ponta a ponta
- [ ] Billing por minuto testado (cobrado após 60s)
- [ ] Envio de presente testado (débito usuário + crédito 70% criadora)

---

## 6. Conformidade Legal

- [ ] Página de Termos de Uso publicada
- [ ] Página de Política de Privacidade publicada
- [ ] Confirmação de +18 anos registrada em `users.age_confirmed_at`
- [ ] Verificação de identidade de todas as criadoras (RG + selfie + CPF)
- [ ] Logs de sessão armazenados (para compliance)
- [ ] DMCA e canal de denúncia configurados

---

## 7. Monitoring

- [ ] Sentry configurado (captura erros Next.js + Edge functions)
- [ ] Vercel Analytics ativo
- [ ] Alertas de erro no webhook Pix (falha = perda de receita)
- [ ] Uptime monitor configurado (ex: UptimeRobot)

---

## 8. Seed e testes finais

```bash
# Preenche o banco com dados de teste
npx tsx scripts/seed.ts

# Contas criadas pelo seed:
# 👤 Usuário:  teste@petala-test.com / Teste@123 (500 🌸)
# 👩 Criadora: yasmin@petala-test.com / Teste@123
# 🔑 Admin:    admin@petala-test.com / Admin@123
```

Checklist de teste manual:
- [ ] Login com Google funciona
- [ ] Gate de +18 redireciona menor para /auth/bloqueado
- [ ] Feed carrega criadoras com status online correto
- [ ] Perfil da criadora mostra álbum com blur hash nas fotos bloqueadas
- [ ] Desbloqueio de foto debita pétalas e exibe foto real
- [ ] Iniciar chat verifica saldo mínimo (5 min)
- [ ] Billing a cada 60s funciona e encerra sessão por saldo insuficiente
- [ ] Envio de presente aparece em tempo real para a criadora
- [ ] Compra Pix gera QR Code e credita ao confirmar
- [ ] Upload de foto pela criadora gera blur hash
- [ ] Painel admin lista verificações pendentes e aprova
- [ ] PWA instala corretamente no iOS e Android

---

## 9. Soft launch

1. Convide 5-10 usuários de confiança para testar
2. Colete feedback por 1 semana
3. Corrija bugs críticos
4. Abra para 50 usuários via link direto
5. Monitore métricas: conversão de compra, churn de sessão, NPS

---

**Contato técnico:** Qualquer dúvida sobre a stack, abra uma conversa com Claude.
