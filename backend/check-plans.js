const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPlans() {
  try {
    console.log('🔍 Verificando planos no banco de dados...\n');
    
    const plans = await prisma.plan.findMany();
    
    if (plans.length === 0) {
      console.log('⚠️  Nenhum plano encontrado!');
      console.log('📝 Criando planos padrão...\n');
      
      await prisma.plan.createMany({
        data: [
          {
            name: 'Gratuito',
            price: 0,
            quotesLimit: 5,
            hasWatermark: true,
            features: JSON.stringify([
              '5 orçamentos por mês',
              'PDF com marca d\'água',
              'Cadastro de clientes',
              'Envio via WhatsApp',
              '❌ Sem Dashboard',
              '❌ Sem Precificação',
            ])
          },
          {
            name: 'Básico',
            price: 29.90,
            quotesLimit: 50,
            hasWatermark: false,
            features: JSON.stringify([
              '50 orçamentos por mês',
              'PDF sem marca d\'água',
              'Logo personalizado',
              '✅ Precificação Inteligente',
              '❌ Dashboard Limitado',
            ])
          },
          {
            name: 'Pro',
            price: 79.90,
            quotesLimit: -1,
            hasWatermark: false,
            features: JSON.stringify([
              '✅ Orçamentos ILIMITADOS',
              'PDF sem marca d\'água',
              '✅ Precificação Completa',
              '✅ Dashboard Completo',
              'Suporte prioritário',
            ])
          }
        ]
      });
      
      console.log('✅ Planos criados com sucesso!');
      
      const newPlans = await prisma.plan.findMany();
      console.log(`\n📊 Total de planos: ${newPlans.length}\n`);
      newPlans.forEach(p => {
        console.log(`   - ${p.name}: R$ ${Number(p.price).toFixed(2)}`);
      });
    } else {
      console.log(`✅ ${plans.length} planos encontrados:\n`);
      plans.forEach(p => {
        console.log(`   - ${p.name}: R$ ${Number(p.price).toFixed(2)} (Limite: ${p.quotesLimit === -1 ? 'Ilimitado' : p.quotesLimit})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlans();
