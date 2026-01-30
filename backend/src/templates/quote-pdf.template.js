/**
 * Template HTML/CSS para geração de PDF de Orçamento
 * Design moderno com paleta azul
 */

function generateQuotePDFTemplate(quote) {
  // Processar items (pode vir como string JSON)
  let items = [];
  try {
    items = typeof quote.items === 'string' ? JSON.parse(quote.items) : (quote.items || []);
  } catch (e) {
    console.error('Erro ao parsear items:', e);
    items = [];
  }
  
  // Função para escapar HTML
  const escapeHtml = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  // Informações do cliente e empresa
  const companyName = escapeHtml(quote.user?.company || quote.user?.name || 'Empresa');
  const companyEmail = escapeHtml(quote.user?.email || '');
  const companyPhone = escapeHtml(quote.user?.phone || '');
  const companyWebsite = escapeHtml(quote.user?.website || 'www.alignedproposals.com');
  
  // URL da logo do usuário (se houver)
  const logoUrl = quote.user?.logo 
    ? `http://localhost:5000${quote.user.logo}` 
    : null;
  
  const clientName = escapeHtml(quote.client?.name || 'Cliente não informado');
  const clientEmail = escapeHtml(quote.client?.email || 'Não informado');
  const clientPhone = escapeHtml(quote.client?.phone || 'Não informado');
  const clientAddress = escapeHtml(quote.client?.address || 'Não informado');
  
  // ID do orçamento - usar idExt se disponível, senão usar um número curto
  const quoteId = quote.idExt || quote.id?.substring(0, 5).toUpperCase() || 'N/A';
  
  // Formatação de datas
  const createdAt = quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('pt-BR') : '';
  const validUntil = quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('pt-BR') : '';
  
  // Cálculos
  const subtotal = Number(quote.subtotal) || 0;
  const discount = Number(quote.discount) || 0;
  const tax = Number(quote.tax) || 0;
  const total = Number(quote.total) || 0;
  
  // Formatação de moeda
  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  // Geração dos itens da tabela com desconto e tributo
  const itemsHTML = items.map((item, index) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const itemDiscount = Number(item.discount) || 0;
    const itemTax = Number(item.tax) || 0;
    const itemSubtotal = quantity * unitPrice;
    const itemTotal = itemSubtotal - itemDiscount + itemTax;
    
    let html = `
      <tr${index % 2 === 1 ? ' style="background-color: #bfdbfe;"' : ''}>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-size: 12px; color: #2b2b2b;">
          ${escapeHtml(item.description || 'Sem descrição')}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-size: 11px; color: #666; line-height: 1.5;">
          ${escapeHtml(item.details || '-')}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; font-size: 12px; color: #2b2b2b; font-weight: 600;">
          ${formatCurrency(itemTotal)}
        </td>`;
    
    // Mostrar desconto se houver
    if (itemDiscount > 0) {
      html += `
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; font-size: 12px; color: #00a86b; font-weight: 600;">
          -${formatCurrency(itemDiscount)}
        </td>`;
    }
    
    // Mostrar tributo se houver
    if (itemTax > 0) {
      html += `
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; font-size: 12px; color: #1d4ed8; font-weight: 600;">
          +${formatCurrency(itemTax)}
        </td>`;
    }
    
    html += `</tr>`;
    return html;
  }).join('');

  // Verificar se há desconto ou tributo em algum item
  const hasItemDiscount = items.some(item => Number(item.discount) > 0);
  const hasItemTax = items.some(item => Number(item.tax) > 0);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orçamento #${quote.id}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Poppins', sans-serif;
      background: #fff;
      color: #2b2b2b;
      line-height: 1.6;
      position: relative;
    }
    
    .container {
      width: 800px;
      margin: 0 auto;
      padding: 30px;
      display: flex;
      flex-direction: column;
      gap: 0;
      min-height: 100vh;
      justify-content: space-between;
    }
    
    .header {
      margin-bottom: 20px;
      padding-bottom: 0;
      border-bottom: none;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .company-header {
      text-align: center;
      background: transparent;
      padding: 0;
      border-radius: 0;
      order: -1;
    }
    
    .company-header-content {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
    }
    
    .header-top {
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
      margin-bottom: 0;
      gap: 20px;
    }
    
    .company-info {
      text-align: left;
    }
    
    .company-name {
      font-size: 16px;
      font-weight: 700;
      color: black;
      margin-bottom: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .logo {
      max-height: 120px;
      max-width: 120px;
      object-fit: contain;
      margin-bottom: 0;
    }
    
    .document-title {
      font-size: 20px;
      font-weight: bold;
      color: black;
      margin-top: 0;
      letter-spacing: 1px;
      margin-bottom: 0;
    }
    
    .document-date {
      font-size: 11px;
      color: #666;
      margin-top: 2px;
    }
    
    .section {
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
    }
    
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: black;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding-bottom: 0;
      border-bottom: none;
    }
    
    .info-block {
      background: #bfdbfe;
      padding: 16px;
      border-radius: 4px;
      border-left: 4px solid #3b82f6;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 0;
      font-size: 12px;
    }
    
    .info-row:last-child {
      margin-bottom: 0;
    }
    
    .info-label {
      font-weight: 600;
      color: #2b2b2b;
      min-width: 80px;
    }
    
    .info-value {
      color: #2b2b2b;
    }
    
    .table-wrapper {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden; /* corta as bordas da tabela dentro */
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    thead {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    }
    
    th {
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    th:last-child {
      text-align: right;
    }
    
    td {
      padding: 12px;
      font-size: 12px;
      border-bottom: 1px solid #e0e0e0;
      color: #1d4ed8;
      font-weight: 600;
    }
    
    .summary-table {
      margin-top: 12px;
      margin-left: auto;
      width: 300px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .summary-label {
      font-weight: 600;
      color: #2b2b2b;
    }
    
    .summary-value {
      text-align: right;
      color: #555;
    }
    
    .summary-value.discount {
      color: #039b5e;
    }
    
    .summary-value.tax {
      color: #e50b0b;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      border-radius: 4px;
      margin-top: 8px;
    }
    
    .payment-section {
      background: #bfdbfe;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 0;
      border-left: 4px solid #3b82f6;
      margin-top: 12px;
    }
    
    .payment-terms {
      font-size: 12px;
      color: #2b2b2b;
      line-height: 1.8;
    }
    
    .footer {
      margin-top: auto;
      padding-top: 12px;
      border-top: 2px solid #3b82f6;
      display: flex;
      justify-content: space-around;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .footer-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: #666;
      margin: 8px 0;
    }
    
    .footer-icon {
      width: 32px;
      height: 32px;
      background: #3b82f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 600;
      font-size: 10px;
    }

    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 100px;
      color: rgba(59, 130, 246, 0.1);
      font-weight: bold;
      z-index: -1;
      white-space: nowrap;
      pointer-events: none;
    }
  </style>
</head>
<body>
  ${quote.user?.plan?.name?.toLowerCase() === 'gratuito' ? '<div class="watermark">Aligned</div>' : ''}
  
  <div class="container">
    <!-- Header -->
    <div class="header">
      <!-- Empresa Centralizada no Topo -->
      <div class="company-header">
        <div class="company-header-content">
          ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo" />` : `<div class="company-name">${companyName}</div>`}
        </div>
      </div>
      
      <!-- Orçamento e Data à Esquerda -->
      <div class="header-top">
        <div class="company-info">
          <div class="document-title">ORÇAMENTO #${quoteId}</div>
          <div class="document-date">${createdAt}</div>
        </div>
      </div>
    </div>
    
    <!-- Cliente -->
    <div class="section">
      <div class="info-block">
        <div class="info-row">
          <span class="info-label"><strong>A/C:</strong></span>
          <span class="info-value">${clientName}</span>
        </div>
        <div class="info-row">
          <span class="info-label"><strong>E-mail:</strong></span>
          <span class="info-value">${clientEmail}</span>
        </div>
        <div class="info-row">
          <span class="info-label"><strong>Telefone:</strong></span>
          <span class="info-value">${clientPhone}</span>
        </div>
        <div class="info-row">
          <span class="info-label"><strong>Endereço:</strong></span>
          <span class="info-value">${clientAddress}</span>
        </div>
      </div>
    </div>
    
    <!-- Tabela de Serviços -->
    <div class="section">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>SERVIÇO</th>
              <th>DESCRIÇÃO</th>
              <th style="text-align: right;">VALOR</th>
              ${hasItemDiscount ? '<th style="text-align: right; width: 80px;">DESCONTO</th>' : ''}
              ${hasItemTax ? '<th style="text-align: right; width: 80px;">TRIBUTO</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>
      
      <!-- Resumo de Valores -->
      <div class="summary-table">
        <div class="summary-row">
          <span class="summary-label">Subtotal:</span>
          <span class="summary-value">${formatCurrency(subtotal)}</span>
        </div>
        ${discount > 0 ? `
        <div class="summary-row">
          <span class="summary-label">Desconto:</span>
          <span class="summary-value discount">-${formatCurrency(discount)}</span>
        </div>
        ` : ''}
        ${tax > 0 ? `
        <div class="summary-row">
          <span class="summary-label">Impostos/Tributos:</span>
          <span class="summary-value tax">+${formatCurrency(tax)}</span>
        </div>
        ` : ''}
        <div class="total-row">
          <span>TOTAL:</span>
          <span>${formatCurrency(total)}</span>
        </div>
      </div>
    </div>
    
    <!-- Forma de Pagamento -->
    ${quote.paymentTerms ? `
    <div class="section">
      <div class="section-title">FORMA DE PAGAMENTO</div>
      <div class="payment-section">
        <div class="payment-terms">
          ${escapeHtml(quote.paymentTerms)}
        </div>
      </div>
    </div>
    ` : ''}
    
    <!-- Termos e Condições -->
    ${quote.termsConditions ? `
    <div class="section">
      <div class="section-title">TERMOS E CONDIÇÕES</div>
      <div class="payment-section">
        <div class="payment-terms">
          ${escapeHtml(quote.termsConditions)}
        </div>
      </div>
    </div>
    ` : ''}
    
    <!-- Observações -->
    ${quote.notes ? `
    <div class="section">
      <div class="section-title">OBSERVAÇÕES</div>
      <div class="payment-section">
        <div class="payment-terms">
          ${escapeHtml(quote.notes)}
        </div>
      </div>
    </div>
    ` : ''}
    
    <!-- Informações Adicionais -->
    ${quote.additionalInfo ? `
    <div class="section">
      <div class="section-title">INFORMAÇÕES ADICIONAIS</div>
      <div class="payment-section">
        <div class="payment-terms">
          ${escapeHtml(quote.additionalInfo)}
        </div>
      </div>
    </div>
    ` : ''}
    
    <!-- Footer -->
    <div class="footer">
      ${companyEmail ? `
      <div class="footer-item">
        <div class="footer-icon">@</div>
        <a href="mailto:${companyEmail}" style="color: #666; text-decoration: none; cursor: pointer;">
          ${companyEmail}
        </a>
      </div>
      ` : ''}
      
      ${companyPhone ? `
      <div class="footer-item">
        <div class="footer-icon">☎</div>
        <a href="https://wa.me/${companyPhone.replace(/\D/g, '')}" style="color: #666; text-decoration: none; cursor: pointer;">
          ${companyPhone}
        </a>
      </div>
      ` : ''}
      
      ${companyWebsite ? `
      <div class="footer-item">
        <div class="footer-icon">🌐</div>
        <a href="https://${companyWebsite.replace(/^https?:\/\//, '')}" style="color: #666; text-decoration: none; cursor: pointer;">
          ${companyWebsite}
        </a>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = { generateQuotePDFTemplate };

