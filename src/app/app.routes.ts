import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'login',  
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'historico',
    loadComponent: () => import('./pages/historico/historico.page').then( m => m.HistoricoPage)
  },
  {
    path: 'registro-emp',
    loadComponent: () => import('./pages/registro-emp/registro-emp.page').then( m => m.RegistroEmpPage)
  },
  {
    path: 'reporteria',
    loadComponent: () => import('./pages/reporteria/reporteria.page').then( m => m.ReporteriaPage)
  },
  {
    path: 'detalle-emp/:id',
    loadComponent: () => import('./pages/detalle-emp/detalle-emp.page').then( m => m.DetalleEmpPage)
  },
  {
    path: 'ventana-encuestas/:id',  
    loadComponent: () => import('./pages/ventana-encuestas/ventana-encuestas.page').then( m => m.VentanaEncuestasPage)
  },
  // Rutas corregidas para las encuestas con parámetro id
  {
    path: 'encuesta-iepm/:id',
    loadComponent: () => import('./pages/encuesta-iepm/encuesta-iepm.page').then( m => m.EncuestaIEPMPage)
  },
  {
    path: 'encuesta-ice/:id',
    loadComponent: () => import('./pages/encuesta-ice/encuesta-ice.page').then( m => m.EncuestaICEPage)
  },
  // Ruta para resultados
  /*{
    path: 'resultados/:id',
    loadComponent: () => import('./pages/resultados/resultados.page').then( m => m.ResultadosPage)
  }*/

];
