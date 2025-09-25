import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

// Importar interceptores
import { authInterceptor } from './app/auth.interceptor';
import { seguridadInterceptor } from './app/interceptores/seguridad.interceptor';

import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';

addIcons(allIcons);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    
    // Un solo provideHttpClient con ambos interceptores
    provideHttpClient(
      withInterceptors([
        authInterceptor,      // Tu interceptor de autenticación existente
        seguridadInterceptor  // Tu nuevo interceptor de seguridad
      ])
    ),
    
    provideRouter(routes, withPreloading(PreloadAllModules))
  ],
});