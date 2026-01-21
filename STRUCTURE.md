# 📂 Estrutura Completa do Projeto

```
aligned-proposals/
│
├── 📄 README.md                    # Documentação principal
├── 📄 QUICKSTART.md                # Guia de instalação rápida
├── 📄 FEATURES.md                  # Lista de funcionalidades
├── 📄 API.md                       # Documentação da API
├── 📄 SCRIPTS.md                   # Scripts úteis
├── 📄 DEPLOY.md                    # Guia de deploy
├── 📄 ROADMAP.md                   # Roadmap futuro
├── 📄 LICENSE                      # Licença MIT
├── 📄 .gitignore                   # Arquivos ignorados
├── 📄 package.json                 # Scripts do projeto raiz
│
├── 📁 backend/                     # API Node.js
│   │
│   ├── 📁 src/
│   │   ├── 📁 controllers/         # Lógica de negócio
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── client.controller.js
│   │   │   ├── quote.controller.js
│   │   │   ├── plan.controller.js
│   │   │   └── payment.controller.js
│   │   │
│   │   ├── 📁 routes/              # Rotas da API
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── client.routes.js
│   │   │   ├── quote.routes.js
│   │   │   ├── plan.routes.js
│   │   │   └── payment.routes.js
│   │   │
│   │   ├── 📁 middlewares/         # Middlewares
│   │   │   └── auth.middleware.js
│   │   │
│   │   ├── 📁 services/            # Serviços externos
│   │   │   ├── pdf.service.js      # Geração de PDF
│   │   │   └── email.service.js    # Envio de email
│   │   │
│   │   └── 📄 server.js            # Servidor principal
│   │
│   ├── 📁 prisma/
│   │   └── 📄 schema.prisma        # Schema do banco de dados
│   │
│   ├── 📁 uploads/                 # Logos enviados (gitignored)
│   │
│   ├── 📄 package.json             # Dependências do backend
│   ├── 📄 .env.example             # Exemplo de variáveis
│   └── 📄 .gitignore
│
└── 📁 frontend/                    # Aplicação React
    │
    ├── 📁 public/
    │   └── 📄 index.html           # HTML base
    │
    ├── 📁 src/
    │   │
    │   ├── 📁 components/          # Componentes reutilizáveis
    │   │   ├── Sidebar.jsx         # Menu lateral
    │   │   ├── Header.jsx          # Cabeçalho
    │   │   ├── Button.jsx          # Botão customizado
    │   │   ├── Card.jsx            # Card container
    │   │   ├── Modal.jsx           # Modal popup
    │   │   ├── Input.jsx           # Input field
    │   │   ├── Loading.jsx         # Spinner de loading
    │   │   └── PrivateRoute.jsx    # Rota protegida
    │   │
    │   ├── 📁 pages/               # Páginas da aplicação
    │   │   ├── Login.jsx           # Página de login
    │   │   ├── Register.jsx        # Página de cadastro
    │   │   ├── Dashboard.jsx       # Dashboard principal
    │   │   ├── QuoteDetail.jsx     # Detalhes do orçamento
    │   │   └── PublicQuoteView.jsx # Visualização pública
    │   │
    │   ├── 📁 context/             # Context API
    │   │   └── AuthContext.jsx     # Contexto de autenticação
    │   │
    │   ├── 📁 services/            # Serviços/API
    │   │   └── api.js              # Cliente Axios
    │   │
    │   ├── 📁 utils/               # Utilitários
    │   │   └── helpers.js          # Funções auxiliares
    │   │
    │   ├── 📄 App.jsx              # Componente principal
    │   ├── 📄 index.js             # Entry point
    │   └── 📄 index.css            # Estilos globais + Tailwind
    │
    ├── 📄 package.json             # Dependências do frontend
    ├── 📄 tailwind.config.js       # Configuração Tailwind
    ├── 📄 postcss.config.js        # Configuração PostCSS
    ├── 📄 .env.example             # Exemplo de variáveis
    └── 📄 .gitignore
```

---

## 🗂️ Arquivos por Categoria

### 📋 Documentação (8 arquivos)
- README.md - Visão geral completa
- QUICKSTART.md - Instalação em 5 minutos
- FEATURES.md - Todas as funcionalidades
- API.md - Endpoints e exemplos
- SCRIPTS.md - Comandos úteis
- DEPLOY.md - Guia de produção
- ROADMAP.md - Futuro do projeto
- LICENSE - Licença MIT

### 🔧 Backend (18 arquivos)
**Controllers** (6):
- auth.controller.js - Autenticação
- user.controller.js - Perfil do usuário
- client.controller.js - Gestão de clientes
- quote.controller.js - Gestão de orçamentos
- plan.controller.js - Planos de assinatura
- payment.controller.js - Pagamentos Stripe

**Routes** (6):
- auth.routes.js
- user.routes.js
- client.routes.js
- quote.routes.js
- plan.routes.js
- payment.routes.js

**Services** (2):
- pdf.service.js - PDFKit
- email.service.js - Nodemailer

**Outros** (4):
- server.js - Express app
- auth.middleware.js - JWT
- schema.prisma - Banco
- package.json - Deps

### 🎨 Frontend (17 arquivos)
**Components** (8):
- Sidebar.jsx - Menu lateral
- Header.jsx - Cabeçalho
- Button.jsx - Botões
- Card.jsx - Cards
- Modal.jsx - Modais
- Input.jsx - Inputs
- Loading.jsx - Spinner
- PrivateRoute.jsx - Auth route

**Pages** (5):
- Login.jsx
- Register.jsx
- Dashboard.jsx
- QuoteDetail.jsx
- PublicQuoteView.jsx

**Outros** (4):
- App.jsx - Router
- AuthContext.jsx - Auth
- api.js - Axios
- helpers.js - Utils

---

## 📊 Estatísticas do Código

### Backend
- **Linhas de código**: ~2000
- **Arquivos**: 18
- **Endpoints**: 30+
- **Modelos do banco**: 5
- **Dependências**: 15

### Frontend
- **Linhas de código**: ~2500
- **Arquivos**: 17
- **Componentes**: 8
- **Páginas**: 5
- **Dependências**: 8

### Total
- **Arquivos de código**: 35
- **Linhas totais**: ~4500
- **Documentação**: 8 arquivos
- **Total geral**: 43+ arquivos

---

## 🔄 Fluxo de Dados

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTP Request
       ▼
┌─────────────────┐
│  React App      │
│  (Frontend)     │
│                 │
│  - Components   │
│  - Pages        │
│  - Context      │
└────────┬────────┘
         │
         │ API Call (Axios)
         ▼
┌────────────────────┐
│   Express API      │
│   (Backend)        │
│                    │
│   - Routes         │
│   - Controllers    │
│   - Middlewares    │
└─────────┬──────────┘
          │
          ├─────────────┐
          │             │
          ▼             ▼
    ┌──────────┐  ┌─────────┐
    │PostgreSQL│  │ Stripe  │
    │ (Prisma) │  │   API   │
    └──────────┘  └─────────┘
```

---

## 🎯 Principais Tecnologias

### Backend
```
Node.js 18+
├── Express 4.18       (Framework HTTP)
├── Prisma 5.8         (ORM)
├── PostgreSQL 14+     (Banco)
├── JWT                (Autenticação)
├── Bcrypt             (Criptografia)
├── PDFKit             (Geração PDF)
├── Nodemailer         (Email)
├── Stripe             (Pagamentos)
└── Multer             (Upload)
```

### Frontend
```
React 18
├── React Router 6     (Navegação)
├── Tailwind CSS 3     (Estilização)
├── Axios              (HTTP Client)
├── Heroicons          (Ícones)
└── Context API        (State)
```

---

## 🚀 Comandos Principais

```powershell
# Setup inicial
npm run setup              # Instala tudo

# Desenvolvimento
npm run dev:backend        # Roda backend
npm run dev:frontend       # Roda frontend

# Banco de dados
npm run prisma:migrate     # Migrations
npm run prisma:studio      # UI do banco
npm run seed:plans         # Criar planos

# Build
npm run build:frontend     # Build produção
```

---

## 📱 Páginas e Rotas

### Públicas
- `/login` - Login
- `/register` - Cadastro
- `/view/:token` - Orçamento público

### Privadas (requer login)
- `/dashboard` - Dashboard
- `/clients` - Clientes
- `/quotes` - Orçamentos
- `/quotes/:id` - Detalhes
- `/plans` - Planos
- `/profile` - Perfil

---

## 🔐 Variáveis de Ambiente

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
SMTP_USER=...
SMTP_PASS=...
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 📦 Tamanho dos Pacotes

### Backend
- node_modules: ~150MB
- Build: ~2MB

### Frontend
- node_modules: ~300MB
- Build: ~500KB (gzipped)

---

**Projeto completo e pronto para uso!** ✅
