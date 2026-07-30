import { Component, Inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PromocionService } from '../../share/services/promocion.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductoModel } from '../../share/models/ProductoModel';
import { NotificationService } from '../../share/notification-service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-promocion-diag',
  standalone: false,
  templateUrl: './promocion-diag.html',
  styleUrl: './promocion-diag.css',
})
export class PromocionDiag {
  promocion: any;
  productos: (ProductoModel & { precioConPromocion?: number })[] = [];
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { id: number },
    private dialogRef: MatDialogRef<PromocionDiag>,
    private promocionService: PromocionService,
    private noti: NotificationService,
    private translate: TranslateService
  ) {
    if (this.data?.id) {
      this.cargarDatos(this.data.id);
    }
  }

  private cargarDatos(id: number): void {
    this.promocionService
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.promocion = data;
          console.log('Promoción cargada:', this.promocion);
        },
        error: (err) => {
          console.error('Error al obtener promoción:', err);
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.LOAD_PROMOTION_FAILED'),
            5000
          );
        },
      });
  }

  getPrecioConSimboloAdelante(valor: number): string {
    const formatter = new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      currencyDisplay: 'narrowSymbol',
    });
    const resultado = formatter.format(valor);

    // Si el símbolo queda al final, lo movemos adelante
    if (resultado.endsWith('₡')) {
      return `₡${resultado.slice(0, -1).trim()}`;
    }
    return resultado;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
