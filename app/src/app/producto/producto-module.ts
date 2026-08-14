import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductoIndex } from './producto-index/producto-index';
import { ProductoDetail } from './producto-detail/producto-detail';
import { ProductoAdmin } from './producto-admin/producto-admin';
import { ProductoDiag } from './producto-diag/producto-diag';
import { ProductoRoutingModule } from './producto-routing-module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductoCreate } from './producto-create/producto-create';
import { ProductoUpdate } from './producto-update/producto-update';
import { TranslateModule } from '@ngx-translate/core';
import { ResenaModule } from '../resena/resena-module';
import { AppProductGrid } from '../share/ui/product-grid/product-grid';
import { AppProductFilters } from '../share/ui/product-filters/product-filters';
import { AppButton } from '../share/ui/button/button';
import { AppBadge } from '../share/ui/badge/badge';

@NgModule({
  declarations: [
    ProductoIndex,
    ProductoDetail,
    ProductoAdmin,
    ProductoDiag,
    ProductoCreate,
    ProductoUpdate,
  ],
  imports: [
    CommonModule,

    ResenaModule,
    ProductoRoutingModule,
    MatMenuModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    MatTooltipModule,
    MatGridListModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatBadgeModule,
    MatDialogModule,
    MatRadioModule,
    MatDividerModule,
    MatTooltipModule,
    MatTooltipModule,
    ReactiveFormsModule,
    FormsModule,
    AppProductGrid,
    AppProductFilters,
    AppButton,
    AppBadge,
  ],
})
export class ProductoModule {}
