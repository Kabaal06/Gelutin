import { globalShortcut } from 'electron';
import { WindowManager, WakfuWindow } from './window-manager';

interface ShortcutConfig {
  nextCharacter?: string;
  previousCharacter?: string;
}

export class OrganizerManager {
  static DEFAULT_SHORTCUTS = {
    NEXT_CHARACTER: "Tab",
    PREVIOUS_CHARACTER: "Control+Tab"
  };

  static SCAN_INTERVAL_MS = 100;

  private windowManager: WindowManager;
  private organizerInterval: NodeJS.Timeout | null;
  private isOrganizerActive: boolean;
  private activeWindow: WakfuWindow | null;
  private shortcuts: {
    nextCharacter: string;
    previousCharacter: string;
  };

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
    this.organizerInterval = null;
    this.isOrganizerActive = false;
    this.activeWindow = null;
    this.shortcuts = {
      nextCharacter: OrganizerManager.DEFAULT_SHORTCUTS.NEXT_CHARACTER,
      previousCharacter: OrganizerManager.DEFAULT_SHORTCUTS.PREVIOUS_CHARACTER
    };
  }

  updateShortcuts(newShortcuts: ShortcutConfig): void {
    if (!newShortcuts) {
      return;
    }

    const wasActive = this.isOrganizerActive && this.activeWindow;

    // Désactiver les raccourcis actuels
    if (wasActive) {
      this.unregisterShortcuts();
    }

    // Mettre à jour les raccourcis
    if (newShortcuts.nextCharacter) {
      this.shortcuts.nextCharacter = newShortcuts.nextCharacter;
    }
    if (newShortcuts.previousCharacter) {
      this.shortcuts.previousCharacter = newShortcuts.previousCharacter;
    }

    // Réactiver les raccourcis avec les nouvelles valeurs
    if (wasActive) {
      this.registerShortcuts();
    }
  }

  startOrganizer(): void {
    this.isOrganizerActive = true;
    this.windowManager.startWindowsScanning();

    this.organizerInterval = setInterval(() => {
      this.refreshActiveWindow();
    }, OrganizerManager.SCAN_INTERVAL_MS);
  }

  stopOrganizer(): void {
    this.isOrganizerActive = false;

    if (!this.organizerInterval) {
      this.unregisterShortcuts();
      return;
    }

    clearInterval(this.organizerInterval);
    this.organizerInterval = null;
    this.unregisterShortcuts();
  }

  private refreshActiveWindow(): void {
    const foregroundWakfuWindow = this.windowManager.getForegroundWakfuWindow();

    if (this.activeWindow && foregroundWakfuWindow && this.activeWindow.id === foregroundWakfuWindow.id) {
      return;
    }

    const windows = this.windowManager.getWindows();
    windows.forEach(w => w.active = false);
    const window = foregroundWakfuWindow ? windows.find(w => w.id === foregroundWakfuWindow.id) : null;

    if (this.activeWindow === window) {
      return;
    }

    this.activeWindow = window || null;

    if (!window) {
      this.unregisterShortcuts();
      return;
    }

    window.active = true;
    this.registerShortcuts();
  }

  private nextCharacter(): void {
    const foregroundWakfuWindow = this.windowManager.getForegroundWakfuWindow();
    const windows = this.windowManager.getWindows();

    if (!foregroundWakfuWindow) {
      return;
    }

    for (let i = 0; i < windows.length; i++) {
      if (foregroundWakfuWindow.id !== windows[i].id) {
        continue;
      }

      const nextActivatedWindow = this.getNextActivatedWindow(i, i);

      if (!nextActivatedWindow) {
        break;
      }

      this.windowManager.focusWindow(nextActivatedWindow);
      break;
    }
  }

  private prevCharacter(): void {
    const foregroundWakfuWindow = this.windowManager.getForegroundWakfuWindow();
    const windows = this.windowManager.getWindows();

    if (!foregroundWakfuWindow) {
      return;
    }

    for (let i = 0; i < windows.length; i++) {
      if (foregroundWakfuWindow.id !== windows[i].id) {
        continue;
      }

      const previousActivatedWindow = this.getPreviousActivatedWindow(i, i);

      if (!previousActivatedWindow) {
        break;
      }

      this.windowManager.focusWindow(previousActivatedWindow);
      break;
    }
  }

  private getNextActivatedWindow(windowIndex: number, initialIndex: number): WakfuWindow | null {
    const windows = this.windowManager.getWindows();
    let nextIndex = windowIndex + 1;

    if (nextIndex >= windows.length) {
      nextIndex = 0;
    }

    if (nextIndex === initialIndex) {
      return null;
    }

    if (!windows[nextIndex].disabled) {
      return windows[nextIndex];
    }

    return this.getNextActivatedWindow(nextIndex, initialIndex);
  }

  private getPreviousActivatedWindow(windowIndex: number, initialIndex: number): WakfuWindow | null {
    const windows = this.windowManager.getWindows();
    let prevIndex = windowIndex - 1;

    if (prevIndex < 0) {
      prevIndex = windows.length - 1;
    }

    if (prevIndex === initialIndex) {
      return null;
    }

    if (!windows[prevIndex].disabled) {
      return windows[prevIndex];
    }

    return this.getPreviousActivatedWindow(prevIndex, initialIndex);
  }

  private registerShortcuts(): void {
    if (!globalShortcut.isRegistered(this.shortcuts.nextCharacter)) {
      globalShortcut.register(this.shortcuts.nextCharacter, () => {
        this.nextCharacter();
      });
    }

    if (!globalShortcut.isRegistered(this.shortcuts.previousCharacter)) {
      globalShortcut.register(this.shortcuts.previousCharacter, () => {
        this.prevCharacter();
      });
    }
  }

  private unregisterShortcuts(): void {
    if (globalShortcut.isRegistered(this.shortcuts.nextCharacter)) {
      globalShortcut.unregister(this.shortcuts.nextCharacter);
    }

    if (globalShortcut.isRegistered(this.shortcuts.previousCharacter)) {
      globalShortcut.unregister(this.shortcuts.previousCharacter);
    }
  }

  isActive(): boolean {
    return this.isOrganizerActive;
  }
}
