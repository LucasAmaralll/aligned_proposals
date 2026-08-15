const { findActiveKey } = require('../services/apiKey.service');
const prisma = require('../lib/prisma');

const storefrontAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const fromBearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const token = req.headers['x-api-key'] || fromBearer;

    if (!token) {
      return res.status(401).json({ error: 'Chave de API não fornecida' });
    }

    const record = await findActiveKey(token);
    if (!record || !record.company?.active) {
      return res.status(401).json({ error: 'Chave de API inválida' });
    }

    await prisma.companyApiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });

    req.companyId = record.companyId;
    req.userId = record.createdById;
    req.apiKey = record;
    return next();
  } catch (error) {
    console.error('Erro na autenticação da vitrine:', error);
    return res.status(401).json({ error: 'Chave de API inválida' });
  }
};

module.exports = storefrontAuth;
