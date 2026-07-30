import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RolService } from '../../share/services/rol.service';
import { NotificationService } from '../../share/notification-service';
import { AuthenticationService } from '../../share/authentication.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UsuarioModel } from '../../share/models/UsuarioModel';
import { RolModel } from '../../share/models/RolModel';
import { UsuarioService } from '../../share/services/usuario.service';
import { passwordComplexityValidator } from '../../password-complexity-validator';

@Component({
  selector: 'app-user-diag',
  standalone: false,
  templateUrl: './user-diag.html',
  styleUrl: './user-diag.css',
})
export class UserDiag {
  formCreate!: FormGroup;
  roles: RolModel[] = [];
  hide = true;
  
  constructor(
    public fb: FormBuilder,
    private rolService: RolService,
    private noti: NotificationService,
    private usuarioService: UsuarioService, // para update
    private authService: AuthenticationService, // para create
    private dialogRef: MatDialogRef<UserDiag>,
    @Inject(MAT_DIALOG_DATA) public data?: UsuarioModel // usuario a editar
  ) {
    this.reactiveForm();
    if (this.data) {
      this.populateForm(this.data);
    }
  }

  reactiveForm() {
    this.formCreate = this.fb.group({
      nombre: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      rol: ['', [Validators.required]],
      ...(this.data
        ? {} // si es edición, no agregamos contraseñas
        : {
            contrasenna: ['', [Validators.required, passwordComplexityValidator()]],
            confirmcontrasenna: ['', [Validators.required]],
          }),
    }, {
      validators: this.matchPasswords // validador custom
    });

    this.getRoles();
  }

  matchPasswords(group: FormGroup) {
    const pass = group.get('contrasenna')?.value;
    const confirm = group.get('confirmcontrasenna')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  populateForm(usuario: UsuarioModel) {
    this.formCreate.patchValue({
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    });
    // Si es edición, el rol no se puede cambiar
    this.formCreate.get('rol')?.disable();
  }

  submitForm() {
    this.formCreate.markAllAsTouched();
    if (this.formCreate.invalid) return;

    const usuarioData = this.formCreate.getRawValue();

    if (this.data) {
      // Editar usuario existente
      this.usuarioService
        .updateUsuario(this.data.id, {
          nombre: usuarioData.nombre,
          correo: usuarioData.correo,
          rol: usuarioData.rol,
        })
        .subscribe({
          next: () => {
            this.noti.success(
              'Éxito',
              'El usuario se actualizó correctamente.'
            );
            this.dialogRef.close(true);
          },
          error: () => {
            this.noti.error(
              'Error',
              'No se pudo actualizar el usuario.'
            );
          },
        });
    } else {
      // Crear usuario nuevo
      this.authService.createUser(usuarioData).subscribe({
        next: () => {
          this.noti.success(
            'Éxito',
            'El usuario se creó correctamente.'
          );
          this.dialogRef.close(true);
        },
        error: () => {
          this.noti.error(
            'Error',
            'No se pudo crear el usuario.'
          );
        },
      });
    }
  }

  getRoles() {
    this.rolService.get().subscribe((respuesta: RolModel[]) => {
      this.roles = respuesta;
    });
  }

  closeDialog() {
    this.dialogRef.close(false);
  }
}
