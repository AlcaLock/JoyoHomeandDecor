import { Component } from '@angular/core';
import { ResenaModel } from '../../share/models/ResenaModel';
import { ResenaService } from '../../share/services/resena.service';
import { NotificationService } from '../../share/notification-service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-resena-detail',
  standalone: false,
  templateUrl: './resena-detail.html',
  styleUrl: './resena-detail.css'
})
export class ResenaDetail {
    review: any; // Cambiar el nombre de la variable para que sea más descriptivo
  destroy$: Subject<boolean> = new Subject<boolean>();
currentLang: string = 'es';
  constructor(
    private resenaService: ResenaService, // Cambiar el nombre del servicio
    private router: Router,
    private activeRoute: ActivatedRoute,
    private translate: TranslateService
  ) {
 this.translate.onLangChange.subscribe(lang => {
    this.currentLang = lang.lang;
  });

    let id = this.activeRoute.snapshot.paramMap.get('id');
    if (!isNaN(Number(id))) this.obtenerResena(Number(id));
  }

  obtenerResena(id: number) {
    this.resenaService
      .getById(id)
      .pipe(takeUntil(this.destroy$)) // Operador de RxJS para desuscribirse automáticamente
      .subscribe((data: any) => {
        console.log(data);
        this.review = data; // Cambiar el nombre de la variable
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

    ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

}
