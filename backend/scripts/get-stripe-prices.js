#!/usr/bin/env node

/**
 * Script para consultar Price IDs do Stripe usando Stripe CLI
 * Uso: node scripts/get-stripe-prices.js
 */

const { execSync } = require('child_process');

const products = {
  BASICO: 'prod_U0hqNQUGGz3Oji',
  PROFISSIONAL: 'prod_U0hqynKkCJ3R6D',
};

console.log('🔍 Consultando Price IDs do Stripe...\n');

try {
  Object.entries(products).forEach(([planName, productId]) => {
    console.log(`📦 ${planName} (${productId})`);
    
    try {
      const result = execSync(`stripe prices list --product=${productId}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      
      const lines = result.split('\n');
      const priceIds = lines.filter(line => line.includes('price_'));
      
      if (priceIds.length > 0) {
        console.log('   Preços encontrados:');
        priceIds.forEach(line => {
          const match = line.match(/price_[a-zA-Z0-9_]+/);
          if (match) {
            console.log(`   ✅ ${match[0]}`);
          }
        });
      } else {
        console.log('   ⚠️  Nenhum price ID encontrado');
      }
    } catch (error) {
      console.log(`   ❌ Erro ao consultar: ${error.message}`);
    }
    
    console.log();
  });

  console.log('\n📝 PRÓXIMOS PASSOS:');
  console.log('1. Copie um Price ID para cada plano');
  console.log('2. Atualize as variáveis no .env:');
  console.log('   STRIPE_PRICE_ID_BASICO=price_xxx');
  console.log('   STRIPE_PRICE_ID_PROFISSIONAL=price_yyy');
  console.log('3. Execute: npm run seed\n');

} catch (error) {
  console.error('❌ Erro:', error.message);
  console.error('\n⚠️  Certifique-se que você tem Stripe CLI instalado:');
  console.error('   https://stripe.com/docs/stripe-cli');
  process.exit(1);
}
