import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CarritoRoutingModule } from './carrito-routing-module';
import { CarritoIndex } from './carrito-index/carrito-index';
import { CarritoDiag } from './carrito-diag/carrito-diag';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AsyncPipe } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { MatNativeDateModule } from '@angular/material/core';
import { AppButton } from '../share/ui/button/button';
import { TranslateModule } from '@ngx-translate/core';
import { PagoTarjeta } from './pago-tarjeta/pago-tarjeta';
import { PagoEfectivo } from './pago-efectivo/pago-efectivo';

@NgModule({
  declarations: [CarritoIndex, CarritoDiag, PagoTarjeta, PagoEfectivo],
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatGridListModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatChipsModule,
    MatBadgeModule,
    TranslateModule,
    MatRadioModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    CarritoRoutingModule,
    MatDialogModule,
    MatSortModule,
    MatMenuModule,
    AppButton,
  ],
})
export class CarritoModule {}
