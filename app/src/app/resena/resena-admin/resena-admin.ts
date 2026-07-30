import { Component, OnInit } from '@angular/core';
import { ResenaService } from '../../share/services/resena.service';
import { ResenaModel } from '../../share/models/ResenaModel';
import { MatDialog } from '@angular/material/dialog';
import { ResenaDiag } from '../resena-diag/resena-diag';
import { ModeracionResenaModel } from '../../share/models/ModeracionResenaModel';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-resena-admin',
  standalone: false,
  templateUrl: './resena-admin.html',
  styleUrl: './resena-admin.css',
})
export class ResenaAdmin implements OnInit {
  resenas: ResenaModel[] = [];
  filtroOculto: boolean | null = null;
  filtroReporte: boolean | null = null;
  currentLang: string = 'es'; // por defecto
  constructor
  (private resenaService: ResenaService,
   private dialog: MatDialog,
   private translate: TranslateService
  ) {
  this.translate.onLangChange.subscribe(lang => {
  this.currentLang = lang.lang;
});}

  ngOnInit(): void {
    this.cargarResenas();
  }

  usuarioLogueadoId = 1;

  cargarResenas() {
    this.resenaService.getModeradas().subscribe((data) => {
      this.resenas = data;
    });
  }

getResenasFiltradas() {
  if (!this.resenas) return [];

  return this.resenas.filter((resena: any) => {
    console.log('resena:', resena.reportes); 

    if (this.filtroReporte === true) {
      return resena.reportes?.length > 0;
    }

    if (this.filtroOculto === null) return true;
    return resena.oculto === this.filtroOculto;
  });
}

get displayedColumns(): string[] {
  const columnas = ['usuario', 'comentario'];
  if (this.filtroReporte === true) {
    columnas.push('motivo');
  }
  columnas.push('estrellas', 'fecha', 'estado', 'acciones');
  return columnas;
}



  getStars(cantidad: number): number[] {
    return Array(cantidad).fill(0);
  }

 ocultarResena(resena: ResenaModel) {
  this.resenaService.moderar(resena.id, {
    oculto: true,
    administradorId: this.usuarioLogueadoId,
  }).subscribe(() => {
    resena.oculto = true;
  });
}

mostrarResena(resena: ResenaModel) {
  this.resenaService.moderar(resena.id, {
    oculto: false,
    administradorId: this.usuarioLogueadoId,
  }).subscribe(() => {
    resena.oculto = false;
  });
}


moderarResena(resena: ResenaModel) {
  const dialogRef = this.dialog.open(ResenaDiag, {
    width: '400px',
    data: { esModeracion: true, resenaId: resena.id }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.resenaService
        .moderarAdmin(resena.id, {
          estado: result.estado,
          administradorId: this.usuarioLogueadoId,
          comentario: result.motivo
        })
        .subscribe(() => {
          const nuevoEstado = result.estado ? 'ACEPTADO' : 'RECHAZADO';
          this.resenaService.cambiarEstadoReportes(resena.id, nuevoEstado).subscribe(() => {
            resena.oculto = result.estado;
            resena.activo = !result.estado;
            resena.reportes = [];
            console.log('Reseña actualizada y reportes descartados');
          });
        });
    }
  });
}
}
