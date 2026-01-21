# Scripts Úteis - Aligned Proposals

## Backend

### Desenvolvimento
```powershell
# Iniciar servidor de desenvolvimento
cd backend
npm run dev

# Rodar migrations
npx prisma migrate dev

# Resetar banco de dados
npx prisma migrate reset

# Abrir Prisma Studio (UI para visualizar/editar dados)
npx prisma studio

# Criar planos padrão
# Acesse: http://localhost:5000/api/plans/seed
```

### Prisma
```powershell
# Gerar cliente do Prisma (após alterar schema)
npx prisma generate

# Criar nova migration
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations em produção
npx prisma migrate deploy

# Formatar schema
npx prisma format
```

### Testes
```powershell
# Rodar testes (se implementados)
npm test

# Ver logs
npm run dev # Logs aparecerão no console
```

## Frontend

### Desenvolvimento
```powershell
# Iniciar aplicação
cd frontend
npm start

# Build de produção
npm run build

# Testar build localmente
serve -s build
```

### Testes
```powershell
# Rodar testes
npm test

# Cobertura de testes
npm test -- --coverage
```

## Banco de Dados

### PostgreSQL (Windows)
```powershell
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco
CREATE DATABASE aligned_proposals;

# Listar bancos
\l

# Conectar a um banco
\c aligned_proposals

# Listar tabelas
\dt

# Ver dados de uma tabela
SELECT * FROM users;

# Sair
\q
```

### Backup e Restore
```powershell
# Backup
pg_dump -U postgres aligned_proposals > backup.sql

# Restore
psql -U postgres aligned_proposals < backup.sql
```

## Docker (Opcional)

### PostgreSQL com Docker
```powershell
# Baixar e rodar PostgreSQL
docker run --name aligned-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres

# Parar container
docker stop aligned-postgres

# Iniciar container
docker start aligned-postgres

# Ver logs
docker logs aligned-postgres

# Remover container
docker rm -f aligned-postgres
```

## Produção

### Deploy Backend (Heroku exemplo)
```powershell
# Fazer login
heroku login

# Criar app
heroku create aligned-proposals-api

# Adicionar PostgreSQL
heroku addons:create heroku-postgresql:mini

# Deploy
git push heroku main

# Ver logs
heroku logs --tail

# Rodar migrations
heroku run npx prisma migrate deploy
```

### Deploy Frontend (Vercel exemplo)
```powershell
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Deploy de produção
vercel --prod
```

## Manutenção

### Limpar node_modules
```powershell
# Backend
cd backend
Remove-Item -Recurse -Force node_modules
npm install

# Frontend
cd frontend
Remove-Item -Recurse -Force node_modules
npm install
```

### Atualizar dependências
```powershell
# Ver dependências desatualizadas
npm outdated

# Atualizar todas (cuidado!)
npm update

# Atualizar uma específica
npm install package@latest
```

### Verificar vulnerabilidades
```powershell
# Auditar
npm audit

# Corrigir automaticamente
npm audit fix

# Corrigir forçando breaking changes
npm audit fix --force
```

## Desenvolvimento

### Criar novo controller (backend)
1. Criar arquivo em `backend/src/controllers/nome.controller.js`
2. Implementar métodos
3. Criar rotas em `backend/src/routes/nome.routes.js`
4. Adicionar no `server.js`

### Criar nova página (frontend)
1. Criar arquivo em `frontend/src/pages/NomePagina.jsx`
2. Adicionar rota no `App.jsx`
3. Adicionar link no `Sidebar.jsx` (se necessário)

### Criar novo componente (frontend)
1. Criar arquivo em `frontend/src/components/NomeComponente.jsx`
2. Importar onde necessário

## Troubleshooting

### Porta já em uso
```powershell
# Windows - Verificar processo na porta
netstat -ano | findstr :5000

# Matar processo
taskkill /PID <PID> /F
```

### Limpar cache
```powershell
# Backend
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Frontend
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Resetar banco completamente
```powershell
# No PostgreSQL
DROP DATABASE aligned_proposals;
CREATE DATABASE aligned_proposals;

# Rodar migrations
cd backend
npx prisma migrate dev

# Criar planos
# Acesse: http://localhost:5000/api/plans/seed
```

## Comandos Rápidos

```powershell
# Iniciar tudo (use 2 terminais)

# Terminal 1 - Backend
cd backend ; npm run dev

# Terminal 2 - Frontend
cd frontend ; npm start
```

---

**Dica**: Salve esses comandos como aliases no seu PowerShell profile para acesso rápido!
