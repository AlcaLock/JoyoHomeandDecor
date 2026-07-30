import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { CoreModule } from './core/core-module';
import { ShareModule } from './share/share-module';
import { HomeModule } from './home/home-module';
import { UserModule } from './user/user-module';
import {
  provideHttpClient,
  HTTP_INTERCEPTORS,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { LOCALE_ID } from '@angular/core';
import { HttpErrorInterceptorService } from './share/http-error-interceptor.service';
import { ProductoModule } from './producto/producto-module';
import { ResenaModule } from './resena/resena-module';
import { PromocionModule } from './promocion/promocion-module';
import { PedidoModule } from './pedido/pedido-module';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { EtiquetaModule } from './etiqueta/etiqueta-module';
import { CarritoModule } from './carrito/carrito-module';
import { ProductoComponenteModule } from './producto-componente/producto-componente-module';

// Importaciones para ngx-translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { HttpAuthInterceptorService } from './share/http-auth-interceptor.service';
import { AccessDeniedModule } from './access-denied/access-denied-module';
import { ComponenteModule } from './componente/componente-module';

// Función para cargar las traducciones
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [App],
  imports: [
    MatButtonToggleModule,
    FormsModule,
    BrowserModule,
    CoreModule,
    ShareModule,
    HomeModule,
    UserModule,
    ProductoModule,
    ResenaModule,
    PromocionModule,
    PedidoModule,
    EtiquetaModule,
    CarritoModule,
    ProductoComponenteModule,

    // Configuración de TranslateModule
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    AccessDeniedModule,
    ComponenteModule,
    AppRoutingModule,
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptorService,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpAuthInterceptorService,
      multi: true,
    },
    {
      provide: LOCALE_ID,
      useValue: 'es',
    },
  ],
  bootstrap: [App],
})
export class AppModule {}
