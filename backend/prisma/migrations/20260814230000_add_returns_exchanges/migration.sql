CREATE TABLE "returns" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "reason" TEXT,
    "refundAmount" DECIMAL(10,2) NOT NULL,
    "method" TEXT,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "return_items" (
    "id" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "returnId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "variantId" TEXT,

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exchanges" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "reason" TEXT,
    "difference" DECIMAL(10,2) NOT NULL,
    "method" TEXT,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchanges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exchange_items" (
    "id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "exchangeId" TEXT NOT NULL,
    "saleItemId" TEXT,
    "variantId" TEXT,

    CONSTRAINT "exchange_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "returns_companyId_number_key" ON "returns"("companyId", "number");
CREATE INDEX "returns_saleId_idx" ON "returns"("saleId");
CREATE INDEX "return_items_returnId_idx" ON "return_items"("returnId");
CREATE INDEX "return_items_saleItemId_idx" ON "return_items"("saleItemId");
CREATE UNIQUE INDEX "exchanges_companyId_number_key" ON "exchanges"("companyId", "number");
CREATE INDEX "exchanges_saleId_idx" ON "exchanges"("saleId");
CREATE INDEX "exchange_items_exchangeId_idx" ON "exchange_items"("exchangeId");
CREATE INDEX "exchange_items_saleItemId_idx" ON "exchange_items"("saleItemId");

ALTER TABLE "returns" ADD CONSTRAINT "returns_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "returns" ADD CONSTRAINT "returns_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "returns" ADD CONSTRAINT "returns_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "returns" ADD CONSTRAINT "returns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "sale_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exchange_items" ADD CONSTRAINT "exchange_items_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "exchanges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exchange_items" ADD CONSTRAINT "exchange_items_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "sale_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
