import { Component } from '@angular/core';
import { NotificationService } from '../../share/notification-service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

import { passwordsMatchValidator } from '../../share/validators/password-match-validator';
import { RolModel } from '../../share/models/RolModel';
import { RolService } from '../../share/services/rol.service';
import { getFormValidationErrorMessage } from '../../share/form-validation';
import { UsuarioService } from '../../share/services/usuario.service';
import { AuthenticationService } from '../../share/authentication.service';
import { TranslateService } from '@ngx-translate/core';
import { passwordComplexityValidator } from '../../password-complexity-validator';



@Component({
  selector: 'app-user-create',
  standalone: false,
  templateUrl: './user-create.html',
  styleUrl: './user-create.css',
})
export class UserCreate {
  hide = true;
  usuario: any;
  roles: any;
  formCreate!: FormGroup;
  destroy$: Subject<boolean> = new Subject<boolean>();
  constructor(
    public fb: FormBuilder,
    private router: Router,
    private rolService: RolService,
    private noti: NotificationService,
    private usuarioService: AuthenticationService,
    private translate: TranslateService
  ) {
    this.reactiveForm();
  }

  reactiveForm() {
    this.formCreate = this.fb.group(
      {
        nombre: ['', [Validators.required]],
        correo: ['', [Validators.required]],
        contrasenna: ['', [Validators.required, passwordComplexityValidator()]],
        confirmcontrasenna: ['', [Validators.required]],
      },
      {validators:passwordsMatchValidator}
    );
    this.getRoles();
  }
  ngOnInit(): void {}
  submitForm() {
    this.formCreate.markAllAsTouched();
    //Validación
    if (this.formCreate.invalid) {
      return;
    }
    //Crear usuario
 const usuarioData = {
    ...this.formCreate.value,
    rol: 'CLIENTE'
  };
  this.usuarioService.createUser(usuarioData).subscribe({
    next: (res) => {
      this.noti.success(
  this.translate.instant('NOTIFICATIONS.SUCCESS'),
  this.translate.instant('NOTIFICATIONS.USER_CREATED_SUCCESS')
);
      this.router.navigate(['/usuario/login']);
    },
    error: (err) => {
      this.noti.error(
  this.translate.instant('NOTIFICATIONS.ERROR'),
  this.translate.instant('NOTIFICATIONS.USER_CREATION_FAILED')
);

    }
  });

    this.router.navigate(['/usuario/login']);
  }
  onReset() {
    this.formCreate.reset();
  }
  getRoles() {
      this.rolService
          .get()
          .subscribe((respuesta: RolModel[]) => {
            this.roles = respuesta;
          });
  }
  /**
   * Gestión de errores del formulario
   */
  public errorHandling(controlPath: string): string | false {
    // Pasamos el formulario principal y la ruta del control
    return getFormValidationErrorMessage(this.formCreate, controlPath);
  }
}
