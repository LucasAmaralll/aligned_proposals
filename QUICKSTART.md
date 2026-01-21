# Guia Rápido de Instalação - Aligned Proposals

## 🚀 Instalação Rápida (5 minutos)

### 1. Pré-requisitos
- Node.js 18+ instalado
- PostgreSQL 14+ instalado e rodando
- Git (opcional)

### 2. Backend

```powershell
# Navegar para a pasta do backend
cd backend

# Instalar dependências
npm install

# Copiar arquivo de ambiente
copy .env.example .env

# Editar .env e configurar DATABASE_URL
# DATABASE_URL="postgresql://usuario:senha@localhost:5432/aligned_proposals"

# Criar banco de dados (se não existir)
# No PostgreSQL, executar: CREATE DATABASE aligned_proposals;

# Rodar migrations do Prisma
npx prisma migrate dev --name init

# Gerar cliente do Prisma
npx prisma generate

# Criar planos padrão (acessar no navegador)
# http://localhost:5000/api/plans/seed

# Iniciar servidor
npm run dev
```

O backend estará rodando em `http://localhost:5000`

### 3. Frontend

```powershell
# Em outro terminal, navegar para a pasta do frontend
cd frontend

# Instalar dependências
npm install

# Copiar arquivo de ambiente
copy .env.example .env

# Editar .env se necessário (valores padrão já funcionam)

# Iniciar aplicação
npm start
```

O frontend estará rodando em `http://localhost:3000`

### 4. Primeira Conta

1. Acesse `http://localhost:3000/register`
2. Crie sua conta
3. Você será automaticamente logado no dashboard
4. Comece a criar clientes e orçamentos!

## ⚙️ Configuração Opcional

### Stripe (Pagamentos)

1. Crie conta em [stripe.com](https://stripe.com)
2. Pegue as chaves de teste em Dashboard → Developers → API Keys
3. Adicione no `.env` do backend:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
4. Crie produtos no Stripe Dashboard
5. Adicione os Price IDs no `.env`

### Email (SMTP)

Para enviar orçamentos por email, configure no `.env` do backend:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app-gmail
```

## 🐛 Resolução de Problemas

### Erro: "Cannot find module '@prisma/client'"
```powershell
cd backend
npx prisma generate
```

### Erro: "Port 5000 already in use"
Altere a porta no `.env` do backend:
```
PORT=5001
```

### Erro de conexão com banco
Verifique se o PostgreSQL está rodando e se as credenciais no `DATABASE_URL` estão corretas.

## 📚 Próximos Passos

- Leia o README.md completo para entender todas as funcionalidades
- Configure o Stripe para aceitar pagamentos
- Personalize o sistema com seu logo
- Convide sua equipe!

## 💡 Dicas

- Use o plano gratuito para testar (3 orçamentos/mês)
- O envio via WhatsApp abre o WhatsApp Web - é gratuito!
- PDFs são gerados com marca d'água no plano gratuito
- Faça upgrade para remover limitações

---

**Precisa de ajuda?** Abra uma issue no GitHub ou consulte o README completo.
