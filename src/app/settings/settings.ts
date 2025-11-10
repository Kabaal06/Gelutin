import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SettingsService } from '../services/settings.service';
import { Settings } from '@common/models/settings';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-settings',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatRadioModule,
    MatTooltipModule
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent {
  localSettings: Settings = {
    isAutoFocusActivate: false,
    isOrganizerActive: false,
    isContainerHorizontal: false,
    autoFocusMode: '',
    shortcuts: { nextCharacter: '', previousCharacter: '' }
  };
  recordingShortcut: string | null = null;

  constructor(public settingsService: SettingsService, private dialogRef: MatDialogRef<SettingsComponent>) {
    this.loadSettings();
  }

  async loadSettings() {
    await this.settingsService.loadSettings();
    const settings = this.settingsService.settings();
    if (settings) {
      this.localSettings = JSON.parse(JSON.stringify(settings));
    }
  }

  truncatePath(filePath: string | undefined, maxLength: number = 40): string {
    if (!filePath) {
      return '';
    }

    if (filePath.length <= maxLength) {
      return filePath;
    }

    const ellipsis = '...';
    const charsToShow = maxLength - ellipsis.length;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);

    return filePath.substring(0, frontChars) + ellipsis + filePath.substring(filePath.length - backChars);
  }

  startRecordingShortcut(shortcutName: 'nextCharacter' | 'previousCharacter') {
    this.recordingShortcut = shortcutName;
  }

  stopRecording() {
    this.recordingShortcut = null;
  }

  onShortcutKeyDown(event: KeyboardEvent, shortcutName: 'nextCharacter' | 'previousCharacter') {
    if (this.recordingShortcut !== shortcutName) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // Si c'est Escape, annuler l'enregistrement
    if (event.key === 'Escape') {
      this.stopRecording();
      return;
    }

    const keys: string[] = [];

    // Ajouter les modificateurs
    if (event.ctrlKey) keys.push('Control');
    if (event.shiftKey) keys.push('Shift');
    if (event.altKey) keys.push('Alt');
    if (event.metaKey) keys.push('Meta');

    // Ajouter la touche principale si ce n'est pas une touche de modification seule
    const mainKey = event.key;
    if (!['Control', 'Shift', 'Alt', 'Meta', 'AltGraph'].includes(mainKey)) {
      // Normaliser certaines touches
      const normalizedKey = this.normalizeKey(mainKey);
      if (normalizedKey) {
        keys.push(normalizedKey);
      }
    }

    // Enregistrer seulement si on a au moins une touche non-modificateur
    // ou si c'est une combinaison avec modificateurs
    if (keys.length > 0 && !['Control', 'Shift', 'Alt', 'Meta'].includes(keys[keys.length - 1])) {
      const shortcut = keys.join('+');
      if (!this.localSettings.shortcuts) {
        this.localSettings.shortcuts = { nextCharacter: '', previousCharacter: '' };
      }
      this.localSettings.shortcuts[shortcutName] = shortcut;
      this.stopRecording();
    }
  }

  onShortcutClick(event: MouseEvent, shortcutName: 'nextCharacter' | 'previousCharacter') {
    // Réactiver l'enregistrement même si le champ a déjà le focus
    event.preventDefault();
    this.startRecordingShortcut(shortcutName);
  }

  normalizeKey(key: string): string {
    const keyMap: { [key: string]: string } = {
      ' ': 'Space',
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right',
      'Escape': 'Esc',
    };

    return keyMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
  }

  isRecording(shortcutName: string): boolean {
    return this.recordingShortcut === shortcutName;
  }

  async saveSettings() {
    await this.settingsService.saveSettings(this.localSettings);
    this.dialogRef.close();
  }

  closeSettings() {
    this.dialogRef.close();
  }
}
