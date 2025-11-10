import { WindowManager, WakfuWindow } from './window-manager'

export abstract class AutoFocusDetectionStrategy {
  protected windowManager: WindowManager;

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
  }

  abstract detectTurn(window: WakfuWindow): boolean;
}
