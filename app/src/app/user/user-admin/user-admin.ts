import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UsuarioService } from '../../share/services/usuario.service';
import { UsuarioModel } from '../../share/models/UsuarioModel';
import { UserDiag } from '../user-diag/user-diag';
import { NotificationService } from '../../share/notification-service';

@Component({
  selector: 'app-user-admin',
  standalone: false,
  templateUrl: './user-admin.html',
  styleUrl: './user-admin.css'
})
export class UserAdmin implements OnInit{
 displayedColumns: string[] = ['id', 'nombre', 'correo', 'rol', 'acciones'];
  dataSource = new MatTableDataSource<UsuarioModel>([]);

  constructor(
    private usuarioService: UsuarioService,
    private dialog: MatDialog,
    private noti: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this.usuarioService.get().subscribe((usuarios) => {
      this.dataSource.data = usuarios;
    });
  }

openCreateDialog(): void {
  const dialogRef = this.dialog.open(UserDiag, {
    width: '500px',
    disableClose: true,
  });

  dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      this.loadUsuarios(); 
    }
  });
}

openUpdateDialog(usuario: UsuarioModel): void {
  const dialogRef = this.dialog.open(UserDiag, {
    width: '400px',
    data: usuario  // pasamos el usuario existente
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.loadUsuarios(); // recargar tabla después de actualizar
    }
  });
}

 generarPassword(id: number): void {
    this.usuarioService.adminResetPassword(id).subscribe((res) => {
      this.noti.success("Exito","Contraseña reiniciada")
    });
  }

}
