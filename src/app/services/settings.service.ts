import { computed, Injectable, signal } from '@angular/core';
import { Settings } from '@common/models/settings';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private electronAPI = (window as any).electronAPI;
  settings = signal<Settings | null>(null);
  windowParametersMap = computed(() => {
    return new Map<string, any>(
      (this.settings()?.windowParameters || []).map((param: any) => [param.id, param])
    );
  });

  constructor() {
    this.setupElectronListener();
    this.loadSettings();
  }

  private setupElectronListener() {
    if (this.electronAPI?.onSettingsChanged) {
      this.electronAPI.onSettingsChanged((settings: Settings) => {
        this.settings.set(settings);
      });
    }
  }

  async loadSettings(): Promise<any> {
    try {
      const test = await this.electronAPI.loadSettings();
      this.settings.set(test);
    } catch (error) {
      console.error("❌ Erreur chargement settings :", error);
    }
  }

  async saveSettings(settings: Settings): Promise<any> {
    try {
      const result = await this.electronAPI.saveSettings(settings);
    } catch (error) {
      console.error("❌ Erreur sauvegarde settings :", error);
      return false;
    }
  }
}
