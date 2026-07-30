import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuarioService } from '../../share/services/usuario.service';
import { NotificationService } from '../../share/notification-service';

@Component({
  selector: 'app-user-reset-email',
  standalone: false,
  templateUrl: './user-reset-email.html',
  styleUrls: ['./user-reset-email.css']
})
export class UserResetEmail implements OnInit {

  formEmail!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private noti: NotificationService
  ) {}

  ngOnInit(): void {
    this.formEmail = this.fb.group({
      correo: ['', [Validators.required, Validators.email]]
    });
  }

  submitEmail() {
    if (this.formEmail.invalid) return;

    this.usuarioService.forgotPassword({ correo: this.formEmail.value.correo })
      .subscribe({
        next: () => this.noti.success('Éxito', 'Si es valido recibira un correo'),
        error: () => this.noti.error('Error', 'No se pudo enviar el correo')
      });
  }
}
