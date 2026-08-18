/**
 * firebase-sync.js - Sincronização Oficial em Tempo Real do Acervo e Pedidos
 * Mabie Festas Desktop <-> Firebase Firestore
 */

import { db, collection, getDocs, doc, setDoc, deleteDoc, onSnapshot } from "./firebase-config.js";

const NOMES_CATEGORIAS_MAP = {
  rechaud: "Réchauds",
  rechauds: "Réchauds",
  toalha: "Toalhas & Mesa",
  toalhas: "Toalhas & Mesa",
  prato: "Pratos & Louças",
  pratos: "Pratos & Louças",
  talher: "Talheres",
  talheres: "Talheres",
  taca: "Copos & Taças",
  tacas: "Copos & Taças",
  taça: "Copos & Taças",
  taças: "Copos & Taças",
  buffet: "Buffet"
};

const FirebaseSync = {
  isSincronizando: false,
  ultimaSincronizacao: null,
  unsubscribeProdutos: null,
  unsubscribeOrcamentos: null,

  async init() {
    this.atualizarStatusVisual("sincronizando", "Conectando ao Firestore...");
    await this.sincronizarTudo(true);
    this.iniciarOuvintesTempoReal();
  },

  async sincronizarTudo(silencioso = false) {
    if (this.isSincronizando) return;
    this.isSincronizando = true;
    this.atualizarStatusVisual("sincronizando", "Sincronizando...");

    try {
      await Promise.all([
        this.baixarProdutosNuvem(),
        this.baixarPedidosNuvem()
      ]);

      this.ultimaSincronizacao = new Date();
      const horaFormatada = this.ultimaSincronizacao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      this.atualizarStatusVisual("online", `🟢 Nuvem Conectada (${horaFormatada})`);

      if (!silencioso && window.App) {
        window.App.showToast("Todos os Produtos e Pedidos foram sincronizados com sucesso!", "success");
      }
    } catch (error) {
      console.error("Erro na sincronização completa:", error);
      this.atualizarStatusVisual("offline", "⚠️ Modo Offline (Dados em Cache)");
      if (!silencioso && window.App) {
        window.App.showToast("Falha ao sincronizar com a Nuvem. Usando cache local.", "warning");
      }
    } finally {
      this.isSincronizando = false;
    }
  },

  iniciarOuvintesTempoReal() {
    // Escutar alterações nos orçamentos em tempo real (novos pedidos feitos no site)
    try {
      if (this.unsubscribeOrcamentos) this.unsubscribeOrcamentos();
      this.unsubscribeOrcamentos = onSnapshot(collection(db, "orcamentos"), (snapshot) => {
        this.processarSnapshotOrcamentos(snapshot);
      }, (err) => console.warn("Aviso no listener de orçamentos:", err));
    } catch (e) {
      console.warn("Não foi possível iniciar realtime listener:", e);
    }
  },

  async baixarProdutosNuvem() {
    const snapshot = await getDocs(collection(db, "produtos"));
    if (snapshot.empty) return;

    const produtosNuvem = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const catKey = (data.categoria || "rechaud").toLowerCase().trim();
      const catNome = NOMES_CATEGORIAS_MAP[catKey] || data.categoria || "Outros";

      const imagens = data.imagens && data.imagens.length 
        ? data.imagens 
        : (data.imagem ? [data.imagem] : (data.img ? [data.img] : []));
      const primeiraImg = imagens[0] || 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500';

      produtosNuvem.push({
        id: docSnap.id,
        codigo: data.codigo || ("PRD-" + docSnap.id.substring(0, 4).toUpperCase()),
        nome: data.nome || "Item sem nome",
        categoria: catKey,
        categoriaNome: catNome,
        diaria: parseFloat(data.preco || data.diaria || 0),
        reposicao: parseFloat(data.reposicao || 0),
        estoqueTotal: parseInt(data.estoque || data.estoqueTotal || 10, 10),
        estoqueAlugado: 0,
        imagem: primeiraImg,
        imagens: imagens,
        descricao: data.descricao || ""
      });
    });

    if (produtosNuvem.length > 0 && window.StorageService) {
      window.StorageService.saveProdutos(produtosNuvem);
      if (window.EstoqueModule && window.EstoqueModule.renderizarEstoque) {
        window.EstoqueModule.renderizarEstoque();
      }
      if (window.OrcamentoModule && window.OrcamentoModule.renderizarCatalogo) {
        window.OrcamentoModule.renderizarCatalogo();
      }
      if (window.App && window.App.atualizarStatsDashboard) {
        window.App.atualizarStatsDashboard();
      }
    }
  },

  async salvarProdutoNuvem(produto) {
    try {
      const docRef = doc(db, "produtos", String(produto.id));
      await setDoc(docRef, {
        id: produto.id,
        codigo: produto.codigo || "",
        nome: produto.nome,
        categoria: produto.categoria,
        preco: parseFloat(produto.diaria || 0),
        diaria: parseFloat(produto.diaria || 0),
        reposicao: parseFloat(produto.reposicao || 0),
        estoque: parseInt(produto.estoqueTotal || 10, 10),
        estoqueTotal: parseInt(produto.estoqueTotal || 10, 10),
        imagem: produto.imagem || "",
        imagens: produto.imagens || (produto.imagem ? [produto.imagem] : []),
        descricao: produto.descricao || "",
        atualizadoEm: new Date().toISOString()
      }, { merge: true });

      const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      this.atualizarStatusVisual("online", `🟢 Salvo na Nuvem (${hora})`);
    } catch (error) {
      console.warn("Erro ao salvar produto no Firestore:", error);
    }
  },

  async excluirProdutoNuvem(produtoId) {
    try {
      await deleteDoc(doc(db, "produtos", String(produtoId)));
    } catch (error) {
      console.warn("Erro ao excluir produto no Firestore:", error);
    }
  },

  processarSnapshotOrcamentos(snapshot) {
    if (!snapshot || snapshot.empty) return;
    if (!window.StorageService) return;

    const pedidosLocais = window.StorageService.getPedidos() || [];
    const pedidosMap = new Map();
    pedidosLocais.forEach(p => pedidosMap.set(String(p.id), p));

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;

      const itens = (data.itens || []).map(item => ({
        id: item.id || item.codigo || ("item-" + Math.random().toString(36).substring(2, 6)),
        codigo: item.codigo || "",
        nome: item.nome || "Item do Pedido",
        diaria: parseFloat(item.preco || item.diaria || 0),
        reposicao: parseFloat(item.reposicao || 0),
        quantidade: parseInt(item.qtd || item.quantidade || 1, 10),
        estoqueDisponivel: 99
      }));

      const subtotalCalculado = itens.reduce((acc, i) => acc + (i.quantidade * i.diaria), 0);
      const total = parseFloat(data.total || data.valorTotal || subtotalCalculado);
      const frete = parseFloat(data.frete || 0);
      const desconto = parseFloat(data.desconto || 0);
      const sinalPct = parseFloat(data.percentualSinal || data.sinalPct || 50);

      // Data de devolução formatada
      let dataDevolucao = data.dataDevolucao || data.evento?.dataDevolucao || "";
      if (!dataDevolucao && data.dataDevolucaoStr) {
        const partes = data.dataDevolucaoStr.split("/");
        if (partes.length === 3) {
          dataDevolucao = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        }
      }

      pedidosMap.set(id, {
        id: id,
        numero: (() => {
          if (data.numero) {
            const s = String(data.numero).trim();
            if (s.startsWith("ORC-") || s.startsWith("#ORC-")) return s.replace("#", "");
            if (!isNaN(Number(s))) return "ORC-" + String(s).padStart(5, "0");
            return s;
          }
          return "ORC-" + id.slice(0, 5).toUpperCase();
        })(),
        criadoEm: data.data || data.criadoEm || new Date().toISOString().split("T")[0],
        dataEvento: data.dataEvento || data.evento?.dataInicio || "",
        dataRetirada: data.dataRetirada || data.dataEvento || "",
        dataDevolucao: dataDevolucao || "",
        cliente: {
          nome: typeof data.cliente === 'string' ? data.cliente : (data.cliente?.nome || data.nomeCliente || "Cliente"),
          telefone: data.telefone || data.cliente?.telefone || "",
          email: data.email || data.cliente?.email || "",
          endereco: data.endereco || data.cliente?.endereco || ""
        },
        itens: itens,
        frete: frete,
        desconto: desconto,
        percentualSinal: sinalPct,
        observacoes: data.observacoes || data.obs || "",
        status: data.status || "Confirmado",
        origem: data.origem || "site"
      });
    });

    const listaFinal = Array.from(pedidosMap.values());
    window.StorageService.savePedidos(listaFinal);
    window.StorageService.recalcularEstoqueAlugado();

    if (window.PedidosModule && window.PedidosModule.renderizarPedidos) {
      window.PedidosModule.renderizarPedidos();
    }
    if (window.App && window.App.atualizarStatsDashboard) {
      window.App.atualizarStatsDashboard();
    }
  },

  async baixarPedidosNuvem() {
    const snapshot = await getDocs(collection(db, "orcamentos"));
    this.processarSnapshotOrcamentos(snapshot);
  },

  async salvarPedidoNuvem(pedido) {
    try {
      const docRef = doc(db, "orcamentos", String(pedido.id));
      await setDoc(docRef, {
        ...pedido,
        atualizadoEm: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.warn("Erro ao salvar orçamento no Firestore:", error);
    }
  },

  atualizarStatusVisual(estado, texto) {
    const el = document.getElementById("header-sync-status");
    const btnSync = document.getElementById("btn-header-sync");
    if (el) {
      el.textContent = texto;
      el.className = "sync-badge sync-" + estado;
    }
    if (btnSync) {
      btnSync.classList.toggle("girando", estado === "sincronizando");
    }
  }
};

window.FirebaseSync = FirebaseSync;
export { FirebaseSync };
