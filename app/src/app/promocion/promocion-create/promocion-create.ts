import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PromocionModel } from '../../share/models/PromocionModel';
import { TipoDescuentoModel } from '../../share/models/TipoDescuentoModel';
import { CategoriaModel } from '../../share/models/CategoriaModel';
import { ProductoModel } from '../../share/models/ProductoModel';
import { PromocionService } from '../../share/services/promocion.service';
import { CategoriaService } from '../../share/services/categoria.service';
import { ProductoService } from '../../share/services/producto.service';
import { NotificationService } from '../../share/notification-service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-promocion-create',
  standalone: false,
  templateUrl: './promocion-create.html',
  styleUrl: './promocion-create.css',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromocionCreate implements OnInit, OnDestroy {
  private destroy$ = new Subject<boolean>();

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

  currentLang: string = 'es';


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private promocionService: PromocionService,
    private categoriaService: CategoriaService,
    private productoService: ProductoService,
    private noti: NotificationService,
    private translate: TranslateService
  ) {
     this.currentLang = this.translate.currentLang;
  this.translate.onLangChange.subscribe(lang => {
    this.currentLang = lang.lang;
  });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadCategorias();
    this.loadProductos();
    this.setupFormListeners();
  }

  private initForm(): void {
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
          Validators.min(1),
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
      estado: 'Activa',
    };

    // Usar 'as unknown as PromocionModel' para evitar el error de TypeScript
    this.promocionService
      .create(promocionData as unknown as PromocionModel)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (promocionCreada) => {
          this.noti.success(
            this.translate.instant('NOTIFICATIONS.PROMOTION_CREATED'),
            this.translate.instant('NOTIFICATIONS.PROMOTION_CREATED_SUCCESS', {
              name: promocionCreada.nombre,
            }),
            5000,
            '/promocion/admin'
          );
          this.router.navigate(['/promocion/admin']);
        },
        error: (err) => {
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.CREATE_PROMOTION_FAILED')
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
