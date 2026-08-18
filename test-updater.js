const { app } = require('electron');
const { autoUpdater } = require('electron-updater');

app.whenReady().then(async () => {
  autoUpdater.logger = {
    info: (msg) => console.log('[INFO]', msg),
    warn: (msg) => console.warn('[WARN]', msg),
    error: (msg) => console.error('[ERROR]', msg),
    debug: (msg) => console.log('[DEBUG]', msg),
  };

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'DouglasNico',
    repo: 'mabiefestas-desktop'
  });

  // Forçar modo pacote para teste
  autoUpdater.forceDevUpdateConfig = true;

  console.log('Versão atual do app:', app.getVersion());
  console.log('Testando autoUpdater.checkForUpdates()...');

  try {
    const res = await autoUpdater.checkForUpdates();
    console.log('[SUCESSO] UpdateInfo:', JSON.stringify(res?.updateInfo, null, 2));
  } catch (err) {
    console.error('[ERRO CAPTURADO]:', err.message);
    console.error(err.stack);
  }

  setTimeout(() => app.quit(), 3000);
});