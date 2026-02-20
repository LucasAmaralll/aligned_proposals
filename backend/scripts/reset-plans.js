const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetAndSeedPlans() {
  try {
    console.log('🗑️  Deletando planos antigos...');
    const deleted = await prisma.plan.deleteMany({});
    console.log(`✅ ${deleted.count} planos deletados\n`);

    console.log('🌱 Criando planos novo com Stripe...\n');

    const plans = [
      {
        name: 'Gratuito',
        price: 0.00,
        stripePriceId: null,
        quotesLimit: 5,
        hasWatermark: true,
        features: [
          '5 orçamentos por mês',
          'PDF com marca d\'água',
          'Cadastro de clientes',
          'Envio via WhatsApp e Email',
          'Suporte por email',
        ],
      },
      {
        name: 'Básico',
        price: 29.90,
        stripePriceId: process.env.STRIPE_PRICE_ID_BASICO || 'price_PLACEHOLDER_BASICO',
        quotesLimit: 50,
        hasWatermark: false,
        features: [
          '50 orçamentos por mês',
          'PDF sem marca d\'água',
          'Cadastro ilimitado de clientes',
          'Envio via WhatsApp e Email',
          'Página pública',
          'Logo personalizado',
          'Suporte por email',
        ],
      },
      {
        name: 'Profissional',
        price: 79.90,
        stripePriceId: process.env.STRIPE_PRICE_ID_PROFISSIONAL || 'price_PLACEHOLDER_PROFISSIONAL',
        quotesLimit: -1,
        hasWatermark: false,
        features: [
          '✅ Orçamentos ILIMITADOS',
          'PDF sem marca d\'água',
          'Cadastro ilimitado de clientes',
          'Envio via WhatsApp e Email',
          'Página pública com logo',
          '✅ Dashboard Completo',
          '✅ Relatórios Avançados',
          '✅ Análise de Custos',
          'Suporte prioritário',
          'API de integração',
        ],
      },
    ];

    for (const plan of plans) {
      const created = await prisma.plan.create({ data: plan });
      console.log(`✅ ${created.name}`);
      console.log(`   💰 R$ ${created.price.toFixed(2)}/mês`);
      console.log(`   🔗 Price ID: ${created.stripePriceId}`);
      console.log(`   📊 Limite: ${created.quotesLimit === -1 ? 'Ilimitado' : created.quotesLimit}\n`);
    }

    console.log('🎉 Seed concluído!');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('Os Price IDs ainda estão como placeholders.');
    console.log('Você PRECISA atualizar o .env com os valores reais:');
    console.log('  1. Abra Stripe Dashboard');
    console.log('  2. Vá em Products > Seus Produtos');
    console.log('  3. Copie o Price ID (price_xxx) de cada um');
    console.log('  4. Atualize .env:');
    console.log('     STRIPE_PRICE_ID_BASICO=price_xxx');
    console.log('     STRIPE_PRICE_ID_PROFISSIONAL=price_yyy');
    console.log('  5. Re-execute este script');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetAndSeedPlans();
