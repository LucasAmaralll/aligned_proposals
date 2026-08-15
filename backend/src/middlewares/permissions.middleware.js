/**
 * Permissões de plano SaaS.
 * No fluxo interno de gestão (Reveza/Rezza) esses gates não bloqueiam operação.
 * O código permanece para não quebrar o módulo de assinaturas.
 */

const canAccessDashboard = async (req, res, next) => next();

const canAccessPricing = async (req, res, next) => next();

const checkQuoteLimit = async (req, res, next) => next();

const requireProPlan = async (req, res, next) => next();

module.exports = {
  canAccessDashboard,
  canAccessPricing,
  checkQuoteLimit,
  requireProPlan,
};
