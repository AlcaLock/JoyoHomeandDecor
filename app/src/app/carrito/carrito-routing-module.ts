import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CarritoIndex } from './carrito-index/carrito-index';
import { authGuard } from '../share/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: CarritoIndex,
    canActivate: [authGuard],
    data: { roles: ['CLIENTE'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CarritoRoutingModule {}
