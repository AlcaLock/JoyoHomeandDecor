import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService } from '../../share/notification-service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { passwordsMatchValidator } from '../../share/validators/password-match-validator';
import { RolModel } from '../../share/models/RolModel';
import { RolService } from '../../share/services/rol.service';
import { getFormValidationErrorMessage } from '../../share/form-validation';
import { UsuarioService } from '../../share/services/usuario.service';
import { TranslateService } from '@ngx-translate/core';
import { UsuarioModel } from '../../share/models/UsuarioModel';

@Component({
  selector: 'app-user-update',
  standalone: false,
  templateUrl: './user-update.html',
  styleUrl: './user-update.css',
})
export class UserUpdate implements OnInit, OnDestroy {
 formProfile!: FormGroup;
  usuarioId!: number;
  destroy$ = new Subject<boolean>();
  usuario!: UsuarioModel;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private noti: NotificationService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.usuarioId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.usuarioId) {
      this.noti.error('Error', 'ID de usuario requerido');
      this.router.navigate(['/inicio']);
      return;
    }

    this.initForm();
    this.loadUsuario(this.usuarioId);
  }

  initForm() {
    this.formProfile = this.fb.group({
      nombre: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      rol: [{ value: '', disabled: true }]
    });
  }

  loadUsuario(id: number) {
    this.usuarioService.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuario: UsuarioModel) => {
          this.usuario = usuario;
          this.populateForm(usuario);
        },
        error: () => {
          this.noti.error('Error', 'Usuario no encontrado');
          this.router.navigate(['/inicio']);
        }
      });
  }

  populateForm(usuario: UsuarioModel) {
    let rolValue = typeof usuario.rol === 'string'
      ? usuario.rol
      : usuario.rol.nombre;

    this.formProfile.patchValue({
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: rolValue
    });
  }

  onUpdate() {
    if (this.formProfile.invalid) {
      this.noti.error('Error', 'Formulario inválido');
      return;
    }

    const updateData = {
      nombre: this.formProfile.get('nombre')?.value,
      correo: this.formProfile.get('correo')?.value
    };

    this.usuarioService.updateUsuario(this.usuarioId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.noti.success('Éxito', 'Usuario actualizado correctamente');
         this.router.navigate(['/usuario/perfil', this.usuarioId]);
        },
        error: () => {
          this.noti.error('Error', 'No se pudo actualizar el usuario');
        }
      });
  }

  onBack() {
    this.router.navigate(['/usuario/perfil', this.usuarioId]);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
  }

