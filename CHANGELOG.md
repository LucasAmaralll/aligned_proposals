# 📝 Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.0.0] - 2024-01-15

### 🎉 Lançamento Inicial (MVP)

Primeira versão completa do **Aligned Proposals** (anteriormente "OrçaMais") - Sistema SaaS de geração de orçamentos.

### ✨ Adicionado

#### Backend (API)
- ✅ Servidor Express com CORS e rate limiting
- ✅ Banco de dados PostgreSQL com Prisma ORM
- ✅ 5 modelos de dados: User, Client, Quote, Plan, Payment
- ✅ Autenticação JWT com expiração de 7 dias
- ✅ Criptografia de senhas com bcrypt (10 rounds)
- ✅ Sistema de planos (Gratuito, Básico, Pro)
- ✅ Limite mensal de orçamentos por plano
- ✅ CRUD completo de clientes
- ✅ CRUD completo de orçamentos
- ✅ Geração de PDF com PDFKit
- ✅ Logo personalizado em PDFs
- ✅ Marca d'água em PDFs do plano gratuito
- ✅ Envio de email via Nodemailer
- ✅ Templates HTML para emails
- ✅ Integração com Stripe (sandbox)
- ✅ Webhooks do Stripe para atualização de status
- ✅ Links públicos para visualização de orçamentos
- ✅ Contador de visualizações de orçamentos
- ✅ Geração de tokens únicos para compartilhamento
- ✅ Middleware de proteção de rotas
- ✅ Validação de entrada de dados

#### Frontend (React)
- ✅ Interface moderna com React 18
- ✅ Estilização com Tailwind CSS 3.4
- ✅ Roteamento com React Router 6
- ✅ Context API para gerenciamento de estado
- ✅ Persistência de autenticação com localStorage
- ✅ Interceptors Axios para token JWT
- ✅ 8 componentes reutilizáveis:
  - Sidebar (menu lateral responsivo)
  - Header (cabeçalho com usuário)
  - Button (botões customizados)
  - Card (cartões de conteúdo)
  - Modal (diálogos)
  - Input (campos de entrada)
  - Loading (indicador de carregamento)
  - PrivateRoute (proteção de rotas)
- ✅ 5 páginas principais:
  - Login (autenticação)
  - Register (cadastro)
  - Dashboard (painel com métricas)
  - QuoteDetail (detalhes do orçamento)
  - PublicQuoteView (visualização pública)
- ✅ Responsividade para desktop, tablet e mobile
- ✅ Animações e transições suaves
- ✅ Ícones do Heroicons
- ✅ Formatação de moeda brasileira (R$)
- ✅ Formatação de datas (dd/mm/yyyy)
- ✅ Badges de status coloridos
- ✅ Indicadores de plano do usuário

#### Integrações
- ✅ **WhatsApp Web** (gratuito via deep links)
  - Formatação automática de números brasileiros
  - Mensagem pré-preenchida com dados do orçamento
  - Abertura em nova aba
- ✅ **Stripe Payments**
  - Checkout de assinatura
  - Webhooks para sincronização
  - Sandbox para testes
- ✅ **Email (SMTP)**
  - Suporte a Gmail, SendGrid, Mailgun
  - Templates HTML profissionais
  - Anexos de PDF (futuro)

#### Funcionalidades
- ✅ Criação de orçamentos com múltiplos itens
- ✅ Cálculo automático de totais
- ✅ Envio via WhatsApp Web (link automático)
- ✅ Envio via email
- ✅ Download de PDF
- ✅ Visualização pública sem login
- ✅ Contador de visualizações
- ✅ Status de orçamentos (Pendente/Aprovado/Rejeitado)
- ✅ Dashboard com métricas:
  - Total de clientes
  - Total de orçamentos
  - Orçamentos aprovados
  - Orçamentos pendentes
  - Gráfico de status
  - Atividade recente
- ✅ Gerenciamento de clientes (nome, email, telefone)
- ✅ Sistema de assinatura (Free/Básico/Pro)
- ✅ Controle de limites mensais
- ✅ Reset automático de contador mensal

#### Documentação
- ✅ README.md - Visão geral completa
- ✅ QUICKSTART.md - Instalação rápida (5 minutos)
- ✅ FEATURES.md - Lista completa de recursos
- ✅ API.md - Documentação de 30+ endpoints
- ✅ SCRIPTS.md - Comandos úteis e troubleshooting
- ✅ DEPLOY.md - Guia de deploy em produção
- ✅ ROADMAP.md - Planejamento de versões futuras
- ✅ STRUCTURE.md - Estrutura do projeto
- ✅ START.md - Guia de início rápido
- ✅ VISUAL.md - Mockups e design system
- ✅ FAQ.md - Perguntas frequentes
- ✅ CHANGELOG.md - Este arquivo
- ✅ LICENSE - Licença MIT

#### Configuração
- ✅ .env.example para backend e frontend
- ✅ .gitignore configurado
- ✅ package.json com scripts úteis:
  - `npm run setup` - Instala tudo
  - `npm run dev` - Inicia desenvolvimento
  - `npm run build` - Build de produção
- ✅ Prisma configurado com migrations
- ✅ Seed de planos padrão
- ✅ CORS configurado para desenvolvimento

#### Segurança
- ✅ Proteção contra SQL Injection (Prisma ORM)
- ✅ Rate limiting (100 req/15min por IP)
- ✅ Senhas criptografadas com bcrypt
- ✅ Tokens JWT com expiração
- ✅ Validação de entrada de dados
- ✅ CORS configurado
- ✅ Variáveis de ambiente protegidas
- ✅ .gitignore para secrets

### 📚 Tecnologias Utilizadas

**Backend:**
- Node.js 18+
- Express 4.18
- Prisma ORM 5.8
- PostgreSQL 14+
- JWT (jsonwebtoken)
- bcryptjs
- PDFKit
- Nodemailer
- Stripe SDK
- Multer
- CORS
- Express Rate Limit

**Frontend:**
- React 18.2
- Tailwind CSS 3.4
- React Router 6.21
- Axios 1.6
- Heroicons
- Context API

**DevOps:**
- Git
- npm/yarn
- Prisma CLI
- Nodemon (dev)

### 🎯 Métricas do Projeto

- **Total de Arquivos:** 43+
- **Linhas de Código Backend:** ~2.000
- **Linhas de Código Frontend:** ~2.500
- **Linhas de Documentação:** ~3.000
- **Endpoints API:** 30+
- **Componentes React:** 8
- **Páginas:** 5
- **Modelos de Dados:** 5

---

## [Próximas Versões] - Planejado

Veja **ROADMAP.md** para detalhes completos.

### [1.1.0] - Previsto para Q1 2024

#### Planejado
- 📋 Páginas CRUD completas (Clients, Quotes, NewQuote)
- 📊 Gráficos interativos no Dashboard
- 📧 Sistema de notificações por email
- 🔔 Notificações em tempo real
- 📱 PWA (Progressive Web App)
- 🌙 Modo escuro

### [1.2.0] - Previsto para Q2 2024

#### Planejado
- 📊 Relatórios avançados
- 📈 Analytics e métricas detalhadas
- 💼 Multi-empresa (workspaces)
- 👥 Colaboração em equipe
- 🔗 API pública para integrações
- 📱 WhatsApp Business API (oficial)

### [2.0.0] - Previsto para Q3 2024

#### Planejado
- 📱 Aplicativo mobile (React Native)
- 🤖 Automações com IA
- 📝 Templates personalizáveis
- 💰 Gateway de pagamento PIX
- 🌐 Internacionalização (i18n)
- 🧪 Suite completa de testes

---

## Tipos de Mudanças

- `✨ Adicionado` - Novas funcionalidades
- `🔄 Modificado` - Alterações em funcionalidades existentes
- `🐛 Corrigido` - Correção de bugs
- `🗑️ Removido` - Funcionalidades removidas
- `🔒 Segurança` - Melhorias de segurança
- `📚 Documentação` - Mudanças na documentação
- `⚡ Performance` - Melhorias de performance
- `♻️ Refatoração` - Mudanças de código sem alterar funcionalidade

---

## Como Contribuir com o Changelog

Ao adicionar uma mudança, siga este formato:

```markdown
### ✨ Adicionado
- Descrição clara da funcionalidade adicionada

### 🐛 Corrigido
- Descrição do bug corrigido (#número-da-issue)

### 🔄 Modificado
- Descrição da mudança feita
```

---

**Mantenha-se atualizado!** 🚀

[1.0.0]: https://github.com/seu-usuario/aligned-proposals/releases/tag/v1.0.0
