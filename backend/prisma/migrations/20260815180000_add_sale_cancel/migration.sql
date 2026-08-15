ALTER TABLE "sales" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "sales" ADD COLUMN "cancelReason" TEXT;
ALTER TABLE "sales" ADD COLUMN "cancelledById" TEXT;

ALTER TABLE "sales" ADD CONSTRAINT "sales_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE "roles"
SET permissions = permissions || '["sales.cancel"]'::jsonb
WHERE name IN ('admin', 'manager')
  AND NOT (permissions @> '["sales.cancel"]'::jsonb);
