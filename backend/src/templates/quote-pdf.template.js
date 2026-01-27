/**
 * Template HTML/CSS para geração de PDF de Orçamento
 * Compatível com Puppeteer, pdf-lib ou qualquer renderizador HTML-to-PDF
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
  const companyLogo = quote.user?.logo || '';
  
  const clientName = escapeHtml(quote.client?.name || 'Cliente não informado');
  const clientEmail = escapeHtml(quote.client?.email || 'Não informado');
  const clientPhone = escapeHtml(quote.client?.phone || 'Não informado');
  const clientLogo = quote.client?.logoUrl || ''; // Logo do cliente
  
  // Formatação de datas
  const createdAt = quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('pt-BR') : '';
  const validUntil = quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('pt-BR') : '';
  
  // Status
  const statusConfig = {
    pending: { label: 'PENDENTE', bg: '#FEF3C7', color: '#92400E' },
    approved: { label: 'APROVADO', bg: '#D1FAE5', color: '#065F46' },
    rejected: { label: 'REJEITADO', bg: '#FEE2E2', color: '#991B1B' }
  };
  const status = statusConfig[quote.status] || statusConfig.pending;
  
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
  
  // Geração dos itens da tabela
  const itemsHTML = items.map((item, index) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const itemTotal = quantity * unitPrice;
    const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
    
    return `
      <tr style="background-color: ${bgColor};">
        <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-size: 13px; color: #1F2937;">
          ${escapeHtml(item.description || 'Sem descrição')}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; text-align: center; font-size: 13px; color: #1F2937; white-space: nowrap;">
          ${quantity}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; text-align: right; font-size: 13px; color: #1F2937; white-space: nowrap;">
          ${formatCurrency(unitPrice)}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; text-align: right; font-size: 13px; font-weight: 600; color: #1F2937; white-space: nowrap;">
          ${formatCurrency(itemTotal)}
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orçamento #${quote.id?.substring(0, 8).toUpperCase()}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1F2937;
      background-color: #FFFFFF;
      padding: 20px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }
    
    /* CABEÇALHO */
    .header {
      background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      position: relative;
      min-height: 140px;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .company-info {
      flex: 1;
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }
    
    .company-logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 8px;
    }
    
    .company-details {
      flex: 1;
    }
    
    .company-name {
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 8px;
      color: #FFFFFF;
    }
    
    .company-contact {
      font-size: 12px;
      color: #E0E7FF;
      margin: 2px 0;
    }
    
    .client-logo-container {
      width: 100px;
      text-align: right;
    }
    
    .client-logo {
      max-width: 100px;
      max-height: 80px;
      object-fit: contain;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 6px;
      padding: 6px;
    }
    
    .document-title {
      text-align: center;
      font-size: 28px;
      font-weight: bold;
      margin: 20px 0 10px 0;
      color: #FFFFFF;
      letter-spacing: 2px;
      text-transform: uppercase;
      white-space: nowrap;
    }
    
    /* INFORMAÇÕES DO DOCUMENTO */
    .document-info {
      background: #F3F4F6;
      border: 1px solid #D1D5DB;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 15px;
    }
    
    .info-group {
      flex: 1;
      min-width: 200px;
    }
    
    .info-label {
      font-size: 11px;
      font-weight: bold;
      color: #6B7280;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    
    .info-value {
      font-size: 14px;
      color: #1F2937;
      font-weight: 600;
    }
    
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      text-align: center;
      white-space: nowrap;
      background-color: ${status.bg};
      color: ${status.color};
    }
    
    /* SEÇÕES */
    .section {
      margin: 25px 0;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #1E3A8A;
      text-transform: uppercase;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #1E3A8A;
      white-space: nowrap;
    }
    
    .section-content {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 18px;
    }
    
    .field-row {
      display: flex;
      margin-bottom: 10px;
    }
    
    .field-row:last-child {
      margin-bottom: 0;
    }
    
    .field-label {
      font-weight: bold;
      color: #374151;
      min-width: 100px;
      font-size: 13px;
    }
    
    .field-value {
      color: #1F2937;
      flex: 1;
      font-size: 13px;
    }
    
    /* DESCRIÇÃO */
    .description-content {
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 16px;
    }
    
    .description-title {
      font-size: 15px;
      font-weight: bold;
      color: #1F2937;
      margin-bottom: 8px;
    }
    
    .description-text {
      font-size: 13px;
      color: #4B5563;
      line-height: 1.6;
    }
    
    /* TABELA */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .items-table thead {
      background: #1E3A8A;
      color: white;
    }
    
    .items-table thead th {
      padding: 14px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    
    .items-table thead th:nth-child(1) {
      width: 45%;
    }
    
    .items-table thead th:nth-child(2) {
      width: 15%;
      text-align: center;
    }
    
    .items-table thead th:nth-child(3) {
      width: 20%;
      text-align: right;
    }
    
    .items-table thead th:nth-child(4) {
      width: 20%;
      text-align: right;
    }
    
    .items-table tbody tr:hover {
      background-color: #F3F4F6 !important;
    }
    
    /* TOTAIS */
    .totals-section {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
    
    .totals-box {
      min-width: 350px;
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 18px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    
    .total-row:last-child {
      border-bottom: none;
      margin-top: 8px;
      padding-top: 12px;
      border-top: 2px solid #1E3A8A;
    }
    
    .total-label {
      font-size: 14px;
      color: #374151;
    }
    
    .total-value {
      font-size: 14px;
      font-weight: 600;
      color: #1F2937;
      white-space: nowrap;
    }
    
    .total-row:last-child .total-label {
      font-size: 16px;
      font-weight: bold;
      color: #1E3A8A;
    }
    
    .total-row:last-child .total-value {
      font-size: 18px;
      font-weight: bold;
      color: #1E3A8A;
    }
    
    /* OBSERVAÇÕES */
    .notes-section {
      margin-top: 25px;
      padding: 18px;
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 6px;
    }
    
    .notes-title {
      font-size: 13px;
      font-weight: bold;
      color: #92400E;
      margin-bottom: 8px;
    }
    
    .notes-text {
      font-size: 12px;
      color: #78350F;
      line-height: 1.5;
    }
    
    /* TERMOS */
    .terms-section {
      margin-top: 20px;
      padding: 18px;
      background: #F3F4F6;
      border: 1px solid #D1D5DB;
      border-radius: 6px;
    }
    
    .terms-title {
      font-size: 13px;
      font-weight: bold;
      color: #374151;
      margin-bottom: 8px;
    }
    
    .terms-text {
      font-size: 11px;
      color: #6B7280;
      line-height: 1.6;
    }
    
    /* RODAPÉ */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
      color: #9CA3AF;
      font-size: 11px;
    }
    
    /* IMPRESSÃO */
    @media print {
      body {
        padding: 0;
      }
      
      .container {
        max-width: 100%;
      }
      
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- CABEÇALHO -->
    <div class="header">
      <div class="header-content">
        <div class="company-info">
          ${companyLogo ? `<img src="${companyLogo}" alt="Logo da Empresa" class="company-logo">` : ''}
          <div class="company-details">
            <div class="company-name">${companyName}</div>
            ${companyEmail ? `<div class="company-contact">✉ ${companyEmail}</div>` : ''}
            ${companyPhone ? `<div class="company-contact">📞 ${companyPhone}</div>` : ''}
          </div>
        </div>
        
        ${clientLogo ? `
        <div class="client-logo-container">
          <img src="${clientLogo}" alt="Logo do Cliente" class="client-logo">
        </div>
        ` : ''}
      </div>
      
      <div class="document-title">Orçamento</div>
    </div>
    
    <!-- INFORMAÇÕES DO DOCUMENTO -->
    <div class="document-info">
      <div class="info-group">
        <div class="info-label">Número</div>
        <div class="info-value">#${quote.id?.substring(0, 8).toUpperCase() || 'N/A'}</div>
      </div>
      
      <div class="info-group">
        <div class="info-label">Data de Emissão</div>
        <div class="info-value">${createdAt || 'N/A'}</div>
      </div>
      
      ${validUntil ? `
      <div class="info-group">
        <div class="info-label">Válido Até</div>
        <div class="info-value">${validUntil}</div>
      </div>
      ` : ''}
      
      <div class="info-group">
        <div class="info-label">Status</div>
        <div class="status-badge">${status.label}</div>
      </div>
    </div>
    
    <!-- DADOS DO CLIENTE -->
    <div class="section">
      <div class="section-title">Dados do Cliente</div>
      <div class="section-content">
        <div class="field-row">
          <div class="field-label">Nome:</div>
          <div class="field-value">${clientName}</div>
        </div>
        <div class="field-row">
          <div class="field-label">E-mail:</div>
          <div class="field-value">${clientEmail}</div>
        </div>
        <div class="field-row">
          <div class="field-label">Telefone:</div>
          <div class="field-value">${clientPhone}</div>
        </div>
      </div>
    </div>
    
    <!-- DESCRIÇÃO -->
    <div class="section">
      <div class="section-title">Descrição</div>
      <div class="description-content">
        <div class="description-title">${escapeHtml(quote.title || 'Sem título')}</div>
        ${quote.description ? `<div class="description-text">${escapeHtml(quote.description)}</div>` : ''}
      </div>
    </div>
    
    <!-- ITENS DO ORÇAMENTO -->
    <div class="section">
      <div class="section-title">Itens do Orçamento</div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Descrição</th>
            <th style="text-align: center;">Qtd</th>
            <th style="text-align: right;">Valor Unit.</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
      
      <!-- TOTAIS -->
      <div class="totals-section">
        <div class="totals-box">
          <div class="total-row">
            <div class="total-label">Subtotal:</div>
            <div class="total-value">${formatCurrency(subtotal)}</div>
          </div>
          
          ${discount > 0 ? `
          <div class="total-row">
            <div class="total-label">Desconto:</div>
            <div class="total-value">- ${formatCurrency(discount)}</div>
          </div>
          ` : ''}
          
          ${tax > 0 ? `
          <div class="total-row">
            <div class="total-label">Impostos/Taxas:</div>
            <div class="total-value">+ ${formatCurrency(tax)}</div>
          </div>
          ` : ''}
          
          <div class="total-row">
            <div class="total-label">Total:</div>
            <div class="total-value">${formatCurrency(total)}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- OBSERVAÇÕES -->
    ${quote.notes ? `
    <div class="notes-section">
      <div class="notes-title">⚠️ Observações</div>
      <div class="notes-text">${escapeHtml(quote.notes)}</div>
    </div>
    ` : ''}
    
    <!-- TERMOS E CONDIÇÕES -->
    ${quote.termsConditions ? `
    <div class="terms-section">
      <div class="terms-title">📄 Termos e Condições</div>
      <div class="terms-text">${escapeHtml(quote.termsConditions)}</div>
    </div>
    ` : ''}
    
    <!-- RODAPÉ -->
    <div class="footer">
      <p>Documento gerado automaticamente pelo Sistema de Orçamentos</p>
      <p>Data de geração: ${new Date().toLocaleString('pt-BR')}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

module.exports = { generateQuotePDFTemplate };
