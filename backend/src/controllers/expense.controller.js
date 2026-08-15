const prisma = require('../lib/prisma');
const {
  AccessError,
  isAdmin,
  assertUnitAccess,
  resolveListUnitFilter,
  handleAccess,
} = require('../lib/access');

const STATUSES = new Set(['pending', 'paid']);

function resolveStatus(expense) {
  if (expense.status === 'paid') return 'paid';
  if (expense.dueDate && new Date(expense.dueDate) < new Date(new Date().toDateString())) {
    return 'overdue';
  }
  return 'pending';
}

async function assertExpenseUnit(companyId, user, unitId, { required = false } = {}) {
  if (!unitId) {
    if (required || !isAdmin(user)) {
      throw new AccessError('Informe a unidade do gasto', 400);
    }
    return null;
  }

  const unit = await prisma.unit.findFirst({
    where: { id: unitId, companyId, active: true },
  });
  if (!unit) {
    const error = new Error('Unidade não encontrada');
    error.status = 404;
    throw error;
  }
  assertUnitAccess(user, unitId);
  return unit;
}

function assertExpenseAccess(user, expense) {
  if (!expense.unitId) {
    if (!isAdmin(user)) {
      throw new AccessError('Sem acesso a este gasto', 403);
    }
    return;
  }
  assertUnitAccess(user, expense.unitId);
}

class ExpenseController {
  async list(req, res) {
    try {
      const { status, category, search, unitId } = req.query;
      const unitFilter = resolveListUnitFilter(req.user, unitId);
      const expenses = await prisma.expense.findMany({
        where: {
          companyId: req.companyId,
          ...unitFilter,
          ...(status && status !== 'overdue' && { status }),
          ...(category && { category }),
          ...(search && {
            description: { contains: search, mode: 'insensitive' },
          }),
        },
        include: {
          unit: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 100,
      });

      const mapped = expenses.map((expense) => ({
        ...expense,
        displayStatus: resolveStatus(expense),
      }));

      const filtered =
        status === 'overdue'
          ? mapped.filter((expense) => expense.displayStatus === 'overdue')
          : mapped;

      return res.json({ expenses: filtered });
    } catch (error) {
      if (handleAccess(res, error)) return;
      console.error('Erro ao listar gastos:', error);
      return res.status(500).json({ error: 'Erro ao listar gastos' });
    }
  }

  async create(req, res) {
    try {
      const { description, amount, category, status, dueDate, notes, unitId } = req.body;
      if (!description || !String(description).trim()) {
        return res.status(400).json({ error: 'Descrição é obrigatória' });
      }
      if (amount === undefined || amount === null || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Valor inválido' });
      }
      if (!category) {
        return res.status(400).json({ error: 'Categoria é obrigatória' });
      }

      await assertExpenseUnit(req.companyId, req.user, unitId);

      const expense = await prisma.expense.create({
        data: {
          description: String(description).trim(),
          amount,
          category,
          status: STATUSES.has(status) ? status : 'pending',
          dueDate: dueDate || null,
          paidAt: status === 'paid' ? new Date() : null,
          notes: notes || null,
          unitId: unitId || null,
          companyId: req.companyId,
          createdById: req.userId,
        },
        include: {
          unit: { select: { id: true, name: true } },
        },
      });

      return res.status(201).json({ ...expense, displayStatus: resolveStatus(expense) });
    } catch (error) {
      if (handleAccess(res, error)) return;
      if (error.status === 404) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Erro ao criar gasto:', error);
      return res.status(500).json({ error: 'Erro ao criar gasto' });
    }
  }

  async update(req, res) {
    try {
      const existing = await prisma.expense.findFirst({
        where: { id: req.params.id, companyId: req.companyId },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Gasto não encontrado' });
      }
      assertExpenseAccess(req.user, existing);

      const { description, amount, category, status, dueDate, notes, unitId } = req.body;
      if (unitId !== undefined) {
        await assertExpenseUnit(req.companyId, req.user, unitId);
      }
      const nextStatus = STATUSES.has(status) ? status : existing.status;

      const expense = await prisma.expense.update({
        where: { id: existing.id },
        data: {
          ...(description !== undefined && { description: String(description).trim() }),
          ...(amount !== undefined && { amount }),
          ...(category !== undefined && { category }),
          status: nextStatus,
          ...(dueDate !== undefined && { dueDate: dueDate || null }),
          ...(notes !== undefined && { notes: notes || null }),
          ...(unitId !== undefined && { unitId: unitId || null }),
          paidAt: nextStatus === 'paid' ? existing.paidAt || new Date() : null,
        },
        include: {
          unit: { select: { id: true, name: true } },
        },
      });

      return res.json({ ...expense, displayStatus: resolveStatus(expense) });
    } catch (error) {
      if (handleAccess(res, error)) return;
      if (error.status === 404) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Erro ao atualizar gasto:', error);
      return res.status(500).json({ error: 'Erro ao atualizar gasto' });
    }
  }

  async remove(req, res) {
    try {
      const existing = await prisma.expense.findFirst({
        where: { id: req.params.id, companyId: req.companyId },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Gasto não encontrado' });
      }
      assertExpenseAccess(req.user, existing);

      await prisma.expense.delete({ where: { id: existing.id } });
      return res.json({ message: 'Gasto excluído' });
    } catch (error) {
      if (handleAccess(res, error)) return;
      console.error('Erro ao excluir gasto:', error);
      return res.status(500).json({ error: 'Erro ao excluir gasto' });
    }
  }
}

module.exports = new ExpenseController();
