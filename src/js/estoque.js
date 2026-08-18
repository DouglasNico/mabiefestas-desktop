/**
 * MABIE FESTAS - MÓDULO DE GESTÃO DE ESTOQUE & ARTIGOS
 * Adição, Edição, Exclusão, Upload de Fotos em Nuvem (Cloudinary) e Controle de Unidades
 */

const EstoqueModule = {
  filtroCategoria: 'todos',
  termoBusca: '',
  produtoEmEdicaoId: null,
  fotosAtuais: [],
  arquivosNovos: [],

  init() {
    this.renderizarTabsCategorias();
    this.renderizarEstoque();
    this.bindEvents();
  },

  renderizarTabsCategorias() {
    const container = document.getElementById('estoque-categorias-tabs');
    if (!container) return;

    const cats = [
      { id: 'todos', nome: 'Todos os Artigos' },
      { id: 'rechaud', nome: '🍲 Réchauds' },
      { id: 'toalhas', nome: '✨ Toalhas & Mesa' },
      { id: 'pratos', nome: '🍽️ Pratos & Louças' },
      { id: 'talheres', nome: '🍴 Talheres' },
      { id: 'tacas', nome: '🍷 Copos & Taças' },
      { id: 'buffet', nome: '🍹 Buffet' }
    ];

    container.innerHTML = cats.map(c => `
      <button type="button" 
              class="cat-tab ${this.filtroCategoria === c.id ? 'active' : ''}" 
              onclick="EstoqueModule.filtrarPorCategoria('${c.id}')">
        ${c.nome}
      </button>
    `).join('');
  },

  bindEvents() {
    const inputBusca = document.getElementById('estoque-busca');
    if (inputBusca) {
      inputBusca.addEventListener('input', (e) => {
        this.termoBusca = e.target.value.toLowerCase().trim();
        this.renderizarEstoque();
      });
    }
  },

  filtrarPorCategoria(catId) {
    this.filtroCategoria = catId;
    this.renderizarTabsCategorias();
    this.renderizarEstoque();
  },

  renderizarEstoque() {
    const tbody = document.getElementById('estoque-tbody');
    const badgeTotal = document.getElementById('estoque-total-artigos');
    if (!tbody) return;

    let produtos = StorageService.getProdutos() || [];

    // Filtros
    if (this.filtroCategoria !== 'todos') {
      const catBusca = this.filtroCategoria.toLowerCase().replace(/s$/, "");
      produtos = produtos.filter(p => {
        const pCat = (p.categoria || "").toLowerCase().replace(/s$/, "");
        return pCat === catBusca || (p.categoria === this.filtroCategoria);
      });
    }

    if (this.termoBusca) {
      produtos = produtos.filter(p => 
        (p.nome && p.nome.toLowerCase().includes(this.termoBusca)) ||
        (p.codigo && p.codigo.toLowerCase().includes(this.termoBusca)) ||
        (p.descricao && p.descricao.toLowerCase().includes(this.termoBusca))
      );
    }

    if (badgeTotal) badgeTotal.textContent = `${produtos.length} artigos`;

    if (produtos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 40px; color: var(--texto-muted);">
            Nenhum artigo encontrado para o filtro selecionado.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = produtos.map(prod => {
      const disponivel = Math.max(0, (prod.estoqueTotal || 0) - (prod.estoqueAlugado || 0));
      const statusClass = disponivel > 3 ? 'status-disponivel' : (disponivel > 0 ? 'status-alugado' : 'status-manutencao');
      const statusTexto = disponivel > 3 ? 'Disponível' : (disponivel > 0 ? 'Últimas Peças' : 'Esgotado');

      const fotoUrl = prod.imagem || (prod.imagens && prod.imagens[0]) || 'https://images.unsplash.com/photo-1555244162-803834f70033?w=100';
      const catExata = (window.NOMES_CAT_EXATO && window.NOMES_CAT_EXATO[prod.categoria]) 
        ? window.NOMES_CAT_EXATO[prod.categoria] 
        : (prod.categoriaNome || prod.categoria || "Geral");

      return `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap: 12px;">
              <img src="${fotoUrl}" class="item-foto-thumb" alt="${prod.nome}" onerror="this.src='https://images.unsplash.com/photo-1555244162-803834f70033?w=100'">
              <div>
                <strong style="display:block; color: var(--texto);">${prod.nome}</strong>
                <span class="badge-tag">${catExata}</span>
              </div>
            </div>
          </td>
          <td><span style="font-family: monospace; font-weight:700; color: var(--rosa);">${prod.codigo || 'S/C'}</span></td>
          <td><strong style="color: var(--rosa);">${Utils.formatarMoeda(prod.diaria || 0)}</strong></td>
          <td>${Utils.formatarMoeda(prod.reposicao || 0)}</td>
          <td>
            <div style="display:flex; flex-direction:column; gap: 2px;">
              <span>Total: <strong>${prod.estoqueTotal || 0}</strong> un</span>
              <span style="font-size: 11px; color: var(--texto-sec);">Alugadas: ${prod.estoqueAlugado || 0}</span>
            </div>
          </td>
          <td>
            <span class="status-badge ${statusClass}">
              ● ${disponivel} un (${statusTexto})
            </span>
          </td>
          <td>
            <div class="acoes-cell">
              <button type="button" class="btn-action-sm btn-action-edit" title="Editar Artigo" onclick="EstoqueModule.abrirModalEditar('${prod.id}')">
                ✏️ Editar
              </button>
              <button type="button" class="btn-action-sm btn-action-delete" title="Excluir Artigo" onclick="EstoqueModule.excluirProduto('${prod.id}')">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  abrirModalNovo() {
    this.produtoEmEdicaoId = null;
    this.fotosAtuais = [];
    this.arquivosNovos = [];

    const modal = document.getElementById('modal-produto');
    const form = document.getElementById('form-produto');
    const title = document.getElementById('modal-produto-title');
    const statusBadge = document.getElementById('upload-status-badge');

    if (form) form.reset();
    if (title) title.textContent = '✨ Cadastrar Novo Artigo de Festa';
    if (statusBadge) statusBadge.textContent = '';

    // Gerar código sequencial sugerido oficial (ex: PRD-021)
    const produtos = StorageService.getProdutos() || [];
    let maiorNum = 0;
    produtos.forEach(p => {
      const match = (p.codigo || "").match(/(?:PRD|ART|PROD)[-_]?0*(\d+)/i);
      if (match && match[1]) {
        const n = parseInt(match[1], 10);
        if (n > maiorNum) maiorNum = n;
      }
    });
    const proximoNum = maiorNum > 0 ? (maiorNum + 1) : (produtos.length + 1);
    const inputCod = document.getElementById("prod-codigo");
    if (inputCod) {
      inputCod.value = "PRD-" + String(proximoNum).padStart(3, "0");
    }

    this.renderizarPreviewsFotos();
    if (modal) modal.classList.add('active');
  },

  abrirModalEditar(id) {
    const produtos = StorageService.getProdutos();
    const prod = produtos.find(p => p.id === id);
    if (!prod) return;

    this.produtoEmEdicaoId = id;
    this.arquivosNovos = [];

    if (prod.imagens && Array.isArray(prod.imagens) && prod.imagens.length > 0) {
      this.fotosAtuais = [...prod.imagens];
    } else if (prod.imagem) {
      this.fotosAtuais = [prod.imagem];
    } else {
      this.fotosAtuais = [];
    }

    const modal = document.getElementById('modal-produto');
    const title = document.getElementById('modal-produto-title');
    const statusBadge = document.getElementById('upload-status-badge');
    if (title) title.textContent = '✏️ Editar Artigo de Festa';
    if (statusBadge) statusBadge.textContent = '';

    document.getElementById('prod-codigo').value = prod.codigo || '';
    document.getElementById('prod-nome').value = prod.nome || '';
    document.getElementById('prod-categoria').value = prod.categoria || 'rechaud';
    document.getElementById('prod-diaria').value = prod.diaria || '';
    document.getElementById('prod-reposicao').value = prod.reposicao || '';
    document.getElementById('prod-estoque-total').value = prod.estoqueTotal || '';
    document.getElementById('prod-imagem').value = prod.imagem || '';
    document.getElementById('prod-descricao').value = prod.descricao || '';

    this.renderizarPreviewsFotos();
    if (modal) modal.classList.add('active');
  },

  fecharModal() {
    const modal = document.getElementById('modal-produto');
    if (modal) modal.classList.remove('active');
    this.produtoEmEdicaoId = null;
    this.fotosAtuais = [];
    this.arquivosNovos = [];
  },

  handleFotosUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      this.arquivosNovos.push({ file, previewUrl });
    });

    e.target.value = '';
    this.renderizarPreviewsFotos();
  },

  removerFoto(index, isNovo) {
    if (isNovo) {
      this.arquivosNovos.splice(index, 1);
    } else {
      this.fotosAtuais.splice(index, 1);
    }
    this.renderizarPreviewsFotos();
  },

  renderizarPreviewsFotos() {
    const container = document.getElementById('prod-previews-container');
    if (!container) return;

    const totalFotos = this.fotosAtuais.length + this.arquivosNovos.length;
    if (totalFotos === 0) {
      container.innerHTML = `<span style="font-size: 11px; color: var(--texto-muted);">Nenhuma foto selecionada ainda.</span>`;
      return;
    }

    let html = '';
    let globalIndex = 0;

    // Fotos já existentes na Nuvem
    this.fotosAtuais.forEach((url, i) => {
      const isCapa = (globalIndex === 0);
      html += `
        <div class="preview-thumb-card">
          <img src="${url}" alt="Foto">
          ${isCapa ? '<div class="badge-capa">Capa</div>' : ''}
          <button type="button" class="btn-remove-thumb" title="Remover Foto" onclick="EstoqueModule.removerFoto(${i}, false)">✕</button>
        </div>
      `;
      globalIndex++;
    });

    // Fotos novas adicionadas do computador
    this.arquivosNovos.forEach((item, i) => {
      const isCapa = (globalIndex === 0);
      html += `
        <div class="preview-thumb-card" style="border: 2px dashed var(--rosa);">
          <img src="${item.previewUrl}" alt="Nova Foto">
          ${isCapa ? '<div class="badge-capa">Capa</div>' : ''}
          <button type="button" class="btn-remove-thumb" title="Remover Foto" onclick="EstoqueModule.removerFoto(${i}, true)">✕</button>
        </div>
      `;
      globalIndex++;
    });

    container.innerHTML = html;
  },

  async uploadParaCloudinary(file) {
    const cloudName = "dycwp4ds9";
    const preset = "mabiefestas";
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);
    formData.append("folder", "mabiefestas");

    const res = await fetch(url, { method: "POST", body: formData });
    if (!res.ok) throw new Error("Erro no envio para o Cloudinary");
    const data = await res.json();
    return data.secure_url || data.url;
  },

  async salvarProduto(e) {
    e.preventDefault();
    const codigo = document.getElementById('prod-codigo')?.value.trim() || '';
    const nome = document.getElementById('prod-nome')?.value.trim();
    const categoria = document.getElementById('prod-categoria')?.value;
    const selectCat = document.getElementById('prod-categoria');
    const categoriaNome = selectCat ? selectCat.options[selectCat.selectedIndex].text : categoria;
    const diaria = parseFloat(document.getElementById('prod-diaria')?.value) || 0;
    const reposicao = parseFloat(document.getElementById('prod-reposicao')?.value) || 0;
    const estoqueTotal = parseInt(document.getElementById('prod-estoque-total')?.value, 10) || 0;
    const descricao = document.getElementById('prod-descricao')?.value.trim() || '';
    const statusBadge = document.getElementById('upload-status-badge');

    if (!nome || estoqueTotal <= 0 || diaria <= 0) {
      App.showToast('Preencha os campos obrigatórios com valores válidos.', 'warning');
      return;
    }

    // Upload de novas fotos para o Cloudinary
    if (this.arquivosNovos.length > 0) {
      if (statusBadge) statusBadge.textContent = '⏳ Enviando fotos para a nuvem...';
      try {
        for (const item of this.arquivosNovos) {
          const cloudUrl = await this.uploadParaCloudinary(item.file);
          this.fotosAtuais.push(cloudUrl);
        }
        this.arquivosNovos = [];
      } catch (err) {
        console.error('Erro no upload de foto:', err);
        App.showToast('Erro ao enviar fotos para a nuvem. Verifique sua conexão.', 'error');
        if (statusBadge) statusBadge.textContent = '❌ Erro no envio';
        return;
      }
    }

    const capaUrl = this.fotosAtuais[0] || 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500';
    const produtos = StorageService.getProdutos();

    let produtoAtualizado = null;

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
          imagem: capaUrl,
          imagens: this.fotosAtuais,
          descricao
        };
        produtoAtualizado = produtos[index];
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
        imagem: capaUrl,
        imagens: this.fotosAtuais,
        descricao
      };
      produtos.unshift(novoProduto);
      produtoAtualizado = novoProduto;
      App.showToast('Novo artigo cadastrado com sucesso!', 'success');
    }

    StorageService.saveProdutos(produtos);

    // Sincronizar na Nuvem (Firebase Firestore)
    if (window.FirebaseSync && window.FirebaseSync.salvarProdutoNuvem && produtoAtualizado) {
      window.FirebaseSync.salvarProdutoNuvem(produtoAtualizado);
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
