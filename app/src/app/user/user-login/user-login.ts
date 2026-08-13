import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../share/notification-service';
import { AuthenticationService } from '../../share/authentication.service';
import { getFormValidationErrorMessage } from '../../share/form-validation';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-login',
  standalone: false,
  templateUrl: './user-login.html',
  styleUrl: './user-login.css'
})
export class UserLogin {
hide=true;
  formulario!: FormGroup;
  makeSubmit: boolean = false;
  infoUsuario: any;
  constructor(
    public fb: FormBuilder,
    private notificacion: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private translate:TranslateService,
    private authService: AuthenticationService
  ) {
    this.reactiveForm();
  }
  // Definir el formulario con su reglas de validación
  reactiveForm() {
    this.formulario = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasenna: ['', Validators.required],
    });
  }
  ngOnInit(): void {
   
  }

  onReset() {
    this.formulario.reset();
  }
  submitForm() {
  this.makeSubmit = true;

  if (this.formulario.invalid) return;

  const credentials = this.formulario.value;

  this.authService.loginUser(credentials).subscribe({
    next: (res: any) => {
      if (res.requirePasswordChange) {
        // Redirigir al formulario de cambio de contraseña
        this.router.navigate(['/usuario/reset-password']);
        this.notificacion.info(
          this.translate.instant('Info'),
          this.translate.instant('La contraseña es temporal porfavor cambiarla'),
          3000
        );
      } else {
        // Login normal
        this.notificacion.success(
          this.translate.instant('NOTIFICATIONS.LOGIN_SUCCESS'),
          this.translate.instant('NOTIFICATIONS.WELCOME'),
          2000,
          '/inicio'
        );
      }
    },
    error: (error) => {
      let message = 'Error al iniciar sesión. Por favor, intente de nuevo';
      if (error.status === 401) {
        message = 'Credenciales incorrectas. Verifique su email y contraseña';
      }
      this.notificacion.error(
        this.translate.instant('NOTIFICATIONS.AUTH_ERROR'),
        message
      );
    }
  });
}

    /**
      * Gestión de errores del formulario
      */
     public errorHandling(controlPath: string): string | false {
       // Pasamos el formulario principal y la ruta del control
       return getFormValidationErrorMessage(this.formulario, controlPath);
     }
}
