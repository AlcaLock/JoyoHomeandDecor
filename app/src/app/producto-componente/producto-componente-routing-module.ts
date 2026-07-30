import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductoComponenteAdmin } from './producto-componente-admin/producto-componente-admin';
import { ProductoComponenteCreate } from './producto-componente-create/producto-componente-create';
import { ProductoComponenteUpdate } from './producto-componente-update/producto-componente-update';
import { authGuard } from '../share/auth.guard';

const routes: Routes = [
  {
    path: 'productoComponente/admin',
    component: ProductoComponenteAdmin,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'productoComponente/create',
    component: ProductoComponenteCreate,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'productoComponente/update/:id',
    component: ProductoComponenteUpdate,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductoComponenteRoutingModule {}
