const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('fs/promises'); // Para leitura de arquivos

// 🔥 HOT RELOAD
require('electron-reload')(__dirname, {
  electron: require('electron-reload')(__dirname)
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // DevTools
  // mainWindow.webContents.openDevTools();
};

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

// IPC handler
// ipcMain já foi importado no topo
const compilerApi = require('../../../dist/api');

ipcMain.handle('compile-code', async (event, sourceCode) => {
  console.log("Recebendo código para compilar...");

  // Callback de input que será passado ao compilador
  const inputCallback = (prompt) => {
    return new Promise((resolve) => {
      // 1. Envia solicitação de input para a janela (Frontend)
      event.sender.send('input-request', prompt);

      // 2. Define um listener único para a resposta especifica
      // Nota: Em um app real, ideal tratar IDs para evitar colisão, mas simplificado aqui.
      const responseHandler = (evt, userInput) => {
        resolve(userInput);
        ipcMain.removeListener('input-response', responseHandler); // Limpa listener
      };

      ipcMain.on('input-response', responseHandler);
    });
  };

  try {
    const result = await compilerApi.executeCode(sourceCode, inputCallback);
    return result;
  } catch (error) {
    console.error("Erro na compilação:", error);
    return { output: [], errors: [error.message] };
  }
});

// --- Handler para Abrir Arquivo ---
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'SeteAO Files', extensions: ['sa', 'txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (canceled) {
    return null;
  } else {
    try {
      const content = await fs.readFile(filePaths[0], 'utf-8');
      return { content, filePath: filePaths[0] };
    } catch (e) {
      console.error("Erro ao ler arquivo:", e);
      return null;
    }
  }
});

// --- Handler para Salvar Arquivo ---
ipcMain.handle('dialog:saveFile', async (event, { content, filePath }) => {
  // Se não tem caminho (Salvar Como ou Primeiro Salvar), abre diálogo
  if (!filePath) {
    const { canceled, filePath: newPath } = await dialog.showSaveDialog({
      title: 'Salvar Arquivo',
      defaultPath: 'meu_codigo.sa',
      filters: [
        { name: 'SeteAO Files', extensions: ['sa', 'txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (canceled) return null;
    filePath = newPath;
  }

  // Salva o conteúdo no disco
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return filePath; // Retorna o caminho para o frontend atualizar o estado
  } catch (e) {
    console.error("Erro ao salvar arquivo:", e);
    return null;
  }
});

ipcMain.handle('dialog:exportWebsite', async (event, htmlContent) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Exportar Website',
    defaultPath: 'site_exportado.html',
    filters: [
      { name: 'HTML Files', extensions: ['html'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (canceled) return null;

  const fullHtml = `<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Exportado - SeteAO</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; font-family: sans-serif; }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

  try {
    await fs.writeFile(filePath, fullHtml, 'utf-8');
    return filePath;
  } catch (e) {
    console.error("Erro ao exportar website:", e);
    return null;
  }
});
