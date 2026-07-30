import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductoIndex } from './producto-index/producto-index';
import { ProductoAdmin } from './producto-admin/producto-admin';
import { ProductoDetail } from './producto-detail/producto-detail';
import { ProductoCreate } from './producto-create/producto-create';
import { ProductoUpdate } from './producto-update/producto-update';
import { authGuard } from '../share/auth.guard';

const routes: Routes = [
  { path: 'producto', component: ProductoIndex },
  {
    path: 'producto/create',
    component: ProductoCreate,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'producto/admin',
    component: ProductoAdmin,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'producto/update/:id',
    component: ProductoUpdate,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
  { path: 'producto/:id', component: ProductoDetail },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductoRoutingModule {}
