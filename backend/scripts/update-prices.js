#!/usr/bin/env node

/**
 * Script interativo para atualizar Price IDs do Stripe
 * Uso: npm run update-prices
 * ou: node scripts/update-prices.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const envPath = path.join(__dirname, '..', '.env');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🔧 Configurador de Price IDs - Stripe\n');
  console.log('Este script vai atualizar seus Price IDs no .env\n');

  // Ler arquivo .env atual
  let envContent = fs.readFileSync(envPath, 'utf-8');

  console.log('📋 Instruções:');
  console.log('1. Abra: https://dashboard.stripe.com/test/products');
  console.log('2. Para cada produto, vá em "Pricing" e copie o Price ID (price_xxx)');
  console.log('3. Cole aqui os valores\n');

  const basicoPrice = await question(
    'Price ID para "Básico" (prod_U0hqNQUGGz3Oji): '
  );
  const profissionalPrice = await question(
    'Price ID para "Profissional" (prod_U0hqynKkCJ3R6D): '
  );

  // Validar format
  if (!basicoPrice.startsWith('price_') || !profissionalPrice.startsWith('price_')) {
    console.error(
      '\n❌ Erro: Os Price IDs devem começar com "price_"'
    );
    process.exit(1);
  }

  // Atualizar .env
  envContent = envContent.replace(
    /STRIPE_PRICE_ID_BASICO=.*/,
    `STRIPE_PRICE_ID_BASICO=${basicoPrice}`
  );

  envContent = envContent.replace(
    /STRIPE_PRICE_ID_PROFISSIONAL=.*/,
    `STRIPE_PRICE_ID_PROFISSIONAL=${profissionalPrice}`
  );

  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Arquivo .env atualizado com sucesso!\n');
  console.log('📝 Valores configurados:');
  console.log(`   STRIPE_PRICE_ID_BASICO=${basicoPrice}`);
  console.log(`   STRIPE_PRICE_ID_PROFISSIONAL=${profissionalPrice}\n`);

  console.log('🔄 Próximo passo - Re-execute o seed:');
  console.log('   npm run seed\n');

  rl.close();
}

main().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
