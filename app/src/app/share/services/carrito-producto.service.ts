import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CarritoProductoModel } from '../models/CarritoProductoModel';
import { CarritoModel } from '../models/CarritoModel';
import { Observable, tap, map, throwError, catchError, of } from 'rxjs';
import { AuthenticationService } from '../authentication.service';

@Injectable({
  providedIn: 'root',
})
export class CarritoProductoService {
  private _cartItems = signal<CarritoProductoModel[]>(
    this.getCartFromStorage()
  );
  public items = computed(() => this._cartItems());
  private _currentCart = signal<CarritoModel | null>(null);
  public currentCart = computed(() => this._currentCart());

  public total = computed(() =>
    this._cartItems().reduce((sum, item) => {
      const cantidad = Number(item.cantidad ?? 1);
      const precioBase = Number(
        item.precioUnitario ??
          item.producto?.precio ??
          item.personalizado?.productoBase?.precio ??
          0
      );

      if (item.personalizado) {
        const precioComponentes = (item.personalizado.componentes ?? []).reduce(
          (acc, c) => acc + Number(c.componente?.precio ?? 0),
          0
        );
        const precioUnitarioPersonalizado =
          Number(item.personalizado.precioFinal ?? 0) ||
          precioBase + precioComponentes;
        return sum + precioUnitarioPersonalizado * cantidad;
      }

      return sum + precioBase * cantidad;
    }, 0)
  );

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {
    // Sincronizar carrito con localStorage
    effect(() => {
      const items = this._cartItems();
      if (items.length > 0) {
        localStorage.setItem('cartItems', JSON.stringify(items));
      } else {
        localStorage.removeItem('cartItems');
      }
    });

    // Limpiar carrito cuando el usuario se desloguea
    effect(() => {
      if (!this.authService.isAuthenticatedSignal()) {
        this._cartItems.set([]);
        localStorage.removeItem('cartItems');
      }
    });

  }

  private get currentUserId(): number | null {
    return this.authService.currentUserSignal()?.id || null;
  }

  private parseCartItem(item: CarritoProductoModel): CarritoProductoModel {
    // cantidad siempre número
    const cantidad = Number(item.cantidad ?? 1);

    // precioUnitario (producto normal o personalizado base)
    const precioBase = Number(
      item.precioUnitario ??
        item.producto?.precio ??
        item.personalizado?.productoBase?.precio ??
        0
    );

    // Si es producto personalizado
    if (item.personalizado) {
      // precio final del backend
      const precioFinal = Number(item.personalizado.precioFinal ?? 0);

      // también calculamos por seguridad (precioBase + componentes) * cantidad
      const precioComponentes = (item.personalizado.componentes ?? []).reduce(
        (acc, c) => acc + Number(c.componente?.precio ?? 0),
        0
      );

      item.personalizado.precioTotalPersonalizado =
        (precioBase + precioComponentes) * cantidad;

      // 👇 en caso de que el backend ya mande precioFinal calculado
      if (precioFinal > 0) {
        item.personalizado.precioTotalPersonalizado = precioFinal * cantidad;
      }
    }

    return {
      ...item,
      precioUnitario: precioBase, // aseguramos número
      cantidad,
    };
  }

  loadCart(): Observable<CarritoProductoModel[]> {
    return this.http
      .get<CarritoModel>(
        `${environment.apiURL}/${environment.endPointCarrito}/usuario/${this.currentUserId}`
      )
      .pipe(
        map((carrito: CarritoModel) => {
          if (!carrito) {
            throw new Error('Carrito no encontrado');
          }
          this._currentCart.set(carrito);
          return (carrito.productos || []).map((p) => this.parseCartItem(p)); // 👈 parseo
        }),
        tap((serverItems: CarritoProductoModel[]) => {
          const localItems = this.getCartFromStorage();
          const mergedItems = this.mergeCarts(serverItems, localItems);

          // 🔑 Normalizamos el resultado final
          const parsedMerged = mergedItems.map((p) => this.parseCartItem(p));

          this._cartItems.set(parsedMerged);
          this.saveCartToStorage(parsedMerged);
        }),

        catchError((error) => {
          console.error('Error loading cart from server:', error);
          const localItems = this.getCartFromStorage();
          this._cartItems.set(localItems);
          return of(localItems);
        })
      );
  }

  private saveCartToStorage(items: CarritoProductoModel[]): void {
    localStorage.setItem('cartItems', JSON.stringify(items));
  }

  // Método para cargar solo del servidor
  loadCartFromServer(): Observable<CarritoProductoModel[]> {
    if (!this.currentUserId) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.http
      .get<CarritoModel>(
        `${environment.apiURL}/${environment.endPointCarrito}/usuario/${this.currentUserId}`
      )
      .pipe(
        map((carrito: CarritoModel) => {
          this._currentCart.set(carrito ?? null);
          return (carrito?.productos || []).map((p) => this.parseCartItem(p));
        }),
        tap((productos: CarritoProductoModel[]) => {
          this._cartItems.set(productos);
        }),
        catchError((error) => {
          console.error('Error loading cart from server:', error);
          return throwError(() => error);
        })
      );
  }

private mergeCarts(
  serverItems: CarritoProductoModel[],
  localItems: CarritoProductoModel[]
): CarritoProductoModel[] {
  if (!serverItems || serverItems.length === 0) {
    return localItems.map((p) => this.parseCartItem(p)); // 👈 normalizamos
  }

  const merged = [...serverItems];

  localItems.forEach((localItem) => {
    const exists = serverItems.some(
      (serverItem) =>
        (serverItem.productoId &&
          serverItem.productoId === localItem.productoId) ||
        (serverItem.personalizadoId &&
          serverItem.personalizadoId === localItem.personalizadoId)
    );

    if (!exists) {
      merged.push(localItem);
    }
  });

  // 🔑 Normalizamos TODO antes de devolver
  return merged.map((p) => this.parseCartItem(p));
}


  getCartFromStorage(): CarritoProductoModel[] {
    const cartData = localStorage.getItem('cartItems');
    return cartData ? JSON.parse(cartData) : [];
  }

  addProduct(productoId: number): Observable<CarritoProductoModel> {
    if (!this.currentUserId) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.http
      .post<CarritoProductoModel>(
        `${environment.apiURL}/${environment.endPointCarritoProducto}/producto`,
        {
          usuarioId: this.currentUserId,
          productoId,
          cantidad: 1,
        }
      )
      .pipe(
        map((updatedItem) => this.parseCartItem(updatedItem)),
        tap((parsedItem) => {
          console.log('Producto agregado al carrito:', parsedItem);

          this._cartItems.update((items) => {
            const existingIndex = items.findIndex(
              (item) =>
                item.id === parsedItem.id ||
                item.productoId === parsedItem.productoId
            );

            return existingIndex >= 0
              ? items.map((item, index) =>
                  index === existingIndex ? parsedItem : item
                )
              : [...items, parsedItem];
          });
        }),
        catchError((error) => {
          console.error('Error adding product:', error);
          return throwError(() => error);
        })
      );
  }

  addCustomProduct(
    personalizadoId: number,
    cantidad: number = 1
  ): Observable<CarritoProductoModel> {
    if (!this.currentUserId) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.http
      .post<CarritoProductoModel>(
        `${environment.apiURL}/${environment.endPointCarritoProducto}/producto-personalizado`,
        {
          usuarioId: this.currentUserId,
          personalizadoId,
          cantidad,
        }
      )
      .pipe(
        map((newItem) => this.parseCartItem(newItem)), // 👈 parseo
        tap((parsedItem) => {
          this._cartItems.update((items) => {
            const index = items.findIndex(
              (i) => i.personalizadoId === parsedItem.personalizadoId
            );
            if (index >= 0) {
              return items.map((item, i) => (i === index ? parsedItem : item));
            } else {
              return [...items, parsedItem];
            }
          });
        }),
        catchError((error) => {
          console.error('Error adding custom product:', error);
          return throwError(() => error);
        })
      );
  }
  updateQuantity(
    itemId: number,
    cantidad: number
  ): Observable<CarritoProductoModel> {
    return this.http
      .put<CarritoProductoModel>(
        `${environment.apiURL}/${environment.endPointCarritoProducto}/item/${itemId}`,
        { cantidad }
      )
      .pipe(
        map((updatedItem) => this.parseCartItem(updatedItem)), // 👈 parseo
        tap((parsedItem) => {
          this._cartItems.update((items) =>
            items.map((item) =>
              item.id === itemId
                ? parsedItem
                : item
            )
          );
        }),
        catchError((error) => {
          console.error('Error updating quantity:', error);
          return throwError(() => error);
        })
      );
  }

  removeItem(itemId: number): Observable<void> {
    return this.http
      .delete<void>(
        `${environment.apiURL}/${environment.endPointCarritoProducto}/item/${itemId}`
      )
      .pipe(
        tap(() => {
          // Actualizar estado local primero
          this._cartItems.update((items) =>
            items.filter((item) => item.id !== itemId)
          );
        }),
        catchError((error) => {
          console.error('Error removing item:', error);
          // Forzar recarga del estado desde el servidor en caso de error
          this.loadCartFromServer().subscribe();
          return throwError(() => error);
        })
      );
  }

  clearCart(): Observable<void> {
    if (!this.currentUserId) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.http
      .delete<void>(
        `${environment.apiURL}/carrito-producto/vaciar/usuario/${this.currentUserId}`
      )
      .pipe(
        tap(() => {
          // Limpiar solo los datos del carrito en localStorage
          localStorage.removeItem('cartItems');
          // Limpiar el estado local
          this._cartItems.set([]);
        }),
        catchError((error) => {
          console.error('Error al vaciar carrito:', error);
          // Mantener consistencia: limpiar localmente aunque falle en el servidor
          localStorage.removeItem('cartItems');
          this._cartItems.set([]);
          return throwError(() => error);
        })
      );
  }

  completeOrder(carritoId: number): Observable<{
    success: boolean;
    message: string;
    carritoCompletado: CarritoModel;
    nuevoCarrito: CarritoModel;
  }> {
    if (!carritoId) {
      return throwError(() => new Error('No se proporcionó el ID del carrito'));
    }

    return this.http
      .post<{
        success: boolean;
        message: string;
        carritoCompletado: CarritoModel;
        nuevoCarrito: CarritoModel;
      }>(
        `${environment.apiURL}/${environment.endPointCarrito}/completar-pedido/${carritoId}`,
        {} // body vacío
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            // Limpiar carrito anterior
            localStorage.removeItem('cartItems');
            this._cartItems.set([]);

            // Actualizar el carrito actual con el nuevo carrito creado
            if (response.nuevoCarrito) {
              this._currentCart.set(response.nuevoCarrito);
            }
          }
        }),
        catchError((error) => {
          console.error('Error al completar el pedido:', error);
          return throwError(() => error);
        })
      );
  }

  vanishCart() {
    this._cartItems.set([]);
    localStorage.removeItem('carrito');
  }

  setTempItems(items: CarritoProductoModel[]): void {
    this._cartItems.set(items);
  }

  getImpuesto(): number {
    return this.total() * 0.13;
  }

  getTotalConImpuesto(): number {
    return this.total() + this.getImpuesto();
  }
}

