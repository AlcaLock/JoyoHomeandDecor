import { Component, computed, inject } from '@angular/core';
import { NotificationService } from '../../share/notification-service';
import { Router } from '@angular/router';

import { PedidoModel } from '../../share/models/PedidoModel';
import { PedidoService } from '../../share/services/pedido.service';
import { TranslateService } from '@ngx-translate/core';
import { PagoEfectivo } from '../../carrito/pago-efectivo/pago-efectivo';
import { PagoTarjeta } from '../../carrito/pago-tarjeta/pago-tarjeta';
import { EstadoPedidoModel } from '../../share/models/EstadoPedidoModel';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AuthenticationService } from '../../share/authentication.service';

@Component({
  selector: 'app-pedido-index',
  standalone: false,
  templateUrl: './pedido-index.html',
  styleUrl: './pedido-index.css',
})
export class PedidoIndex {
  private destroy$ = new Subject<boolean>();
    private authService = inject(AuthenticationService);
  isAuntenticated = this.authService.isAuthenticatedSignal;
  currentUser = this.authService.currentUserSignal;
  datos: PedidoModel[] = [];
  currentLang: string = 'es';

    public isAdmin = computed(() => {
    const user = this.authService.currentUserSignal();
    console.log('User: ', user?.rol.toString());
    return user?.rol.toString() == 'ADMIN';
  });

  constructor(
    private pedidoService: PedidoService,
    private noti: NotificationService,
    private router: Router,
    private translate: TranslateService,
    private dialog: MatDialog


  ) {
    this.currentLang = this.translate.currentLang || 'es';
    this.translate.onLangChange.subscribe((lang) => {
      this.currentLang = lang.lang;
    });

    this.listPedidos();
  }

  listPedidos() {
    this.pedidoService.get().subscribe({
      next: (respuesta: PedidoModel[]) => {
        this.datos = respuesta.map((pedido) => ({
          ...pedido,
          estado_legible: this.formatearEstado(pedido.estado),
        }));
      },
      error: (err) => {
        console.error('Error al obtener pedidos:', err);
      },
    });
  }

  // Función para formatear el estado
  formatearEstado(estado: string): string {
    return estado
      .split('_')
      .map((p) => p.charAt(0) + p.slice(1).toLowerCase())
      .join(' ');
  }

  pagarPedido(pedido: PedidoModel): void {
    const dialogConfig = {
      width: '800px',
      maxWidth: '90vw',
      height: '600px',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      data: { total: pedido.total },
    };

    let dialogRef;
    if (pedido.metodoPago === 'EFECTIVO') {
      dialogRef = this.dialog.open(PagoEfectivo, dialogConfig);
    } else {
      dialogRef = this.dialog.open(PagoTarjeta, dialogConfig);
    }

    dialogRef.afterClosed().subscribe((pagoAceptado: boolean) => {
      if (!pagoAceptado) return;

      // Actualizar estado del pedido a PAGADO
      this.pedidoService
        .cambiarEstado(pedido.id, EstadoPedidoModel.PAGADO)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.noti.success(
              this.translate.instant('NOTIFICATIONS.SUCCESS'),
              this.translate.instant('NOTIFICATIONS.ORDER_PAID')
            );
            // Recargar pedidos para reflejar el cambio
            this.listPedidos();
          },
          error: (err) => {
            console.error('Error al actualizar estado del pedido:', err);
            this.noti.error(
              this.translate.instant('NOTIFICATIONS.ERROR'),
              this.translate.instant('NOTIFICATIONS.PAYMENT_FAILED')
            );
          },
        });
    });
  }

  entregarPedido(pedido: PedidoModel): void {
  // Actualizar estado del pedido a ENTREGADO directamente
  this.pedidoService
    .cambiarEstado(pedido.id, EstadoPedidoModel.ENTREGADO)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.noti.success(
          this.translate.instant('NOTIFICATIONS.SUCCESS'),
          this.translate.instant('NOTIFICATIONS.ORDER_DELIVERED')
        );
        // Recargar pedidos para reflejar el cambio
        this.listPedidos();
      },
      error: (err) => {
        console.error('Error al actualizar estado del pedido:', err);
        this.noti.error(
          this.translate.instant('NOTIFICATIONS.ERROR'),
          this.translate.instant('NOTIFICATIONS.ORDER_UPDATE_FAILED')
        );
      },
    });
}



  detallePedido(id: number) {
    this.router.navigate(['/pedido', id]);
  }

  trackById(index: number, item: PedidoModel): number {
    return item.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
