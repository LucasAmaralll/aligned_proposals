# 🤝 Guia de Contribuição

Obrigado por considerar contribuir com o **Aligned Proposals**! Este documento fornece diretrizes para contribuir com o projeto.

---

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Posso Contribuir?](#como-posso-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Processo de Desenvolvimento](#processo-de-desenvolvimento)
- [Padrões de Código](#padrões-de-código)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Reportando Bugs](#reportando-bugs)
- [Sugerindo Funcionalidades](#sugerindo-funcionalidades)

---

## 📜 Código de Conduta

Este projeto adere a um Código de Conduta. Ao participar, você concorda em manter um ambiente respeitoso e inclusivo.

### Nossos Valores
- ✅ Ser respeitoso e inclusivo
- ✅ Aceitar críticas construtivas
- ✅ Focar no que é melhor para a comunidade
- ✅ Mostrar empatia com outros membros

### Comportamentos Inaceitáveis
- ❌ Linguagem ou imagens ofensivas
- ❌ Assédio público ou privado
- ❌ Trolling ou comentários insultuosos
- ❌ Publicar informações privadas de outros

---

## 🚀 Como Posso Contribuir?

### 1. 🐛 Reportar Bugs
Encontrou um bug? Ajude-nos a corrigi-lo!

**Antes de reportar:**
- Verifique se o bug já foi reportado nas [Issues](https://github.com/seu-usuario/aligned-proposals/issues)
- Certifique-se de estar usando a versão mais recente
- Tente reproduzir o bug em ambiente limpo

**Ao reportar, inclua:**
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs. atual
- Screenshots (se aplicável)
- Ambiente (OS, Node.js version, navegador)

### 2. ✨ Sugerir Funcionalidades
Tem uma ideia legal?

**Antes de sugerir:**
- Verifique o [ROADMAP.md](ROADMAP.md)
- Procure por sugestões similares nas Issues

**Ao sugerir, inclua:**
- Descrição clara da funcionalidade
- Por que seria útil?
- Como deveria funcionar?
- Exemplos de uso

### 3. 💻 Contribuir com Código
Quer adicionar código ao projeto?

**Áreas que precisam de ajuda:**
- 🧪 Testes automatizados
- 📱 Responsividade mobile
- 🌐 Internacionalização (i18n)
- 📊 Novos tipos de relatórios
- 🎨 Melhorias de UI/UX
- 📚 Documentação

### 4. 📚 Melhorar Documentação
Documentação nunca é demais!

- Corrigir erros de digitação
- Adicionar exemplos
- Traduzir para outros idiomas
- Criar tutoriais em vídeo
- Escrever artigos/blog posts

---

## ⚙️ Configuração do Ambiente

### Pré-requisitos
```bash
# Verifique as versões instaladas
node --version  # v18+
npm --version   # v9+
psql --version  # v14+
```

### Instalação

1. **Fork o repositório**
   - Clique em "Fork" no GitHub

2. **Clone seu fork**
   ```bash
   git clone https://github.com/SEU-USUARIO/aligned-proposals.git
   cd aligned-proposals
   ```

3. **Adicione o repositório original como upstream**
   ```bash
   git remote add upstream https://github.com/ORIGINAL-USUARIO/aligned-proposals.git
   ```

4. **Instale as dependências**
   ```bash
   npm run setup
   ```

5. **Configure as variáveis de ambiente**
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edite o .env com suas configurações

   # Frontend
   cd ../frontend
   cp .env.example .env
   # Edite o .env com suas configurações
   ```

6. **Execute as migrations**
   ```bash
   cd backend
   npx prisma migrate dev
   ```

7. **Crie os planos padrão**
   - Acesse `http://localhost:5000/api/plans/seed`

8. **Inicie o servidor de desenvolvimento**
   ```bash
   # Na raiz do projeto
   npm run dev
   ```

---

## 🔄 Processo de Desenvolvimento

### 1. Crie uma Branch

```bash
# Atualize seu fork
git checkout main
git pull upstream main

# Crie uma branch para sua feature/fix
git checkout -b tipo/nome-descritivo

# Exemplos:
git checkout -b feature/adicionar-modo-escuro
git checkout -b fix/corrigir-calculo-total
git checkout -b docs/melhorar-readme
```

### 2. Faça suas Alterações

- Escreva código limpo e legível
- Siga os padrões do projeto
- Adicione comentários quando necessário
- Atualize a documentação relevante

### 3. Teste suas Alterações

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start

# Teste manualmente todas as funcionalidades afetadas
```

### 4. Commit suas Alterações

Siga o padrão de [Conventional Commits](#commit-messages):

```bash
git add .
git commit -m "feat: adicionar modo escuro"
```

### 5. Push para seu Fork

```bash
git push origin tipo/nome-descritivo
```

### 6. Abra um Pull Request

- Vá para o repositório original no GitHub
- Clique em "New Pull Request"
- Selecione sua branch
- Preencha o template de PR

---

## 📐 Padrões de Código

### JavaScript/React

**Estilo:**
- Use ESLint (configuração do projeto)
- Indentação: 2 espaços
- Aspas: simples (`'`)
- Ponto e vírgula: obrigatório
- Nomes em camelCase

**Exemplo:**
```javascript
// ✅ Bom
const handleSubmit = async (data) => {
  try {
    const response = await api.post('/quotes', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    throw error;
  }
};

// ❌ Evitar
const handle_submit = async function(data) {
  const response = await api.post('/quotes', data)
  return response.data
}
```

### Componentes React

**Estrutura:**
```javascript
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const MeuComponente = ({ titulo, onSubmit }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Side effects aqui
  }, []);

  const handleClick = () => {
    // Lógica aqui
  };

  return (
    <div className="container">
      {/* JSX aqui */}
    </div>
  );
};

MeuComponente.propTypes = {
  titulo: PropTypes.string.isRequired,
  onSubmit: PropTypes.func,
};

export default MeuComponente;
```

### Backend (Node.js/Express)

**Controllers:**
```javascript
// ✅ Bom
exports.create = async (req, res) => {
  try {
    const { title, clientId } = req.body;
    
    // Validação
    if (!title || !clientId) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios não preenchidos' 
      });
    }

    // Lógica de negócio
    const quote = await prisma.quote.create({
      data: { title, clientId, userId: req.user.id }
    });

    return res.status(201).json(quote);
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
};
```

### Tailwind CSS

**Classes:**
- Use classes utilitárias
- Siga a ordem: layout → espaçamento → tipografia → cores → outros
- Extraia para componentes quando repetitivo

```jsx
// ✅ Bom
<button className="flex items-center px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600">
  Clique Aqui
</button>

// ❌ Evitar
<button className="bg-blue-500 text-white hover:bg-blue-600 rounded flex px-4 py-2 items-center">
  Clique Aqui
</button>
```

### Prisma Schema

```prisma
// ✅ Bom
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  quotes    Quote[]
  
  @@map("users")
}
```

---

## 📝 Commit Messages

Use o padrão **Conventional Commits**:

### Formato

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé(s) opcional(is)]
```

### Tipos

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (sem mudança de código)
- `refactor`: Refatoração de código
- `test`: Adicionar/melhorar testes
- `chore`: Tarefas de manutenção
- `perf`: Melhoria de performance

### Exemplos

```bash
# Feature
feat: adicionar modo escuro
feat(auth): implementar login com Google

# Fix
fix: corrigir cálculo de total no orçamento
fix(pdf): resolver erro ao gerar PDF com logo

# Docs
docs: atualizar guia de instalação
docs(api): adicionar exemplos de uso

# Refactor
refactor: simplificar lógica do controller de quotes
refactor(components): extrair lógica comum para hook

# Chore
chore: atualizar dependências
chore(deps): bump express from 4.18.0 to 4.18.2
```

### Breaking Changes

```bash
feat!: alterar estrutura da API de autenticação

BREAKING CHANGE: O endpoint /auth/login agora retorna
um objeto com estrutura diferente. Atualize seu código
para usar response.data.user ao invés de response.user
```

---

## 🔀 Pull Requests

### Antes de Abrir

- ✅ Seu código está atualizado com a branch `main`?
- ✅ Todos os testes passam?
- ✅ O código segue os padrões do projeto?
- ✅ A documentação foi atualizada?
- ✅ Não há conflitos com a branch principal?

### Template de PR

```markdown
## Descrição
Breve descrição das mudanças

## Tipo de Mudança
- [ ] 🐛 Bug fix
- [ ] ✨ Nova feature
- [ ] 💥 Breaking change
- [ ] 📚 Documentação

## Como Testar
1. Passo 1
2. Passo 2
3. Passo 3

## Screenshots (se aplicável)
Adicione imagens/gifs

## Checklist
- [ ] Meu código segue os padrões do projeto
- [ ] Fiz self-review do código
- [ ] Comentei partes complexas
- [ ] Atualizei a documentação
- [ ] Minhas mudanças não geram novos warnings
- [ ] Testei localmente
```

### Processo de Review

1. **Automático:**
   - Verificação de lint
   - Execução de testes (futuro)

2. **Manual:**
   - Code review por mantenedores
   - Testes de funcionalidade
   - Verificação de documentação

3. **Aprovação:**
   - Pelo menos 1 aprovação de mantenedor
   - Todos os comentários resolvidos
   - CI passa (futuro)

---

## 🐛 Reportando Bugs

### Template de Issue

```markdown
## Descrição do Bug
Descrição clara e concisa do bug

## Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

## Comportamento Esperado
O que deveria acontecer

## Comportamento Atual
O que está acontecendo

## Screenshots
Se aplicável, adicione screenshots

## Ambiente
- OS: [e.g. Windows 11]
- Navegador: [e.g. Chrome 120]
- Node.js: [e.g. 18.17.0]
- Versão: [e.g. 1.0.0]

## Logs de Erro
```
Cole os logs aqui
```

## Contexto Adicional
Qualquer outra informação relevante
```

---

## ✨ Sugerindo Funcionalidades

### Template de Feature Request

```markdown
## Qual problema isso resolve?
Descrição do problema que a feature resolveria

## Solução Proposta
Como você imagina que isso funcionaria?

## Alternativas Consideradas
Outras soluções que você pensou?

## Exemplos de Uso
```javascript
// Como seria usado?
const example = usarNovaFeature();
```

## Screenshots/Mockups
Adicione se tiver

## Prioridade
- [ ] Alta
- [ ] Média
- [ ] Baixa

## Impacto
Quantos usuários seriam beneficiados?
```

---

## 🏆 Reconhecimento

Contribuidores serão:
- Listados no README.md
- Mencionados no CHANGELOG.md
- Terão nosso eterno agradecimento! ❤️

---

## 📞 Precisa de Ajuda?

- 💬 Abra uma [Discussion](https://github.com/seu-usuario/aligned-proposals/discussions)
- 📧 Envie email para dev@alignedproposals.com
- 📚 Leia a [Documentação](README.md)

---

**Obrigado por contribuir! 🎉**

Juntos construímos algo incrível! 🚀
