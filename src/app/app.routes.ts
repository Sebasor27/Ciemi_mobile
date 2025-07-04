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

];
