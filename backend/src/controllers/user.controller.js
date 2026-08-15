const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const { USER_TENANT_INCLUDE, sanitizeUser } = require('../services/tenant.service');

class UserController {
  async getProfile(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: {
          ...USER_TENANT_INCLUDE,
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

      return res.json(sanitizeUser(user));
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  }

  async updateProfile(req, res) {
    try {
      const { name, company, phone, website } = req.body;

      if (company && req.companyId) {
        await prisma.company.update({
          where: { id: req.companyId },
          data: { name: company },
        });
      }

      const user = await prisma.user.update({
        where: { id: req.userId },
        data: {
          ...(name && { name }),
          ...(company && { companyName: company }),
          ...(phone && { phone }),
          ...(website && { website })
        },
        include: USER_TENANT_INCLUDE
      });

      return res.json(sanitizeUser(user));
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
        include: USER_TENANT_INCLUDE
      });

      return res.json(sanitizeUser(user));
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
      return res.status(500).json({ error: 'Erro ao fazer upload do logo' });
    }
  }

  async deleteLogo(req, res) {
    try {
      const fs = require('fs');
      const path = require('path');

      // Buscar usuário para pegar o caminho do logo
      const user = await prisma.user.findUnique({
        where: { id: req.userId }
      });

      if (!user?.logo) {
        return res.status(400).json({ error: 'Nenhuma logo para deletar' });
      }

      // Deletar arquivo físico se existir
      const logoPath = path.join(__dirname, '../../' + user.logo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }

      // Atualizar banco de dados
      const updatedUser = await prisma.user.update({
        where: { id: req.userId },
        data: { logo: null },
        include: USER_TENANT_INCLUDE
      });

      return res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error('Erro ao deletar logo:', error);
      return res.status(500).json({ error: 'Erro ao deletar logo' });
    }
  }

  async getStats(req, res) {
    try {
      const { clientId } = req.query;
      
      const stats = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          quotesThisMonth: true,
          quotesResetAt: true,
          plan: {
            select: {
              quotesLimit: true
            }
          }
        }
      });

      let quoteFilter = { companyId: req.companyId, deletionStatus: 1 };
      if (clientId) {
        quoteFilter.clientId = clientId;
      }

      const [clientsCount, quotesCount, quotesByStatus] = await Promise.all([
        prisma.client.count({
          where: { companyId: req.companyId, status: 1 },
        }),
        prisma.quote.count({ where: quoteFilter }),
        prisma.quote.groupBy({
          by: ['status'],
          where: quoteFilter,
          _count: true
        }),
      ]);

      const statusCounts = {
        pending: 0,
        approved: 0,
        rejected: 0,
        no_return: 0
      };

      quotesByStatus.forEach(item => {
        statusCounts[item.status] = item._count;
      });

      return res.json({
        ...stats,
        _count: {
          clients: clientsCount,
          quotes: quotesCount,
        },
        quotesByStatus: statusCounts
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }

  async deleteAccount(req, res) {
    try {
      await prisma.user.update({
        where: { id: req.userId },
        data: { active: false }
      });

      return res.json({ message: 'Conta inativada com sucesso' });
    } catch (error) {
      console.error('Erro ao inativar conta:', error);
      return res.status(500).json({ error: 'Erro ao inativar conta' });
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
        include: USER_TENANT_INCLUDE
      });

      return res.json(sanitizeUser(user));
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error);
      return res.status(500).json({ error: 'Erro ao fazer upgrade do plano' });
    }
  }
}

module.exports = new UserController();
