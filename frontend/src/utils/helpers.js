export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

export const formatClientNumber = (number) => {
  if (number === undefined || number === null) return '';
  return String(number).padStart(4, '0');
};

export const formatSaleNumber = formatClientNumber;

export const PAYMENT_METHOD_LABELS = {
  cash: 'Dinheiro',
  pix: 'Pix',
  debit: 'Débito',
  credit: 'Crédito',
  other: 'Outro',
};

export const getPaymentMethodLabel = (method) =>
  PAYMENT_METHOD_LABELS[method] || method;

export const isBirthdayThisMonth = (birthDate) => {
  if (!birthDate) return false;
  return new Date(birthDate).getUTCMonth() === new Date().getMonth();
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('pt-BR');
};

export const onlyDigits = (value) => String(value || '').replace(/\D/g, '');

export const inferClientKind = (document) =>
  onlyDigits(document).length > 11 ? 'company' : 'person';

export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = onlyDigits(phone).slice(0, 11);
  if (!cleaned) return '';
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  if (cleaned.length <= 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
};

export const formatDocument = (document, kind) => {
  if (!document) return '';
  const type = kind || inferClientKind(document);
  const cleaned = onlyDigits(document);

  if (type === 'company' || cleaned.length > 11) {
    const cnpj = cleaned.slice(0, 14);
    if (cnpj.length <= 2) return cnpj;
    if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
    if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
    if (cnpj.length <= 12) {
      return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
    }
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
  }

  const cpf = cleaned.slice(0, 11);
  if (cpf.length <= 3) return cpf;
  if (cpf.length <= 6) return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
  if (cpf.length <= 9) return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
};

export const formatZipCode = (zipCode) => {
  if (!zipCode) return '';
  const cleaned = onlyDigits(zipCode).slice(0, 8);
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
};

export const getQuoteItemUnitPrice = (item) =>
  parseFloat(item?.unitPrice ?? item?.price ?? 0) || 0;

export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
    approved: 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950',
    pending_payment: 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950',
    paid: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    rejected: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300',
    no_return: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  };
  
  return colors[status] || 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200';
};

export const getStatusLabel = (status) => {
  const labels = {
    pending: 'Aguardando resposta',
    approved: 'Pagamento pendente',
    pending_payment: 'Pagamento pendente',
    paid: 'Pago',
    rejected: 'Reprovado',
    no_return: 'Sem retorno',
  };
  
  return labels[status] || status;
};

export const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return '';
  
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Se já tiver código do país, retorna
  if (cleaned.startsWith('55')) {
    return cleaned;
  }
  
  // Adiciona código do Brasil (55)
  return '55' + cleaned;
};

export const generateWhatsAppLink = (phone, message) => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
};

export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength) + '...';
};

export const getCompanyName = (userOrCompany) => {
  if (!userOrCompany) return '';
  if (userOrCompany.name && userOrCompany.slug) return userOrCompany.name;
  return (
    userOrCompany.company?.name ||
    userOrCompany.companyName ||
    (typeof userOrCompany.company === 'string' ? userOrCompany.company : '') ||
    userOrCompany.name ||
    ''
  );
};
