const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

class UserController {
  async getProfile(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { 
          plan: true,
          _count: {
            select: {
              clients: true,
              quotes: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      delete user.password;

      return res.json(user);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  }

  async updateProfile(req, res) {
    try {
      const { name, company, phone } = req.body;

      const user = await prisma.user.update({
        where: { id: req.userId },
        data: {
          ...(name && { name }),
          ...(company && { company }),
          ...(phone && { phone })
        },
        include: { plan: true }
      });

      delete user.password;

      return res.json(user);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  }

  async updatePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Senhas são obrigatórias' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId }
      });

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: req.userId },
        data: { password: hashedPassword }
      });

      return res.json({ message: 'Senha atualizada com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      return res.status(500).json({ error: 'Erro ao atualizar senha' });
    }
  }

  async uploadLogo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const logoUrl = `/uploads/${req.file.filename}`;

      const user = await prisma.user.update({
        where: { id: req.userId },
        data: { logo: logoUrl },
        include: { plan: true }
      });

      delete user.password;

      return res.json(user);
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
      return res.status(500).json({ error: 'Erro ao fazer upload do logo' });
    }
  }

  async getStats(req, res) {
    try {
      const stats = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          quotesThisMonth: true,
          quotesResetAt: true,
          plan: {
            select: {
              quotesLimit: true
            }
          },
          _count: {
            select: {
              clients: true,
              quotes: true
            }
          }
        }
      });

      // Buscar orçamentos por status
      const quotesByStatus = await prisma.quote.groupBy({
        by: ['status'],
        where: { userId: req.userId },
        _count: true
      });

      const statusCounts = {
        pending: 0,
        approved: 0,
        rejected: 0
      };

      quotesByStatus.forEach(item => {
        statusCounts[item.status] = item._count;
      });

      return res.json({
        ...stats,
        quotesByStatus: statusCounts
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }

  async deleteAccount(req, res) {
    try {
      // Deletar todos os dados relacionados ao usuário
      await prisma.$transaction([
        prisma.quote.deleteMany({ where: { userId: req.userId } }),
        prisma.client.deleteMany({ where: { userId: req.userId } }),
        prisma.user.delete({ where: { id: req.userId } })
      ]);

      return res.json({ message: 'Conta excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      return res.status(500).json({ error: 'Erro ao excluir conta' });
    }
  }

  async upgradePlan(req, res) {
    try {
      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ error: 'ID do plano é obrigatório' });
      }

      // Verificar se o plano existe
      const plan = await prisma.plan.findUnique({
        where: { id: planId }
      });

      if (!plan) {
        return res.status(404).json({ error: 'Plano não encontrado' });
      }

      // Aqui você integraria com Stripe ou outro gateway de pagamento
      // Por enquanto, apenas atualizamos o plano diretamente

      const user = await prisma.user.update({
        where: { id: req.userId },
        data: { 
          planId,
          quotesThisMonth: 0, // Resetar contador ao fazer upgrade
          quotesResetAt: new Date()
        },
        include: { plan: true }
      });

      delete user.password;

      return res.json(user);
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error);
      return res.status(500).json({ error: 'Erro ao fazer upgrade do plano' });
    }
  }
}

module.exports = new UserController();
