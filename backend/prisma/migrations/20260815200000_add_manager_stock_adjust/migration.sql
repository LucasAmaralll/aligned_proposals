UPDATE "roles"
SET permissions = permissions || '["stock.adjust"]'::jsonb
WHERE name = 'manager'
  AND NOT (permissions @> '["stock.adjust"]'::jsonb);
