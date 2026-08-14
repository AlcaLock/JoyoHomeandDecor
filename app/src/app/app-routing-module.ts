import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Inicio } from './home/inicio/inicio';
import { PageNotFound } from './share/page-not-found/page-not-found';
import { AccessDeniedIndex } from './access-denied/access-denied-index/access-denied-index';

const routes: Routes = [
  { path: 'inicio', component: Inicio },
  { path: 'access-denied', component: AccessDeniedIndex },
  {
    path: 'producto',
    loadChildren: () => import('./producto/producto-module').then((m) => m.ProductoModule),
  },
  {
    path: 'carrito',
    loadChildren: () => import('./carrito/carrito-module').then((m) => m.CarritoModule),
  },
  {
    path: 'pedido',
    loadChildren: () => import('./pedido/pedido-module').then((m) => m.PedidoModule),
  },
  {
    path: 'promocion',
    loadChildren: () => import('./promocion/promocion-module').then((m) => m.PromocionModule),
  },
  {
    path: 'etiqueta',
    loadChildren: () => import('./etiqueta/etiqueta-module').then((m) => m.EtiquetaModule),
  },
  {
    path: 'componente',
    loadChildren: () => import('./componente/componente-module').then((m) => m.ComponenteModule),
  },
  {
    path: 'productoComponente',
    loadChildren: () =>
      import('./producto-componente/producto-componente-module').then(
        (m) => m.ProductoComponenteModule
      ),
  },
  {
    path: 'usuario',
    loadChildren: () => import('./user/user-module').then((m) => m.UserModule),
  },
  { path: '', redirectTo: '/inicio', pathMatch: 'full' },
  { path: '**', component: PageNotFound },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
