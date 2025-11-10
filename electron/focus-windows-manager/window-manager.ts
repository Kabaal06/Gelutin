import { globalShortcut } from 'electron';
import {
  FindWindowEx,
  GetWindowThreadProcessId,
  GetWindowText,
  GetForegroundWindow,
  SetForegroundWindow,
  SendInput,
  GetWindowRect,
  VK_CONTROL,
  VK_F11,
  KEYEVENTF_KEYUP
} from './windows-api';
import koffi from 'koffi';

export interface WakfuWindow {
  id: number | null;
  hwnd: any;
  title: string;
  character: string;
  classe: string;
  disabled: boolean;
  active?: boolean;
  activate?: boolean;
}

interface WindowRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export class WindowManager {
  static WAKFU_CONFIG = {
    CLASS_NAME: 'SunAwtFrame',
    SCAN_INTERVAL_MS: 100,
    TITLE_SEPARATOR: ' - '
  };

  static BUFFER_SIZES = {
    WINDOW_TEXT: 1024,
    RECT: 16
  };

  static INPUT_STRUCT_SIZE = {
    X86: 28,
    X64: 40
  };

  static DEFAULT_SHORTCUTS = {
    HACK_FOCUS: "Control+F11"
  };

  private windows: WakfuWindow[];
  private getWakfuWindowsInterval: NodeJS.Timeout | null;

  constructor() {
    this.windows = [];
    this.getWakfuWindowsInterval = null;
  }

  startWindowsScanning(): void {
    if (this.getWakfuWindowsInterval) {
      return;
    }

    this.getWakfuWindowsInterval = setInterval(() => {
      this.getWakfuWindows();
    }, WindowManager.WAKFU_CONFIG.SCAN_INTERVAL_MS);
  }

  stopWindowsScanning(): void {
    if (!this.getWakfuWindowsInterval) {
      return;
    }

    clearInterval(this.getWakfuWindowsInterval);
    this.getWakfuWindowsInterval = null;
  }

  async getWakfuWindows(): Promise<void> {
    const searchWindows: WakfuWindow[] = [];

    for (let hwnd: any = null; ;) {
      hwnd = FindWindowEx(0, hwnd, WindowManager.WAKFU_CONFIG.CLASS_NAME, null);

      if (!hwnd) {
        break;
      }

      const pid = this.getPidFromHwnd(hwnd);
      if (!pid) {
        continue;
      }

      const title = this.getTitleFromHwnd(hwnd);
      if (!title) {
        continue;
      }

      const titleSplit = title.split(WindowManager.WAKFU_CONFIG.TITLE_SEPARATOR);

      if (titleSplit.length > 1) {
        searchWindows.unshift({
          id: pid,
          hwnd: hwnd,
          title: title,
          character: titleSplit[0],
          classe: "Wakfu",
          disabled: false
        });
        continue;
      }

      if (title.includes("WAKFU")) {
        searchWindows.unshift({
          id: pid,
          hwnd: hwnd,
          title: "Wakfu",
          character: "Wakfu",
          classe: "Wakfu",
          disabled: false
        });
      }
    }

    this.addNewWindowsToList(searchWindows);
  }

  private addNewWindowsToList(searchWindows: WakfuWindow[]): void {
    const oldWindowsMap = new Map(this.windows.map(w => [w.id, w]));
    const newWindowsMap = new Map(searchWindows.map(w => [w.id, w]));

    let hasChanged = false;
    const updatedWindows: WakfuWindow[] = [];

    for (const oldWin of this.windows) {
      if (!newWindowsMap.has(oldWin.id)) {
        hasChanged = true;
        continue;
      }

      const newWin = newWindowsMap.get(oldWin.id)!;
      updatedWindows.push(newWin);

      const infoChanged = oldWin.title !== newWin.title ||
        oldWin.character !== newWin.character ||
        oldWin.classe !== newWin.classe;

      if (infoChanged) {
        hasChanged = true;
      }
    }

    for (const [id, newWin] of newWindowsMap.entries()) {
      if (oldWindowsMap.has(id)) {
        continue;
      }

      updatedWindows.push(newWin);
      hasChanged = true;
    }

    if (!hasChanged) {
      return;
    }

    this.windows = updatedWindows;
  }

  getPidFromHwnd(hwnd: any): number | null {
    const ptr: any[] = [null];
    const tid = GetWindowThreadProcessId(hwnd, ptr);

    if (!tid) {
      return null;
    }

    return ptr[0];
  }

  getTitleFromHwnd(hwnd: any): string | null {
    const buf = Buffer.allocUnsafe(WindowManager.BUFFER_SIZES.WINDOW_TEXT);
    const length = GetWindowText(hwnd, buf, buf.length);

    if (!length) {
      return null;
    }

    return koffi.decode(buf, 'char', length);
  }

  getWindowRect(hwnd: any): WindowRect | null {
    const buf = Buffer.alloc(WindowManager.BUFFER_SIZES.RECT);

    if (!GetWindowRect(hwnd, buf)) {
      return null;
    }

    return {
      left: buf.readInt32LE(0),
      top: buf.readInt32LE(4),
      right: buf.readInt32LE(8),
      bottom: buf.readInt32LE(12)
    };
  }

  async focusWindow(window: WakfuWindow): Promise<void> {
    const win = this.windows.find(w => w.id === window.id);

    if (!win) {
      return;
    }

    this.windows.forEach(w => w.activate = false);
    win.activate = true;

    if (!win.hwnd) {
      return;
    }

    SetForegroundWindow(win.hwnd);
  }

  hackShortcutFocusWindow(window: WakfuWindow): void {
    if (globalShortcut.isRegistered(WindowManager.DEFAULT_SHORTCUTS.HACK_FOCUS)) {
      globalShortcut.unregister(WindowManager.DEFAULT_SHORTCUTS.HACK_FOCUS);
    }

    globalShortcut.register(WindowManager.DEFAULT_SHORTCUTS.HACK_FOCUS, () => {
      this.focusWindow(window);
    });

    this.sendCtrlF11_via_SendInput();
  }

  private getInputStructSize(): number {
    const isX64 = process.arch === 'x64' || process.arch === 'arm64';
    return isX64 ? WindowManager.INPUT_STRUCT_SIZE.X64 : WindowManager.INPUT_STRUCT_SIZE.X86;
  }

  private sendCtrlF11_via_SendInput(): void {
    const INPUT_SIZE = this.getInputStructSize();

    const downCtrlBuf = this.buildKeyboardInputBuffer(VK_CONTROL, 0);
    const downF11Buf = this.buildKeyboardInputBuffer(VK_F11, 0);
    const upF11Buf = this.buildKeyboardInputBuffer(VK_F11, KEYEVENTF_KEYUP);
    const upCtrlBuf = this.buildKeyboardInputBuffer(VK_CONTROL, KEYEVENTF_KEYUP);

    const totalBuf = Buffer.concat([downCtrlBuf, downF11Buf, upF11Buf, upCtrlBuf]);

    try {
      const sent = SendInput(4, totalBuf, INPUT_SIZE);

      if (!sent || sent === 0) {
        console.warn('SendInput returned 0 — échec. GetLastError possible.');
      }
    } catch (err) {
      console.error('SendInput error', err);
    }
  }

  private buildKeyboardInputBuffer(vkCode: number, flags: number = 0): Buffer {
    const is64 = (process.arch === 'x64' || process.arch === 'arm64');
    const INPUT_SIZE = this.getInputStructSize();

    const buf = Buffer.alloc(INPUT_SIZE);

    buf.writeUInt32LE(1, 0);

    if (is64) {
      buf.writeUInt16LE(vkCode & 0xFFFF, 8);
      buf.writeUInt16LE(0, 10);
      buf.writeUInt32LE(flags, 12);
      buf.writeUInt32LE(0, 16);
    } else {
      buf.writeUInt16LE(vkCode & 0xFFFF, 4);
      buf.writeUInt16LE(0, 6);
      buf.writeUInt32LE(flags, 8);
      buf.writeUInt32LE(0, 12);
    }

    return buf;
  }

  getForegroundWakfuWindow(): WakfuWindow | null {
    const foregroundHwnd = GetForegroundWindow();
    
    if (!foregroundHwnd) {
      return null;
    }

    const foregroundAddr = koffi.address(foregroundHwnd);
    const wakfuWindow = this.windows.find(w => koffi.address(w.hwnd) === foregroundAddr);

    return wakfuWindow || null;
  }

  getWindows(): WakfuWindow[] {
    return this.windows;
  }
}
