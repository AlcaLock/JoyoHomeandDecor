import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageNotFound } from './page-not-found/page-not-found';
import {MatGridListModule} from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [
    PageNotFound
  ],
  imports: [
    CommonModule,
    MatGridListModule,
    MatButtonModule
  ]
})
export class ShareModule { }
