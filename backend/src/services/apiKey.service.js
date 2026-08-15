const crypto = require('crypto');
const prisma = require('../lib/prisma');

function hashKey(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function generatePlainKey() {
  return `alv_${crypto.randomBytes(24).toString('hex')}`;
}

async function createApiKey({ companyId, userId, name }) {
  const plain = generatePlainKey();
  const record = await prisma.companyApiKey.create({
    data: {
      name: (name || 'Integração').trim(),
      keyHash: hashKey(plain),
      prefix: plain.slice(0, 8),
      lastFour: plain.slice(-4),
      companyId,
      createdById: userId,
    },
  });

  return { ...sanitizeKey(record), key: plain };
}

async function listApiKeys(companyId) {
  const keys = await prisma.companyApiKey.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { id: true, name: true } } },
  });
  return keys.map(sanitizeKey);
}

async function revokeApiKey({ companyId, id }) {
  const existing = await prisma.companyApiKey.findFirst({
    where: { id, companyId },
  });
  if (!existing) {
    const error = new Error('Chave não encontrada');
    error.status = 404;
    throw error;
  }
  return prisma.companyApiKey.update({
    where: { id },
    data: { active: false },
  });
}

async function findActiveKey(plain) {
  if (!plain) return null;
  const record = await prisma.companyApiKey.findFirst({
    where: { keyHash: hashKey(plain), active: true },
    include: {
      company: true,
      createdBy: true,
    },
  });
  return record;
}

function sanitizeKey(record) {
  return {
    id: record.id,
    name: record.name,
    prefix: record.prefix,
    lastFour: record.lastFour,
    active: record.active,
    lastUsedAt: record.lastUsedAt,
    createdAt: record.createdAt,
    createdBy: record.createdBy,
  };
}

module.exports = {
  hashKey,
  createApiKey,
  listApiKeys,
  revokeApiKey,
  findActiveKey,
};
