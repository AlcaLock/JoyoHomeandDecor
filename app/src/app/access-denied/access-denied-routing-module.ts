import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccessDeniedIndex } from './access-denied-index/access-denied-index';

const routes: Routes = [

  {path: 'access-denied', component: AccessDeniedIndex}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccessDeniedRoutingModule { }
