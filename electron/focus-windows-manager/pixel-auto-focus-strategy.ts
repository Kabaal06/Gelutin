import {
  GetDC,
  ReleaseDC,
  CreateCompatibleDC,
  CreateCompatibleBitmap,
  SelectObject,
  BitBlt,
  GetPixel,
  DeleteObject,
  DeleteDC,
  SRCCOPY
} from './windows-api';
import { AutoFocusDetectionStrategy } from './auto-focus-detection-strategy';
import { WakfuWindow } from './window-manager';

export class PixelAutoFocusStrategy extends AutoFocusDetectionStrategy {
  static PIXEL_DETECTION = {
    REFERENCE_WIDTH: 2560,
    REFERENCE_HEIGHT: 1440,
    ZONE: {
      x: 2534,
      y: 1370,
      width: 12,
      height: 10
    },
    TURN_COLORS: [
      0x26201D,   // #1D2026 (R=29, G=32, B=38 -> BGR: B=38, G=32, R=29 -> 0x26201D)
      0x1C170B,   // #1C171B (R=28, G=23, B=27 -> BGR: B=27, G=23, R=28 -> 0x1C170B)
    ],
    COLOR_TOLERANCE: 0,
    MATCH_THRESHOLD: 0.3,
    INVALID_PIXEL: 0xFFFFFFFF
  };

  detectTurn(window: WakfuWindow): boolean {
    return this.detectTurnByPixels(window.hwnd);
  }

  private detectTurnByPixels(hwnd: any): boolean {
    if (!hwnd) {
      return false;
    }

    try {
      const rect = this.windowManager.getWindowRect(hwnd);

      if (!rect) {
        return false;
      }

      const windowWidth = rect.right - rect.left;
      const windowHeight = rect.bottom - rect.top;
      const zoneX = windowWidth - (PixelAutoFocusStrategy.PIXEL_DETECTION.REFERENCE_WIDTH - PixelAutoFocusStrategy.PIXEL_DETECTION.ZONE.x);
      const zoneY = windowHeight - (PixelAutoFocusStrategy.PIXEL_DETECTION.REFERENCE_HEIGHT - PixelAutoFocusStrategy.PIXEL_DETECTION.ZONE.y);
      console.log('Zone de détection des pixels:', {
        x: zoneX,
        y: zoneY,
        width: PixelAutoFocusStrategy.PIXEL_DETECTION.ZONE.width,
        height: PixelAutoFocusStrategy.PIXEL_DETECTION.ZONE.height
      });
      const zone = {
        x: Math.floor(zoneX),
        y: Math.floor(zoneY),
        width: Math.floor(PixelAutoFocusStrategy.PIXEL_DETECTION.ZONE.width),
        height: Math.floor(PixelAutoFocusStrategy.PIXEL_DETECTION.ZONE.height)
      };

      const windowDC = GetDC(hwnd);

      if (!windowDC) {
        return false;
      }

      const memDC = CreateCompatibleDC(windowDC);

      if (!memDC) {
        ReleaseDC(hwnd, windowDC);
        return false;
      }

      const bitmap = CreateCompatibleBitmap(windowDC, windowWidth, windowHeight);

      if (!bitmap) {
        DeleteDC(memDC);
        ReleaseDC(hwnd, windowDC);
        return false;
      }

      const oldBitmap = SelectObject(memDC, bitmap);

      const blitResult = BitBlt(memDC, 0, 0, windowWidth, windowHeight, windowDC, 0, 0, SRCCOPY);

      if (!blitResult) {
        SelectObject(memDC, oldBitmap);
        DeleteObject(bitmap);
        DeleteDC(memDC);
        ReleaseDC(hwnd, windowDC);
        return false;
      }

      let matchCount = 0;
      let totalPixels = 0;
      const requiredMatches = Math.ceil((zone.width * zone.height) * PixelAutoFocusStrategy.PIXEL_DETECTION.MATCH_THRESHOLD);

      // Optimisation: sortie anticipée si on atteint le seuil
      for (let x = zone.x; x < zone.x + zone.width; x++) {
        for (let y = zone.y; y < zone.y + zone.height; y++) {
          totalPixels++;
          const pixel = GetPixel(memDC, x, y);

          if (pixel === PixelAutoFocusStrategy.PIXEL_DETECTION.INVALID_PIXEL) {
            continue;
          }

          // Avec tolérance 0, comparaison directe (plus rapide)
          if (PixelAutoFocusStrategy.PIXEL_DETECTION.COLOR_TOLERANCE === 0) {
            for (const targetColor of PixelAutoFocusStrategy.PIXEL_DETECTION.TURN_COLORS) {
              if (pixel === targetColor) {
                matchCount++;
                // Sortie anticipée si on a déjà assez de correspondances
                if (matchCount >= requiredMatches) {
                  SelectObject(memDC, oldBitmap);
                  DeleteObject(bitmap);
                  DeleteDC(memDC);
                  ReleaseDC(hwnd, windowDC);
                  return true;
                }
                break;
              }
            }
          } else {
            for (const targetColor of PixelAutoFocusStrategy.PIXEL_DETECTION.TURN_COLORS) {
              if (this.colorsMatch(pixel, targetColor)) {
                matchCount++;
                if (matchCount >= requiredMatches) {
                  SelectObject(memDC, oldBitmap);
                  DeleteObject(bitmap);
                  DeleteDC(memDC);
                  ReleaseDC(hwnd, windowDC);
                  return true;
                }
                break;
              }
            }
          }
        }
      }

      const matchRatio = matchCount / totalPixels;
      const turnDetected = matchRatio >= PixelAutoFocusStrategy.PIXEL_DETECTION.MATCH_THRESHOLD;

      SelectObject(memDC, oldBitmap);
      DeleteObject(bitmap);
      DeleteDC(memDC);
      ReleaseDC(hwnd, windowDC);

      return turnDetected;

    } catch (error) {
      console.error('Erreur detectTurnByPixels:', error);
      return false;
    }
  }

  private colorsMatch(color1: number, color2: number): boolean {
    const r1 = (color1 >> 0) & 0xFF;
    const g1 = (color1 >> 8) & 0xFF;
    const b1 = (color1 >> 16) & 0xFF;

    const r2 = (color2 >> 0) & 0xFF;
    const g2 = (color2 >> 8) & 0xFF;
    const b2 = (color2 >> 16) & 0xFF;

    const distance = Math.sqrt(
      Math.pow(r1 - r2, 2) +
      Math.pow(g1 - g2, 2) +
      Math.pow(b1 - b2, 2)
    );

    return distance <= PixelAutoFocusStrategy.PIXEL_DETECTION.COLOR_TOLERANCE;
  }
}

