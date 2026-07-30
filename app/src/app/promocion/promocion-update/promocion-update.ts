import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { PromocionModel } from '../../share/models/PromocionModel';
import { TipoDescuentoModel } from '../../share/models/TipoDescuentoModel';
import { CategoriaModel } from '../../share/models/CategoriaModel';
import { ProductoModel } from '../../share/models/ProductoModel';
import { PromocionService } from '../../share/services/promocion.service';
import { CategoriaService } from '../../share/services/categoria.service';
import { ProductoService } from '../../share/services/producto.service';
import { NotificationService } from '../../share/notification-service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-promocion-update',
  standalone: false,
  templateUrl: './promocion-update.html',
  styleUrl: './promocion-update.css',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromocionUpdate implements OnInit, OnDestroy {
  private destroy$ = new Subject<boolean>();
  promocionId!: number;
  promocion!: PromocionModel;

  // Listas para selects
  categoriasList: CategoriaModel[] = [];
  productosList: ProductoModel[] = [];

  // Enum para tipo de descuento
  TipoDescuento = TipoDescuentoModel;
  tipoDescuentoOptions = Object.values(TipoDescuentoModel);

  // Variables para autocomplete
  filteredCategorias: CategoriaModel[] = [];
  filteredProductos: ProductoModel[] = [];

  // Formulario reactivo
  promocionForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private promocionService: PromocionService,
    private categoriaService: CategoriaService,
    private productoService: ProductoService,
    private translate: TranslateService,
    private noti: NotificationService
  ) {}

  ngOnInit(): void {
    // Obtener el ID de la ruta
    this.promocionId = Number(this.route.snapshot.paramMap.get('id'));

    // Obtener la promoción del estado de navegación si está disponible
    const navigation = this.router.getCurrentNavigation();
    const statePromocion = navigation?.extras.state as {
      promocion: PromocionModel;
    };

    if (statePromocion?.promocion) {
      this.promocion = statePromocion.promocion;
      this.initFormWithData();
    } else {
      this.initEmptyForm();
      this.loadPromocion();
    }

    this.loadCategorias();
    this.loadProductos();
    this.setupFormListeners();
  }

  private initEmptyForm(): void {
    this.promocionForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      tipo: ['', Validators.required], // 'categoria' o 'producto'
      categoria: [''],
      producto: [''],
      tipoDescuento: [TipoDescuentoModel.PORCENTAJE, Validators.required],
      descuento: [0, [Validators.required, Validators.min(0)]],
      rangoFechas: this.fb.group(
        {
          inicio: ['', Validators.required],
          fin: ['', Validators.required],
        },
        { validator: this.dateRangeValidator }
      ),
    });

    // Deshabilitar campos inicialmente
    this.promocionForm.get('categoria')?.disable();
    this.promocionForm.get('producto')?.disable();
  }

  private initFormWithData(): void {
    this.promocionForm = this.fb.group({
      nombre: [
        this.promocion.nombre,
        [Validators.required, Validators.minLength(3)],
      ],
      tipo: [this.getTipoPromocion(), Validators.required],
      categoria: [this.getCategoriaNombre()],
      producto: [this.getProductoNombre()],
      tipoDescuento: [this.promocion.tipoDescuento, Validators.required],
      descuento: [
        this.promocion.descuento,
        [Validators.required, Validators.min(0)],
      ],
      rangoFechas: this.fb.group(
        {
          inicio: [new Date(this.promocion.inicio), Validators.required],
          fin: [new Date(this.promocion.fin), Validators.required],
        },
        { validator: this.dateRangeValidator }
      ),
    });

    // Habilitar campos según el tipo
    if (this.promocion.categoriaId) {
      this.promocionForm.get('categoria')?.enable();
    } else if (this.promocion.productoId) {
      this.promocionForm.get('producto')?.enable();
    }
  }

  private setupFormListeners(): void {
    // Escuchar cambios en el tipo de promoción
    this.promocionForm.get('tipo')?.valueChanges.subscribe((tipo) => {
      const categoriaControl = this.promocionForm.get('categoria');
      const productoControl = this.promocionForm.get('producto');

      if (tipo === 'categoria') {
        categoriaControl?.enable();
        productoControl?.disable();
        productoControl?.reset();
      } else if (tipo === 'producto') {
        productoControl?.enable();
        categoriaControl?.disable();
        categoriaControl?.reset();
      } else {
        categoriaControl?.disable();
        productoControl?.disable();
      }
    });

    // Escuchar cambios en el tipo de descuento
    this.promocionForm.get('tipoDescuento')?.valueChanges.subscribe((tipo) => {
      const descuentoControl = this.promocionForm.get('descuento');
      if (tipo === TipoDescuentoModel.PORCENTAJE) {
        descuentoControl?.setValidators([
          Validators.required,
          Validators.min(0),
          Validators.max(100),
        ]);
      } else {
        descuentoControl?.setValidators([
          Validators.required,
          Validators.min(0),
        ]);
      }
      descuentoControl?.updateValueAndValidity();
    });
  }

  private getTipoPromocion(): string {
    return this.promocion.categoriaId ? 'categoria' : 'producto';
  }

  private getCategoriaNombre(): string {
    if (!this.promocion.categoriaId) return '';
    const categoria = this.categoriasList.find(
      (c) => c.id === this.promocion.categoriaId
    );
    return categoria ? categoria.nombre : '';
  }

  private getProductoNombre(): string {
    if (!this.promocion.productoId) return '';
    const producto = this.productosList.find(
      (p) => p.id === this.promocion.productoId
    );
    return producto ? producto.nombre : '';
  }

  private loadPromocion(): void {
    forkJoin([
      this.promocionService.getById(this.promocionId),
      this.categoriaService.get(),
      this.productoService.get(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([promocion, categorias, productos]) => {
          console.log('Datos recibidos:', promocion);
          console.log('Tipo de descuento recibido:', promocion.tipoDescuento); // Cambiado a tipoDescuento

          this.promocion = promocion;
          this.categoriasList = categorias;
          this.productosList = productos;
          this.filteredCategorias = [...categorias];
          this.filteredProductos = [...productos];

          // Mapeo seguro del tipo de descuento
          const tipoDescuento =
            promocion.tipoDescuento === 'PORCENTAJE'
              ? TipoDescuentoModel.PORCENTAJE
              : TipoDescuentoModel.MONTO_FIJO;

          console.log('Tipo de descuento mapeado:', tipoDescuento);

          this.promocionForm.patchValue({
            nombre: promocion.nombre,
            tipo: promocion.categoriaId ? 'categoria' : 'producto',
            categoria: this.getCategoriaNombre(),
            producto: this.getProductoNombre(),
            tipoDescuento: tipoDescuento, // Usamos el valor mapeado
            descuento: promocion.descuento,
            rangoFechas: {
              inicio: new Date(promocion.inicio),
              fin: new Date(promocion.fin),
            },
          });

          // Forzar actualización de la vista si es necesario
          this.promocionForm.updateValueAndValidity();

          if (promocion.categoriaId) {
            this.promocionForm.get('categoria')?.enable();
          } else if (promocion.productoId) {
            this.promocionForm.get('producto')?.enable();
          }
        },
        error: (err) => {
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.LOAD_PROMOTION_FAILED')
          );
          this.router.navigate(['/promocion']);
        },
      });
  }

  private dateRangeValidator(group: FormGroup): { [key: string]: any } | null {
    const inicio = group.get('inicio')?.value;
    const fin = group.get('fin')?.value;

    if (inicio && fin && new Date(fin) < new Date(inicio)) {
      return { fechaInvalida: true };
    }
    return null;
  }
  private loadCategorias(): void {
    this.categoriaService
      .get()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categorias: CategoriaModel[]) => {
          this.categoriasList = categorias;
          this.filteredCategorias = [...categorias];
        },
        error: (err) =>
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.LOAD_CATEGORIES_FAILED')
          ),
      });
  }

  private loadProductos(): void {
    this.productoService
      .get()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productos: ProductoModel[]) => {
          this.productosList = productos;
          this.filteredProductos = [...productos];
        },
        error: (err) =>
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.LOAD_PRODUCTS_FAILED')
          ),
      });
  }

  filterCategorias(value: string): void {
    const filterValue = value.toLowerCase();
    this.filteredCategorias = this.categoriasList.filter((categoria) =>
      categoria.nombre.toLowerCase().includes(filterValue)
    );
  }

  filterProductos(value: string): void {
    const filterValue = value.toLowerCase();
    this.filteredProductos = this.productosList.filter((producto) =>
      producto.nombre.toLowerCase().includes(filterValue)
    );
  }

  onSubmit(): void {
    this.promocionForm.markAllAsTouched();

    if (this.promocionForm.invalid) {
      this.noti.error(
        this.translate.instant('NOTIFICATIONS.INVALID_FORM'),
        this.translate.instant('NOTIFICATIONS.COMPLETE_ALL_FIELDS')
      );
      return;
    }

    const formValue = this.promocionForm.value;
    const rangoFechas = formValue.rangoFechas;

    const promocionData: any = {
      id: this.promocionId,
      nombre: formValue.nombre,
      tipo: formValue.tipoDescuento,
      descuento: Number(formValue.descuento),
      inicio: new Date(rangoFechas.inicio),
      fin: new Date(rangoFechas.fin),
      categoriaId:
        formValue.tipo === 'categoria'
          ? this.categoriasList.find((c) => c.nombre === formValue.categoria)
              ?.id || null
          : null,
      productoId:
        formValue.tipo === 'producto'
          ? this.productosList.find((p) => p.nombre === formValue.producto)
              ?.id || null
          : null,
      estado: this.promocion.estado, // Mantener el estado actual
    };

    this.promocionService
      .update(promocionData as unknown as PromocionModel)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (promocionActualizada) => {
          this.noti.success(
            this.translate.instant('NOTIFICATIONS.PROMOTION_UPDATED'),
            this.translate.instant('NOTIFICATIONS.PROMOTION_UPDATED_SUCCESS', {
              nombre: promocionActualizada.nombre,
            }),
            5000,
            '/promocion/admin'
          );
          this.router.navigate(['/promocion/admin']);
        },
        error: (err) => {
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.PROMOTION_UPDATE_FAILED')
          );
          console.error(err);
        },
      });
  }
  onReset(): void {
    this.promocionForm.reset({
      tipoDescuento: TipoDescuentoModel.PORCENTAJE,
      descuento: 0,
    });
  }

  onCancel(): void {
    this.router.navigate(['/promocion']);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
