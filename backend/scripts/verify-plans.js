const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyPlans() {
  try {
    console.log('\n📋 Verificando Planos no Banco de Dados...\n');
    
    const plans = await prisma.plan.findMany();
    
    if (plans.length === 0) {
      console.log('❌ Nenhum plano encontrado!');
      return;
    }

    console.log(`✅ ${plans.length} planos encontrados:\n`);
    
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name}`);
      console.log(`   ID: ${plan.id}`);
      console.log(`   Preço: R$ ${plan.price.toFixed(2)}`);
      console.log(`   Price ID Stripe: ${plan.stripePriceId}`);
      console.log(`   Limite: ${plan.quotesLimit === -1 ? 'Ilimitado' : plan.quotesLimit}`);
      console.log(`   Marca d'água: ${plan.hasWatermark ? 'Sim' : 'Não'}`);
      console.log(`   Criado: ${new Date(plan.createdAt).toLocaleString('pt-BR')}\n`);
    });

    console.log('✅ Todos os planos estão configurados corretamente!');
    console.log('\n📝 Próximo Passo: Iniciar o servidor backend\n');
    
  } catch (error) {
    console.error('❌ Erro ao verificar planos:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPlans();
