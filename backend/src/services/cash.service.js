const prisma = require('../lib/prisma');
const { assertUnitAccess, resolveListUnitFilter } = require('../lib/access');

const MOVEMENT_TYPES = new Set(['open', 'supply', 'bleed', 'refund', 'close']);
const METHODS = ['cash', 'pix', 'debit', 'credit', 'other'];

class CashError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function money(value) {
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed)) return NaN;
  return Math.round(parsed * 100) / 100;
}

function emptyByMethod() {
  return { cash: 0, pix: 0, debit: 0, credit: 0, other: 0 };
}

function addMethod(map, method, amount) {
  const key = METHODS.includes(method) ? method : 'other';
  map[key] = money(map[key] + money(amount));
}

const sessionInclude = {
  register: { select: { id: true, name: true } },
  unit: { select: { id: true, name: true, type: true } },
  openedBy: { select: { id: true, name: true } },
  closedBy: { select: { id: true, name: true } },
};

async function ensureDefaultRegister(companyId, unitId, db = prisma) {
  const existing = await db.cashRegister.findFirst({
    where: { companyId, unitId, active: true },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) return existing;

  return db.cashRegister.create({
    data: {
      name: 'Caixa 01',
      companyId,
      unitId,
    },
  });
}

async function listRegisters({ companyId, unitId, user }) {
  const unitFilter = resolveListUnitFilter(user, unitId);
  return prisma.cashRegister.findMany({
    where: {
      companyId,
      active: true,
      ...unitFilter,
    },
    include: { unit: { select: { id: true, name: true } } },
    orderBy: [{ unit: { name: 'asc' } }, { name: 'asc' }],
  });
}

async function findOpenSessions(companyId, unitId, db = prisma) {
  return db.cashSession.findMany({
    where: { companyId, unitId, status: 'open' },
    include: sessionInclude,
    orderBy: { openedAt: 'asc' },
  });
}

async function getOpenSessionForUnit(companyId, unitId, user, { required = true } = {}, db = prisma) {
  if (user) {
    assertUnitAccess(user, unitId);
  }
  const sessions = await findOpenSessions(companyId, unitId, db);
  if (!sessions.length) {
    if (required) {
      throw new CashError('Abra o caixa para continuar', 400);
    }
    return null;
  }
  if (sessions.length === 1) return sessions[0];
  const mine = user ? sessions.filter((session) => session.openedById === user.id) : [];
  if (mine.length === 1) return mine[0];
  throw new CashError('Há mais de um caixa aberto nesta unidade', 400);
}

function assertSessionOpen(session) {
  if (!session || session.status !== 'open') {
    throw new CashError('Esta sessão de caixa já está fechada', 400);
  }
}

async function getSession({ companyId, id, user }, db = prisma) {
  const session = await db.cashSession.findFirst({
    where: { id, companyId },
    include: {
      ...sessionInclude,
      movements: {
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!session) {
    throw new CashError('Sessão de caixa não encontrada', 404);
  }
  if (user) {
    assertUnitAccess(user, session.unitId);
  }
  return session;
}

async function createMovement(
  {
    session,
    type,
    amount,
    reason,
    userId,
    referenceType,
    referenceId,
  },
  db = prisma
) {
  if (!MOVEMENT_TYPES.has(type)) {
    throw new CashError('Tipo de movimentação de caixa inválido');
  }
  const value = money(amount);
  if (Number.isNaN(value) || value < 0) {
    throw new CashError('Valor inválido');
  }
  if ((type === 'supply' || type === 'bleed' || type === 'refund') && value <= 0) {
    throw new CashError('Valor deve ser maior que zero');
  }
  if ((type === 'bleed' || type === 'supply' || type === 'refund') && !String(reason || '').trim() && type !== 'refund') {
    throw new CashError('Informe o motivo');
  }
  if (type === 'bleed' || type === 'supply') {
    if (!String(reason || '').trim()) {
      throw new CashError('Informe o motivo');
    }
  }

  return db.cashMovement.create({
    data: {
      type,
      amount: value,
      reason: reason ? String(reason).trim() : null,
      referenceType: referenceType || null,
      referenceId: referenceId || null,
      companyId: session.companyId,
      unitId: session.unitId,
      sessionId: session.id,
      createdById: userId,
    },
  });
}

async function computeSessionTotals(sessionId, db = prisma) {
  const session = await db.cashSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    throw new CashError('Sessão de caixa não encontrada', 404);
  }

  const [sales, returns, exchanges, movements] = await Promise.all([
    db.sale.findMany({
      where: { cashSessionId: sessionId, status: { not: 'cancelled' } },
      include: { payments: true },
    }),
    db.saleReturn.findMany({ where: { cashSessionId: sessionId } }),
    db.exchange.findMany({ where: { cashSessionId: sessionId } }),
    db.cashMovement.findMany({ where: { sessionId } }),
  ]);

  const salesByMethod = emptyByMethod();
  let salesTotal = 0;
  for (const sale of sales) {
    salesTotal = money(salesTotal + parseFloat(sale.total || 0));
    for (const payment of sale.payments) {
      addMethod(salesByMethod, payment.method, payment.amount);
    }
  }

  const returnsByMethod = emptyByMethod();
  for (const item of returns) {
    if (item.method) addMethod(returnsByMethod, item.method, item.refundAmount);
  }

  const exchangesInByMethod = emptyByMethod();
  const exchangesOutByMethod = emptyByMethod();
  for (const item of exchanges) {
    const difference = money(item.difference);
    if (difference > 0.009 && item.method) {
      addMethod(exchangesInByMethod, item.method, difference);
    } else if (difference < -0.009 && item.method) {
      addMethod(exchangesOutByMethod, item.method, Math.abs(difference));
    }
  }

  const supplies = money(
    movements.filter((item) => item.type === 'supply').reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
  );
  const bleeds = money(
    movements.filter((item) => item.type === 'bleed').reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
  );
  const refunds = money(
    movements.filter((item) => item.type === 'refund').reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
  );
  const openingAmount = money(session.openingAmount);

  const expectedCash = money(
    openingAmount + salesByMethod.cash + exchangesInByMethod.cash + supplies - bleeds - refunds
  );

  return {
    openingAmount,
    salesCount: sales.length,
    salesTotal,
    salesByMethod,
    returnsCount: returns.length,
    returnsByMethod,
    exchangesInByMethod,
    exchangesOutByMethod,
    supplies,
    bleeds,
    refunds,
    expectedCash,
  };
}

async function openSession({ companyId, userId, user, unitId, openingAmount, registerId }) {
  assertUnitAccess(user, unitId);
  const amount = money(openingAmount);
  if (Number.isNaN(amount) || amount < 0) {
    throw new CashError('Valor inicial inválido');
  }

  const unit = await prisma.unit.findFirst({
    where: { id: unitId, companyId, active: true },
  });
  if (!unit) {
    throw new CashError('Unidade não encontrada', 404);
  }

  let register;
  if (registerId) {
    register = await prisma.cashRegister.findFirst({
      where: { id: registerId, companyId, unitId, active: true },
    });
    if (!register) {
      throw new CashError('Caixa não encontrado', 404);
    }
  } else {
    register = await ensureDefaultRegister(companyId, unitId);
  }

  const alreadyOpen = await prisma.cashSession.findFirst({
    where: { registerId: register.id, status: 'open' },
  });
  if (alreadyOpen) {
    throw new CashError('Já existe uma sessão aberta neste caixa');
  }

  return prisma.$transaction(async (tx) => {
    const session = await tx.cashSession.create({
      data: {
        status: 'open',
        openingAmount: amount,
        companyId,
        unitId,
        registerId: register.id,
        openedById: userId,
      },
    });
    await createMovement(
      {
        session,
        type: 'open',
        amount,
        reason: 'Abertura de caixa',
        userId,
      },
      tx
    );
    return tx.cashSession.findUnique({
      where: { id: session.id },
      include: sessionInclude,
    });
  });
}

async function addTillMovement({ companyId, user, userId, id, type, amount, reason }) {
  if (type !== 'supply' && type !== 'bleed') {
    throw new CashError('Tipo inválido');
  }
  const session = await getSession({ companyId, id, user });
  assertSessionOpen(session);

  const movement = await createMovement({
    session,
    type,
    amount,
    reason,
    userId,
  });
  const totals = await computeSessionTotals(session.id);
  return { movement, totals, session: { id: session.id, status: session.status } };
}

async function recordRefund(
  {
    session,
    amount,
    userId,
    reason,
    referenceType,
    referenceId,
  },
  db = prisma
) {
  return createMovement(
    {
      session,
      type: 'refund',
      amount,
      reason,
      userId,
      referenceType,
      referenceId,
    },
    db
  );
}

async function closeSession({ companyId, user, userId, id, countedCash }) {
  const counted = money(countedCash);
  if (Number.isNaN(counted) || counted < 0) {
    throw new CashError('Informe o dinheiro contado');
  }

  return prisma.$transaction(async (tx) => {
    const session = await tx.cashSession.findFirst({
      where: { id, companyId },
    });
    if (!session) {
      throw new CashError('Sessão de caixa não encontrada', 404);
    }
    assertUnitAccess(user, session.unitId);
    assertSessionOpen(session);

    const totals = await computeSessionTotals(session.id, tx);
    const difference = money(counted - totals.expectedCash);

    await createMovement(
      {
        session,
        type: 'close',
        amount: counted,
        reason: 'Fechamento de caixa',
        userId,
      },
      tx
    );

    return tx.cashSession.update({
      where: { id: session.id },
      data: {
        status: 'closed',
        closedAt: new Date(),
        closedById: userId,
        countedCash: counted,
        expectedCash: totals.expectedCash,
        difference,
        totals: { ...totals, countedCash: counted, difference },
      },
      include: sessionInclude,
    });
  });
}

async function listSessions({ companyId, user, unitId, status, page = 1, limit = 30 }) {
  const unitFilter = resolveListUnitFilter(user, unitId);
  const where = {
    companyId,
    ...unitFilter,
    ...(status && { status }),
  };
  const [sessions, total] = await Promise.all([
    prisma.cashSession.findMany({
      where,
      include: sessionInclude,
      orderBy: { openedAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.cashSession.count({ where }),
  ]);
  return {
    sessions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

async function currentSession({ companyId, user, unitId }) {
  if (!unitId) {
    throw new CashError('Unidade é obrigatória', 400);
  }
  const session = await getOpenSessionForUnit(companyId, unitId, user, { required: false });
  if (!session) return { session: null, totals: null };
  const totals = await computeSessionTotals(session.id);
  return { session, totals };
}

async function previewSession({ companyId, user, id }) {
  const session = await getSession({ companyId, id, user });
  if (session.status === 'closed') {
    return {
      session,
      totals: session.totals || {
        expectedCash: money(session.expectedCash),
        countedCash: money(session.countedCash),
        difference: money(session.difference),
      },
      frozen: true,
    };
  }
  const totals = await computeSessionTotals(session.id);
  return { session, totals, frozen: false };
}

function cashAmountFromSale(sale) {
  return money(
    (sale.payments || [])
      .filter((payment) => payment.method === 'cash')
      .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0)
  );
}

module.exports = {
  CashError,
  MOVEMENT_TYPES,
  money,
  ensureDefaultRegister,
  listRegisters,
  getOpenSessionForUnit,
  getSession,
  createMovement,
  recordRefund,
  computeSessionTotals,
  openSession,
  addTillMovement,
  closeSession,
  listSessions,
  currentSession,
  previewSession,
  cashAmountFromSale,
  sessionInclude,
};
