import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComponenteAdmin } from './componente-admin/componente-admin';
import { authGuard } from '../share/auth.guard';
import { ComponenteCreate } from './componente-create/componente-create';
import { ComponenteUpdate } from './componente-update/componente-update';

const routes: Routes = [
  {
    path: 'admin',
    component: ComponenteAdmin,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'create',
    component: ComponenteCreate,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'update/:id',
    component: ComponenteUpdate,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ComponenteRoutingModule {}
