import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EtiquetaAdmin } from './etiqueta-admin/etiqueta-admin';
import { authGuard } from '../share/auth.guard';

const routes: Routes = [
  { path: 'etiqueta/admin', component: EtiquetaAdmin,
      canActivate: [authGuard],
      data: { roles: ['ADMIN'] },}
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EtiquetaRoutingModule { }
