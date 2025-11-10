import { PixelAutoFocusStrategy } from './pixel-auto-focus-strategy';
import { WindowNameAutoFocusStrategy } from './window-name-auto-focus-strategy';
import { WindowManager, WakfuWindow } from './window-manager';
import { AutoFocusDetectionStrategy } from './auto-focus-detection-strategy';

export class AutoFocusManager {
  static AUTO_FOCUS_MODES = {
    PIXEL: 'PIXEL',
    WINDOW_NAME: 'WINDOW_NAME'
  };

  static SCAN_INTERVAL_MS = 100;

  private windowManager: WindowManager;
  private autoFocusInterval: NodeJS.Timeout | null;
  private isAutoFocusActive: boolean;
  private lastFocusedWindowId: number | null;
  private focusCombatWindow: WakfuWindow | null;
  private autoFocusMode: string;
  private focusStrategy: AutoFocusDetectionStrategy;

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
    this.autoFocusInterval = null;
    this.isAutoFocusActive = false;
    this.lastFocusedWindowId = null;
    this.focusCombatWindow = null;
    this.autoFocusMode = AutoFocusManager.AUTO_FOCUS_MODES.PIXEL;
    this.focusStrategy = this.createFocusStrategy(this.autoFocusMode);
  }

  private createFocusStrategy(mode: string): AutoFocusDetectionStrategy {
    switch (mode) {
      case AutoFocusManager.AUTO_FOCUS_MODES.PIXEL:
        return new PixelAutoFocusStrategy(this.windowManager);
      case AutoFocusManager.AUTO_FOCUS_MODES.WINDOW_NAME:
        return new WindowNameAutoFocusStrategy(this.windowManager);
      default:
        return new PixelAutoFocusStrategy(this.windowManager);
    }
  }

  setAutoFocusMode(mode: string): void {
    if (!Object.values(AutoFocusManager.AUTO_FOCUS_MODES).includes(mode)) {
      throw new Error(`Invalid auto focus mode: ${mode}`);
    }

    this.autoFocusMode = mode;
    this.focusStrategy = this.createFocusStrategy(mode);
  }

  getAutoFocusMode(): string {
    return this.autoFocusMode;
  }

  startAutoFocus(): void {
    this.isAutoFocusActive = true;
    this.windowManager.startWindowsScanning();

    this.autoFocusInterval = setInterval(() => {
      this.detectAndFocusTurnWindows();
    }, AutoFocusManager.SCAN_INTERVAL_MS);
  }

  stopAutoFocus(): void {
    this.isAutoFocusActive = false;

    if (!this.autoFocusInterval) {
      return;
    }

    clearInterval(this.autoFocusInterval);
    this.autoFocusInterval = null;
  }

  private detectAndFocusTurnWindows(): void {
    const windows = this.windowManager.getWindows();

    if (windows.length === 0) {
      return;
    }

    const foregroundWakfuWindow = this.windowManager.getForegroundWakfuWindow();

    // Vérifier si la fenêtre active est une fenêtre Wakfu
    if (!foregroundWakfuWindow) {
      return;
    }

    for (const window of windows) {
      if (window.id === foregroundWakfuWindow.id || window.id === this.lastFocusedWindowId) {
        continue;
      }

      if (!this.focusStrategy.detectTurn(window)) {
        continue;
      }

      this.lastFocusedWindowId = window.id;
      this.focusCombatWindow = window;
      this.windowManager.hackShortcutFocusWindow(window);
      break;
    }
  }
}
