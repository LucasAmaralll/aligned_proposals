const fs = require('fs');
const path = require('path');
const { STATUS_LABELS } = require('../lib/quoteStatus');

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrency(value) {
  return (Number(value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('pt-BR');
}

function itemUnitPrice(item) {
  return Number(item.unitPrice ?? item.price ?? 0) || 0;
}

function formatDocument(document) {
  if (!document) return '';
  const cleaned = String(document).replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return document;
}

function formatAddress(source) {
  if (!source) return '';
  if (source.address && !source.street) return source.address;
  const parts = [
    [source.street, source.number].filter(Boolean).join(', '),
    source.complement,
    source.neighborhood,
    [source.city, source.state].filter(Boolean).join(' / '),
    source.zip || source.zipCode,
  ].filter(Boolean);
  return parts.join(' · ');
}

function resolveLogoSrc(quote) {
  const logo = quote.user?.logo;
  if (!logo) return null;

  const relative = logo.startsWith('/') ? logo.slice(1) : logo;
  const diskPath = path.join(__dirname, '../../', relative);
  if (fs.existsSync(diskPath)) {
    const ext = path.extname(diskPath).replace('.', '') || 'png';
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    return `data:image/${mime};base64,${fs.readFileSync(diskPath).toString('base64')}`;
  }

  const base = process.env.BACKEND_URL || 'http://localhost:5000';
  return `${base}${logo.startsWith('/') ? logo : `/${logo}`}`;
}

function generateQuotePDFTemplate(quote) {
  let items = [];
  try {
    items = typeof quote.items === 'string' ? JSON.parse(quote.items) : quote.items || [];
  } catch (error) {
    items = [];
  }

  const company = quote.user?.company || {};
  const companyName = escapeHtml(company.name || quote.user?.companyName || quote.user?.name || 'Empresa');
  const companyEmail = escapeHtml(company.email || quote.user?.email || '');
  const companyPhone = escapeHtml(company.phone || quote.user?.phone || '');
  const companyDocument = formatDocument(company.document);
  const companyAddress = escapeHtml(formatAddress(company));
  const logoUrl = resolveLogoSrc(quote);

  const client = quote.client || {};
  const clientName = escapeHtml(client.name || 'Cliente');
  const clientEmail = escapeHtml(client.email || '');
  const clientPhone = escapeHtml(client.phone || '');
  const clientDocument = formatDocument(client.document);
  const clientAddress = escapeHtml(formatAddress(client) || client.address || '');

  const quoteNumber = quote.idExt || quote.id?.substring(0, 8).toUpperCase() || 'N/A';
  const status = quote.status === 'approved' ? 'pending_payment' : quote.status;
  const statusLabel = STATUS_LABELS[status] || status;
  const createdAt = formatDate(quote.createdAt);
  const validUntil = formatDate(quote.validUntil);

  const subtotal = Number(quote.subtotal) || 0;
  const discount = Number(quote.discount) || 0;
  const tax = Number(quote.tax) || 0;
  const total = Number(quote.total) || 0;
  const pieces = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const itemsHTML = items
    .map((item, index) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = itemUnitPrice(item);
      const lineTotal = quantity * unitPrice;
      return `
        <tr>
          <td class="idx">${index + 1}</td>
          <td>
            <div class="item-name">${escapeHtml(item.description || 'Peça')}</div>
            ${item.details ? `<div class="item-detail">${escapeHtml(item.details)}</div>` : ''}
          </td>
          <td class="num">${quantity}</td>
          <td class="num">${formatCurrency(unitPrice)}</td>
          <td class="num strong">${formatCurrency(lineTotal)}</td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Orçamento ${quoteNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 16mm 14mm 18mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      background: #fff;
      font-size: 11px;
      line-height: 1.45;
    }
    .sheet { width: 100%; }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 18px;
      border-bottom: 1.5px solid #111;
    }
    .brand { display: flex; align-items: center; gap: 14px; }
    .logo { max-height: 52px; max-width: 120px; object-fit: contain; }
    .company-name { font-size: 18px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
    .muted { color: #5c5c5c; }
    .meta { text-align: right; }
    .doc-kicker { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #6b6b6b; }
    .doc-title { font-size: 22px; font-weight: 700; margin-top: 2px; }
    .doc-number { font-size: 13px; font-weight: 600; margin-top: 2px; }
    .badge {
      display: inline-block;
      margin-top: 8px;
      padding: 3px 8px;
      border: 1px solid #111;
      font-size: 9px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-weight: 600;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin: 20px 0 18px;
    }
    .card {
      background: #F6F5F2;
      padding: 14px 16px;
      min-height: 118px;
    }
    .card h2 {
      font-size: 9px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #6b6b6b;
      margin-bottom: 8px;
    }
    .card .name { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
    .card p { color: #3d3d3d; }
    .quote-head { margin-bottom: 14px; }
    .quote-head h1 { font-size: 16px; font-weight: 700; }
    .quote-head p { margin-top: 4px; color: #4a4a4a; }
    table { width: 100%; border-collapse: collapse; }
    thead th {
      text-align: left;
      font-size: 9px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #6b6b6b;
      border-bottom: 1px solid #111;
      padding: 0 8px 8px;
    }
    thead th.num, td.num { text-align: right; }
    tbody td {
      padding: 10px 8px;
      border-bottom: 1px solid #e6e4df;
      vertical-align: top;
    }
    .idx { width: 28px; color: #8a8a8a; }
    .item-name { font-weight: 600; }
    .item-detail { color: #6b6b6b; font-size: 10px; margin-top: 2px; }
    .strong { font-weight: 700; }
    .totals {
      margin-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
    }
    .summary-note { max-width: 280px; color: #5c5c5c; font-size: 10px; }
    .summary {
      width: 260px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      color: #3d3d3d;
    }
    .summary-total {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      padding-top: 10px;
      border-top: 1.5px solid #111;
      font-size: 14px;
      font-weight: 700;
    }
    .notes {
      margin-top: 22px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .notes.single { grid-template-columns: 1fr; }
    .note h3 {
      font-size: 9px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #6b6b6b;
      margin-bottom: 6px;
    }
    .note p { color: #3d3d3d; white-space: pre-wrap; }
    .footer {
      margin-top: 28px;
      padding-top: 10px;
      border-top: 1px solid #d8d6d0;
      display: flex;
      justify-content: space-between;
      color: #7a7a7a;
      font-size: 9px;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <header class="topbar">
      <div class="brand">
        ${logoUrl ? `<img src="${logoUrl}" alt="" class="logo" />` : ''}
        <div>
          <div class="company-name">${companyName}</div>
          ${companyDocument ? `<div class="muted">CNPJ ${escapeHtml(companyDocument)}</div>` : ''}
          ${companyAddress ? `<div class="muted">${companyAddress}</div>` : ''}
          <div class="muted">${[companyPhone, companyEmail].filter(Boolean).join(' · ')}</div>
        </div>
      </div>
      <div class="meta">
        <div class="doc-kicker">Atacado</div>
        <div class="doc-title">Orçamento</div>
        <div class="doc-number">Nº ${escapeHtml(quoteNumber)}</div>
        <div class="muted">${createdAt}${validUntil ? ` · válido até ${validUntil}` : ''}</div>
        <div class="badge">${escapeHtml(statusLabel)}</div>
      </div>
    </header>

    <section class="grid">
      <div class="card">
        <h2>Emitente</h2>
        <div class="name">${companyName}</div>
        ${companyDocument ? `<p>CNPJ ${escapeHtml(companyDocument)}</p>` : ''}
        ${companyAddress ? `<p>${companyAddress}</p>` : ''}
        ${companyPhone ? `<p>${companyPhone}</p>` : ''}
        ${companyEmail ? `<p>${companyEmail}</p>` : ''}
      </div>
      <div class="card">
        <h2>Cliente</h2>
        <div class="name">${clientName}</div>
        ${clientDocument ? `<p>CNPJ/CPF ${escapeHtml(clientDocument)}</p>` : ''}
        ${clientAddress ? `<p>${clientAddress}</p>` : ''}
        ${clientPhone ? `<p>${clientPhone}</p>` : ''}
        ${clientEmail ? `<p>${clientEmail}</p>` : ''}
      </div>
    </section>

    <div class="quote-head">
      <h1>${escapeHtml(quote.title || 'Pedido de atacado')}</h1>
      ${quote.description ? `<p>${escapeHtml(quote.description)}</p>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th class="idx">#</th>
          <th>Peça</th>
          <th class="num">Qtd</th>
          <th class="num">Unitário</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="totals">
      <div class="summary-note">
        ${pieces} ${pieces === 1 ? 'peça' : 'peças'} neste pedido.
        Aprovação reserva o pedido com pagamento pendente. O estoque só baixa depois do pagamento.
      </div>
      <div class="summary">
        <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
        ${discount > 0 ? `<div class="summary-row"><span>Desconto</span><span>- ${formatCurrency(discount)}</span></div>` : ''}
        ${tax > 0 ? `<div class="summary-row"><span>Impostos</span><span>${formatCurrency(tax)}</span></div>` : ''}
        <div class="summary-total"><span>Total</span><span>${formatCurrency(total)}</span></div>
      </div>
    </div>

    ${quote.paymentTerms || quote.notes || quote.termsConditions || quote.additionalInfo ? `
    <section class="notes ${[quote.paymentTerms, quote.notes, quote.termsConditions, quote.additionalInfo].filter(Boolean).length === 1 ? 'single' : ''}">
      ${quote.paymentTerms ? `<div class="note"><h3>Condição de pagamento</h3><p>${escapeHtml(quote.paymentTerms)}</p></div>` : ''}
      ${quote.notes ? `<div class="note"><h3>Observações</h3><p>${escapeHtml(quote.notes)}</p></div>` : ''}
      ${quote.termsConditions ? `<div class="note"><h3>Termos</h3><p>${escapeHtml(quote.termsConditions)}</p></div>` : ''}
      ${quote.additionalInfo ? `<div class="note"><h3>Informações adicionais</h3><p>${escapeHtml(quote.additionalInfo)}</p></div>` : ''}
    </section>` : ''}

    <footer class="footer">
      <span>Aligned · orçamento de atacado</span>
      <span>${companyName}${companyDocument ? ` · ${escapeHtml(companyDocument)}` : ''}</span>
    </footer>
  </div>
</body>
</html>`;
}

module.exports = { generateQuotePDFTemplate };
