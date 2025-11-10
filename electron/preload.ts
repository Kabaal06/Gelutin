import { WindowParameters } from '../src/common/models/settings';
import { contextBridge, ipcRenderer } from 'electron';

// Expose les APIs Electron au renderer de manière sécurisée
contextBridge.exposeInMainWorld('electronAPI', {
  dragWindowStop: (windowParameters: WindowParameters) => ipcRenderer.send('save-window-parameters', windowParameters),
  closeApp: () => ipcRenderer.send('close-app'),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings: any) => ipcRenderer.send('save-settings', settings),
  onSettingsChanged: (callback: (settings: any) => void) => {
    ipcRenderer.on('settings-changed', (event, settings) => {
      callback(settings);
    });
  },
  toggleAutoFocus: () => ipcRenderer.send('toggle-auto-focus'),
  toggleOrganizer: () => ipcRenderer.send('toggle-organizer'),
  changeOrientation: () => ipcRenderer.send('change-orientation'),
  setIgnoreMouseEvents: (ignore: boolean) => ipcRenderer.send('set-ignore-mouse-events', ignore),
  toggleFocusable: (focusable: boolean) => ipcRenderer.send('toggle-focusable', focusable)
});
