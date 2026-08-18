/**
 * estoque.js - Gestão de Estoque e Cadastro de Artigos para Locação
 */

const EstoqueModule = {
  filtroCategoria: 'todos',
  termoBusca: '',
  produtoEmEdicaoId: null,

  init() {
    this.renderizarEstoque();
    this.bindEvents();
  },

  bindEvents() {
    const inputBusca = document.getElementById('estoque-busca');
    if (inputBusca) {
      inputBusca.addEventListener('input', (e) => {
        this.termoBusca = e.target.value.toLowerCase().trim();
        this.renderizarEstoque();
      });
    }

    const selectCat = document.getElementById('estoque-filtro-cat');
    if (selectCat) {
      selectCat.addEventListener('change', (e) => {
        this.filtroCategoria = e.target.value;
        this.renderizarEstoque();
      });
    }
  },

  renderizarEstoque() {
    const tbody = document.getElementById('estoque-tabela-corpo');
    if (!tbody) return;

    StorageService.recalcularEstoqueAlugado();
    const produtos = StorageService.getProdutos();

    const filtrados = produtos.filter(p => {
      const pCat = (p.categoria || "").toLowerCase().trim();
      const matchCat = this.filtroCategoria === "todos" || 
                       pCat === this.filtroCategoria || 
                       (this.filtroCategoria === "rechaud" && (pCat === "rechauds" || pCat === "rechaud")) ||
                       (this.filtroCategoria === "tacas" && (pCat === "taca" || pCat === "tacas" || pCat === "taça" || pCat === "taças")) ||
                       (this.filtroCategoria === "toalhas" && (pCat === "toalha" || pCat === "toalhas")) ||
                       (this.filtroCategoria === "pratos" && (pCat === "prato" || pCat === "pratos")) ||
                       (this.filtroCategoria === "talheres" && (pCat === "talher" || pCat === "talheres"));
      const matchBusca = !this.termoBusca || 
                         p.nome.toLowerCase().includes(this.termoBusca) || 
                         (p.codigo && p.codigo.toLowerCase().includes(this.termoBusca));
      return matchCat && matchBusca;
    });

    // Atualizar contadores do topo do estoque
    const totalItensAcervo = produtos.reduce((acc, p) => acc + (p.estoqueTotal || 0), 0);
    const totalAlugados = produtos.reduce((acc, p) => acc + (p.estoqueAlugado || 0), 0);
    const totalDisponiveis = Math.max(0, totalItensAcervo - totalAlugados);
    const valorPatrimonio = produtos.reduce((acc, p) => acc + ((p.estoqueTotal || 0) * (p.reposicao || 0)), 0);

    const elAcervo = document.getElementById('stat-estoque-total');
    const elDisp = document.getElementById('stat-estoque-disp');
    const elAlug = document.getElementById('stat-estoque-alug');
    const elPatrimonio = document.getElementById('stat-estoque-patrimonio');

    if (elAcervo) elAcervo.textContent = totalItensAcervo;
    if (elDisp) elDisp.textContent = totalDisponiveis;
    if (elAlug) elAlug.textContent = totalAlugados;
    if (elPatrimonio) elPatrimonio.textContent = PDFGenerator.formatMoney(valorPatrimonio);

    if (filtrados.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4" style="color: #888;">
            Nenhum produto encontrado com os filtros atuais.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtrados.map(prod => {
      const total = Number(prod.estoqueTotal || 0);
      const alugado = Number(prod.estoqueAlugado || 0);
      const disponivel = Math.max(0, total - alugado);
      const percentualOcupacao = total > 0 ? Math.round((alugado / total) * 100) : 0;

      return `
        <tr>
          <td style="width: 60px;">
            <img src="${prod.imagem || 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500'}" 
                 alt="${prod.nome}" class="estoque-thumb">
          </td>
          <td>
            <span class="badge-code-table">${prod.codigo || '-'}</span>
          </td>
          <td>
            <strong>${prod.nome}</strong>
            <span class="d-block text-muted small">${window.NOMES_CAT_EXATO[(prod.categoria || "").toLowerCase().trim()] || "Artigo"}</span>
          </td>
          <td style="text-align: right; font-weight: bold; color: #D4AF37;">
            ${PDFGenerator.formatMoney(prod.diaria)}
          </td>
          <td style="text-align: right; color: #888;">
            ${PDFGenerator.formatMoney(prod.reposicao)}
          </td>
          <td style="text-align: center;">
            <div class="estoque-pill-box">
              <span class="badge-total">${total} total</span>
              <span class="badge-alugado ${alugado > 0 ? 'active' : ''}">${alugado} alug.</span>
              <span class="badge-disp ${disponivel <= 5 ? 'baixo' : ''}">${disponivel} disp.</span>
            </div>
            <div class="progress-bar-estoque" title="${percentualOcupacao}% em locação">
              <div class="progress-fill" style="width: ${percentualOcupacao}%;"></div>
            </div>
          </td>
          <td style="text-align: center;">
            <span class="status-dot ${disponivel > 0 ? 'dot-green' : 'dot-red'}"></span>
            ${disponivel > 0 ? 'Disponível' : 'Esgotado'}
          </td>
          <td style="text-align: right;">
            <button type="button" class="btn-action-icon" title="Editar Produto" onclick="EstoqueModule.abrirModalEditar('${prod.id}')">
              ✏️
            </button>
            <button type="button" class="btn-action-icon text-danger" title="Excluir Produto" onclick="EstoqueModule.excluirProduto('${prod.id}')">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  abrirModalNovo() {
    this.produtoEmEdicaoId = null;
    const modal = document.getElementById('modal-produto');
    const form = document.getElementById('form-produto');
    const title = document.getElementById('modal-produto-title');

    if (form) form.reset();
    if (title) title.textContent = '✨ Cadastrar Novo Artigo de Festa';

    // Gerar código sugerido
    const inputCod = document.getElementById('prod-codigo');
    if (inputCod) {
      inputCod.value = 'ART-' + Math.floor(100 + Math.random() * 900);
    }

    if (modal) modal.classList.add('active');
  },

  abrirModalEditar(id) {
    const produtos = StorageService.getProdutos();
    const prod = produtos.find(p => p.id === id);
    if (!prod) return;

    this.produtoEmEdicaoId = id;
    const modal = document.getElementById('modal-produto');
    const title = document.getElementById('modal-produto-title');
    if (title) title.textContent = '✏️ Editar Artigo de Festa';

    document.getElementById('prod-codigo').value = prod.codigo || '';
    document.getElementById('prod-nome').value = prod.nome || '';
    document.getElementById('prod-categoria').value = prod.categoria || 'rechauds';
    document.getElementById('prod-diaria').value = prod.diaria || '';
    document.getElementById('prod-reposicao').value = prod.reposicao || '';
    document.getElementById('prod-estoque-total').value = prod.estoqueTotal || '';
    document.getElementById('prod-imagem').value = prod.imagem || '';
    document.getElementById('prod-descricao').value = prod.descricao || '';

    if (modal) modal.classList.add('active');
  },

  fecharModal() {
    const modal = document.getElementById('modal-produto');
    if (modal) modal.classList.remove('active');
    this.produtoEmEdicaoId = null;
  },

  salvarProduto(e) {
    e.preventDefault();
    const codigo = document.getElementById('prod-codigo')?.value.trim() || '';
    const nome = document.getElementById('prod-nome')?.value.trim();
    const categoria = document.getElementById('prod-categoria')?.value;
    const selectCat = document.getElementById('prod-categoria');
    const categoriaNome = selectCat ? selectCat.options[selectCat.selectedIndex].text : categoria;
    const diaria = parseFloat(document.getElementById('prod-diaria')?.value) || 0;
    const reposicao = parseFloat(document.getElementById('prod-reposicao')?.value) || 0;
    const estoqueTotal = parseInt(document.getElementById('prod-estoque-total')?.value, 10) || 0;
    const imagem = document.getElementById('prod-imagem')?.value.trim() || 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500';
    const descricao = document.getElementById('prod-descricao')?.value.trim() || '';

    if (!nome || estoqueTotal <= 0 || diaria <= 0) {
      App.showToast('Preencha os campos obrigatórios com valores válidos.', 'warning');
      return;
    }

    const produtos = StorageService.getProdutos();

    if (this.produtoEmEdicaoId) {
      // Editar existente
      const index = produtos.findIndex(p => p.id === this.produtoEmEdicaoId);
      if (index !== -1) {
        produtos[index] = {
          ...produtos[index],
          codigo,
          nome,
          categoria,
          categoriaNome,
          diaria,
          reposicao,
          estoqueTotal,
          imagem,
          descricao
        };
        App.showToast('Artigo atualizado com sucesso!', 'success');
      }
    } else {
      // Novo artigo
      const novoProduto = {
        id: 'prod-' + Date.now(),
        codigo,
        nome,
        categoria,
        categoriaNome,
        diaria,
        reposicao,
        estoqueTotal,
        estoqueAlugado: 0,
        imagem,
        descricao
      };
      produtos.unshift(novoProduto);
      App.showToast('Novo artigo cadastrado com sucesso!', 'success');
    }

    StorageService.saveProdutos(produtos);

    // Sincronizar na Nuvem (Firebase)
    if (window.FirebaseSync && window.FirebaseSync.salvarProdutoNuvem) {
      const prodSalvo = this.produtoEmEdicaoId ? produtos.find(p => p.id === this.produtoEmEdicaoId) : produtos[0];
      if (prodSalvo) window.FirebaseSync.salvarProdutoNuvem(prodSalvo);
    }

    this.fecharModal();
    this.renderizarEstoque();

    // Atualizar também o catálogo do orçamento se estiver aberto
    if (window.OrcamentoModule) {
      window.OrcamentoModule.renderizarCatalogo();
    }
    App.atualizarStatsDashboard();
  },

  excluirProduto(id) {
    const produtos = StorageService.getProdutos();
    const prod = produtos.find(p => p.id === id);
    if (!prod) return;

    if (prod.estoqueAlugado > 0) {
      App.showToast('Não é possível excluir um item com unidades atualmente alugadas!', 'error');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o produto "${prod.nome}"?`)) {
      const filtrados = produtos.filter(p => p.id !== id);
      StorageService.saveProdutos(filtrados);

      // Excluir na Nuvem (Firebase)
      if (window.FirebaseSync && window.FirebaseSync.excluirProdutoNuvem) {
        window.FirebaseSync.excluirProdutoNuvem(id);
      }

      App.showToast('Produto excluído do acervo.', 'info');
      this.renderizarEstoque();
      if (window.OrcamentoModule) window.OrcamentoModule.renderizarCatalogo();
      App.atualizarStatsDashboard();
    }
  }
};

window.EstoqueModule = EstoqueModule;
