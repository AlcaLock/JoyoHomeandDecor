import { Component, computed, effect, OnDestroy, OnInit } from '@angular/core';
import { map, Subject, switchMap, takeUntil, throwError } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../share/notification-service';
import { CarritoProductoService } from '../../share/services/carrito-producto.service';
import { CarritoService } from '../../share/services/carrito.service';
import { ProductoPersonalizadoModel } from '../../share/models/ProductoPersonalizadoModel';
import { ProductoModel } from '../../share/models/ProductoModel';
import { UsuarioModel } from '../../share/models/UsuarioModel';
import { UsuarioService } from '../../share/services/usuario.service';
import { MatDialog } from '@angular/material/dialog';
import { CarritoDiag } from '../carrito-diag/carrito-diag';
import { PedidoProductoModel } from '../../share/models/PedidoProductoModel';
import { PedidoModel } from '../../share/models/PedidoModel';
import { PedidoService } from '../../share/services/pedido.service';
import { EstadoPedidoModel } from '../../share/models/EstadoPedidoModel';
import { MetodoPagoModel } from '../../share/models/MetodoPagoModel';
import { AuthenticationService } from '../../share/authentication.service';
import { CarritoProductoModel } from '../../share/models/CarritoProductoModel';
import { CarritoModel } from '../../share/models/CarritoModel';
import { PagoEfectivo } from '../pago-efectivo/pago-efectivo';
import { PagoTarjeta } from '../pago-tarjeta/pago-tarjeta';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-carrito-index',
  standalone: false,
  templateUrl: './carrito-index.html',
  styleUrls: ['./carrito-index.css'],
})
export class CarritoIndex implements OnInit, OnDestroy {
  private destroy$ = new Subject<boolean>();
  private lastLoadedUserId: number | null = null;

  cantidadInputs: { [key: number]: string } = {};

  loading = true;
  metodoPago: 'EFECTIVO' | 'TARJETA' = 'EFECTIVO';
  today = new Date();
  usuario: UsuarioModel | null = null;
  direccionEnvio: string = '';
  estadoPedido: EstadoPedidoModel = EstadoPedidoModel.PENDIENTE_PAGO;

  get items() {
    return this.carritoProductoService.items();
  }

  get total() {
    return this.carritoProductoService.total();
  }

  get getImpuesto() {
    return this.carritoProductoService.getImpuesto();
  }

  get getTotalConImpuesto() {
    return this.carritoProductoService.getTotalConImpuesto();
  }

  get currentLang(): string {
    return this.translate.currentLang;
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private carritoService: CarritoService,
    private carritoProductoService: CarritoProductoService,
    private noti: NotificationService,
    private usuarioService: UsuarioService,
    private pedidoService: PedidoService,
    private authService: AuthenticationService,
    private translate: TranslateService,
    private dialog: MatDialog
  ) {
    effect(() => {
      const usuario = this.authService.currentUserSignal();
      if (usuario?.id && this.lastLoadedUserId !== usuario.id) {
        this.loadCarritoWithPersistence();
      }
    });
  }

  ngOnInit(): void {
    const usuario = this.authService.currentUserSignal();
    if (usuario?.id && this.lastLoadedUserId !== usuario.id) {
      this.loadCarritoWithPersistence();
    }
  }

  private loadCarritoWithPersistence(): void {
    const usuario = this.authService.currentUserSignal();
    if (!usuario?.id) return;
    this.lastLoadedUserId = usuario.id;
    this.usuario = usuario; // <--- esto faltaba
    this.loading = true;

    const localItems = this.carritoProductoService.getCartFromStorage();
    if (localItems.length > 0) {
      this.carritoProductoService.setTempItems(localItems);
    }

    this.carritoProductoService
      .loadCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Parsear todos los precios a number de manera segura
          const parsedItems = data.map((item: CarritoProductoModel) => {
            const precioBase = Number(item.precioUnitario) || 0; // base seguro como número
            let precioComponentes = 0;

            if (item.personalizado) {
              precioComponentes = (item.personalizado.componentes ?? []).reduce(
                (acc, c) => acc + (Number(c.componente?.precio) || 0),
                0
              );

              // Recalcular precioTotalPersonalizado según cantidad existente
              const cantidad = Number(item.cantidad) || 1; // default 1
              item.personalizado.precioTotalPersonalizado =
                (precioBase + precioComponentes) * cantidad;
            }

            return {
              ...item,
              precioUnitario: precioBase, // precio base real
              personalizado: item.personalizado
                ? {
                    ...item.personalizado,
                    componentes: item.personalizado.componentes?.map((c) => ({
                      ...c,
                      componente: c.componente
                        ? {
                            ...c.componente,
                            precio: Number(c.componente.precio) || 0,
                          }
                        : undefined,
                    })),
                    precioBase,
                    precioTotalPersonalizado:
                      item.personalizado.precioTotalPersonalizado ||
                      precioBase + precioComponentes,
                  }
                : undefined,
            };
          });

          this.carritoProductoService.setTempItems(parsedItems);

          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar carrito:', err);
          this.noti.warning(
            this.translate.instant('NOTIFICATIONS.WARNING'),
            this.translate.instant('NOTIFICATIONS.CART_LOADED_CACHE')
          );

          this.loading = false;
        },
      });
  }

  getEstadoLegible(estado: EstadoPedidoModel): string {
    switch (estado) {
      case EstadoPedidoModel.PENDIENTE_PAGO:
        return 'Pendiente de pago';
      case EstadoPedidoModel.PAGADO:
        return 'Pagado';
      case EstadoPedidoModel.EN_PREPARACION:
        return 'En preparación';
      case EstadoPedidoModel.ENTREGADO:
        return 'Entregado';
      default:
        return 'Desconocido';
    }
  }

  agregarProductoPersonalizado(productoBase?: ProductoModel) {
    // Quitar la validación que retorna si productoBase es undefined
    const dialogRef = this.dialog.open(CarritoDiag, {
      width: '800px',
      height: '600px',
      data: {
        producto: productoBase || {}, // si no hay base, pasar objeto vacío
        cantidadInicial: 1,
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCarritoWithPersistence();
      }
    });
  }

  editarProductoPersonalizado(carritoItem: CarritoProductoModel) {
    if (!carritoItem.personalizado || !carritoItem.personalizado.id) return;

    const dialogRef = this.dialog.open(CarritoDiag, {
      width: '800px',
      height: '600px',
      data: {
        producto: carritoItem.producto || {},
        productoPersonalizado: carritoItem.personalizado,
        cantidadInicial: carritoItem.cantidad,
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCarritoWithPersistence();
      }
    });
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes('imagen-no-encontrada.jpg')) {
      img.src = 'assets/uploads/imagen-no-encontrada.jpg';
    }
    img.onerror = null;
  }

  addProduct(productoId: number): void {
    // Buscar el producto en los items actuales
    const producto = this.items.find(
      (i) => i.productoId === productoId
    )?.producto;

    if (!producto) {
      this.noti.error(
        this.translate.instant('NOTIFICATIONS.ERROR'),
        this.translate.instant('NOTIFICATIONS.PRODUCT_NOT_FOUND')
      );
      return;
    }

    if (producto.stock <= 0) {
      this.noti.warning(
        this.translate.instant('NOTIFICATIONS.STOCK_EMPTY'),
        this.translate.instant('NOTIFICATIONS.PRODUCT_NO_LONGER_AVAILABLE')
      );
      return;
    }

    this.carritoProductoService
      .addProduct(productoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.noti.success(
            this.translate.instant('NOTIFICATIONS.PRODUCT_ADDED'),
            this.translate.instant('NOTIFICATIONS.PRODUCT_ADDED_TO_CART')
          );
        },
        error: (err) => {
          console.error('Error al agregar producto:', err);
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.ADD_PRODUCT_FAILED')
          );

          this.loadCarritoWithPersistence();
        },
      });
  }

  addCustomProduct(personalizadoId: number): void {
    const personalizado = this.items.find(
      (i) => i.personalizadoId === personalizadoId
    )?.personalizado;

    if (!personalizado) {
      this.noti.error(
        this.translate.instant('NOTIFICATIONS.ERROR'),
        this.translate.instant('NOTIFICATIONS.CUSTOM_PRODUCT_NOT_FOUND')
      );

      return;
    }

    const stockBase = personalizado.productoBase?.stock ?? 0;
    if (stockBase <= 0) {
      this.noti.warning(
        this.translate.instant('NOTIFICATIONS.STOCK_EMPTY'),
        this.translate.instant('NOTIFICATIONS.OUT_OF_STOCK')
      );
      return;
    }

    this.carritoProductoService
      .addCustomProduct(personalizadoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.noti.success(
            this.translate.instant('NOTIFICATIONS.PRODUCT_ADDED'),
            this.translate.instant('NOTIFICATIONS.CUSTOM_PRODUCT_ADDED')
          );
        },
        error: (err) => {
          console.error('Error al agregar producto personalizado:', err);
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.CUSTOM_PRODUCT_ADD_FAILED')
          );
          this.loadCarritoWithPersistence();
        },
      });
  }

  carritoValido = computed(() => {
    const items = this.carritoProductoService.items();
    if (!items || items.length === 0) return false;

    for (const item of items) {
      const inputValue = this.cantidadInputs[item.id];
      const cantidad =
        inputValue !== undefined && inputValue !== ''
          ? Number(inputValue)
          : item.cantidad;

      const stock =
        item.producto?.stock ?? item.personalizado?.productoBase?.stock ?? 0;

      // Permitir input vacío temporalmente
      if (inputValue === '') return false;

      // El 0 elimina el item, así que carrito no es válido hasta que se recargue
      if (cantidad === 0) return false;

      if (!cantidad || isNaN(cantidad) || cantidad < 0) return false;
      if (cantidad > stock) return false;
    }

    return true;
  });

  handleQuantityInput(itemId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    const item = this.items.find((i) => i.id === itemId);
    if (!item) return;

    // Determinar stock base según tipo de producto
    let stockBase = 0;
    if (item.productoId) {
      stockBase = item.producto?.stock ?? 0;
    } else if (item.personalizadoId) {
      stockBase = item.personalizado?.productoBase?.stock ?? 0;
    }

    // Calcular cantidad ya ocupada por otros items iguales
    const cantidadExistente = this.items
      .filter((i) => i.id !== itemId)
      .reduce((acc, i) => {
        // Producto simple: comparar productoId
        if (item.productoId && i.productoId === item.productoId)
          return acc + (i.cantidad || 0);
        // Producto personalizado: comparar producto base
        if (
          item.personalizadoId &&
          i.personalizado?.productoBase?.id ===
            item.personalizado?.productoBase?.id
        )
          return acc + (i.cantidad || 0);
        return acc;
      }, 0);

    const stockRestante = stockBase - cantidadExistente;

    if (value === '') {
      // Input vacío: mostrar warning pero no actualizar cantidad
      this.cantidadInputs[itemId] = '';
      this.noti.warning(
        this.translate.instant('NOTIFICATIONS.WARNING'),
        this.translate.instant('NOTIFICATIONS.INVALID_QUANTITY')
      );
      return;
    }

    const quantity = Number(value);

    if (isNaN(quantity) || quantity < 0) {
      this.cantidadInputs[itemId] = '';
      this.noti.warning(
        this.translate.instant('NOTIFICATIONS.WARNING'),
        this.translate.instant('NOTIFICATIONS.ENTER_VALID_NUMBER_GE0')
      );
      return;
    }

    if (quantity === 0) {
      // Eliminar item del carrito si es 0
      this.removeItem(itemId);
      delete this.cantidadInputs[itemId];
      return;
    }

    if (quantity > stockRestante) {
      this.cantidadInputs[itemId] = stockRestante.toString();
      this.noti.warning(
        this.translate.instant('NOTIFICATIONS.INSUFFICIENT_STOCK'),
        this.translate.instant('NOTIFICATIONS.ONLY_X_UNITS_AVAILABLE', {
          stock: stockRestante,
        })
      );
      this.updateQuantity(itemId, stockRestante);
      return;
    }

    // Cantidad válida mayor a 0
    delete this.cantidadInputs[itemId];
    this.updateQuantity(itemId, quantity);
  }

  onQuantityInputChange(itemId: number, value: string) {
    this.cantidadInputs[itemId] = value;
  }

  updateQuantity(
    itemId: number,
    newQuantity: number,
    showSuccess = true
  ): void {
    const item = this.items.find((i: CarritoProductoModel) => i.id === itemId);
    if (!item) return;

    // Determinar stock base según tipo de producto
    let stockBase = 0;
    if (item.productoId) {
      stockBase = item.producto?.stock ?? 0;
    } else if (item.personalizadoId) {
      stockBase = item.personalizado?.productoBase?.stock ?? 0;
    }

    // Calcular cantidad ya ocupada por otros items iguales
    const cantidadExistente = this.items
      .filter((i) => i.id !== itemId)
      .reduce((acc, i) => {
        const mismoProductoBase =
          (item.productoId &&
            (i.productoId === item.productoId ||
              i.personalizado?.productoBase?.id === item.productoId)) ||
          (item.personalizado?.productoBase?.id &&
            (i.productoId === item.personalizado.productoBase.id ||
              i.personalizado?.productoBase?.id ===
                item.personalizado.productoBase.id));
        return acc + (mismoProductoBase ? i.cantidad || 0 : 0);
      }, 0);

    const availableStock = stockBase - cantidadExistente;

    if (newQuantity > availableStock) {
      this.noti.warning(
        this.translate.instant('NOTIFICATIONS.STOCK_INSUFFICIENT'),
        this.translate.instant('NOTIFICATIONS.ONLY_X_UNITS_AVAILABLE', {
          stock: availableStock,
        }) +
          ' ' +
          this.translate.instant('NOTIFICATIONS.ADJUSTED_AUTOMATICALLY')
      );

      newQuantity = availableStock;
      showSuccess = false;
    }

    item.cantidad = newQuantity;
    this.cantidadInputs[itemId] = newQuantity.toString();

    // **Recalcular precio del personalizado dinámicamente**
    if (item.personalizado) {
      const precioBase = Number(item.precioUnitario) || 0;
      const precioComponentes = (item.personalizado.componentes ?? []).reduce(
        (acc, c) => acc + (Number(c.componente?.precio) || 0),
        0
      );
      item.personalizado.precioTotalPersonalizado =
        (precioBase + precioComponentes) * newQuantity;
    }

    // Luego actualizar en el servidor
    this.carritoProductoService
      .updateQuantity(itemId, newQuantity)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (showSuccess) {
            this.noti.success(
              this.translate.instant('NOTIFICATIONS.SUCCESS'),
              this.translate.instant('NOTIFICATIONS.QUANTITY_PRICE_UPDATED')
            );
          }
        },
        error: (err) => {
          console.error('Error al actualizar cantidad:', err);
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.QUANTITY_UPDATE_FAILED')
          );
        },
      });
  }

  removeItem(itemId: number): void {
    this.carritoProductoService
      .removeItem(itemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.noti.success(
            this.translate.instant('NOTIFICATIONS.PRODUCT_REMOVED'),
            this.translate.instant('NOTIFICATIONS.PRODUCT_REMOVED_FROM_CART')
          );
          // No llamar a loadCarritoWithPersistence() aquí
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.FAILED_TO_REMOVE_PRODUCT')
          );
          // El servicio ya maneja la recarga en caso de error
        },
      });
  }

  clearCart(): void {
    this.carritoProductoService
      .clearCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.noti.success(
            this.translate.instant('NOTIFICATIONS.CART_CLEARED'),
            this.translate.instant('NOTIFICATIONS.ALL_PRODUCTS_REMOVED')
          );
          // Recargar el carrito para asegurar sincronización
          this.loadCarritoWithPersistence();
        },
        error: (err) => {
          console.error('Error al vaciar carrito:', err);
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.CART_CLEAR_FAILED')
          );
          // Forzar recarga del estado actual
          this.loadCarritoWithPersistence();
        },
      });
  }

  checkout(): void {
    this.router.navigate(['/pedido/checkout']);
  }

  guardarCarrito() {
    if (!this.usuario) return;

    this.carritoService
      .guardarCarrito(this.usuario.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.noti.success(
            this.translate.instant('NOTIFICATIONS.SUCCESS'),
            this.translate.instant('NOTIFICATIONS.CART_SAVED')
          );
        },
        error: (err) => {
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            err.error?.message ||
              this.translate.instant('NOTIFICATIONS.CART_SAVE_FAILED')
          );
        },
      });
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

  getItemUnitPrice(item: CarritoProductoModel): number {
    if (item.personalizado) {
      const precioBase = Number(
        item.precioUnitario ?? item.personalizado.productoBase?.precio ?? 0
      );
      const precioComponentes = (item.personalizado.componentes ?? []).reduce(
        (acc, c) => acc + Number(c.componente?.precio ?? 0),
        0
      );

      return Number(item.personalizado.precioFinal ?? 0) ||
        precioBase + precioComponentes;
    }

    return Number(item.precioUnitario ?? item.producto?.precio ?? 0);
  }

  getItemSubtotal(item: CarritoProductoModel): number {
    return this.getItemUnitPrice(item) * Number(item.cantidad ?? 1);
  }

  getItemTax(item: CarritoProductoModel): number {
    return this.getItemSubtotal(item) * 0.13;
  }

  crearPedido(): void {
    if (!this.usuario) {
      this.noti.error(
        this.translate.instant('NOTIFICATIONS.ERROR'),
        this.translate.instant('NOTIFICATIONS.USER_NOT_FOUND')
      );

      return;
    }

    if (!this.direccionEnvio?.trim()) {
      this.noti.error(
        this.translate.instant('NOTIFICATIONS.ERROR'),
        this.translate.instant('NOTIFICATIONS.ENTER_SHIPPING_ADDRESS')
      );

      return;
    }

    // Obtener items desde el signal
    const items = this.carritoProductoService.items();
    if (!items || items.length === 0) {
      this.noti.error(
        this.translate.instant('NOTIFICATIONS.ERROR'),
        this.translate.instant('NOTIFICATIONS.EMPTY_CART')
      );

      return;
    }

    for (const item of items) {
      // Nombre del producto para mostrar en mensajes
      const nombreProducto =
        item.producto?.nombre ||
        item.personalizado?.productoBase?.nombre ||
        'desconocido';

      // Validar cantidad numérica y positiva
      if (!item.cantidad || isNaN(item.cantidad) || item.cantidad < 1) {
        this.noti.error(
          this.translate.instant('NOTIFICATIONS.INVALID_QUANTITY'),
          this.translate.instant('NOTIFICATIONS.INVALID_PRODUCT_QUANTITY', {
            nombre: nombreProducto,
          })
        );
        return;
      }

      // Validar stock disponible
      const availableStock =
        item.producto?.stock ?? item.personalizado?.productoBase?.stock ?? 0;
      if (item.cantidad > availableStock) {
        this.noti.warning(
          this.translate.instant('NOTIFICATIONS.INSUFFICIENT_STOCK'),
          this.translate.instant('NOTIFICATIONS.INSUFFICIENT_PRODUCT_STOCK', {
            nombre: nombreProducto,
            stock: availableStock,
          })
        );
        return;
      }
    }

    // Configuración del diálogo de pago
    const dialogConfig = {
      width: '800px',
      maxWidth: '90vw',
      height: '600px',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      data: { total: this.carritoProductoService.getTotalConImpuesto() },
    };

    let dialogRef;
    if (this.metodoPago === 'EFECTIVO') {
      dialogRef = this.dialog.open(PagoEfectivo, dialogConfig);
    } else if (this.metodoPago === 'TARJETA') {
      dialogRef = this.dialog.open(PagoTarjeta, dialogConfig);
    } else {
      this.noti.error(
        this.translate.instant('NOTIFICATIONS.ERROR'),
        this.translate.instant('NOTIFICATIONS.INVALID_PAYMENT_METHOD')
      );
      return;
    }

    dialogRef.afterClosed().subscribe((pagoAceptado: boolean) => {
      if (!pagoAceptado) {
        return;
      }

      const estadoPedido = EstadoPedidoModel.PAGADO;

      const carritoValue =
        this.carritoProductoService.currentCart() ||
        this.carritoProductoService.getCartFromStorage()[0];

      if (!carritoValue || !carritoValue.id) {
        this.noti.error(
          this.translate.instant('NOTIFICATIONS.ERROR'),
          this.translate.instant('NOTIFICATIONS.INVALID_CART')
        );
        return;
      }

      // Preparar el payload de items
      const itemsPayload = items.map((item: CarritoProductoModel) => ({
        productoId: item.productoId || null,
        personalizadoId: item.personalizadoId || null,
        cantidad: item.cantidad,
        precioUnitario: Number(item.precioUnitario ?? 0), // usar siempre lo que viene del service
      }));

      const payload = {
        usuarioId: this.usuario?.id,
        carritoId: carritoValue.id,
        direccionEnvio: this.direccionEnvio,
        metodoPago: this.metodoPago,
        estado: estadoPedido, 
        subtotal: Number(this.carritoProductoService.total()),
        total: Number(this.carritoProductoService.getTotalConImpuesto()),
        items: itemsPayload,
      };

      this.loading = true;

      // Crear pedido
      this.pedidoService
        .create(payload as any)
        .pipe(
          switchMap((pedidoCreado: PedidoModel) =>
            this.carritoService
              .getByUser(this.usuario!.id)
              .pipe(
                switchMap((carritoActual) =>
                  this.carritoProductoService
                    .completeOrder(carritoActual.id)
                    .pipe(map(() => pedidoCreado))
                )
              )
          )
        )
        .subscribe({
          next: (pedidoCreado: PedidoModel) => {
            this.noti.success(
              this.translate.instant('NOTIFICATIONS.SUCCESS'),
              this.translate.instant('NOTIFICATIONS.ORDER_CREATED')
            );
            this.loading = false;
            this.router.navigate(['/producto']);
          },
          error: (err) => {
            console.error('Error creando pedido:', err);
            this.noti.error(
              this.translate.instant('NOTIFICATIONS.ERROR'),
              this.translate.instant('NOTIFICATIONS.ORDER_CREATION_FAILED')
            );
            this.loading = false;
          },
        });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
