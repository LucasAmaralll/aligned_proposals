ALTER TABLE "clients" ADD COLUMN "number" INTEGER;
ALTER TABLE "clients" ADD COLUMN "birthDate" DATE;

WITH numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY "companyId" ORDER BY "createdAt" ASC, id ASC) AS n
  FROM "clients"
)
UPDATE "clients"
SET "number" = numbered.n
FROM numbered
WHERE "clients".id = numbered.id;

UPDATE "clients" SET "number" = 1 WHERE "number" IS NULL;

ALTER TABLE "clients" ALTER COLUMN "number" SET NOT NULL;

CREATE UNIQUE INDEX "clients_companyId_number_key" ON "clients"("companyId", "number");
