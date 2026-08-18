/**
 * pedidos.js - Gestão do Ciclo de Vida dos Pedidos & Controle de Devoluções
 */

const PedidosModule = {
  filtroStatus: 'todos',
  termoBusca: '',
  pedidoSelecionadoId: null,

  init() {
    this.carregarPedidosExemploSeVazio();
    this.renderizarPedidos();
    this.bindEvents();
  },

  carregarPedidosExemploSeVazio() {
    const pedidos = StorageService.getPedidos();
    if (pedidos.length === 0) {
      const hoje = new Date();
      const format = (d) => d.toISOString().split('T')[0];

      const amanha = new Date(hoje);
      amanha.setDate(hoje.getDate() + 1);

      const em3Dias = new Date(hoje);
      em3Dias.setDate(hoje.getDate() + 3);

      const pedidosIniciais = [
        {
          id: 'ORC-984210',
          dataCriacao: format(hoje),
          cliente: {
            nome: 'Camila Guimarães - Casamento',
            telefone: '(11) 98765-4321',
            email: 'camila.eventos@email.com',
            endereco: 'Espaço Villa Bisutti - Rua Casa do Ator, 645 - SP'
          },
          dataEvento: format(amanha),
          dataRetirada: format(hoje),
          dataDevolucao: format(em3Dias),
          observacoes: 'Montagem do buffet às 14h. Conferência rigorosa de taças de champanhe.',
          frete: 80.00,
          desconto: 0,
          percentualSinal: 50,
          status: 'Confirmado',
          itens: [
            {
              id: 'prod-001',
              codigo: 'REC-01',
              nome: 'Réchaud Retangular Inox 2 Cubas 9L',
              quantidade: 4,
              diaria: 45.00,
              reposicao: 380.00
            },
            {
              id: 'prod-004',
              codigo: 'TAC-02',
              nome: 'Taça Flûte Champanhe / Espumante 210ml',
              quantidade: 120,
              diaria: 2.80,
              reposicao: 16.00
            },
            {
              id: 'prod-008',
              codigo: 'TAL-01',
              nome: 'Kit Talher Dourado Luxo (Garfo + Faca Principal)',
              quantidade: 120,
              diaria: 3.50,
              reposicao: 25.00
            }
          ]
        },
        {
          id: 'ORC-983105',
          dataCriacao: format(hoje),
          cliente: {
            nome: 'Buffet Estrela Dourada (Ricardo)',
            telefone: '(11) 97123-8899',
            email: 'ricardo@buffetestrela.com.br',
            endereco: 'Salão Social Jardins'
          },
          dataEvento: format(hoje),
          dataRetirada: format(hoje),
          dataDevolucao: format(amanha),
          observacoes: 'Cliente VIP recorrente.',
          frete: 50.00,
          desconto: 30.00,
          percentualSinal: 50,
          status: 'Alugado',
          itens: [
            {
              id: 'prod-002',
              codigo: 'REC-02',
              nome: 'Réchaud Redondo Inox 6L para Molhos/Sopas',
              quantidade: 2,
              diaria: 35.00,
              reposicao: 280.00
            },
            {
              id: 'prod-011',
              codigo: 'SUQ-01',
              nome: 'Suqueira Dispenser de Vidro Bico Inox 4,5L',
              quantidade: 3,
              diaria: 32.00,
              reposicao: 160.00
            }
          ]
        }
      ];

      StorageService.savePedidos(pedidosIniciais);
      StorageService.recalcularEstoqueAlugado();
    }
  },

  bindEvents() {
    const inputBusca = document.getElementById('pedidos-busca');
    if (inputBusca) {
      inputBusca.addEventListener('input', (e) => {
        this.termoBusca = e.target.value.toLowerCase().trim();
        this.renderizarPedidos();
      });
    }

    const selectStatus = document.getElementById('pedidos-filtro-status');
    if (selectStatus) {
      selectStatus.addEventListener('change', (e) => {
        this.filtroStatus = e.target.value;
        this.renderizarPedidos();
      });
    }
  },

  renderizarPedidos() {
    const container = document.getElementById('pedidos-lista');
    if (!container) return;

    const pedidos = StorageService.getPedidos();
    const hojeStr = new Date().toISOString().split('T')[0];

    // Estatísticas de pedidos
    const totalPendentes = pedidos.filter(p => p.status === 'Pendente').length;
    const totalConfirmados = pedidos.filter(p => p.status === 'Confirmado').length;
    const totalAlugados = pedidos.filter(p => p.status === 'Alugado').length;
    const totalDevolvidos = pedidos.filter(p => p.status === 'Devolvido').length;

    // Alertas de devolução (Devolve hoje ou está atrasado)
    const alertasDevolucao = pedidos.filter(p => {
      if (p.status !== 'Alugado') return false;
      return p.dataDevolucao <= hojeStr;
    });

    const elStatAlugados = document.getElementById('stat-pedidos-alugados');
    const elStatDevolucoes = document.getElementById('stat-pedidos-devolucoes-hoje');
    const elStatConfirmados = document.getElementById('stat-pedidos-confirmados');

    if (elStatAlugados) elStatAlugados.textContent = totalAlugados;
    if (elStatDevolucoes) {
      elStatDevolucoes.textContent = alertasDevolucao.length;
      elStatDevolucoes.parentElement?.classList.toggle('alert-pulse', alertasDevolucao.length > 0);
    }
    if (elStatConfirmados) elStatConfirmados.textContent = totalConfirmados;

    const filtrados = pedidos.filter(p => {
      const matchStatus = this.filtroStatus === 'todos' || p.status === this.filtroStatus;
      const matchBusca = !this.termoBusca || 
                         p.id.toLowerCase().includes(this.termoBusca) || 
                         p.cliente.nome.toLowerCase().includes(this.termoBusca) ||
                         (p.cliente.telefone && p.cliente.telefone.includes(this.termoBusca));
      return matchStatus && matchBusca;
    });

    if (filtrados.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>Nenhum pedido encontrado com estes filtros.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtrados.map(ped => {
      const subtotalItens = ped.itens.reduce((acc, i) => acc + (i.quantidade * i.diaria), 0);
      const totalGeral = Math.max(0, subtotalItens + (Number(ped.frete) || 0) - (Number(ped.desconto) || 0));
      const isAtrasado = ped.status === 'Alugado' && ped.dataDevolucao < hojeStr;
      const isDevolucaoHoje = ped.status === 'Alugado' && ped.dataDevolucao === hojeStr;

      let statusBadgeClass = 'badge-pendente';
      if (ped.status === 'Confirmado') statusBadgeClass = 'badge-confirmado';
      if (ped.status === 'Alugado') statusBadgeClass = 'badge-alugado';
      if (ped.status === 'Devolvido') statusBadgeClass = 'badge-devolvido';
      if (ped.status === 'Cancelado') statusBadgeClass = 'badge-cancelado';

      return `
        <div class="pedido-card ${isAtrasado ? 'card-alerta-atraso' : (isDevolucaoHoje ? 'card-alerta-hoje' : '')}">
          <div class="pedido-card-header">
            <div class="pedido-id-box">
              <span class="pedido-id">#${ped.numero ? ped.numero.replace("#", "") : (ped.id.length > 8 ? "ORC-" + ped.id.slice(0,5).toUpperCase() : ped.id)}</span>
              <span class="status-tag ${statusBadgeClass}">${ped.status}</span>
              ${isAtrasado ? `<span class="badge-aviso-urgente">⚠️ Devolução Atrasada!</span>` : ''}
              ${isDevolucaoHoje ? `<span class="badge-aviso-hoje">🔔 Devolução Hoje</span>` : ''}
            </div>
            <div class="pedido-valor-destaque">
              <span class="label-val">Valor Total</span>
              <span class="val-num">${PDFGenerator.formatMoney(totalGeral)}</span>
            </div>
          </div>

          <div class="pedido-card-body">
            <div class="pedido-cliente-info">
              <h4 class="cliente-nome">👤 ${ped.cliente.nome}</h4>
              <p class="cliente-detalhe">📞 ${ped.cliente.telefone || 'Sem telefone'} • 📍 ${ped.cliente.endereco || 'Retirada local'}</p>
            </div>

            <div class="pedido-cronograma">
              <div class="crono-item">
                <span class="crono-label">Data do Evento</span>
                <span class="crono-val">🎉 ${PDFGenerator.formatDate(ped.dataEvento)}</span>
              </div>
              <div class="crono-item">
                <span class="crono-label">Retirada / Entrega</span>
                <span class="crono-val">🚚 ${PDFGenerator.formatDate(ped.dataRetirada)}</span>
              </div>
              <div class="crono-item ${isAtrasado ? 'text-danger fw-bold' : ''}">
                <span class="crono-label">Devolução Prevista</span>
                <span class="crono-val">🔄 ${PDFGenerator.formatDate(ped.dataDevolucao)}</span>
              </div>
            </div>

            <div class="pedido-itens-preview">
              <span class="itens-title">Artigos Locados (${ped.itens.length} tipo(s)):</span>
              <div class="itens-tags">
                ${ped.itens.map(i => `<span class="item-mini-tag">${i.quantidade}x ${i.nome}</span>`).join('')}
              </div>
            </div>
          </div>

          <div class="pedido-card-footer">
            <div class="status-change-dropdown">
              <label class="small text-muted d-block">Alterar Status:</label>
              <select class="select-status-inline" onchange="PedidosModule.alterarStatusPedido('${ped.id}', this.value)">
                <option value="Pendente" ${ped.status === 'Pendente' ? 'selected' : ''}>Pendente (Orçamento)</option>
                <option value="Confirmado" ${ped.status === 'Confirmado' ? 'selected' : ''}>Confirmado (Reserva)</option>
                <option value="Alugado" ${ped.status === 'Alugado' ? 'selected' : ''}>Alugado (Em Evento)</option>
                <option value="Devolvido" ${ped.status === 'Devolvido' ? 'selected' : ''}>Devolvido (Concluído)</option>
                <option value="Cancelado" ${ped.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
              </select>
            </div>

            <div class="pedido-actions-btns">
              <button type="button" class="btn-sec" style="color: var(--rosa); font-weight: 700; border-color: var(--rosa-borda);" title="Editar itens e dados deste pedido" onclick="PedidosModule.editarPedido('${ped.id}')">
                ✏️ Editar
              </button>
              <button type="button" class="btn-sec" onclick="PedidosModule.reimprimirPDF('${ped.id}')">
                🖨️ PDF
              </button>
              <button type="button" class="btn-sec" onclick="PedidosModule.copiarWhatsAppPedido('${ped.id}')">
                💬 WhatsApp
              </button>
              <button type="button" class="btn-action-icon text-danger" title="Excluir Pedido" onclick="PedidosModule.excluirPedido('${ped.id}')">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  editarPedido(id) {
    const pedidos = StorageService.getPedidos();
    const ped = pedidos.find(p => p.id === id);
    if (!ped) return;

    if (window.OrcamentoModule) {
      window.OrcamentoModule.carregarParaEdicao(ped);
    }
  },

  alterarStatusPedido(id, novoStatus) {
    const pedidos = StorageService.getPedidos();
    const ped = pedidos.find(p => p.id === id);
    if (!ped) return;

    const statusAntigo = ped.status;
    ped.status = novoStatus;

    StorageService.savePedidos(pedidos);
    StorageService.recalcularEstoqueAlugado();

    App.showToast(`Pedido #${ped.id} alterado de "${statusAntigo}" para "${novoStatus}"!`, 'success');
    this.renderizarPedidos();
    if (window.EstoqueModule) window.EstoqueModule.renderizarEstoque();
    if (window.OrcamentoModule) window.OrcamentoModule.renderizarCatalogo();
    App.atualizarStatsDashboard();
  },

  reimprimirPDF(id) {
    const pedidos = StorageService.getPedidos();
    const ped = pedidos.find(p => p.id === id);
    if (!ped) return;

    const config = StorageService.getConfig();
    PDFGenerator.imprimirOuSalvar(ped, config);
  },

  copiarWhatsAppPedido(id) {
    const pedidos = StorageService.getPedidos();
    const ped = pedidos.find(p => p.id === id);
    if (!ped) return;

    const config = StorageService.getConfig();
    const msg = PDFGenerator.gerarMensagemWhatsApp(ped, config);

    navigator.clipboard.writeText(msg).then(() => {
      App.showToast('Mensagem do pedido copiada para o WhatsApp!', 'success');
    }).catch(() => {
      prompt('Copie a mensagem abaixo para o WhatsApp:', msg);
    });
  },

  excluirPedido(id) {
    if (confirm(`Deseja realmente excluir o pedido #${id}? Essa ação irá liberar os itens reservados.`)) {
      const pedidos = StorageService.getPedidos().filter(p => p.id !== id);
      StorageService.savePedidos(pedidos);
      StorageService.recalcularEstoqueAlugado();
      
      App.showToast(`Pedido #${id} excluído com sucesso.`, 'info');
      this.renderizarPedidos();
      if (window.EstoqueModule) window.EstoqueModule.renderizarEstoque();
      if (window.OrcamentoModule) window.OrcamentoModule.renderizarCatalogo();
      App.atualizarStatsDashboard();
    }
  }
};

window.PedidosModule = PedidosModule;
