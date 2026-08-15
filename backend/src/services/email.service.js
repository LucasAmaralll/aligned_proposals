const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendQuoteEmail(to, quote, publicUrl, customMessage) {
    try {
      const items = JSON.parse(quote.items);
      
      const itemsHtml = items.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">R$ ${parseFloat(item.price).toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">R$ ${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}</td>
        </tr>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background: #3B82F6; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 20px 0;
            }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
            th { background: #3B82F6; color: white; padding: 10px; text-align: left; }
            .total { font-size: 18px; font-weight: bold; color: #3B82F6; }
            .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${quote.user.company?.name || quote.user.companyName || quote.user.name}</h1>
              <p>Orçamento Nº ${quote.id.substring(0, 8).toUpperCase()}</p>
            </div>
            
            <div class="content">
              ${customMessage ? `<p>${customMessage}</p>` : ''}
              
              <p>Olá <strong>${quote.client.name}</strong>,</p>
              
              <p>Segue o orçamento solicitado:</p>
              
              <h2>${quote.title}</h2>
              ${quote.description ? `<p>${quote.description}</p>` : ''}
              
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Qtd</th>
                    <th style="text-align: right;">Valor Unit.</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div style="text-align: right; padding: 20px; background: white;">
                <p>Subtotal: R$ ${parseFloat(quote.subtotal).toFixed(2)}</p>
                ${parseFloat(quote.discount) > 0 ? `<p>Desconto: -R$ ${parseFloat(quote.discount).toFixed(2)}</p>` : ''}
                ${parseFloat(quote.tax) > 0 ? `<p>Taxas: R$ ${parseFloat(quote.tax).toFixed(2)}</p>` : ''}
                <p class="total">TOTAL: R$ ${parseFloat(quote.total).toFixed(2)}</p>
              </div>
              
              ${quote.validUntil ? `<p><strong>Válido até:</strong> ${new Date(quote.validUntil).toLocaleDateString('pt-BR')}</p>` : ''}
              
              <div style="text-align: center;">
                <a href="${publicUrl}" class="button">Ver Orçamento Completo</a>
              </div>
              
              ${quote.notes ? `<div style="margin-top: 20px; padding: 15px; background: white;"><strong>Observações:</strong><br>${quote.notes}</div>` : ''}
            </div>
            
            <div class="footer">
              <p>Este email foi enviado por ${quote.user.company?.name || quote.user.companyName || quote.user.name}</p>
              <p>${quote.user.email} ${quote.user.phone ? '| ' + quote.user.phone : ''}</p>
              <p style="margin-top: 10px;">Gerado por Aligned</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: `Orçamento: ${quote.title}`,
        html
      };

      await this.transporter.sendMail(mailOptions);
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
