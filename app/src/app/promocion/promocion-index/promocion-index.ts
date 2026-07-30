import { Component } from '@angular/core';
import { NotificationService } from '../../share/notification-service';
import { Router } from '@angular/router';
import { PromocionModel } from '../../share/models/PromocionModel'; 
import { PromocionService } from '../../share/services/promocion.service';


@Component({
  selector: 'app-promocion-index',
  standalone: false,
  templateUrl: './promocion-index.html',
  styleUrl: './promocion-index.css'
})
export class PromocionIndex {
  // Respuesta del API
  datos: PromocionModel[] = []; 

  constructor(
    private promocionService: PromocionService, 
    private noti: NotificationService,
    private router: Router
  ) {
    this.listPromociones();
  }

  // Listar todas las promociones del API
  listPromociones() {
    // localhost:3000/promocion
    this.promocionService.get().subscribe((respuesta: PromocionModel[]) => {
      console.log(respuesta);
      this.datos = respuesta;
    });
  }

  // Método para navegar al detalle de una promoción
  detallePromocion(id: number) {
    this.router.navigate(['/promocion', id]);
  }
}