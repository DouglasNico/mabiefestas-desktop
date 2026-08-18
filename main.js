const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let autoUpdater = null;
let updaterError = null;
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch (e) {
  updaterError = String(e.stack || e.message || e);
  console.error('electron-updater falhou:', updaterError);
  try {
    fs.writeFileSync(path.join(app.getPath('userData'), 'updater_load_error.log'), updaterError, 'utf8');
  } catch (fsErr) {}
}

let mainWindow;

// Evitar instâncias duplicadas disputando o cache do Windows
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createWindow() {
    const iconPath = path.join(__dirname, 'src', 'assets', 'icon.png');
    
    const windowConfig = {
      width: 1360,
      height: 860,
      minWidth: 1024,
      minHeight: 700,
      title: 'Mabie Festas - Gestão & Orçamentos',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false
      },
      backgroundColor: '#fefcfd',
      autoHideMenuBar: true
    };

    if (fs.existsSync(iconPath)) {
      windowConfig.icon = iconPath;
    }

    windowConfig.show = false;
    mainWindow = new BrowserWindow(windowConfig);

    // Sempre abrir maximizado na tela inteira
    mainWindow.maximize();
    mainWindow.show();

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    // Iniciar verificação de atualizações após carregar a janela
    setupAutoUpdater();
  }

  function setupAutoUpdater() {
    if (!autoUpdater) return;

    try {
      autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'DouglasNico',
        repo: 'mabiefestas-desktop'
      });
      autoUpdater.forceDevUpdateConfig = true;
    } catch (e) {
      console.log('[AutoUpdater] FeedURL setup:', e?.message || e);
    }

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
      console.log('[AutoUpdater] Verificando se há atualizações no GitHub...');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('[AutoUpdater] Atualização disponível:', info.version);
      if (mainWindow) {
        mainWindow.webContents.send('updater-message', {
          tipo: 'disponivel',
          versao: info.version,
          msg: `Uma nova versão (v${info.version}) foi encontrada e está sendo baixada automaticamente!`
        });
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('[AutoUpdater] Atualização baixada com sucesso:', info.version);
      if (mainWindow) {
        mainWindow.webContents.send('updater-message', {
          tipo: 'baixado',
          versao: info.version,
          msg: `A nova versão v${info.version} está pronta para uso! Ela será aplicada ao fechar o programa.`
        });
      }
    });

    autoUpdater.on('error', (err) => {
      console.log('[AutoUpdater] Info de conexão:', err?.message || err);
    });

    // Checar atualizações automaticamente 4 segundos após abrir a janela
    setTimeout(() => {
      if (autoUpdater) {
        autoUpdater.checkForUpdatesAndNotify().catch((err) => {
          console.log('[AutoUpdater] Verificação inicial:', err?.message);
        });
      }
    }, 4000);
  }

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // IPC Handler: Verificar atualizações manualmente pelo botão das Configurações
  ipcMain.handle('check-for-updates', async () => {
    const currentVer = app.getVersion();
    if (autoUpdater) {
      try {
        const res = await autoUpdater.checkForUpdates();
        return { success: true, updateInfo: res?.updateInfo };
      } catch (e) {
        console.error('Erro ao verificar atualização:', e);
        const msg = String(e.message || '');
        if (msg.includes('404') || msg.includes('Cannot find') || msg.includes('releases.atom')) {
          return { success: true, msg: `🟢 Seu sistema já está na versão mais recente (v${currentVer})!` };
        }
        return { success: false, error: msg, msg: `Não foi possível verificar no momento (v${currentVer}).` };
      }
    }
    if (updaterError) {
      return { success: false, isDev: true, msg: `⚠️ Auto-Updater indisponível: ${updaterError.split('\n')[0]}` };
    }
    return { success: true, isDev: true, msg: `🟢 Modo de desenvolvimento (v${currentVer}).` };
  });

  // IPC Handler: Obter versão dinâmica do app
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // IPC Handler: Reiniciar e aplicar atualização imediatamente
  ipcMain.handle('quit-and-install-update', () => {
    if (autoUpdater) {
      autoUpdater.quitAndInstall();
    }
  });

  // IPC Handler para salvar PDF localmente
  ipcMain.handle('save-pdf-dialog', async (event, defaultName) => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Salvar Orçamento em PDF',
      defaultPath: defaultName || 'Orcamento_Mabie_Festas.pdf',
      filters: [{ name: 'Documentos PDF', extensions: ['pdf'] }]
    });
    return filePath;
  });

  // IPC Handler para imprimir página / PDF
  ipcMain.handle('print-to-pdf', async (event, filePath) => {
    try {
      const data = await mainWindow.webContents.printToPDF({
        marginsType: 0,
        printBackground: true,
        printSelectionOnly: false,
        landscape: false,
        pageSize: 'A4'
      });
      fs.writeFileSync(filePath, data);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
