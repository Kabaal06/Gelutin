import koffi from 'koffi';

// Chargement des DLLs
export const user32 = koffi.load('user32.dll');
export const gdi32 = koffi.load('gdi32.dll');

// Types Windows
export const DWORD = koffi.alias('DWORD', 'uint32_t');
export const HANDLE = koffi.pointer('HANDLE', koffi.opaque());
export const HWND = koffi.alias('HWND', HANDLE);
export const HDC = koffi.alias('HDC', HANDLE);
export const HBITMAP = koffi.alias('HBITMAP', HANDLE);
export const HGDIOBJ = koffi.alias('HGDIOBJ', HANDLE);

// Constantes Windows
export const VK_CONTROL = 0x11;
export const VK_F11 = 0x7A;
export const KEYEVENTF_KEYUP = 0x0002;
export const SRCCOPY = 0x00CC0020;

// Fonctions user32
export const FindWindowEx = user32.func('HWND __stdcall FindWindowExW(HWND hWndParent, HWND hWndChildAfter, const char16_t *lpszClass, const char16_t *lpszWindow)');
export const GetWindowThreadProcessId = user32.func('DWORD __stdcall GetWindowThreadProcessId(HWND hWnd, _Out_ DWORD *lpdwProcessId)');
export const GetWindowText = user32.func('int __stdcall GetWindowTextA(HWND hWnd, _Out_ uint8_t *lpString, int nMaxCount)');
export const GetForegroundWindow = user32.func('HWND __stdcall GetForegroundWindow()');
export const SetForegroundWindow = user32.func('bool __stdcall SetForegroundWindow(HWND hWnd)');
export const SendInput = user32.func('uint32_t __stdcall SendInput(uint32_t cInputs, void* pInputs, int cbSize)');
export const GetWindowRect = user32.func('bool __stdcall GetWindowRect(HWND hWnd, _Out_ void* lpRect)');
export const GetDC = user32.func('HDC __stdcall GetDC(HWND hWnd)');
export const ReleaseDC = user32.func('int __stdcall ReleaseDC(HWND hWnd, HDC hDC)');

// Fonctions gdi32
export const CreateCompatibleDC = gdi32.func('HDC __stdcall CreateCompatibleDC(HDC hdc)');
export const CreateCompatibleBitmap = gdi32.func('HBITMAP __stdcall CreateCompatibleBitmap(HDC hdc, int cx, int cy)');
export const SelectObject = gdi32.func('HGDIOBJ __stdcall SelectObject(HDC hdc, HGDIOBJ h)');
export const BitBlt = gdi32.func('bool __stdcall BitBlt(HDC hdc, int x, int y, int cx, int cy, HDC hdcSrc, int x1, int y1, DWORD rop)');
export const GetPixel = gdi32.func('uint32_t __stdcall GetPixel(HDC hdc, int x, int y)');
export const DeleteObject = gdi32.func('bool __stdcall DeleteObject(HGDIOBJ ho)');
export const DeleteDC = gdi32.func('bool __stdcall DeleteDC(HDC hdc)');
