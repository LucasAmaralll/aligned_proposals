const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { generateQuotePDFTemplate } = require('../templates/quote-pdf.template');
const puppeteer = require('puppeteer');

class PDFService {
  /**
   * Gera PDF usando Puppeteer + template HTML (MÉTODO RECOMENDADO)
   * @param {Object} quote - Objeto do orçamento com includes (client, user, user.plan)
   * @returns {Buffer} Buffer do PDF gerado
   */
  async generateQuotePDFFromHTML(quote) {
    let browser;
    try {
      console.log('🔄 Iniciando geração de PDF...');
      
      const html = this.generateQuotePDFHTML(quote);
      console.log('✅ Template HTML gerado');
      
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ],
        timeout: 60000
      });
      console.log('✅ Browser iniciado');
      
      const page = await browser.newPage();
      
      // Aguardar conteúdo carregar
      await page.setContent(html, {
        waitUntil: ['load', 'networkidle0'],
        timeout: 30000
      });
      console.log('✅ Conteúdo HTML carregado');
      
      // Gerar PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: false,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });
      console.log('✅ PDF gerado, tamanho:', pdfBuffer.length, 'bytes');
      
      await browser.close();
      console.log('✅ Browser fechado');
      
      return pdfBuffer;
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      if (browser) {
        await browser.close().catch(() => {});
      }
      throw error;
    }
  }

  /**
   * Gera PDF do orçamento usando PDFKit (método legado)
   * Para usar HTML template, use generateQuotePDFFromHTML()
   */
  // Função auxiliar para desenhar linhas horizontais
  drawHorizontalLine(doc, y, color = '#E5E7EB', lineWidth = 1) {
    doc.strokeColor(color)
       .lineWidth(lineWidth)
       .moveTo(50, y)
       .lineTo(545, y)
       .stroke();
  }

  // Função auxiliar para desenhar caixas
  drawBox(doc, x, y, width, height, color = '#F9FAFB') {
    doc.rect(x, y, width, height)
       .fill(color);
  }

  async generateQuotePDF(quote) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 40,
          bufferPages: true 
        });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        const hasWatermark = quote.user.plan.hasWatermark;
        const items = JSON.parse(quote.items);
        const companyName = quote.user.company?.name || quote.user.companyName || quote.user.name;

        // ==================== CABEÇALHO ====================
        // Fundo do cabeçalho
        this.drawBox(doc, 40, 40, 515, 120, '#1E3A8A');

        // Logo da empresa (se existir) - estilo 3x4
        let logoX = 60;
        if (quote.user.logo) {
          try {
            const logoPath = path.join(__dirname, '../../', quote.user.logo);
            if (fs.existsSync(logoPath)) {
              doc.image(logoPath, 60, 55, { width: 60, height: 80, fit: [60, 80] });
              logoX = 140;
            }
          } catch (err) {
            console.log('Erro ao carregar logo:', err);
            logoX = 60;
          }
        }

        // Informações da empresa (branco sobre azul)
        doc.fontSize(18)
           .fillColor('#FFFFFF')
           .font('Helvetica-Bold')
           .text(companyName, logoX, 60, { width: 380 });

        doc.fontSize(10)
           .fillColor('#E0E7FF')
           .font('Helvetica')
           .text(quote.user.email, logoX, 90)
           .text(quote.user.phone || 'Sem telefone', logoX, 105);

        // Título "ORÇAMENTO" no canto direito
        doc.fontSize(24)
           .fillColor('#FFFFFF')
           .font('Helvetica-Bold')
           .text('ORÇAMENTO', 350, 120, { align: 'right', width: 155 });

        // ==================== INFORMAÇÕES DO DOCUMENTO ====================
        let yPos = 180;

        // Box de informações do orçamento
        this.drawBox(doc, 40, yPos, 515, 70, '#F3F4F6');
        this.drawHorizontalLine(doc, yPos, '#D1D5DB', 1);

        doc.fontSize(11)
           .fillColor('#374151')
           .font('Helvetica-Bold');

        // Informações em duas colunas
        doc.text('Número:', 60, yPos + 15)
           .text('Data de Emissão:', 60, yPos + 35);
        
        if (quote.validUntil) {
          doc.text('Válido até:', 60, yPos + 55);
        }

        doc.font('Helvetica')
           .fillColor('#1F2937')
           .text(`#${quote.id.substring(0, 8).toUpperCase()}`, 150, yPos + 15)
           .text(new Date(quote.createdAt).toLocaleDateString('pt-BR'), 150, yPos + 35);

        if (quote.validUntil) {
          doc.text(new Date(quote.validUntil).toLocaleDateString('pt-BR'), 150, yPos + 55);
        }

        // Status
        const statusColors = {
          pending: { bg: '#FEF3C7', text: '#92400E', label: 'PENDENTE' },
          approved: { bg: '#D1FAE5', text: '#065F46', label: 'APROVADO' },
          rejected: { bg: '#FEE2E2', text: '#991B1B', label: 'REJEITADO' }
        };
        const status = statusColors[quote.status] || statusColors.pending;

        doc.rect(380, yPos + 15, 135, 25)
           .fill(status.bg);
        doc.fontSize(10)
           .fillColor(status.text)
           .font('Helvetica-Bold')
           .text(status.label, 380, yPos + 22, { width: 135, align: 'center' });

        yPos += 85;
        this.drawHorizontalLine(doc, yPos, '#D1D5DB', 1);

        // ==================== DADOS DO CLIENTE ====================
        yPos += 15;
        
        doc.fontSize(14)
           .fillColor('#1E3A8A')
           .font('Helvetica-Bold')
           .text('DADOS DO CLIENTE', 60, yPos);

        yPos += 25;
        this.drawBox(doc, 40, yPos, 515, 70, '#F9FAFB');

        doc.fontSize(10)
           .fillColor('#374151')
           .font('Helvetica-Bold')
           .text('Nome:', 60, yPos + 15)
           .text('E-mail:', 60, yPos + 35)
           .text('Telefone:', 60, yPos + 55);

        doc.font('Helvetica')
           .fillColor('#1F2937')
           .text(quote.client.name, 120, yPos + 15, { width: 420 })
           .text(quote.client.email || 'Não informado', 120, yPos + 35, { width: 420 })
           .text(quote.client.phone || 'Não informado', 120, yPos + 55, { width: 420 });

        yPos += 85;
        this.drawHorizontalLine(doc, yPos, '#D1D5DB', 1);

        // ==================== DESCRIÇÃO DO ORÇAMENTO ====================
        yPos += 15;

        doc.fontSize(14)
           .fillColor('#1E3A8A')
           .font('Helvetica-Bold')
           .text('DESCRIÇÃO', 60, yPos);

        yPos += 25;

        doc.fontSize(12)
           .fillColor('#1F2937')
           .font('Helvetica-Bold')
           .text(quote.title, 60, yPos, { width: 480 });

        yPos += 20;

        if (quote.description) {
          doc.fontSize(10)
             .fillColor('#4B5563')
             .font('Helvetica')
             .text(quote.description, 60, yPos, { width: 480 });
          yPos += Math.ceil(quote.description.length / 80) * 15 + 10;
        }

        yPos += 10;
        this.drawHorizontalLine(doc, yPos, '#D1D5DB', 1);

        // ==================== TABELA DE ITENS ====================
        yPos += 20;

        doc.fontSize(14)
           .fillColor('#1E3A8A')
           .font('Helvetica-Bold')
           .text('ITENS DO ORÇAMENTO', 60, yPos);

        yPos += 30;

        yPos += 30;

        // Cabeçalho da tabela
        doc.rect(40, yPos, 515, 30)
           .fill('#1E3A8A');

        doc.fontSize(10)
           .fillColor('#FFFFFF')
           .font('Helvetica-Bold')
           .text('DESCRIÇÃO', 55, yPos + 10, { width: 250 })
           .text('QTD', 310, yPos + 10, { width: 50, align: 'center' })
           .text('VALOR UNIT.', 365, yPos + 10, { width: 80, align: 'right' })
           .text('TOTAL', 450, yPos + 10, { width: 90, align: 'right' });

        yPos += 30;

        // Linhas da tabela
        items.forEach((item, index) => {
          const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
          
          // Nova página se necessário
          if (yPos > 720) {
            doc.addPage();
            yPos = 60;
          }

          // Alternância de cores para melhor leitura
          const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
          doc.rect(40, yPos, 515, 28)
             .fill(bgColor);

          // Linha divisória sutil
          this.drawHorizontalLine(doc, yPos, '#E5E7EB', 0.5);

          doc.fontSize(10)
             .fillColor('#1F2937')
             .font('Helvetica')
             .text(item.description, 55, yPos + 9, { width: 245 })
             .text(item.quantity.toString(), 310, yPos + 9, { width: 50, align: 'center' })
             .text(`R$ ${parseFloat(item.price).toFixed(2)}`, 365, yPos + 9, { width: 80, align: 'right' })
             .font('Helvetica-Bold')
             .text(`R$ ${itemTotal.toFixed(2)}`, 450, yPos + 9, { width: 90, align: 'right' });

          yPos += 28;
        });

        // Linha final da tabela
        this.drawHorizontalLine(doc, yPos, '#1E3A8A', 2);

        // ==================== TOTAIS ====================
        yPos += 20;

        // Box de totais
        this.drawBox(doc, 320, yPos, 235, parseFloat(quote.discount) > 0 || parseFloat(quote.tax) > 0 ? 100 : 70, '#F3F4F6');

        doc.fontSize(11)
           .fillColor('#374151')
           .font('Helvetica');

        let totalYPos = yPos + 12;

        // Subtotal
        doc.text('Subtotal:', 340, totalYPos, { width: 120, align: 'left' })
           .fillColor('#1F2937')
           .font('Helvetica-Bold')
           .text(`R$ ${parseFloat(quote.subtotal).toFixed(2)}`, 460, totalYPos, { width: 80, align: 'right' });

        totalYPos += 20;

        // Desconto
        if (parseFloat(quote.discount) > 0) {
          doc.fillColor('#DC2626')
             .font('Helvetica')
             .text('Desconto:', 340, totalYPos, { width: 120, align: 'left' })
             .font('Helvetica-Bold')
             .text(`-R$ ${parseFloat(quote.discount).toFixed(2)}`, 460, totalYPos, { width: 80, align: 'right' });
          totalYPos += 20;
        }

        // Taxas
        if (parseFloat(quote.tax) > 0) {
          doc.fillColor('#374151')
             .font('Helvetica')
             .text('Taxas/Impostos:', 340, totalYPos, { width: 120, align: 'left' })
             .fillColor('#1F2937')
             .font('Helvetica-Bold')
             .text(`R$ ${parseFloat(quote.tax).toFixed(2)}`, 460, totalYPos, { width: 80, align: 'right' });
          totalYPos += 20;
        }

        // Linha antes do total
        this.drawHorizontalLine(doc, totalYPos + 5, '#1E3A8A', 1);
        totalYPos += 15;

        // Total final - destaque
        doc.rect(320, totalYPos - 5, 235, 35)
           .fill('#1E3A8A');

        doc.fontSize(14)
           .fillColor('#FFFFFF')
           .font('Helvetica-Bold')
           .text('VALOR TOTAL:', 340, totalYPos + 5, { width: 120, align: 'left' })
           .fontSize(16)
           .text(`R$ ${parseFloat(quote.total).toFixed(2)}`, 460, totalYPos + 5, { width: 80, align: 'right' });

        yPos = totalYPos + 50;

        yPos = totalYPos + 50;

        // ==================== OBSERVAÇÕES E TERMOS ====================
        // Observações
        if (quote.notes) {
          if (yPos > 650) {
            doc.addPage();
            yPos = 60;
          }

          this.drawHorizontalLine(doc, yPos, '#D1D5DB', 1);
          yPos += 15;

          doc.fontSize(12)
             .fillColor('#1E3A8A')
             .font('Helvetica-Bold')
             .text('OBSERVAÇÕES', 60, yPos);

          yPos += 22;
          this.drawBox(doc, 40, yPos, 515, 60, '#FFFBEB');

          doc.fontSize(9)
             .fillColor('#92400E')
             .font('Helvetica')
             .text(quote.notes, 55, yPos + 10, { width: 490, align: 'justify' });

          yPos += 75;
        }

        // Termos e condições
        if (quote.termsConditions) {
          if (yPos > 650) {
            doc.addPage();
            yPos = 60;
          }

          this.drawHorizontalLine(doc, yPos, '#D1D5DB', 1);
          yPos += 15;

          doc.fontSize(12)
             .fillColor('#1E3A8A')
             .font('Helvetica-Bold')
             .text('TERMOS E CONDIÇÕES', 60, yPos);

          yPos += 22;

          doc.fontSize(8)
             .fillColor('#4B5563')
             .font('Helvetica')
             .text(quote.termsConditions, 60, yPos, { width: 480, align: 'justify' });
        }

        // ==================== MARCA D'ÁGUA (Plano Gratuito) ====================
        if (hasWatermark) {
          const pages = doc.bufferedPageRange();
          for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(50)
               .fillColor('#E5E7EB', 0.2)
               .font('Helvetica-Bold')
               .rotate(-45, { origin: [297, 420] })
               .text('ALIGNED PROPOSALS', 150, 400, { align: 'center', width: 400 })
               .rotate(45, { origin: [297, 420] });
          }
        }

        // ==================== RODAPÉ (todas as páginas) ====================
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          
          // Linha superior do rodapé
          this.drawHorizontalLine(doc, 780, '#1E3A8A', 2);

          // Texto do rodapé
          doc.fontSize(8)
             .fillColor('#6B7280')
             .font('Helvetica')
             .text(
               `Gerado por Aligned | ${companyName} | Página ${i + 1} de ${pages.count}`,
               40,
               790,
               { align: 'center', width: 515 }
             );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Gera HTML do orçamento usando template profissional
   * Para converter em PDF, use Puppeteer:
   * 
   * const puppeteer = require('puppeteer');
   * const browser = await puppeteer.launch();
   * const page = await browser.newPage();
   * await page.setContent(html);
   * const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
   * await browser.close();
   * 
   * @param {Object} quote - Objeto do orçamento com includes (client, user, user.plan)
   * @returns {String} HTML completo pronto para renderização
   */
  generateQuotePDFHTML(quote) {
    return generateQuotePDFTemplate(quote);
  }
}

module.exports = new PDFService();
