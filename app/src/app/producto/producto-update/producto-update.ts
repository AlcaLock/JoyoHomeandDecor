import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoriaModel } from '../../share/models/CategoriaModel';
import { EtiquetaModel } from '../../share/models/EtiquetaModel';
import { ProductoModel } from '../../share/models/ProductoModel';
import { Subject, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductoService } from '../../share/services/producto.service';
import { CategoriaService } from '../../share/services/categoria.service';
import { EtiquetaService } from '../../share/services/etiqueta.service';
import { FileUploadService } from '../../share/services/file-upload.service';
import { NotificationService } from '../../share/notification-service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-producto-update',
  standalone: false,
  templateUrl: './producto-update.html',
  styleUrl: './producto-update.css',
})
export class ProductoUpdate implements OnInit, OnDestroy {
  private destroy$ = new Subject<boolean>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  productoId!: number;
  producto!: ProductoModel;

  // Listas para selects
  categoriasList: CategoriaModel[] = [];
  etiquetasList: EtiquetaModel[] = [];

  // Formulario reactivo
  productoForm!: FormGroup;
  maxFilesPerUpload = 10;
  // Gestión de imágenes
  currentFiles: File[] = [];
  previews: string[] = [];
  existingImages: { id: number; url: string }[] = [];
  imagesToDelete: number[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private etiquetaService: EtiquetaService,
    private uploadService: FileUploadService,
    private noti: NotificationService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Obtener el ID de la ruta
    this.productoId = Number(this.route.snapshot.paramMap.get('id'));

    // Obtener el producto del estado de navegación si está disponible
    const navigation = this.router.getCurrentNavigation();
    const stateProduct = navigation?.extras.state as {
      producto: ProductoModel;
    };

    if (stateProduct?.producto) {
      this.producto = stateProduct.producto;
      this.initFormWithData();
    } else {
      this.initEmptyForm();
      this.loadProducto();
    }

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
      activo: [true],
    });
  }
  private initFormWithData(): void {
    this.productoForm = this.fb.group({
      nombre: [
        this.producto.nombre,
        [Validators.required, Validators.minLength(2)],
      ],
      descripcion: [
        this.producto.descripcion,
        [Validators.required, Validators.minLength(10)],
      ],
      precio: [this.producto.precio, [Validators.required, Validators.min(0)]],
      stock: [this.producto.stock, [Validators.required, Validators.min(0)]],
      id_categoria: [this.producto.id_categoria, Validators.required],
      etiquetas: [this.producto.etiquetas?.map((e) => e.etiquetaId) || []],
      activo: [this.producto.activo],
    });

    // Cargar imágenes existentes
    if (this.producto.imagenes) {
      this.existingImages = this.producto.imagenes.map((img) => ({
        id: img.id,
        url: img.url,
      }));
    }
  }
  private initEmptyForm(): void {
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      precio: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      id_categoria: [null, Validators.required],
      etiquetas: [[]],
      activo: [true],
    });
  }

  private loadProducto(): void {
    this.productoService
      .getById(this.productoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (producto: ProductoModel) => {
          // Calcular promedio de valoraciones (añadido)
          if (producto.resenas?.length > 0) {
            const total = producto.resenas.reduce(
              (sum: number, r: any) => sum + r.estrellas,
              0
            );
            // Añadir propiedad dinámicamente (no recomendado pero funcional)
            producto.promedioValoracion = total / producto.resenas.length;
          } else {
            producto.promedioValoracion = 0;
          }

          // Ordenar reseñas por fecha (similar a detail)
          if (producto.resenas) {
            producto.resenas.sort(
              (a: any, b: any) =>
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );
          }

          this.producto = producto;
          this.existingImages = producto.imagenes.map((img) => ({
            id: img.id,
            url: img.url,
          }));

          // Rellenar el formulario (sin cambios)
          this.productoForm.patchValue({
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio: producto.precio,
            stock: producto.stock,
            id_categoria: producto.id_categoria,
            etiquetas: producto.etiquetas?.map((e) => e.etiquetaId) || [],
            activo: producto.activo,
          });
        },
        error: (err) => {
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.LOAD_PRODUCT_FAILED')
          );
          this.router.navigate(['/producto']);
        },
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
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.LOAD_CATEGORIES_FAILED')
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
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.LOAD_LABELS_FAILED')
          ),
      });
  }

  selectFiles(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    // Validar número máximo de archivos por subida
    if (input.files.length > this.maxFilesPerUpload) {
      this.noti.error(
        this.translate.instant('NOTIFICATIONS.ERROR'),
        this.translate.instant('NOTIFICATIONS.MAX_FILES_EXCEEDED', {
          max: this.maxFilesPerUpload,
        })
      );
      input.value = '';
      return;
    }

    // Validar tipos de archivo permitidos
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = Array.from(input.files).some(
      (file) => !allowedTypes.includes(file.type)
    );

    if (invalidFiles) {
      this.noti.error(
        this.translate.instant('NOTIFICATIONS.ERROR'),
        this.translate.instant('NOTIFICATIONS.ONLY_IMAGE_FILES')
      );
      input.value = '';
      return;
    }

    // Si pasa las validaciones, procesar los archivos
    this.currentFiles = Array.from(input.files);
    this.previews = [];

    this.currentFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.previews.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  removeNewImage(index: number): void {
    this.currentFiles.splice(index, 1);
    this.previews.splice(index, 1);
  }

  removeExistingImage(imageId: number): void {
    this.imagesToDelete.push(imageId);
    this.existingImages = this.existingImages.filter(
      (img) => img.id !== imageId
    );
  }

  get hasImages(): boolean {
    // Si hay nuevas imágenes, siempre es true
    if (this.previews?.length > 0) return true;

    // Si no hay nuevas imágenes, verificar que queden existentes no marcadas para eliminar
    if (!this.existingImages?.length) return false;

    // Calcular cuántas imágenes existentes no están marcadas para eliminar
    const remainingImages = this.existingImages.filter(
      (img) => !this.imagesToDelete?.includes(img.id)
    ).length;

    return remainingImages > 0;
  }

  getConteoPorEstrella() {
    // Inicializar conteo 1 a 5 estrellas con cero
    const conteo = [5, 4, 3, 2, 1].map((n) => ({ estrellas: n, cantidad: 0 }));
    if (!this.producto?.resenas) return conteo;

    for (const resena of this.producto.resenas) {
      const item = conteo.find((c) => c.estrellas === resena.estrellas);
      if (item) item.cantidad++;
    }
    return conteo;
  }

  getArray(n: number): any[] {
    return Array(n).fill(0);
  }

  getStars(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  }
  get productoConValoracion(): any {
    return {
      ...this.producto,
      promedioValoracion: this.calcularPromedioValoracion(),
    };
  }

  private calcularPromedioValoracion(): number {
    if (!this.producto?.resenas?.length) return 0;
    const total = this.producto.resenas.reduce(
      (sum, r) => sum + r.estrellas,
      0
    );
    return total / this.producto.resenas.length;
  }

  onSubmit(): void {
    this.productoForm.markAllAsTouched();

    // Validar que haya al menos una imagen
    if (!this.hasImages) {
      this.noti.error(
        this.translate.instant('NOTIFICATIONS.ERROR'),
        this.translate.instant('NOTIFICATIONS.AT_LEAST_ONE_IMAGE_REQUIRED')
      );

      return;
    }

    // Validar máximo 10 imágenes en la subida actual
    if (this.currentFiles.length > 10) {
      this.noti.error(
        this.translate.instant('NOTIFICATIONS.ERROR'),
        this.translate.instant('NOTIFICATIONS.MAX_FILES_EXCEEDED', { max: 10 })
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

    const productoData = {
      id: this.productoId,
      nombre: formValue.nombre,
      descripcion: formValue.descripcion,
      precio: Number(formValue.precio),
      stock: Number(formValue.stock),
      id_categoria: Number(formValue.id_categoria),
      activo: formValue.activo !== undefined ? Boolean(formValue.activo) : true,
      etiquetas: formValue.etiquetas?.map((id: number) => Number(id)) || [],
      imagenes: this.existingImages.map((img) => ({ url: img.url })),
      imagesToDelete: this.imagesToDelete,
    };

    this.productoService
      .update(productoData as unknown as ProductoModel)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productoActualizado) => {
          // Si hay imágenes nuevas, subirlas después de actualizar el producto
          if (this.currentFiles.length > 0) {
            this.uploadService
              .updateImages(this.currentFiles, productoActualizado.id!)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (event: any) => {
                  if (event.type === 4) {
                    // HttpEventType.Response
                    this.noti.success(
                      this.translate.instant('NOTIFICATIONS.PRODUCT_UPDATED'),
                      this.translate.instant(
                        'NOTIFICATIONS.PRODUCT_UPDATED_SUCCESS',
                        { nombre: productoActualizado.nombre }
                      ),
                      5000,
                      '/producto/admin'
                    );
                    this.router.navigate(['/producto/admin']);
                  }
                },
                error: (err) => {
                  console.error('Error al subir imágenes:', err);
                  // Avisar que el producto se actualizó pero hubo error con imágenes
                  this.noti.warning(
                    this.translate.instant('NOTIFICATIONS.PRODUCT_UPDATED'),
                    this.translate.instant(
                      'NOTIFICATIONS.PRODUCT_UPDATED_IMAGES_FAILED'
                    ),
                    5000,
                    '/producto/admin'
                  );
                  this.router.navigate(['/producto/admin']);
                },
              });
          } else {
            // No hay imágenes nuevas, solo redirigir
            this.noti.success(
              this.translate.instant('NOTIFICATIONS.PRODUCT_UPDATED'),
              this.translate.instant('NOTIFICATIONS.PRODUCT_UPDATED_SUCCESS', {
                nombre: productoActualizado.nombre,
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
            this.translate.instant('NOTIFICATIONS.PRODUCT_UPDATE_FAILED')
          );
          console.error(err);
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/producto']);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
