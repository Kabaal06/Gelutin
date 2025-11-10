import {Component, OnInit} from '@angular/core';
import {RouterModule} from '@angular/router';
import {SettingsService} from './services/settings.service';
import { Settings } from '@common/models/settings';
import { Home } from './home/home';

@Component({
  selector: 'app-root',
  imports: [
    RouterModule,
    Home
],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {

  settings: Settings | null = null;

  constructor(private storageService: SettingsService) {}

  async ngOnInit() {
    this.settings = await this.storageService.loadSettings();
  }

}
