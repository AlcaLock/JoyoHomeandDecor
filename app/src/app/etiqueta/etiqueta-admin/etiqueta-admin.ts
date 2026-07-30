import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EtiquetaService } from '../../share/services/etiqueta.service';
import { EtiquetaModel } from '../../share/models/EtiquetaModel';
import { NotificationService } from '../../share/notification-service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-etiqueta-admin',
  standalone: false,
  templateUrl: './etiqueta-admin.html',
  styleUrls: ['./etiqueta-admin.css'],
})
export class EtiquetaAdmin implements OnInit {
  etiquetas: EtiquetaModel[] = [];
  etiquetaForm!: FormGroup;
  editando = false;
  etiquetaEditandoId: number | null = null;
  mostrarFormulario = false;

  @ViewChild('inputNombre') inputNombre!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private noti: NotificationService,
    private etiquetaService: EtiquetaService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.etiquetaForm = this.fb.group({
      nombre: ['', Validators.required],
    });
    this.cargarEtiquetas();
  }

  columnas: string[] = ['nombre', 'acciones'];

  cargarEtiquetas(): void {
    this.etiquetaService
      .get()
      .subscribe((etiquetas) => (this.etiquetas = etiquetas));
  }

  editarEtiqueta(etiqueta: EtiquetaModel) {
    this.editando = true;
    this.etiquetaEditandoId = etiqueta.id;
    this.etiquetaForm.patchValue({ nombre: etiqueta.nombre });
    this.mostrarFormulario = true;

    // Esperar a que el input exista en el DOM
    setTimeout(() => {
      this.inputNombre?.nativeElement.focus();
    }, 0);
  }

  nuevaEtiqueta() {
    this.editando = false;
    this.etiquetaEditandoId = null;
    this.etiquetaForm.reset();
    this.mostrarFormulario = true;
  }

  cancelarEdicion() {
    this.editando = false;
    this.etiquetaEditandoId = null;
    this.etiquetaForm.reset();
    this.mostrarFormulario = false;
  }

  guardarEtiqueta() {
    if (this.etiquetaForm.invalid) return;

    const data = this.etiquetaForm.value;

    if (this.editando && this.etiquetaEditandoId !== null) {
      const payload = { id: this.etiquetaEditandoId, ...data };

      this.etiquetaService.update(payload).subscribe({
        next: () => {
          this.cargarEtiquetas();
          this.cancelarEdicion();
          this.noti.success(
            this.translate.instant('NOTIFICATIONS.SUCCESS'),
            this.translate.instant('NOTIFICATIONS.LABEL_UPDATED')
          );
        },
        error: (err) => {
          if (
            err.status === 400 &&
            err.error?.mensaje?.toLowerCase().includes('ya existe')
          ) {
            this.noti.warning(
              this.translate.instant('NOTIFICATIONS.WARNING'),
              this.translate.instant('NOTIFICATIONS.LABEL_ALREADY_EXISTS')
            );
          } else {
            this.noti.error(
              this.translate.instant('NOTIFICATIONS.ERROR'),
              this.translate.instant('NOTIFICATIONS.LABEL_UPDATE_FAILED')
            );
          }
        },
      });
    } else {
      this.etiquetaService.create(data).subscribe({
        next: () => {
          this.cargarEtiquetas();
          this.etiquetaForm.reset();
          this.mostrarFormulario = false;
          this.noti.success(
            this.translate.instant('NOTIFICATIONS.SUCCESS'),
            this.translate.instant('NOTIFICATIONS.LABEL_CREATED')
          );
        },
        error: (err) => {
          if (
            err.status === 400 &&
            err.error?.mensaje?.toLowerCase().includes('ya existe')
          ) {
            this.noti.warning(
              this.translate.instant('NOTIFICATIONS.WARNING'),
              this.translate.instant('NOTIFICATIONS.LABEL_ALREADY_EXISTS')
            );
          } else {
            this.noti.error(
              this.translate.instant('NOTIFICATIONS.ERROR'),
              this.translate.instant('NOTIFICATIONS.LABEL_CREATION_ERROR')
            );
          }
        },
      });
    }
  }
}
