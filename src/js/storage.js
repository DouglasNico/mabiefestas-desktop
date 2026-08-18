/**
 * storage.js - Camada de Persistência e Dados Iniciais para Mabie Festas
 */

const STORAGE_KEYS = {
  PRODUTOS: 'mabie_produtos_v1',
  PEDIDOS: 'mabie_pedidos_v1',
  CONFIG: 'mabie_config_v1'
};

// Catálogo inicial com artigos reais de locação para festas
const PRODUTOS_INICIAIS = [
  {
    id: 'prod-001',
    codigo: 'REC-01',
    nome: 'Réchaud Retangular Inox 2 Cubas 9L',
    categoria: 'rechauds',
    categoriaNome: 'Réchauds & Buffet',
    diaria: 45.00,
    reposicao: 380.00,
    estoqueTotal: 12,
    estoqueAlugado: 0,
    imagem: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500&auto=format&fit=crop&q=60',
    descricao: 'Aço inox polido, acompanha fogareiros e cubas padrão GN gastronômico.'
  },
  {
    id: 'prod-002',
    codigo: 'REC-02',
    nome: 'Réchaud Redondo Inox 6L para Molhos/Sopas',
    categoria: 'rechauds',
    categoriaNome: 'Réchauds & Buffet',
    diaria: 35.00,
    reposicao: 280.00,
    estoqueTotal: 8,
    estoqueAlugado: 0,
    imagem: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60',
    descricao: 'Ideal para risotos, massas e caldos. Banho-maria perfeito.'
  },
  {
    id: 'prod-003',
    codigo: 'TAC-01',
    nome: 'Taça de Cristal Ecológico Vinho Tinto 450ml',
    categoria: 'tacas',
    categoriaNome: 'Taças & Copos',
    diaria: 2.80,
    reposicao: 18.00,
    estoqueTotal: 250,
    estoqueAlugado: 0,
    imagem: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&auto=format&fit=crop&q=60',
    descricao: 'Design requintado com borda fina e excelente transparência para jantares de gala.'
  },
  {
    id: 'prod-004',
    codigo: 'TAC-02',
    nome: 'Taça Flûte Champanhe / Espumante 210ml',
    categoria: 'tacas',
    categoriaNome: 'Taças & Copos',
    diaria: 2.80,
    reposicao: 16.00,
    estoqueTotal: 300,
    estoqueAlugado: 0,
    imagem: 'https://images.unsplash.com/photo-1578911373434-0cb395d2cbfb?w=500&auto=format&fit=crop&q=60',
    descricao: 'Perfeita para brindes de casamentos, formaturas e celebrações especiais.'
  },
  {
    id: 'prod-005',
    codigo: 'COP-01',
    nome: 'Copo Long Drink de Vidro Lapidado 350ml',
    categoria: 'tacas',
    categoriaNome: 'Taças & Copos',
    diaria: 1.90,
    reposicao: 12.00,
    estoqueTotal: 400,
    estoqueAlugado: 0,
    imagem: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500&auto=format&fit=crop&q=60',
    descricao: 'Robusto e refinado, ideal para água, refrigerantes e coquetéis.'
  },
  {
    id: 'prod-006',
    codigo: 'PRA-01',
    nome: 'Prato Raso Porcelana Branca Filetada Ouro 27cm',
    categoria: 'pratos',
    categoriaNome: 'Pratos & Louças',
    diaria: 3.20,
    reposicao: 24.00,
    estoqueTotal: 200,
    estoqueAlugado: 0,
    imagem: 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?w=500&auto=format&fit=crop&q=60',
    descricao: 'Porcelana hotelaria premium com acabamento elegante para mesa posta.'
  },
  {
    id: 'prod-007',
    codigo: 'PRA-02',
    nome: 'Prato de Sobremesa Porcelana Branca 19cm',
    categoria: 'pratos',
    categoriaNome: 'Pratos & Louças',
    diaria: 2.20,
    reposicao: 16.00,
    estoqueTotal: 200,
    estoqueAlugado: 0,
    imagem: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=500&auto=format&fit=crop&q=60',
    descricao: 'Design clássico para bolos, tortas e sobremesas finas.'
  },
  {
    id: 'prod-008',
    codigo: 'TAL-01',
    nome: 'Kit Talher Dourado Luxo (Garfo + Faca Principal)',
    categoria: 'talheres',
    categoriaNome: 'Talheres',
    diaria: 3.50,
    reposicao: 25.00,
    estoqueTotal: 180,
    estoqueAlugado: 0,
    imagem: 'https://images.unsplash.com/photo-1615865417491-9941019fbc00?w=500&auto=format&fit=crop&q=60',
    descricao: 'Aço inox banhado a dourado fosco premium. Alto impacto visual.'
  },
  {
    id: 'prod-009',
    codigo: 'TAL-02',
    nome: 'Kit Talher Inox Tradicional Alto Brilho (Garfo + Faca)',
    categoria: 'talheres',
    categoriaNome: 'Talheres',
    diaria: 1.80,
    reposicao: 14.00,
    estoqueTotal: 350,
    estoqueAlugado: 0,
    imagem: 'https://images.unsplash.com/photo-1584269600519-112d071b35e6?w=500&auto=format&fit=crop&q=60',
    descricao: 'Linha pesada tradicional em aço inox polido 18/10.'
  },
  {
    id: 'prod-010',
    codigo: 'TOA-01',
    nome: 'Toalha de Mesa Jacquard Adamascada 3,00m Redonda',
    categoria: 'toalhas',
    categoriaNome: 'Toalhas & Guardanapos',
    diaria: 28.00,
    reposicao: 110.00,
    estoqueTotal: 35,
    estoqueAlugado: 0,
    imagem: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=500&auto=format&fit=crop&q=60',
    descricao: 'Tecido encorpado com caimento perfeito em tom Fendi/Champanhe.'
  },
  {
    id: 'prod-011',
    codigo: 'SUQ-01',
    nome: 'Suqueira Dispenser de Vidro Bico Inox 4,5L',
    categoria: 'buffet',
    categoriaNome: 'Réchauds & Buffet',
    diaria: 32.00,
    reposicao: 160.00,
    estoqueTotal: 10,
    estoqueAlugado: 0,
    imagem: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60',
    descricao: 'Dispenser trabalhado em relevo vintage com torneira anti-gotejamento.'
  },
  {
    id: 'prod-012',
    codigo: 'BAN-01',
    nome: 'Bandeja Garçom Inox Antiderrapante 40cm',
    categoria: 'buffet',
    categoriaNome: 'Réchauds & Buffet',
    diaria: 12.00,
    reposicao: 75.00,
    estoqueTotal: 20,
    estoqueAlugado: 0,
    imagem: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=60',
    descricao: 'Bandeja profissional com fundo emborrachado para serviço ágil.'
  }
];

const CONFIG_PADRAO = {
  empresa: {
    nome: 'Mabie Festas',
    slogan: 'Locação de Artigos e Louças para Festas & Eventos',
    cnpj: '00.000.000/0001-00',
    telefone: '(11) 99999-9999',
    instagram: '@mabiefestas',
    cidade: 'São Paulo - SP',
    chavePix: 'contato@mabiefestas.com.br (PIX E-mail)',
    taxaPadraoFrete: 60.00,
    percentualSinalPadrao: 50,
    regrasLocacao: [
      'A reserva dos artigos só é confirmada mediante o pagamento do sinal de 50%.',
      'O saldo restante deverá ser quitado na entrega/retirada dos materiais.',
      'Os itens devem ser devolvidos limpos e livres de resíduos orgânicos (exceto toalhas).',
      'Eventuais avarias, quebras ou extravios serão cobrados conforme valor de reposição tabelado.',
      'Prazo padrão de locação: Retirada 1 dia útil antes do evento e Devolução no 1º dia útil após.'
    ]
  }
};

const StorageService = {
  getProdutos() {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUTOS);
    if (!data) {
      this.saveProdutos(PRODUTOS_INICIAIS);
      return PRODUTOS_INICIAIS;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao ler produtos do LocalStorage:', e);
      return PRODUTOS_INICIAIS;
    }
  },

  saveProdutos(produtos) {
    localStorage.setItem(STORAGE_KEYS.PRODUTOS, JSON.stringify(produtos));
  },

  getPedidos() {
    const data = localStorage.getItem(STORAGE_KEYS.PEDIDOS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao ler pedidos:', e);
      return [];
    }
  },

  savePedidos(pedidos) {
    localStorage.setItem(STORAGE_KEYS.PEDIDOS, JSON.stringify(pedidos));
  },

  getConfig() {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!data) {
      this.saveConfig(CONFIG_PADRAO);
      return CONFIG_PADRAO;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return CONFIG_PADRAO;
    }
  },

  saveConfig(config) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  },

  // Atualiza saldo alugado no estoque a partir de pedidos ativos
  recalcularEstoqueAlugado() {
    const produtos = this.getProdutos();
    const pedidos = this.getPedidos();

    // Resetar alugados
    produtos.forEach(p => p.estoqueAlugado = 0);

    // Contar apenas pedidos que estão atualmente "Confirmado" ou "Alugado"
    const pedidosAtivos = pedidos.filter(p => p.status === 'Confirmado' || p.status === 'Alugado');
    
    pedidosAtivos.forEach(ped => {
      if (Array.isArray(ped.itens)) {
        ped.itens.forEach(item => {
          const prod = produtos.find(p => p.id === item.id);
          if (prod) {
            prod.estoqueAlugado = (prod.estoqueAlugado || 0) + (Number(item.quantidade) || 0);
          }
        });
      }
    });

    this.saveProdutos(produtos);
    return produtos;
  },

  exportarBackupJSON() {
    const backup = {
      dataExportacao: new Date().toISOString(),
      produtos: this.getProdutos(),
      pedidos: this.getPedidos(),
      config: this.getConfig()
    };
    return JSON.stringify(backup, null, 2);
  },

  importarBackupJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.produtos && Array.isArray(data.produtos)) this.saveProdutos(data.produtos);
      if (data.pedidos && Array.isArray(data.pedidos)) this.savePedidos(data.pedidos);
      if (data.config) this.saveConfig(data.config);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

window.StorageService = StorageService;
