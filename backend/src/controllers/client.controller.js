const prisma = require('../lib/prisma');
const {
  nextClientNumber,
  parseBirthDate,
  buildClientSearch,
} = require('../services/client.service');

const quoteHistorySelect = {
  id: true,
  title: true,
  status: true,
  total: true,
  createdAt: true,
};

class ClientController {
  async create(req, res) {
    try {
      const { name, email, phone, document, birthDate, address, city, state, zipCode } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const parsedBirthDate = parseBirthDate(birthDate);
      if (birthDate && parsedBirthDate === undefined) {
        return res.status(400).json({ error: 'Data de nascimento inválida' });
      }

      const client = await prisma.$transaction(async (tx) => {
        const number = await nextClientNumber(req.companyId, tx);
        return tx.client.create({
          data: {
            number,
            name,
            email,
            phone,
            document,
            birthDate: parsedBirthDate || null,
            address,
            city,
            state,
            zipCode,
            status: 1,
            userId: req.userId,
            companyId: req.companyId,
          },
        });
      });

      return res.status(201).json(client);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      return res.status(500).json({ error: 'Erro ao criar cliente' });
    }
  }

  async list(req, res) {
    try {
      const { search, page = 1, limit = 100, birthdayMonth } = req.query;

      const where = {
        companyId: req.companyId,
        status: 1,
        ...buildClientSearch(search),
      };

      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          include: {
            _count: {
              select: { quotes: true },
            },
          },
          orderBy: [{ number: 'asc' }],
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        prisma.client.count({ where }),
      ]);

      const month = Number(birthdayMonth);
      const filtered =
        month >= 1 && month <= 12
          ? clients.filter((client) => {
              if (!client.birthDate) return false;
              return new Date(client.birthDate).getUTCMonth() + 1 === month;
            })
          : clients;

      return res.json({
        clients: filtered,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: birthdayMonth ? filtered.length : total,
          totalPages: Math.ceil((birthdayMonth ? filtered.length : total) / Number(limit)),
        },
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
          companyId: req.companyId,
          status: 1,
        },
        include: {
          quotes: {
            where: { deletionStatus: 1, companyId: req.companyId },
            select: quoteHistorySelect,
            orderBy: { createdAt: 'desc' },
          },
          sales: {
            where: { companyId: req.companyId },
            select: {
              id: true,
              number: true,
              total: true,
              status: true,
              createdAt: true,
              unit: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      const quotesTotal = client.quotes.reduce(
        (sum, quote) => sum + parseFloat(quote.total || 0),
        0
      );
      const salesTotal = client.sales.reduce(
        (sum, sale) => sum + parseFloat(sale.total || 0),
        0
      );

      return res.json({
        ...client,
        history: {
          quotesCount: client.quotes.length,
          quotesTotal,
          salesCount: client.sales.length,
          salesTotal,
        },
      });
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, phone, document, birthDate, address, city, state, zipCode } = req.body;

      const clientExists = await prisma.client.findFirst({
        where: {
          id,
          companyId: req.companyId,
          status: 1,
        },
      });

      if (!clientExists) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      const parsedBirthDate = parseBirthDate(birthDate);
      if (birthDate && parsedBirthDate === undefined) {
        return res.status(400).json({ error: 'Data de nascimento inválida' });
      }

      const client = await prisma.client.update({
        where: { id },
        data: {
          name,
          email,
          phone,
          document,
          ...(birthDate !== undefined && { birthDate: parsedBirthDate || null }),
          address,
          city,
          state,
          zipCode,
        },
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

      const clientExists = await prisma.client.findFirst({
        where: {
          id,
          companyId: req.companyId,
          status: 1,
        },
      });

      if (!clientExists) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      await prisma.quote.updateMany({
        where: { clientId: id, companyId: req.companyId },
        data: { deletionStatus: -3 },
      });

      await prisma.client.update({
        where: { id },
        data: { status: -3 },
      });

      return res.json({ message: 'Cliente inativado com sucesso' });
    } catch (error) {
      console.error('Erro ao inativar cliente:', error);
      return res.status(500).json({ error: 'Erro ao inativar cliente' });
    }
  }
}

module.exports = new ClientController();
