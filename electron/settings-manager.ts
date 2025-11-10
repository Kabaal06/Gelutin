import { Settings } from '../src/common/models/settings';
import { BrowserWindow } from 'electron';
import ElectronStore from 'electron-store';
import * as path from 'path';

type StoreType = {
  settings?: Settings;
  [key: string]: any;
};

export class SettingsManager {
  private store: any; // ElectronStore<StoreType>
  private settings: Settings;
  private DEFAULT_SETTINGS: Settings;

  constructor() {
    this.store = new ElectronStore<StoreType>();
    this.settings = {} as Settings;

    this.DEFAULT_SETTINGS = {
      isAutoFocusActivate: false,
      isOrganizerActive: false,
      isContainerHorizontal: true,
      isCharacterListDirectionInverted: false,
      autoFocusMode: 'PIXEL', // ou WINDOW_NAME
      shortcuts: {
        nextCharacter: "Tab",
        previousCharacter: "Control+Tab"
      }
    };
  }

  /**
   * Initialise les settings avec des valeurs par défaut si nécessaire
   */
  init(): void {
    if (!this.store.get('settings')) {
      this.save(this.DEFAULT_SETTINGS);
      this.load();
    } else {
      this.load();
      this.checkAndSetDefaults();
    }
  }

  /**
   * Vérifie et ajoute les settings manquants avec les valeurs par défaut
   */
  private checkAndSetDefaults(): void {
    let updated = false;
    for (const [key, value] of Object.entries(this.DEFAULT_SETTINGS)) {
      if (this.settings[key] === undefined) {
        this.settings[key] = value;
        updated = true;
      }
    }

    if (updated) {
      this.save(this.settings);
    }
  }

  /**
   * Charge les settings depuis le store
   * @returns Les settings actuels
   */
  load(): Settings {
    this.settings = this.store.get('settings') as Settings;
    return this.settings;
  }

  /**
   * Sauvegarde l'ensemble des settings
   * @param settings - L'objet settings complet
   */
  save(settings: Settings): void {
    this.store.set('settings', settings);
    this.load();
    this.notifyChanged();
  }

  /**
   * Sauvegarde un setting individuel
   * @param key - Nom du setting
   * @param value - Valeur du setting
   */
  saveSetting(key: string, value: any): void {
    this.store.set('settings.' + key, value);
    this.load();
    this.notifyChanged();
  }

  /**
   * Récupère un setting individuel
   * @param key - Nom du setting
   * @returns La valeur du setting
   */
  get(key: string): any {
    return this.settings[key];
  }

  /**
   * Récupère tous les settings
   * @returns Tous les settings
   */
  getAll(): Settings {
    return this.settings;
  }

  /**
   * Notifie toutes les fenêtres ouvertes que les settings ont changé
   */
  private notifyChanged(): void {
    const allWindows = BrowserWindow.getAllWindows();
    allWindows.forEach(window => {
      window.webContents.send('settings-changed', this.settings);
    });
  }

  /**
   * Toggle l'auto-focus
   */
  toggleAutoFocus(): void {
    this.saveSetting('isAutoFocusActivate', !this.settings.isAutoFocusActivate);
  }

  /**
   * Toggle l'organizer
   */
  toggleOrganizer(): void {
    this.saveSetting('isOrganizerActive', !this.settings.isOrganizerActive);
  }

  /**
   * Toggle l'orientation du container
   */
  toggleOrientation(): void {
    this.saveSetting('isContainerHorizontal', !this.settings.isContainerHorizontal);
  }
}
