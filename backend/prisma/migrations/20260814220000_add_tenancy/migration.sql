-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "document" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_units" (
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "user_units_pkey" PRIMARY KEY ("userId","unitId")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "units_companyId_name_key" ON "units"("companyId", "name");

-- CreateIndex
CREATE INDEX "units_companyId_idx" ON "units"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- Rename company string to companyName
ALTER TABLE "users" RENAME COLUMN "company" TO "companyName";

-- Add tenant columns to users
ALTER TABLE "users" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "companyId" TEXT;
ALTER TABLE "users" ADD COLUMN "roleId" TEXT;

-- Seed operational roles
INSERT INTO "roles" ("id", "name", "description", "permissions", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'admin', 'Acesso total à empresa', '["dashboard.read","clients.manage","products.manage","quotes.manage","sales.manage","sales.discount","stock.manage","stock.adjust","exchanges.manage","returns.manage","reports.read","users.manage","units.manage","expenses.manage"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'manager', 'Gestão operacional da loja', '["dashboard.read","clients.manage","products.manage","quotes.manage","sales.manage","sales.discount","stock.manage","exchanges.manage","returns.manage","reports.read","expenses.manage"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'seller', 'Operação de caixa e atendimento', '["dashboard.read","clients.manage","products.read","quotes.manage","sales.manage","exchanges.manage","returns.manage"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- One company per existing user
INSERT INTO "companies" ("id", "name", "slug", "active", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  COALESCE(NULLIF("companyName", ''), "name", 'Empresa'),
  'empresa-' || "id",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "users";

UPDATE "users" u
SET "companyId" = c."id",
    "roleId" = (SELECT r."id" FROM "roles" r WHERE r."name" = 'admin' LIMIT 1),
    "companyName" = COALESCE(u."companyName", c."name")
FROM "companies" c
WHERE c."slug" = 'empresa-' || u."id";

-- Default unit per company created from users
INSERT INTO "units" ("id", "name", "type", "active", "companyId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Matriz',
  'store',
  true,
  c."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "companies" c
WHERE c."slug" LIKE 'empresa-%';

INSERT INTO "user_units" ("userId", "unitId")
SELECT u."id", un."id"
FROM "users" u
JOIN "units" un ON un."companyId" = u."companyId"
WHERE u."companyId" IS NOT NULL;

ALTER TABLE "users" ALTER COLUMN "companyId" SET NOT NULL;

CREATE INDEX "users_companyId_idx" ON "users"("companyId");

-- Operational tables
ALTER TABLE "clients" ADD COLUMN "companyId" TEXT;
ALTER TABLE "quotes" ADD COLUMN "companyId" TEXT;
ALTER TABLE "products" ADD COLUMN "companyId" TEXT;

UPDATE "clients" c
SET "companyId" = u."companyId"
FROM "users" u
WHERE c."userId" = u."id";

UPDATE "quotes" q
SET "companyId" = u."companyId"
FROM "users" u
WHERE q."userId" = u."id";

UPDATE "products" p
SET "companyId" = u."companyId"
FROM "users" u
WHERE p."userId" = u."id";

ALTER TABLE "clients" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "quotes" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "companyId" SET NOT NULL;

CREATE INDEX "clients_companyId_idx" ON "clients"("companyId");
CREATE INDEX "quotes_companyId_idx" ON "quotes"("companyId");
CREATE INDEX "products_companyId_idx" ON "products"("companyId");

-- Recreate FKs with Restrict to preserve history
ALTER TABLE "clients" DROP CONSTRAINT "clients_userId_fkey";
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_userId_fkey";
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_clientId_fkey";
ALTER TABLE "products" DROP CONSTRAINT "products_userId_fkey";

ALTER TABLE "units" ADD CONSTRAINT "units_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_units" ADD CONSTRAINT "user_units_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_units" ADD CONSTRAINT "user_units_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "clients" ADD CONSTRAINT "clients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
