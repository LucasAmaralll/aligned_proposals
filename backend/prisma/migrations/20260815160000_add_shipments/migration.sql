-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "origin" TEXT NOT NULL DEFAULT 'manual',
    "recipientName" TEXT NOT NULL,
    "phone" TEXT,
    "document" TEXT,
    "address" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "itemsNote" TEXT,
    "carrier" TEXT NOT NULL DEFAULT 'correios',
    "trackingCode" TEXT,
    "notes" TEXT,
    "shippedAt" TIMESTAMP(3),
    "companyId" TEXT NOT NULL,
    "unitId" TEXT,
    "saleId" TEXT,
    "clientId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "shipments_companyId_number_key" ON "shipments"("companyId", "number");
CREATE INDEX "shipments_companyId_status_idx" ON "shipments"("companyId", "status");
CREATE INDEX "shipments_saleId_idx" ON "shipments"("saleId");
CREATE INDEX "shipments_unitId_idx" ON "shipments"("unitId");

ALTER TABLE "shipments" ADD CONSTRAINT "shipments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
