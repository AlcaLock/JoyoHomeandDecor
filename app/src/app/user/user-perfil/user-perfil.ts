import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService } from '../../share/notification-service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UsuarioService } from '../../share/services/usuario.service';
import { UsuarioModel } from '../../share/models/UsuarioModel';
import { UserDiag } from '../user-diag/user-diag';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-user-perfil',
  standalone: false,
  templateUrl: './user-perfil.html', 
  styleUrl: './user-perfil.css',
})
export class UserPerfil implements OnInit, OnDestroy {
  formProfile!: FormGroup;
  usuarioId!: number;
  destroy$: Subject<boolean> = new Subject<boolean>();
  usuario!: UsuarioModel;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private noti: NotificationService,
    private usuarioService: UsuarioService,
    private dialog: MatDialog 
  ) {}

  ngOnInit(): void {
    this.reactiveForm();
    
    this.usuarioId = Number(this.route.snapshot.paramMap.get('id'));
    
    if (this.usuarioId) {
      this.loadUsuario(this.usuarioId);
    } else {
      this.noti.error('Error', 'ID de usuario requerido');
      this.router.navigate(['/inicio']);
    }
  }

  reactiveForm() {
    this.formProfile = this.fb.group({
      nombre: [{value: '', disabled: true}],
      correo: [{value: '', disabled: true}],
      rol: [{value: '', disabled: true}],
      ultimoLogin: [{value: '', disabled: true}],
      creadoEn: [{value: '', disabled: true}]
    });
  }

  loadUsuario(id: number) {
    this.usuarioService
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuario: UsuarioModel) => {
          this.usuario = usuario;
          this.populateForm(usuario);
        },
        error: () => {
          this.noti.error('Error', 'Usuario no encontrado');
          this.router.navigate(['/inicio']);
        },
      });
  }

  populateForm(usuario: UsuarioModel) {
  let rolFormateado: string;

  if (typeof usuario.rol === 'string') {
    // Caso cuando el backend manda solo "ADMIN" o "CLIENTE"
    rolFormateado = this.formatRol(usuario.rol);
  } else {
    // Caso cuando viene como objeto { id, nombre }
    rolFormateado = this.formatRol(usuario.rol.nombre);
  }

  this.formProfile.patchValue({
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: rolFormateado,
    ultimoLogin: usuario.ultimoLogin ? this.formatDate(usuario.ultimoLogin) : 'N/A',
    creadoEn: this.formatDate(usuario.creadoEn)
  });
}


  formatDate(date: Date | string): string {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('es-CR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

formatRol(rol: string): string {
  switch (rol) {
    case 'ADMIN':
      return 'Administrador';
    case 'CLIENTE':
      return 'Cliente'
    default:
      return rol; 
  }
}



  openUpdateDialog(usuario: UsuarioModel): void {
    const dialogRef = this.dialog.open(UserDiag, {
      width: '400px',
      data: usuario  // pasamos el usuario existente
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsuario(this.usuarioId); 
      }
    });
  }
  onBack() {
    this.router.navigate(['/inicio']);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}