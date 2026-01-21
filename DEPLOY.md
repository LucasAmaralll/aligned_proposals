# Guia de Deploy - Aligned Proposals

## 🚀 Deploy em Produção

### Opções de Hospedagem

#### Backend
- **Railway** (Recomendado) - Fácil e gratuito para começar
- **Render** - Gratuito com limitações
- **Heroku** - Pago, mas confiável
- **DigitalOcean** - VPS tradicional
- **AWS/Azure** - Para escala

#### Frontend
- **Vercel** (Recomendado) - Otimizado para React
- **Netlify** - Alternativa popular
- **Cloudflare Pages** - Gratuito e rápido
- **GitHub Pages** - Simples

#### Banco de Dados
- **Supabase** (Recomendado) - PostgreSQL gerenciado grátis
- **Neon** - PostgreSQL serverless
- **Railway** - PostgreSQL incluído
- **Heroku Postgres** - Integração fácil

---

## 📦 Deploy do Backend (Railway)

### 1. Preparar o Projeto

```powershell
# Adicionar script de start no package.json do backend
# Já está configurado: "start": "node src/server.js"

# Criar arquivo Procfile (Railway detecta automaticamente)
# Não é necessário, mas pode criar:
echo "web: npm start" > backend/Procfile
```

### 2. Deploy

1. Acesse [railway.app](https://railway.app)
2. Conecte com GitHub
3. Clique em "New Project" → "Deploy from GitHub repo"
4. Selecione o repositório
5. Railway detectará automaticamente o Node.js

### 3. Configurar Variáveis de Ambiente

No Railway Dashboard, adicione:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://... (Railway cria automaticamente)
JWT_SECRET=sua-chave-super-secreta-production
FRONTEND_URL=https://seu-app.vercel.app
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
```

### 4. Rodar Migrations

No Railway Dashboard:
1. Vá em "Settings" → "Deploy"
2. Adicione comando de build: `npx prisma generate && npx prisma migrate deploy`
3. Ou use o Railway CLI:

```powershell
railway run npx prisma migrate deploy
```

### 5. Criar Planos

Acesse: `https://seu-backend.railway.app/api/plans/seed`

---

## 🌐 Deploy do Frontend (Vercel)

### 1. Preparar o Build

```powershell
cd frontend

# Criar arquivo vercel.json
```

**vercel.json:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 2. Deploy

```powershell
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Ou conectar pelo site
# 1. Acesse vercel.com
# 2. Import Git Repository
# 3. Configure o projeto
# 4. Deploy
```

### 3. Configurar Variáveis de Ambiente

No Vercel Dashboard:

```
REACT_APP_API_URL=https://seu-backend.railway.app/api
REACT_APP_PUBLIC_URL=https://seu-app.vercel.app
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 4. Deploy Automático

Vercel faz deploy automático a cada push no GitHub!

---

## 🗄️ Banco de Dados (Supabase)

### 1. Criar Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Escolha região (São Paulo)
4. Defina senha do banco

### 2. Obter Connection String

1. Settings → Database
2. Copie a "Connection string"
3. Substitua `[YOUR-PASSWORD]` pela sua senha

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

### 3. Usar no Railway

Cole a connection string na variável `DATABASE_URL`

---

## 🔐 Configurar Stripe em Produção

### 1. Ativar Modo Live

1. No Dashboard do Stripe, toggle para "Live mode"
2. Pegue as chaves `pk_live_...` e `sk_live_...`
3. Substitua nas variáveis de ambiente

### 2. Configurar Webhooks

1. Developers → Webhooks → Add endpoint
2. URL: `https://seu-backend.railway.app/api/payments/webhook/stripe`
3. Eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copie o Signing Secret para `STRIPE_WEBHOOK_SECRET`

### 3. Verificar Conta

- Complete o processo de verificação no Stripe
- Adicione informações bancárias para receber pagamentos
- Configure impostos se necessário

---

## ✉️ Configurar Email em Produção

### Gmail

1. Ative "Verificação em 2 etapas"
2. Gere uma "Senha de app" em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use no `.env`:

```
SMTP_USER=seu-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

### SendGrid (Recomendado para produção)

1. Crie conta em [sendgrid.com](https://sendgrid.com)
2. Crie API Key
3. Configure:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxx
```

---

## 🔒 Segurança em Produção

### Checklist

- [ ] Usar HTTPS em todos os endpoints
- [ ] JWT_SECRET forte e aleatório
- [ ] Variáveis de ambiente seguras (nunca commitar)
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Senhas com bcrypt (já implementado)
- [ ] Validação de inputs
- [ ] Logs de auditoria
- [ ] Backups automáticos do banco
- [ ] Monitoramento de erros

### Gerar JWT_SECRET Seguro

```powershell
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

---

## 📊 Monitoramento

### Sentry (Rastreamento de Erros)

1. Crie conta em [sentry.io](https://sentry.io)
2. Instale no backend:

```powershell
npm install @sentry/node
```

3. Configure no `server.js`:

```javascript
const Sentry = require("@sentry/node");

Sentry.init({ dsn: "https://..." });

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### Uptime Monitoring

- **UptimeRobot**: Monitora se o site está no ar
- **Pingdom**: Alternativa paga
- **Better Uptime**: Grátis para começar

---

## 🚦 Performance

### Backend

```javascript
// Compression
const compression = require('compression');
app.use(compression());

// Cache headers
app.use(express.static('uploads', {
  maxAge: '7d'
}));
```

### Frontend

```powershell
# Build otimizado
npm run build

# Análise do bundle
npm install -D webpack-bundle-analyzer
```

### CDN

Use CloudFlare para:
- Cache de assets
- DDoS protection
- SSL grátis

---

## 📦 CI/CD com GitHub Actions

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy Frontend
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
```

---

## 🔄 Backup

### Automático (Supabase)

- Backups diários automáticos no plano pago
- Exportar manualmente em Settings → Database

### Manual

```powershell
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql

# Agendar com cron (Linux) ou Task Scheduler (Windows)
```

---

## 🧪 Testes antes do Deploy

```powershell
# Backend
cd backend
npm test
npm run build

# Frontend
cd frontend
npm test
npm run build

# Testar build localmente
npx serve -s build
```

---

## 📝 Checklist de Deploy

### Antes do Deploy
- [ ] Todos os testes passando
- [ ] Build sem erros
- [ ] Variáveis de ambiente configuradas
- [ ] Stripe em modo test funcionando
- [ ] Backup do banco atual

### Durante o Deploy
- [ ] Migrations executadas
- [ ] Planos criados (`/api/plans/seed`)
- [ ] SSL ativo (HTTPS)
- [ ] CORS configurado
- [ ] Webhooks do Stripe ativos

### Depois do Deploy
- [ ] Criar conta de teste
- [ ] Criar orçamento de teste
- [ ] Testar PDF
- [ ] Testar WhatsApp
- [ ] Testar email
- [ ] Testar checkout Stripe
- [ ] Verificar logs

### Monitoramento
- [ ] Sentry configurado
- [ ] Uptime monitor ativo
- [ ] Alertas configurados
- [ ] Analytics instalado (Google Analytics)

---

## 🆘 Troubleshooting

### "Cannot connect to database"
- Verifique DATABASE_URL
- Firewall do Supabase configurado
- IP do Railway whitelisted

### "CORS Error"
- Adicione domínio do frontend no CORS
- Verifique FRONTEND_URL

### "Stripe webhook failed"
- Verifique STRIPE_WEBHOOK_SECRET
- URL do webhook correta no Stripe
- Endpoint acessível publicamente

---

## 💰 Custos Estimados

### Grátis (até 100 usuários)
- Railway: Grátis
- Vercel: Grátis
- Supabase: Grátis
- **Total: R$ 0/mês**

### Pequeno (100-1000 usuários)
- Railway: $5/mês
- Vercel: Grátis
- Supabase: $25/mês
- SendGrid: Grátis (até 100/dia)
- **Total: ~$30/mês (R$ 150)**

### Médio (1000-10000 usuários)
- Railway: $20/mês
- Vercel: $20/mês
- Supabase: $25/mês
- SendGrid: $15/mês
- Sentry: $26/mês
- **Total: ~$106/mês (R$ 530)**

---

**Pronto para produção!** 🎉

Qualquer dúvida, consulte a documentação oficial das plataformas.
