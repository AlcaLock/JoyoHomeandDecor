import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccessDeniedRoutingModule } from './access-denied-routing-module';
import { TranslateModule } from '@ngx-translate/core';
import { AccessDeniedIndex } from './access-denied-index/access-denied-index';


@NgModule({
  declarations: [
    AccessDeniedIndex
  ],
  imports: [
    CommonModule,
    TranslateModule,
    AccessDeniedRoutingModule
  ]
})
export class AccessDeniedModule { }
