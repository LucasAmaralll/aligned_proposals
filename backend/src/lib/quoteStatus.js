const QUOTE_STATUSES = ['pending', 'pending_payment', 'paid', 'rejected', 'no_return'];

const STATUS_LABELS = {
  pending: 'Aguardando resposta',
  pending_payment: 'Pagamento pendente',
  paid: 'Pago',
  rejected: 'Reprovado',
  no_return: 'Sem retorno',
  approved: 'Pagamento pendente',
};

function normalizeQuoteStatus(status) {
  if (status === 'approved') return 'pending_payment';
  return status;
}

function canExpireQuote(status) {
  return status === 'pending';
}

module.exports = {
  QUOTE_STATUSES,
  STATUS_LABELS,
  normalizeQuoteStatus,
  canExpireQuote,
};
