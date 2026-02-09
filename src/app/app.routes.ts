import { Routes } from '@angular/router';
import { LoginComponent } from './login-component/login-component';
import { AdminDashboardComponent } from './admindashboard-component/admindashboard-component';
import { AdminGuard } from './admin.guards';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AdminGuard]
  },

  { path: 'inventory-manager', loadComponent: () => import('./inventorymanagerdashboard/inventorymanagerdashboard').then(m => m.InventoryDashboardComponent),data: { prerender: false }},
  { path: 'cashier', loadComponent: () => import('./cashierdashboard-component/cashierdashboard-component').then(m => m.CashierDashboardComponent) }
];
