import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router'; // ✅ Import provideRouter
import { routes } from './app/app.routes'; // ✅ Import your routes

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(), // ✅ Provides HttpClient
    provideRouter(routes), // ✅ Provides Router Configuration
  ]
}).catch(err => console.error(err));
