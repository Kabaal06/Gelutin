import { app, BrowserWindow, ipcMain, Menu, screen, dialog, IpcMainEvent } from 'electron';
import * as path from 'path';
import { SettingsManager } from './settings-manager';
import { WindowManager } from './focus-windows-manager/window-manager';
import { AutoFocusManager } from './focus-windows-manager/auto-focus-manager';
import { OrganizerManager } from './focus-windows-manager/organizer-manager';
import { Settings, WindowParameters } from '../src/common/models/settings';

// Forcer le nom de l'application pour electron-store
app.setName('Gelutin');

const settingsManager = new SettingsManager();
const windowManager = new WindowManager();
const autoFocusManager = new AutoFocusManager(windowManager);
const organizerManager = new OrganizerManager(windowManager);
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

// Désactiver le cache GPU pour éviter les erreurs de cache
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-program-cache');

ipcMain.on('save-window-parameters', (event: IpcMainEvent, windowParameters: WindowParameters) => saveWindowParameters(windowParameters));
ipcMain.on('close-app', () => closeApp());
ipcMain.handle('load-settings', () => settingsManager.getAll());
ipcMain.on('save-settings', (event: IpcMainEvent, settings: Settings) => saveSettings(settings));
ipcMain.on('toggle-auto-focus', () => toggleAndSaveAutoFocus());
ipcMain.on('toggle-organizer', () => toggleAndSaveOrganizer());
ipcMain.on('change-orientation', () => changeOrientation());
ipcMain.on('set-ignore-mouse-events', (event: IpcMainEvent, ignore: boolean) => setIgnoreMouseEvents(ignore));
ipcMain.on('set-auto-focus-mode', (event: IpcMainEvent, mode: string) => setAutoFocusMode(mode));
ipcMain.handle('get-auto-focus-mode', () => autoFocusManager.getAutoFocusMode());
ipcMain.handle('select-log-file', () => selectLogFile());

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
  settingsManager.init();
  loadShortcuts();
  toggleAutoFocus();
  toggleOrganizer();
  showMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) showMainWindow();
});

function showMainWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    resizable: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    roundedCorners: false,
    hasShadow: false,
    skipTaskbar: true,
    focusable: false,   
    icon: path.join(__dirname, 'assets/images/gelutin-icon.png'),
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.setAlwaysOnTop(true, 'pop-up-menu');
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  Menu.setApplicationMenu(null);

  // Devtools
  // mainWindow.webContents.openDevTools();

  if (isDev) {
    mainWindow.loadURL('http://localhost:4200');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/Gelutin/browser/index.html'));
  }
}

function saveWindowParameters(windowParameters: WindowParameters): void {
  const settings = settingsManager.getAll();
  const existingParams = settings.windowParameters || [];
  const index = existingParams.findIndex(param => param.id === windowParameters.id);
  if (index !== -1) {
    existingParams[index] = windowParameters;
  } else {
    existingParams.push(windowParameters);
  }
  settings.windowParameters = existingParams;
  settingsManager.saveSetting('windowParameters', existingParams);
}

function closeApp(): void {
  app.quit();
}

function saveSettings(newSettings: Settings): void {
  const oldSettings = settingsManager.getAll();
  settingsManager.save(newSettings);

  if (oldSettings.autoFocusMode !== newSettings.autoFocusMode) {
    autoFocusManager.setAutoFocusMode(newSettings.autoFocusMode);
  }

  if (oldSettings.shortcuts?.nextCharacter !== newSettings.shortcuts?.nextCharacter ||
    oldSettings.shortcuts?.previousCharacter !== newSettings.shortcuts?.previousCharacter) {
    loadShortcuts();
  }

}

function loadShortcuts(): void {
  const settings = settingsManager.getAll();
  if (settings.shortcuts) {
    organizerManager.updateShortcuts(settings.shortcuts);
  }
}

function toggleAndSaveAutoFocus(): void {
  settingsManager.toggleAutoFocus();
  toggleAutoFocus();
}

function toggleAutoFocus(): void {
  const settings = settingsManager.getAll();
  if (settings.isAutoFocusActivate) {
    if (settings.autoFocusMode) {
      autoFocusManager.setAutoFocusMode(settings.autoFocusMode);
    }
    autoFocusManager.startAutoFocus();
  } else {
    autoFocusManager.stopAutoFocus();
  }
}

function toggleAndSaveOrganizer(): void {
  settingsManager.toggleOrganizer();
  toggleOrganizer();
}

function toggleOrganizer(): void {
  const settings = settingsManager.getAll();
  if (settings.isOrganizerActive) {
    organizerManager.startOrganizer();
  } else {
    organizerManager.stopOrganizer();
  }
}

function setIgnoreMouseEvents(ignore: boolean): void {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
}

function changeOrientation(): void {
  settingsManager.toggleOrientation();
}

function setAutoFocusMode(mode: string): void {
  autoFocusManager.setAutoFocusMode(mode);
}

async function selectLogFile(): Promise<string | null> {
  const settings = settingsManager.getAll();
  const currentLogPath = settings.logFilePath;

  let defaultPath: string | undefined;
  if (currentLogPath) {
    const fs = await import('fs');
    const dir = path.dirname(currentLogPath);
    // Vérifier si le dossier existe
    if (fs.existsSync(dir)) {
      defaultPath = dir;
    }
  }

  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    defaultPath: defaultPath,
    filters: [
      { name: 'Log Files', extensions: ['log'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }

  return null;
}
