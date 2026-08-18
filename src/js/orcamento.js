/**
 * orcamento.js - Montador de Orçamentos (Catálogo Visual + Carrinho Interativo)
 */

const OrcamentoModule = {
  carrinho: [],
  categoriaAtiva: 'todos',
  termoBusca: '',
  pedidoEmEdicaoId: null,

  init() {
    this.carregarDatasPadrao();
    this.renderizarCategorias();
    this.renderizarCatalogo();
    this.renderizarCarrinho();
    this.bindEvents();
  },

  carregarDatasPadrao() {
    const hoje = new Date();
    const dataEvento = new Date();
    dataEvento.setDate(hoje.getDate() + 7); // Daqui a 7 dias

    const dataRetirada = new Date(dataEvento);
    dataRetirada.setDate(dataEvento.getDate() - 1); // 1 dia antes

    const dataDevolucao = new Date(dataEvento);
    dataDevolucao.setDate(dataEvento.getDate() + 2); // 2 dias depois

    const toInputVal = (d) => d.toISOString().split('T')[0];

    const inputEvento = document.getElementById('orc-data-evento');
    const inputRetirada = document.getElementById('orc-data-retirada');
    const inputDevolucao = document.getElementById('orc-data-devolucao');

    if (inputEvento && !inputEvento.value) inputEvento.value = toInputVal(dataEvento);
    if (inputRetirada && !inputRetirada.value) inputRetirada.value = toInputVal(dataRetirada);
    if (inputDevolucao && !inputDevolucao.value) inputDevolucao.value = toInputVal(dataDevolucao);
  },

  bindEvents() {
    const inputBusca = document.getElementById('catalogo-busca');
    if (inputBusca) {
      inputBusca.addEventListener('input', (e) => {
        this.termoBusca = e.target.value.toLowerCase().trim();
        this.renderizarCatalogo();
      });
    }

    const inputFrete = document.getElementById('orc-frete');
    const inputDesconto = document.getElementById('orc-desconto');
    const inputSinal = document.getElementById('orc-sinal-pct');

    [inputFrete, inputDesconto, inputSinal].forEach(el => {
      if (el) {
        el.addEventListener('input', () => this.calcularTotais());
      }
    });
  },

  filtrarCategoria(cat) {
    this.categoriaAtiva = cat;
    document.querySelectorAll('.cat-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === cat);
    });
    this.renderizarCatalogo();
  },

  renderizarCategorias() {
    const container = document.getElementById('catalogo-categorias');
    if (!container) return;

    const categorias = [
      { id: 'todos', nome: '✨ Todos os Artigos' },
      { id: 'rechaud', nome: '🍲 Réchauds' },
      { id: 'toalhas', nome: '✨ Toalhas & Mesa' },
      { id: 'pratos', nome: '🍽️ Pratos & Louças' },
      { id: 'talheres', nome: '🍴 Talheres' },
      { id: 'tacas', nome: '🍷 Copos & Taças' },
      { id: 'buffet', nome: '🍹 Buffet' }
    ];

    container.innerHTML = categorias.map(c => `
      <button type="button" class="cat-pill ${c.id === this.categoriaAtiva ? 'active' : ''}" 
              data-cat="${c.id}" onclick="OrcamentoModule.filtrarCategoria('${c.id}')">
        ${c.nome}
      </button>
    `).join('');
  },

  renderizarCatalogo() {
    const grid = document.getElementById('catalogo-grid');
    if (!grid) return;

    const produtos = StorageService.getProdutos();
    const filtrados = produtos.filter(p => {
      const pCat = (p.categoria || "").toLowerCase().trim();
      const matchCat = this.categoriaAtiva === "todos" || 
                       pCat === this.categoriaAtiva || 
                       (this.categoriaAtiva === "rechaud" && (pCat === "rechauds" || pCat === "rechaud")) ||
                       (this.categoriaAtiva === "tacas" && (pCat === "taca" || pCat === "tacas" || pCat === "taça" || pCat === "taças")) ||
                       (this.categoriaAtiva === "toalhas" && (pCat === "toalha" || pCat === "toalhas")) ||
                       (this.categoriaAtiva === "pratos" && (pCat === "prato" || pCat === "pratos")) ||
                       (this.categoriaAtiva === "talheres" && (pCat === "talher" || pCat === "talheres"));
      const matchBusca = !this.termoBusca || 
                         p.nome.toLowerCase().includes(this.termoBusca) || 
                         (p.codigo && p.codigo.toLowerCase().includes(this.termoBusca)) ||
                         (p.categoriaNome && p.categoriaNome.toLowerCase().includes(this.termoBusca));
      return matchCat && matchBusca;
    });

    if (filtrados.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>Nenhum artigo encontrado para esta busca.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtrados.map(prod => {
      const disponivel = Math.max(0, (prod.estoqueTotal || 0) - (prod.estoqueAlugado || 0));
      const noCarrinho = this.carrinho.find(item => item.id === prod.id);
      const qtdNoCarrinho = noCarrinho ? noCarrinho.quantidade : 0;
      const estoqueBaixo = disponivel <= 5;
      const esgotado = disponivel <= 0;

      return `
        <div class="card-produto ${esgotado ? 'esgotado' : ''}">
          <div class="card-img-wrap">
            <img src="${prod.imagem || 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500'}" alt="${prod.nome}" loading="lazy">
            <span class="badge-cat">${window.NOMES_CAT_EXATO[(prod.categoria || "").toLowerCase().trim()] || "Artigo"}</span>
            ${prod.codigo ? `<span class="badge-code">${prod.codigo}</span>` : ''}
          </div>
          <div class="card-content">
            <h4 class="card-title" title="${prod.nome}">${prod.nome}</h4>
            <div class="card-prices">
              <div class="price-box">
                <span class="price-label">Locação / Diária</span>
                <span class="price-val">${PDFGenerator.formatMoney(prod.diaria)}</span>
              </div>
              <div class="stock-badge ${esgotado ? 'badge-danger' : (estoqueBaixo ? 'badge-warning' : 'badge-success')}">
                ${esgotado ? 'Esgotado' : `${disponivel} disp.`}
              </div>
            </div>
            
            <div class="card-actions">
              ${qtdNoCarrinho > 0 ? `
                <div class="qty-control-inline">
                  <button type="button" class="btn-qty" onclick="OrcamentoModule.alterarQtdCarrinho('${prod.id}', -1)">-</button>
                  <span class="qty-inline-num">${qtdNoCarrinho}</span>
                  <button type="button" class="btn-qty" onclick="OrcamentoModule.alterarQtdCarrinho('${prod.id}', 1)" ${qtdNoCarrinho >= disponivel ? 'disabled' : ''}>+</button>
                </div>
              ` : `
                <button type="button" class="btn-add-cart" onclick="OrcamentoModule.adicionarAoCarrinho('${prod.id}')" ${esgotado ? 'disabled' : ''}>
                  <span>🛒 Adicionar ao Orçamento</span>
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  adicionarAoCarrinho(prodId) {
    const produtos = StorageService.getProdutos();
    const prod = produtos.find(p => p.id === prodId);
    if (!prod) return;

    const itemExistente = this.carrinho.find(i => i.id === prodId);
    const disponivel = Math.max(0, (prod.estoqueTotal || 0) - (prod.estoqueAlugado || 0));

    if (itemExistente) {
      if (itemExistente.quantidade < disponivel) {
        itemExistente.quantidade++;
      } else {
        App.showToast('Estoque máximo disponível atingido!', 'warning');
        return;
      }
    } else {
      if (disponivel <= 0) {
        App.showToast('Este artigo está sem estoque disponível no momento.', 'error');
        return;
      }
      this.carrinho.push({
        id: prod.id,
        codigo: prod.codigo,
        nome: prod.nome,
        diaria: prod.diaria,
        reposicao: prod.reposicao,
        quantidade: 1,
        imagem: prod.imagem,
        estoqueDisponivel: disponivel
      });
    }

    App.showToast(`"${prod.nome}" adicionado!`, 'success');
    this.renderizarCatalogo();
    this.renderizarCarrinho();
  },

  alterarQtdCarrinho(prodId, delta) {
    const index = this.carrinho.findIndex(i => i.id === prodId);
    if (index === -1) return;

    const item = this.carrinho[index];
    const novaQtd = item.quantidade + delta;

    if (novaQtd <= 0) {
      this.carrinho.splice(index, 1);
    } else if (novaQtd > item.estoqueDisponivel) {
      App.showToast('Quantidade máxima disponível em estoque atingida!', 'warning');
      return;
    } else {
      item.quantidade = novaQtd;
    }

    this.renderizarCatalogo();
    this.renderizarCarrinho();
  },

  definirQtdDireta(prodId, valor) {
    const index = this.carrinho.findIndex(i => i.id === prodId);
    if (index === -1) return;

    const item = this.carrinho[index];
    const qtd = parseInt(valor, 10);

    if (isNaN(qtd) || qtd <= 0) {
      this.carrinho.splice(index, 1);
    } else if (qtd > item.estoqueDisponivel) {
      item.quantidade = item.estoqueDisponivel;
      App.showToast(`Limitado ao estoque disponível: ${item.estoqueDisponivel} un.`, 'warning');
    } else {
      item.quantidade = qtd;
    }

    this.renderizarCatalogo();
    this.renderizarCarrinho();
  },

  removerDoCarrinho(prodId) {
    this.carrinho = this.carrinho.filter(i => i.id !== prodId);
    this.renderizarCatalogo();
    this.renderizarCarrinho();
    App.showToast('Item removido do orçamento.', 'info');
  },

  limparCarrinho() {
    if (this.carrinho.length === 0) return;
    if (confirm('Deseja realmente limpar todos os itens do orçamento atual?')) {
      this.carrinho = [];
      this.renderizarCatalogo();
      this.renderizarCarrinho();
      App.showToast('Orçamento limpo.', 'info');
    }
  },

  renderizarCarrinho() {
    const listContainer = document.getElementById('carrinho-itens-lista');
    const badgeQtd = document.getElementById('carrinho-total-badge');
    if (!listContainer) return;

    const totalItensQtd = this.carrinho.reduce((acc, i) => acc + i.quantidade, 0);
    if (badgeQtd) badgeQtd.textContent = `${totalItensQtd} ${totalItensQtd === 1 ? 'item' : 'itens'}`;

    if (this.carrinho.length === 0) {
      listContainer.innerHTML = `
        <div class="carrinho-vazio">
          <div class="empty-cart-icon">🛒</div>
          <p class="empty-cart-title">Nenhum item selecionado</p>
          <span class="empty-cart-desc">Clique nos artigos do catálogo ao lado para montar o orçamento.</span>
        </div>
      `;
      this.calcularTotais();
      return;
    }

    listContainer.innerHTML = this.carrinho.map(item => {
      const subtotal = item.quantidade * item.diaria;
      return `
        <div class="item-carrinho-card">
          <div class="item-carrinho-info">
            <h5 class="item-carrinho-nome">${item.nome}</h5>
            <div class="item-carrinho-detalhes">
              <span>${PDFGenerator.formatMoney(item.diaria)}/un</span>
              <span class="item-subtotal-val">= ${PDFGenerator.formatMoney(subtotal)}</span>
            </div>
          </div>
          
          <div class="item-carrinho-actions">
            <div class="qty-picker">
              <button type="button" class="btn-picker-minus" onclick="OrcamentoModule.alterarQtdCarrinho('${item.id}', -1)">-</button>
              <input type="number" class="picker-input" value="${item.quantidade}" min="1" max="${item.estoqueDisponivel}" 
                     onchange="OrcamentoModule.definirQtdDireta('${item.id}', this.value)">
              <button type="button" class="btn-picker-plus" onclick="OrcamentoModule.alterarQtdCarrinho('${item.id}', 1)" ${item.quantidade >= item.estoqueDisponivel ? 'disabled' : ''}>+</button>
            </div>
            <button type="button" class="btn-remove-item" title="Remover item" onclick="OrcamentoModule.removerDoCarrinho('${item.id}')">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.calcularTotais();
  },

  calcularTotais() {
    const subtotalItens = this.carrinho.reduce((acc, i) => acc + (i.quantidade * i.diaria), 0);
    const freteInput = document.getElementById('orc-frete');
    const descontoInput = document.getElementById('orc-desconto');
    const sinalInput = document.getElementById('orc-sinal-pct');

    const frete = parseFloat(freteInput ? freteInput.value : 0) || 0;
    const desconto = parseFloat(descontoInput ? descontoInput.value : 0) || 0;
    const sinalPct = parseFloat(sinalInput ? sinalInput.value : 50) || 50;

    const total = Math.max(0, subtotalItens + frete - desconto);
    const valorSinal = (total * (sinalPct / 100));
    const saldoRestante = total - valorSinal;

    const elSubtotal = document.getElementById('resumo-subtotal');
    const elFrete = document.getElementById('resumo-frete');
    const elDesconto = document.getElementById('resumo-desconto');
    const elTotal = document.getElementById('resumo-total');
    const elSinal = document.getElementById('resumo-sinal');
    const elSaldo = document.getElementById('resumo-saldo');

    if (elSubtotal) elSubtotal.textContent = PDFGenerator.formatMoney(subtotalItens);
    if (elFrete) elFrete.textContent = PDFGenerator.formatMoney(frete);
    if (elDesconto) elDesconto.textContent = `- ${PDFGenerator.formatMoney(desconto)}`;
    if (elTotal) elTotal.textContent = PDFGenerator.formatMoney(total);
    if (elSinal) elSinal.textContent = `${PDFGenerator.formatMoney(valorSinal)} (${sinalPct}%)`;
    if (elSaldo) elSaldo.textContent = PDFGenerator.formatMoney(saldoRestante);
  },

  coletarDadosOrcamento() {
    const clienteNome = document.getElementById('orc-cliente-nome')?.value.trim() || 'Cliente sem nome';
    const clienteTel = document.getElementById('orc-cliente-tel')?.value.trim() || '';
    const clienteEmail = document.getElementById('orc-cliente-email')?.value.trim() || '';
    const clienteEnd = document.getElementById('orc-cliente-endereco')?.value.trim() || '';
    
    const dataEvento = document.getElementById('orc-data-evento')?.value || '';
    const dataRetirada = document.getElementById('orc-data-retirada')?.value || '';
    const dataDevolucao = document.getElementById('orc-data-devolucao')?.value || '';
    const observacoes = document.getElementById('orc-obs')?.value.trim() || '';

    const frete = parseFloat(document.getElementById('orc-frete')?.value) || 0;
    const desconto = parseFloat(document.getElementById('orc-desconto')?.value) || 0;
    const percentualSinal = parseFloat(document.getElementById('orc-sinal-pct')?.value) || 50;

    return {
      id: 'ORC-' + Date.now().toString().slice(-6),
      dataCriacao: new Date().toISOString().split('T')[0],
      cliente: {
        nome: clienteNome,
        telefone: clienteTel,
        email: clienteEmail,
        endereco: clienteEnd
      },
      dataEvento,
      dataRetirada,
      dataDevolucao,
      observacoes,
      frete,
      desconto,
      percentualSinal,
      itens: JSON.parse(JSON.stringify(this.carrinho))
    };
  },

  validarCarrinho() {
    if (this.carrinho.length === 0) {
      App.showToast('Adicione ao menos um artigo ao orçamento!', 'warning');
      return false;
    }
    const nome = document.getElementById('orc-cliente-nome')?.value.trim();
    if (!nome) {
      App.showToast('Por favor, informe o Nome do Cliente!', 'warning');
      document.getElementById('orc-cliente-nome')?.focus();
      return false;
    }
    return true;
  },

  gerarContrato() {
    if (!this.validarCarrinho()) return;
    const orcamento = this.coletarDadosOrcamento();
    const config = StorageService.getConfig();
    PDFGenerator.imprimirContrato(orcamento, config);
    App.showToast('Contrato de Locação gerado com sucesso!', 'success');
  },

  gerarPDF() {
    if (!this.validarCarrinho()) return;
    const orcamento = this.coletarDadosOrcamento();
    const config = StorageService.getConfig();
    PDFGenerator.imprimirOuSalvar(orcamento, config);
    App.showToast('Janela de orçamento em PDF gerada com sucesso!', 'success');
  },

  copiarWhatsApp() {
    if (!this.validarCarrinho()) return;
    const orcamento = this.coletarDadosOrcamento();
    const config = StorageService.getConfig();
    const textoMsg = PDFGenerator.gerarMensagemWhatsApp(orcamento, config);

    navigator.clipboard.writeText(textoMsg).then(() => {
      App.showToast('Mensagem formatada copiada para a área de transferência! Cole no WhatsApp.', 'success');
    }).catch(() => {
      prompt('Copie a mensagem abaixo para enviar no WhatsApp:', textoMsg);
    });
  },

  carregarParaEdicao(pedido) {
    this.pedidoEmEdicaoId = pedido.id;

    // Preencher campos do cliente
    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v !== undefined && v !== null ? v : '';
    };

    setVal('orc-cliente-nome', pedido.cliente?.nome);
    setVal('orc-cliente-tel', pedido.cliente?.telefone);
    setVal('orc-cliente-email', pedido.cliente?.email);
    setVal('orc-cliente-endereco', pedido.cliente?.endereco);

    // Preencher datas
    setVal('orc-data-evento', pedido.dataEvento);
    setVal('orc-data-retirada', pedido.dataRetirada);
    setVal('orc-data-devolucao', pedido.dataDevolucao);

    // Observações e valores
    setVal('orc-obs', pedido.observacoes);
    setVal('orc-frete', pedido.frete || 0);
    setVal('orc-desconto', pedido.desconto || 0);
    setVal('orc-sinal-pct', pedido.percentualSinal || 50);

    // Carregar itens no carrinho
    const produtos = StorageService.getProdutos();
    this.carrinho = (pedido.itens || []).map(item => {
      const prod = produtos.find(p => p.id === item.id);
      const estoqueTotal = prod ? Number(prod.estoqueTotal || 0) : 100;
      const estoqueAlugadoOutros = prod ? Math.max(0, (prod.estoqueAlugado || 0) - (Number(item.quantidade) || 0)) : 0;
      const disponivel = Math.max(0, estoqueTotal - estoqueAlugadoOutros);

      return {
        id: item.id,
        codigo: item.codigo || prod?.codigo || '',
        nome: item.nome,
        diaria: Number(item.diaria),
        reposicao: Number(item.reposicao || prod?.reposicao || 0),
        quantidade: Number(item.quantidade),
        imagem: item.imagem || prod?.imagem || '',
        estoqueDisponivel: disponivel
      };
    });

    // Atualizar UI
    const banner = document.getElementById('banner-edicao-pedido');
    const bannerTexto = document.getElementById('banner-edicao-texto');
    const btnSalvarTexto = document.getElementById('btn-salvar-pedido-texto');

    if (banner) banner.style.display = 'flex';
    if (bannerTexto) bannerTexto.textContent = `✏️ Editando Pedido #${pedido.id} (${pedido.cliente.nome})`;
    if (btnSalvarTexto) btnSalvarTexto.textContent = `💾 Atualizar Pedido #${pedido.id}`;

    // Trocar para a aba do orçamento
    if (window.App) {
      window.App.trocarAba('orcamento');
    }

    this.renderizarCatalogo();
    this.renderizarCarrinho();
    App.showToast(`Pedido #${pedido.id} carregado para edição!`, 'info');
  },

  cancelarEdicao() {
    this.pedidoEmEdicaoId = null;

    const banner = document.getElementById('banner-edicao-pedido');
    const btnSalvarTexto = document.getElementById('btn-salvar-pedido-texto');

    if (banner) banner.style.display = 'none';
    if (btnSalvarTexto) btnSalvarTexto.textContent = '💾 Confirmar & Salvar Pedido';

    this.carrinho = [];
    document.getElementById('orc-cliente-nome').value = '';
    document.getElementById('orc-cliente-tel').value = '';
    document.getElementById('orc-cliente-email').value = '';
    document.getElementById('orc-cliente-endereco').value = '';
    document.getElementById('orc-obs').value = '';
    document.getElementById('orc-frete').value = '0';
    document.getElementById('orc-desconto').value = '0';
    
    this.carregarDatasPadrao();
    this.renderizarCatalogo();
    this.renderizarCarrinho();
    App.showToast('Edição do pedido cancelada.', 'info');
  },

  salvarComoPedido() {
    if (!this.validarCarrinho()) return;
    const dados = this.coletarDadosOrcamento();
    const pedidos = StorageService.getPedidos();

    if (this.pedidoEmEdicaoId) {
      // Atualizar pedido existente
      const index = pedidos.findIndex(p => p.id === this.pedidoEmEdicaoId);
      if (index !== -1) {
        const pedidoAntigo = pedidos[index];
        pedidos[index] = {
          ...pedidoAntigo,
          cliente: dados.cliente,
          dataEvento: dados.dataEvento,
          dataRetirada: dados.dataRetirada,
          dataDevolucao: dados.dataDevolucao,
          observacoes: dados.observacoes,
          frete: dados.frete,
          desconto: dados.desconto,
          percentualSinal: dados.percentualSinal,
          itens: dados.itens
        };

        StorageService.savePedidos(pedidos);
        StorageService.recalcularEstoqueAlugado();

        if (window.FirebaseSync && window.FirebaseSync.salvarPedidoNuvem) {
          window.FirebaseSync.salvarPedidoNuvem(pedidos[index]);
        }

        const idEditado = this.pedidoEmEdicaoId;
        this.cancelarEdicao();

        App.showToast(`Pedido #${idEditado} atualizado com sucesso!`, 'success');

        // Atualizar pedidos e estoque
        if (window.PedidosModule) window.PedidosModule.renderizarPedidos();
        if (window.EstoqueModule) window.EstoqueModule.renderizarEstoque();
        App.atualizarStatsDashboard();

        // Ir para a aba de pedidos para visualizar
        if (window.App) window.App.trocarAba('pedidos');
        return;
      }
    }

    // Criar novo pedido
    dados.status = 'Confirmado';
    pedidos.unshift(dados);
    StorageService.savePedidos(pedidos);
    StorageService.recalcularEstoqueAlugado();

    if (window.FirebaseSync && window.FirebaseSync.salvarPedidoNuvem) {
      window.FirebaseSync.salvarPedidoNuvem(dados);
    }

    App.showToast(`Pedido #${dados.id} salvo com sucesso! Estoque reservado.`, 'success');
    
    // Limpar e atualizar
    this.carrinho = [];
    document.getElementById('orc-cliente-nome').value = '';
    document.getElementById('orc-cliente-tel').value = '';
    document.getElementById('orc-cliente-email').value = '';
    document.getElementById('orc-cliente-endereco').value = '';
    document.getElementById('orc-obs').value = '';
    document.getElementById('orc-frete').value = '0';
    document.getElementById('orc-desconto').value = '0';
    
    this.carregarDatasPadrao();
    this.renderizarCatalogo();
    this.renderizarCarrinho();
    
    if (window.PedidosModule) window.PedidosModule.renderizarPedidos();
    if (window.EstoqueModule) window.EstoqueModule.renderizarEstoque();
    App.atualizarStatsDashboard();
  }
};

window.OrcamentoModule = OrcamentoModule;
