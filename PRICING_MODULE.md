# Módulo de Precificação Inteligente

Este módulo adiciona funcionalidade de cálculo de preços de produtos/serviços ao SaaS de orçamentos.

## Estrutura Criada

### Backend

#### 1. Schema do Prisma (`backend/prisma/schema.prisma`)
- Modelo `Product` adicionado com todos os campos necessários para precificação
- Relacionamento com o modelo `User`

#### 2. Função de Cálculo (`backend/src/utils/calculatePrice.js`)
- Função `calculateProductPrice()` - calcula todos os custos e preços
- Retorna:
  - Custos detalhados (matérias-primas, energia, mão de obra, despesas)
  - Preço mínimo e ideal de venda
  - Composição percentual dos custos

#### 3. Controlador (`backend/src/controllers/product.controller.js`)
- `getProducts` - Lista todos os produtos do usuário
- `getProductById` - Busca um produto específico
- `createProduct` - Cria novo produto com cálculo automático
- `updateProduct` - Atualiza produto e recalcula preços
- `deleteProduct` - Remove produto
- `calculatePrice` - Calcula preço sem salvar (preview)

#### 4. Rotas (`backend/src/routes/product.routes.js`)
- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Buscar produto
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto
- `POST /api/products/calculate` - Calcular preço (preview)

### Frontend

#### 1. Componente (`frontend/src/components/PricingCalculator.jsx`)
- Formulário completo para entrada de dados
- Campos dinâmicos para matérias-primas e despesas
- Exibição detalhada dos resultados
- Gráficos de barras mostrando composição percentual dos custos
- Totalmente reutilizável

#### 2. Página (`frontend/src/pages/ProductPricing.jsx`)
- Lista de produtos salvos
- Criação e edição de produtos
- Integração com o componente PricingCalculator
- Interface completa de gerenciamento

#### 3. Rotas (`frontend/src/App.jsx`)
- `/pricing` - Lista e criação de produtos
- `/pricing/:id` - Edição de produto específico

## Próximos Passos

### 1. Executar Migração do Banco de Dados

```bash
cd backend
npx prisma migrate dev --name add_products
```

### 2. Atualizar o Sidebar

Adicione um link para o módulo de precificação no componente `Sidebar.jsx`:

```jsx
<Link to="/pricing">
  <span>💰</span>
  <span>Precificação</span>
</Link>
```

### 3. Testar o Módulo

1. Acesse `/pricing` no frontend
2. Clique em "Novo Produto"
3. Preencha os dados do produto
4. Clique em "Calcular Preço" para ver o resultado
5. Clique em "Salvar Produto" para persistir

## Campos do Formulário

### Informações Básicas
- **Nome do Produto/Serviço** (obrigatório)
- **Descrição** (opcional)

### Custos
- **Matérias-primas**: Lista dinâmica com nome e custo
- **Tempo de Produção**: Em horas (aceita decimais)
- **Consumo de Energia**: Em kWh
- **Custo por kWh**: Valor em R$
- **Mão de Obra por Hora**: Quanto deseja ganhar por hora
- **Despesas**: Lista dinâmica com nome, custo e tipo (fixa/variável)
- **Margem de Lucro**: Percentual desejado

## Resultados Exibidos

### Custos Detalhados
- Matérias-primas
- Energia elétrica
- Mão de obra
- Despesas fixas
- Despesas variáveis
- **Custo Total**

### Preços Calculados
- **Preço Mínimo**: Custo de produção sem lucro
- **Preço Ideal**: Preço com margem de lucro aplicada
- **Lucro por Unidade**: Valor do lucro

### Composição Percentual
- Gráfico de barras mostrando a participação de cada custo no preço final
- Percentual de cada componente em relação ao preço ideal

## Observações

- O módulo **NÃO** insere automaticamente o preço no PDF de orçamento
- Os valores calculados servem apenas como referência para o usuário
- Todos os cálculos são armazenados no banco para consultas futuras
- A função `calculateProductPrice()` é reutilizável e pode ser importada em outros módulos

## Exemplo de Uso da Função de Cálculo

```javascript
const { calculateProductPrice } = require('./utils/calculatePrice');

const produto = {
  rawMaterials: [
    { name: 'Farinha', cost: 5.00 },
    { name: 'Açúcar', cost: 3.00 }
  ],
  productionTimeHours: 2,
  energyConsumptionKwh: 1.5,
  energyCostPerKwh: 0.80,
  laborCostPerHour: 25.00,
  expenses: [
    { name: 'Aluguel', cost: 10.00, type: 'fixed' },
    { name: 'Embalagem', cost: 2.00, type: 'variable' }
  ],
  profitMargin: 30
};

const resultado = calculateProductPrice(produto);
console.log(resultado);
// {
//   costs: { rawMaterials: 8.00, energy: 1.20, labor: 50.00, ... },
//   prices: { minimumSalePrice: 71.20, idealSalePrice: 101.71, ... },
//   breakdown: { ... }
// }
```

## API Endpoints

### Listar Produtos
```
GET /api/products
Authorization: Bearer {token}
```

### Criar Produto
```
POST /api/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Bolo de Chocolate",
  "description": "Bolo grande de chocolate",
  "rawMaterials": [...],
  "productionTimeHours": 2,
  "energyConsumptionKwh": 1.5,
  "energyCostPerKwh": 0.80,
  "laborCostPerHour": 25.00,
  "expenses": [...],
  "profitMargin": 30
}
```

### Calcular Preço (Preview)
```
POST /api/products/calculate
Authorization: Bearer {token}
Content-Type: application/json

{
  "rawMaterials": [...],
  "productionTimeHours": 2,
  ...
}
```

## Melhorias Futuras (Opcionais)

1. **Gráfico de Pizza**: Adicionar biblioteca de gráficos (Chart.js, Recharts) para visualização em pizza
2. **Exportar Cálculos**: Permitir exportar os cálculos em PDF ou Excel
3. **Histórico de Preços**: Manter histórico de alterações de preços
4. **Comparação de Produtos**: Comparar custos entre diferentes produtos
5. **Sugestões de Preço**: Baseado em produtos similares ou mercado
6. **Integração com Orçamentos**: Opção de usar preços salvos ao criar orçamentos
