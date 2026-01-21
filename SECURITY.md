# 🔒 Política de Segurança

## 📋 Versões Suportadas

Atualmente, as seguintes versões do **Aligned Proposals** recebem atualizações de segurança:

| Versão | Suportada          |
| ------ | ------------------ |
| 1.0.x  | :white_check_mark: |
| < 1.0  | :x:                |

---

## 🚨 Reportando uma Vulnerabilidade

Levamos a segurança muito a sério. Se você descobrir uma vulnerabilidade de segurança, por favor, siga este processo:

### ⚠️ NÃO Faça

- ❌ NÃO abra uma issue pública
- ❌ NÃO divulgue a vulnerabilidade publicamente antes de uma correção
- ❌ NÃO explore a vulnerabilidade além do necessário para demonstrá-la

### ✅ Faça

1. **Envie um email privado para:**
   - 📧 security@alignedproposals.com
   - Assunto: `[SECURITY] Descrição breve`

2. **Inclua as seguintes informações:**
   - Descrição detalhada da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Versão afetada
   - Prova de conceito (se possível)
   - Sua sugestão de correção (se tiver)

3. **Aguarde nossa resposta:**
   - Confirmaremos o recebimento em até 48 horas
   - Investigaremos e daremos retorno em até 7 dias
   - Trabalharemos em uma correção prioritariamente
   - Manteremos você atualizado sobre o progresso

### 🏆 Reconhecimento

- Contribuidores que reportarem vulnerabilidades serão creditados (se desejarem)
- Manteremos um hall da fama de segurança

---

## 🛡️ Medidas de Segurança Implementadas

### Autenticação e Autorização

#### ✅ JWT (JSON Web Tokens)
```javascript
// Tokens com expiração de 7 dias
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

**Proteções:**
- ✅ Tokens assinados com secret forte
- ✅ Expiração automática
- ✅ Validação em todas as rotas protegidas
- ✅ Secret armazenado em variável de ambiente

**Recomendações:**
- 🔐 Use JWT_SECRET com no mínimo 32 caracteres aleatórios
- 🔄 Rotacione o secret periodicamente em produção
- 🚫 Nunca commite o secret no Git

#### ✅ Criptografia de Senhas (bcrypt)
```javascript
// Hash com 10 rounds de salt
const hashedPassword = await bcrypt.hash(password, 10);
```

**Proteções:**
- ✅ Senhas nunca armazenadas em texto plano
- ✅ Hash com salt individual por senha
- ✅ 10 rounds de hashing (adequado para produção)
- ✅ Resistente a rainbow tables

---

### Proteção contra Ataques

#### ✅ SQL Injection
**Proteção:** Uso de Prisma ORM

```javascript
// ✅ Seguro - Prisma sanitiza automaticamente
const user = await prisma.user.findUnique({
  where: { email: userInput }
});

// ❌ NUNCA FAÇA ISSO (exemplo de código inseguro)
// db.query(`SELECT * FROM users WHERE email = '${userInput}'`);
```

**Por que é seguro:**
- Prisma usa prepared statements
- Parâmetros são automaticamente escapados
- Validação de tipos em tempo de compilação

#### ✅ Cross-Site Scripting (XSS)
**Proteção:** React sanitiza automaticamente

```jsx
// ✅ Seguro - React escapa automaticamente
<div>{userInput}</div>

// ⚠️ Cuidado com dangerouslySetInnerHTML
// Só use se absolutamente necessário e sanitize primeiro
```

**Proteções adicionais:**
- Content Security Policy (CSP) headers (recomendado para produção)
- Validação de entrada no backend
- Sanitização de dados antes de renderizar

#### ✅ Cross-Site Request Forgery (CSRF)
**Proteção:** SameSite cookies + CORS configurado

```javascript
// Backend - CORS restritivo
app.use(cors({
  origin: process.env.FRONTEND_URL, // Apenas frontend autorizado
  credentials: true
}));
```

**Em produção, adicione:**
```javascript
// Cookies com SameSite
res.cookie('token', token, {
  httpOnly: true,
  secure: true, // Apenas HTTPS
  sameSite: 'strict'
});
```

#### ✅ Rate Limiting
**Proteção:** Limite de requisições por IP

```javascript
// 100 requisições a cada 15 minutos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

**Previne:**
- Ataques de força bruta
- DDoS básicos
- Spam de requisições

**Ajuste em produção:**
```javascript
// Login endpoint - mais restritivo
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentativas
  message: 'Muitas tentativas de login'
});

app.post('/api/auth/login', loginLimiter, authController.login);
```

---

### Validação e Sanitização

#### ✅ Validação de Entrada

```javascript
// ✅ Sempre valide dados de entrada
exports.create = async (req, res) => {
  const { email, password } = req.body;

  // Validação
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Email e senha são obrigatórios' 
    });
  }

  // Validação de formato
  if (!email.includes('@')) {
    return res.status(400).json({ 
      error: 'Email inválido' 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      error: 'Senha deve ter no mínimo 6 caracteres' 
    });
  }

  // Continuar...
};
```

**Recomendações:**
- Use bibliotecas de validação (Joi, Yup, Zod)
- Valide tipos de dados
- Valide tamanhos (min/max)
- Valide formatos (email, telefone, etc)
- Sanitize strings para evitar caracteres especiais

---

### Exposição de Dados Sensíveis

#### ✅ Variáveis de Ambiente

```bash
# ✅ Use .env para dados sensíveis
DATABASE_URL="postgresql://..."
JWT_SECRET="seu-secret-super-secreto-aqui"
STRIPE_SECRET_KEY="sk_test_..."

# ❌ NUNCA commite .env no Git
# Adicione no .gitignore:
.env
.env.local
.env.production
```

#### ✅ Não Exponha Informações Sensíveis

```javascript
// ❌ NÃO faça isso
res.json({
  user: {
    id: user.id,
    email: user.email,
    password: user.password // ❌ NUNCA!
  }
});

// ✅ Faça isso
const { password, ...userWithoutPassword } = user;
res.json({ user: userWithoutPassword });
```

#### ✅ Logs Seguros

```javascript
// ❌ NÃO logue dados sensíveis
console.log('User data:', user); // Pode conter senha

// ✅ Logue apenas o necessário
console.log('User logged in:', user.id);
```

---

### Headers de Segurança

#### Recomendado para Produção

```javascript
// Instale helmet
npm install helmet

// Configure no Express
const helmet = require('helmet');
app.use(helmet());
```

**Headers importantes:**
```javascript
// Configuração manual (se não usar helmet)
app.use((req, res, next) => {
  // Previne clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Previne MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // Força HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  
  next();
});
```

---

## 🔐 Melhores Práticas

### Para Desenvolvedores

#### 1. Senhas e Secrets

```bash
# ✅ Gere secrets fortes
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ✅ Use gerenciadores de senhas
# - 1Password
# - LastPass
# - Bitwarden
```

#### 2. Dependências

```bash
# ✅ Verifique vulnerabilidades regularmente
npm audit

# ✅ Atualize dependências
npm update

# ✅ Use apenas dependências confiáveis
# - Verifique número de downloads
# - Verifique última atualização
# - Leia o código (se possível)
```

#### 3. Git e Código

```bash
# ✅ Nunca commite:
- Senhas
- Tokens de API
- Chaves privadas
- Arquivos .env
- Dados de produção

# ✅ Se cometer erro:
# Rotacione todas as credenciais imediatamente!
# Use git-secrets ou similar para prevenir
```

#### 4. HTTPS em Produção

```nginx
# ✅ Force HTTPS no Nginx
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name seu-dominio.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Configurações SSL modernas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

---

### Para Usuários

#### 1. Senhas Fortes

- ✅ Mínimo 8 caracteres
- ✅ Misture maiúsculas, minúsculas, números e símbolos
- ✅ Não reutilize senhas
- ✅ Use gerenciador de senhas

#### 2. Autenticação

- ✅ Habilite 2FA quando disponível (futuro)
- ✅ Não compartilhe credenciais
- ✅ Faça logout em dispositivos públicos

#### 3. Monitoramento

- ✅ Revise atividades regularmente
- ✅ Reporte acessos suspeitos
- ✅ Atualize email de recuperação

---

## 🚀 Configuração Segura de Produção

### Checklist

```markdown
### Ambiente
- [ ] NODE_ENV=production
- [ ] Secrets fortes e únicos
- [ ] .env não commitado
- [ ] Variáveis no host seguro (Railway, Vercel)

### Banco de Dados
- [ ] Senha forte do PostgreSQL
- [ ] Conexão SSL habilitada
- [ ] Backups automáticos configurados
- [ ] Acesso restrito por IP (se possível)

### API
- [ ] HTTPS habilitado
- [ ] CORS configurado para domínio específico
- [ ] Rate limiting ativo
- [ ] Helmet.js instalado
- [ ] Logs não expõem dados sensíveis

### Stripe
- [ ] Chaves de produção configuradas
- [ ] Webhooks com signature verification
- [ ] HTTPS para endpoints de webhook

### Monitoramento
- [ ] Logs de erro configurados
- [ ] Alertas para atividades suspeitas
- [ ] Backups regulares
```

---

## 📚 Recursos Adicionais

### Leitura Recomendada

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Security Best Practices](https://react.dev/learn/security)

### Ferramentas

- **npm audit** - Verifica vulnerabilidades em dependências
- **Snyk** - Monitora segurança em tempo real
- **git-secrets** - Previne commits de secrets
- **ESLint Security Plugin** - Encontra problemas de segurança no código

---

## 📞 Contato de Segurança

- 📧 Email: security@alignedproposals.com
- 🔐 PGP Key: [Link para chave pública] (futuro)
- ⏱️ Tempo de resposta: 48 horas

---

## 🏅 Hall da Fama de Segurança

Agradecemos às seguintes pessoas por reportarem vulnerabilidades de forma responsável:

*Nenhum report ainda - seja o primeiro!*

---

**A segurança é responsabilidade de todos. Obrigado por ajudar a manter o Aligned Proposals seguro! 🛡️**
