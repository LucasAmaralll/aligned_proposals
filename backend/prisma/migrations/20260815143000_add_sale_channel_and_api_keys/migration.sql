-- AlterTable
ALTER TABLE "sales" ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'retail';
ALTER TABLE "sales" ADD COLUMN "quoteId" TEXT;

-- CreateIndex
CREATE INDEX "sales_channel_idx" ON "sales"("channel");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "company_api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "lastFour" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "companyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "company_api_keys_keyHash_key" ON "company_api_keys"("keyHash");
CREATE INDEX "company_api_keys_companyId_idx" ON "company_api_keys"("companyId");

ALTER TABLE "company_api_keys" ADD CONSTRAINT "company_api_keys_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_api_keys" ADD CONSTRAINT "company_api_keys_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
