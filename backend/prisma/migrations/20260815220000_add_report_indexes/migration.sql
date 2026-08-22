-- CreateIndex
CREATE INDEX "sales_companyId_unitId_createdAt_idx" ON "sales"("companyId", "unitId", "createdAt");
CREATE INDEX "sales_companyId_sellerId_createdAt_idx" ON "sales"("companyId", "sellerId", "createdAt");
CREATE INDEX "sales_companyId_status_createdAt_idx" ON "sales"("companyId", "status", "createdAt");
CREATE INDEX "sale_items_variantId_idx" ON "sale_items"("variantId");
CREATE INDEX "sale_payments_method_idx" ON "sale_payments"("method");
CREATE INDEX "returns_companyId_unitId_createdAt_idx" ON "returns"("companyId", "unitId", "createdAt");
CREATE INDEX "exchanges_companyId_unitId_createdAt_idx" ON "exchanges"("companyId", "unitId", "createdAt");
CREATE INDEX "cash_sessions_companyId_unitId_openedAt_idx" ON "cash_sessions"("companyId", "unitId", "openedAt");
