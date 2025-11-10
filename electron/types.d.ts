// Types pour l'API Electron exposée au renderer via contextBridge
export interface ElectronAPI {
  dragWindowStop: (windowParameters: any) => void;
  closeApp: () => void;
  loadSettings: () => Promise<any>;
  saveSettings: (settings: any) => void;
  onSettingsChanged: (callback: (settings: any) => void) => void;
  toggleAutoFocus: () => void;
  toggleOrganizer: () => void;
  changeOrientation: () => void;
  setIgnoreMouseEvents: (ignore: boolean) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
