import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Inicio } from './home/inicio/inicio';
import { PageNotFound } from './share/page-not-found/page-not-found';
import { AccessDeniedIndex } from './access-denied/access-denied-index/access-denied-index';

const routes: Routes = [
  { path: 'inicio', component: Inicio },
  { path: 'access-denied', component: AccessDeniedIndex },
  { path: '', redirectTo: '/inicio', pathMatch: 'full' },
  { path: '**', component: PageNotFound },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
