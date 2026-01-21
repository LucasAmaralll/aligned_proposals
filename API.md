# Documentação da API - Aligned Proposals

Base URL: `http://localhost:5000/api`

## Autenticação

Todas as rotas protegidas requerem o header:
```
Authorization: Bearer {token}
```

### POST /auth/register
Criar nova conta

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123",
  "company": "Minha Empresa" // opcional
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "joao@email.com",
    "name": "João Silva",
    "company": "Minha Empresa",
    "plan": {
      "name": "Gratuito",
      "quotesLimit": 3
    }
  },
  "token": "eyJhbGc..."
}
```

### POST /auth/login
Fazer login

**Body:**
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "user": { ... },
  "token": "eyJhbGc..."
}
```

### GET /auth/me
Buscar dados do usuário logado (requer autenticação)

**Response:**
```json
{
  "id": "uuid",
  "email": "joao@email.com",
  "name": "João Silva",
  "plan": { ... }
}
```

---

## Usuários

### GET /users/profile
Buscar perfil completo (requer autenticação)

**Response:**
```json
{
  "id": "uuid",
  "email": "joao@email.com",
  "name": "João Silva",
  "company": "Minha Empresa",
  "phone": "(11) 98765-4321",
  "logo": "/uploads/logo-123.png",
  "plan": {
    "name": "Pro",
    "quotesLimit": -1
  },
  "_count": {
    "clients": 15,
    "quotes": 42
  }
}
```

### PUT /users/profile
Atualizar perfil (requer autenticação)

**Body:**
```json
{
  "name": "João Silva Santos",
  "company": "Nova Empresa Ltda",
  "phone": "11987654321"
}
```

### PUT /users/password
Alterar senha (requer autenticação)

**Body:**
```json
{
  "currentPassword": "senha123",
  "newPassword": "novaSenha456"
}
```

### POST /users/logo
Upload de logo (requer autenticação, multipart/form-data)

**Form Data:**
```
logo: [arquivo de imagem]
```

### GET /users/stats
Buscar estatísticas (requer autenticação)

**Response:**
```json
{
  "quotesThisMonth": 5,
  "quotesResetAt": "2024-01-01T00:00:00.000Z",
  "plan": {
    "quotesLimit": 20
  },
  "_count": {
    "clients": 10,
    "quotes": 25
  },
  "quotesByStatus": {
    "pending": 5,
    "approved": 15,
    "rejected": 5
  }
}
```

---

## Clientes

### POST /clients
Criar cliente (requer autenticação)

**Body:**
```json
{
  "name": "Cliente Exemplo",
  "email": "cliente@email.com",
  "phone": "11987654321",
  "document": "12345678900",
  "address": "Rua Exemplo, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567"
}
```

### GET /clients
Listar clientes (requer autenticação)

**Query Params:**
- `search` (opcional): busca por nome, email ou telefone
- `page` (opcional): número da página (default: 1)
- `limit` (opcional): itens por página (default: 10)

**Response:**
```json
{
  "clients": [
    {
      "id": "uuid",
      "name": "Cliente Exemplo",
      "email": "cliente@email.com",
      "phone": "11987654321",
      "_count": {
        "quotes": 3
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### GET /clients/:id
Buscar cliente por ID (requer autenticação)

**Response:**
```json
{
  "id": "uuid",
  "name": "Cliente Exemplo",
  "email": "cliente@email.com",
  "phone": "11987654321",
  "quotes": [
    {
      "id": "uuid",
      "title": "Orçamento Website",
      "total": 5000.00,
      "status": "pending"
    }
  ]
}
```

### PUT /clients/:id
Atualizar cliente (requer autenticação)

**Body:** (mesmos campos do POST)

### DELETE /clients/:id
Deletar cliente (requer autenticação)

---

## Orçamentos

### POST /quotes
Criar orçamento (requer autenticação)

**Body:**
```json
{
  "title": "Website Institucional",
  "description": "Desenvolvimento de site responsivo",
  "clientId": "uuid-do-cliente",
  "items": [
    {
      "description": "Desenvolvimento Frontend",
      "quantity": 1,
      "price": 3000.00
    },
    {
      "description": "Hospedagem 1 ano",
      "quantity": 1,
      "price": 500.00
    }
  ],
  "discount": 0,
  "tax": 0,
  "notes": "Prazo de entrega: 30 dias",
  "termsConditions": "50% no início, 50% na entrega",
  "validUntil": "2024-12-31"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Website Institucional",
  "publicToken": "abc123xyz",
  "subtotal": 3500.00,
  "total": 3500.00,
  "status": "pending",
  "client": { ... },
  "user": { ... }
}
```

### GET /quotes
Listar orçamentos (requer autenticação)

**Query Params:**
- `search` (opcional): busca por título/descrição
- `status` (opcional): pending, approved, rejected
- `clientId` (opcional): filtrar por cliente
- `page` (opcional): número da página
- `limit` (opcional): itens por página

### GET /quotes/:id
Buscar orçamento por ID (requer autenticação)

### GET /quotes/public/:token
Buscar orçamento público (NÃO requer autenticação)

**Response:** Mesmo formato do GET /quotes/:id

### PUT /quotes/:id
Atualizar orçamento (requer autenticação)

**Body:** (mesmos campos do POST, todos opcionais)

### DELETE /quotes/:id
Deletar orçamento (requer autenticação)

### GET /quotes/:id/pdf
Baixar PDF do orçamento (requer autenticação)

**Response:** Arquivo PDF (application/pdf)

### POST /quotes/:id/send-email
Enviar orçamento por email (requer autenticação)

**Body:**
```json
{
  "recipientEmail": "cliente@email.com",
  "message": "Mensagem personalizada opcional"
}
```

---

## Planos

### GET /plans
Listar todos os planos (público)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Gratuito",
    "price": 0,
    "quotesLimit": 3,
    "hasWatermark": true,
    "features": [
      "Até 3 orçamentos/mês",
      "PDF com marca d'água"
    ]
  },
  {
    "id": "uuid",
    "name": "Básico",
    "price": 19.90,
    "quotesLimit": 20,
    "hasWatermark": false,
    "stripePriceId": "price_123",
    "features": [
      "Até 20 orçamentos/mês",
      "PDF sem marca d'água"
    ]
  }
]
```

### GET /plans/:id
Buscar plano específico (público)

### GET /plans/seed
Criar planos padrão (público, usar apenas uma vez)

---

## Pagamentos

### POST /payments/create-checkout
Criar sessão de checkout Stripe (requer autenticação)

**Body:**
```json
{
  "planId": "uuid-do-plano"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_123",
  "url": "https://checkout.stripe.com/pay/cs_test_123"
}
```

### GET /payments/history
Listar histórico de pagamentos (requer autenticação)

**Query Params:**
- `page` (opcional)
- `limit` (opcional)

### POST /payments/cancel-subscription
Cancelar assinatura ativa (requer autenticação)

### POST /payments/webhook/stripe
Webhook do Stripe (chamado automaticamente pelo Stripe)

---

## Códigos de Status

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação / Dados inválidos
- `401` - Não autenticado / Token inválido
- `403` - Sem permissão (ex: limite de orçamentos atingido)
- `404` - Não encontrado
- `500` - Erro interno do servidor

## Exemplos de Erro

```json
{
  "error": "Email já cadastrado"
}
```

```json
{
  "error": "Limite de orçamentos atingido",
  "message": "Você atingiu o limite de 3 orçamentos do plano Gratuito. Faça upgrade para continuar."
}
```

---

## Testando com cURL (PowerShell)

### Registrar
```powershell
curl -X POST http://localhost:5000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"name":"João","email":"joao@email.com","password":"123456"}'
```

### Login
```powershell
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"joao@email.com","password":"123456"}'
```

### Criar cliente (use o token do login)
```powershell
curl -X POST http://localhost:5000/api/clients `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer SEU_TOKEN_AQUI" `
  -d '{"name":"Cliente Teste","email":"cliente@test.com"}'
```

---

## Testando com Postman

1. Importe a coleção (se disponível) ou crie requests manualmente
2. Crie variável de ambiente `token` e `baseUrl`
3. Configure o header `Authorization: Bearer {{token}}` globalmente
4. Use `{{baseUrl}}` nas URLs

---

**Dica**: Use ferramentas como Postman, Insomnia ou Thunder Client (VS Code) para testar a API facilmente!
