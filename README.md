# Aligned Proposals 🚀

Sistema SaaS completo para geração de orçamentos e propostas comerciais online.

## 📋 Sobre o Projeto

Aligned Proposals é uma plataforma web que permite criar, gerenciar e enviar orçamentos profissionais de forma rápida e eficiente. Com interface moderna e intuitiva, o sistema oferece:

- ✅ Geração de orçamentos em PDF
- ✅ Envio gratuito via WhatsApp Web
- ✅ Página pública para visualização
- ✅ Sistema de planos e assinaturas
- ✅ Dashboard com métricas

## 📚 Documentação Completa

- 📘 [**START.md**](START.md) - Guia de boas-vindas e início rápido
- ⚡ [**QUICKSTART.md**](QUICKSTART.md) - Instalação em 5 minutos
- ✨ [**FEATURES.md**](FEATURES.md) - Lista completa de funcionalidades
- 🔌 [**API.md**](API.md) - Documentação completa da API REST
- 🏗️ [**STRUCTURE.md**](STRUCTURE.md) - Estrutura detalhada do projeto
- 🚀 [**DEPLOY.md**](DEPLOY.md) - Guia de deploy em produção
- 📜 [**SCRIPTS.md**](SCRIPTS.md) - Comandos úteis e troubleshooting
- 🗺️ [**ROADMAP.md**](ROADMAP.md) - Planejamento de versões futuras
- 🎨 [**VISUAL.md**](VISUAL.md) - Mockups e design system
- ❓ [**FAQ.md**](FAQ.md) - Perguntas frequentes
- 📝 [**CHANGELOG.md**](CHANGELOG.md) - Histórico de versões
- 🤝 [**CONTRIBUTING.md**](CONTRIBUTING.md) - Guia para contribuidores
- 🔒 [**SECURITY.md**](SECURITY.md) - Política de segurança

## 🏗️ Arquitetura

### Frontend
- **React 18** - Biblioteca UI
- **Tailwind CSS** - Framework CSS
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **React Icons** - Ícones

### Backend
- **Node.js + Express** - Servidor HTTP
- **Prisma ORM** - Gerenciamento de banco
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **PDFKit** - Geração de PDF
- **Multer** - Upload de arquivos

## 📁 Estrutura do Projeto

```
aligned-proposals/
├── frontend/                 # Aplicação React
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── context/        # Context API
│   │   ├── services/       # Serviços/API
│   │   └── App.jsx
│   └── package.json
│
├── backend/                 # API Node.js
│   ├── src/
│   │   ├── controllers/    # Lógica de negócio
│   │   ├── routes/         # Rotas da API
│   │   ├── middlewares/    # Middlewares
│   │   ├── services/       # Serviços (PDF, Email)
│   │   └── server.js
│   ├── prisma/
│   │   └── schema.prisma   # Schema do banco
│   └── package.json
│
└── README.md
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd aligned-proposals
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Crie um arquivo `.env` na pasta `backend`:

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/aligned_proposals"

# JWT
JWT_SECRET="sua-chave-secreta-super-segura-aqui-123"

# Servidor
PORT=5000
NODE_ENV=development

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Stripe (Modo Test/Sandbox)
STRIPE_SECRET_KEY=sk_test_sua_chave_aqui
STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
STRIPE_WEBHOOK_SECRET=whsec_sua_chave_aqui

# Email (opcional - para envio de orçamentos)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
```

Execute as migrations do Prisma:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Inicie o servidor:

```bash
npm run dev
```

O backend estará rodando em `http://localhost:5000`

### 3. Configurar Frontend

```bash
cd frontend
npm install
```

Crie um arquivo `.env` na pasta `frontend`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_PUBLIC_URL=http://localhost:3000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
```

Inicie o aplicativo:

```bash
npm start
```

O frontend estará rodando em `http://localhost:3000`

## 💳 Configuração do Stripe (Pagamentos)

### Criar Conta Stripe

1. Acesse [https://stripe.com](https://stripe.com) e crie uma conta
2. No Dashboard, clique em "Developers" → "API Keys"
3. Copie suas chaves de teste (começam com `pk_test_` e `sk_test_`)
4. Cole no arquivo `.env` do backend e frontend

### Configurar Produtos e Preços

No Dashboard do Stripe:
1. Vá em "Products" → "Add Product"
2. Crie os produtos:
   - **Plano Básico**: R$ 19,90/mês
   - **Plano Pro**: R$ 49,90/mês
3. Anote os Price IDs (começam com `price_`)
4. Configure no backend em `src/config/plans.js`

### Webhooks (Opcional)

Para receber notificações de pagamento:
1. Vá em "Developers" → "Webhooks"
2. Adicione endpoint: `http://seu-dominio.com/api/webhooks/stripe`
3. Selecione eventos: `checkout.session.completed`, `customer.subscription.updated`
4. Copie o Signing Secret para `STRIPE_WEBHOOK_SECRET`

**💰 Onde o dinheiro cai?**
- No modo test, os pagamentos são simulados
- No modo produção, o dinheiro cai na conta bancária vinculada ao Stripe
- Configure em "Settings" → "Payouts" no Dashboard

## 📱 Envio via WhatsApp Web

### Como Funciona

O sistema usa o **WhatsApp Web gratuito** através de deep linking. Não requer API paga nem integração complexa.

Quando você clica em "Enviar via WhatsApp":
1. O sistema abre uma nova aba do navegador
2. Redireciona para `https://api.whatsapp.com/send?phone={numero}&text={mensagem}`
3. O WhatsApp Web abre com a mensagem pré-preenchida
4. Você clica em "Enviar"

**Vantagens:**
- ✅ 100% gratuito
- ✅ Sem necessidade de configuração
- ✅ Funciona em qualquer dispositivo

**Limitações:**
- ⚠️ Requer ação manual do usuário
- ⚠️ Não funciona totalmente automatizado

### Formato do Número

O número do cliente deve estar no formato internacional:
- **Correto**: 5511987654321 (código país + DDD + número)
- **Errado**: (11) 98765-4321

O sistema formata automaticamente se o número estiver com caracteres especiais.

### Migração para API Oficial (Futuro)

Se você quiser **automatizar completamente** o envio (sem interação manual), pode integrar uma API paga:

#### Opção 1: Z-API (Brasileira)
```bash
# Instalar
npm install axios

# Configurar
ZAPI_TOKEN=seu_token
ZAPI_INSTANCE=sua_instancia
```

```javascript
// services/whatsapp.js
async function sendWhatsApp(phone, message) {
  await axios.post(
    `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`,
    { phone, message }
  );
}
```

**Custo**: ~R$ 49/mês
**Site**: [z-api.io](https://z-api.io)

#### Opção 2: Twilio
```bash
npm install twilio
```

```javascript
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

await client.messages.create({
  from: 'whatsapp:+14155238886',
  to: `whatsapp:+${phone}`,
  body: message
});
```

**Custo**: $0.005 por mensagem
**Site**: [twilio.com](https://twilio.com)

#### Opção 3: Meta WhatsApp Business API
- Mais complexa, requer aprovação
- Gratuita para conversas iniciadas pelo cliente
- Requer Facebook Business Manager
- **Site**: [developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)

## 📊 Planos de Assinatura

### Gratuito
- ✅ Até 3 orçamentos/mês
- ⚠️ PDF com marca d'água
- ✅ Link público de visualização

### Básico - R$ 19,90/mês
- ✅ Até 20 orçamentos/mês
- ✅ PDF sem marca d'água
- ✅ Envio por email e WhatsApp
- ✅ Logo personalizada

### Pro - R$ 49,90/mês
- ✅ Orçamentos ilimitados
- ✅ Relatórios e métricas
- ✅ Envio automático
- ✅ Suporte prioritário

## 🎨 Layout e Design

O sistema usa **Tailwind CSS** com uma paleta de cores profissional:
- **Primária**: Azul (#3B82F6)
- **Secundária**: Cinza (#6B7280)
- **Sucesso**: Verde (#10B981)
- **Alerta**: Amarelo (#F59E0B)
- **Erro**: Vermelho (#EF4444)

**Ícones**: Heroicons (importados via react-icons)

## 🔐 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Autenticação JWT
- ✅ Rotas protegidas por middleware
- ✅ Validação de inputs
- ✅ Rate limiting (previne spam)
- ✅ CORS configurado

## 📧 Envio de Email

Para enviar orçamentos por email, configure um SMTP:

**Gmail:**
1. Ative "Verificação em 2 etapas"
2. Gere uma "Senha de app" em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use no `.env`:
```env
SMTP_USER=seuemail@gmail.com
SMTP_PASS=senha-de-app-gerada
```

## 🧪 Testes

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 🚀 Deploy

### Backend (Heroku/Railway/Render)
```bash
# Configurar variáveis de ambiente
# Fazer deploy
git push heroku main
```

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy da pasta build/
```

### Banco de Dados (Supabase/Neon)
- Use PostgreSQL gerenciado
- Copie a URL de conexão para `DATABASE_URL`

## 📝 Licença

MIT License - Sinta-se livre para usar em projetos pessoais e comerciais.

## 🤝 Contribuindo

Contribuições são bem-vindas! Abra uma issue ou pull request.

## 📧 Suporte

Para dúvidas, abra uma issue no GitHub ou entre em contato.

---

**Desenvolvido com ❤️ usando React, Node.js e Tailwind CSS**
