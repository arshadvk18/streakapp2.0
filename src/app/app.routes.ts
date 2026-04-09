import { Routes } from '@angular/router';
import { NamazTimingsComponent } from './namaz-timings/namaz-timings.component';
import { StreakComponent } from './streak/streak.component';
import { AuthComponent } from './auth/auth.component';
import { QiblaFinderComponent } from './qibla-finder/qibla-finder.component';
import { SettingsComponent } from './settings/settings.component';
import { NotificationPreferencesComponent } from './settings/notification-preferences.component';
import { WordOfTheDayComponent } from './word-of-the-day/word-of-the-day.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'auth', component: AuthComponent },
    { path: '', redirectTo: 'streak', pathMatch: 'full' },
    { path: 'streak', component: StreakComponent, canActivate: [AuthGuard] },
    { path: 'namaztimings', component: NamazTimingsComponent, canActivate: [AuthGuard] },
    { path: 'qibla', component: QiblaFinderComponent, canActivate: [AuthGuard] },
    { path: 'word-of-the-day', component: WordOfTheDayComponent, canActivate: [AuthGuard] },
    { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
    { path: 'settings/notifications', component: NotificationPreferencesComponent, canActivate: [AuthGuard] }
  ];
