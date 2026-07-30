import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EtiquetaRoutingModule } from './etiqueta-routing-module';
import { EtiquetaDetail } from './etiqueta-detail/etiqueta-detail';
import { EtiquetaDiag } from './etiqueta-diag/etiqueta-diag';
import { EtiquetaIndex } from './etiqueta-index/etiqueta-index';
import { EtiquetaAdmin } from './etiqueta-admin/etiqueta-admin';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';


@NgModule({
  declarations: [
    EtiquetaAdmin,
    EtiquetaDetail,
    EtiquetaDiag,
    EtiquetaIndex
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTableModule,
    ReactiveFormsModule,
    EtiquetaRoutingModule
  ]
})
export class EtiquetaModule { }
