import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PromocionIndex } from './promocion-index/promocion-index';
import { PromocionDetail } from './promocion-detail/promocion-detail';
import { PromocionAdmin } from './promocion-admin/promocion-admin';
import { PromocionCreate } from './promocion-create/promocion-create';
import { PromocionUpdate } from './promocion-update/promocion-update';
import { authGuard } from '../share/auth.guard';

const routes: Routes = [
  { path: '', component: PromocionIndex },
  {
    path: 'create',
    component: PromocionCreate,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'admin',
    component: PromocionAdmin,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
  { path: ':id', component: PromocionDetail },
  {
    path: 'update/:id',
    component: PromocionUpdate,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PromocionRoutingModule {}
