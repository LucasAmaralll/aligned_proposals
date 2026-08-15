function slugify(value) {
  const base = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return base || 'empresa';
}

async function uniqueCompanySlug(prisma, name) {
  const base = slugify(name);
  let slug = base;
  let attempt = 1;

  while (await prisma.company.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  return slug;
}

module.exports = { slugify, uniqueCompanySlug };
