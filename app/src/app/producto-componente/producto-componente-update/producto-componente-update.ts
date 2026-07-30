import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { ProductoComponenteService } from '../../share/services/producto-componente.service';
import { ProductoService } from '../../share/services/producto.service';
import { ComponenteService } from '../../share/services/componente.service';
import { NotificationService } from '../../share/notification-service';
import { Router } from '@angular/router';
import { ProductoModel } from '../../share/models/ProductoModel';
import { ComponenteModel } from '../../share/models/ComponenteModel';
import { ProductoComponenteModel } from '../../share/models/ProductoComponenteModel';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-producto-componente-update',
  standalone: false,
  templateUrl: './producto-componente-update.html',
  styleUrl: './producto-componente-update.css',
})
export class ProductoComponenteUpdate implements OnInit, OnDestroy {
  formRelacion: FormGroup;
  selectedProductoNombre = '';
  productos: ProductoModel[] = [];
  tamanos: ComponenteModel[] = [];
  colores: ComponenteModel[] = [];
  materiales: ComponenteModel[] = [];
  selectedProductoId!: number;
  private destroy$ = new Subject<boolean>();

  constructor(
    private fb: FormBuilder,
    private productoComponenteService: ProductoComponenteService,
    private productoService: ProductoService,
    private componenteService: ComponenteService,
    private notification: NotificationService,
    private translate: TranslateService,
    private router: Router
  ) {
    this.formRelacion = this.fb.group({
      id_producto: [{ value: '', disabled: true }, Validators.required],
      tamanos: new FormControl([]),
      colores: new FormControl([]),
      materiales: new FormControl([]),
    });
  }

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarComponentes(); // forkJoin para cargar todos los componentes
  }

  cargarProductos() {
    this.productoService
      .get()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productos) => (this.productos = productos),
        error: () =>
          this.notification.error('Error', 'Error al cargar los productos'),
      });
  }

  cargarComponentes() {
    // Primero cargamos todos los componentes (tamaños, colores, materiales)
    forkJoin({
      tamanos: this.componenteService.getSizes(),
      colores: this.componenteService.getColors(),
      materiales: this.componenteService.getMaterials(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ tamanos, colores, materiales }) => {
          this.tamanos = tamanos;
          this.colores = colores;
          this.materiales = materiales;

          // Solo después de tener los componentes, cargamos la relación existente
          this.cargarRelacionExistente();
        },
        error: () => {
          this.notification.error('Error', 'Error al cargar los componentes');
        },
      });
  }

  cargarRelacionExistente() {
    const producto: ProductoModel = history.state.producto;
    if (!producto) return;

    this.selectedProductoId = producto.id!;
    this.selectedProductoNombre = producto.nombre;
    this.formRelacion.patchValue({ id_producto: this.selectedProductoId });

    this.productoComponenteService
      .getByProductId(this.selectedProductoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((relaciones: any) => {
        // <--- 'any' evita el error de TS
        this.formRelacion.patchValue({
          tamanos: this.tamanos
            .filter((c) => relaciones.tamanos.includes(c.id))
            .map((c) => c.id),
          colores: this.colores
            .filter((c) => relaciones.colores.includes(c.id))
            .map((c) => c.id),
          materiales: this.materiales
            .filter((c) => relaciones.materiales.includes(c.id))
            .map((c) => c.id),
        });
      });
  }

  async onSubmit() {
    if (this.formRelacion.invalid) {
      this.notification.error(
        'Error',
        'Por favor seleccione un producto y al menos un componente'
      );
      return;
    }

    const idProducto = this.selectedProductoId;

    const data = {
      tamanos: this.formRelacion.value.tamanos || [],
      colores: this.formRelacion.value.colores || [],
      materiales: this.formRelacion.value.materiales || [],
    };

    this.productoComponenteService
      .updateByProduct(idProducto, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notification.success(
            'Éxito',
            'Relaciones actualizadas correctamente'
          );
          this.router.navigate(['/productoComponente/admin']);
        },
        error: (err) => {
          console.error('Error al actualizar relaciones:', err);
          this.notification.error(
            'Error',
            'Error al actualizar las relaciones'
          );
        },
      });
  }

  getTipoComponente(grupoId?: number): string {
    switch (grupoId) {
      case 1:
        return 'Tamaño';
      case 2:
        return 'Color';
      case 3:
        return 'Material';
      default:
        return 'Desconocido';
    }
  }

  onCancel() {
    this.router.navigate(['/productoComponente/admin']);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
