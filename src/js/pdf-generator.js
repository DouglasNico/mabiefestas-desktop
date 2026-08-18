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

  imprimirContrato(pedido, config) {
    const htmlContent = this.gerarHTMLContrato(pedido, config);
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
  },

  gerarHTMLContrato(pedido, config) {
    const totalItens = pedido.itens.reduce((acc, item) => acc + (item.quantidade * item.diaria), 0);
    const taxaFrete = Number(pedido.frete || 0);
    const desconto = Number(pedido.desconto || 0);
    const totalGeral = Math.max(0, totalItens + taxaFrete - desconto);
    const percentualSinal = Number(pedido.percentualSinal || config.empresa.percentualSinalPadrao || 50);
    const valorSinal = (totalGeral * (percentualSinal / 100));
    const saldoRestante = totalGeral - valorSinal;

    const itensRows = pedido.itens.map((item, index) => {
      const subtotal = item.quantidade * item.diaria;
      const valorRep = item.reposicao || 0;
      return `
        <tr>
          <td style="text-align: center; color: #555; font-size: 10px;">${index + 1}</td>
          <td style="text-align: center; font-family: monospace; font-size: 10px; font-weight: 600; color: #666;">${item.codigo || '-'}</td>
          <td>
            <strong style="color: #1a1518; font-size: 11px;">${item.nome}</strong>
          </td>
          <td style="text-align: center; font-weight: bold; color: #1a1518;">${item.quantidade} un</td>
          <td style="text-align: right; color: #444;">${this.formatMoney(item.diaria)}</td>
          <td style="text-align: right; font-weight: bold; color: #1a1518;">${this.formatMoney(subtotal)}</td>
          <td style="text-align: right; color: #b83256; font-weight: bold; font-size: 11px;">${this.formatMoney(valorRep)}</td>
        </tr>
      `;
    }).join('');

    const baseHref = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const numContrato = pedido.numero ? pedido.numero.replace('#', '') : (pedido.id.length > 8 ? pedido.id.slice(0, 6).toUpperCase() : pedido.id);
    const cidadeEmpresa = config.empresa.cidade || 'Campinas - SP';

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <base href="${baseHref}">
        <title>Contrato de Locação #${numContrato} - ${config.empresa.nome}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          @page {
            size: A4;
            margin: 10mm 12mm;
          }
          body {
            font-family: 'Lora', Georgia, 'Times New Roman', serif;
            color: #222;
            background: #fff;
            margin: 0;
            padding: 16px;
            font-size: 10.5px;
            line-height: 1.45;
          }
          
          .print-actions-bar {
            font-family: 'Poppins', sans-serif;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 10px 16px;
            border-radius: 6px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .btn-print-action {
            background: #2a2228;
            color: #fff;
            border: none;
            padding: 8px 22px;
            border-radius: 5px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
            font-family: 'Poppins', sans-serif;
          }
          .btn-print-action:hover {
            background: #e8547a;
          }

          .contract-header {
            text-align: center;
            border-bottom: 2px solid #2a2228;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .contract-title {
            font-family: 'Cinzel', serif;
            font-size: 15px;
            font-weight: 700;
            color: #1a1518;
            letter-spacing: 0.5px;
            margin: 0 0 4px 0;
            text-transform: uppercase;
          }
          .contract-subtitle {
            font-family: 'Poppins', sans-serif;
            font-size: 10px;
            color: #555;
            margin: 0;
          }

          .preamble-box {
            background: #fdfdfd;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 10px 14px;
            margin-bottom: 12px;
            text-align: justify;
          }
          .preamble-box p {
            margin: 0 0 6px 0;
          }
          .preamble-box p:last-child {
            margin-bottom: 0;
          }

          .clausula-title {
            font-family: 'Poppins', sans-serif;
            font-size: 10.5px;
            font-weight: 700;
            color: #1a1518;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin: 10px 0 4px 0;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 2px;
          }

          p.clausula-text {
            text-align: justify;
            margin: 0 0 6px 0;
          }

          table.contract-table {
            width: 100%;
            border-collapse: collapse;
            margin: 6px 0 10px 0;
            font-family: 'Poppins', sans-serif;
            font-size: 9.5px;
          }
          table.contract-table th {
            background-color: #2a2228 !important;
            color: #ffffff !important;
            padding: 6px 8px;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.4px;
            border: 1px solid #2a2228 !important;
          }
          table.contract-table td {
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
          }
          table.contract-table tr:nth-child(even) td {
            background-color: #fbfbfb !important;
          }

          .finance-grid {
            display: grid;
            grid-template-columns: 1fr 280px;
            gap: 12px;
            margin-bottom: 10px;
            font-family: 'Poppins', sans-serif;
          }
          .payment-terms {
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 9.5px;
          }
          .finance-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #2a2228;
            font-size: 9.5px;
          }
          .finance-table td {
            padding: 4px 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          .finance-table tr.total-row td {
            background-color: #2a2228 !important;
            color: #fff !important;
            font-weight: 700;
            font-size: 11px;
          }

          .vistoria-box {
            border: 1px solid #2a2228 !important;
            background-color: #faf9f9 !important;
            border-radius: 4px;
            padding: 8px 12px;
            margin: 10px 0;
            font-family: 'Poppins', sans-serif;
            font-size: 9px;
          }
          .vistoria-title {
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 6px;
            color: #1a1518;
            border-bottom: 1px dashed #ccc;
            padding-bottom: 3px;
          }
          .vistoria-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }
          .vistoria-col {
            line-height: 1.5;
          }

          .signatures-block {
            margin-top: 18px;
            font-family: 'Poppins', sans-serif;
            page-break-inside: avoid;
          }
          .city-date {
            text-align: right;
            font-style: italic;
            margin-bottom: 22px;
            font-size: 10px;
          }
          .sig-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 18px;
          }
          .sig-box {
            width: 46%;
            border-top: 1px solid #333;
            text-align: center;
            padding-top: 4px;
            font-size: 9.5px;
          }

          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
            .print-actions-bar { display: none !important; }
          }
        </style>
      </head>
      <body>

        <!-- Barra de Ações (Oculta na Impressão) -->
        <div class="print-actions-bar no-print">
          <div>
            <strong style="color: #2a2228; font-size: 13px;">⚖️ Instrumento Particular de Contrato de Locação & Termo de Vistoria</strong>
            <div style="font-size: 11px; color: #666;">Documento jurídico formal com tabela de reposição, regras de entrega e assinaturas.</div>
          </div>
          <button type="button" class="btn-print-action" onclick="window.print()">
            🖨️ Imprimir / Salvar PDF
          </button>
        </div>

        <!-- Cabeçalho Formal do Contrato -->
        <div class="contract-header">
          <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 6px;">
            <img src="src/assets/logo4.png" alt="Mabie Festas" style="height: 38px; object-fit: contain;" onerror="this.src='src/assets/logo.png'">
            <div style="text-align: left;">
              <strong style="font-family: 'Cinzel', serif; font-size: 16px; color: #1a1518; letter-spacing: 0.5px;">${config.empresa.nome}</strong>
              <div style="font-family: 'Poppins', sans-serif; font-size: 9.5px; color: #666;">${config.empresa.slogan} • Tel/WhatsApp: ${config.empresa.telefone} • ${cidadeEmpresa}</div>
            </div>
          </div>
          <h1 class="contract-title">INSTRUMENTO PARTICULAR DE CONTRATO DE LOCAÇÃO DE BENS MÓVEIS</h1>
          <p class="contract-subtitle"><strong>REGISTRO Nº CON-${numContrato}</strong> • Data de Emissão: ${this.formatDate(pedido.dataCriacao || new Date().toISOString().split('T')[0])}</p>
        </div>

        <!-- Preâmbulo das Partes -->
        <div class="preamble-box">
          <p><strong>LOCADORA:</strong> <strong>${config.empresa.nome}</strong>, com sede e galpão na cidade de ${cidadeEmpresa}, WhatsApp/Telefone de atendimento: ${config.empresa.telefone}, e-mail / Instagram: ${config.empresa.instagram}.</p>
          <p><strong>LOCATÁRIO(A):</strong> <strong>${pedido.cliente.nome || 'Não informado'}</strong>, Telefone/WhatsApp: <strong>${pedido.cliente.telefone || '-'}</strong>, E-mail: ${pedido.cliente.email || '-'}, com endereço para entrega / realização do evento situado em: <strong>${pedido.cliente.endereco || 'Retirada e devolução no Galpão da Locadora'}</strong>.</p>
          <p style="font-style: italic; color: #444; font-size: 9.5px;">As partes acima qualificadas têm, entre si, justo e acordado o presente Contrato de Locação de Bens Móveis para Festas e Eventos, regido pelas cláusulas e condições seguintes:</p>
        </div>

        <!-- Cláusula 1 -->
        <div class="clausula-title">CLÁUSULA PRIMEIRA – DO OBJETO DA LOCAÇÃO E TABELA DE REPOSIÇÃO</div>
        <p class="clausula-text">Constitui objeto do presente instrumento a locação temporária dos artigos, utensílios e materiais para eventos descritos e discriminados na tabela abaixo, de propriedade exclusiva da <strong>LOCADORA</strong>, com os respectivos valores unitários de reposição em caso de avaria, perda ou extravio:</p>

        <table class="contract-table">
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">#</th>
              <th style="width: 65px; text-align: center;">Código</th>
              <th>Artigo / Descrição do Item</th>
              <th style="width: 60px; text-align: center;">Qtd</th>
              <th style="width: 80px; text-align: right;">Diária Un.</th>
              <th style="width: 85px; text-align: right;">Subtotal</th>
              <th style="width: 105px; text-align: right; background-color: #b83256 !important; border-color: #b83256 !important;">Reposição Un.*</th>
            </tr>
          </thead>
          <tbody>
            ${itensRows}
          </tbody>
        </table>

        <!-- Cláusula 2 -->
        <div class="clausula-title">CLÁUSULA SEGUNDA – DOS VALORES, SINAL E FORMA DE PAGAMENTO</div>
        <p class="clausula-text">Pela locação dos bens descritos na Cláusula Primeira, o(a) <strong>LOCATÁRIO(A)</strong> pagará à <strong>LOCADORA</strong> a importância líquida total discriminada abaixo:</p>

        <div class="finance-grid">
          <div class="payment-terms">
            <p style="margin: 0 0 4px 0;"><strong>💳 Condições de Pagamento:</strong></p>
            <p style="margin: 0 0 2px 0;">• <strong>Sinal de Reserva (${percentualSinal}%):</strong> ${this.formatMoney(valorSinal)} (Garante o bloqueio das peças na data do evento).</p>
            <p style="margin: 0 0 4px 0;">• <strong>Saldo Restante:</strong> ${this.formatMoney(saldoRestante)} (A ser quitado impreterivelmente no ato da entrega/retirada).</p>
            <p style="margin: 0; font-size: 9px; color: #555;">Chave PIX: <strong style="color: #1a1518; background: #eee; padding: 1px 4px; border-radius: 3px;">${config.empresa.chavePix}</strong> (${config.empresa.nome})</p>
          </div>

          <table class="finance-table">
            <tr>
              <td>Subtotal dos Itens:</td>
              <td style="text-align: right; font-weight: 600;">${this.formatMoney(totalItens)}</td>
            </tr>
            <tr>
              <td>Taxa de Frete / Logística:</td>
              <td style="text-align: right;">${this.formatMoney(taxaFrete)}</td>
            </tr>
            ${desconto > 0 ? `
              <tr>
                <td style="color: #27ae60;">Desconto Concedido:</td>
                <td style="text-align: right; color: #27ae60; font-weight: 600;">-${this.formatMoney(desconto)}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td>VALOR TOTAL:</td>
              <td style="text-align: right;">${this.formatMoney(totalGeral)}</td>
            </tr>
          </table>
        </div>

        <!-- Cláusula 3 -->
        <div class="clausula-title">CLÁUSULA TERCEIRA – DO CRONOGRAMA, PRAZOS E MULTA POR ATRASO</div>
        <p class="clausula-text">
          <strong>a) Data do Evento:</strong> ${this.formatDate(pedido.dataEvento)} &nbsp;|&nbsp; 
          <strong>b) Retirada / Entrega:</strong> ${this.formatDate(pedido.dataRetirada)} &nbsp;|&nbsp; 
          <strong>c) Devolução Impreterível:</strong> <strong>${this.formatDate(pedido.dataDevolucao)}</strong>.<br>
          <em>Parágrafo Único:</em> O atraso na devolução dos artigos sem autorização prévia por escrito da LOCADORA sujeitará o LOCATÁRIO ao pagamento de multa diária correspondente ao valor integral de <strong>1 (uma) nova diária por dia de atraso</strong>, além de responder por eventuais prejuízos causados a reservas subsequentes.
        </p>

        <!-- Cláusula 4 -->
        <div class="clausula-title">CLÁUSULA QUARTA – DAS AVARIAS, QUEBRAS, PERDAS E RESSARCIMENTO</div>
        <p class="clausula-text">
          O(A) <strong>LOCATÁRIO(A)</strong> assume integral responsabilidade pela guarda e integridade física de todos os itens desde o recebimento até a devolução.<br>
          <em>Parágrafo 1º:</em> Em caso de quebra, trinca, queima, mancha irreversível, amassamento ou extravio/perda de qualquer item, o(a) LOCATÁRIO(A) indenizará a LOCADORA de imediato, no momento da conferência de retorno, pelo respectivo <strong>Valor de Reposição Unitário</strong> especificado na tabela da Cláusula Primeira.<br>
          <em>Parágrafo 2º:</em> É expressamente proibido o uso de produtos abrasivos (palha de aço, ácidos) na limpeza das peças em inox, prata, dourado ou cristais. Os artigos devem ser devolvidos sem resíduos orgânicos e acondicionados nas embalagens e engradados originais.
        </p>

        <!-- Cláusula 5 -->
        <div class="clausula-title">CLÁUSULA QUINTA – DO FORO</div>
        <p class="clausula-text">Para dirimir quaisquer controvérsias oriundas da execução deste contrato, as partes elegem o foro da Comarca de ${cidadeEmpresa}, renunciando a qualquer outro por mais privilegiado que seja.</p>

        <!-- Termo de Vistoria e Conferência -->
        <div class="vistoria-box">
          <div class="vistoria-title">📋 FICHA DE VISTORIA E TERMO DE CONFERÊNCIA DE ENTRADA / SAÍDA</div>
          <div class="vistoria-grid">
            <div class="vistoria-col">
              <strong>📦 VISTORIA DE SAÍDA / ENTREGA:</strong><br>
              [ &nbsp; ] Itens conferidos, contados e em perfeitas condições.<br>
              [ &nbsp; ] Embalagens, caixas e engradados entregues completos.<br>
              Data Saída: ____/____/________ • Conferente: _____________________
            </div>
            <div class="vistoria-col" style="border-left: 1px solid #ddd; padding-left: 12px;">
              <strong>🔄 VISTORIA DE RETORNO / DEVOLUÇÃO:</strong><br>
              [ &nbsp; ] Itens 100% conferidos e recebidos sem avarias.<br>
              [ &nbsp; ] Ocorrências / Quebras registradas: ____________________<br>
              Data Retorno: ____/____/________ • Conferente: ___________________
            </div>
          </div>
        </div>

        <!-- Bloco de Assinaturas e Testemunhas -->
        <div class="signatures-block">
          <div class="city-date">
            ${cidadeEmpresa}, ______ de ________________________ de 2026.
          </div>

          <div class="sig-row">
            <div class="sig-box">
              <strong>${config.empresa.nome}</strong><br>
              <span style="color: #666; font-size: 8.5px;">LOCADORA</span>
            </div>
            <div class="sig-box">
              <strong>${pedido.cliente.nome || 'LOCATÁRIO(A)'}</strong><br>
              <span style="color: #666; font-size: 8.5px;">LOCATÁRIO(A) / CONTRATANTE</span>
            </div>
          </div>

          <div class="sig-row" style="margin-bottom: 0;">
            <div class="sig-box" style="border-top-style: dashed; width: 44%;">
              <span style="color: #666; font-size: 8.5px;">Testemunha 1: ____________________________<br>CPF: ___________________________________</span>
            </div>
            <div class="sig-box" style="border-top-style: dashed; width: 44%;">
              <span style="color: #666; font-size: 8.5px;">Testemunha 2: ____________________________<br>CPF: ___________________________________</span>
            </div>
          </div>
        </div>

      </body>
      </html>
    `;
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

