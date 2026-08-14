import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserIndex } from './user-index/user-index';
import { UserCreate } from './user-create/user-create';
import { UserLogin } from './user-login/user-login';
import { UserUpdate } from './user-update/user-update';
import { UserAdmin } from './user-admin/user-admin';
import { UserReset } from './user-reset/user-reset';
import { UserResetEmail } from './user-reset-email/user-reset-email';
import { UserPerfil } from './user-perfil/user-perfil';
import { authGuard } from '../share/auth.guard';

const routes: Routes = [
  { path: 'forgot-password', component: UserResetEmail },
  { path: 'reset-password', component: UserReset },
  { path: 'update/:id', component: UserUpdate },
  {
    path: 'admin',
    component: UserAdmin,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
  },
  { path: 'perfil/:id', component: UserPerfil },
  {
    path: '',
    component: UserIndex,
    children: [
      { path: 'login', component: UserLogin },
      { path: 'registrar', component: UserCreate },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserRoutingModule {}
