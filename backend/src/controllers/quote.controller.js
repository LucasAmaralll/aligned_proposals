const { PrismaClient } = require('@prisma/client');
const pdfService = require('../services/pdf.service');
const emailService = require('../services/email.service');

const prisma = new PrismaClient();

class QuoteController {
  async create(req, res) {
    try {
      const { title, description, clientId, items, discount, tax, notes, termsConditions, validUntil } = req.body;

      // Validações
      if (!title || !clientId || !items || items.length === 0) {
        return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
      }

      // Verificar limite de orçamentos do plano
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { plan: true }
      });

      // Resetar contador se passou o mês
      const now = new Date();
      const resetDate = new Date(user.quotesResetAt);
      
      if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
        await prisma.user.update({
          where: { id: req.userId },
          data: {
            quotesThisMonth: 0,
            quotesResetAt: now
          }
        });
        user.quotesThisMonth = 0;
      }

      // Verificar limite
      if (user.plan.quotesLimit !== -1 && user.quotesThisMonth >= user.plan.quotesLimit) {
        return res.status(403).json({ 
          error: 'Limite de orçamentos atingido',
          message: `Você atingiu o limite de ${user.plan.quotesLimit} orçamentos do plano ${user.plan.name}. Faça upgrade para continuar.`
        });
      }

      // Calcular valores
      const subtotal = items.reduce((sum, item) => {
        return sum + (parseFloat(item.unitPrice || 0) * parseFloat(item.quantity || 0));
      }, 0);

      const discountValue = parseFloat(discount) || 0;
      const taxValue = parseFloat(tax) || 0;
      const total = subtotal - discountValue + taxValue;

      // Verificar se cliente pertence ao usuário
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          userId: req.userId
        }
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      // Criar orçamento
      const quote = await prisma.quote.create({
        data: {
          title,
          description: description || '',
          user: {
            connect: { id: req.userId }
          },
          client: {
            connect: { id: clientId }
          },
          items: JSON.stringify(items),
          subtotal,
          discount: discountValue,
          tax: taxValue,
          total,
          notes: notes || '',
          termsConditions: termsConditions || '',
          validUntil: validUntil ? new Date(validUntil) : null
        },
        include: {
          client: true,
          user: {
            include: { plan: true }
          }
        }
      });

      // Incrementar contador
      await prisma.user.update({
        where: { id: req.userId },
        data: {
          quotesThisMonth: { increment: 1 }
        }
      });

      return res.status(201).json(quote);
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      return res.status(500).json({ error: 'Erro ao criar orçamento' });
    }
  }

  async list(req, res) {
    try {
      const { search, status, clientId, page = 1, limit = 10 } = req.query;

      const where = {
        userId: req.userId,
        ...(status && { status }),
        ...(clientId && { clientId }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      const [quotes, total] = await Promise.all([
        prisma.quote.findMany({
          where,
          include: {
            client: true
          },
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit)
        }),
        prisma.quote.count({ where })
      ]);

      return res.json({
        quotes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Erro ao listar orçamentos:', error);
      return res.status(500).json({ error: 'Erro ao listar orçamentos' });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;

      const quote = await prisma.quote.findFirst({
        where: {
          id,
          userId: req.userId
        },
        include: {
          client: true,
          user: {
            include: { plan: true }
          }
        }
      });

      if (!quote) {
        return res.status(404).json({ error: 'Orçamento não encontrado' });
      }

      return res.json(quote);
    } catch (error) {
      console.error('Erro ao buscar orçamento:', error);
      return res.status(500).json({ error: 'Erro ao buscar orçamento' });
    }
  }

  async getByToken(req, res) {
    try {
      const { token } = req.params;

      const quote = await prisma.quote.findUnique({
        where: { publicToken: token },
        include: {
          client: true,
          user: {
            select: {
              name: true,
              company: true,
              email: true,
              phone: true,
              logo: true
            }
          }
        }
      });

      if (!quote) {
        return res.status(404).json({ error: 'Orçamento não encontrado' });
      }

      // Incrementar contador de visualizações
      await prisma.quote.update({
        where: { id: quote.id },
        data: { viewCount: { increment: 1 } }
      });

      return res.json(quote);
    } catch (error) {
      console.error('Erro ao buscar orçamento público:', error);
      return res.status(500).json({ error: 'Erro ao buscar orçamento' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, description, items, discount, tax, notes, termsConditions, validUntil, status } = req.body;

      // Verificar se orçamento pertence ao usuário
      const quoteExists = await prisma.quote.findFirst({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!quoteExists) {
        return res.status(404).json({ error: 'Orçamento não encontrado' });
      }

      // Recalcular valores se itens foram alterados
      let updateData = {
        title,
        description,
        notes,
        termsConditions,
        validUntil: validUntil ? new Date(validUntil) : null,
        status
      };

      if (items) {
        const subtotal = items.reduce((sum, item) => {
          return sum + (parseFloat(item.unitPrice || 0) * parseFloat(item.quantity || 0));
        }, 0);

        const discountValue = parseFloat(discount) || 0;
        const taxValue = parseFloat(tax) || 0;
        const total = subtotal - discountValue + taxValue;

        updateData = {
          ...updateData,
          items: JSON.stringify(items),
          subtotal,
          discount: discountValue,
          tax: taxValue,
          total
        };
      }

      const quote = await prisma.quote.update({
        where: { id },
        data: updateData,
        include: {
          client: true,
          user: {
            include: { plan: true }
          }
        }
      });

      return res.json(quote);
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error);
      return res.status(500).json({ error: 'Erro ao atualizar orçamento' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      // Verificar se orçamento pertence ao usuário
      const quoteExists = await prisma.quote.findFirst({
        where: {
          id,
          userId: req.userId
        }
      });

      if (!quoteExists) {
        return res.status(404).json({ error: 'Orçamento não encontrado' });
      }

      await prisma.quote.delete({
        where: { id }
      });

      return res.json({ message: 'Orçamento excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      return res.status(500).json({ error: 'Erro ao excluir orçamento' });
    }
  }

  async generatePDF(req, res) {
    try {
      const { id } = req.params;

      const quote = await prisma.quote.findFirst({
        where: {
          id,
          userId: req.userId
        },
        include: {
          client: true,
          user: {
            include: { plan: true }
          }
        }
      });

      if (!quote) {
        return res.status(404).json({ error: 'Orçamento não encontrado' });
      }

      const pdfBuffer = await pdfService.generateQuotePDF(quote);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=orcamento-${quote.id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      return res.status(500).json({ error: 'Erro ao gerar PDF' });
    }
  }

  async sendEmail(req, res) {
    try {
      const { id } = req.params;
      const { recipientEmail, message } = req.body;

      const quote = await prisma.quote.findFirst({
        where: {
          id,
          userId: req.userId
        },
        include: {
          client: true,
          user: {
            include: { plan: true }
          }
        }
      });

      if (!quote) {
        return res.status(404).json({ error: 'Orçamento não encontrado' });
      }

      const publicUrl = `${process.env.FRONTEND_URL}/view/${quote.publicToken}`;
      
      await emailService.sendQuoteEmail(
        recipientEmail || quote.client.email,
        quote,
        publicUrl,
        message
      );

      return res.json({ message: 'Email enviado com sucesso' });
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return res.status(500).json({ error: 'Erro ao enviar email' });
    }
  }
}

module.exports = new QuoteController();
