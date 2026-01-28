-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "additionalInfo" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "paymentTerms" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "website" TEXT;
