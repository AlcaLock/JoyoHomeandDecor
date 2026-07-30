import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-resena-diag',
  standalone: false,
  templateUrl: './resena-diag.html',
  styleUrl: './resena-diag.css'
})
export class ResenaDiag {
  motivo: string = '';
  estado: boolean = true;
  esModeracion: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ResenaDiag>,
    @Inject(MAT_DIALOG_DATA)
    public data: { resenaId: number; esModeracion?: boolean }
  ) {
    this.esModeracion = !!data.esModeracion;
  }

  enviar() {
    if (!this.motivo.trim()) return;

    if (this.esModeracion) {
      this.dialogRef.close({
        estado: this.estado,
        comentario: this.motivo,
      });
    } else { 
      this.dialogRef.close(this.motivo);  
    }
  }

  cancelar() {
    this.dialogRef.close(null);
  }
  
}
