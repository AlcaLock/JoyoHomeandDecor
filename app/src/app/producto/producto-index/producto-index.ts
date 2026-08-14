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
import { ProductCardBadge, ProductCardData } from '../../share/ui/product-card/product-card.model';
import {
  PriceRange,
  ProductFilterOption,
  ProductFilterState,
} from '../../share/ui/product-filters/product-filters.model';

type ProductoConPromocion = ProductoModel & {
  precioConPromocion?: number;
  tienePromocion?: boolean;
  promocionActiva?: {
    nombre: string;
    tipo: string;
    descuento: number;
    fin: Date;
    esDeProducto: boolean;
  } | null;
};

@Component({
  selector: 'app-producto-index',
  standalone: false,
  templateUrl: './producto-index.html',
  styleUrl: './producto-index.css',
})
export class ProductoIndex implements OnDestroy {
  etiquetasList: EtiquetaModel[] = [];

  private carritoService = inject(CarritoProductoService);
  private currentFilters: ProductFilterState | null = null;

  datos: ProductoConPromocion[] = [];

  datosFiltrados: ProductoConPromocion[] = [];

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
          this.recalcularOpcionesDeFiltro();
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
        next: (etiquetas: any) => {
          this.etiquetasList = etiquetas as EtiquetaModel[];
          this.recalcularOpcionesDeFiltro();
        },
        error: (err) =>
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.LOAD_LABEL_FAILED')
          ),
      });
  }

  // Método para filtrar productos según el estado emitido por <app-product-filters>
  onFiltersChange(state: ProductFilterState): void {
    this.currentFilters = state;
    this.aplicarFiltros(state);
  }

  private aplicarFiltros(state: ProductFilterState): void {
    if (!this.datos.length) return;

    const term = state.search.trim().toLowerCase();

    this.datosFiltrados = this.datos.filter((producto) => {
      const coincideNombre = !term || producto.nombre.toLowerCase().includes(term);

      const etiquetasProducto = producto.etiquetas?.map((pe) => pe.etiquetaId) ?? [];
      const coincideEspacio =
        state.categoryIds.length === 0 ||
        state.categoryIds.some((id) => etiquetasProducto.includes(Number(id)));

      const coincideTipoMueble =
        state.materialIds.length === 0 ||
        state.materialIds.some((id) => Number(id) === producto.id_categoria);

      const precio = producto.precioConPromocion ?? producto.precio;
      const coincidePrecio =
        state.price.max <= 0 || (precio >= state.price.min && precio <= state.price.max);

      return coincideNombre && coincideEspacio && coincideTipoMueble && coincidePrecio;
    });
  }

  private refilter(): void {
    if (this.currentFilters) {
      this.aplicarFiltros(this.currentFilters);
    } else {
      this.datosFiltrados = [...this.datos];
    }
  }

  /** Opciones de "espacio del hogar" y "tipo de mueble" para <app-product-filters>, cacheadas
   *  como campos planos (no getters) para no romper la igualdad por referencia en sus inputs. */
  categoryFilterOptions: ProductFilterOption[] = [];
  materialFilterOptions: ProductFilterOption[] = [];
  priceBounds: PriceRange = { min: 0, max: 0 };

  private recalcularOpcionesDeFiltro(): void {
    this.categoryFilterOptions = this.etiquetasList.map((etiqueta) => ({
      id: etiqueta.id,
      label: etiqueta.nombre,
    }));

    const vistos = new Map<number, string>();
    for (const producto of this.datos) {
      // La API devuelve categoria como string plano (no como objeto CategoriaModel).
      const nombreCategoria = producto.categoria as unknown as string;
      if (nombreCategoria) {
        vistos.set(producto.id_categoria, nombreCategoria);
      }
    }
    this.materialFilterOptions = Array.from(vistos.entries()).map(([id, label]) => ({ id, label }));

    if (this.datos.length) {
      const precios = this.datos.map((p) => p.precioConPromocion ?? p.precio);
      this.priceBounds = { min: Math.floor(Math.min(...precios)), max: Math.ceil(Math.max(...precios)) };
    }
  }

  /** Mapea los productos filtrados a la forma que consume <app-product-grid>. */
  get productCards(): ProductCardData[] {
    return this.datosFiltrados.map((item) => this.toCardData(item));
  }

  private toCardData(item: ProductoConPromocion): ProductCardData {
    const badges: ProductCardBadge[] = [];

    if (item.tienePromocion && item.promocionActiva) {
      const label =
        item.promocionActiva.tipo === 'PORCENTAJE'
          ? `-${item.promocionActiva.descuento}%`
          : 'Oferta';
      badges.push({ label, variant: 'discount' });
    }

    const disponible = this.stockDisponible(item);
    if (disponible <= 0) {
      badges.push({ label: 'Agotado', variant: 'out-of-stock' });
    }

    // La API de listado devuelve imagenes como string[] (URLs), no como ImagenProductoModel[].
    const imagenesUrls = (item.imagenes as unknown as string[]) ?? [];
    const [primera, segunda] = imagenesUrls;

    return {
      id: item.id ?? 0,
      name: item.nombre,
      imageUrl: primera ?? 'assets/uploads/imagen-no-encontrada.jpg',
      hoverImageUrl: segunda ?? null,
      price: item.precio,
      promoPrice: item.tienePromocion ? item.precioConPromocion ?? null : null,
      rating: item.promedioValoracion,
      reviewCount: item.resenas?.length,
      badges,
      inStock: disponible > 0,
    };
  }

  /** Handler de (addToCart) del grid: resuelve el id hacia el producto completo y reutiliza comprar(). */
  onAddToCart(id: number): void {
    const item = this.datosFiltrados.find((p) => p.id === id);
    if (item) this.comprar(item);
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

  if (!producto.activo) {
    this.noti.warning(
      this.translate.instant('NOTIFICATIONS.PRODUCT_INACTIVE'),
      this.translate.instant('NOTIFICATIONS.CANNOT_ADD_PRODUCT')
    );
    return;
  }

  const disponible = this.stockDisponible(producto);
  if (disponible <= 0) {
    this.noti.warning(
      this.translate.instant('NOTIFICATIONS.STOCK_EMPTY'),
      this.translate.instant('NOTIFICATIONS.PRODUCT_NOT_AVAILABLE')
    );
    return;
  }

  const productoIndex = this.datos.findIndex((p) => p.id === producto.id);
  if (productoIndex !== -1) {
    this.datos[productoIndex].stock = Math.max(
      0,
      (this.datos[productoIndex].stock ?? 0) - 1
    );
    this.refilter();
  }

  this.carritoService
    .addProduct(producto.id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.noti.success(
          this.translate.instant('NOTIFICATIONS.SUCCESS'),
          this.translate.instant('NOTIFICATIONS.PRODUCT_ADDED_TO_CART')
        );
      },
      error: (err) => {
        if (productoIndex !== -1) {
          this.datos[productoIndex].stock = (this.datos[productoIndex].stock ?? 0) + 1;
          this.refilter();
        }

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
    return user?.rol.toString() == 'ADMIN';
  });


  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
