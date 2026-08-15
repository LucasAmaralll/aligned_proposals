-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "products" ADD COLUMN "type" TEXT;
ALTER TABLE "products" ADD COLUMN "gender" TEXT;
ALTER TABLE "products" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "products" ADD COLUMN "categoryId" TEXT;

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "width" DECIMAL(10,2),
    "height" DECIMAL(10,2),
    "salePrice" DECIMAL(10,2) NOT NULL,
    "costPrice" DECIMAL(10,2),
    "ncm" TEXT,
    "ean" TEXT,
    "cest" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "productId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "variantId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "reason" TEXT,
    "reference" TEXT,
    "variantId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_companyId_name_key" ON "categories"("companyId", "name");
CREATE INDEX "categories_companyId_idx" ON "categories"("companyId");
CREATE UNIQUE INDEX "product_variants_companyId_sku_key" ON "product_variants"("companyId", "sku");
CREATE INDEX "product_variants_companyId_idx" ON "product_variants"("companyId");
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");
CREATE UNIQUE INDEX "stocks_variantId_unitId_key" ON "stocks"("variantId", "unitId");
CREATE INDEX "stocks_companyId_unitId_idx" ON "stocks"("companyId", "unitId");
CREATE INDEX "stock_movements_companyId_createdAt_idx" ON "stock_movements"("companyId", "createdAt");
CREATE INDEX "stock_movements_variantId_unitId_idx" ON "stock_movements"("variantId", "unitId");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
