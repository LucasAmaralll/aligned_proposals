const PDFDocument = require('pdfkit');
const path = require('path');

class PDFService {
  async generateQuotePDF(quote) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        const hasWatermark = quote.user.plan.hasWatermark;
        const items = JSON.parse(quote.items);

        // Header com logo (se existir)
        if (quote.user.logo) {
          try {
            const logoPath = path.join(__dirname, '../../', quote.user.logo);
            doc.image(logoPath, 50, 45, { width: 80 });
          } catch (err) {
            console.log('Logo não encontrado');
          }
        }

        // Informações da empresa
        doc.fontSize(20)
           .text(quote.user.company || quote.user.name, 200, 50, { align: 'right' });
        
        doc.fontSize(10)
           .text(quote.user.email, 200, 75, { align: 'right' });
        
        if (quote.user.phone) {
          doc.text(quote.user.phone, 200, 90, { align: 'right' });
        }

        // Título do documento
        doc.fontSize(24)
           .fillColor('#3B82F6')
           .text('ORÇAMENTO', 50, 150);

        // Número e data
        doc.fontSize(10)
           .fillColor('#000000')
           .text(`Nº: ${quote.id.substring(0, 8).toUpperCase()}`, 50, 185)
           .text(`Data: ${new Date(quote.createdAt).toLocaleDateString('pt-BR')}`, 50, 200);

        if (quote.validUntil) {
          doc.text(`Válido até: ${new Date(quote.validUntil).toLocaleDateString('pt-BR')}`, 50, 215);
        }

        // Dados do cliente
        doc.fontSize(14)
           .fillColor('#3B82F6')
           .text('Cliente:', 50, 250);

        doc.fontSize(10)
           .fillColor('#000000')
           .text(quote.client.name, 50, 270)
           .text(quote.client.email || '-', 50, 285);

        if (quote.client.phone) {
          doc.text(quote.client.phone, 50, 300);
        }

        // Título do orçamento
        doc.fontSize(14)
           .fillColor('#3B82F6')
           .text('Descrição:', 50, 340);

        doc.fontSize(12)
           .fillColor('#000000')
           .text(quote.title, 50, 360);

        if (quote.description) {
          doc.fontSize(10)
             .text(quote.description, 50, 380, { width: 500 });
        }

        // Tabela de itens
        let yPosition = quote.description ? 430 : 400;

        doc.fontSize(12)
           .fillColor('#3B82F6')
           .text('Itens:', 50, yPosition);

        yPosition += 25;

        // Cabeçalho da tabela
        doc.fontSize(10)
           .fillColor('#ffffff')
           .rect(50, yPosition, 495, 25)
           .fill('#3B82F6');

        doc.fillColor('#ffffff')
           .text('Item', 60, yPosition + 7, { width: 200 })
           .text('Qtd', 270, yPosition + 7, { width: 50 })
           .text('Valor Unit.', 330, yPosition + 7, { width: 80, align: 'right' })
           .text('Total', 420, yPosition + 7, { width: 115, align: 'right' });

        yPosition += 25;

        // Itens
        doc.fillColor('#000000');
        items.forEach((item, index) => {
          const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
          
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          const bgColor = index % 2 === 0 ? '#f3f4f6' : '#ffffff';
          doc.rect(50, yPosition, 495, 25).fill(bgColor);

          doc.fillColor('#000000')
             .text(item.description, 60, yPosition + 7, { width: 200 })
             .text(item.quantity.toString(), 270, yPosition + 7, { width: 50 })
             .text(`R$ ${parseFloat(item.price).toFixed(2)}`, 330, yPosition + 7, { width: 80, align: 'right' })
             .text(`R$ ${itemTotal.toFixed(2)}`, 420, yPosition + 7, { width: 115, align: 'right' });

          yPosition += 25;
        });

        // Totais
        yPosition += 20;

        doc.fontSize(10)
           .text('Subtotal:', 350, yPosition, { width: 120, align: 'right' })
           .text(`R$ ${parseFloat(quote.subtotal).toFixed(2)}`, 420, yPosition, { width: 115, align: 'right' });

        yPosition += 20;

        if (parseFloat(quote.discount) > 0) {
          doc.text('Desconto:', 350, yPosition, { width: 120, align: 'right' })
             .text(`-R$ ${parseFloat(quote.discount).toFixed(2)}`, 420, yPosition, { width: 115, align: 'right' });
          yPosition += 20;
        }

        if (parseFloat(quote.tax) > 0) {
          doc.text('Taxas/Impostos:', 350, yPosition, { width: 120, align: 'right' })
             .text(`R$ ${parseFloat(quote.tax).toFixed(2)}`, 420, yPosition, { width: 115, align: 'right' });
          yPosition += 20;
        }

        doc.fontSize(12)
           .fillColor('#3B82F6')
           .text('TOTAL:', 350, yPosition, { width: 120, align: 'right' })
           .text(`R$ ${parseFloat(quote.total).toFixed(2)}`, 420, yPosition, { width: 115, align: 'right' });

        // Observações
        if (quote.notes) {
          yPosition += 40;
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }

          doc.fontSize(12)
             .fillColor('#3B82F6')
             .text('Observações:', 50, yPosition);

          doc.fontSize(10)
             .fillColor('#000000')
             .text(quote.notes, 50, yPosition + 20, { width: 500 });
        }

        // Termos e condições
        if (quote.termsConditions) {
          yPosition += quote.notes ? 80 : 40;
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }

          doc.fontSize(12)
             .fillColor('#3B82F6')
             .text('Termos e Condições:', 50, yPosition);

          doc.fontSize(9)
             .fillColor('#000000')
             .text(quote.termsConditions, 50, yPosition + 20, { width: 500 });
        }

        // Marca d'água (se plano gratuito)
        if (hasWatermark) {
          doc.fontSize(60)
             .fillColor('#cccccc', 0.3)
             .rotate(-45, { origin: [300, 400] })
             .text('ALIGNED PROPOSALS', 100, 400, { align: 'center' })
             .rotate(45, { origin: [300, 400] });
        }

        // Rodapé
        doc.fontSize(8)
           .fillColor('#6B7280')
           .text(
             'Gerado por Aligned Proposals - Sistema de Orçamentos Online',
             50,
             750,
             { align: 'center', width: 495 }
           );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new PDFService();
