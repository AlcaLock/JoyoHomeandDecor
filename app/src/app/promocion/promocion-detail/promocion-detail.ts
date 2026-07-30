import { Component } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PromocionService } from '../../share/services/promocion.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductoModel } from '../../share/models/ProductoModel';
import { NotificationService } from '../../share/notification-service';

@Component({
  selector: 'app-promocion-detail',
  standalone: false,
  templateUrl: './promocion-detail.html',
  styleUrl: './promocion-detail.css'
})
export class PromocionDetail {
  promocion: any;
  productos: (ProductoModel & { precioConPromocion?: number })[] = [];
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private promocionService: PromocionService,
    private noti: NotificationService,
    private router: Router,
    private activeRoute: ActivatedRoute
  ) {
    const id = Number(this.activeRoute.snapshot.paramMap.get('id'));
    if (!isNaN(id)) {
      this.cargarDatos(id);
    }
  }

  // Orquesta la carga de datos asegurando el orden
  private cargarDatos(id: number): void {
    this.promocionService.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.promocion = data;
        },
        error: (err) => {
          console.error('Error al obtener promoción:', err);
        }
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


  comprar(producto: ProductoModel) {
    this.noti.success('Compra', 'Producto comprado: ' + producto.nombre, 5000);
  }

  goBack(): void {
    this.router.navigate(['/promocion']);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
