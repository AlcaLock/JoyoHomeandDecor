import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CategoriaModel } from '../../share/models/CategoriaModel';
import { EtiquetaModel } from '../../share/models/EtiquetaModel';
import { Subject, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductoService } from '../../share/services/producto.service';
import { FileUploadService } from '../../share/services/file-upload.service';
import { NotificationService } from '../../share/notification-service';
import { ProductoModel } from '../../share/models/ProductoModel';
import { CategoriaService } from '../../share/services/categoria.service';
import { EtiquetaService } from '../../share/services/etiqueta.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-producto-create',
  standalone: false,
  templateUrl: './producto-create.html',
  styleUrls: ['./producto-create.css'],
})
export class ProductoCreate implements OnInit, OnDestroy {
  private destroy$ = new Subject<boolean>();

  // Listas para selects
  categoriasList: CategoriaModel[] = [];
  etiquetasList: EtiquetaModel[] = [];

  // Formulario reactivo
  productoForm!: FormGroup;

  // Gestión de imágenes
  currentFiles: File[] = [];
  previews: string[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private etiquetaService: EtiquetaService,
    private uploadService: FileUploadService,
    private noti: NotificationService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategorias();
    this.loadEtiquetas();
  }

  private initForm(): void {
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      precio: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      id_categoria: [null, Validators.required],
      etiquetas: [[]],
      promedioValoracion: [{ value: 0, disabled: true }],
      activo: [true],
    });
  }

  private loadCategorias(): void {
    this.categoriaService
      .get()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categorias: CategoriaModel[]) =>
          (this.categoriasList = categorias),
        error: (err) =>
          this.noti.error(
            this.translate.instant('NOTIFICACION.ERROR'),
            this.translate.instant('NOTIFICACIONS.LOAD_CATEGORIES_FAILED')
          ),
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
            this.translate.instant('NOTIFICACIONS.ERROR'),
            this.translate.instant('NOTIFICACIONS.LOAD_LABEL_FAILED')
          ),
      });
  }

  selectFiles(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    // Validar número máximo de archivos (10)
    if (input.files.length > 10) {
      this.noti.error(
        this.translate.instant('NOTIFICATIONS.ERROR'),
        this.translate.instant('NOTIFICATIONS.MAX_IMAGES')
      );
      input.value = ''; // Limpiar el input
      return;
    }

    // Validar tipos de archivo permitidos
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const filesArray = Array.from(input.files);

    // Verificar si algún archivo no es de tipo imagen permitido
    const invalidFiles = filesArray.some(
      (file) => !allowedTypes.includes(file.type)
    );

    if (invalidFiles) {
      this.noti.error(
        this.translate.instant('NOTIFICATIONS.ERROR'),
        this.translate.instant('NOTIFICATIONS.ONLY_IMAGES')
      );
      input.value = ''; // Limpiar el input
      return;
    }

    // Si pasa las validaciones, procesar los archivos
    this.currentFiles = filesArray;
    this.previews = [];

    filesArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.previews.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.currentFiles.splice(index, 1);
    this.previews.splice(index, 1);
  }

  // Métodos para manejar las estrellas
  getStars(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  }

  getEmptyStars(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i >= Math.round(rating));
  }

  getArray(n: number): any[] {
    return Array(n).fill(0);
  }

  // Método para generar el conteo vacío de estrellas
  getEmptyConteoPorEstrella(): any[] {
    return [5, 4, 3, 2, 1].map((n) => ({ estrellas: n, cantidad: 0 }));
  }

  onSubmit(): void {
    this.productoForm.markAllAsTouched();
    // Verificar si hay más de 10 imágenes
    if (this.currentFiles.length > 10) {
      this.noti.error(
        this.translate.instant('NOTIFICATIONS.ERROR'),
        this.translate.instant('NOTIFICATIONS.MAX_IMAGES_PERM')
      );
      return;
    }

    if (this.productoForm.invalid) {
      this.noti.error(
        this.translate.instant('NOTIFICATIONS.INVALID_FORM'),
        this.translate.instant('NOTIFICATIONS.COMPLETE_ALL_FIELDS')
      );
      return;
    }

    const formValue = this.productoForm.value;

    // Crear payload simple como en Postman pero con tipo ProductoModel
    const productoData = {
      nombre: formValue.nombre,
      descripcion: formValue.descripcion,
      precio: Number(formValue.precio),
      stock: Number(formValue.stock),
      id_categoria: Number(formValue.id_categoria),
      activo: formValue.activo !== undefined ? Boolean(formValue.activo) : true,

      etiquetas: formValue.etiquetas?.map((id: number) => Number(id)) || [],
    };

    this.productoService
      .create(productoData as unknown as ProductoModel)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productoCreado) => {
          // Si hay imágenes, subirlas después de crear el producto
          if (this.currentFiles.length > 0) {
            this.uploadService
              .uploadMultiple(this.currentFiles, productoCreado.id!)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (event: any) => {
                  if (event.type === 4) {
                    // HttpEventType.Response
                    this.noti.success(
                      this.translate.instant('NOTIFICATIONS.SUCCESS'),
                      this.translate.instant('NOTIFICATIONS.PRODUCT_CREATED', {
                        name: productoCreado.nombre,
                      }),
                      5000,
                      '/producto/admin'
                    );
                    this.router.navigate(['/producto/admin']);
                  }
                },
                error: (err) => {
                  console.error('Error al subir imágenes:', err);
                  // Avisar que el producto se creó pero hubo error con imágenes
                  this.noti.warning(
                    this.translate.instant('NOTIFICATIONS.WARNING'),
                    this.translate.instant(
                      'NOTIFICATIONS.PRODUCT_CREATED_IMAGE'
                    ),
                    5000,
                    '/producto/admin'
                  );
                  this.router.navigate(['/producto/admin']);
                },
              });
          } else {
            // No hay imágenes, solo redirigir
            this.noti.success(
              this.translate.instant('NOTIFICATIONS.SUCCESS'),
              this.translate.instant('NOTIFICATIONS.PRODUCT_CREATED_SUC', {
                name: productoCreado.nombre,
              }),
              5000,
              '/producto/admin'
            );
            this.router.navigate(['/producto/admin']);
          }
        },
        error: (err) => {
          this.noti.error(
  this.translate.instant('NOTIFICATIONS.ERROR'),
  this.translate.instant('NOTIFICATIONS.PRODUCT_CREATION_FAILED')
);
          console.error(err);
        },
      });
  }

  onReset(): void {
    this.productoForm.reset({
      precio: 0,
      stock: 0,
      activo: true,
      etiquetas: [],
    });
    this.currentFiles = [];
    this.previews = [];
  }

  onCancel(): void {
    this.router.navigate(['/producto']);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
