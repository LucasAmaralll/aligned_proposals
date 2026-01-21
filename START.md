# 🎉 Bem-vindo ao Aligned Proposals!

Sistema SaaS completo de orçamentos e propostas comerciais.

---

## 🚀 Primeiros Passos

### 1️⃣ Instalação (5 minutos)

Siga o guia rápido: **[QUICKSTART.md](QUICKSTART.md)**

```powershell
# Backend
cd backend
npm install
copy .env.example .env
# Configure o .env
npx prisma migrate dev
npm run dev

# Frontend (novo terminal)
cd frontend
npm install
copy .env.example .env
npm start
```

### 2️⃣ Primeira Conta

1. Acesse http://localhost:3000
2. Clique em "Cadastre-se"
3. Preencha seus dados
4. Você será logado automaticamente!

### 3️⃣ Explorar

✅ Crie seu primeiro cliente
✅ Crie seu primeiro orçamento
✅ Baixe o PDF
✅ Envie via WhatsApp Web
✅ Teste a página pública

---

## 📚 Documentação

### Para Desenvolvedores
- **[README.md](README.md)** - Visão geral completa
- **[API.md](API.md)** - Documentação da API REST
- **[STRUCTURE.md](STRUCTURE.md)** - Estrutura do projeto
- **[SCRIPTS.md](SCRIPTS.md)** - Comandos úteis

### Para Deploy
- **[DEPLOY.md](DEPLOY.md)** - Guia de produção completo
- **[FEATURES.md](FEATURES.md)** - Todas as funcionalidades

### Planejamento
- **[ROADMAP.md](ROADMAP.md)** - Próximas funcionalidades

---

## 💡 Funcionalidades Principais

### ✨ Destaque: WhatsApp Web Gratuito
Envie orçamentos via WhatsApp sem pagar por API! 
- Um clique abre o WhatsApp Web
- Mensagem pré-preenchida com link
- 100% gratuito

### 📄 Geração de PDF
- Layout profissional
- Logo personalizada
- Download instantâneo

### 💳 Sistema de Planos
- **Gratuito**: 3 orçamentos/mês
- **Básico**: R$ 19,90 - 20 orçamentos/mês
- **Pro**: R$ 49,90 - Ilimitado

### 🎨 Interface Moderna
- React + Tailwind CSS
- Design limpo e profissional
- Responsivo

---

## 🎯 O Que Você Pode Fazer

### Gestão de Clientes
- Cadastrar clientes com todos os dados
- Buscar e filtrar
- Ver histórico de orçamentos

### Criar Orçamentos
- Adicionar múltiplos itens
- Aplicar descontos e taxas
- Adicionar observações e termos
- Definir validade

### Compartilhar
- **PDF**: Download direto
- **WhatsApp**: Um clique
- **Email**: Template profissional
- **Link**: Página pública única

### Acompanhar
- Dashboard com métricas
- Status: Pendente, Aprovado, Rejeitado
- Contador de visualizações

---

## 🔧 Configuração Opcional

### Stripe (Pagamentos)
Para aceitar assinaturas:
1. Crie conta em stripe.com
2. Pegue as chaves de teste
3. Configure no `.env`

Ver detalhes: [README.md#stripe](README.md#configuração-do-stripe-pagamentos)

### Email (SMTP)
Para enviar orçamentos por email:
1. Use Gmail ou outro SMTP
2. Configure no `.env` do backend

Ver detalhes: [README.md#email](README.md#envio-de-email)

---

## ❓ Precisa de Ajuda?

### Problemas Comuns

**Erro ao conectar banco?**
- Verifique se PostgreSQL está rodando
- Confira `DATABASE_URL` no `.env`

**Porta 5000 em uso?**
- Altere `PORT=5001` no `.env` do backend

**Erro do Prisma?**
```powershell
cd backend
npx prisma generate
```

Ver mais: [SCRIPTS.md#troubleshooting](SCRIPTS.md#troubleshooting)

### Onde Buscar

1. **[QUICKSTART.md](QUICKSTART.md)** - Resolução de problemas
2. **[README.md](README.md)** - Documentação completa
3. **Issues do GitHub** - Abra uma issue

---

## 🎓 Aprender Mais

### Arquitetura
```
Frontend (React)
    ↓ API REST
Backend (Node.js + Express)
    ↓ Prisma ORM
PostgreSQL
```

Ver: [STRUCTURE.md](STRUCTURE.md)

### Endpoints da API
30+ endpoints documentados

Ver: [API.md](API.md)

### Scripts Úteis
Comandos para desenvolvimento, deploy, manutenção

Ver: [SCRIPTS.md](SCRIPTS.md)

---

## 🚀 Próximos Passos

### Para Testar
1. ✅ Criar conta
2. ✅ Adicionar cliente
3. ✅ Criar orçamento
4. ✅ Baixar PDF
5. ✅ Testar WhatsApp
6. ✅ Ver página pública

### Para Desenvolver
1. 📖 Ler [README.md](README.md)
2. 🔍 Explorar código em [STRUCTURE.md](STRUCTURE.md)
3. 🛠️ Ver [ROADMAP.md](ROADMAP.md) para ideias
4. 💻 Começar a codar!

### Para Deploy
1. 📚 Seguir [DEPLOY.md](DEPLOY.md)
2. 🌐 Escolher hospedagem (Railway + Vercel)
3. 🔐 Configurar variáveis de ambiente
4. 🚀 Deploy!

---

## 🌟 Features Implementadas

### MVP Completo ✅
- [x] Autenticação JWT
- [x] CRUD de clientes e orçamentos
- [x] Geração de PDF profissional
- [x] Envio via WhatsApp Web (gratuito!)
- [x] Envio por email
- [x] Sistema de planos
- [x] Integração Stripe (sandbox)
- [x] Dashboard com métricas
- [x] Página pública para orçamentos
- [x] Interface responsiva

Ver todas: [FEATURES.md](FEATURES.md)

---

## 💬 Feedback

Encontrou um bug? Tem uma sugestão?
- Abra uma **Issue** no GitHub
- Entre em contato

---

## 📜 Licença

MIT License - Livre para uso pessoal e comercial!

Ver: [LICENSE](LICENSE)

---

## 🙏 Agradecimentos

Obrigado por usar o Aligned Proposals!

Desenvolvido com ❤️ usando:
- ⚛️ React
- 🟢 Node.js
- 🎨 Tailwind CSS
- 🐘 PostgreSQL
- 💳 Stripe

---

## 🎯 TL;DR - Começar AGORA

```powershell
# 1. Instalar dependências
cd backend && npm install
cd ../frontend && npm install

# 2. Configurar .env
# backend/.env - Configure DATABASE_URL
# frontend/.env - Deixe como está

# 3. Banco de dados
cd backend
npx prisma migrate dev
# Acesse: http://localhost:5000/api/plans/seed

# 4. Rodar (2 terminais)
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start

# 5. Acessar
# http://localhost:3000
```

**Pronto! 🎉**

---

**Próximo**: Leia o [QUICKSTART.md](QUICKSTART.md) para mais detalhes!
