import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ComponenteModel } from '../../share/models/ComponenteModel';
import { ComponenteService } from '../../share/services/componente.service';
import { NotificationService } from '../../share/notification-service';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { GrupoComponenteService } from '../../share/services/grupo-componente.service';
import { GrupoComponenteModel } from '../../share/models/GrupoComponenteModel';

@Component({
  selector: 'app-componente-create',
  standalone: false,
  templateUrl: './componente-create.html',
  styleUrl: './componente-create.css',
})
export class ComponenteCreate implements OnInit, OnDestroy {
  formComponente: FormGroup;
  gruposComponente: GrupoComponenteModel[] = [];
  private destroy$ = new Subject<boolean>();
  imagenPrevisualizacion: string | ArrayBuffer | null = null;
  selectedFile: File | null = null; // <-- archivo seleccionado

  constructor(
    private fb: FormBuilder,
    private componenteService: ComponenteService,
    private grupoComponenteService: GrupoComponenteService,
    private notification: NotificationService,
    private translate: TranslateService,
    private router: Router
  ) {
    this.formComponente = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(500)],
      precio: ['', [Validators.required, Validators.min(0)]],
      grupoComponenteId: ['', Validators.required],
      imagenUrl: [''],
    });
  }

  ngOnInit(): void {
    this.cargarGruposComponente();
  }

  cargarGruposComponente() {
    this.grupoComponenteService
      .get()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (grupos) => {
          this.gruposComponente = grupos;
        },
        error: (err) => {
          console.error('Error al cargar grupos de componente:', err);
          this.notification.error(
            'Error',
            'No se pudieron cargar los grupos de componente'
          );
        }
      });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file; // Guardamos el File real

      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPrevisualizacion = reader.result;
      };
      reader.readAsDataURL(file);

      // Solo para mostrar el nombre en la UI
      this.formComponente.patchValue({
        imagenUrl: file.name,
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
      id: 0,
    };

    this.componenteService
      .createWithImage(componenteData, this.selectedFile!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notification.success(
            'Éxito',
            'Componente creado correctamente'
          );
          this.router.navigate(['/componente/admin']);
        },
        error: (err) => {
          console.error('Error al crear componente:', err);
          this.notification.error(
            'Error',
            'Error al crear el componente'
          );
        }
      });
  }

  private marcarCamposInvalidos() {
    Object.keys(this.formComponente.controls).forEach((key) => {
      const control = this.formComponente.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }

  getTipoGrupo(grupoId: number): string {
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
    this.router.navigate(['/componente/admin']);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
