import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ProductoService } from '../../share/services/producto.service';
import { ResenaService } from '../../share/services/resena.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ResenaModel } from '../../share/models/ResenaModel';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { ResenaDiag } from '../../resena/resena-diag/resena-diag';
import { NotificationService } from '../../share/notification-service';
import { UsuarioService } from '../../share/services/usuario.service';
import { UsuarioModel } from '../../share/models/UsuarioModel';
import { ProductoModel } from '../../share/models/ProductoModel';

@Component({
  selector: 'app-producto-diag',
  standalone: false,
  templateUrl: './producto-diag.html',
  styleUrl: './producto-diag.css',
})
export class ProductoDiag {
  producto: any;
  selectedImage: string = '';
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { id: number },
    private dialogRef: MatDialogRef<ProductoDiag>,
    private productoService: ProductoService,
    private dialog: MatDialog,
    private router: Router,
    private activeRoute: ActivatedRoute
  ) {
    if (this.data.id) {
      this.obtenerProducto(this.data.id);
    }
  }

  selectImage(url: string) {
    this.selectedImage = url;
  }

  obtenerProducto(id: number) {
    this.productoService
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          // Aplicar lógica de promoción similar a ProductoIndex
          const productoConPromocion = {
            ...data,
            tienePromocion: !!data.promocion,
            precioConPromocion: data.promocion
              ? this.calcularPrecioPromocion(
                  data.precio,
                  data.promocion.tipo,
                  data.promocion.descuento
                )
              : undefined,
            promocionActiva: data.promocion
              ? {
                  ...data.promocion,
                  nombre: data.promocion.nombre || 'Promoción',
                  tipo: data.promocion.tipo || 'PORCENTAJE',
                  descuento: data.promocion.descuento || 0,
                  fin: data.promocion.fin || new Date(),
                  esDeProducto: !!data.promocion.esDeProducto,
                }
              : null,
          };

          this.producto = productoConPromocion;
this.producto = productoConPromocion;

          // Lógica de reseñas (manteniendo tu implementación original)
          if (this.producto.resenas?.length > 0) {
            this.producto.resenas.sort(
              (a: any, b: any) =>
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );

            const total = this.producto.resenas.reduce(
              (sum: number, r: any) => sum + r.estrellas,
              0
            );
            this.producto.promedioValoracion =
              total / this.producto.resenas.length;
          } else {
            this.producto.promedioValoracion = 0;
          }
          //  Selección de imagen principal
          if (this.producto!.imagenes!.length > 0) {
            this.selectedImage = this.producto!.imagenes![0].url;
          }

          console.log('Producto con promoción:', this.producto);
        },
        error: (err) => {
          console.error('Error al obtener el producto:', err);
        },
      });
  }


  private calcularPrecioPromocion(
    precioOriginal: number,
    tipoDescuento: string,
    descuento: number
  ): number {
    let precioConPromocion = precioOriginal;

    if (tipoDescuento === 'PORCENTAJE') {
      precioConPromocion = precioOriginal * (1 - descuento / 100);
    } else if (tipoDescuento === 'MONTO_FIJO') {
      precioConPromocion = precioOriginal - descuento;
    }

    return Number(Math.max(0, precioConPromocion).toFixed(2));
  }

  getConteoPorEstrella() {
    // Inicializar conteo 1 a 5 estrellas con cero
    const conteo = [5, 4, 3, 2, 1].map((n) => ({ estrellas: n, cantidad: 0 }));
    if (!this.producto?.resenas) return conteo;

    for (const resena of this.producto.resenas) {
      const item = conteo.find((c) => c.estrellas === resena.estrellas);
      if (item) item.cantidad++;
    }
    return conteo;
  }

  getArray(n: number): any[] {
    return Array(n).fill(0);
  }

  getPrecioCRC(valor: number): string {
    const formatter = new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      currencyDisplay: 'narrowSymbol',
    });

    const resultado = formatter.format(valor);
    return resultado.endsWith('₡')
      ? `₡${resultado.slice(0, -1).trim()}`
      : resultado;
  }

  getStars(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
