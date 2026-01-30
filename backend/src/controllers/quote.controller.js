const { PrismaClient } = require('@prisma/client');
const pdfService = require('../services/pdf.service');
const emailService = require('../services/email.service');

const prisma = new PrismaClient();

class QuoteController {
  async create(req, res) {
    try {
      const { title, description, idExt, clientId, items, discount, tax, notes, termsConditions, paymentTerms, internalNotes, additionalInfo, validUntil } = req.body;

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
          idExt: idExt || '',
          deletionStatus: 1,
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
          paymentTerms: paymentTerms || '',
          internalNotes: internalNotes || '',
          additionalInfo: additionalInfo || '',
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
        deletionStatus: 1, // Apenas orçamentos ativos
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

      // Verificar e atualizar status para no_return se passou da data de vencimento
      const now = new Date();
      const quotesToUpdate = [];
      
      for (const quote of quotes) {
        if (quote.validUntil && quote.status !== 'rejected' && quote.status !== 'no_return') {
          const validUntilDate = new Date(quote.validUntil);
          if (now > validUntilDate) {
            quotesToUpdate.push(quote.id);
            quote.status = 'no_return';
          }
        }
      }

      // Atualizar em batch no banco
      if (quotesToUpdate.length > 0) {
        await Promise.all(
          quotesToUpdate.map(quoteId =>
            prisma.quote.update({
              where: { id: quoteId },
              data: { status: 'no_return' }
            }).catch(err => console.error('Erro ao atualizar status:', err))
          )
        );
      }

      // Parse items de JSON string para array em todos os quotes
      quotes.forEach(quote => {
        if (quote.items && typeof quote.items === 'string') {
          quote.items = JSON.parse(quote.items);
        }
      });

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

      // Verificar se passou da data de vencimento e ainda está pendente/aprovado
      if (quote.validUntil && quote.status !== 'rejected' && quote.status !== 'no_return') {
        const now = new Date();
        const validUntilDate = new Date(quote.validUntil);
        
        if (now > validUntilDate) {
          // Atualizar para no_return
          await prisma.quote.update({
            where: { id },
            data: { status: 'no_return' }
          });
          quote.status = 'no_return';
        }
      }

      // Parse items de JSON string para array
      if (quote.items && typeof quote.items === 'string') {
        quote.items = JSON.parse(quote.items);
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

      // Parse items de JSON string para array
      if (quote.items && typeof quote.items === 'string') {
        quote.items = JSON.parse(quote.items);
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

  async getPDFByToken(req, res) {
    try {
      const { token } = req.params;

      const quote = await prisma.quote.findUnique({
        where: { publicToken: token },
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

      // Parse items de JSON string para array
      if (quote.items && typeof quote.items === 'string') {
        quote.items = JSON.parse(quote.items);
      }

      console.log('📋 Gerando PDF para orçamento público:', quote.id);

      // Gerar PDF usando template HTML + Puppeteer
      const pdfBuffer = await pdfService.generateQuotePDFFromHTML(quote);

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('PDF gerado está vazio');
      }

      console.log('✅ PDF gerado com sucesso, enviando para cliente');

      // Configurar headers corretos para PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Content-Disposition', `attachment; filename="orcamento-${quote.id.substring(0, 8)}.pdf"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Enviar buffer binário
      res.end(pdfBuffer, 'binary');
    } catch (error) {
      console.error('❌ Erro ao gerar PDF público:', error);
      return res.status(500).json({ 
        error: 'Erro ao gerar PDF',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, description, idExt, items, discount, tax, notes, termsConditions, paymentTerms, internalNotes, additionalInfo, validUntil, status } = req.body;

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

      // Se apenas status está sendo atualizado (nenhum outro campo foi fornecido), apenas atualizar o status
      if (status && !title && !description && !items && !discount && !tax && !notes && !termsConditions && !paymentTerms && !internalNotes && !additionalInfo && validUntil === undefined) {
        const quote = await prisma.quote.update({
          where: { id },
          data: { status },
          include: {
            client: true,
            user: {
              include: { plan: true }
            }
          }
        });

        // Parse items de JSON string para array
        if (quote.items && typeof quote.items === 'string') {
          quote.items = JSON.parse(quote.items);
        }

        return res.json(quote);
      }

      // Caso contrário, atualizar os dados e resetar status para pendente
      let updateData = {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(idExt !== undefined && { idExt }),
        ...(notes !== undefined && { notes }),
        ...(termsConditions !== undefined && { termsConditions }),
        ...(paymentTerms !== undefined && { paymentTerms }),
        ...(internalNotes !== undefined && { internalNotes }),
        ...(additionalInfo !== undefined && { additionalInfo }),
        ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
      };

      // Se itens foram alterados, recalcular totais e resetar para pendente
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
          total,
          status: 'pending' // Resetar para pendente ao alterar itens
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

      // Parse items de JSON string para array
      if (quote.items && typeof quote.items === 'string') {
        quote.items = JSON.parse(quote.items);
      }

      return res.json(quote);
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error);
      return res.status(500).json({ error: 'Erro ao atualizar orçamento' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      // Verificar se orçamento pertence ao usuário e está ativo
      const quoteExists = await prisma.quote.findFirst({
        where: {
          id,
          userId: req.userId,
          deletionStatus: 1 // Apenas orçamentos ativos
        }
      });

      if (!quoteExists) {
        return res.status(404).json({ error: 'Orçamento não encontrado' });
      }

      // Soft delete: marcar como inativo (LGPD)
      await prisma.quote.update({
        where: { id },
        data: { deletionStatus: -3 }
      });

      return res.json({ message: 'Orçamento inativado com sucesso' });
    } catch (error) {
      console.error('Erro ao inativar orçamento:', error);
      return res.status(500).json({ error: 'Erro ao inativar orçamento' });
    }
  }

  async generatePDF(req, res) {
    try {
      const { id } = req.params;

      const quote = await prisma.quote.findFirst({
        where: {
          id,
          userId: req.userId,
          deletionStatus: 1 // Apenas orçamentos ativos
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

      // Parse items de JSON string para array
      if (quote.items && typeof quote.items === 'string') {
        quote.items = JSON.parse(quote.items);
      }

      console.log('📋 Gerando PDF para orçamento:', quote.id);

      // Gerar PDF usando template HTML + Puppeteer
      const pdfBuffer = await pdfService.generateQuotePDFFromHTML(quote);

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('PDF gerado está vazio');
      }

      console.log('✅ PDF gerado com sucesso, enviando para cliente');

      // Configurar headers corretos para PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Content-Disposition', `attachment; filename="orcamento-${quote.id.substring(0, 8)}.pdf"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Enviar buffer binário
      res.end(pdfBuffer, 'binary');
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      return res.status(500).json({ 
        error: 'Erro ao gerar PDF',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async generatePDFHTML(req, res) {
    try {
      const { id } = req.params;

      const quote = await prisma.quote.findFirst({
        where: {
          id,
          userId: req.userId,
          deletionStatus: 1 // Apenas orçamentos ativos
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

      // Parse items de JSON string para array
      if (quote.items && typeof quote.items === 'string') {
        quote.items = JSON.parse(quote.items);
      }

      const html = pdfService.generateQuotePDFHTML(quote);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      console.error('Erro ao gerar HTML:', error);
      return res.status(500).json({ error: 'Erro ao gerar HTML' });
    }
  }

  async sendEmail(req, res) {
    try {
      const { id } = req.params;
      const { recipientEmail, message } = req.body;

      const quote = await prisma.quote.findFirst({
        where: {
          id,
          userId: req.userId,
          deletionStatus: 1 // Apenas orçamentos ativos
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

      // Parse items de JSON string para array
      if (quote.items && typeof quote.items === 'string') {
        quote.items = JSON.parse(quote.items);
      }

      // Gerar PDF usando template HTML + Puppeteer
      const pdfBuffer = await pdfService.generateQuotePDFFromHTML(quote);

      const publicUrl = `${process.env.FRONTEND_URL}/view/${quote.publicToken}`;
      
      await emailService.sendQuoteEmail(
        recipientEmail || quote.client.email,
        quote,
        publicUrl,
        message,
        pdfBuffer
      );

      return res.json({ message: 'Email enviado com sucesso' });
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return res.status(500).json({ error: 'Erro ao enviar email' });
    }
  }
}

module.exports = new QuoteController();
