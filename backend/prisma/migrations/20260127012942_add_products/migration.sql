-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rawMaterials" JSONB NOT NULL DEFAULT '[]',
    "productionTimeHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "energyConsumptionKwh" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "energyCostPerKwh" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "laborCostPerHour" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "expenses" JSONB NOT NULL DEFAULT '[]',
    "profitMargin" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "totalProductionCost" DECIMAL(10,2),
    "minimumSalePrice" DECIMAL(10,2),
    "idealSalePrice" DECIMAL(10,2),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
