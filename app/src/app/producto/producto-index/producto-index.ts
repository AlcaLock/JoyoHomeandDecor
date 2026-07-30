import { Component, computed, inject, OnDestroy } from '@angular/core';
import { NotificationService } from '../../share/notification-service';
import { Router } from '@angular/router';
import { ProductoModel } from '../../share/models/ProductoModel';
import { ProductoService } from '../../share/services/producto.service';
import { Subject, takeUntil } from 'rxjs';
import { EtiquetaModel } from '../../share/models/EtiquetaModel';
import { EtiquetaService } from '../../share/services/etiqueta.service';
import { CarritoProductoService } from '../../share/services/carrito-producto.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthenticationService } from '../../share/authentication.service';

@Component({
  selector: 'app-producto-index',
  standalone: false,
  templateUrl: './producto-index.html',
  styleUrl: './producto-index.css',
})
export class ProductoIndex implements OnDestroy {
  etiquetasList: EtiquetaModel[] = [];
  nombreFiltro: string = '';
  etiquetasSeleccionadas: number[] = [];

  private carritoService = inject(CarritoProductoService);

  datos: (ProductoModel & {
    precioConPromocion?: number;
    tienePromocion?: boolean;
    promocionActiva?: {
      nombre: string;
      tipo: string;
      descuento: number;
      fin: Date;
      esDeProducto: boolean;
    } | null;
  })[] = [];

  datosFiltrados: (ProductoModel & {
    precioConPromocion?: number;
    tienePromocion?: boolean;
    promocionActiva?: {
      nombre: string;
      tipo: string;
      descuento: number;
      fin: Date;
      esDeProducto: boolean;
    } | null;
  })[] = [];

  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private productoService: ProductoService,
    private etiquetaService: EtiquetaService,
    private noti: NotificationService,
    private router: Router,
    private carritoProductoService: CarritoProductoService,
    private translate: TranslateService,
    private authService: AuthenticationService
  ) {
    this.listProductos();
    this.loadEtiquetas();
  }

  listProductos() {
    this.productoService
      .get()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta: any[]) => {
          this.datos = respuesta.map((producto) => {
            const tienePromocion = !!producto.promocion;

            // Buscar si el producto ya está en el carrito
            const carritoItem = this.carritoProductoService
              .items()
              .find((i) => i.productoId === producto.id);

            // Calcular stock disponible restando la cantidad en carrito
            const stockDisponible =
              (producto.stock ?? 0) - (carritoItem?.cantidad ?? 0);

            let precioConPromocion: number | undefined;
            if (tienePromocion && producto.promocion) {
              precioConPromocion = this.calcularPrecioPromocion(
                producto.precio,
                producto.promocion.tipo,
                producto.promocion.descuento
              );
            }

            return {
              ...producto,
              stock: stockDisponible,
              tienePromocion,
              precioConPromocion,
              promocionActiva: producto.promocion
                ? {
                    ...producto.promocion,
                    nombre: producto.promocion.nombre || 'Promoción',
                    tipo: producto.promocion.tipo || 'PORCENTAJE',
                    descuento: producto.promocion.descuento || 0,
                    fin: producto.promocion.fin || new Date(),
                    esDeProducto: !!producto.promocion.esDeProducto,
                  }
                : null,
            };
          });

          this.datosFiltrados = [...this.datos];
          console.log(
            'Datos con promociones y stock ajustado:',
            this.datosFiltrados
          );
        },
        error: (err) => {
          console.error('Error al obtener productos:', err);
        },
      });
  }

  private loadEtiquetas(): void {
    this.etiquetaService
      .get()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (etiquetas: any) =>
          (this.etiquetasList = etiquetas as EtiquetaModel[]),
        error: (err) =>
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.LOAD_LABEL_FAILED')
          ),
      });
  }

  // Método para filtrar productos
  filtrarProductos(): void {
    if (!this.datos.length) return;

    this.datosFiltrados = this.datos.filter((producto) => {
      // Filtro por nombre (case insensitive)
      const coincideNombre =
        !this.nombreFiltro ||
        producto.nombre.toLowerCase().includes(this.nombreFiltro.toLowerCase());

      // Filtro por etiquetas
      let coincideEtiquetas = true;
      if (this.etiquetasSeleccionadas.length > 0) {
        // Obtenemos los IDs de las etiquetas del producto
        const etiquetasProducto =
          producto.etiquetas?.map((pe) => pe.etiquetaId) || [];

        // Verificamos si alguna etiqueta seleccionada está en las etiquetas del producto
        coincideEtiquetas = this.etiquetasSeleccionadas.some((etiquetaId) =>
          etiquetasProducto.includes(etiquetaId)
        );
      }

      return coincideNombre && coincideEtiquetas;
    });
  }

  getEtiquetaNombre(etiquetaId: number): string {
    const etiqueta = this.etiquetasList.find((e) => e.id === etiquetaId);
    return etiqueta ? etiqueta.nombre : 'Etiqueta';
  }

  // Calcular precio con promoción
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

  getPrecioCRC(valor: number): string {
    const formatter = new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      currencyDisplay: 'narrowSymbol',
    });

    const resultado = formatter.format(valor);

    if (resultado.endsWith('₡')) {
      return `₡${resultado.slice(0, -1).trim()}`;
    }

    return resultado;
  }

  detalle(id: Number) {
    this.router.navigate(['/producto', id]);
  }

comprar(producto: ProductoModel) {
  if (!producto.id) {
    this.noti.error(
      this.translate.instant('NOTIFICATIONS.ERROR'),
      this.translate.instant('NOTIFICATIONS.INVALID_PRODUCT_ID')
    );
    return;
  }

  // Verificar el stock en el backend antes de agregar
  this.productoService
    .getById(producto.id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (productoActualizado: ProductoModel) => {
        if (!productoActualizado.activo) {
          this.noti.warning(
            this.translate.instant('NOTIFICATIONS.PRODUCT_INACTIVE'),
            this.translate.instant('NOTIFICATIONS.CANNOT_ADD_PRODUCT')
          );
          return;
        }

        // Calcular cantidad de este producto en el carrito (normales)
        const cantidadEnCarritoNormal = this.carritoProductoService
          .items()
          .filter(item => item.productoId === producto.id)
          .reduce((sum, item) => sum + item.cantidad, 0);

        // Calcular cantidad acaparada por productos personalizados
        const cantidadEnCarritoPersonalizado = this.carritoProductoService
          .items()
          .filter(item => item.personalizado?.productoBaseId === producto.id)
          .reduce((sum, item) => sum + item.cantidad, 0);

        // Stock disponible real
        const stockDisponible = productoActualizado.stock - (cantidadEnCarritoNormal + cantidadEnCarritoPersonalizado);

        if (stockDisponible <= 0) {
          this.noti.warning(
            this.translate.instant('NOTIFICATIONS.STOCK_EMPTY'),
            this.translate.instant('NOTIFICATIONS.PRODUCT_NOT_AVAILABLE')
          );
          return;
        }

        // Agregar al carrito
        this.carritoService
          .addProduct(producto.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Actualizar el stock localmente
              const productoIndex = this.datos.findIndex(p => p.id === producto.id);
              if (productoIndex !== -1) {
                this.datos[productoIndex].stock -= 1;
                this.filtrarProductos();
              }

              this.noti.success(
                this.translate.instant('NOTIFICATIONS.PRODUCT_ADDEDD'),
                this.translate.instant(
                  'NOTIFICATIONS.PRODUCT_ADDED_TO_CARTT',
                  { nombre: producto.nombre }
                ),
                3000
              );
            },
            error: (err) => {
              this.noti.error(
                this.translate.instant('NOTIFICATIONS.ERROR'),
                this.translate.instant(
                  err.error?.message
                    ? err.error.message
                    : 'NOTIFICATIONS.ADD_PRODUCT_FAILED'
                )
              );
            },
          });
      },
      error: () => {
        this.noti.error(
          this.translate.instant('NOTIFICATIONS.ERROR'),
          this.translate.instant('NOTIFICATIONS.CHECK_STOCK_FAILED')
        );
      },
    });
}

// Devuelve el stock disponible real, restando la cantidad en carrito normal y personalizado
stockDisponible(producto: ProductoModel): number {
  const cantidadEnCarritoNormal = this.carritoProductoService
    .items()
    .filter(item => item.productoId === producto.id)
    .reduce((sum, item) => sum + item.cantidad, 0);

  const cantidadEnCarritoPersonalizado = this.carritoProductoService
    .items()
    .filter(item => item.personalizado?.productoBaseId === producto.id)
    .reduce((sum, item) => sum + item.cantidad, 0);

  return (producto.stock ?? 0) - (cantidadEnCarritoNormal + cantidadEnCarritoPersonalizado);
}

  public isAdmin = computed(() => {
    const user = this.authService.currentUserSignal();
    console.log('User: ', user?.rol.toString());
    return user?.rol.toString() == 'ADMIN';
  });


  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
