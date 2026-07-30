import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PedidoRoutingModule } from './pedido-routing-module';
import { PedidoIndex } from './pedido-index/pedido-index';

import { PedidoDiag } from './pedido-diag/pedido-diag';
import { PedidoAdmin } from './pedido-admin/pedido-admin';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { PedidoDetail } from './pedido-detail/pedido-detail';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [PedidoIndex, PedidoDetail, PedidoDiag, PedidoAdmin],
  imports: [
    CommonModule,
    TranslateModule,
    MatTooltipModule,
    PedidoRoutingModule,
    MatCardModule,
    MatIconModule,
  ],
})
export class PedidoModule {}
