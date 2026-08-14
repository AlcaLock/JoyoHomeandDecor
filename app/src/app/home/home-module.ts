import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing-module';
import { Inicio } from './inicio/inicio';
import { AcercaDe } from './acerca-de/acerca-de';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppButton } from '../share/ui/button/button';

@NgModule({
  declarations: [Inicio, AcercaDe],
  imports: [
    CommonModule,
    TranslateModule,
    MatTooltipModule,
    HomeRoutingModule,
    MatCardModule,
    AppButton,
  ],
})
export class HomeModule {}
