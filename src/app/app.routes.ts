import { Routes } from '@angular/router';
import { NamazTimingsComponent } from './namaz-timings/namaz-timings.component';
import { StreakComponent } from './streak/streak.component';

export const routes: Routes = [
    { path: '', redirectTo: 'streak', pathMatch: 'full' },
    { path: 'streak', component: StreakComponent },
    { path: 'namaztimings', component: NamazTimingsComponent }
    // { path: 'settings', component: SettingsComponent }
  ];
