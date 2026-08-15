const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  USER_TENANT_INCLUDE,
  sanitizeUser,
  createRegisteredUser,
} = require('../services/tenant.service');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, companyId: user.companyId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function ensureFreePlan() {
  let freePlan = await prisma.plan.findUnique({
    where: { name: 'Gratuito' },
  });

  if (!freePlan) {
    freePlan = await prisma.plan.create({
      data: {
        name: 'Gratuito',
        price: 0,
        quotesLimit: 3,
        hasWatermark: true,
        features: [
          'Até 3 orçamentos/mês',
          'PDF com marca d\'água',
          'Link público de visualização',
        ],
      },
    });
  }

  return freePlan;
}

class AuthController {
  async register(req, res) {
    try {
      const { email, password, name, company } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
      }

      const userExists = await prisma.user.findUnique({
        where: { email },
      });

      if (userExists) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      const freePlan = await ensureFreePlan();
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await createRegisteredUser({
        email,
        password: hashedPassword,
        name,
        companyName: company,
        planId: freePlan.id,
      });

      const token = signToken(user);

      return res.status(201).json({
        user: sanitizeUser(user),
        token,
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      return res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: USER_TENANT_INCLUDE,
      });

      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      if (user.active === false) {
        return res.status(401).json({ error: 'Usuário inativo' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = signToken(user);

      return res.json({
        user: sanitizeUser(user),
        token,
      });
    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ error: 'Erro ao fazer login' });
    }
  }

  async me(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: USER_TENANT_INCLUDE,
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json(sanitizeUser(user));
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    }
  }
}

module.exports = new AuthController();
