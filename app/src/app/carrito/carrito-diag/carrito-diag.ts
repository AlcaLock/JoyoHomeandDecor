import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ComponenteModel } from '../../share/models/ComponenteModel';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductoModel } from '../../share/models/ProductoModel';
import { forkJoin, of, Subject, switchMap, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductoPeronalizadoService } from '../../share/services/producto-personalizado.service';
import { NotificationService } from '../../share/notification-service';
import { AuthenticationService } from '../../share/authentication.service';
import { ProductoComponenteService } from '../../share/services/producto-componente.service';
import { CarritoProductoService } from '../../share/services/carrito-producto.service';
import { ProductoPersonalizadoModel } from '../../share/models/ProductoPersonalizadoModel';
import { ProductoService } from '../../share/services/producto.service';
import { PersonalizacionComponenteModel } from '../../share/models/PersonalizacionComponenteModel';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-carrito-diag',
  standalone: false,
  templateUrl: './carrito-diag.html',
  styleUrl: './carrito-diag.css',
})
export class CarritoDiag implements OnInit, OnDestroy {
  formPersonalizado: FormGroup;
  productoBase: ProductoModel;
  productosDisponibles: ProductoModel[] = [];

  tamanos: ComponenteModel[] = [];
  colores: ComponenteModel[] = [];
  materiales: ComponenteModel[] = [];

  precioBase = 0;
  precioFinal = 0;
  loading = false;

  imagenProductoBase = 'imagen-not-found';
  imagenTamano = 'componente-not-found';
  imagenColor = 'componente-not-found';
  imagenMaterial = 'componente-not-found';

  private destroy$ = new Subject<void>();
  private imageCache = new Map<string, string>();
  private failedImageUrls = new Set<string>();

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      producto: ProductoModel;
      productoPersonalizado?: ProductoPersonalizadoModel;
      cantidadInicial?: number;
    },
    private dialogRef: MatDialogRef<CarritoDiag>,
    private fb: FormBuilder,
    private productoPersonalizadoService: ProductoPeronalizadoService,
    private productoComponenteService: ProductoComponenteService,
    private carritoProductoService: CarritoProductoService,
    private productoService: ProductoService,
    private authService: AuthenticationService,
    private translate: TranslateService,
    private notification: NotificationService
  ) {
    this.productoBase = data.producto;
    this.precioBase = this.productoBase.precio || 0;
    this.precioFinal = this.precioBase;

    this.formPersonalizado = this.fb.group({
      cantidad: [
        data.cantidadInicial || 1,
        [Validators.required, Validators.min(1)],
      ],
      tamano: ['', Validators.required],
      color: ['', Validators.required],
      material: ['', Validators.required],
      configuracion: [{}],
    });
  }

  ngOnInit(): void {
    this.loading = true;

    this.productoService
      .getStockyComponentes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productos: ProductoModel[]) => {
          console.log('Productos recibidos:', productos);
          this.productosDisponibles = productos;

          if (this.data.productoPersonalizado) {
            this.productoBase =
              this.productosDisponibles.find(
                (p) => p.id === this.data.productoPersonalizado!.productoBaseId
              ) || this.data.producto;
          } else {
            this.productoBase =
              this.data.producto || this.productosDisponibles[0];
          }

          this.precioBase =
            this.productoBase.precioConPromocion ||
            this.productoBase.precio ||
            0;

          if (this.productoBase.id)
            this.cargarComponentes(this.productoBase.id);

          this.cargarProductoConImagenes();
          this.calcularPrecioFinal();
        },
        error: (err) => {
          console.error('Error cargando productos:', err);
          this.notification.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.LOAD_PRODUCTS_FAILED')
          );
          this.loading = false;
        },
      });
  }

  cargarComponentes(productoId: number) {
    forkJoin({
      tamanos: this.productoComponenteService.getSizesByProductId(productoId),
      colores: this.productoComponenteService.getColorsByProductId(productoId),
      materiales:
        this.productoComponenteService.getMaterialsByProductId(productoId),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (componentes) => {
          // Cada array ya contiene ComponenteModel directamente
          this.tamanos = componentes.tamanos;
          this.colores = componentes.colores;
          this.materiales = componentes.materiales;

          if (this.data.productoPersonalizado) {
            const pp = this.data.productoPersonalizado;

            const tamanoId = pp.componentes?.find((c) =>
              this.tamanos.some((t) => t.id === c.componenteId)
            )?.componenteId;
            const colorId = pp.componentes?.find((c) =>
              this.colores.some((t) => t.id === c.componenteId)
            )?.componenteId;
            const materialId = pp.componentes?.find((c) =>
              this.materiales.some((t) => t.id === c.componenteId)
            )?.componenteId;

            this.formPersonalizado.patchValue({
              tamano: tamanoId || '',
              color: colorId || '',
              material: materialId || '',
              cantidad: this.data.cantidadInicial || 1,
            });

            //Usamos directamente imagenUrl del ComponenteModel
            this.actualizarImagenTamano(tamanoId);
            this.actualizarImagenColor(colorId);
            this.actualizarImagenMaterial(materialId);
          } else {
            if (this.tamanos.length === 1) {
              const primerTamano = this.tamanos[0];
              this.formPersonalizado.patchValue({ tamano: primerTamano.id });
              this.imagenTamano =
                primerTamano.imagenUrl || '/componente-not-found.png';
            }

            if (this.colores.length === 1) {
              const primerColor = this.colores[0];
              this.formPersonalizado.patchValue({ color: primerColor.id });
              this.imagenColor =
                primerColor.imagenUrl || '/componente-not-found.png';
            }

            if (this.materiales.length === 1) {
              const primerMaterial = this.materiales[0];
              this.formPersonalizado.patchValue({
                material: primerMaterial.id,
              });
              this.imagenMaterial =
                primerMaterial.imagenUrl || '/componente-not-found.png';
            }
          }

          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando componentes:', err);
          this.notification.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.LOAD_COMPONENTS_FAILED')
          );
          this.loading = false;
        },
      });
  }

  compareProducto(p1: ProductoModel, p2: ProductoModel): boolean {
    return p1 && p2 ? p1.id === p2.id : p1 === p2;
  }

  onProductoBaseChange(producto: ProductoModel) {
    this.productoBase = producto;
    this.precioBase = producto.precio || 0;

    this.formPersonalizado.patchValue({
      cantidad: 1,
      tamano: '',
      color: '',
      material: '',
      configuracion: {},
    });

    if (this.productoBase.id) this.cargarComponentes(this.productoBase.id);

    this.cargarProductoConImagenes();
    this.calcularPrecioFinal();
  }

  cargarProductoConImagenes(): void {
    if (!this.productoBase.id) return;
    this.productoService
      .getById(this.productoBase.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (producto) =>
          (this.imagenProductoBase =
            producto.imagenes?.[0]?.url || 'imagen-not-found'),
        error: () => (this.imagenProductoBase = 'imagen-not-found'),
      });
  }

  getCachedImage(url: string, type: 'product' | 'component'): string {
    if (!url || this.failedImageUrls.has(url))
      return type === 'product' ? 'imagen-not-found' : 'componente-not-found';
    if (this.imageCache.has(url)) return this.imageCache.get(url)!;
    this.imageCache.set(url, url);
    return url;
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    const originalSrc = imgElement.src;
    this.failedImageUrls.add(originalSrc);
    imgElement.src = imgElement.classList.contains('producto-imagen')
      ? '/imagen-not-found.png'
      : '/componente-not-found.png';
    this.imageCache.delete(originalSrc);
  }

  // Actualizar imágenes de componentes
  actualizarImagenTamano(id?: number) {
    const comp = this.tamanos.find((t) => t.id === id);
    this.imagenTamano = comp?.imagenUrl || 'componente-not-found';
  }

  actualizarImagenColor(id?: number) {
    const comp = this.colores.find((c) => c.id === id);
    this.imagenColor = comp?.imagenUrl || 'componente-not-found';
  }

  actualizarImagenMaterial(id?: number) {
    const comp = this.materiales.find((m) => m.id === id);
    this.imagenMaterial = comp?.imagenUrl || 'componente-not-found';
  }

  get nombreTamanoSeleccionado(): string {
    const id = this.formPersonalizado.value.tamano;
    return this.tamanos.find((t) => t.id === id)?.nombre || '-';
  }

  get nombreColorSeleccionado(): string {
    const id = this.formPersonalizado.value.color;
    return this.colores.find((c) => c.id === id)?.nombre || '-';
  }

  get nombreMaterialSeleccionado(): string {
    const id = this.formPersonalizado.value.material;
    return this.materiales.find((m) => m.id === id)?.nombre || '-';
  }

  calcularPrecioFinal(): void {
    const getPrecio = (lista: ComponenteModel[], id: number) =>
      Number(lista.find((item) => item.id === id)?.precio || 0);

    const { tamano, color, material } = this.formPersonalizado.value;
    const totalComponentes =
      getPrecio(this.tamanos, tamano) +
      getPrecio(this.colores, color) +
      getPrecio(this.materiales, material);

    // Usar el precio con promoción si existe
    const precioBaseConPromocion =
      this.productoBase.precioConPromocion || this.productoBase.precio || 0;

    this.precioFinal = precioBaseConPromocion + totalComponentes;
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

  onSubmit(): void {
    this.formPersonalizado.markAllAsTouched();

    if (this.formPersonalizado.invalid || !this.productoBase.id) {
      this.notification.warning(
        this.translate.instant('NOTIFICATIONS.WARNING'),
        this.translate.instant('NOTIFICATIONS.COMPETE_FIELDS')
      );
      return;
    }

    const usuario = this.authService.currentUserSignal();
    if (!usuario?.id) {
      this.notification.error(
        this.translate.instant('NOTIFICATIONS.ERROR'),
        this.translate.instant('NOTIFICATIONS.LOGIN_REQUIRED')
      );
      return;
    }

    if ((this.productoBase.stock || 0) <= 0) {
      this.notification.warning(
        this.translate.instant('NOTIFICATIONS.WARNING'),
        this.translate.instant('NOTIFICATIONS.STOCK_EMPTY')
      );
      return;
    }

    const { cantidad, tamano, color, material } = this.formPersonalizado.value;

    const carritoItems = this.carritoProductoService.items();

    // Sumar todas las unidades en el carrito que afectan a este producto base
const cantidadEnCarrito = carritoItems
  .filter(
    (item) =>
      item.productoId === this.productoBase.id || // productos normales
      item.personalizado?.productoBaseId === this.productoBase.id // productos personalizados basados en este producto
  )
  .reduce((sum, item) => sum + item.cantidad, 0);

// Validar stock
if (cantidad + cantidadEnCarrito > (this.productoBase.stock || 0)) {
  this.notification.warning(
    this.translate.instant('NOTIFICATIONS.WARNING'),
    this.translate.instant('NOTIFICATIONS.ONLY_X_UNITS_AVAILABLE', {
      stock: this.productoBase.stock - cantidadEnCarrito,
    })
  );
  return;
}


    const configuracionStr = JSON.stringify({
      tamaño: this.nombreTamanoSeleccionado,
      color: this.nombreColorSeleccionado,
      material: this.nombreMaterialSeleccionado,
    });

    const componentesPayload: PersonalizacionComponenteModel[] = [
      tamano,
      color,
      material,
    ]
      .filter(Boolean)
      .map((id) => ({ componenteId: id }));

    this.loading = true;

    // CORRECCIÓN: asegurar que precioFinal siempre sea number
    const precioFinalNum = Number(this.precioFinal ?? 0);

    if (this.data.productoPersonalizado?.id) {
      const updatePayload: ProductoPersonalizadoModel = {
        id: this.data.productoPersonalizado.id,
        productoBaseId: this.data.productoPersonalizado.productoBaseId!,
        usuarioId: this.data.productoPersonalizado.usuarioId!,
        precioFinal: precioFinalNum,
        configuracion: configuracionStr,
        componentes: componentesPayload,
      };

      this.productoPersonalizadoService
        .update(updatePayload)
        .pipe(
          switchMap((pp) =>
            this.carritoProductoService.addCustomProduct(pp.id!, cantidad)
          ),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: () => {
            this.notification.success(
              this.translate.instant('NOTIFICATIONS.SUCCESS'),
              this.translate.instant('NOTIFICATIONS.PRODUCT_UPDATED')
            );
            this.dialogRef.close(true);
          },
          error: (err) => {
            console.error('Error en el proceso:', err);
            this.notification.error(
              this.translate.instant('NOTIFICATIONS.ERROR'),
              this.translate.instant('NOTIFICATIONS.OPERATION_FAILED')
            );
            this.loading = false;
          },
        });
    } else {
      const configuracionObj = {
        tamaño: this.nombreTamanoSeleccionado,
        color: this.nombreColorSeleccionado,
        material: this.nombreMaterialSeleccionado,
      };

      const createPayload: ProductoPersonalizadoModel = {
        productoBaseId: this.productoBase.id,
        usuarioId: usuario.id,
        configuracion: JSON.stringify(configuracionObj),
        precioFinal: precioFinalNum,
        componentes: componentesPayload,
      };

      this.productoPersonalizadoService
        .create(createPayload)
        .pipe(
          switchMap((pp) =>
            this.carritoProductoService.addCustomProduct(pp.id!, cantidad)
          ),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: () => {
            this.notification.success(
              this.translate.instant('NOTIFICATIONS.SUCCESS'),
              this.translate.instant('NOTIFICATIONS.PRODUCT_ADDED')
            );
            this.dialogRef.close(true);
          },
          error: (err) => {
            console.error('Error en el proceso:', err);
            this.notification.error(
              this.translate.instant('NOTIFICATIONS.ERROR'),
              this.translate.instant('NOTIFICATIONS.OPERATION_FAILED')
            );
            this.loading = false;
          },
        });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
