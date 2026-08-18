const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  savePdfDialog: (defaultName) => ipcRenderer.invoke('save-pdf-dialog', defaultName),
  printToPdf: (filePath) => ipcRenderer.invoke('print-to-pdf', filePath),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  quitAndInstallUpdate: () => ipcRenderer.invoke('quit-and-install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdaterMessage: (callback) => ipcRenderer.on('updater-message', (event, data) => callback(data)),
  isDesktop: true
});
