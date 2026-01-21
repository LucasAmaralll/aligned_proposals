# ❓ FAQ - Perguntas Frequentes

## 📌 Índice
- [Instalação e Configuração](#instalação-e-configuração)
- [Uso do Sistema](#uso-do-sistema)
- [Planos e Pagamentos](#planos-e-pagamentos)
- [Integrações](#integrações)
- [Problemas Comuns](#problemas-comuns)
- [Segurança](#segurança)
- [Desenvolvimento](#desenvolvimento)

---

## 📦 Instalação e Configuração

### ❓ Quais são os requisitos mínimos do sistema?
**R:** 
- Node.js 18 ou superior
- PostgreSQL 14 ou superior
- npm ou yarn
- Sistema operacional: Windows, macOS ou Linux

### ❓ Como instalar o projeto rapidamente?
**R:** Siga o guia **QUICKSTART.md** com estes comandos:
```bash
npm run setup
cd backend && npx prisma migrate dev
cd backend && npm run seed
npm run dev
```

### ❓ Preciso pagar pelo PostgreSQL?
**R:** Não! Você pode usar:
- PostgreSQL local (gratuito)
- Supabase (gratuito até 500MB)
- Neon (gratuito com limites)
- Railway (gratuito com $5 de crédito)

### ❓ Como configurar as variáveis de ambiente?
**R:** 
1. Copie `.env.example` para `.env` em `backend/` e `frontend/`
2. Configure DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, etc.
3. Veja exemplos completos em cada arquivo `.env.example`

### ❓ O projeto funciona no Windows?
**R:** Sim! Todos os scripts estão preparados para Windows (PowerShell) e Linux/macOS.

---

## 🎯 Uso do Sistema

### ❓ Como criar meu primeiro orçamento?
**R:** 
1. Faça login no sistema
2. Acesse "Orçamentos" no menu lateral
3. Clique em "Novo Orçamento"
4. Preencha os dados do cliente
5. Adicione os itens com descrição, quantidade e valor
6. Clique em "Salvar"

### ❓ Como enviar um orçamento para o cliente?
**R:** Após criar o orçamento, você pode:
- **WhatsApp:** Clique no botão 💬 para enviar via WhatsApp Web
- **Email:** Clique no botão 📧 e informe o email do cliente
- **PDF:** Clique no botão 📥 para baixar o PDF
- **Link público:** Clique no botão 👁️ para copiar o link de visualização

### ❓ O cliente precisa ter conta no sistema?
**R:** Não! O cliente acessa o orçamento através de um link público sem precisar fazer login.

### ❓ Posso editar um orçamento já enviado?
**R:** Sim! Você pode editar qualquer orçamento. A cada edição, o link público continua funcionando com as informações atualizadas.

### ❓ Como acompanhar se o cliente visualizou o orçamento?
**R:** O sistema conta automaticamente quantas vezes o orçamento foi visualizado. Veja em "Detalhes do Orçamento".

### ❓ Posso adicionar meu logo no PDF?
**R:** Sim! Coloque a imagem do seu logo em `backend/public/logo.png`. O PDF será gerado automaticamente com ela.

---

## 💳 Planos e Pagamentos

### ❓ Quais são os planos disponíveis?
**R:**
- **Gratuito:** 3 orçamentos/mês, PDF com marca d'água
- **Básico:** R$ 19,90/mês, 20 orçamentos/mês, sem marca d'água
- **Pro:** R$ 49,90/mês, orçamentos ilimitados, relatórios premium

### ❓ Como funciona o limite de orçamentos?
**R:** O limite é mensal e reinicia automaticamente no dia 1º de cada mês.

### ❓ O que acontece se eu atingir o limite do plano gratuito?
**R:** Você não poderá criar novos orçamentos até fazer upgrade ou esperar o próximo mês.

### ❓ Como fazer upgrade do plano?
**R:** 
1. Acesse "Planos" no menu lateral
2. Escolha o plano desejado
3. Clique em "Fazer Upgrade"
4. Complete o pagamento via Stripe

### ❓ Posso cancelar minha assinatura a qualquer momento?
**R:** Sim! Acesse seu painel no Stripe ou entre em contato com o suporte.

### ❓ Os pagamentos são seguros?
**R:** Sim! Usamos Stripe, uma das plataformas de pagamento mais seguras do mundo (PCI DSS Level 1).

### ❓ Preciso configurar o Stripe?
**R:** Para testes, use as chaves de teste (sandbox). Para produção, crie uma conta no Stripe e configure as chaves reais.

---

## 🔌 Integrações

### ❓ Como funciona a integração com WhatsApp?
**R:** Usamos **WhatsApp Web** gratuito através de deep links. Não é necessário API paga. O sistema abre o WhatsApp com mensagem pré-formatada.

### ❓ Preciso de API do WhatsApp Business?
**R:** Não! A integração é gratuita e funciona via WhatsApp Web (web.whatsapp.com).

### ❓ O envio de email é gratuito?
**R:** Depende do provedor SMTP:
- Gmail: Gratuito até 500 emails/dia
- SendGrid: Gratuito até 100 emails/dia
- Mailgun: Gratuito até 100 emails/dia

### ❓ Posso integrar com outros sistemas?
**R:** Sim! O backend possui API REST completa. Consulte **API.md** para documentação.

### ❓ Como configurar o envio de emails?
**R:** Configure no `.env` do backend:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
```

---

## 🐛 Problemas Comuns

### ❓ Erro "Port 5000 already in use"
**R:** 
```bash
# Windows PowerShell
netstat -ano | findstr :5000
taskkill /PID <numero> /F

# Linux/macOS
lsof -ti:5000 | xargs kill -9
```

### ❓ Erro "DATABASE_URL not found"
**R:** Verifique se o arquivo `.env` existe em `backend/` e contém `DATABASE_URL`.

### ❓ Erro ao fazer login
**R:** Possíveis causas:
1. Banco de dados não está rodando
2. Migrations não foram executadas (`npx prisma migrate dev`)
3. Planos não foram criados (`/api/plans/seed`)

### ❓ PDF não gera ou dá erro
**R:** 
1. Verifique se `backend/public/` existe
2. Se usar logo, confirme que `logo.png` está em `backend/public/`
3. Veja logs no terminal do backend

### ❓ Frontend não conecta com backend
**R:** 
1. Confirme que o backend está rodando (`http://localhost:5000`)
2. Verifique `REACT_APP_API_URL` no `.env` do frontend
3. Confirme que CORS está habilitado no backend

### ❓ Erro "Prisma Client not generated"
**R:** Execute:
```bash
cd backend
npx prisma generate
```

### ❓ Tailwind CSS não funciona
**R:** 
1. Confirme que `tailwind.config.js` existe
2. Execute `npm install` no frontend
3. Reinicie o servidor de desenvolvimento

---

## 🔒 Segurança

### ❓ As senhas são armazenadas com segurança?
**R:** Sim! Todas as senhas são criptografadas com **bcrypt** (10 rounds) antes de serem salvas.

### ❓ Como funciona a autenticação?
**R:** Usamos **JWT (JSON Web Tokens)** com expiração de 7 dias. O token é enviado no header `Authorization: Bearer <token>`.

### ❓ O sistema é vulnerável a SQL Injection?
**R:** Não! Usamos **Prisma ORM** que previne SQL Injection automaticamente.

### ❓ Como proteger minha chave JWT_SECRET?
**R:** 
1. Use uma string aleatória longa (mínimo 32 caracteres)
2. Nunca compartilhe ou commite no Git
3. Use `.env` e adicione ao `.gitignore`

### ❓ Posso usar HTTPS?
**R:** Sim! Recomendado para produção. Use Nginx ou serviços como Vercel/Railway que fornecem SSL gratuito.

### ❓ Como configurar rate limiting?
**R:** Já está configurado em `server.js`:
- 100 requisições por IP a cada 15 minutos
- Ajuste em `windowMs` e `max`

---

## 👨‍💻 Desenvolvimento

### ❓ Posso customizar o design?
**R:** Sim! Edite:
- Cores: `frontend/tailwind.config.js`
- Componentes: `frontend/src/components/`
- Estilos: `frontend/src/index.css`

### ❓ Como adicionar novos campos no orçamento?
**R:**
1. Edite `backend/prisma/schema.prisma`
2. Execute `npx prisma migrate dev`
3. Atualize o controller `quote.controller.js`
4. Atualize o frontend `QuoteDetail.jsx`

### ❓ Posso usar MongoDB ao invés de PostgreSQL?
**R:** Sim! Altere o provider em `schema.prisma` para `mongodb` e ajuste o `DATABASE_URL`.

### ❓ Como executar os testes?
**R:** Os testes não estão incluídos nesta versão MVP. Veja **ROADMAP.md** para implementação futura.

### ❓ Posso contribuir com o projeto?
**R:** Sim! Faça fork, crie uma branch, desenvolva sua feature e abra um Pull Request.

### ❓ Onde reportar bugs?
**R:** Abra uma issue no GitHub ou entre em contato com a equipe de desenvolvimento.

### ❓ Como habilitar logs de debug?
**R:** Adicione no `.env` do backend:
```env
NODE_ENV=development
DEBUG=true
```

### ❓ Posso adicionar mais idiomas?
**R:** Sim! Implemente i18n com bibliotecas como `react-i18next`. Veja **ROADMAP.md**.

---

## 🚀 Deploy e Produção

### ❓ Onde posso fazer deploy gratuito?
**R:**
- **Backend:** Railway ($5 de crédito), Render (free tier)
- **Frontend:** Vercel (ilimitado), Netlify (100GB/mês)
- **Banco:** Supabase (500MB free), Neon (3GB free)

### ❓ Como fazer deploy em produção?
**R:** Siga o guia completo em **DEPLOY.md** com instruções passo a passo.

### ❓ Preciso alterar alguma configuração para produção?
**R:** Sim:
1. Altere `NODE_ENV=production`
2. Use `DATABASE_URL` de produção
3. Configure chaves Stripe reais (não sandbox)
4. Configure domínio real em `FRONTEND_URL`

### ❓ Como configurar domínio customizado?
**R:** 
- Vercel: Adicione domínio nas configurações
- Railway: Configure CNAME no seu DNS
- Veja **DEPLOY.md** para detalhes

### ❓ Como fazer backup do banco de dados?
**R:**
```bash
# PostgreSQL local
pg_dump aligned_proposals > backup.sql

# Supabase
# Faça backup pelo dashboard
```

---

## 📞 Suporte

### ❓ Não encontrei minha dúvida aqui
**R:** Consulte:
- **README.md** - Visão geral do projeto
- **QUICKSTART.md** - Instalação rápida
- **API.md** - Documentação da API
- **DEPLOY.md** - Deploy em produção
- **SCRIPTS.md** - Comandos úteis

### ❓ Como entrar em contato?
**R:** 
- Abra uma issue no GitHub
- Envie email para suporte@alignedproposals.com
- Acesse nossa documentação online

---

**Ainda tem dúvidas? Entre em contato! 💬**
