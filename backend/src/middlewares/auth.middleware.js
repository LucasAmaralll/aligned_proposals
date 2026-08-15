const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const {
  USER_TENANT_INCLUDE,
  provisionCompanyForUser,
  sanitizeUser,
} = require('../services/tenant.service');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      return res.status(401).json({ error: 'Erro no token' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ error: 'Token malformatado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: USER_TENANT_INCLUDE,
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    if (user.active === false) {
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    if (!user.companyId) {
      user = await provisionCompanyForUser(user);
    }

    req.userId = decoded.id;
    req.user = sanitizeUser(user);
    req.companyId = user.companyId;

    return next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Erro na autenticação' });
  }
};

module.exports = authMiddleware;
