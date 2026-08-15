-- CreateTable
CREATE TABLE "cash_registers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_sessions" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "openingAmount" DECIMAL(10,2) NOT NULL,
    "countedCash" DECIMAL(10,2),
    "expectedCash" DECIMAL(10,2),
    "difference" DECIMAL(10,2),
    "totals" JSONB,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "registerId" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "closedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_movements" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_movements_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "sales" ADD COLUMN "cashSessionId" TEXT;
ALTER TABLE "returns" ADD COLUMN "cashSessionId" TEXT;
ALTER TABLE "exchanges" ADD COLUMN "cashSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "cash_registers_unitId_name_key" ON "cash_registers"("unitId", "name");
CREATE INDEX "cash_registers_companyId_idx" ON "cash_registers"("companyId");
CREATE INDEX "cash_registers_unitId_idx" ON "cash_registers"("unitId");
CREATE INDEX "cash_sessions_companyId_status_idx" ON "cash_sessions"("companyId", "status");
CREATE INDEX "cash_sessions_unitId_status_idx" ON "cash_sessions"("unitId", "status");
CREATE INDEX "cash_sessions_registerId_status_idx" ON "cash_sessions"("registerId", "status");
CREATE UNIQUE INDEX "cash_sessions_one_open_per_register" ON "cash_sessions"("registerId") WHERE status = 'open';
CREATE INDEX "cash_movements_sessionId_type_idx" ON "cash_movements"("sessionId", "type");
CREATE INDEX "cash_movements_companyId_idx" ON "cash_movements"("companyId");
CREATE INDEX "cash_movements_referenceType_referenceId_idx" ON "cash_movements"("referenceType", "referenceId");
CREATE INDEX "sales_cashSessionId_idx" ON "sales"("cashSessionId");
CREATE INDEX "returns_cashSessionId_idx" ON "returns"("cashSessionId");
CREATE INDEX "exchanges_cashSessionId_idx" ON "exchanges"("cashSessionId");

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES "cash_registers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cash_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "cash_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "returns" ADD CONSTRAINT "returns_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "cash_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "cash_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "cash_registers" ("id", "name", "active", "companyId", "unitId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Caixa 01', true, "companyId", "id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "units"
WHERE "active" = true
  AND NOT EXISTS (
    SELECT 1 FROM "cash_registers" r WHERE r."unitId" = "units"."id" AND r."name" = 'Caixa 01'
  );

UPDATE "roles"
SET permissions = permissions || '["cash.read","cash.open","cash.operate","cash.close"]'::jsonb
WHERE name IN ('admin', 'manager', 'seller')
  AND NOT (permissions @> '["cash.read"]'::jsonb);
