import { Routes } from '@angular/router';
import { NamazTimingsComponent } from './namaz-timings/namaz-timings.component';
import { StreakComponent } from './streak/streak.component';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'auth', component: AuthComponent },
    { path: '', redirectTo: 'streak', pathMatch: 'full' },
    { path: 'streak', component: StreakComponent, canActivate: [AuthGuard] },
    { path: 'namaztimings', component: NamazTimingsComponent, canActivate: [AuthGuard] }
    // { path: 'settings', component: SettingsComponent }
  ];
