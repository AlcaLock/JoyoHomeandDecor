import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService } from '../../share/services/usuario.service';
import { NotificationService } from '../../share/notification-service';
import { TranslateService } from '@ngx-translate/core';
import { passwordsMatchValidator } from '../../share/validators/password-match-validator';
import { passwordComplexityValidator } from '../../password-complexity-validator';
import { getFormValidationErrorMessage } from '../../share/form-validation';

@Component({
  selector: 'app-user-reset',
  standalone: false,
  templateUrl: './user-reset.html',
  styleUrl: './user-reset.css'
})
export class UserReset implements OnInit {
  formReset!: FormGroup;
  token!: string;
  hide = true;
  isTempPassword = false;
  userId!: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private usuarioService: UsuarioService,
    private noti: NotificationService,
    private router: Router,
    private translate: TranslateService
  ) {
    this.formReset = this.fb.group(
      {
        nuevaContrasenna: ['', [Validators.required, passwordComplexityValidator()]],
        confirmContrasenna: ['', [Validators.required]]
      },
      { validators: passwordsMatchValidator }
    );
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];

    });

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');


    // CAMBIO AQUÍ: Verificar si isTempPassword es 1 (MySQL) o true
    if (usuario && (usuario.isTempPassword === 1 || usuario.isTempPassword === true)) {
      this.isTempPassword = true;
      this.userId = usuario.id;
    } 
    
  }

  submitForm() {
    this.formReset.markAllAsTouched();
    if (this.formReset.invalid) {
      return;
    }

    const nuevaContrasenna = this.formReset.value.nuevaContrasenna;

    if (this.isTempPassword) {
      this.usuarioService.resetTempPassword(this.userId, nuevaContrasenna).subscribe({
        next: () => {
          this.postReset();
        },
        error: (error) => {
          this.onResetError();
        }
      });
    } else {
      if (!this.token) {
        this.noti.error(
          this.translate.instant('NOTIFICATIONS.ERROR'),
          'Token requerido para el reset de contraseña'
        );
        return;
      }
      
      this.usuarioService.resetPassword(this.token, nuevaContrasenna).subscribe({
        next: () => {
          this.postReset();
        },
        error: (error) => {
          this.onResetError();
        }
      });
    }
  }

  private postReset() {
    if (this.isTempPassword) {
      localStorage.removeItem('usuario');
    }
    this.noti.success('Exito','Contraseña actualizada');
    this.router.navigate(['/usuario/login']);
  }

  private onResetError() {
    this.noti.error('Error','No se pudo actualizar la contraseña');
  }

    public errorHandling(controlPath: string): string | false {
      // Pasamos el formulario principal y la ruta del control
      return getFormValidationErrorMessage(this.formReset, controlPath);
    }
}