const prisma = require('../lib/prisma');

async function nextClientNumber(companyId, db = prisma) {
  const last = await db.client.findFirst({
    where: { companyId },
    orderBy: { number: 'desc' },
    select: { number: true },
  });

  return (last?.number || 0) + 1;
}

function parseBirthDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date;
}

function buildClientSearch(search) {
  if (!search) return {};

  const term = String(search).trim();
  if (!term) return {};

  const digits = term.replace(/\D/g, '');
  const or = [
    { name: { contains: term, mode: 'insensitive' } },
    { email: { contains: term, mode: 'insensitive' } },
    { phone: { contains: term, mode: 'insensitive' } },
    { document: { contains: term, mode: 'insensitive' } },
  ];

  if (digits) {
    or.push({ phone: { contains: digits, mode: 'insensitive' } });
    or.push({ document: { contains: digits, mode: 'insensitive' } });
    const asNumber = Number(digits);
    if (Number.isInteger(asNumber)) {
      or.push({ number: asNumber });
    }
  }

  return { OR: or };
}

module.exports = {
  nextClientNumber,
  parseBirthDate,
  buildClientSearch,
};
