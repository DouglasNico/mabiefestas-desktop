/**
 * pdf-generator.js - Módulo de Geração de Orçamentos Profissionais em PDF (Com Cores e Gráficos de Impressão Fixos)
 */

const PDFGenerator = {
  formatMoney(val) {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  },

  gerarHTMLDocumento(orcamento, config) {
    const totalItens = orcamento.itens.reduce((acc, item) => acc + (item.quantidade * item.diaria), 0);
    const taxaFrete = Number(orcamento.frete || 0);
    const desconto = Number(orcamento.desconto || 0);
    const totalGeral = Math.max(0, totalItens + taxaFrete - desconto);
    const percentualSinal = Number(orcamento.percentualSinal || config.empresa.percentualSinalPadrao || 50);
    const valorSinal = (totalGeral * (percentualSinal / 100));
    const saldoRestante = totalGeral - valorSinal;

    const itensRows = orcamento.itens.map((item, index) => {
      const subtotal = item.quantidade * item.diaria;
      return `
        <tr>
          <td style="text-align: center; color: #666; font-size: 11px;">${index + 1}</td>
          <td>
            <strong style="color: #2a2228; font-size: 12px;">${item.nome}</strong>
            ${item.codigo ? `<span style="font-size: 10px; color: #888; display: block;">Cód: ${item.codigo}</span>` : ''}
          </td>
          <td style="text-align: center; font-weight: bold; color: #2a2228;">${item.quantidade} un</td>
          <td style="text-align: right; color: #555;">${this.formatMoney(item.diaria)}</td>
          <td style="text-align: right; font-weight: bold; color: #2a2228;">${this.formatMoney(subtotal)}</td>
          <td style="text-align: right; color: #777; font-size: 11px;">${this.formatMoney(item.reposicao)}</td>
        </tr>
      `;
    }).join('');

    const regrasHtml = (config.empresa.regrasLocacao || []).map(r => `<li>${r}</li>`).join('');
    const baseHref = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <base href="${baseHref}">
        <title>Orçamento #${orcamento.id} - ${config.empresa.nome}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          @page {
            size: A4;
            margin: 10mm 14mm;
          }
          body {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            color: #2a2228;
            background: #fff;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.45;
          }
          
          /* Barra de Impressão Flutuante (Oculta ao Imprimir) */
          .print-actions-bar {
            background: #fff0f4;
            border: 1px solid #f5c2d1;
            padding: 12px 18px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .btn-print-action {
            background: #e8547a;
            color: #fff;
            border: none;
            padding: 9px 22px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
          }
          .btn-print-action:hover {
            background: #d4456b;
          }
          .print-tip {
            font-size: 11px;
            color: #6b5e65;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e8547a;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .brand-logo-pdf {
            height: 55px;
            max-width: 170px;
            object-fit: contain;
          }
          .brand-title {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #2a2228;
            margin: 0;
            text-transform: uppercase;
            font-family: 'Playfair Display', Georgia, serif;
          }
          .brand-title span {
            color: #e8547a;
          }
          .brand-subtitle {
            color: #6b5e65;
            font-size: 11px;
            margin: 2px 0 0 0;
          }
          .doc-badge {
            text-align: right;
          }
          .doc-badge .num {
            font-size: 19px;
            font-weight: 800;
            color: #e8547a;
          }
          .doc-badge .date {
            color: #718096;
            font-size: 11px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-bottom: 18px;
          }
          .info-card {
            background-color: #fdfafd !important;
            border: 1px solid #f5c2d1 !important;
            border-radius: 8px;
            padding: 12px 14px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .info-card h4 {
            margin: 0 0 8px 0;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #e8547a;
            border-bottom: 1px solid #fad5e0;
            padding-bottom: 4px;
            font-weight: 700;
          }
          .info-card p {
            margin: 3px 0;
            font-size: 11px;
            color: #2a2228;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            border: 1px solid #f5c2d1;
            border-radius: 6px;
            overflow: hidden;
          }
          th {
            background-color: #2a2228 !important;
            color: #ffffff !important;
            padding: 9px 12px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #2a2228 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          td {
            padding: 9px 12px;
            border-bottom: 1px solid #f0e6eb;
            font-size: 11px;
            color: #2a2228;
          }
          tr:nth-child(even) td {
            background-color: #fdfafb !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .totals-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
            margin-bottom: 18px;
          }
          .totals-table {
            width: 330px;
            border: 1px solid #f5c2d1 !important;
            border-radius: 8px;
            overflow: hidden;
            border-collapse: collapse;
          }
          .totals-table td {
            padding: 7px 14px;
            border-bottom: 1px solid #f5c2d1;
          }
          .totals-table tr.total-row {
            background-color: #2a2228 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .totals-table tr.total-row td {
            background-color: #2a2228 !important;
            color: #ffffff !important;
            padding: 10px 14px;
            font-size: 14px;
            font-weight: 800;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .totals-table tr.sinal-row td {
            background-color: #fff0f4 !important;
            color: #e8547a !important;
            font-weight: 800;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .payment-box {
            background-color: #fdfafd !important;
            border: 1px solid #f5c2d1 !important;
            border-radius: 8px;
            padding: 12px 14px;
            margin-bottom: 14px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .payment-box strong {
            color: #e8547a;
          }
          .terms-box {
            background-color: #fdfdfd !important;
            border: 1px solid #eee !important;
            border-radius: 6px;
            padding: 10px 14px;
            font-size: 10px;
            color: #6b5e65;
            margin-bottom: 24px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .terms-box h5 {
            margin: 0 0 6px 0;
            color: #2a2228;
            text-transform: uppercase;
            font-size: 10px;
          }
          .terms-box ul {
            margin: 0;
            padding-left: 18px;
          }
          .terms-box li {
            margin-bottom: 3px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 25px;
            padding-top: 15px;
          }
          .sig-line {
            width: 45%;
            border-top: 1px solid #718096;
            text-align: center;
            padding-top: 6px;
            font-size: 11px;
            color: #4a5568;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
            .print-actions-bar { display: none !important; }
          }
        </style>
      </head>
      <body>
        
        <!-- Barra de Ações (Apenas na Tela, some no PDF/Impressão) -->
        <div class="print-actions-bar no-print">
          <div>
            <strong style="color: #e8547a; font-size: 14px;">🖨️ Pré-visualização do Orçamento</strong>
            <div class="print-tip">Pronto para imprimir ou salvar como PDF no seu computador.</div>
          </div>
          <button type="button" class="btn-print-action" onclick="window.print()">
            Imprimir / Salvar PDF
          </button>
        </div>

        <div class="header">
          <div style="display: flex; align-items: center; gap: 14px;">
            <img src="src/assets/logo4.png" alt="Mabie Festas" class="brand-logo-pdf" onerror="this.src='src/assets/logo.png'">
            <div>
              <h1 class="brand-title">${config.empresa.nome}</h1>
              <p class="brand-subtitle">${config.empresa.slogan} • ${config.empresa.cidade}</p>
              <p class="brand-subtitle">WhatsApp: ${config.empresa.telefone} • Instagram: ${config.empresa.instagram}</p>
            </div>
          </div>
          <div class="doc-badge">
            <div class="num">ORÇAMENTO #${orcamento.id.slice(-6).toUpperCase()}</div>
            <div class="date">Emitido em: ${this.formatDate(orcamento.dataCriacao || new Date().toISOString().split('T')[0])}</div>
            <div class="date" style="margin-top: 4px;"><strong style="color: #10B981;">Validade: 7 dias</strong></div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <h4>Dados do Cliente</h4>
            <p><strong>Nome:</strong> ${orcamento.cliente.nome || 'Não informado'}</p>
            <p><strong>WhatsApp / Telefone:</strong> ${orcamento.cliente.telefone || 'Não informado'}</p>
            <p><strong>E-mail:</strong> ${orcamento.cliente.email || '-'}</p>
            <p><strong>Local / Entrega:</strong> ${orcamento.cliente.endereco || 'Retirada no local'}</p>
          </div>
          <div class="info-card">
            <h4>Cronograma da Locação</h4>
            <p><strong>Data do Evento:</strong> <span style="font-weight: bold; color: #e8547a;">${this.formatDate(orcamento.dataEvento)}</span></p>
            <p><strong>Data de Retirada / Entrega:</strong> ${this.formatDate(orcamento.dataRetirada)}</p>
            <p><strong>Data de Devolução:</strong> <span style="font-weight: bold; color: #d4456b;">${this.formatDate(orcamento.dataDevolucao)}</span></p>
            <p><strong>Observações:</strong> ${orcamento.observacoes || 'Nenhuma observação informada.'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">#</th>
              <th>Artigo / Descrição</th>
              <th style="width: 80px; text-align: center;">Qtd</th>
              <th style="width: 95px; text-align: right;">Unitário</th>
              <th style="width: 105px; text-align: right;">Subtotal</th>
              <th style="width: 95px; text-align: right;">Reposição*</th>
            </tr>
          </thead>
          <tbody>
            ${itensRows}
          </tbody>
        </table>

        <div class="totals-container">
          <table class="totals-table">
            <tr>
              <td>Subtotal dos Itens:</td>
              <td style="text-align: right; font-weight: bold; color: #2a2228;">${this.formatMoney(totalItens)}</td>
            </tr>
            <tr>
              <td>Taxa de Frete / Logística:</td>
              <td style="text-align: right; color: #2a2228;">${this.formatMoney(taxaFrete)}</td>
            </tr>
            ${desconto > 0 ? `
              <tr>
                <td style="color: #10B981;">Desconto Aplicado:</td>
                <td style="text-align: right; color: #10B981; font-weight: bold;">-${this.formatMoney(desconto)}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td>VALOR TOTAL:</td>
              <td style="text-align: right;">${this.formatMoney(totalGeral)}</td>
            </tr>
            <tr class="sinal-row">
              <td>Sinal para Reserva (${percentualSinal}%):</td>
              <td style="text-align: right;">${this.formatMoney(valorSinal)}</td>
            </tr>
            <tr>
              <td>Saldo Restante na Entrega:</td>
              <td style="text-align: right; font-weight: bold; color: #2a2228;">${this.formatMoney(saldoRestante)}</td>
            </tr>
          </table>
        </div>

        <div class="payment-box">
          <p style="margin: 0 0 4px 0;"><strong>💳 Dados para Pagamento e Confirmação de Reserva:</strong></p>
          <p style="margin: 0; font-size: 11px;">Chave PIX: <strong style="color: #2a2228; background: #fff; padding: 3px 8px; border: 1px dashed #e8547a; border-radius: 4px;">${config.empresa.chavePix}</strong> (${config.empresa.nome})</p>
          <p style="margin: 4px 0 0 0; font-size: 10px; color: #6b5e65;">Envie o comprovante para o WhatsApp ${config.empresa.telefone} para validação imediata.</p>
        </div>

        <div class="terms-box">
          <h5>Condições Gerais e Termo de Locação:</h5>
          <ul>
            ${regrasHtml}
            <li>* <em>Valor de Reposição unitário para efeito de conferência e cobrança em caso de extravio ou avaria irremediável.</em></li>
          </ul>
        </div>

        <div class="signatures">
          <div class="sig-line">
            <strong>${config.empresa.nome}</strong><br>
            Locadora
          </div>
          <div class="sig-line">
            <strong>${orcamento.cliente.nome || 'Cliente / Contratante'}</strong><br>
            Locatário(a)
          </div>
        </div>
      </body>
      </html>
    `;
  },

  gerarMensagemWhatsApp(orcamento, config) {
    const totalItens = orcamento.itens.reduce((acc, item) => acc + (item.quantidade * item.diaria), 0);
    const taxaFrete = Number(orcamento.frete || 0);
    const desconto = Number(orcamento.desconto || 0);
    const totalGeral = Math.max(0, totalItens + taxaFrete - desconto);
    const percentualSinal = Number(orcamento.percentualSinal || config.empresa.percentualSinalPadrao || 50);
    const valorSinal = (totalGeral * (percentualSinal / 100));

    let msg = `✨ *ORÇAMENTO DE LOCAÇÃO - ${config.empresa.nome.toUpperCase()}* ✨\n\n`;
    msg += `👤 *Cliente:* ${orcamento.cliente.nome}\n`;
    msg += `📅 *Data do Evento:* ${this.formatDate(orcamento.dataEvento)}\n`;
    msg += `🚚 *Retirada/Entrega:* ${this.formatDate(orcamento.dataRetirada)}\n`;
    msg += `🔄 *Devolução:* ${this.formatDate(orcamento.dataDevolucao)}\n\n`;
    
    msg += `📦 *ITENS SELECIONADOS:*\n`;
    orcamento.itens.forEach(item => {
      const sub = item.quantidade * item.diaria;
      msg += `• ${item.quantidade}x ${item.nome} (${this.formatMoney(sub)})\n`;
    });

    msg += `\n💰 *RESUMO DOS VALORES:*\n`;
    msg += `• Subtotal Itens: ${this.formatMoney(totalItens)}\n`;
    if (taxaFrete > 0) msg += `• Frete / Entrega: ${this.formatMoney(taxaFrete)}\n`;
    if (desconto > 0) msg += `• Desconto: -${this.formatMoney(desconto)}\n`;
    msg += `👉 *VALOR TOTAL:* *${this.formatMoney(totalGeral)}*\n\n`;
    
    msg += `🔒 *Para confirmação de reserva (${percentualSinal}%):* *${this.formatMoney(valorSinal)}*\n`;
    msg += `🔑 *Chave PIX:* ${config.empresa.chavePix}\n\n`;
    msg += `_Orçamento válido por 7 dias. Havendo dúvidas estamos à disposição!_`;

    return msg;
  },

  imprimirOuSalvar(orcamento, config) {
    const htmlContent = this.gerarHTMLDocumento(orcamento, config);
    const printWindow = window.open('', '_blank', 'width=950,height=850');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }
};

window.PDFGenerator = PDFGenerator;
