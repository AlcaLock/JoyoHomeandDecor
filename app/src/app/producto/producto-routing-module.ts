import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductoIndex } from './producto-index/producto-index';
import { ProductoAdmin } from './producto-admin/producto-admin';
import { ProductoDetail } from './producto-detail/producto-detail';
import { ProductoCreate } from './producto-create/producto-create';
import { ProductoUpdate } from './producto-update/producto-update';
import { authGuard } from '../share/auth.guard';

const routes: Routes = [
  { path: '', component: ProductoIndex },
  {
    path: 'create',
    component: ProductoCreate,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'admin',
    component: ProductoAdmin,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'update/:id',
    component: ProductoUpdate,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
  { path: ':id', component: ProductoDetail },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductoRoutingModule {}
