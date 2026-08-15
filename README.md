# Aligned

Gestão para Reveza e Rezza. Banco **local**, separado de qualquer ambiente da Credspot.

## Subir o projeto

Postgres 16 já está instalado via Homebrew e o banco `aligned` já foi criado.

Terminal 1 — API:

```bash
cd backend
npm run dev
```

Terminal 2 — interface:

```bash
cd frontend
npm start
```

- App: http://localhost:3000
- API: http://localhost:5000

## Logins

| Empresa | E-mail | Senha |
|---|---|---|
| Reveza | samuel.w@example.com | reveza123 |
| Rezza | uma.s@example.org | rezza123 |

Reveza tem Loja 1, Loja 2 e Fábrica. Rezza tem Fábrica. Os dados não se misturam.

## Banco

Somente `localhost:5432/aligned`. Não use RDS nem `.env` de outros projetos.

Se o Postgres não estiver rodando:

```bash
brew services start postgresql@16
```
