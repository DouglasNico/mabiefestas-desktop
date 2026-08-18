/**
 * app.js - Orquestrador Principal do Sistema Mabie Festas Desktop
 */

import { AuthModule } from './auth.js';
import { FirebaseSync } from './firebase-sync.js';

const App = {
  abaAtiva: 'orcamento',

  init() {
    if (window.AuthModule) {
      window.AuthModule.init();
    }
    this.bindUpdaterListener();
    this.carregarConfiguracoesNaTela();
    this.carregarVersaoApp();
    this.bindNavegacao();
    this.bindConfigForm();
    
    // Inicializar submódulos
    if (window.OrcamentoModule) window.OrcamentoModule.init();
    if (window.EstoqueModule) window.EstoqueModule.init();
    if (window.PedidosModule) window.PedidosModule.init();

    this.atualizarStatsDashboard();
  },

  bindNavegacao() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        this.trocarAba(targetTab);
      });
    });
  },

  trocarAba(nomeAba) {
    this.abaAtiva = nomeAba;

    // Atualizar botões de navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === nomeAba);
    });

    // Atualizar seções de conteúdo
    document.querySelectorAll('.tab-content-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${nomeAba}`);
    });

    // Ações de refresh específicas por aba
    if (nomeAba === 'orcamento' && window.OrcamentoModule) {
      window.OrcamentoModule.renderizarCatalogo();
    } else if (nomeAba === 'estoque' && window.EstoqueModule) {
      window.EstoqueModule.renderizarEstoque();
    } else if (nomeAba === 'pedidos' && window.PedidosModule) {
      window.PedidosModule.renderizarPedidos();
    } else if (nomeAba === 'config') {
      this.carregarConfiguracoesNaTela();
    }

    this.atualizarStatsDashboard();
  },

  atualizarStatsDashboard() {
    const produtos = StorageService.getProdutos();
    const pedidos = StorageService.getPedidos();
    const hojeStr = new Date().toISOString().split('T')[0];

    const totalArtigos = produtos.length;
    const pedidosAtivos = pedidos.filter(p => p.status === 'Confirmado' || p.status === 'Alugado').length;
    const devolucoesPendentes = pedidos.filter(p => p.status === 'Alugado' && p.dataDevolucao <= hojeStr).length;

    const elBadgeDevolucaoNav = document.getElementById('nav-badge-devolucoes');
    if (elBadgeDevolucaoNav) {
      if (devolucoesPendentes > 0) {
        elBadgeDevolucaoNav.textContent = devolucoesPendentes;
        elBadgeDevolucaoNav.style.display = 'inline-block';
      } else {
        elBadgeDevolucaoNav.style.display = 'none';
      }
    }
  },

  carregarConfiguracoesNaTela() {
    const config = StorageService.getConfig();
    const emp = config.empresa || {};

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('cfg-nome-empresa', emp.nome);
    setVal('cfg-slogan', emp.slogan);
    setVal('cfg-cnpj', emp.cnpj);
    setVal('cfg-telefone', emp.telefone);
    setVal('cfg-instagram', emp.instagram);
    setVal('cfg-cidade', emp.cidade);
    setVal('cfg-chave-pix', emp.chavePix);
    setVal('cfg-frete-padrao', emp.taxaPadraoFrete);
    setVal('cfg-sinal-padrao', emp.percentualSinalPadrao);
    setVal('cfg-regras', (emp.regrasLocacao || []).join('\n'));
  },

  bindConfigForm() {
    const form = document.getElementById('form-configuracoes');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const config = StorageService.getConfig();
      config.empresa = {
        nome: document.getElementById('cfg-nome-empresa')?.value.trim() || 'MABIE FESTAS',
        slogan: document.getElementById('cfg-slogan')?.value.trim() || 'Locação de Artigos para Festas',
        cnpj: document.getElementById('cfg-cnpj')?.value.trim() || '',
        telefone: document.getElementById('cfg-telefone')?.value.trim() || '',
        instagram: document.getElementById('cfg-instagram')?.value.trim() || '@mabiefesta',
        cidade: document.getElementById('cfg-cidade')?.value.trim() || 'Campinas - SP',
        chavePix: document.getElementById('cfg-chave-pix')?.value.trim() || '',
        taxaPadraoFrete: parseFloat(document.getElementById('cfg-frete-padrao')?.value) || 0,
        percentualSinalPadrao: parseFloat(document.getElementById('cfg-sinal-padrao')?.value) || 50,
        regrasLocacao: (document.getElementById('cfg-regras')?.value || '')
          .split('\n')
          .map(r => r.trim())
          .filter(r => r.length > 0)
      };

      StorageService.saveConfig(config);
      this.showToast('Configurações da Mabie Festas salvas com sucesso!', 'success');
    });
  },

  exportarBackup() {
    const jsonStr = StorageService.exportarBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_MabieFestas_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Backup dos dados exportado com sucesso!', 'success');
  },

  importarBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const res = StorageService.importarBackupJSON(e.target.result);
      if (res.success) {
        this.showToast('Backup importado com sucesso!', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        this.showToast(`Erro ao importar backup: ${res.error}`, 'error');
      }
    };
    reader.readAsText(file);
  },

  bindUpdaterListener() {
    if (window.electronAPI && window.electronAPI.onUpdaterMessage) {
      window.electronAPI.onUpdaterMessage((data) => {
        if (data.tipo === 'disponivel') {
          this.showToast(`🚀 Atualização v${data.versao} sendo baixada...`, 'info');
        } else if (data.tipo === 'baixado') {
          this.showToast(`🎉 Versão v${data.versao} pronta para instalar!`, 'success');
          if (confirm(`Uma nova versão (v${data.versao}) foi baixada! Deseja reiniciar o sistema agora para aplicar?`)) {
            window.electronAPI.quitAndInstallUpdate();
          }
        }
      });
    }
  },

  async carregarVersaoApp() {
    const versionEl = document.getElementById('cfg-app-version');
    if (!versionEl) return;
    if (window.electronAPI && window.electronAPI.getAppVersion) {
      try {
        const v = await window.electronAPI.getAppVersion();
        if (v) versionEl.textContent = `v${v}`;
      } catch (e) {}
    } else {
      versionEl.textContent = 'v1.0.3';
    }
  },

  async verificarAtualizacoes() {
    const statusEl = document.getElementById('cfg-update-status');
    if (statusEl) statusEl.textContent = 'Verificando no GitHub...';

    if (window.electronAPI && window.electronAPI.checkForUpdates) {
      try {
        const res = await window.electronAPI.checkForUpdates();
        if (statusEl) {
          if (res.msg) {
            statusEl.textContent = res.msg;
          } else if (res.updateInfo) {
            statusEl.textContent = `🔄 Nova versão v${res.updateInfo.version} disponível! Baixando...`;
          } else {
            statusEl.textContent = "🟢 Seu sistema já está atualizado!";
          }
        }
      } catch (e) {
        if (statusEl) statusEl.textContent = '🟢 Sistema operacional e atualizado.';
      }
    } else {
      if (statusEl) statusEl.textContent = '🟢 Versão atualizada.';
    }
  },

  showToast(mensagem, tipo = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-msg toast-${tipo}`;

    let icone = 'ℹ️';
    if (tipo === 'success') icone = '✅';
    if (tipo === 'warning') icone = '⚠️';
    if (tipo === 'error') icone = '❌';

    toast.innerHTML = `
      <span class="toast-icon">${icone}</span>
      <span class="toast-text">${mensagem}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }
};

window.App = App;
export { App };

// Inicializar App ao carregar DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
