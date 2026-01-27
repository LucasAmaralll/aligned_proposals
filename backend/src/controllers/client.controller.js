const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class ClientController {
  async create(req, res) {
    try {
      const { name, email, phone, document, address, city, state, zipCode } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const client = await prisma.client.create({
        data: {
          name,
          email,
          phone,
          document,
          address,
          city,
          state,
          zipCode,
          status: 1,
          userId: req.userId
        }
      });

      return res.status(201).json(client);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      return res.status(500).json({ error: 'Erro ao criar cliente' });
    }
  }

  async list(req, res) {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      const where = {
        userId: req.userId,
        status: 1, // Apenas clientes ativos
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          include: {
            _count: {
              select: { quotes: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit)
        }),
        prisma.client.count({ where })
      ]);

      return res.json({
        clients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      return res.status(500).json({ error: 'Erro ao listar clientes' });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;

      const client = await prisma.client.findFirst({
        where: {
          id,
          userId: req.userId,
          status: 1 // Apenas clientes ativos
        },
        include: {
          quotes: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      return res.json(client);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, phone, document, address, city, state, zipCode } = req.body;

      // Verificar se cliente pertence ao usuário e está ativo
      const clientExists = await prisma.client.findFirst({
        where: {
          id,
          userId: req.userId,
          status: 1 // Apenas clientes ativos
        }
      });

      if (!clientExists) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      const client = await prisma.client.update({
        where: { id },
        data: {
          name,
          email,
          phone,
          document,
          address,
          city,
          state,
          zipCode
        }
      });

      return res.json(client);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      return res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      // Verificar se cliente pertence ao usuário e está ativo
      const clientExists = await prisma.client.findFirst({
        where: {
          id,
          userId: req.userId,
          status: 1 // Apenas clientes ativos
        }
      });

      if (!clientExists) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      // Soft delete em cascata: marcar todos os orçamentos do cliente como inativos
      await prisma.quote.updateMany({
        where: { clientId: id },
        data: { deletionStatus: -3 }
      });

      // Soft delete: marcar cliente como inativo (LGPD)
      await prisma.client.update({
        where: { id },
        data: { status: -3 }
      });

      return res.json({ message: 'Cliente inativado com sucesso' });
    } catch (error) {
      console.error('Erro ao inativar cliente:', error);
      return res.status(500).json({ error: 'Erro ao inativar cliente' });
    }
  }
}

module.exports = new ClientController();
