const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

class AuthController {
  async register(req, res) {
    try {
      const { email, password, name, company } = req.body;

      // Validações
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
      }

      // Verificar se usuário já existe
      const userExists = await prisma.user.findUnique({
        where: { email }
      });

      if (userExists) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Buscar plano gratuito
      let freePlan = await prisma.plan.findUnique({
        where: { name: 'Gratuito' }
      });

      // Criar plano gratuito se não existir
      if (!freePlan) {
        freePlan = await prisma.plan.create({
          data: {
            name: 'Gratuito',
            price: 0,
            quotesLimit: 3,
            hasWatermark: true,
            features: JSON.stringify([
              'Até 3 orçamentos/mês',
              'PDF com marca d\'água',
              'Link público de visualização'
            ])
          }
        });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          company,
          planId: freePlan.id,
          subscriptionStatus: 'active'
        },
        include: {
          plan: true
        }
      });

      // Gerar token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Remover senha da resposta
      delete user.password;

      return res.status(201).json({
        user,
        token
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      return res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validações
      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { email },
        include: { plan: true }
      });

      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Gerar token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Remover senha da resposta
      delete user.password;

      return res.json({
        user,
        token
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
        include: { plan: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      delete user.password;

      return res.json(user);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    }
  }
}

module.exports = new AuthController();
