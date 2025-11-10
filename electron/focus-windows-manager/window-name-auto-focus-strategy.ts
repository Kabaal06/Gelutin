import { AutoFocusDetectionStrategy } from './auto-focus-detection-strategy';
import { WakfuWindow, WindowManager } from './window-manager';

export class WindowNameAutoFocusStrategy extends AutoFocusDetectionStrategy {
  private lastWindows: WakfuWindow[];

  constructor(windowManager: WindowManager) {
    super(windowManager);
    this.lastWindows = windowManager.getWindows();
  }

  detectTurn(window: WakfuWindow): boolean {
    return this.detectTurnByWindowNameChange(window);
  }

  private detectTurnByWindowNameChange(window: WakfuWindow): boolean {
    if (!window || !window.title) {
      return false;
    }

    const currentWindows = this.windowManager.getWindows();
    const previousWindow = this.lastWindows.find(w => w.id === window.id);

    if (!previousWindow || previousWindow.character !== window.character) {
      this.lastWindows = currentWindows;
      return true;
    }

    return false;
  }
}
