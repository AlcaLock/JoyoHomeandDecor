import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductoComponenteRoutingModule } from './producto-componente-routing-module';
import { ProductoComponenteAdmin } from './producto-componente-admin/producto-componente-admin';
import { ProductoComponenteCreate } from './producto-componente-create/producto-componente-create';
import { ProductoComponenteUpdate } from './producto-componente-update/producto-componente-update';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AsyncPipe } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    ProductoComponenteAdmin,
    ProductoComponenteCreate,
    ProductoComponenteUpdate
  ],
  imports: [
    CommonModule,
    ProductoComponenteRoutingModule,
    MatMenuModule,
    MatInputModule,
    MatSelectModule,
    MatGridListModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
    MatTooltipModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatBadgeModule,
    MatDialogModule,
    MatRadioModule,
    MatDividerModule,
    MatTooltipModule,
    MatAutocompleteModule,
    AsyncPipe,
    MatFormFieldModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatNativeDateModule,
  ]
})
export class ProductoComponenteModule { }
