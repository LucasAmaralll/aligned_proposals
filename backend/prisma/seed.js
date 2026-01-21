const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPlans() {
  try {
    console.log('🌱 Criando planos padrão...');

    // Verificar se já existem planos
    const existingPlans = await prisma.plan.findMany();
    if (existingPlans.length > 0) {
      console.log('⚠️  Planos já existem no banco de dados!');
      console.log(`📊 Total de planos: ${existingPlans.length}`);
      existingPlans.forEach(plan => {
        console.log(`   - ${plan.name}: R$ ${plan.price.toFixed(2)}`);
      });
      return;
    }

    // Criar planos
    const plans = [
      {
        name: 'Gratuito',
        price: 0,
        quotesLimit: 3,
        hasWatermark: true,
        features: [
          '3 orçamentos por mês',
          'PDF com marca d\'água',
          'Envio via WhatsApp',
          'Envio via Email',
          'Página pública',
        ],
      },
      {
        name: 'Básico',
        price: 19.90,
        quotesLimit: 20,
        hasWatermark: false,
        features: [
          '20 orçamentos por mês',
          'PDF sem marca d\'água',
          'Envio via WhatsApp',
          'Envio via Email',
          'Página pública',
          'Logo personalizado',
          'Suporte por email',
        ],
      },
      {
        name: 'Pro',
        price: 49.90,
        quotesLimit: -1, // -1 = ilimitado
        hasWatermark: false,
        features: [
          'Orçamentos ilimitados',
          'PDF sem marca d\'água',
          'Envio via WhatsApp',
          'Envio via Email',
          'Página pública',
          'Logo personalizado',
          'Relatórios avançados',
          'Suporte prioritário',
          'API de integração',
        ],
      },
    ];

    for (const planData of plans) {
      const plan = await prisma.plan.create({
        data: planData,
      });
      console.log(`✅ Plano "${plan.name}" criado com sucesso!`);
    }

    console.log('\n🎉 Todos os planos foram criados!');
    console.log('\n📋 Resumo:');
    
    const allPlans = await prisma.plan.findMany();
    allPlans.forEach(plan => {
      const limit = plan.quotesLimit === -1 ? 'Ilimitado' : `${plan.quotesLimit}/mês`;
      console.log(`\n${plan.name}`);
      console.log(`   💰 Preço: R$ ${plan.price.toFixed(2)}`);
      console.log(`   📊 Limite: ${limit}`);
      console.log(`   🏷️  Marca d'água: ${plan.hasWatermark ? 'Sim' : 'Não'}`);
    });

  } catch (error) {
    console.error('❌ Erro ao criar planos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedPlans()
  .then(() => {
    console.log('\n✨ Seed concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  });
