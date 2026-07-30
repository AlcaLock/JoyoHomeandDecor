import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './user-routing-module';
import {MatTabsModule} from '@angular/material/tabs';
import {MatButtonModule} from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import {MatDividerModule} from '@angular/material/divider'; 
import {MatDialogModule} from "@angular/material/dialog";
import { MatIconModule } from '@angular/material/icon';
import { LayoutModule } from '@angular/cdk/layout';
import {MatCardModule} from '@angular/material/card';
import { ReactiveFormsModule } from '@angular/forms';
import { UserCreate } from './user-create/user-create';
import { UserIndex } from './user-index/user-index';
import { UserLogin } from './user-login/user-login';
import { TranslateModule } from '@ngx-translate/core';
import { UserUpdate } from './user-update/user-update';
import { UserReset } from './user-reset/user-reset';
import { UserAdmin } from './user-admin/user-admin';
import { UserDiag } from './user-diag/user-diag';
import { MatTableModule } from '@angular/material/table';
import { UserResetEmail } from './user-reset-email/user-reset-email';
import { UserPerfil } from './user-perfil/user-perfil';



@NgModule({
  declarations: [
    UserCreate,
    UserIndex,
    UserLogin,
    UserUpdate,
    UserReset,
    UserAdmin,
    UserDiag,
    UserResetEmail,
    UserPerfil
  ],
  imports: [
    CommonModule,
    UserRoutingModule,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    LayoutModule,
    MatDividerModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    ReactiveFormsModule,
  ]
})
export class UserModule { }
