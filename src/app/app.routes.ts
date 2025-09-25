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
    loadComponent: () => import('./pages/historico/historico.page').then(m => m.HistoricoPage)
  },
  {
    path: 'registro-emp',
    loadComponent: () => import('./pages/registro-emp/registro-emp.page').then(m => m.RegistroEmpPage)
  },
  {
    path: 'reporteria',
    loadComponent: () => import('./pages/reporteria/reporteria.page').then(m => m.ReporteriaPage)
  },
  {
    path: 'detalle-emp/:id',
    loadComponent: () => import('./pages/detalle-emp/detalle-emp.page').then(m => m.DetalleEmpPage)
  },
  {
    path: 'ventana-encuestas/:id',
    loadComponent: () => import('./pages/ventana-encuestas/ventana-encuestas.page').then(m => m.VentanaEncuestasPage)
  },
  {
    path: 'encuesta-iepm/:id',
    loadComponent: () => import('./pages/encuesta-iepm/encuesta-iepm.page').then(m => m.EncuestaIepmPage)
  },
  {
    path: 'encuesta-ice/:id',
    loadComponent: () => import('./pages/encuesta-ice/encuesta-ice.page').then(m => m.EncuestaIcePage)
  },
  {
    path: 'informacion-resultados/:id',
    loadComponent: () => import('./pages/informacion-resultados/informacion-resultados.page').then(m => m.InformacionResultadosPage)
  },

  {
    path: 'ice-resultados/:id/:idEncuesta',
    loadComponent: () => import('./pages/ice-resultados/ice-resultados.page').then(m => m.IceResultadosPage)
  },
  {
    path: 'iepm-resultados/:id/:idEncuesta',
    loadComponent: () => import('./pages/iepm-resultados/iepm-resultados.page').then(m => m.IepmResultadosPage)
  },
  
  {
    path: 'grafica-ice-resultados/:id/:idEncuesta',
    loadComponent: () => import('./pages/grafica-ice-resultados/grafica-ice-resultados.page').then(m => m.GraficaIceResultadosPage)
  },
  {
    path: 'grafica-iepm-resultados/:id/:idEncuesta',
    loadComponent: () => import('./pages/grafica-iepm-resultados/grafica-iepm-resultados.page').then(m => m.GraficaIepmResultadosPage)
  },
  {
    path: 'comparaciones-recomendaciones/:id',
    loadComponent: () => import('./pages/comparaciones-recomendaciones/comparaciones-recomendaciones.page').then(m => m.ComparacionesRecomendacionesPage)
  },  {
    path: 'seguridad-real',
    loadComponent: () => import('./seguridad-real/seguridad-real.page').then( m => m.SeguridadRealPage)
  }

];