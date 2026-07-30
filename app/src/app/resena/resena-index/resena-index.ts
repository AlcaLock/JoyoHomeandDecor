import { Component } from '@angular/core';
import { NotificationService } from '../../share/notification-service';
import { Router } from '@angular/router';
import { ResenaModel } from '../../share/models/ResenaModel'; // Importar el modelo de Resena
import { ResenaService } from '../../share/services/resena.service'; // Importar el servicio de Resena
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-resena-index',
  standalone: false,
  templateUrl: './resena-index.html',
  styleUrl: './resena-index.css'
})
export class ResenaIndex {
  // Respuesta del API
  datos: ResenaModel[] = []; // Cambiar el tipo de datos a ResenaModel[]
  currentLang: string = 'es';
  constructor(
    private resenaService: ResenaService, // Cambiar el servicio a ResenaService
    private noti: NotificationService,
    private router: Router,
    private translate: TranslateService
  ) {

this.translate.onLangChange.subscribe(lang => {
    this.currentLang = lang.lang;
  });

    this.listResenas();
  }

  // Listar todas las reseñas del API
  listResenas() {
    // localhost:3000/reseña
    this.resenaService.get().subscribe((respuesta: ResenaModel[]) => {
      console.log(respuesta);
      this.datos = respuesta;
    });
  }
  getStars(rating: number): boolean[] {
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(i < rating);
  }
  return stars;
}
  // Método para navegar al detalle de una reseña
  detalleReview(id: number) {
    this.router.navigate(['/resena', id]);
  }
}