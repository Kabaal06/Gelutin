import { Component, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragEnd, CdkDragHandle } from '@angular/cdk/drag-drop';
import { SettingsService } from '../services/settings.service';
import { FormsModule } from '@angular/forms';
import { WindowParameters } from '@common/models/settings';
import { SettingsComponent } from '../settings/settings';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatTooltipModule,
    MatDialogModule,
    CdkDrag,
    CdkDragHandle
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  isCollapsed = false;
  hasBeenDragged = false;
  isSettingsOpen = false;
  windowParameters = signal<WindowParameters>({ id: 'mainWindow', x: 0, y: 0 });

  constructor(public settingsService: SettingsService, private dialog: MatDialog) {
    effect(() => {
      const savedPosition = this.settingsService.windowParametersMap().get('mainWindow');
      if (savedPosition) {
        this.windowParameters.set({ id: 'mainWindow', x: savedPosition.x, y: savedPosition.y });
      }
    });
  }

  toggleCollapse() {
    if (!this.hasBeenDragged) {
      if (this.isCollapsed) {
        this.isCollapsed = false;
      } else {
        this.isCollapsed = true;
      }
    } else {
      this.hasBeenDragged = false;
    }
  }

  stopDrag(event: CdkDragEnd) {
    this.hasBeenDragged = true;
    const position = event.source.getFreeDragPosition();
    this.windowParameters.set({ id: 'mainWindow', x: position.x, y: position.y });
    (window as any).electronAPI.dragWindowStop(this.windowParameters());
  }

   openSettings() {
    this.isSettingsOpen = true;
    (window as any).electronAPI.setIgnoreMouseEvents(false);
    (window as any).electronAPI.toggleFocusable(true);
    const dialogRef = this.dialog.open(SettingsComponent, {
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      this.isSettingsOpen = false;
      (window as any).electronAPI.toggleFocusable(false);
      (window as any).electronAPI.setIgnoreMouseEvents(true);
    });
  }

  changeOrientation() {
    (window as any).electronAPI.changeOrientation();
  }

  toggleAutoFocus() {
    (window as any).electronAPI.toggleAutoFocus();
  }

  toggleOrganizer() {
    (window as any).electronAPI.toggleOrganizer();
  }

  closeApp() {
    (window as any).electronAPI.closeApp();
  }

  onButtonContainerEnter() {
    (window as any).electronAPI.setIgnoreMouseEvents(false);
  }

  onButtonContainerLeave() {
    if (!this.isSettingsOpen) {
      (window as any).electronAPI.setIgnoreMouseEvents(true);
    }
  }
}
