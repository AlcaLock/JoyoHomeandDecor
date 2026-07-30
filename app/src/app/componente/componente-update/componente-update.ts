import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { ComponenteService } from '../../share/services/componente.service';
import { GrupoComponenteService } from '../../share/services/grupo-componente.service';
import { NotificationService } from '../../share/notification-service';

import { ComponenteModel } from '../../share/models/ComponenteModel';
import { GrupoComponenteModel } from '../../share/models/GrupoComponenteModel';

@Component({
  selector: 'app-componente-update',
  standalone: false,
  templateUrl: './componente-update.html',
  styleUrl: './componente-update.css'
})
export class ComponenteUpdate implements OnInit, OnDestroy {
  formComponente: FormGroup;
  gruposComponente: GrupoComponenteModel[] = [];
  componenteId!: number;
  imagenPrevisualizacion: string | ArrayBuffer | null = null;
  selectedFile?: File; // 🔹 archivo seleccionado
  private destroy$ = new Subject<boolean>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private componenteService: ComponenteService,
    private grupoComponenteService: GrupoComponenteService,
    private notification: NotificationService,
    private translate: TranslateService
  ) {
    this.formComponente = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(500)],
      precio: ['', [Validators.required, Validators.min(0)]],
      grupoComponenteId: ['', Validators.required],
      imagenUrl: [''] // solo para nombre o URL, la subida real se hace con selectedFile
    });
  }

  ngOnInit(): void {
    this.cargarGruposComponente();

    // Obtener el componente desde history.state o por parámetro de ruta
    const componente = history.state.componente as ComponenteModel;
    if (componente) {
      this.componenteId = componente.id; // 🔹 asigna el ID correctamente
      this.formComponente.patchValue({
        nombre: componente.nombre,
        descripcion: componente.descripcion,
        precio: componente.precio,
        grupoComponenteId: componente.grupoComponenteId,
        imagenUrl: componente.imagenUrl
      });
      this.imagenPrevisualizacion = componente.imagenUrl;
    } else {
      this.route.params.subscribe(params => {
        this.componenteId = +params['id'];
        if (this.componenteId) this.cargarComponente();
      });
    }
  }

  cargarGruposComponente() {
    this.grupoComponenteService.get()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (grupos) => this.gruposComponente = grupos,
        error: (err) => {
          console.error('Error al cargar grupos de componente:', err);
          this.notification.error(
            'Error',
            'No se pudieron cargar los grupos de componente'
          );
        }
      });
  }

  cargarComponente() {
    this.componenteService.getById(this.componenteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (componente: ComponenteModel) => {
          this.formComponente.patchValue({
            nombre: componente.nombre,
            descripcion: componente.descripcion,
            precio: componente.precio,
            grupoComponenteId: componente.grupoComponenteId,
            imagenUrl: componente.imagenUrl
          });
          if (componente.imagenUrl) {
            this.imagenPrevisualizacion = componente.imagenUrl;
          }
        },
        error: (err) => {
          console.error('Error al cargar componente:', err);
          this.notification.error(
            'Error',
            'Error al cargar el componente'
          );
          this.router.navigate(['/componente/admin']);
        }
      });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file; // 🔹 guardar archivo para enviar al backend
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPrevisualizacion = reader.result;
      };
      reader.readAsDataURL(file);

      // Actualiza solo el nombre en el formulario
      this.formComponente.patchValue({
        imagenUrl: file.name
      });
    }
  }

     getPrecioCRC(valor: number): string {
    const formatter = new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      currencyDisplay: 'narrowSymbol',
    });

    const resultado = formatter.format(valor);
    return resultado.endsWith('₡')
      ? `₡${resultado.slice(0, -1).trim()}`
      : resultado;
  }


  onSubmit() {
    if (this.formComponente.invalid) {
      this.marcarCamposInvalidos();
      this.notification.error(
        'Error',
        'Por favor complete todos los campos requeridos'
      );
      return;
    }

    const componenteData: ComponenteModel = {
      ...this.formComponente.value,
      id: this.componenteId
    };

    this.componenteService.updateWithImage(componenteData, this.selectedFile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notification.success(
            'Éxito',
            'Componente actualizado correctamente'
          );
          this.router.navigate(['/componente/admin']);
        },
        error: (err) => {
          console.error('Error al actualizar componente:', err);
          this.notification.error(
            'Error',
            'Error al actualizar el componente'
          );
        }
      });
  }

  private marcarCamposInvalidos() {
    Object.keys(this.formComponente.controls).forEach(key => {
      const control = this.formComponente.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }

  onCancel() {
    this.router.navigate(['/componente/admin']);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
