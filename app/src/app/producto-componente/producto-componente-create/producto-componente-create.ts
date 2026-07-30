import { Component, OnDestroy, OnInit } from '@angular/core';
import { ProductoModel } from '../../share/models/ProductoModel';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ComponenteModel } from '../../share/models/ComponenteModel';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { ProductoComponenteService } from '../../share/services/producto-componente.service';
import { ProductoService } from '../../share/services/producto.service';
import { ComponenteService } from '../../share/services/componente.service';
import { NotificationService } from '../../share/notification-service';
import { Router } from '@angular/router';
import { ProductoComponenteModel } from '../../share/models/ProductoComponenteModel';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-producto-componente-create',
  standalone: false,
  templateUrl: './producto-componente-create.html',
  styleUrl: './producto-componente-create.css',
})
export class ProductoComponenteCreate implements OnInit, OnDestroy {
  formRelacion: FormGroup;
  productos: ProductoModel[] = [];
  tamanos: ComponenteModel[] = [];
  colores: ComponenteModel[] = [];
  materiales: ComponenteModel[] = [];
  private destroy$ = new Subject<boolean>();
  relacionesConflictivas: any[] = [];

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
      id_producto: ['', Validators.required],
      tamanos: new FormControl([]),
      colores: new FormControl([]),
      materiales: new FormControl([]),
    });
  }

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarComponentes();
  }

  cargarProductos() {
    this.productoService
      .get()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productos) => (this.productos = productos),
        error: (err) =>
          this.notification.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.LOAD_PRODUCTS_FAILED')
          ),
      });
  }

  cargarComponentes() {
    this.componenteService
      .getSizes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((tamanos) => (this.tamanos = tamanos));

    this.componenteService
      .getColors()
      .pipe(takeUntil(this.destroy$))
      .subscribe((colores) => (this.colores = colores));

    this.componenteService
      .getMaterials()
      .pipe(takeUntil(this.destroy$))
      .subscribe((materiales) => (this.materiales = materiales));
  }

  async verificarConflictos(
    idProducto: number,
    idComponente: number
  ): Promise<any> {
    return new Promise((resolve) => {
      this.productoComponenteService
        .verificarRelacionExistente(idProducto, idComponente)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => resolve(response),
          error: () => resolve(null),
        });
    });
  }

  async onSubmit() {
    if (this.formRelacion.invalid) {
      this.notification.error(
        this.translate.instant('NOTIFICATIONS.ERROR'),
        this.translate.instant('NOTIFICATIONS.SELECT_PRODUCT_AND_COMPONENT')
      );
      return;
    }

    const idProducto = this.formRelacion.value.id_producto;
    const componentesSeleccionados = [
      ...(this.formRelacion.value.tamanos || []),
      ...(this.formRelacion.value.colores || []),
      ...(this.formRelacion.value.materiales || []),
    ];

    if (componentesSeleccionados.length === 0) {
      this.notification.error(
        this.translate.instant('NOTIFICATIONS.ERROR'),
        this.translate.instant('NOTIFICATIONS.SELECT_AT_LEAST_ONE_COMPONENT')
      );
      return;
    }

    // Verificar conflictos
    this.relacionesConflictivas = [];
    for (const idComponente of componentesSeleccionados) {
      const resultado = await this.verificarConflictos(
        idProducto,
        idComponente
      );
      if (resultado?.existe) {
        const componente = [
          ...this.tamanos,
          ...this.colores,
          ...this.materiales,
        ].find((c) => c.id === idComponente);
        this.relacionesConflictivas.push({
          idComponente,
          nombre: componente?.nombre,
          tipo: this.getTipoComponente(componente?.grupoComponenteId),
        });
      }
    }

    if (this.relacionesConflictivas.length > 0) {
     this.notification.error(
  this.translate.instant('NOTIFICATIONS.ERROR'),
  this.getMensajeConflictos()
);
      return;
    }

    // Crear relaciones si no hay conflictos
    const requests = componentesSeleccionados.map((idComponente) =>
      this.productoComponenteService
        .create({
          id_producto: idProducto,
          id_componente: idComponente,
        })
        .toPromise()
    );

    Promise.all(requests)
      .then(() => {
       this.notification.success(
  this.translate.instant('NOTIFICATIONS.SUCCESS'),
  this.translate.instant('NOTIFICATIONS.RELATIONS_CREATED')
);
        this.router.navigate(['/productoComponente/admin']);
      })
      .catch((err) => {
        console.error('Error al crear relaciones:', err);
        this.notification.error(
  this.translate.instant('NOTIFICATIONS.ERROR'),
  this.translate.instant('NOTIFICATIONS.RELATIONS_CREATION_FAILED')
);
      });
  }

  getMensajeConflictos(): string {
    if (this.relacionesConflictivas.length === 0) return '';

    const mensajes = this.relacionesConflictivas.map(
      (conflicto) => `${conflicto.nombre} (${conflicto.tipo})`
    );

    return `Las siguientes relaciones ya existen: ${mensajes.join(', ')}. 
            Por favor seleccione otros componentes.`;
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
